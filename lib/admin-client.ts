export type AdminUser = { id:string; login:string; name:string; role:'owner'|'editor'; active:boolean }
export class RequestError extends Error { constructor(message:string,public status:number){super(message)} }
export async function adminRequest<T>(path:string, options:RequestInit = {}):Promise<T>{
 let response:Response
 try{response=await fetch(`/api/admin/${path}`,{...options,credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)})}catch{throw new RequestError('Нет ответа от сервера. Проверьте соединение. Перед повторным сохранением обновите данные: предыдущее действие могло выполниться.',0)}
 const data=await response.json().catch(()=>({error:'Сервис недоступен. Проверьте соединение.'}))
 if(!response.ok)throw new RequestError(data.error||'Не удалось выполнить действие',response.status)
 return data
}
