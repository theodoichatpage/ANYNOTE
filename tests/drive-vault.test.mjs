import {test} from 'node:test';
import assert from 'node:assert/strict';
import {listVaultFiles,uploadVaultRevision} from '../src/vault/drive.mjs';

test('lists all pages in the private app folder', async () => {
  const requests=[];
  const fetcher=async (url,opts)=>{requests.push([url,opts]);return new Response(JSON.stringify(requests.length===1?{files:[{id:'one'}],nextPageToken:'next'}:{files:[{id:'two'}]}),{status:200});};
  assert.deepEqual(await listVaultFiles('token',fetcher),[{id:'one'},{id:'two'}]);
  assert.match(requests[0][0],/spaces=appDataFolder/);
  assert.match(requests[1][0],/pageToken=next/);
});
test('uploads a fresh encrypted revision and never includes plaintext',async()=>{
  let sent;
  const envelope={version:1,cipher:'AES-256-GCM',kdf:{algorithm:'argon2id',memoryKiB:19456,iterations:2,parallelism:1,keyBytes:32},salt:Array(16).fill(0),nonce:Array(12).fill(0),ciphertext:Array(16).fill(1)};
  const fetcher=async (url,opts)=>{sent={url,opts};return new Response(JSON.stringify({id:'id1'}),{status:200})};
  assert.equal((await uploadVaultRevision('token',envelope,fetcher)).id,'id1');
  assert.equal(sent.opts.method,'POST');
  assert.match(sent.opts.body,/appDataFolder/);
  assert.doesNotMatch(sent.opts.body,/password-test/);
});
test('refuses plaintext and fails on Drive errors', async()=>{
  await assert.rejects(uploadVaultRevision('token',{accounts:[{password:'password-test'}]},async()=>{throw Error('must not send')}));
  await assert.rejects(listVaultFiles('token',async()=>new Response('',{status:403})));
});
