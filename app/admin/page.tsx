import type { Metadata } from 'next'
import { AdminPanel } from '@/components/admin-panel'
export const metadata: Metadata = { title: 'Управление каталогом', robots: { index: false, follow: false } }
export default function AdminPage(){return <section className="admin-section"><div className="container"><AdminPanel/></div></section>}
