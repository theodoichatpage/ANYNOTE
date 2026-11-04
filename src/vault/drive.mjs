// These methods only transport encrypted, immutable revisions. They do not resolve conflicts.
const API = 'https://www.googleapis.com/drive/v3/files';
const NAME = 'anynote-vault-revision-v1';
const GOOGLE_NAME = 'anynote-google-accounts-v1';
function headers(token) {
  if (typeof token !== 'string' || !token) throw new Error('DRIVE_AUTH_REQUIRED');
  return {Authorization: `Bearer ${token}`};
}
async function responseJSON(response) {
  if (!response.ok) throw new Error(response.status === 401 ? 'DRIVE_AUTH_EXPIRED' : 'DRIVE_REQUEST_FAILED');
  return response.json();
}
async function listFiles(token, name, fetcher = fetch) {
  const results = [];
  let next;
  const seen = new Set();
  do {
    const params = new URLSearchParams({spaces:'appDataFolder',q:`name = '${name}' and trashed = false`,fields:'nextPageToken,files(id,name)',pageSize:'100'});
    if (next) params.set('pageToken', next);
    const data = await responseJSON(await fetcher(`${API}?${params}`, {headers:headers(token),redirect:'error'}));
    if (!Array.isArray(data.files)) throw new Error('DRIVE_INVALID_RESPONSE');
    results.push(...data.files);
    next = data.nextPageToken;
    if (next && (seen.has(next) || results.length > 100000)) throw new Error('DRIVE_INVALID_RESPONSE');
    if (next) seen.add(next);
  } while (next);
  return results;
}
export const listVaultFiles = (token, fetcher = fetch) => listFiles(token, NAME, fetcher);
export const listGoogleFiles = (token, fetcher = fetch) => listFiles(token, GOOGLE_NAME, fetcher);
export async function readVaultRevision(token, id, fetcher = fetch) {
  if (typeof id !== 'string' || !id) throw new Error('DRIVE_INVALID_FILE');
  return responseJSON(await fetcher(`${API}/${encodeURIComponent(id)}?alt=media`,{headers:headers(token),redirect:'error'}));
}
export async function uploadVaultRevision(token, envelope, fetcher = fetch) {
  const validBytes = (v, size) => Array.isArray(v) && v.length === size && v.every(x => Number.isInteger(x) && x >= 0 && x <= 255);
  const k = envelope?.kdf;
  if (!envelope || Object.keys(envelope).sort().join(',') !== 'cipher,ciphertext,kdf,nonce,salt,version' || envelope.version !== 1 || envelope.cipher !== 'AES-256-GCM' || !k || Object.keys(k).sort().join(',') !== 'algorithm,iterations,keyBytes,memoryKiB,parallelism' || k.algorithm !== 'argon2id' || k.memoryKiB !== 19456 || k.iterations !== 2 || k.parallelism !== 1 || k.keyBytes !== 32 || !validBytes(envelope.salt,16) || !validBytes(envelope.nonce,12) || !Array.isArray(envelope.ciphertext) || envelope.ciphertext.length < 16 || envelope.ciphertext.length > 16*1024*1024 || !validBytes(envelope.ciphertext,envelope.ciphertext.length)) throw new Error('DRIVE_ENCRYPTED_REVISION_REQUIRED');
  const boundary = `anynote_${crypto.randomUUID().replaceAll('-','')}`;
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name:NAME,parents:['appDataFolder']})}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(envelope)}\r\n--${boundary}--`;
  return responseJSON(await fetcher('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{...headers(token),'Content-Type':`multipart/related; boundary=${boundary}`},body,redirect:'error'}));
}

export async function uploadGoogleRevision(token, revision, fetcher = fetch) {
  if (!revision || revision.format !== 'anynote-google-v1' || typeof revision.id !== 'string' || !(revision.parent === null || typeof revision.parent === 'string') || !Array.isArray(revision.accounts)) throw new Error('STORAGE_INVALID_REVISION');
  const boundary = `anynote_${crypto.randomUUID().replaceAll('-','')}`;
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({name:GOOGLE_NAME,parents:['appDataFolder']})}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(revision)}\r\n--${boundary}--`;
  return responseJSON(await fetcher('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{...headers(token),'Content-Type':`multipart/related; boundary=${boundary}`},body,redirect:'error'}));
}
