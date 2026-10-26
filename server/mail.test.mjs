import { test } from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { SMTPServer } from 'smtp-server'
import nodemailer from 'nodemailer'
import { createApp } from './app.mjs'
import { createMailer } from './mail.mjs'

const origin = 'http://localhost:3000'
const valid = { 'Контактное лицо': 'Тест', email: 'visitor@example.test', 'Согласие': 'Да', 'Состав заявки': 'ТФА45 · 1800 мм · 500 шт.' }
async function fixture(t, { reject = false, configured = true, rateLimit = 100 } = {}) {
  const messages = []
  const smtp = new SMTPServer({ authOptional: true, disabledCommands: ['STARTTLS'], onData(stream, session, done) {
    let raw = ''; stream.on('data', b => { raw += b }); stream.on('end', () => {
      if (reject) return done(Object.assign(new Error('Test rejection'), { responseCode: 550 }))
      messages.push({ raw, envelope: session.envelope }); done()
    })
  } })
  await new Promise(resolve => smtp.listen(0, '127.0.0.1', resolve))
  // Plain SMTP is allowed only in this in-process test fixture, never production config.
  const transport = nodemailer.createTransport({ host: '127.0.0.1', port: smtp.server.address().port, secure: false, ignoreTLS: true })
  const app = createApp({ origin, rateLimit, mailer: configured ? { transport, from: 'office@example.test', to: 'office@example.test' } : null })
  app.listen(0, '127.0.0.1'); await once(app, 'listening')
  t.after(async () => { await new Promise(r => app.close(r)); await new Promise(r => smtp.close(r)) })
  const url = `http://127.0.0.1:${app.address().port}/api/request`
  const send = (body = valid, headers = {}) => fetch(url, { method: 'POST', headers: { origin, 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) })
  return { send, messages, url }
}
test('HTTP delivers via real SMTP to fixed mailbox; visitor is Reply-To; duplicate is not resent', async t => {
 const { send, messages } = await fixture(t)
 const first = await send(); assert.equal(first.status, 200); const result = await first.json(); assert.ok(result.id)
 assert.equal(messages.length, 1)
 assert.equal(messages[0].envelope.mailFrom.address, 'office@example.test')
 assert.deepEqual(messages[0].envelope.rcptTo.map(x => x.address), ['office@example.test'])
 assert.match(messages[0].raw, /Reply-To: visitor@example.test/)
 const text = Buffer.from(messages[0].raw.split('\r\n\r\n')[1], 'base64').toString('utf8')
 assert.ok(text.includes(result.id)); assert.ok(text.includes(valid['Состав заявки']))
 assert.equal((await send()).status, 200); assert.equal(messages.length, 1)
})
test('multipart request validates and delivers technical attachments by email', async t => {
 const {messages,url}=await fixture(t)
 const form=new FormData()
 for(const [key,value] of Object.entries(valid))form.set(key,value)
 form.append('Комментарий','Прилагаю чертёж')
 form.append('attachments',new Blob(['%PDF-1.7\nexample drawing'],{type:'application/pdf'}),'drawing.pdf')
 const send=()=>fetch(url,{method:'POST',headers:{origin},body:form})
 const first=await send();assert.equal(first.status,200)
 assert.equal(messages.length,1)
 assert.match(messages[0].raw,/filename="?drawing\.pdf"?/)
 assert.match(messages[0].raw,/application\/pdf/)
 assert.ok(messages[0].raw.includes(Buffer.from('%PDF-1.7\nexample drawing').toString('base64')))
 assert.equal((await send()).status,200);assert.equal(messages.length,1)
})
test('multipart rejects unsupported formats, forged PDF content and too many files',async t=>{
 const {messages,url}=await fixture(t)
 const send=async(files)=>{const form=new FormData();for(const [key,value] of Object.entries(valid))form.set(key,value);for(const [name,content] of files)form.append('attachments',new Blob([content]),name);return fetch(url,{method:'POST',headers:{origin},body:form})}
 assert.equal((await send([['program.exe','not executable']])).status,400)
 assert.equal((await send([['drawing.pdf','not a pdf']])).status,400)
 assert.equal((await send(Array.from({length:6},(_,i)=>[`file${i}.dxf`,'0\nSECTION']))).status,400)
 assert.equal(messages.length,0)
})
test('server rejects missing consent/contact, invalid email, unknown recipient and long input', async t => {
 const { send, messages } = await fixture(t)
 for (const body of [{...valid,'Согласие':''},{...valid,email:''},{...valid,email:'x@example.test\r\nBcc: x@y.test'},{...valid,to:'attacker@example.test'},{...valid,'Комментарий':'x'.repeat(3001)}]) assert.equal((await send(body)).status,400)
 assert.equal(messages.length,0)
})
test('origin, size, method, honeypot and throttling protections', async t => {
 const { send, messages, url } = await fixture(t, { rateLimit: 3 })
 assert.equal((await send(valid,{origin:'https://other.test'})).status,403)
 assert.equal((await fetch(url)).status,405)
 assert.equal((await send({...valid,company_website:'spam'})).status,200)
 const large = await send({...valid,'Комментарий':'x'.repeat(70000)}); assert.equal(large.status,413)
 assert.equal((await send()).status,200)
 assert.equal((await send({...valid,'Контактное лицо':'Другой'})).status,429)
 assert.equal(messages.length,1)
})
test('SMTP rejection returns failure; unavailable configuration never claims success', async t => {
 const a=await fixture(t,{reject:true});assert.equal((await a.send()).status,502);assert.equal((await a.send()).status,502)
 const b=await fixture(t,{configured:false});assert.equal((await b.send()).status,503);assert.equal(b.messages.length,0)
})
test('production config refuses non-TLS port and invalid recipient; missing secrets disables mail',()=>{
 assert.equal(createMailer({}),null)
 const config={SMTP_HOST:'smtp.example.test',SMTP_USER:'test',SMTP_PASS:'test-only',MAIL_FROM:'office@example.test',MAIL_TO:'office@example.test'}
 assert.throws(()=>createMailer({...config,SMTP_PORT:'25'}))
 assert.throws(()=>createMailer({...config,MAIL_TO:'one@example.test,two@example.test'}))
 const m=createMailer(config);assert.equal(m.transport.options.secure,true);assert.equal(m.transport.options.tls.rejectUnauthorized,true)
})
