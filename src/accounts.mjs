export function validateAccount(a) {
 if (typeof a?.name !== 'string' || !a.name.trim()) throw new Error('Vui lòng nhập tên');
 return {...a, name:a.name.trim()};
}
export function queryAccounts(items, {search='',page=1,pageSize=50,group='Tất cả',status='Tất cả',sort='name'}={}) {
 const term=search.trim().toLocaleLowerCase('vi');
 const filtered=items.filter(a => (group==='Tất cả'||a.group===group) && (status==='Tất cả'||a.status===status) && [a.name,a.account,a.accountId].some(v=>String(v||'').toLocaleLowerCase('vi').includes(term)));
 filtered.sort((a,b)=>sort==='updated' ? (b.updated||0)-(a.updated||0) : a.name.localeCompare(b.name,'vi'));
 const pages=Math.max(1,Math.ceil(filtered.length/pageSize)); const current=Math.min(Math.max(1,page),pages);
 return {items:filtered.slice((current-1)*pageSize,current*pageSize),total:filtered.length,page:current,pages};
}
