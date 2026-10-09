import { mkdir, readFile, writeFile, chmod } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { randomUUID, randomBytes } from 'node:crypto'
import { JsonStore } from '../server/store.mjs'
import { hashPassword, publicUser } from '../server/passwords.mjs'
import { migrateSeed } from '../server/catalog-service.mjs'

const [action,loginArg,roleArg='editor']=process.argv.slice(2)
const login=(loginArg||'').toLowerCase()
if(!['create','reset','disable','list'].includes(action)||action!=='list'&&!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(login)||!['owner','editor'].includes(roleArg))throw new Error('Usage: admin:user create LOGIN owner|editor; reset LOGIN; disable LOGIN; list')
const store=new JsonStore(process.env.DATA_DIR||'./.local/data')
await store.init(migrateSeed(JSON.parse(await readFile(new URL('../content/catalog.json',import.meta.url),'utf8'))))
if(action==='list'){console.log(JSON.stringify((await store.read()).users.map(publicUser),null,2));process.exit(0)}
const password=action==='disable'?null:process.env.ADMIN_PASSWORD||randomBytes(18).toString('base64url')
const passwordHash=password?await hashPassword(password):null
const credentialDir=resolve(process.env.CREDENTIAL_DIR||'./.local/credentials')
if(password)await mkdir(credentialDir,{recursive:true,mode:0o700})
await store.change(s=>{
 let user=s.users.find(u=>u.login===login)
 if(action==='create'){
  if(user)throw new Error('Login already exists')
  user={id:randomUUID(),login,name:process.env.ADMIN_NAME||login,role:roleArg,active:true,version:1,passwordHash};s.users.push(user)
 }else{
  if(!user)throw new Error('Login not found')
  if(action==='disable'&&user.role==='owner'&&user.active&&s.users.filter(u=>u.active&&u.role==='owner').length<=1)throw new Error('Cannot disable the last owner')
  if(action==='reset'){user.passwordHash=passwordHash;user.active=true}else user.active=false
  user.version++;s.sessions=s.sessions.filter(x=>x.userId!==user.id)
 }
},{backup:true})
if(password){
 const file=join(credentialDir,`${login}.txt`)
 await writeFile(file,`Логин: ${login}\nПароль: ${password}\nВход: /admin/\n\nПосле переноса в менеджер паролей удалите этот файл.\n`,{mode:0o600})
 await chmod(file,0o600)
 console.log(`Credentials saved locally: ${file}. Password is not printed.`)
}else console.log('Access disabled; sessions revoked.')
