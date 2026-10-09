import { spawnSync } from 'node:child_process'
const run=(args,env=process.env)=>{const r=spawnSync('npm',args,{stdio:'inherit',env});if(r.status!==0)throw new Error(`npm ${args.join(' ')} failed`)}
try {
 run(['run','build'],{...process.env,NEXT_PUBLIC_SUPABASE_URL:'https://anteh-test.supabase.co',NEXT_PUBLIC_SUPABASE_ANON_KEY:'qa-public-placeholder',NEXT_PUBLIC_FORM_ENDPOINT:'https://forms.example.test/submit'})
 run(['run','test:e2e'],{...process.env,CONNECTED_QA:'1'})
} finally {
 // Restore the ordinary local build even when an integration assertion fails.
 run(['run','build'])
}
