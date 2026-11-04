import {analyzeHistory} from './history.mjs';

// These revisions are protected by the user's Google account, not a separate vault password.
export async function loadGoogleAccounts(remote) {
  const files = await remote.list();
  const revisions = [];
  for (const file of files) {
    const revision = await remote.read(file.id);
    if (!revision || revision.format !== 'anynote-google-v1' || typeof revision.id !== 'string' || !(revision.parent === null || typeof revision.parent === 'string') || !Array.isArray(revision.accounts) || revision.accounts.some(a => !a || typeof a !== 'object' || typeof a.id !== 'string')) throw new Error('STORAGE_INVALID_REVISION');
    revisions.push(revision);
  }
  const history = analyzeHistory(revisions);
  if (history.conflict) throw new Error('VAULT_CONFLICT');
  if (!history.heads.length) return {head:null, accounts:[]};
  const current = revisions.find(r => r.id === history.heads[0]);
  return {head:current.id, accounts:current.accounts};
}
export async function saveGoogleAccounts(remote,expectedHead,accounts) {
  if (!Array.isArray(accounts) || accounts.some(a => !a || typeof a.id !== 'string')) throw new Error('STORAGE_INVALID_DATA');
  const current = await loadGoogleAccounts(remote);
  if (current.head !== expectedHead) throw new Error('VAULT_CONFLICT');
  const revision = {format:'anynote-google-v1',id:crypto.randomUUID(),parent:expectedHead,accounts};
  await remote.upload(revision);
  const confirmed = await loadGoogleAccounts(remote);
  if (confirmed.head !== revision.id) throw new Error('VAULT_CONFLICT');
  return confirmed;
}
