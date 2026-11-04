import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadGoogleAccounts,saveGoogleAccounts} from '../src/vault/google-storage.mjs';
function remote(){const files=[];return {files,list:async()=>files.map((_,i)=>({id:String(i)})),read:async id=>files[Number(id)],upload:async v=>{files.push(structuredClone(v))}}}
test('new accounts are saved and restored using the same Google storage',async()=>{const r=remote();assert.deepEqual(await loadGoogleAccounts(r),{head:null,accounts:[]});const saved=await saveGoogleAccounts(r,null,[{id:'fake',password:'example'}]);assert.equal(saved.accounts[0].id,'fake');assert.deepEqual(await loadGoogleAccounts(r),saved)});
test('stale writes do not replace an existing revision',async()=>{const r=remote();await saveGoogleAccounts(r,null,[{id:'a'}]);await assert.rejects(saveGoogleAccounts(r,null,[{id:'b'}]),/CONFLICT/);assert.equal(r.files.length,1)});
test('invalid data cannot be interpreted as an empty account list',async()=>{const r=remote();r.files.push({id:'x',parent:null});await assert.rejects(loadGoogleAccounts(r),/INVALID/)});
