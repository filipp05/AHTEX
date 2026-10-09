import pg from 'pg'
import { readFile, readdir } from 'node:fs/promises'
import { setEditor, applyMigrations } from './database-operations.mjs'

const command = process.argv[2]
if (!['migrate','editor','check'].includes(command)) throw new Error('Use migrate, check or editor grant/revoke')
if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is not configured. No changes made.'); process.exit(1) }
let url
try { url = new URL(process.env.DATABASE_URL) } catch { console.error('Invalid DATABASE_URL format'); process.exit(1) }
// Never allow URL options to silently disable certificate validation.
const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname)
for (const key of ['ssl','sslmode','sslcert','sslkey','sslrootcert','uselibpqcompat']) url.searchParams.delete(key)
const client = new pg.Client({ connectionString: url.toString(), ssl: local ? false : { rejectUnauthorized: true }, connectionTimeoutMillis: 8000, statement_timeout: 30000 })
try {
 await client.connect()
 if (command === 'migrate') {
  const root = new URL('../supabase/migrations/', import.meta.url)
  const migrations = []
  for (const name of (await readdir(root)).filter(x=>/^\d+.*\.sql$/.test(x)).sort()) migrations.push({name,sql:await readFile(new URL(name,root),'utf8')})
  const applied = await applyMigrations(client,migrations)
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date')
 } else if (command === 'editor') {
  await client.query('begin')
  const result = await setEditor(client,process.env.EDITOR_EMAIL,process.argv[3])
  await client.query('commit');console.log(result.allowed?'Editor access granted and verified':'Editor access revoked and verified')
 } else {
  const { rows } = await client.query("select (select count(*)::int from public.catalog_items) as catalog_count,(select count(*)::int from public.site_admins) as editor_count,(select bool_and(relrowsecurity) from pg_class where oid in ('public.catalog_items'::regclass,'public.site_admins'::regclass)) as rls_enabled")
  console.log(JSON.stringify(rows[0]))
  if(!rows[0].rls_enabled)throw new Error('RLS is disabled')
 }
} catch {
 try { await client.query('rollback') } catch {}
 console.error('Database operation failed. Check connection, migrations and the existing confirmed Auth user. Credentials and server errors are not logged.');process.exitCode=1
} finally { await client.end() }
