import Link from 'next/link'
import { ArrowIcon, FileIcon, ShieldIcon } from '@/components/icons'
import { TechnicalVisual } from '@/components/technical-visual'

export default function HomePage() {
  return (
    <>
      <section className="home-hero">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-accent" aria-hidden="true" />
        <div className="container hero-content">
          <div className="hero-copy">
            <p className="eyebrow light">Российский производитель</p>
            <h1>Анкерная крепь для подземных работ</h1>
            <p className="hero-lead">
              «Анкерные технологии Восток» — производитель трубчатых фрикционных анкеров и комплектующих
              для крепления и усиления горных выработок.
            </p>
            <div className="hero-actions">
              <Link className="button accent" href="/catalog/#request">
                Запросить КП <ArrowIcon />
              </Link>
              <Link className="button ghost" href="/catalog/">
                Продукция и услуги
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section intro-section">
        <div className="container split-heading">
          <div>
            <p className="eyebrow">Подход</p>
            <h2>Продукция под условия вашего объекта.</h2>
          </div>
          <div className="large-copy">
            <p>
              Выберите анкерную крепь, опорные плиты и армокаркасы. Укажите исполнение и объём — специалисты подготовят предложение по вашей задаче.
            </p>
            <Link className="text-link" href="/catalog/">Перейти в единый каталог <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <section className="section dark-section">
        <div className="container">
          <div className="section-heading light-heading">
            <div>
              <p className="eyebrow light">Применение</p>
              <h2>Задачи, с которыми обращаются специалисты</h2>
            </div>
            <p>Для шахт, рудников и подрядчиков, работающих под землёй.</p>
          </div>
          <div className="application-grid">
            {[
              ['01', 'Крепление кровли и бортов'],
              ['02', 'Усиление горного массива'],
              ['03', 'Поддержание горных выработок'],
              ['04', 'Локальное усиление существующей крепи'],
            ].map(([number, title]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <div className="application-line" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section production-teaser">
        <div className="container production-grid">
          <TechnicalVisual label="Анкерное крепление · схематическая иллюстрация" />
          <div className="production-copy">
            <p className="eyebrow">Собственное производство</p>
            <h2>Серийное производство в Хабаровске</h2>
            <p>
              Автоматизированная линия выпускает до 80 000 комплектов анкеров с опорными плитами в месяц. Геометрические и механические характеристики проходят контроль.
            </p>
            <p>«АнТех Восток» развивает производство систем крепления для горнодобывающей промышленности, тоннельного и инфраструктурного строительства. Одно из направлений — сотрудничество с «Карбо-ЦАКК» и объединение производственных возможностей с отраслевой экспертизой.</p>
            <Link className="button secondary" href="/production/">О производстве <ArrowIcon /></Link>
          </div>
        </div>
      </section>

      <section className="section tools-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Для специалистов</p>
              <h2>Всё необходимое для первого запроса</h2>
            </div>
          </div>
          <div className="tool-cards">
            <Link href="/catalog/" className="tool-card">
              <span className="icon-box"><ShieldIcon /></span>
              <h3>Каталог решений</h3>
              <p>Исполнения ТФА, комплектующие и услуги производства.</p>
              <span className="text-link">Открыть каталог <ArrowIcon /></span>
            </Link>
            <Link href="/documents/" className="tool-card">
              <span className="icon-box red"><FileIcon /></span>
              <h3>Документация</h3>
              <p>Обозначение технических условий и запрос документов на продукцию.</p>
              <span className="text-link">К документам <ArrowIcon /></span>
            </Link>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="container final-cta-inner">
          <div>
            <p className="eyebrow light">Начать обсуждение</p>
            <h2>Соберите позиции в одну понятную заявку</h2>
          </div>
          <Link className="button accent" href="/catalog/">Перейти в каталог <ArrowIcon /></Link>
        </div>
      </section>
    </>
  )
}
