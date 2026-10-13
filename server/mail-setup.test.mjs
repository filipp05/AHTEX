import test from 'node:test'
import assert from 'node:assert/strict'
import { SMTPServer } from 'smtp-server'
import nodemailer from 'nodemailer'
import { checkMailSetup, safeMailError } from './mail-setup.mjs'
const env={SMTP_HOST:'smtp.example.test',SMTP_USER:'test-only',SMTP_PASS:'test-secret-never-printed',MAIL_FROM:'site@example.test',MAIL_TO:'site@example.test'}
test('missing/invalid settings never connect or expose values; SMTP errors are sanitized',async()=>{
 let connected=false
 const missing=await checkMailSetup({env:{SMTP_PASS:env.SMTP_PASS},factory:()=>{connected=true}})
 assert.equal(missing.ok,false);assert.equal(connected,false);assert.ok(!missing.message.includes(env.SMTP_PASS));assert.ok(missing.message.includes('SMTP_HOST'))
 assert.equal((await checkMailSetup({env:{...env,SMTP_PORT:'25'}})).ok,false)
 assert.equal((await checkMailSetup({env:{...env,SMTP_HOST:'https://smtp.example.test'}})).ok,false)
 for(const code of ['EAUTH','ESOCKET','ETIMEDOUT','EENVELOPE','UNKNOWN']){
  const result=await checkMailSetup({env,factory:()=>({transport:{verify:async()=>{throw Object.assign(new Error(env.SMTP_PASS),{code})},close(){}}})})
  assert.equal(result.ok,false);assert.ok(!result.message.includes(env.SMTP_PASS));assert.equal(result.message,safeMailError({code}))
 }
})
test('diagnostic verifies real local SMTP without sending; explicit test sends exactly one synthetic email',async t=>{
 const messages=[]
 const smtp=new SMTPServer({authOptional:true,disabledCommands:['STARTTLS'],onData(stream,session,done){let raw='';stream.on('data',b=>raw+=b);stream.on('end',()=>{messages.push({raw,envelope:session.envelope});done()})}})
 await new Promise(r=>smtp.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>smtp.close(r)))
 const factory=()=>({from:env.MAIL_FROM,to:env.MAIL_TO,transport:nodemailer.createTransport({host:'127.0.0.1',port:smtp.server.address().port,ignoreTLS:true})})
 assert.equal((await checkMailSetup({env,factory})).ok,true);assert.equal(messages.length,0)
 assert.equal((await checkMailSetup({env,factory,send:true})).ok,true);assert.equal(messages.length,1)
 assert.equal(messages[0].envelope.rcptTo[0].address,env.MAIL_TO)
 assert.equal(messages[0].envelope.mailFrom.address,env.MAIL_FROM)
})
