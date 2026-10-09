import { PGlite } from '@electric-sql/pglite'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const db = new PGlite()
await db.exec(`create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid$$;
grant usage on schema auth to anon, authenticated;
`)
const migration = name => readFileSync(new URL('../supabase/migrations/' + name, import.meta.url), 'utf8').replace('create extension if not exists pgcrypto;', '-- gen_random_uuid is built into this PostgreSQL runtime')
for (const name of ['001_catalog.sql','002_catalog_details.sql','003_catalog_content.sql']) await db.exec(migration(name))
await db.exec(migration('003_catalog_content.sql'))
assert.equal((await db.query('select count(*)::int as n from public.catalog_items')).rows[0].n, 7)
const seed = JSON.parse(readFileSync(new URL('../content/catalog.json', import.meta.url)))
for(const item of seed) {
 const row=(await db.query('select * from public.catalog_items where title=$1',[item.title])).rows[0]
 assert.deepEqual(row.details,item.details); assert.equal(row.description,item.description)
}
await db.exec(`insert into auth.users values ('00000000-0000-4000-8000-000000000001'),('00000000-0000-4000-8000-000000000002');
insert into public.site_admins(user_id) values ('00000000-0000-4000-8000-000000000001');`)
async function denied(sql){await assert.rejects(db.exec(sql))}
await db.exec('set role anon')
assert.equal((await db.query('select count(*)::int n from public.catalog_items')).rows[0].n,7)
await denied("insert into public.catalog_items(item_type,title,description) values ('service','attack','attack')")
await denied("update public.catalog_items set title='attack'")
await denied('select * from public.site_admins')
await db.exec("reset role; set role authenticated; set request.jwt.claim.sub='00000000-0000-4000-8000-000000000002'")
assert.equal((await db.query('select public.is_site_admin() as v')).rows[0].v,false)
await denied("insert into public.catalog_items(item_type,title,description) values ('service','attack','attack')")
await db.exec("update public.catalog_items set title='attack'")
assert.equal((await db.query("select count(*)::int n from public.catalog_items where title='attack'")).rows[0].n,0)
await denied("insert into public.site_admins(user_id) values ('00000000-0000-4000-8000-000000000002')")
await db.exec("set request.jwt.claim.sub='00000000-0000-4000-8000-000000000001'")
assert.equal((await db.query('select public.is_site_admin() as v')).rows[0].v,true)
await db.exec("insert into public.catalog_items(item_type,title,description) values ('service','Test','Test description'); update public.catalog_items set title='Edited' where title='Test'")
assert.equal((await db.query("select count(*)::int n from public.catalog_items where title='Edited'")).rows[0].n,1)
await denied('delete from public.catalog_items')
await denied("update public.catalog_items set details='{}'")
await denied("update public.catalog_items set title=' '")
await denied("update public.catalog_items set id=gen_random_uuid()")
const bad={...seed[0].details,documents:[{title:'Injected',url:'javascript:alert(1)'}]}
await assert.rejects(db.query('update public.catalog_items set details=$1',[bad]))
const edited=(await db.query("select id from public.catalog_items where title='Edited'")).rows[0].id
await db.exec('reset role')
await db.exec(migration('003_catalog_content.sql'))
assert.equal((await db.query('select title from public.catalog_items where id=$1',[edited])).rows[0].title,'Edited')
await db.close()
console.log('PASS: migrations, seed parity/idempotency, anonymous reads, denied writes, editor CRUD limits, constraints and self-escalation protection')
