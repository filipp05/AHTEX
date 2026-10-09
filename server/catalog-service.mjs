import { randomUUID } from 'node:crypto'
import { parseCatalog } from '../lib/catalog.ts'
export class ApiError extends Error { constructor(status,message){super(message);this.status=status} }
export const fail=(status,message)=>{throw new ApiError(status,message)}
export function migrateSeed(items) {
 return items.map((item,index)=>({...item,order:index,photos:item.photos||[],parameters:item.parameters||[
  ...(item.details?.variants?.length?[{id:'variant',label:'Исполнение',type:'select',options:item.details.variants,unit:'',hint:'',required:false}]:[]),
  ...(item.details?.length?[{id:'length',label:'Длина',type:'number',options:[],unit:'мм',hint:'600–3000 мм; другие длины — по согласованию',required:false,min:1,max:99999}]:[]),
 ]}))
}
export function contentForSave(value,id,publish,state) {
 if(!value||typeof value!=='object')fail(400,'Проверьте заполнение карточки')
 const text=(v,max)=>{if(typeof v!=='string'||v.length>max)fail(400,'Слишком длинный или неверный текст');return v.trim()}
 const title=text(value.title,160), description=text(value.description,2000)
 if(publish&&(!title||!description))fail(400,'Для публикации заполните название и описание')
 let item
 try { item=parseCatalog([{id,item_type:value.item_type,title:title||'Черновик',description:description||'Черновик',details:value.details,photos:value.photos||[],parameters:(value.parameters||[]).map(p=>({...p,options:Array.isArray(p.options)?p.options.map(v=>typeof v==='string'?v.trim():v).filter(v=>v!==''):p.options})),order:value.order??0}])[0] } catch(e){fail(400,e.message)}
 for(const url of [...item.photos.map(x=>x.url),...item.details.documents.map(x=>x.url)]) {
  if(url.startsWith('/media/')&&!state.media.some(m=>m.url===url))fail(400,'Файл отсутствует. Загрузите его заново')
 }
 return {...item,title,description}
}
export function editItem(state,{id,version,action,content,historyVersion},actor) {
 let record=id?state.items.find(i=>i.id===id):null
 if(id&&!record)fail(404,'Позиция не найдена')
 if(record&&record.version!==version)fail(409,'Позицию уже изменил другой сотрудник. Ваш текст сохранён в форме: сравните его с актуальной версией.')
 if(!['draft','publish','hide','show','copy','restore'].includes(action))fail(400,'Неизвестное действие')
 if(!record&&!['draft','publish'].includes(action))fail(400,'Сначала сохраните позицию')
 const at=new Date().toISOString()
 if(!record||action==='copy') {
  if(state.items.length>=300)fail(400,'Достигнут лимит 300 позиций вместе с архивом')
  const newId=randomUUID()
  const data=action==='copy'?{...record.draft,title:`${record.draft.title.slice(0,145)} — копия`}:content
  record={id:newId,version:0,draft:contentForSave(data,newId,action==='publish',state),published:null,hidden:false,history:[]}
  state.items.push(record)
 }
 const restored=action==='restore'?record.history.find(h=>h.version===historyVersion):null
 if(action==='restore'&&!restored)fail(404,'Версия не найдена')
 if(record.version)record.history.unshift({version:record.version,at:record.changedAt,by:record.changedBy,action:record.action||'draft',content:structuredClone(record.draft)})
 record.history=record.history.slice(0,20)
 if(action==='draft'||action==='publish')record.draft=contentForSave(content,record.id,action==='publish',state)
 if(action==='publish'){record.published=structuredClone(record.draft);record.hidden=false}
 if(action==='hide')record.hidden=true
 if(action==='show'){if(!record.published)fail(400,'Сначала опубликуйте позицию');record.hidden=false}
 if(action==='restore'){
  record.draft=structuredClone(restored.content)
 }
 record.version++;record.changedAt=at;record.changedBy=actor.name;record.action=action
 return record
}
export const publishedItems=state=>state.items.filter(i=>i.published&&!i.hidden).map(i=>({...i.published,id:i.id})).sort((a,b)=>(a.order||0)-(b.order||0))
