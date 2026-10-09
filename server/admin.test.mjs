import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import { spawn } from 'node:child_process'
import sharp from 'sharp'
import { JsonStore } from './store.mjs'
import { hashPassword } from './passwords.mjs'
import { createAdminHandler } from './admin-api.mjs'
import { createApp } from './app.mjs'
import { backupStore, restoreStore } from './backup.mjs'
const content={item_type:'product',title:'Проверочный товар',description:'Описание',details:{specs:[],variants:[],length:false,application:'',documents:[]},photos:[],parameters:[],order:0}

test('JSON storage serializes independent processes; damaged data is never reset',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'anteh-store-')),store=new JsonStore(dir)
 try{
  await store.init();await store.change(s=>{s.counter=0})
  const code="import {JsonStore} from './server/store.mjs'; const s=new JsonStore(process.argv[1]); for(let i=0;i<12;i++) await s.change(v=>{v.counter++})"
  await Promise.all(Array.from({length:3},async()=>{const child=spawn(process.execPath,['--input-type=module','-e',code,dir],{stdio:'pipe'});let errors='';child.stderr.on('data',b=>errors+=b);const [status]=await once(child,'exit');assert.equal(status,0,errors)}))
  assert.equal((await store.read()).counter,36)
  assert.equal((await stat(store.file)).mode&0o777,0o600)
  await assert.rejects(store.change(s=>{s.counter=100;throw Error('abort')}));assert.equal((await store.read()).counter,36)
  await writeFile(store.file,'broken');await assert.rejects(store.init());assert.equal(await readFile(store.file,'utf8'),'broken')
 }finally{await rm(dir,{recursive:true,force:true})}
})

test('real HTTP: auth, roles, draft/publication, conflicts, files, backup and revocation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'anteh-api-')),store=new JsonStore(join(dir,'data')),origin='http://example.test'
 await store.init();const passwordHash=await hashPassword('Test-only-password-123')
 await store.change(s=>{s.users=['owner','editor'].map(role=>({id:role,login:role,name:role,role,active:true,version:1,passwordHash}))})
 const app=createApp({origin,adminHandler:createAdminHandler({store,origin})});app.listen(0,'127.0.0.1');await once(app,'listening')
 const base=`http://127.0.0.1:${app.address().port}`
 const req=async(path,{auth,body,method,headers={}}={})=>{const response=await fetch(base+path,{method:method||(body?'POST':'GET'),headers:{origin,...(auth?{cookie:auth.cookie,'x-csrf-token':auth.csrf}:{}),...(body?{'content-type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json(),response}}
 const login=async(login)=>{const r=await req('/api/admin/login',{body:{login,password:'Test-only-password-123'}});assert.equal(r.status,200);return {cookie:r.response.headers.get('set-cookie').split(';')[0],csrf:r.data.csrf}}
 try{
  assert.equal((await req('/api/admin/items')).status,401)
  assert.equal((await req('/api/admin/login',{body:{login:'owner',password:'bad'}})).status,401)
  const owner=await login('owner'),editor=await login('editor')
  assert.equal((await req('/api/admin/users',{auth:editor})).status,403)
  assert.ok(!JSON.stringify((await req('/api/admin/users',{auth:owner})).data).includes('passwordHash'))
  assert.equal((await req('/api/admin/items',{auth:owner,body:{action:'draft',content},headers:{origin:'http://evil.test'}})).status,403)
  assert.equal((await req('/api/admin/items',{auth:owner,body:{action:'draft',content},headers:{'x-csrf-token':'wrong'}})).status,403)
  let r=await req('/api/admin/items',{auth:editor,body:{action:'draft',content}});assert.equal(r.status,200);let item=r.data.item
  assert.equal((await req('/api/catalog')).data.items.length,0)
  r=await req('/api/admin/items',{auth:editor,body:{id:item.id,version:item.version,action:'publish',content:item.draft}});assert.equal(r.status,200);item=r.data.item
  assert.equal((await req('/api/catalog')).data.items[0].title,content.title)
  const concurrent=await Promise.all(['A','B'].map(title=>req('/api/admin/items',{auth:editor,body:{id:item.id,version:item.version,action:'draft',content:{...content,title}}})))
  assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,409]);item=concurrent.find(x=>x.status===200).data.item
  assert.equal((await req('/api/catalog')).data.items[0].title,content.title)
  const image=await sharp({create:{width:30,height:20,channels:3,background:'#fab51d'}}).png().toBuffer()
  const uploaded=await fetch(base+'/api/admin/media',{method:'POST',headers:{origin,cookie:owner.cookie,'x-csrf-token':owner.csrf,'content-type':'image/png','x-file-name':'test.png'},body:image})
  assert.equal(uploaded.status,201);const media=(await uploaded.json()).media
  assert.equal((await fetch(base+media.url)).status,404)
  assert.equal((await fetch(base+media.url,{headers:{cookie:owner.cookie}})).status,200)
  const pdfUpload=await fetch(base+'/api/admin/media',{method:'POST',headers:{origin,cookie:owner.cookie,'x-csrf-token':owner.csrf,'content-type':'application/pdf','x-file-name':encodeURIComponent('Чертёж.pdf')},body:'%PDF-1.7\n%%EOF'})
  assert.equal(pdfUpload.status,201);const pdf=(await pdfUpload.json()).media
  const pdfResponse=await fetch(base+pdf.url,{headers:{cookie:owner.cookie}})
  assert.equal(pdfResponse.headers.get('content-type'),'application/pdf');assert.match(pdfResponse.headers.get('content-disposition'),/^attachment;/)
  assert.equal((await fetch(base+pdf.url)).status,404)
  const invalid=await fetch(base+'/api/admin/media',{method:'POST',headers:{origin,cookie:owner.cookie,'x-csrf-token':owner.csrf,'content-type':'image/png'},body:'<svg/>'});assert.equal(invalid.status,400)
  r=await req('/api/admin/items',{auth:editor,body:{id:item.id,version:item.version,action:'publish',content:{...content,photos:[{url:media.url,alt:'Фото'}],parameters:[{id:'length',label:'Длина',type:'number',options:[],unit:'мм',hint:'',required:true,min:1,max:10}]}}});assert.equal(r.status,200);item=r.data.item
  assert.equal((await fetch(base+media.url)).status,200)
  const publicText=JSON.stringify((await req('/api/catalog')).data);for(const secret of ['passwordHash','sessions','changedBy','history'])assert.ok(!publicText.includes(secret))
  r=await req('/api/admin/items',{auth:editor,body:{id:item.id,version:item.version,action:'hide'}});item=r.data.item
  assert.equal((await req('/api/catalog')).data.items.length,0);assert.equal((await fetch(base+media.url)).status,404)
  r=await req('/api/admin/items',{auth:editor,body:{id:item.id,version:item.version,action:'show'}});item=r.data.item;assert.equal(r.status,200)
  const backup=await backupStore(store,join(dir,'backups'))
  r=await req('/api/admin/items',{auth:editor,body:{id:item.id,version:item.version,action:'copy'}});assert.equal(r.status,200);assert.equal(r.data.item.published,null)
  // Fill retained history, then restore the oldest entry (the boundary case).
  for(let i=0;i<22;i++){r=await req('/api/admin/items',{auth:editor,body:{id:item.id,version:item.version,action:'draft',content:{...content,title:`Версия ${i}`}}});assert.equal(r.status,200);item=r.data.item}
  const oldest=item.history.at(-1)
  r=await req('/api/admin/items',{auth:editor,body:{id:item.id,version:item.version,action:'restore',historyVersion:oldest.version}});assert.equal(r.status,200);assert.equal(r.data.item.draft.title,oldest.content.title)
  await restoreStore(store,backup);assert.equal((await store.read()).items.length,1);assert.equal((await req('/api/admin/me',{auth:owner})).status,401)
  assert.equal((await fetch(base+media.url)).status,200)
  await writeFile(store.file,'damaged JSON');await restoreStore(store,backup);assert.equal((await store.read()).items.length,1)
  const emptyTarget=new JsonStore(join(dir,'restored-new-server'));await restoreStore(emptyTarget,backup);assert.equal((await emptyTarget.read()).items.length,1)
  await writeFile(join(backup,'state.json'),'tampered');await assert.rejects(restoreStore(store,backup),/checksum/)
  const freshOwner=await login('owner'),freshEditor=await login('editor')
  r=await req('/api/admin/users',{auth:freshOwner,body:{id:'editor',role:'editor',active:false}});assert.equal(r.status,200)
  assert.equal((await req('/api/admin/me',{auth:freshEditor})).status,401)
  assert.equal((await req('/api/admin/users',{auth:freshOwner,body:{id:'owner',role:'editor',active:false}})).status,400)
  assert.equal((await req('/api/admin/logout',{auth:freshOwner,method:'POST'})).status,200);assert.equal((await req('/api/admin/me',{auth:freshOwner})).status,401)
 }finally{await new Promise(r=>app.close(r));await rm(dir,{recursive:true,force:true})}
})

test('account CLI generates private credentials, resets password and protects last owner',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'anteh-cli-'))
 const cli=async(...args)=>{const child=spawn(process.execPath,['scripts/admin-user.mjs',...args],{env:{...process.env,DATA_DIR:join(dir,'data'),CREDENTIAL_DIR:join(dir,'credentials'),ADMIN_PASSWORD:''},stdio:'pipe'});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',()=>{});const [code]=await once(child,'exit');return {code,output}}
 try{
  let result=await cli('create','owner','owner');assert.equal(result.code,0)
  const file=join(dir,'credentials','owner.txt'),first=await readFile(file,'utf8'),store=new JsonStore(join(dir,'data'))
  const password=first.match(/Пароль: (.+)/)[1];assert.ok(!result.output.includes(password));assert.equal((await stat(file)).mode&0o777,0o600)
  const originalHash=(await store.read()).users[0].passwordHash
  result=await cli('reset','owner');assert.equal(result.code,0);assert.notEqual((await store.read()).users[0].passwordHash,originalHash)
  assert.notEqual(await readFile(file,'utf8'),first)
  assert.notEqual((await cli('disable','owner')).code,0)
  assert.equal((await cli('create','staff','editor')).code,0);assert.equal((await cli('disable','staff')).code,0)
  assert.equal((await store.read()).users.find(u=>u.login==='staff').active,false)
 }finally{await rm(dir,{recursive:true,force:true})}
})
