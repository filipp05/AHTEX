export const site = {
  name: 'АнТех Восток',
  logoName: 'Анкерные технологии Восток',
  legalName: 'ООО «АНКЕРНЫЕ ТЕХНОЛОГИИ ВОСТОК»',
  email: 'info@antekh.ru',
  phone: '+7 804 700-55-01',
  phoneHref: 'tel:+78047005501',
  legalAddress: '680018, Хабаровский край, г. Хабаровск, ул. Перспективная, д. 38',
  inn: '2700066120', kpp: '270001001', ogrn: '1262700003114',
  description: 'Российский производитель анкерной крепи и комплектующих для крепления горных выработок. Производство в Хабаровске.',
} as const
export const navigation = [
  { href: '/', label: 'Главная' },
  { href: '/catalog/', label: 'Продукция и услуги' },
  { href: '/production/', label: 'Производство' },
  { href: '/documents/', label: 'Документация' },
  { href: '/contacts/', label: 'Контакты' },
] as const
