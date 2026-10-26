import { createServer } from 'node:http'
import { createHash, randomUUID } from 'node:crypto'

const limits = { 'Контактное лицо': 120, 'Предприятие': 160, phone: 40, email: 160, 'Регион': 120, 'Тип обращения': 100, 'Комментарий': 3000, 'Состав заявки': 18000, 'Согласие': 10, company_website: 200, _subject: 200 }
const emailPattern = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/
const MAX_FILES = 5
const MAX_FILE_BYTES = 15 * 1024 * 1024
const JSON_BODY_BYTES = 65536
const MULTIPART_BODY_BYTES = MAX_FILE_BYTES + 1024 * 1024
const fileTypes = {
  pdf: { type: 'application/pdf', signature: b => b.subarray(0, 5).toString() === '%PDF-' },
  jpg: { type: 'image/jpeg', signature: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  jpeg: { type: 'image/jpeg', signature: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  png: { type: 'image/png', signature: b => b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) },
  docx: { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  xlsx: { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  dwg: { type: 'application/acad' }, dxf: { type: 'application/dxf' },
  step: { type: 'application/step' }, stp: { type: 'application/step' },
}

export function validateRequest(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid body')
  for (const [key, value] of Object.entries(data)) {
    if (!Object.hasOwn(limits, key) || typeof value !== 'string' || value.length > limits[key] || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) throw new Error('Invalid field')
  }
  if (!data['Контактное лицо']?.trim() || data['Согласие'] !== 'Да') throw new Error('Name and consent required')
  if (!data.phone?.trim() && !data.email?.trim()) throw new Error('Contact required')
  if (data.email && !emailPattern.test(data.email)) throw new Error('Invalid email')
  if (data.phone && !/^[+\d ()-]{5,40}$/.test(data.phone)) throw new Error('Invalid phone')
  return data
}

function safeFilename(value) {
  const leaf = String(value || 'file').split(/[\\/]/).pop() || 'file'
  return leaf.normalize('NFKC').replace(/[\r\n\x00-\x1f]/g, '').replace(/[^\p{L}\p{N}_.() -]/gu, '_').slice(0, 120) || 'file'
}

async function parseMultipart(body, contentType) {
  const form = await new Response(body, { headers: { 'content-type': contentType } }).formData()
  const data = {}
  const attachments = []
  let total = 0
  for (const [key, value] of form.entries()) {
    if (key === 'attachments') {
      if (typeof value === 'string' || attachments.length >= MAX_FILES || value.size <= 0) throw new Error('Invalid attachment')
      total += value.size
      if (total > MAX_FILE_BYTES) throw Object.assign(new Error('Request too large'), { status: 413 })
      const filename = safeFilename(value.name)
      const ext = filename.split('.').pop()?.toLowerCase()
      const fileType = fileTypes[ext]
      if (!fileType) throw new Error('Unsupported attachment type')
      const content = Buffer.from(await value.arrayBuffer())
      if (fileType.signature && !fileType.signature(content)) throw new Error('Invalid attachment content')
      attachments.push({ filename, content, contentType: fileType.type })
      continue
    }
    if (typeof value !== 'string' || Object.hasOwn(data, key)) throw new Error('Invalid field')
    data[key] = value
  }
  return { data, attachments }
}

async function readBody(req, limit) {
  const chunks = []
  let bytes = 0
  for await (const chunk of req) {
    bytes += chunk.length
    if (bytes > limit) throw Object.assign(new Error('Request too large'), { status: 413 })
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

// One API process behind nginx. No request body, email, attachment or IP is written to logs/disk.
export function createApp({ mailer = null, origin, trustProxy = false, rateLimit = 5, now = Date.now, adminHandler = null } = {}) {
  const rates = new Map()
  const sent = new Map()
  function reply(res, code, value) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)) }
  const server = createServer(async (req, res) => {
    if (adminHandler && await adminHandler(req, res)) return
    if (req.url === '/health' && req.method === 'GET') return reply(res, adminHandler || mailer ? 200 : 503, { ready: Boolean(adminHandler || mailer), mail: Boolean(mailer) })
    if (req.url !== '/api/request') return reply(res, 404, { error: 'Not found' })
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(res, 405, { error: 'Method not allowed' }) }
    if (!origin || req.headers.origin !== origin) return reply(res, 403, { error: 'Origin rejected' })
    const contentType = req.headers['content-type'] || ''
    const isJson = contentType.startsWith('application/json')
    const isMultipart = contentType.startsWith('multipart/form-data;')
    if (!isJson && !isMultipart) return reply(res, 415, { error: 'JSON or multipart form required' })
    if (!mailer) return reply(res, 503, { error: 'Mail is not configured' })
    const time = now()
    for (const [key, entry] of rates) if (entry.until <= time) rates.delete(key)
    for (const [key, entry] of sent) if (!entry.pending && entry.until <= time) sent.delete(key)
    const ip = trustProxy ? req.headers['x-real-ip'] || req.socket.remoteAddress : req.socket.remoteAddress
    const rateKey = createHash('sha256').update(String(ip)).digest('hex')
    const rate = rates.get(rateKey) || { count: 0, until: time + 600000 }
    if (rate.count >= rateLimit || rates.size >= 10000 && !rates.has(rateKey)) { res.setHeader('Retry-After', '600'); return reply(res, 429, { error: 'Try later' }) }
    rate.count++; rates.set(rateKey, rate)
    try {
      const body = await readBody(req, isJson ? JSON_BODY_BYTES : MULTIPART_BODY_BYTES)
      const parsed = isJson ? { data: JSON.parse(body.toString('utf8')), attachments: [] } : await parseMultipart(body, contentType)
      const data = validateRequest(parsed.data)
      const attachments = parsed.attachments
      if (data.company_website) return reply(res, 200, { ok: true })
      const text = Object.keys(limits).filter(key => !['company_website', '_subject'].includes(key)).map(key => `${key}: ${data[key]?.trim() || '—'}`).join('\n\n')
      const hash = createHash('sha256').update(text)
      for (const file of attachments) hash.update(file.filename).update(file.content)
      const digest = hash.digest('hex')
      const previous = sent.get(digest)
      if (previous) return reply(res, previous.pending ? 409 : 200, previous.pending ? { error: 'Sending in progress' } : { ok: true, id: previous.id })
      if (sent.size >= 10000) return reply(res, 503, { error: 'Try later' })
      const id = randomUUID()
      sent.set(digest, { id, pending: true, until: time + 600000 })
      try {
        const result = await mailer.transport.sendMail({
          from: { name: 'АнТех Восток · сайт', address: mailer.from }, to: mailer.to,
          replyTo: data.email || undefined, subject: 'Новая заявка с сайта «АнТех Восток»',
          text: `Номер заявки: ${id}\nВремя: ${new Date(time).toISOString()}\n\n${text}${attachments.length ? `\n\nФайлы: ${attachments.map(file => file.filename).join(', ')}` : ''}`,
          attachments: attachments.map(file => ({ filename: file.filename, content: file.content, contentType: file.contentType })),
          disableFileAccess: true, disableUrlAccess: true,
        })
        if (!result.accepted?.length || result.rejected?.length) throw new Error('Not accepted')
        sent.set(digest, { id, pending: false, until: now() + 600000 })
        return reply(res, 200, { ok: true, id })
      } catch {
        sent.delete(digest)
        return reply(res, 502, { error: 'Delivery not confirmed' })
      }
    } catch (error) { return reply(res, error?.status === 413 ? 413 : 400, { error: error?.status === 413 ? 'Request too large' : 'Invalid request' }) }
  })
  server.requestTimeout = 30000
  server.headersTimeout = 10000
  return server
}
