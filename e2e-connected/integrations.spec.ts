import { test, expect } from '@playwright/test'
const formUrl='https://forms.example.test/submit'
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
 await expect(page.locator('.form-status')).toContainText('Не удалось подтвердить отправку')
 await expect(page.getByLabel('Контактное лицо')).toHaveValue('Тест')
 await expect(page.locator('.selected-row')).toHaveCount(1)
 expect(payload).toContain('ТФА45')
 status=200
 await page.getByRole('button',{name:'Отправить заявку',exact:true}).click()
 await expect(page.locator('.form-status')).toContainText('Заявка отправлена')
 await expect(page.getByLabel('Контактное лицо')).toHaveValue('')
 await expect(page.locator('.selected-row')).toHaveCount(0)
})
