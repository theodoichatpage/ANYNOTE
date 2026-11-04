import React, { useState, useEffect, useRef } from 'react';
import { saveRevision } from './vault/sync.mjs';
import { createRoot } from 'react-dom/client';
import { queryAccounts, validateAccount } from './accounts.mjs';
import './style.css';
import { splitAccountLine } from './import-parser.mjs';
import GoogleConnect from './GoogleConnect';
declare global {
  interface Window {
    anynote?: { copy: (value: string) => Promise<void> };
  }
}
function Copy({ value }: { value: string }) {
  const [message, setMessage] = useState('');
  return value ? (
    <button
      className="icon copy"
      title={
        message ||
        (window.anynote
          ? 'Sao chép; tự xóa sau 30 giây'
          : 'Sao chép vào clipboard')
      }
      onClick={async () => {
        try {
          if (window.anynote) await window.anynote.copy(value);
          else if (navigator.clipboard && window.isSecureContext)
            await navigator.clipboard.writeText(value);
          else throw new Error('Clipboard unavailable');
          setMessage('Đã sao chép');
          setTimeout(() => setMessage(''), 2000);
        } catch {
          setMessage('Không thể sao chép');
        }
      }}
    >
      {message || '⧉'}
    </button>
  ) : null;
}
type Account = {
  id: string;
  name: string;
  account: string;
  phone: string;
  accountId: string;
  password: string;
  cookie: string;
  fa: string;
  sourceLine: string;
  group: string;
  status: string;
  updated: number;
  deleted?: boolean;
};
const groups = [
  'Tất cả',
  'Facebook',
  'ADS',
  'Gmail',
  'YouTube',
  'E-commerce',
  'Khác',
];
const statuses = ['Bình thường', 'Cần xử lý', 'Hết hạn', 'Vô hiệu hóa'];
const empty = (): Account => ({
  id: crypto.randomUUID(),
  name: '',
  account: '',
  phone: '',
  accountId: '',
  password: '',
  cookie: '',
  fa: '',
  sourceLine: '',
  group: 'Khác',
  status: 'Bình thường',
  updated: Date.now(),
});
function App() {
  const [accounts, setAccounts] = useState<Account[]>([]),
    [search, setSearch] = useState(''),
    [group, setGroup] = useState('Tất cả'),
    [status, setStatus] = useState('Tất cả'),
    [page, setPage] = useState(1),
    [size, setSize] = useState(50),
    [trash] = useState(false),
    [draft, setDraft] = useState<Account | null>(null),
    [shown, setShown] = useState<string[]>([]),
    [error, setError] = useState(''),
    [googleDialog, setGoogleDialog] = useState(false),
    [deleteTarget, setDeleteTarget] = useState<Account | null>(null),
    [quickEntry, setQuickEntry] = useState(''),
    [session, setSession] = useState<any>(null),
    [syncStatus, setSyncStatus] = useState('Chưa kết nối'),
    [retry, setRetry] = useState(0);
  const savedAccounts = useRef<Account[] | null>(null);
  const latestAccounts = useRef(accounts);
  const head = useRef<string | null>(null);
  const running = useRef(false);
  const stopped = useRef(false);
  latestAccounts.current = accounts;
  useEffect(() => {
    if (!session || savedAccounts.current === accounts || running.current || stopped.current) return;
    let timer = window.setTimeout(async () => {
      running.current = true; setSyncStatus('Đang lưu lên Google Drive…');
      const snapshot = latestAccounts.current;
      try {
        const result = await saveRevision(session.remote, session.password, head.current, snapshot);
        head.current = result.head; savedAccounts.current = snapshot;
        setSyncStatus(latestAccounts.current === snapshot ? 'Đã lưu lên Google Drive' : 'Đang chờ lưu…');
      } catch (e: any) {
        stopped.current = true;
        setSyncStatus(e?.message === 'VAULT_CONFLICT' ? 'Xung đột dữ liệu: chưa lưu. Giữ trang mở để tránh mất thay đổi.' : 'Lưu thất bại: giữ trang mở và thử lại.');
      } finally { running.current = false; setRetry(v => v + 1); }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [accounts, session, retry]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (session && savedAccounts.current !== latestAccounts.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', handler); return () => window.removeEventListener('beforeunload', handler);
  }, [session]);
  const active = accounts.filter(a => !!a.deleted === trash);
  const result = queryAccounts(active, {
    search,
    group,
    status,
    page,
    pageSize: size,
  });
  const isEditing = !!draft && accounts.some(account => account.id === draft.id);
  function save() {
    try {
      if (!isEditing) {
        const lines = quickEntry.split(/\r?\n/).filter(line => line.trim() && !/^\s*\|?[\s:|-]+\|?\s*$/.test(line));
        if (!lines.length) {
          setError('Vui lòng dán ít nhất một dòng tài khoản.');
          return;
        }
        const parsed: Account[] = [];
        for (let i = 0; i < lines.length; i++) {
          let fields;
          try {
            fields = splitAccountLine(lines[i]);
          } catch {
            setError(`Không xác định được ID và mật khẩu tại dòng ${i + 1}. Chưa thêm dòng nào.`);
            return;
          }
          const {accountId, password, email, cookie, fa} = fields;
          parsed.push({ ...empty(), group: draft?.group || 'Khác', name: accountId, accountId, account: email, password, cookie, fa, sourceLine: lines[i] });
        }
        setAccounts(prev => [...prev, ...parsed]);
        if (group !== 'Tất cả' && draft?.group) setGroup(draft.group);
        setStatus('Tất cả');
        setSearch('');
        setPage(1);
      } else {
        const account = validateAccount(draft);
        setAccounts(prev => prev.map(item => item.id === account.id ? { ...account, updated: Date.now() } : item));
      }
      setDraft(null);
      setQuickEntry('');
      setError('');
    } catch {
      setError('Vui lòng nhập tên tài khoản.');
    }
  }
  function del(a: Account, deleted: boolean) {
    setAccounts(prev => prev.map(x => (x.id === a.id ? { ...x, deleted } : x)));
  }
  function toggle(id: string) {
    setShown(v => (v.includes(id) ? v.filter(x => x !== id) : [...v, id]));
  }
  return (
    <>
      <header>
        <div className="brand">
          <img className="logo" src="https://raw.githubusercontent.com/theodoichatpage/ANYNOTE/d79eb8d8ad1e0e715052b66a26fc4b1306b9bbe3/assets/anynote-logo.png" alt="Logo AnyNote" />
          <div>
            <b>
              ANY<span>NOTE</span>
            </b>
            <small>Quản lý tài khoản · v1.0 thử nghiệm</small>
          </div>
        </div>
        <input
          className="search"
          placeholder="Tìm tên, tài khoản hoặc ID..."
          value={search}
          onChange={e => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <div className="connection" role="status">● {syncStatus}</div>
        <button className="primary" onClick={() => {
          if (!session) { setGoogleDialog(true); return; }
          if (running.current || savedAccounts.current !== latestAccounts.current) { setSyncStatus('Chưa lưu xong. Hãy giữ trang mở và thử lại.'); return; }
          savedAccounts.current = null; head.current = null; setAccounts([]); setSession(null); setShown([]); setSyncStatus('Chưa kết nối');
        }}>
          {session ? 'Khóa kho / đổi tài khoản' : 'Kết nối Google Drive'}
        </button>
      </header>
      <main>
        <div className="notice">{session ? syncStatus : 'Kết nối Google Drive để mở kho. Phiên bản đang thử nghiệm; chỉ dùng dữ liệu giả.'}{session && stopped.current && <button onClick={() => { stopped.current = false; setRetry(v => v + 1); }}>Thử lưu lại</button>}</div>
        <div className="stats">
          {[
            ['Tổng tài khoản', accounts.filter(a => !a.deleted).length],
            ...statuses.map(s => [
              s,
              accounts.filter(a => !a.deleted && a.status === s).length,
            ]),
          ].map(([label, n]) => (
            <div className="stat" key={label}>
              <small>{label}</small>
              <strong>{n}</strong>
              <div className="line" />
            </div>
          ))}
        </div>
        <section>
          <div className="list-bar">
          <div className="tabs">
            {groups.map(g => (
              <button
                className={group === g ? 'selected' : ''}
                key={g}
                onClick={() => {
                  setGroup(g);
                  setPage(1);
                }}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="list-toolbar">
            <label htmlFor="status-filter">Trạng thái</label>
            <select id="status-filter" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option>Tất cả</option>
              {statuses.map(s => <option key={s}>{s}</option>)}
            </select>
            <button className="primary" disabled={!session} onClick={() => setDraft({ ...empty(), group: group === 'Tất cả' ? 'Khác' : group })}>
              ＋ Thêm mới
            </button>
          </div>
          </div>
          <div className="table-wrap">
            <table>
              <colgroup><col className="col-name"/><col className="col-id"/><col className="col-password"/><col className="col-cookie"/><col className="col-fa"/><col className="col-status"/><col className="col-action"/></colgroup>
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>ID</th>
                  <th>Mật khẩu</th>
                  <th>Cookie</th>
                  <th>Mã FA</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result.items.map((a: Account) => (
                  <tr key={a.id} onDoubleClick={() => setDraft({ ...a })}>
                    <td>
                      <button
                        className="link"
                        onClick={() => setDraft({ ...a })}
                      >
                        {a.name}
                      </button>
                    </td>
                    <td>
                      {a.accountId || '—'} <Copy value={a.accountId} />
                    </td>
                    <td>
                      {a.password ? <div className="password-cell">
                        <span className="password-value">{shown.includes(a.id) ? a.password : '•'.repeat(a.password.length)}</span>
                        <button className="icon password-toggle" aria-label={shown.includes(a.id) ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => toggle(a.id)}>◉</button>
                        <Copy value={a.password} />
                      </div> : '—'}
                    </td>
                    <td>
                      {a.cookie ? <div className="cookie-cell">
                        <span className="cookie-value" title="Cookie nhận diện được">{a.cookie}</span>
                        <Copy value={a.cookie} />
                      </div> : '—'}
                    </td>
                    <td>
                      {a.fa ? <div className="cookie-cell"><span className="cookie-value">{a.fa}</span><Copy value={a.fa} /></div> : '—'}
                    </td>
                    <td>
                      <select className={`status-select status-${statuses.indexOf(a.status)}`} aria-label={`Trạng thái ${a.name}`} value={a.status} onChange={e => setAccounts(prev => prev.map(item => item.id === a.id ? { ...item, status: e.target.value, updated: Date.now() } : item))}>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <button onClick={() => trash ? del(a, false) : setDeleteTarget(a)}>
                        {trash ? 'Khôi phục' : 'Xóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!result.total && (
              <div className="empty">
                Chưa có tài khoản nào.
                <br />
                <small>Nhấn “Thêm tài khoản” để thử giao diện.</small>
              </div>
            )}
          </div>
          <div className="pager">
            <span>
              Hiển thị {result.total ? (result.page - 1) * size + 1 : 0}–
              {Math.min(result.page * size, result.total)} / {result.total} tài
              khoản
            </span>
            <select
              value={size}
              onChange={e => {
                setSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {[25, 50, 100].map(n => (
                <option key={n} value={n}>
                  {n} / trang
                </option>
              ))}
            </select>
            <div className="spacer" />
            <button disabled={result.page === 1} onClick={() => setPage(1)}>
              «
            </button>
            <button
              disabled={result.page === 1}
              onClick={() => setPage(result.page - 1)}
            >
              ‹
            </button>
            <span>
              {result.page} / {result.pages}
            </span>
            <button
              disabled={result.page === result.pages}
              onClick={() => setPage(result.page + 1)}
            >
              ›
            </button>
            <button
              disabled={result.page === result.pages}
              onClick={() => setPage(result.pages)}
            >
              »
            </button>
          </div>
        </section>
      </main>
      {deleteTarget && (
        <div className="overlay">
          <div className="modal confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="section-head"><b id="delete-title">Xác nhận xóa tài khoản</b><button aria-label="Đóng" onClick={() => setDeleteTarget(null)}>✕</button></div>
            <p>Bạn có chắc muốn xóa tài khoản <strong>{deleteTarget.name}</strong> khỏi danh sách?</p>
            <div className="modal-actions"><button onClick={() => setDeleteTarget(null)}>Hủy</button><button className="danger" onClick={() => { del(deleteTarget, true); setDeleteTarget(null); }}>Xác nhận xóa</button></div>
          </div>
        </div>
      )}
      {googleDialog && <GoogleConnect onClose={() => setGoogleDialog(false)} onConnected={(newSession, loadedAccounts) => { savedAccounts.current = loadedAccounts; head.current = newSession.head; stopped.current = false; setAccounts(loadedAccounts); setSession(newSession); setSyncStatus('Đã mở kho Google Drive'); setGoogleDialog(false); }} />}
      {draft && (
        <div className="overlay">
          <div className="modal">
            <div className="section-head">
              <b>{isEditing ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản'}</b>
              <button
                onClick={() => {
                  setDraft(null);
                  setQuickEntry('');
                  setError('');
                }}
              >
                ✕
              </button>
            </div>
            {!isEditing && (
              <div className="quick-entry">
                <label htmlFor="new-account-group">Nhóm tài khoản</label>
                <select id="new-account-group" value={draft.group} onChange={e => setDraft({ ...draft, group: e.target.value })}>
                  {groups.slice(1).map(g => <option key={g} value={g}>{g}</option>)}
                </select>
                <label htmlFor="quick-entry">Dán thông tin tài khoản</label>
                <textarea id="quick-entry" rows={6} autoComplete="off" spellCheck={false} value={quickEntry} placeholder="Mỗi dòng một tài khoản: ID | Mật khẩu | ..." onChange={e => setQuickEntry(e.target.value)} />
              </div>
            )}
            {isEditing && <div className="fields">
              {(
                [
                  ['name', 'Tên'],
                  ['account', 'Email'],
                  ['phone', 'Số điện thoại'],
                  ['accountId', 'ID'],
                  ['password', 'Mật khẩu'],
                  ['cookie', 'Cookie nhận diện được'],
                  ['fa', 'Mã FA đã lưu'],
                  ['sourceLine', 'Dòng gốc để kiểm tra'],
                ] as const
              ).map(([key, label]) => (
                <label key={key}>
                  {label}
                  <span className="field-control">
                    {key === 'cookie' || key === 'fa' || key === 'sourceLine' || key === 'password' ? (
                      <textarea rows={2} value={draft[key] || ''} spellCheck={false} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />
                    ) : (
                      <input type={key === 'phone' ? 'tel' : 'text'} value={draft[key] || ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })} />
                    )}
                  </span>
                </label>
              ))}
              <label>
                Nhóm
                <select
                  value={draft.group}
                  onChange={e => setDraft({ ...draft, group: e.target.value })}
                >
                  {groups.slice(1).map(g => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
              <label>
                Trạng thái
                <select
                  value={draft.status}
                  onChange={e => setDraft({ ...draft, status: e.target.value })}
                >
                  {statuses.map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>}
            {error && <p className="warning">{error}</p>}
            <div className="modal-actions">
              <button onClick={() => { setDraft(null); setQuickEntry(''); setError(''); }}>Đóng</button>
              <button className="primary" onClick={save}>
                {isEditing ? 'Lưu tạm' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
