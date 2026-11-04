import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateTotp} from '../src/totp.mjs';
test('TOTP matches RFC 6238 SHA-1 vector at 59 seconds',async()=>{
 assert.equal(await generateTotp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',59000,8),'94287082');
});
test('invalid base32 secret is rejected',async()=>{
 await assert.rejects(()=>generateTotp('not valid!',59000));
});
