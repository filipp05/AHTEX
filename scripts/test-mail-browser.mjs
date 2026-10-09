import { spawnSync, spawn } from 'node:child_process'
import { once } from 'node:events'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { SMTPServer } from 'smtp-server'
import nodemailer from 'nodemailer'
import { createApp } from '../server/app.mjs'
const build = env => {
 const r=spawnSync('npm',['run','build'],{stdio:'inherit',env})
 if(r.status!==0)throw new Error('Build failed')
}
let browser, api, smtp, staticServer
try {
 build({...process.env,NEXT_PUBLIC_FORM_ENDPOINT:'/api/request'})
 const messages=[]
 let fail=true
 smtp=new SMTPServer({authOptional:true,disabledCommands:['STARTTLS'],onData(stream,session,done){
  let text='';stream.on('data',b=>text+=b);stream.on('end',()=>{
   if(fail)return done(Object.assign(new Error('Test failure'),{responseCode:550}))
   messages.push({text,envelope:session.envelope});done()
  })
 }})
 await new Promise(r=>smtp.listen(0,'127.0.0.1',r))
 const origin='http://127.0.0.1:3210'
 const transport=nodemailer.createTransport({host:'127.0.0.1',port:smtp.server.address().port,secure:false,ignoreTLS:true})
 api=createApp({origin,mailer:{transport,from:'office@example.test',to:'office@example.test'}})
 api.listen(0,'127.0.0.1');await once(api,'listening')
 staticServer=spawn('python3',['-m','http.server','3210','--bind','127.0.0.1','--directory','out'],{stdio:'ignore'})
 for(let i=0;i<40;i++){try{if((await fetch(origin)).ok)break}catch{}await new Promise(r=>setTimeout(r,100))}
 browser=await chromium.launch()
 const page=await browser.newPage()
 // Local reverse-proxy fixture: browser request goes through the real API to SMTP.
 await page.route('**/api/request',async route=>{
  const response=await route.fetch({url:`http://127.0.0.1:${api.address().port}/api/request`,headers:{...route.request().headers(),origin}})
  await route.fulfill({response})
 })
 await page.goto(origin+'/catalog/')
 await page.locator('.catalog-card').first().getByLabel('Исполнение').selectOption('ТФА45')
 await page.locator('.catalog-card').first().getByLabel('Длина, мм').fill('1800')
 await page.locator('.catalog-card').first().getByRole('button').click()
 await page.getByLabel('Количество или объём').fill('500 шт.')
 await page.getByLabel('Контактное лицо').fill('Проверка SMTP')
 await page.getByLabel('Электронная почта',{exact:true}).fill('visitor@example.test')
 await page.getByRole('checkbox').check()
 await page.getByRole('button',{name:'Отправить заявку',exact:true}).click()
 await page.locator('.form-status .error').waitFor()
 assert.equal(await page.getByLabel('Контактное лицо').inputValue(),'Проверка SMTP')
 assert.equal(await page.locator('.selected-row').count(),1)
 fail=false
 await page.getByRole('button',{name:'Отправить заявку',exact:true}).click()
 await page.locator('.form-status .success').waitFor()
 assert.equal(messages.length,1)
 assert.equal(messages[0].envelope.rcptTo[0].address,'office@example.test')
 const decoded=Buffer.from(messages[0].text.split('\r\n\r\n')[1],'base64').toString('utf8')
 for(const expected of ['Проверка SMTP','ТФА45','1800','500 шт.','visitor@example.test'])assert.ok(decoded.includes(expected))
 assert.equal(await page.locator('.selected-row').count(),0)
 assert.equal(await page.getByLabel('Контактное лицо').inputValue(),'')
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('anteh-contact-draft')),null)
 await page.locator('.request-form').screenshot({path:'qa/smtp-success.png',animations:'disabled',style:'.site-header { visibility: hidden }'})
 console.log('PASS: browser → HTTP API → SMTP, failure retains draft, success delivers configuration and clears draft')
} finally {
 await browser?.close()
 if(api)await new Promise(r=>api.close(r))
 if(smtp)await new Promise(r=>smtp.close(r))
 staticServer?.kill()
 build(process.env)
}
