import { scrypt, randomBytes, timingSafeEqual, createHash } from 'node:crypto'
import { promisify } from 'node:util'
const derive=promisify(scrypt)
const options={N:131072,r:8,p:1,maxmem:160*1024*1024}
export const digest=value=>createHash('sha256').update(value).digest('hex')
export const newToken=()=>randomBytes(32).toString('base64url')
export async function hashPassword(password) {
  if(typeof password!=='string'||password.length<12||password.length>128)throw new Error('Пароль: от 12 до 128 символов')
  const salt=randomBytes(16).toString('hex')
  const key=await derive(password,salt,64,options)
  return `scrypt:${salt}:${key.toString('hex')}`
}
export async function checkPassword(password,hash) {
  const parts=typeof hash==='string'?hash.split(':'):[]
  const salt=parts[1]||'00000000000000000000000000000000'
  const key=await derive(typeof password==='string'?password.slice(0,128):'',salt,64,options)
  const expected=Buffer.from(parts[2]||'00'.repeat(64),'hex')
  return expected.length===key.length&&timingSafeEqual(key,expected)&&parts[0]==='scrypt'
}
export const publicUser=u=>({id:u.id,login:u.login,name:u.name,role:u.role,active:u.active})
