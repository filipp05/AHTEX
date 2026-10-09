import { createServer } from 'node:http'
import { createHash, randomUUID } from 'node:crypto'

const limits = { 'Контактное лицо': 120, 'Предприятие': 160, phone: 40, email: 160, 'Регион': 120, 'Тип обращения': 100, 'Комментарий': 3000, 'Состав заявки': 18000, 'Согласие': 10, company_website: 200, _subject: 200 }
const emailPattern = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/
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

// One API process behind nginx. No request body, email or IP is written to logs/disk.
export function createApp({ mailer = null, origin, trustProxy = false, rateLimit = 5, now = Date.now } = {}) {
  const rates = new Map()
  const sent = new Map()
  function reply(res, code, value) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)) }
  const server = createServer(async (req, res) => {
    if (req.url === '/health' && req.method === 'GET') return reply(res, mailer ? 200 : 503, { ready: Boolean(mailer) })
    if (req.url !== '/api/request') return reply(res, 404, { error: 'Not found' })
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return reply(res, 405, { error: 'Method not allowed' }) }
    if (!origin || req.headers.origin !== origin) return reply(res, 403, { error: 'Origin rejected' })
    if (!req.headers['content-type']?.startsWith('application/json')) return reply(res, 415, { error: 'JSON required' })
    if (!mailer) return reply(res, 503, { error: 'Mail is not configured' })
    const time = now()
    for (const [key, entry] of rates) if (entry.until <= time) rates.delete(key)
    for (const [key, entry] of sent) if (!entry.pending && entry.until <= time) sent.delete(key)
    const ip = trustProxy ? req.headers['x-real-ip'] || req.socket.remoteAddress : req.socket.remoteAddress
    const rateKey = createHash('sha256').update(String(ip)).digest('hex')
    const rate = rates.get(rateKey) || { count: 0, until: time + 600000 }
    if (rate.count >= rateLimit || rates.size >= 10000 && !rates.has(rateKey)) { res.setHeader('Retry-After', '600'); return reply(res, 429, { error: 'Try later' }) }
    rate.count++; rates.set(rateKey, rate)
    let bytes = 0
    const chunks = []
    try {
      for await (const chunk of req) {
        bytes += chunk.length
        if (bytes > 65536) { reply(res, 413, { error: 'Request too large' }); return }
        chunks.push(chunk)
      }
      const data = validateRequest(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      if (data.company_website) return reply(res, 200, { ok: true })
      const text = Object.keys(limits).filter(key => !['company_website', '_subject'].includes(key)).map(key => `${key}: ${data[key]?.trim() || '—'}`).join('\n\n')
      const hash = createHash('sha256').update(text).digest('hex')
      const previous = sent.get(hash)
      if (previous) return reply(res, previous.pending ? 409 : 200, previous.pending ? { error: 'Sending in progress' } : { ok: true, id: previous.id })
      if (sent.size >= 10000) return reply(res, 503, { error: 'Try later' })
      const id = randomUUID()
      sent.set(hash, { id, pending: true, until: time + 600000 })
      try {
        const result = await mailer.transport.sendMail({
          from: { name: 'АнТех Восток · сайт', address: mailer.from }, to: mailer.to,
          replyTo: data.email || undefined, subject: 'Новая заявка с сайта «АнТех Восток»',
          text: `Номер заявки: ${id}\nВремя: ${new Date(time).toISOString()}\n\n${text}`,
          disableFileAccess: true, disableUrlAccess: true,
        })
        if (!result.accepted?.length || result.rejected?.length) throw new Error('Not accepted')
        sent.set(hash, { id, pending: false, until: now() + 600000 })
        return reply(res, 200, { ok: true, id })
      } catch {
        sent.delete(hash)
        return reply(res, 502, { error: 'Delivery not confirmed' })
      }
    } catch { return reply(res, 400, { error: 'Invalid request' }) }
  })
  server.requestTimeout = 15000
  server.headersTimeout = 10000
  return server
}
