import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { checkPassword, digest, newToken, publicUser } from './passwords.mjs'
import { ApiError, fail, editItem, publishedItems } from './catalog-service.mjs'

const cookieName='anteh_session'
const lifetime=7*24*60*60*1000
function tokenFrom(req){return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(cookieName+'='))?.slice(cookieName.length+1)||''}
function identity(state,req){
 const hash=digest(tokenFrom(req));const session=state.sessions.find(s=>s.hash===hash&&s.expires>Date.now())
 const user=session&&state.users.find(u=>u.id===session.userId&&u.active&&u.version===session.userVersion)
 return user?{user,session}:null
}
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data))}
async function readBody(req,limit=100000){const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)fail(413,'Файл или запрос слишком большой');chunks.push(chunk)}return Buffer.concat(chunks)}
async function json(req){if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'Ожидается JSON');try{return JSON.parse((await readBody(req)).toString())}catch(e){if(e instanceof ApiError)throw e;fail(400,'Некорректный запрос')}}

export function createAdminHandler({store,origin,trustProxy=false}) {
 const rates=new Map();let passwordJobs=0,mediaJobs=0
 const cookie=(value,age)=>`${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${age}${origin.startsWith('https:')?'; Secure':''}`
 function throttle(key,max,window=600000){
  const now=Date.now();for(const [k,v]of rates)if(v.until<=now)rates.delete(k)
  const r=rates.get(key)||{n:0,until:now+window}
  if(r.n>=max||rates.size>=10000&&!rates.has(key))fail(429,'Слишком много попыток. Подождите 10 минут.')
  r.n++;rates.set(key,r)
 }
 return async function handle(req,res) {
  const path=new URL(req.url,'http://localhost').pathname
  if(!path.startsWith('/api/admin/')&&path!=='/api/catalog'&&!path.startsWith('/media/'))return false
  try {
   if(path==='/api/catalog'&&req.method==='GET'){send(res,200,{items:publishedItems(await store.read())});return true}
   if(path.startsWith('/media/')&&req.method==='GET'){
    const state=await store.read();const media=state.media.find(m=>m.url===path)
    if(!media)fail(404,'Файл не найден')
    const published=publishedItems(state).some(i=>i.photos?.some(p=>p.url===path)||i.details.documents.some(d=>d.url===path))
    if(!published&&!identity(state,req))fail(404,'Файл не найден')
    const buffer=await readFile(join(store.dir,'uploads',media.file))
    res.writeHead(200,{'Content-Type':media.mime,'Content-Length':buffer.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",...(media.mime==='application/pdf'?{'Content-Disposition':`attachment; filename="document.pdf"; filename*=UTF-8''${encodeURIComponent(media.name)}`}:{})});res.end(buffer);return true
   }
   if(!['GET','POST'].includes(req.method))fail(405,'Метод не поддерживается')
   const mutating=req.method==='POST'
   if(mutating&&req.headers.origin!==origin)fail(403,'Недопустимый источник запроса')
   const ip=String(trustProxy?req.headers['x-real-ip']||req.socket.remoteAddress:req.socket.remoteAddress)
   if(path==='/api/admin/login'&&mutating){
    const body=await json(req);const login=typeof body.login==='string'?body.login.toLowerCase().trim():''
    if(login.length>80||typeof body.password!=='string'||body.password.length>128)fail(400,'Проверьте логин и пароль')
    throttle('ip:'+digest(ip),20);throttle('login:'+digest(login),10)
    if(passwordJobs>=2)fail(429,'Подождите несколько секунд и повторите вход')
    const state=await store.read();const user=state.users.find(u=>u.login===login)
    let valid=false;passwordJobs++
    try {valid=await checkPassword(body.password,user?.passwordHash)}finally{passwordJobs--}
    if(!valid||!user?.active)fail(401,'Неверный логин или пароль')
    const token=newToken(),csrf=newToken()
    const info=await store.change(s=>{
      const current=s.users.find(u=>u.id===user.id&&u.active&&u.version===user.version)
      if(!current)fail(401,'Повторите вход')
      s.sessions=s.sessions.filter(x=>x.expires>Date.now())
      const existing=s.sessions.filter(x=>x.userId===user.id).sort((a,b)=>a.expires-b.expires)
      if(existing.length>=10)s.sessions=s.sessions.filter(x=>x.hash!==existing[0].hash)
      s.sessions.push({hash:digest(token),csrf,userId:user.id,userVersion:user.version,expires:Date.now()+lifetime})
      return {user:publicUser(current),csrf}
    })
    res.setHeader('Set-Cookie',cookie(token,lifetime/1000));send(res,200,info);return true
   }
   const state=await store.read();const auth=identity(state,req)
   if(!auth)fail(401,'Войдите в аккаунт сотрудника')
   if(mutating&&req.headers['x-csrf-token']!==auth.session.csrf)fail(403,'Обновите страницу и повторите действие')
   if(mutating)throttle('write:'+auth.user.id,120)
   if(path==='/api/admin/me'&&req.method==='GET'){send(res,200,{user:publicUser(auth.user),csrf:auth.session.csrf});return true}
   if(path==='/api/admin/logout'&&mutating){await store.change(s=>{s.sessions=s.sessions.filter(x=>x.hash!==auth.session.hash)});res.setHeader('Set-Cookie',cookie('',0));send(res,200,{ok:true});return true}
   if(path==='/api/admin/items'&&req.method==='GET'){send(res,200,{items:state.items});return true}
   if(path==='/api/admin/items'&&mutating){
    const body=await json(req)
    const item=await store.change(s=>{const fresh=identity(s,req);if(!fresh)fail(401,'Доступ отозван');return editItem(s,body,fresh.user)},{backup:true})
    send(res,200,{item});return true
   }
   if(path==='/api/admin/users'&&req.method==='GET'){
    if(auth.user.role!=='owner')fail(403,'Раздел доступен владельцу')
    send(res,200,{users:state.users.map(publicUser)});return true
   }
   if(path==='/api/admin/users'&&mutating){
    const body=await json(req)
    const users=await store.change(s=>{
      const fresh=identity(s,req);if(fresh?.user.role!=='owner')fail(403,'Раздел доступен владельцу')
      const target=s.users.find(u=>u.id===body.id);if(!target)fail(404,'Сотрудник не найден')
      if(typeof body.active!=='boolean'||!['owner','editor'].includes(body.role))fail(400,'Проверьте права')
      if(target.id===fresh.user.id)fail(400,'Собственные права меняет другой владелец')
      if(target.role==='owner'&&target.active&&(!body.active||body.role!=='owner')&&s.users.filter(u=>u.active&&u.role==='owner').length<=1)fail(400,'Нельзя отключить последнего владельца')
      target.active=body.active;target.role=body.role;target.version++;s.sessions=s.sessions.filter(x=>x.userId!==target.id)
      return s.users.map(publicUser)
    },{backup:true});send(res,200,{users});return true
   }
   if(path==='/api/admin/media'&&mutating){
    if(mediaJobs>=2)fail(429,'Загружаются другие файлы. Подождите немного.')
    mediaJobs++
    try {
    const mime=req.headers['content-type'];if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(mime))fail(415,'Поддерживаются JPEG, PNG, WebP и PDF')
    if(state.media.length>=1000||state.media.reduce((sum,m)=>sum+m.size,0)>1024*1024*1024)fail(400,'Хранилище заполнено. Обратитесь к администратору')
    const input=await readBody(req,10*1024*1024);let buffer,ext,type
    let name;try{name=decodeURIComponent(String(req.headers['x-file-name']||'Файл'))}catch{fail(400,'Некорректное имя файла')}
    name=name.replace(/[\x00-\x1f\x7f/\\]/g,'').slice(0,160)||'Файл'
    if(mime==='application/pdf'){
      if(!input.subarray(0,5).equals(Buffer.from('%PDF-'))||!input.subarray(-1024).toString('latin1').includes('%%EOF'))fail(400,'Файл не похож на PDF')
      buffer=input;ext='pdf';type=mime
    }else{
      try {const img=sharp(input,{limitInputPixels:40000000});const meta=await img.metadata();if(!['jpeg','png','webp'].includes(meta.format)||meta.pages>1)fail(400,'Выберите обычное изображение');buffer=await img.rotate().resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer()}catch{fail(400,'Не удалось обработать фото. Выберите JPEG, PNG или WebP до 10 МБ')}
      ext='webp';type='image/webp'
    }
    const file=`${randomUUID()}.${ext}`,url=`/media/${file}`
    const dir=join(store.dir,'uploads');await mkdir(dir,{recursive:true,mode:0o700});await writeFile(join(dir,file),buffer,{flag:'wx',mode:0o600})
    const media={file,url,mime:type,name,size:buffer.length,createdAt:new Date().toISOString()}
    try{await store.change(s=>{if(!identity(s,req))fail(401,'Доступ отозван');if(s.media.length>=1000||s.media.reduce((sum,m)=>sum+m.size,0)+media.size>1024*1024*1024)fail(400,'Хранилище заполнено');s.media.push(media)},{backup:true})}catch(e){await unlink(join(dir,file));throw e}
    send(res,201,{media});return true
    } finally {mediaJobs--}
   }
   fail(404,'Не найдено')
  } catch(error){send(res,error instanceof ApiError?error.status:503,{error:error instanceof ApiError?error.message:'Сервис временно недоступен. Данные не подтверждены как сохранённые.'});return true}
 }
}
