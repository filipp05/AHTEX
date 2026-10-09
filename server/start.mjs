import { createApp } from './app.mjs'
import { createMailer } from './mail.mjs'
const origin = process.env.SITE_ORIGIN
if (!origin || new URL(origin).origin !== origin) throw new Error('Set SITE_ORIGIN to the exact site origin')
const mailer = createMailer()
const server = createApp({ mailer, origin, trustProxy: process.env.TRUST_PROXY === '1' })
server.listen(Number(process.env.API_PORT || 3101), process.env.API_HOST || '127.0.0.1', () => {
  console.log(mailer ? 'Request API ready' : 'Request API started; SMTP configuration missing (503)')
})
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
