import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadHistory,saveRevision} from '../src/vault/sync.mjs';
function remote() {const files=[];return {files, list:async()=>files.map((v,i)=>({id:String(i)})),read:async(id)=>files[+id], upload:async(v)=>{files.push(v)}};}
test('round trip restores an encrypted revision and rejects wrong password',async()=>{
 const r=remote(); await saveRevision(r,'pass',null,[{id:'sample',password:'example'}]);
 assert.equal(JSON.stringify(r.files).includes('example'),false);
 const loaded=await loadHistory(r,'pass');assert.deepEqual(loaded.accounts,[{id:'sample',password:'example'}]);
 await assert.rejects(loadHistory(r,'wrong'));
});
test('rejects stale writes and preserves the existing revisions',async()=>{
 const r=remote();await saveRevision(r,'pass',null,[]);
 await assert.rejects(saveRevision(r,'pass',null,[]),/CONFLICT/);
 assert.equal(r.files.length,1);
});
