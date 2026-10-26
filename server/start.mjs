import { backupStore } from './backup.mjs'
import { JsonStore } from './store.mjs'
import { createAdminHandler } from './admin-api.mjs'
import { migrateSeed, reconcileSeed } from './catalog-service.mjs'
import { readFile } from 'node:fs/promises'
import { createApp } from './app.mjs'
import { createMailer } from './mail.mjs'
const origin = process.env.SITE_ORIGIN
if (!origin || new URL(origin).origin !== origin) throw new Error('Set SITE_ORIGIN to the exact site origin')
const store = new JsonStore(process.env.DATA_DIR || './.local/data')
const seed=migrateSeed(JSON.parse(await readFile(new URL('../content/catalog.json',import.meta.url),'utf8')))
await store.init(seed)
const current=await store.read()
if(reconcileSeed(current,seed))await store.change(state=>reconcileSeed(state,seed),{backup:true})
if(process.env.BACKUP_DIR){
 let running=false
 const backup=async()=>{if(running)return;running=true;try{await backupStore(store,process.env.BACKUP_DIR);console.log('Catalogue backup completed')}catch{console.error('Catalogue backup failed; check storage and permissions')}finally{running=false}}
 await backup();setInterval(backup,24*60*60*1000).unref()
}
const mailer = createMailer()
const server = createApp({ mailer, origin, adminHandler: createAdminHandler({store,origin,trustProxy:process.env.TRUST_PROXY === '1'}), trustProxy: process.env.TRUST_PROXY === '1' })
server.listen(Number(process.env.API_PORT || 3101), process.env.API_HOST || '127.0.0.1', () => {
  console.log(mailer ? 'Request API ready' : 'Catalogue API ready; mail delivery disabled until SMTP is configured')
})
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
