import { argon2idAsync } from '@noble/hashes/argon2';

// Versioned envelope. Parameters are authenticated and validated before use.
const PARAMETERS = Object.freeze({ algorithm: 'argon2id', memoryKiB: 19456, iterations: 2, parallelism: 1, keyBytes: 32 });
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const MAX_CIPHERTEXT = 16 * 1024 * 1024;

function bytes(value, length, maxLength = length) {
  if (!Array.isArray(value) || value.length < length || value.length > maxLength || !value.every(n => Number.isInteger(n) && n >= 0 && n <= 255)) throw new Error('VAULT_INVALID_FORMAT');
  return Uint8Array.from(value);
}
function metadata(salt, nonce) {
  return { version: 1, cipher: 'AES-256-GCM', kdf: { ...PARAMETERS }, salt: Array.from(salt), nonce: Array.from(nonce) };
}
async function keyFor(password, salt) {
  if (typeof password !== 'string' || !password || password.length > 1024) throw new Error('VAULT_INVALID_PASSWORD');
  const passwordBytes = encoder.encode(password);
  let key;
  try {
    key = await argon2idAsync(passwordBytes, salt, { m: PARAMETERS.memoryKiB, t: PARAMETERS.iterations, p: PARAMETERS.parallelism, dkLen: PARAMETERS.keyBytes });
    return await crypto.subtle.importKey('raw', key, 'AES-GCM', false, ['encrypt', 'decrypt']);
  } finally {
    passwordBytes.fill(0);
    key?.fill(0);
  }
}
export async function encryptVault(data, password) {
  const text = JSON.stringify(data);
  if (typeof text !== 'string') throw new Error('VAULT_INVALID_DATA');
  const plaintext = encoder.encode(text);
  if (plaintext.length > MAX_CIPHERTEXT - 16) throw new Error('VAULT_TOO_LARGE');
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  const header = metadata(salt, nonce);
  try {
    const key = await keyFor(password, salt);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, additionalData: encoder.encode(JSON.stringify(header)), tagLength: 128 }, key, plaintext);
    return { ...header, ciphertext: Array.from(new Uint8Array(encrypted)) };
  } finally { plaintext.fill(0); }
}
export async function decryptVault(envelope, password) {
  if (!envelope || envelope.version !== 1 || envelope.cipher !== 'AES-256-GCM' || !envelope.kdf || Object.keys(PARAMETERS).some(k => envelope.kdf[k] !== PARAMETERS[k]) || Object.keys(envelope.kdf).length !== Object.keys(PARAMETERS).length) throw new Error('VAULT_INVALID_FORMAT');
  const salt = bytes(envelope.salt, 16);
  const nonce = bytes(envelope.nonce, 12);
  const encrypted = bytes(envelope.ciphertext, 16, MAX_CIPHERTEXT);
  const header = metadata(salt, nonce);
  const key = await keyFor(password, salt);
  let plaintext;
  try {
    plaintext = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, additionalData: encoder.encode(JSON.stringify(header)), tagLength: 128 }, key, encrypted));
    return JSON.parse(decoder.decode(plaintext));
  } catch { throw new Error('VAULT_UNLOCK_FAILED'); }
  finally { plaintext?.fill(0); }
}
