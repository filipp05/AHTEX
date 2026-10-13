import { checkMailSetup } from '../server/mail-setup.mjs'
const args=process.argv.slice(2)
if(args.length&&!(args.length===1&&args[0]==='--send-test')){
 console.error('Используйте npm run mail:check или npm run mail:test. Адреса и пароли задаются только в .env.server.')
 process.exitCode=1
}else{
 const result=await checkMailSetup({send:args[0]==='--send-test'})
 console.log(result.message)
 process.exitCode=result.ok?0:1
}
