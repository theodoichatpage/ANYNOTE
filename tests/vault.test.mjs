import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptVault, decryptVault } from '../src/vault/crypto.mjs';

test('encrypts account data and restores it with the master password', async () => {
  const data = { accounts: [{ id: 'sample-id', password: 'fake-password' }] };
  const blob = await encryptVault(data, 'test-master-password');
  assert.ok(!JSON.stringify(blob).includes('fake-password'));
  assert.deepEqual(await decryptVault(blob, 'test-master-password'), data);
});
test('rejects wrong password and modified ciphertext', async () => {
  const blob = await encryptVault({ accounts: [] }, 'test-master-password');
  await assert.rejects(decryptVault(blob, 'incorrect-password'));
  const altered = structuredClone(blob);
  altered.ciphertext[0] ^= 1;
  await assert.rejects(decryptVault(altered, 'test-master-password'));
});
test('uses fresh salt and nonce for every encryption', async () => {
  const a = await encryptVault({ accounts: [] }, 'test-master-password');
  const b = await encryptVault({ accounts: [] }, 'test-master-password');
  assert.notDeepEqual(a.salt, b.salt);
  assert.notDeepEqual(a.nonce, b.nonce);
});
test('rejects unrecognized KDF parameters before derivation', async () => {
  const blob = await encryptVault({ accounts: [] }, 'test-master-password');
  blob.kdf.memoryKiB = 999999999;
  await assert.rejects(decryptVault(blob, 'test-master-password'));
});
