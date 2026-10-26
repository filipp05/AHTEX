import { test } from 'node:test'
import assert from 'node:assert/strict'
import { migrateSeed, reconcileSeed } from './catalog-service.mjs'

const productId='10000000-0000-4000-8000-000000000001'
const newServiceId='10000000-0000-4000-8000-000000000008'
const base={id:productId,item_type:'product',title:'Анкер с уточнением редактора',description:'Описание',details:{specs:[],variants:['ТФА39'],length:false,application:'',documents:[]},parameters:[{id:'variant',label:'Исполнение',type:'select',options:['ТФА39'],unit:'',hint:'',required:false}],created_at:'2026-10-09T00:00:00Z',updated_at:'2026-10-09T00:00:00Z'}
const seed=migrateSeed([
 {...base,title:'Анкерная крепь',parameters:[...base.parameters,{id:'wall-thickness',label:'Толщина стенки',type:'number',options:[],unit:'мм',hint:'Укажите',required:false}]},
 {id:newServiceId,item_type:'service',title:'Консультация',description:'Описание',details:{specs:[],variants:[],length:false,application:'',documents:[]},created_at:'2026-10-26T00:00:00Z',updated_at:'2026-10-26T00:00:00Z'},
])
const record=(id,item,changedBy='Сотрудник')=>({id,version:3,draft:structuredClone(item),published:structuredClone(item),hidden:false,changedAt:'2026-10-10T00:00:00Z',changedBy,history:[]})

test('seed reconciliation adds requested fields, preserves edited product content, hides removed services and is repeatable',()=>{
 const oldProduct=record(productId,base)
 const removed=record('10000000-0000-4000-8000-000000000005',{...base,id:'10000000-0000-4000-8000-000000000005',item_type:'service'})
 const state={items:[oldProduct,removed]}
 assert.equal(reconcileSeed(state,seed),true)
 assert.equal(oldProduct.published.title,'Анкер с уточнением редактора')
 assert.ok(oldProduct.published.parameters.some(p=>p.id==='wall-thickness'))
 assert.equal(removed.hidden,true)
 assert.ok(state.items.some(item=>item.id===newServiceId))
 assert.equal(reconcileSeed(state,seed),false)
})
