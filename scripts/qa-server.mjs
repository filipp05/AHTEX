// Isolated browser-test server: disposable data and test-only credentials.
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, extname } from 'node:path'
import { JsonStore } from '../server/store.mjs'
import { migrateSeed } from '../server/catalog-service.mjs'
import { createAdminHandler } from '../server/admin-api.mjs'
import { createApp } from '../server/app.mjs'
import { hashPassword } from '../server/passwords.mjs'
const dir=await mkdtemp(join(tmpdir(),'anteh-browser-'))
const store=new JsonStore(dir)
await store.init(migrateSeed(JSON.parse(await readFile('content/catalog.json','utf8'))))
const passwordHash=await hashPassword('Test-only-password-123')
await store.change(s=>{s.users=['owner','editor'].map(role=>({id:role,login:role,name:role==='owner'?'Владелец':'Редактор',role,active:true,version:1,passwordHash}))})
const server=createApp({origin:'http://127.0.0.1:3100',adminHandler:createAdminHandler({store,origin:'http://127.0.0.1:3100'})})
const api=server.listeners('request')[0];server.removeAllListeners('request')
const root=resolve('out'),types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf','.txt':'text/plain'}
server.on('request',async(req,res)=>{
 if(/^\/(api\/|media\/|health)/.test(req.url))return api(req,res)
 try{const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+path+(path.endsWith('/')?'index.html':''));if(!file.startsWith(root+'/'))throw Error();const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(body)}catch{res.writeHead(404);res.end('Not found')}
})
server.listen(3100,'127.0.0.1')
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await rm(dir,{recursive:true,force:true});process.exit()}))
