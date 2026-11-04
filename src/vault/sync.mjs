import {encryptVault, decryptVault} from './crypto.mjs';
import {analyzeHistory} from './history.mjs';

// Revision identity and parent are inside the authenticated ciphertext.
export async function loadHistory(remote,password) {
  const files = await remote.list();
  const revisions = [];
  for (const file of files) {
    const revision = await decryptVault(await remote.read(file.id),password);
    if (!revision || typeof revision.id !== 'string' || !(revision.parent === null || typeof revision.parent === 'string') || !Array.isArray(revision.accounts)) throw new Error('VAULT_INVALID_REVISION');
    revisions.push(revision);
  }
  const history = analyzeHistory(revisions);
  if (history.conflict) throw new Error('VAULT_CONFLICT');
  if (!history.heads.length) return {head:null,accounts:[]};
  const current = revisions.find(revision => revision.id === history.heads[0]);
  return {head:current.id,accounts:current.accounts};
}
export async function saveRevision(remote,password,expectedHead,accounts) {
  if (!Array.isArray(accounts)) throw new Error('VAULT_INVALID_DATA');
  const current = await loadHistory(remote,password);
  if (current.head !== expectedHead) throw new Error('VAULT_CONFLICT');
  const revision = {id:crypto.randomUUID(),parent:expectedHead,accounts};
  await remote.upload(await encryptVault(revision,password));
  // Concurrent devices may both create a child; callers must re-read and report conflicts.
  const confirmed = await loadHistory(remote,password);
  if (confirmed.head !== revision.id) throw new Error('VAULT_CONFLICT');
  return confirmed;
}
