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
            <h1>Крепление, рассчитанное на реальные условия подземных работ</h1>
            <p className="hero-lead">
              «Антех Восток» производит фрикционные трубчатые анкеры и разрабатывает решения
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
          <div className="hero-visual-wrap">
            <TechnicalVisual label="Место для фотографии продукции" />
          </div>
        </div>
        <div className="container hero-index">
          <span>01 / Производство</span>
          <span>02 / Продукция</span>
          <span>03 / Техническая поддержка</span>
        </div>
      </section>

      <section className="audience-strip">
        <div className="container audience-grid">
          <p>Для предприятий, где надёжность крепления — часть безопасности работ</p>
          <div><span>01</span>Подземные рудники</div>
          <div><span>02</span>Шахты</div>
          <div><span>03</span>ГОК и подрядчики</div>
        </div>
      </section>

      <section className="section intro-section">
        <div className="container split-heading">
          <div>
            <p className="eyebrow">Подход</p>
            <h2>Не просто поставка. Решение под условия объекта.</h2>
          </div>
          <div className="large-copy">
            <p>
              Посетитель может выбрать продукцию и услуги в каталоге, указать требуемый объём
              и отправить одну собранную заявку на коммерческое предложение или консультацию.
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
            <p>Формулировки взяты из анкеты заказчика и не содержат неподтверждённых характеристик.</p>
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
          <TechnicalVisual label="Фотографии производства будут добавлены после передачи заказчиком" />
          <div className="production-copy">
            <p className="eyebrow">Собственное производство</p>
            <h2>Производственная база — главный аргумент компании</h2>
            <p>
              Раздел подготовлен для подтверждённых сведений об оборудовании, этапах производства
              и контроле качества. До получения материалов мы не публикуем вымышленные показатели.
            </p>
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
              <p>Продукция и услуги в одном месте без повторяющихся описаний.</p>
              <span className="text-link">Открыть каталог <ArrowIcon /></span>
            </Link>
            <Link href="/documents/" className="tool-card">
              <span className="icon-box red"><FileIcon /></span>
              <h3>Документация</h3>
              <p>Место для паспортов, сертификатов, каталогов и технических материалов.</p>
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
