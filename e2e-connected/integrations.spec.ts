import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
const seed = JSON.parse(readFileSync(new URL('../content/catalog.json', import.meta.url), 'utf8'))
const api='https://anteh-test.supabase.co'
const formUrl='https://forms.example.test/submit'
test.beforeEach(async({page})=>{
 await page.route(`${api}/**`,async route=>{
  if(route.request().url().includes('/catalog_items')) await route.fulfill({json:seed})
  else await route.fulfill({status:401,json:{message:'Not signed in'}})
 })
})
test('catalog outage falls back without hiding products',async({page})=>{
 await page.route(`${api}/rest/v1/catalog_items**`,r=>r.fulfill({status:503,json:{message:'Unavailable'}}))
 await page.goto('/catalog/')
 await expect(page.locator('.inline-notice')).toContainText('сохранённая')
 await expect(page.locator('.catalog-card')).toHaveCount(3)
})
test('HTTP form failure retains draft; success clears it',async({page})=>{
 let status=500;let payload=''
 await page.route(formUrl,r=>{payload=r.request().postData()??'';return r.fulfill({status,json:status===200?{ok:true}:{error:'Failed'}})})
 await page.goto('/catalog/')
 await page.locator('.catalog-card').first().getByLabel('Исполнение').selectOption('ТФА45')
 await page.locator('.catalog-card').first().getByRole('button',{name:'Добавить в заявку'}).click()
 await page.getByLabel('Контактное лицо').fill('Тест')
 await page.getByLabel('Электронная почта',{exact:true}).fill('test@example.com')
 await page.getByRole('checkbox').check()
 await page.getByRole('button',{name:'Отправить заявку',exact:true}).click()
 await expect(page.locator('.form-status')).toContainText('Не удалось отправить')
 await expect(page.getByLabel('Контактное лицо')).toHaveValue('Тест')
 await expect(page.locator('.selected-row')).toHaveCount(1)
 expect(payload).toContain('ТФА45')
 status=200
 await page.getByRole('button',{name:'Отправить заявку',exact:true}).click()
 await expect(page.locator('.form-status')).toContainText('Заявка отправлена')
 await expect(page.getByLabel('Контактное лицо')).toHaveValue('')
 await expect(page.locator('.selected-row')).toHaveCount(0)
})
for(const allowed of [false,true]) {
 test(`admin access=${allowed}, structured editing`,async({page})=>{
  const user={id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',email:'editor@example.com',role:'authenticated'}
  const exp=Math.floor(Date.now()/1000)+3600
  const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp,aud:'authenticated'}].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.')+'.test'
  await page.addInitScript(({user,exp,token})=>localStorage.setItem('sb-anteh-test-auth-token',JSON.stringify({access_token:token,refresh_token:'test-only',expires_at:exp,expires_in:3600,token_type:'bearer',user})),{user,exp,token})
  await page.route(`${api}/rest/v1/rpc/is_site_admin`,r=>r.fulfill({json:allowed}))
  await page.route(`${api}/auth/v1/user`,r=>r.fulfill({json:user}))
  let saved:Record<string,unknown>|undefined
  await page.route(`${api}/rest/v1/catalog_items**`,r=>{
   if(r.request().method()==='PATCH'){saved=r.request().postDataJSON();return r.fulfill({json:{...seed[0],...saved}})}
   return r.fulfill({json:seed})
  })
  await page.goto('/admin/')
  if(!allowed){await expect(page.getByText('Этот адрес не входит в список редакторов')).toBeVisible();await expect(page.locator('.admin-editor')).toHaveCount(0);return}
  await page.locator('.admin-list-item').first().click()
  await expect(page.getByLabel('Характеристики — по одной на строке')).toHaveValue(/Толщина стенки/)
  await page.getByLabel('Название',{exact:true}).fill('ТФА — тестовое изменение')
  await page.getByRole('button',{name:'Сохранить изменения'}).click()
  await expect(page.getByRole('status')).toContainText('Изменения сохранены')
  expect(saved?.title).toBe('ТФА — тестовое изменение')
  expect(saved?.details).toEqual(seed[0].details)
 })
}
