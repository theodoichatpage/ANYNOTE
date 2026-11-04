/** Read-only access: never logs tokens or spreadsheet data. */
export function parseSheetUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com' || url.port || url.username || url.password) throw new Error('INVALID_SHEET_URL');
  const match = url.pathname.match(/^\/spreadsheets\/d\/([A-Za-z0-9_-]+)(?:\/|$)/);
  if (!match) throw new Error('INVALID_SHEET_URL');
  const hash = new URLSearchParams(url.hash.slice(1));
  const rawGid = hash.get('gid') ?? url.searchParams.get('gid') ?? '0';
  if (!/^\d+$/.test(rawGid) || !Number.isSafeInteger(Number(rawGid))) throw new Error('INVALID_SHEET_GID');
  return {spreadsheetId: match[1], gid: Number(rawGid)};
}
export async function readSheet({spreadsheetId, gid, accessToken, fetcher = globalThis.fetch}) {
  if (!/^[A-Za-z0-9_-]+$/.test(spreadsheetId) || !Number.isSafeInteger(gid) || gid < 0 || typeof accessToken !== 'string' || !accessToken) throw new Error('INVALID_SHEET_REQUEST');
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
  const request = async url => {
    const response = await fetcher(url, {headers: {Authorization: `Bearer ${accessToken}`}, redirect:'error'});
    if (!response.ok) throw new Error(`SHEETS_API_ERROR_${response.status}`);
    return response.json();
  };
  const metadata = await request(`${base}?fields=sheets.properties(sheetId,title)`);
  const tab = metadata.sheets?.find(item => item.properties?.sheetId === gid);
  if (!tab || typeof tab.properties.title !== 'string') throw new Error('SHEET_TAB_NOT_FOUND');
  const title = tab.properties.title;
  const range = `'${title.replace(/'/g,"''")}'`;
  const result = await request(`${base}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`);
  return {title, rows: result.values ?? []};
}
