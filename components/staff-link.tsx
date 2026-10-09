'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
export function StaffLink({onClick}:{onClick?:()=>void}){
 const [signedIn,setSignedIn]=useState(false)
 useEffect(()=>{
  const update=()=>{fetch('/api/admin/me',{cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(5000)}).then(r=>setSignedIn(r.ok)).catch(()=>setSignedIn(false))}
  update();window.addEventListener('anteh-auth',update);window.addEventListener('focus',update)
  return()=>{window.removeEventListener('anteh-auth',update);window.removeEventListener('focus',update)}
 },[])
 return <Link href="/admin/" className="staff-link" onClick={onClick}>{signedIn?'Управление':'Вход'}</Link>
}
