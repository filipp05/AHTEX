import { createMailer } from './mail.mjs'
export const requiredMailSettings=['SMTP_HOST','SMTP_USER','SMTP_PASS','MAIL_FROM','MAIL_TO']
export function missingMailSettings(env){return requiredMailSettings.filter(key=>typeof env[key]!=='string'||!env[key].trim())}
export function safeMailError(error){
 const code=error?.code
 if(code==='EAUTH')return 'Почта отклонила вход. Проверьте логин, пароль приложения и разрешение SMTP.'
 if(['ESOCKET','ETLS','CERT_HAS_EXPIRED','DEPTH_ZERO_SELF_SIGNED_CERT','ERR_TLS_CERT_ALTNAME_INVALID'].includes(code))return 'Ошибка защищённого соединения. Проверьте SMTP-хост, порт и сертификат; проверку TLS не отключайте.'
 if(['ECONNECTION','ECONNREFUSED','ETIMEDOUT','ETIMEOUT','EDNS','ENOTFOUND'].includes(code))return 'Не удалось подключиться. Проверьте SMTP-хост, порт, интернет и доступ к почтовому серверу.'
 if(code==='EENVELOPE')return 'Почта отклонила отправителя или получателя. Проверьте MAIL_FROM и MAIL_TO и разрешение отправлять с этого адреса.'
 return 'Почта не подтвердила операцию. Проверьте настройки и ограничения сервиса. Подробности сервера скрыты, чтобы не раскрыть доступы.'
}
export async function checkMailSetup({env=process.env,send=false,factory=createMailer}={}){
 const missing=missingMailSettings(env)
 if(missing.length)return {ok:false,message:`Настройки ещё не заполнены: ${missing.join(', ')}. Заполните .env.server. Письмо не отправлялось.`}
 let mailer
 try{mailer=factory(env)}catch{return {ok:false,message:'Некорректные настройки: проверьте SMTP-хост, порт 465/587 и одиночные адреса MAIL_FROM/MAIL_TO. Значения настроек не выводятся.'}}
 if(!mailer)return {ok:false,message:'Настройки почты неполные. Письмо не отправлялось.'}
 try{
  await mailer.transport.verify()
  if(!send)return {ok:true,message:'SMTP-соединение и вход проверены. Письмо не отправлялось; разрешение отправителя и доставку проверяет mail:test.'}
  const result=await mailer.transport.sendMail({from:{name:'АнТех Восток · проверка',address:mailer.from},to:mailer.to,subject:'Проверка почты сайта «АнТех Восток»',text:'Это техническое тестовое письмо сайта «АнТех Восток».\n\nОтправка подключена. Пожалуйста, проверьте получение и папку «Спам».\nРеальных заявок и данных посетителей в этом письме нет.',disableFileAccess:true,disableUrlAccess:true})
  if(!result.accepted?.length||result.rejected?.length)return {ok:false,message:'Почтовый сервер не подтвердил приём тестового письма. Проверьте отправителя и получателя.'}
  return {ok:true,message:'Сервер принял тестовое письмо. Проверьте его в настроенном ящике, включая «Спам»: приём сервером ещё не подтверждает доставку во входящие.'}
 }catch(error){return {ok:false,message:safeMailError(error)}}finally{mailer.transport.close?.()}
}
