import { createHash } from 'node:crypto'

export async function setEditor(client, email, action) {
  if (!['grant', 'revoke'].includes(action) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) throw new Error('Use grant/revoke and EDITOR_EMAIL')
  const { rows } = await client.query('select id, email_confirmed_at from auth.users where lower(email)=lower($1)', [email])
  if (rows.length !== 1) throw new Error('Expected one existing Supabase Auth user; create the intended user first')
  if (action === 'grant' && !rows[0].email_confirmed_at) throw new Error('User must confirm email first')
  if (action === 'grant') await client.query('insert into public.site_admins(user_id) values ($1) on conflict do nothing', [rows[0].id])
  else await client.query('delete from public.site_admins where user_id=$1', [rows[0].id])
  const check = await client.query('select exists(select 1 from public.site_admins where user_id=$1) as allowed', [rows[0].id])
  if (check.rows[0].allowed !== (action === 'grant')) throw new Error('Access verification failed')
  return { allowed: check.rows[0].allowed }
}

export async function applyMigrations(client, migrations) {
  const applied = []
  await client.query('begin')
  try {
    await client.query("select pg_advisory_xact_lock(hashtext('anteh-schema-migrations'))")
    await client.query('create table if not exists public.anteh_schema_migrations(name text primary key, checksum text not null, applied_at timestamptz not null default now())')
    await client.query('revoke all on public.anteh_schema_migrations from public, anon, authenticated')
    for (const {name, sql} of migrations) {
      const checksum = createHash('sha256').update(sql).digest('hex')
      const {rows} = await client.query('select checksum from public.anteh_schema_migrations where name=$1', [name])
      if (rows.length) {
        if (rows[0].checksum !== checksum) throw new Error('An applied migration was changed')
        continue
      }
      if (client.exec) await client.exec(sql)
      else await client.query(sql)
      await client.query('insert into public.anteh_schema_migrations(name,checksum) values ($1,$2)', [name,checksum])
      applied.push(name)
    }
    await client.query('commit')
    return applied
  } catch(error) { await client.query('rollback'); throw error }
}
