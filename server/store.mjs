import { mkdir, readFile, writeFile, rename, open, readdir, unlink, chmod } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import lockfile from 'proper-lockfile'

export class JsonStore {
  constructor(directory) { this.dir = resolve(directory); this.file = join(this.dir, 'state.json') }
  async lock() {
    await mkdir(this.dir, {recursive:true,mode:0o700})
    return lockfile.lock(this.file,{realpath:false,stale:30000,update:5000,retries:{retries:100,minTimeout:25,maxTimeout:100}})
  }
  async init(seed=[]) {
    const release=await this.lock()
    try {
      try { await this.read(); return } catch(error) { if(error.code!=='ENOENT')throw error }
      const at=new Date().toISOString()
      await this.write({schema:1,revision:0,users:[],sessions:[],media:[],items:seed.map(item=>({id:item.id,version:1,draft:item,published:item,hidden:false,changedAt:at,changedBy:'Начальное наполнение',history:[]}))})
    } finally { await release() }
  }
  async read() {
    const data=JSON.parse(await readFile(this.file,'utf8'))
    if(data.schema!==1 || !Number.isInteger(data.revision) || !['users','sessions','media','items'].every(k=>Array.isArray(data[k])))throw new Error('Invalid JSON store; restore a verified backup')
    return data
  }
  async write(data) {
    const temp=join(this.dir,`.state-${randomUUID()}.tmp`)
    const handle=await open(temp,'wx',0o600)
    try { await handle.writeFile(JSON.stringify(data,null,2)); await handle.sync() } finally { await handle.close() }
    try {
      await rename(temp,this.file)
      const directory=await open(this.dir,'r');try { await directory.sync() } finally { await directory.close() }
    } finally { await unlink(temp).catch(()=>{}) }
  }
  async change(fn,{backup=false}={}) {
    const release=await this.lock()
    try {
      const state=await this.read()
      const before=backup?JSON.stringify(state,null,2):null
      const result=await fn(state)
      if(backup) {
        const dir=join(this.dir,'snapshots');await mkdir(dir,{recursive:true,mode:0o700})
        await writeFile(join(dir,`${String(state.revision).padStart(12,'0')}-${randomUUID()}.json`),before,{flag:'wx',mode:0o600})
        const files=(await readdir(dir)).filter(x=>x.endsWith('.json')).sort()
        for(const name of files.slice(0,-30))await unlink(join(dir,name))
      }
      state.revision++;await this.write(state);await chmod(this.file,0o600)
      return result
    } finally { await release() }
  }
}
