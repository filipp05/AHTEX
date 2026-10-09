'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase'
import { emptyDetails, parseDetails } from '@/lib/catalog'
import type { CatalogItem, CatalogItemType } from '@/lib/types'

type AuthState = 'loading' | 'signed-out' | 'checking' | 'forbidden' | 'error' | 'admin'
type EditorState = { id?: string; item_type: CatalogItemType; title: string; description: string; specsText: string; variantsText: string; application: string; length: boolean; documentsText: string }

const emptyEditor: EditorState = { item_type: 'product', title: '', description: '', specsText: '', variantsText: '', application: '', length: false, documentsText: '' }

export function AdminPanel() {
  const [authState, setAuthState] = useState<AuthState>(() =>
    isSupabaseConfigured() ? 'loading' : 'signed-out',
  )
  const [session, setSession] = useState<Session | null>(null)
  const [items, setItems] = useState<CatalogItem[]>([])
  const [editor, setEditor] = useState<EditorState>(emptyEditor)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const loadAdminData = useCallback(async (currentSession: Session | null) => {
    const supabase = getSupabaseClient()
    if (!supabase || !currentSession) {
      setAuthState('signed-out')
      return
    }

    setAuthState('checking')
    const { data: isAdmin, error: roleError } = await supabase.rpc('is_site_admin').retry(false).abortSignal(AbortSignal.timeout(10000))
    if (roleError) { setAuthState('error'); return }
    if (!isAdmin) {
      setAuthState('forbidden')
      return
    }

    const { data, error } = await supabase
      .from('catalog_items')
      .select('*')
      .order('created_at', { ascending: true }).retry(false).abortSignal(AbortSignal.timeout(10000))

    if (error) {
      setMessage('Не удалось загрузить каталог. Проверьте соединение и настройки базы.')
      setItems([])
      setAuthState('error'); return
    } else {
      try { setItems((data ?? []).map(item => ({ ...item, details: parseDetails(item.details) })) as CatalogItem[]) } catch { setItems([]); setMessage('Некорректные данные каталога. Проверьте миграцию базы.')}
    }
    setAuthState('admin')
  }, [])

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) return

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      void loadAdminData(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setTimeout(() => { void loadAdminData(nextSession) }, 0)
    })

    return () => listener.subscription.unsubscribe()
  }, [loadAdminData])

  async function requestMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const supabase = getSupabaseClient()
    if (!supabase) return
    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') ?? '').trim()
    setMessage('')

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/admin/`,
      },
    })
    setMessage(
      error
        ? 'Не удалось отправить ссылку. Проверьте адрес или обратитесь к ответственному за сайт.'
        : 'Ссылка для входа отправлена. Проверьте почту.',
    )
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const supabase = getSupabaseClient()
    if (!supabase) return
    const title = editor.title.trim()
    const description = editor.description.trim()
    if (!title || !description) {
      setMessage('Заполните название и описание.')
      return
    }

    let details
    try {
      const pairs = (text: string) => text.split('\n').map(line => line.trim()).filter(Boolean).map(line => { const i = line.indexOf('|'); if (i < 1) throw new Error('Используйте формат «Название | Значение» для каждой строки.'); return [line.slice(0, i).trim(), line.slice(i + 1).trim()] })
      details = parseDetails({
        specs: pairs(editor.specsText).map(([label, value]) => ({ label, value })),
        variants: editor.variantsText.split('\n').map(v => v.trim()).filter(Boolean),
        application: editor.application.trim(), length: editor.length,
        documents: pairs(editor.documentsText).map(([title, url]) => ({ title, url })),
      })
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Проверьте характеристики.'); return }
    setSaving(true)
    setMessage('')
    const payload = { item_type: editor.item_type, title, description, details }
    const result = editor.id
      ? await supabase.from('catalog_items').update(payload).eq('id', editor.id).select().abortSignal(AbortSignal.timeout(15000)).single().retry(false)
      : await supabase.from('catalog_items').insert(payload).select().abortSignal(AbortSignal.timeout(15000)).single().retry(false)

    if (result.error) {
      setMessage('Не удалось подтвердить сохранение. Проверьте каталог перед повторной попыткой. Введённый текст остался в форме.')
    } else {
      const saved = result.data as CatalogItem
      setItems((current) =>
        editor.id ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved],
      )
      setEditor(emptyEditor)
      setMessage('Изменения сохранены и уже доступны в публичном каталоге.')
    }
    setSaving(false)
  }

  async function signOut() {
    await getSupabaseClient()?.auth.signOut()
    setEditor(emptyEditor)
  }

  if (!isSupabaseConfigured()) {
    return (
      <div className="admin-state">
        <p className="eyebrow">Настройка</p>
        <h2>Подключите базу данных</h2>
        <p>Добавьте публичный адрес и анонимный ключ Supabase в переменные окружения, затем пересоберите сайт.</p>
      </div>
    )
  }

  if (authState === 'loading' || authState === 'checking') {
    return <div className="admin-state"><p>Проверяем доступ…</p></div>
  }

  if (authState === 'signed-out') {
    return (
      <form className="admin-login" onSubmit={requestMagicLink}>
        <p className="eyebrow">Закрытый вход</p>
        <h2>Управление каталогом</h2>
        <p>Одноразовая ссылка придёт только на заранее разрешённый адрес.</p>
        <label>
          <span>Электронная почта</span>
          <input type="email" name="email" required autoComplete="email" />
        </label>
        <button className="button accent" type="submit">Получить ссылку для входа</button>
        {message && <p className="inline-notice" role="status">{message}</p>}
      </form>
    )
  }

  if (authState === 'error') return <div className="admin-state"><h2>Не удалось проверить доступ</h2><p>Проверьте соединение и повторите попытку.</p><button className="button primary" onClick={() => void loadAdminData(session)}>Повторить</button><button className="text-button" onClick={signOut}>Выйти</button></div>

  if (authState === 'forbidden') {
    return (
      <div className="admin-state">
        <p className="eyebrow">Доступ ограничен</p>
        <h2>Этот адрес не входит в список редакторов</h2>
        <p>{session?.user.email}</p>
        <button className="button secondary" type="button" onClick={signOut}>Выйти</button>
      </div>
    )
  }

  return (
    <div className="admin-layout">
      <div className="admin-toolbar">
        <div>
          <p className="eyebrow">Редактор</p>
          <p>{session?.user.email}</p>
        </div>
        <button type="button" className="text-button" onClick={signOut}>Выйти</button>
      </div>

      <div className="admin-columns">
        <section className="admin-list">
          <div className="admin-section-title">
            <h2>Каталог</h2>
            <span>{items.length}</span>
          </div>
          {items.length === 0 && <p className="admin-empty">Каталог пока пуст.</p>}
          {items.map((item) => (
            <button
              type="button"
              className={`admin-list-item ${editor.id === item.id ? 'active' : ''}`}
              key={item.id}
              onClick={() => setEditor({
                id: item.id,
                item_type: item.item_type,
                title: item.title,
                description: item.description,
                specsText: (item.details ?? emptyDetails).specs.map(s => `${s.label} | ${s.value}`).join('\n'),
                variantsText: (item.details ?? emptyDetails).variants.join('\n'),
                application: (item.details ?? emptyDetails).application,
                length: (item.details ?? emptyDetails).length,
                documentsText: (item.details ?? emptyDetails).documents.map(d => `${d.title} | ${d.url}`).join('\n'),
              })}
            >
              <span>{item.item_type === 'product' ? 'Продукция' : 'Услуга'}</span>
              <strong>{item.title}</strong>
            </button>
          ))}
          <button className="button secondary full" type="button" onClick={() => setEditor(emptyEditor)}>
            Создать новую позицию
          </button>
        </section>

        <form className="admin-editor" onSubmit={saveItem}>
          <p className="eyebrow">{editor.id ? 'Редактирование' : 'Новая позиция'}</p>
          <h2>{editor.id ? editor.title : 'Добавить в каталог'}</h2>
          <fieldset>
            <legend>Вид позиции</legend>
            <label className="radio-card">
              <input
                type="radio"
                name="item_type"
                value="product"
                checked={editor.item_type === 'product'}
                onChange={() => setEditor((current) => ({ ...current, item_type: 'product' }))}
              />
              <span>Продукция</span>
            </label>
            <label className="radio-card">
              <input
                type="radio"
                name="item_type"
                value="service"
                checked={editor.item_type === 'service'}
                onChange={() => setEditor((current) => ({ ...current, item_type: 'service' }))}
              />
              <span>Услуга</span>
            </label>
          </fieldset>
          <label>
            <span>Название</span>
            <input
              value={editor.title}
              onChange={(event) => setEditor((current) => ({ ...current, title: event.target.value }))}
              maxLength={160}
              required
            />
          </label>
          <label>
            <span>Описание</span>
            <textarea
              rows={8}
              value={editor.description}
              onChange={(event) => setEditor((current) => ({ ...current, description: event.target.value }))}
              maxLength={2000}
              required
            />
          </label>
          <label><span>Характеристики — по одной на строке</span><textarea rows={5} placeholder="Длина | 600–3000 мм" value={editor.specsText} onChange={e => setEditor(v => ({ ...v, specsText: e.target.value }))}/></label>
          <label><span>Исполнения — по одному на строке</span><textarea rows={4} placeholder="ТФА39" value={editor.variantsText} onChange={e => setEditor(v => ({ ...v, variantsText: e.target.value }))}/></label>
          <label className="consent-field"><input type="checkbox" checked={editor.length} onChange={e => setEditor(v => ({ ...v, length: e.target.checked }))}/><span>Предлагать выбор длины в миллиметрах</span></label>
          <label><span>Применение и результат</span><textarea rows={4} maxLength={1000} value={editor.application} onChange={e => setEditor(v => ({ ...v, application: e.target.value }))}/></label>
          <label><span>Опубликованные документы — название | путь</span><textarea rows={3} placeholder="Паспорт | /files/passport.pdf" value={editor.documentsText} onChange={e => setEditor(v => ({ ...v, documentsText: e.target.value }))}/><small>Только уже размещённые PDF в /files/. Загрузка файлов выполняется при выпуске сайта.</small></label>
          <button className="button accent" type="submit" disabled={saving}>
            {saving ? 'Сохраняем…' : editor.id ? 'Сохранить изменения' : 'Создать позицию'}
          </button>
          <p className="admin-publish-note">Изменения публикуются сразу после сохранения.</p>
          {message && <p className="inline-notice" role="status">{message}</p>}
        </form>
      </div>
    </div>
  )
}
