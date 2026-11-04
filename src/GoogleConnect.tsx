import React, { useEffect, useState } from 'react';

declare global {
  interface Window { google?: any; gapi?: any }
}

type Props = { onClose: () => void };
type Tab = { id: number; title: string };
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-google-src="${src}"]`) as HTMLScriptElement | null;
    if (existing?.dataset.loaded === 'true') return resolve();
    const script = existing || document.createElement('script');
    script.addEventListener('load', () => { script.dataset.loaded = 'true'; resolve(); }, { once: true });
    script.addEventListener('error', () => reject(new Error('Không tải được thư viện Google.')), { once: true });
    if (!existing) { script.dataset.googleSrc = src; script.src = src; script.async = true; document.head.appendChild(script); }
  });
}

export default function GoogleConnect({ onClose }: Props) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const apiKey = import.meta.env.VITE_GOOGLE_PICKER_API_KEY || '';
  const projectNumber = import.meta.env.VITE_GOOGLE_PROJECT_NUMBER || '';
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('Đang tải thành phần Google…');
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([
      loadScript('https://accounts.google.com/gsi/client'),
      loadScript('https://apis.google.com/js/api.js'),
    ]).then(() => new Promise<void>((resolve, reject) => {
      window.gapi.load('picker', { callback: resolve, onerror: () => reject(new Error('Không tải được Google Picker.')), timeout: 10000, ontimeout: () => reject(new Error('Tải Google Picker quá thời gian.')) });
    })).then(() => { if (active) { setReady(true); setMessage('Sẵn sàng kết nối khi Google Cloud đã được cấu hình.'); } })
      .catch(() => { if (active) setMessage('Không tải được thành phần Google. Kiểm tra kết nối mạng hoặc tiện ích chặn trình duyệt.'); });
    return () => { active = false; };
  }, []);

  function connect() {
    if (!clientId.trim().endsWith('.apps.googleusercontent.com') || !apiKey.trim() || !/^\d+$/.test(projectNumber.trim())) {
      setMessage('AnyNote chưa được cấu hình Google Cloud. Vui lòng hoàn tất cấu hình ứng dụng trước khi kết nối.'); return;
    }
    setMessage('Đang chờ bạn cấp quyền trên Google…');
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(), scope: SCOPE,
      error_callback: () => setMessage('Cửa sổ đăng nhập bị đóng hoặc không thể mở. Hãy thử lại.'),
      callback: (result: { access_token?: string; error?: string }) => {
        if (!result.access_token || result.error) { setMessage('Không được cấp quyền. Hãy kiểm tra cấu hình và thử lại.'); return; }
        const token = result.access_token;
        const pickerApi = window.google.picker;
        const view = new pickerApi.DocsView().setMimeTypes('application/vnd.google-apps.spreadsheet');
        const picker = new pickerApi.PickerBuilder()
          .addView(view).setAppId(projectNumber.trim()).setDeveloperKey(apiKey.trim()).setOAuthToken(token)
          .setCallback(async (data: any) => {
            if (data.action === pickerApi.Action.CANCEL) { setMessage('Bạn đã đóng cửa sổ chọn file.'); return; }
            if (data.action !== pickerApi.Action.PICKED) return;
            const file = data.docs?.[0];
            if (!file?.id) { setMessage('Không nhận được file đã chọn.'); return; }
            setMessage('Đang kiểm tra các tab của bảng tính…');
            try {
              const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(file.id)}?fields=sheets.properties(sheetId,title)`, { headers: { Authorization: `Bearer ${token}` }, redirect: 'error' });
              if (!response.ok) throw new Error('SHEETS_REQUEST_FAILED');
              const metadata = await response.json();
              const found: Tab[] = (metadata.sheets || []).map((item: any) => ({ id: item.properties.sheetId, title: item.properties.title }));
              setFileName(file.name || 'Bảng tính đã chọn'); setTabs(found);
              setMessage('Đã đọc danh sách tab. Chưa nhập hoặc đồng bộ nội dung.');
            } catch { setMessage('Không đọc được bảng tính. Kiểm tra Sheets API, quyền truy cập file và cấu hình Google Cloud.'); }
          }).build();
        picker.setVisible(true);
      },
    });
    client.requestAccessToken({ prompt: 'consent' });
  }

  return <div className="overlay"><div className="modal" role="dialog" aria-modal="true" aria-labelledby="google-title">
    <div className="section-head"><b id="google-title">Kết nối Google Drive</b><button aria-label="Đóng" onClick={onClose}>✕</button></div>
    <p className="warning">Bản thử nghiệm chỉ chọn file và đọc danh sách tab. Chưa nhập dữ liệu, lưu dữ liệu hoặc đồng bộ. Hãy dùng bảng tính giả.</p>
    <p className="google-message" role="status">{message}</p>
    {fileName && <div><b>{fileName}</b><ul>{tabs.map(tab => <li key={tab.id}>{tab.title}</li>)}</ul></div>}
    <div className="modal-actions"><button onClick={onClose}>Đóng</button><button className="primary" disabled={!ready} onClick={connect}>Đăng nhập và chọn Google Sheet</button></div>
  </div></div>;
}
