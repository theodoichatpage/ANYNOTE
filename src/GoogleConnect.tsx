import React, {useEffect, useState} from 'react';
import {listVaultFiles, listGoogleFiles, readVaultRevision, uploadGoogleRevision} from './vault/drive.mjs';
import {loadHistory} from './vault/sync.mjs';
import {loadGoogleAccounts, saveGoogleAccounts} from './vault/google-storage.mjs';

declare global { interface Window { google?: any } }
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
type Props = {onClose: () => void; onConnected: (session: any, accounts: any[]) => void};
export default function GoogleConnect({onClose,onConnected}: Props) {
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('Đăng nhập Google để sử dụng dữ liệu AnyNote của bạn.'),[legacy,setLegacy]=useState<any>(null),[password,setPassword]=useState('');
 const clientId=import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
 useEffect(()=>{let active=true;const src='https://accounts.google.com/gsi/client';let script=document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null;if(window.google?.accounts?.oauth2){setReady(true);return;}if(!script){script=document.createElement('script');script.src=src;script.async=true;document.head.appendChild(script);}const loaded=()=>{if(active)setReady(true)};const failed=()=>{if(active)setMessage('Không tải được Google. Kiểm tra kết nối mạng.')};script.addEventListener('load',loaded);script.addEventListener('error',failed);return()=>{active=false;script?.removeEventListener('load',loaded);script?.removeEventListener('error',failed)}},[]);
 async function connectToken(token:string){
  setBusy(true);setMessage('Đang tải dữ liệu từ Google Drive…');
  const remote={list:()=>listGoogleFiles(token),read:(id:string)=>readVaultRevision(token,id),upload:(revision:any)=>uploadGoogleRevision(token,revision)};
  const old={list:()=>listVaultFiles(token),read:(id:string)=>readVaultRevision(token,id)};
  try {const current=await loadGoogleAccounts(remote);if(current.head===null && (await old.list()).length){setLegacy({remote,old});setMessage('Tìm thấy dữ liệu mã hóa từ phiên bản cũ. Nhập mật khẩu cũ một lần để chuyển dữ liệu; dữ liệu cũ vẫn được giữ.');return;}onConnected({remote,head:current.head},current.accounts);}
  catch(e:any){setMessage(e?.message==='VAULT_CONFLICT'?'Có dữ liệu xung đột trên Drive; chưa thay đổi dữ liệu.':'Không tải được dữ liệu. Kiểm tra quyền Google Drive và kết nối mạng.');}finally{setBusy(false);}
 }
 function signIn(){if(!clientId.endsWith('.apps.googleusercontent.com')){setMessage('Chưa cấu hình đăng nhập Google.');return;}setMessage('Đang chờ bạn cấp quyền Google…');window.google.accounts.oauth2.initTokenClient({client_id:clientId,scope:SCOPE,error_callback:()=>setMessage('Không thể mở cửa sổ đăng nhập.'),callback:(r:any)=>{if(!r.access_token || r.error){setMessage('Chưa được cấp quyền Google Drive.');return;}void connectToken(r.access_token);}}).requestAccessToken({prompt:'select_account'});}
 async function migrate(){if(!password){setMessage('Vui lòng nhập mật khẩu cũ để chuyển dữ liệu.');return;}setBusy(true);try{const previous=await loadHistory(legacy.old,password);const current=await saveGoogleAccounts(legacy.remote,null,previous.accounts);onConnected({remote:legacy.remote,head:current.head},current.accounts);}catch(e:any){setMessage(e?.message==='VAULT_CONFLICT'?'Phát hiện xung đột; dữ liệu cũ vẫn được giữ.':'Không thể chuyển dữ liệu. Kiểm tra mật khẩu cũ và kết nối mạng.');}finally{setBusy(false);}}
 return <div className="overlay"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="google-title"><div className="section-head"><b id="google-title">Kết nối Google Drive</b><button aria-label="Đóng" onClick={onClose}>✕</button></div><p role="status">{message}</p>{legacy&&<label>Mật khẩu dữ liệu cũ<input type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)}/></label>}<div className="modal-actions"><button onClick={onClose}>Đóng</button><button className="primary" disabled={!ready||busy} onClick={legacy?migrate:signIn}>{busy?'Đang xử lý…':legacy?'Chuyển dữ liệu cũ':'Đăng nhập bằng Google'}</button></div></div></div>;
}
