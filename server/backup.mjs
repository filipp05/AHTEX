import { mkdir, readFile, writeFile, copyFile, rename, readdir, rm } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID, createHash } from 'node:crypto'
const hash=b=>createHash('sha256').update(b).digest('hex')
export async function backupStore(store,destination){
 const dest=resolve(destination)
 if(dest===store.dir||dest.startsWith(store.dir+'/'))throw new Error('Backup location must be outside DATA_DIR')
 await mkdir(dest,{recursive:true,mode:0o700})
 const name=`anteh-${new Date().toISOString().replaceAll(':','-')}-${randomUUID().slice(0,8)}`
 const stage=join(dest,`.${name}`),final=join(dest,name)
 const release=await store.lock()
 try {
  const state=await store.read();await mkdir(join(stage,'uploads'),{recursive:true,mode:0o700})
  const raw=Buffer.from(JSON.stringify({...state,sessions:[]},null,2)),manifest={'state.json':hash(raw)}
  await writeFile(join(stage,'state.json'),raw,{mode:0o600})
  for(const m of state.media){const b=await readFile(join(store.dir,'uploads',m.file));await writeFile(join(stage,'uploads',m.file),b,{mode:0o600});manifest[`uploads/${m.file}`]=hash(b)}
  await writeFile(join(stage,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600});await rename(stage,final)
 }catch(e){await rm(stage,{recursive:true,force:true});throw e}finally{await release()}
 const old=(await readdir(dest)).filter(x=>x.startsWith('anteh-')).sort()
 for(const name of old.slice(0,-14))await rm(join(dest,name),{recursive:true,force:true})
 return final
}
export async function restoreStore(store,source){
 const manifest=JSON.parse(await readFile(join(source,'manifest.json'),'utf8'))
 for(const [name,checksum]of Object.entries(manifest)){
  if(name!=='state.json'&&!/^uploads\/[a-f0-9-]+\.(webp|pdf)$/.test(name))throw new Error('Invalid backup path')
  if(hash(await readFile(join(source,name)))!==checksum)throw new Error('Backup checksum mismatch')
 }
 const saved=JSON.parse(await readFile(join(source,'state.json'),'utf8'))
 if(!manifest['state.json']||saved.schema!==1||!['items','users','sessions','media'].every(k=>Array.isArray(saved[k])))throw new Error('Invalid backup')
 for(const m of saved.media)if(!/^[a-f0-9-]+\.(webp|pdf)$/.test(m.file)||!manifest[`uploads/${m.file}`])throw new Error('Missing media')
 const release=await store.lock()
 try {
  let previous=null,revision=0
  try{previous=await readFile(store.file);try{const current=JSON.parse(previous);if(Number.isInteger(current.revision))revision=current.revision}catch{ /* Preserve damaged bytes, then recover from verified backup. */ }}catch(e){if(e.code!=='ENOENT')throw e}
  if(previous){const snapshots=join(store.dir,'snapshots');await mkdir(snapshots,{recursive:true,mode:0o700});await writeFile(join(snapshots,`${String(revision).padStart(12,'0')}-${randomUUID()}.json`),previous,{flag:'wx',mode:0o600})}
  await mkdir(join(store.dir,'uploads'),{recursive:true,mode:0o700})
  for(const m of saved.media)await copyFile(join(source,'uploads',m.file),join(store.dir,'uploads',m.file))
  await store.write({...saved,sessions:[],revision:revision+1})
 }finally{await release()}
}
