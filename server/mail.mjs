import nodemailer from 'nodemailer'

export function createMailer(env = process.env) {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'MAIL_TO']
  if (required.some(key => typeof env[key] !== 'string' || !env[key].trim())) return null
  if (!/^[a-zA-Z0-9.-]+$/.test(env.SMTP_HOST)) throw new Error('Invalid SMTP hostname')
  const email = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/
  if (!email.test(env.MAIL_FROM) || !email.test(env.MAIL_TO)) throw new Error('Invalid server mail addresses')
  const port = Number(env.SMTP_PORT || 465)
  if (![465, 587].includes(port)) throw new Error('Use SMTP port 465 or 587')
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST, port, secure: port === 465, requireTLS: true,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000,
    logger: false, debug: false, disableFileAccess: true, disableUrlAccess: true,
  })
  return { transport, from: env.MAIL_FROM, to: env.MAIL_TO }
}
