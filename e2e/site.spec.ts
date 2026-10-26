import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
const routes=['/','/catalog/','/production/','/documents/','/contacts/','/privacy/','/admin/','/404.html']
for (const width of [375,768,1440,1920]) {
 test(`pages, layout and accessibility at ${width}px`, async ({ page }) => {
  await page.setViewportSize({width,height:1000})
  const errors:string[]=[]
  page.on('pageerror',e=>errors.push(e.message))
  for(const route of routes){
   const response=await page.goto(route)
   expect(response?.status()).toBe(200)
   await page.locator('h1').waitFor()
   await page.evaluate(()=>document.fonts.ready)
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
   const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
   await page.screenshot({path:`qa/screenshots/${width}-${route.replaceAll('/','')||'home'}.png`,fullPage:true})
   expect(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))).toEqual([])

  }
  expect(errors).toEqual([])
 })
}
test('multiple configurations survive navigation/reload; request preparation does not send data',async({page})=>{
 const posts:string[]=[];page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())})
 await page.goto('/catalog/')
 const anchor=page.locator('.catalog-card').first()
 await expect(anchor.locator('details.product-details')).toHaveAttribute('open','')
 await expect(anchor.getByText('Толщина стенки',{exact:true})).toBeVisible()
 await anchor.getByLabel('Исполнение').selectOption('ТФА39')
 await anchor.getByLabel('Длина, мм').fill('1800')
 await anchor.getByLabel('Толщина стенки, мм').fill('2.7')
 await anchor.getByRole('button',{name:'Добавить в заявку'}).click()
 await anchor.getByLabel('Исполнение').selectOption('ТФА48')
 await anchor.getByLabel('Длина, мм').fill('2400')
 await anchor.getByLabel('Толщина стенки, мм').fill('3.0')
 await anchor.getByRole('button',{name:'Добавить в заявку'}).click()
 await page.getByRole('button',{name:/Услуги/}).click()
 await page.locator('.catalog-card').first().getByRole('button',{name:'Добавить в заявку'}).click()
 await expect(page.locator('.selected-row')).toHaveCount(3)
 await page.locator('.selected-row').first().getByLabel('Количество или объём').fill('500 шт.')
 await page.getByLabel('Контактное лицо').fill('Тестовый пользователь')
 await page.getByLabel('Электронная почта',{exact:true}).fill('test@example.com')
 await page.reload()
 await expect(page.locator('.selected-row')).toHaveCount(3)
 await expect(page.locator('.selected-row').first().getByLabel('Количество или объём')).toHaveValue('500 шт.')
 await expect(page.getByLabel('Контактное лицо')).toHaveValue('Тестовый пользователь')
 await page.getByRole('checkbox').check()
 await page.getByRole('button',{name:'Подготовить запрос'}).click()
 const text=page.getByLabel('Текст запроса')
 await expect(text).toHaveValue(/Исполнение: ТФА39 · Длина: 1800 мм · Толщина стенки: 2.7 мм — 500 шт./)
 await expect(text).toHaveValue(/Исполнение: ТФА48 · Длина: 2400 мм · Толщина стенки: 3.0 мм/)
 expect(posts).toEqual([])
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([])
 await page.locator('.selected-row').first().getByRole('button').click()
 await expect(page.locator('.selected-row')).toHaveCount(2)
 await expect(text).toHaveCount(0)
 await page.goto('/contacts/');await page.goto('/catalog/')
 await expect(page.locator('.selected-row')).toHaveCount(2)
})
test('product cards align details, configuration and action rows',async({page})=>{
 await page.goto('/catalog/')
 await expect(page.locator('.catalog-card.product')).toHaveCount(3)
 for(const width of [1440,1920]){
  await page.setViewportSize({width,height:1000})
  const rows=await page.locator('.catalog-card.product').evaluateAll(cards=>cards.map(card=>{
   const box=(selector:string)=>{const element=card.querySelector(selector);if(!element)return null;const r=element.getBoundingClientRect();return {top:r.top}}
   return {details:box('.product-details'),config:box('.card-config'),action:box('.add-button')}
  }))
  expect(rows).toHaveLength(3)
  for(const row of ['details','config','action'] as const){
   const values=rows.map(item=>item[row]?.top).filter((value):value is number=>value!==undefined)
   expect(Math.max(...values)-Math.min(...values),`${width}px ${row}: ${values.join(', ')}`).toBeLessThanOrEqual(1)
  }
 }
})
test('armocarcases request asks for free-form dimensions and keeps them in the selection',async({page})=>{
 await page.goto('/catalog/')
 const card=page.locator('.catalog-card').filter({has:page.getByRole('heading',{name:'Армокаркасы'})})
 await card.getByRole('button',{name:'Добавить в заявку'}).click()
 const dialog=page.getByRole('dialog')
 await expect(dialog).toBeVisible()
 await expect(dialog.getByLabel('Размеры *')).toBeVisible()
 await expect(dialog.locator('select')).toHaveCount(0)
 await dialog.getByLabel('Размеры *').fill('Ширина 1200 мм, высота 800 мм, длина 2400 мм')
 await dialog.getByRole('button',{name:'Добавить в заявку'}).click()
 await expect(page.locator('.selected-row').first()).toContainText('Размеры: Ширина 1200 мм, высота 800 мм, длина 2400 мм')
})
test('request form lists attachments and adds filenames to offline draft',async({page})=>{
 await page.goto('/catalog/')
 await page.locator('#request-attachments').setInputFiles({name:'drawing.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7 test drawing')})
 await expect(page.locator('.attachment-list')).toContainText('drawing.pdf')
 await page.getByLabel('Контактное лицо').fill('Проверка вложения')
 await page.getByLabel('Телефон',{exact:true}).fill('+7 000 000-00-00')
 await page.getByRole('checkbox').check()
 await page.getByRole('button',{name:'Подготовить запрос'}).click()
 await expect(page.getByLabel('Текст запроса')).toHaveValue(/Файлы \(прикрепить вручную\): drawing\.pdf/)
 await expect(page.locator('.attachment-field')).toContainText('прикрепите их вручную')
})
test('contact required and general request supported',async({page})=>{
 await page.goto('/catalog/')
 await page.getByLabel('Контактное лицо').fill('Проверка')
 await page.getByRole('checkbox').check()
 await page.getByRole('button',{name:'Подготовить запрос'}).click()
 await expect(page.locator('.field-error')).toContainText('Укажите телефон или электронную почту')
 await page.getByLabel('Телефон',{exact:true}).fill('+7 000 000-00-00')
 await page.getByRole('button',{name:'Подготовить запрос'}).click()
 await expect(page.getByLabel('Текст запроса')).toHaveValue(/общая консультация/)
})
test('mobile navigation and invalid storage',async({page})=>{
 await page.setViewportSize({width:375,height:812})
 await page.addInitScript(()=>sessionStorage.setItem('anteh-request-items','invalid json'))
 await page.goto('/')
 await page.getByRole('button',{name:'Открыть меню'}).click()
 await page.keyboard.press('Escape')
 await expect(page.getByRole('button',{name:'Открыть меню'})).toBeFocused()
 await page.getByRole('button',{name:'Открыть меню'}).click()
 await page.locator('#mobile-navigation').getByRole('link',{name:'Продукция и услуги'}).click()
 await expect(page).toHaveURL(/catalog/)
 await expect(page.getByRole('button',{name:'Открыть меню'})).toBeVisible()
 await expect(page.locator('.catalog-card')).toHaveCount(3)
})

test('catalog uses own API and provides staff login', async ({page}) => {
 const external:string[]=[]
 page.on('request',request=>{ if (['fetch','xhr'].includes(request.resourceType()) && !request.url().startsWith('http://127.0.0.1:3100/')) external.push(request.url()) })
 await page.goto('/catalog/')
 await expect(page.locator('.catalog-card')).toHaveCount(3)
 await page.getByRole('button',{name:/Услуги/}).click()
 await expect(page.locator('.catalog-card')).toHaveCount(3)
 await expect(page.locator('.catalog-card')).toContainText(['Антикоррозийное исполнение','Консультация по продуктам АнТех','Консультация по продуктам Карбо-ЦАКК'])
 await expect(page.locator('a[href="/admin/"]').first()).toHaveText('Вход')
 expect(external).toEqual([])
 expect((await page.goto('/admin/'))?.status()).toBe(200)
})
