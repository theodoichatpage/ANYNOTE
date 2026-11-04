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
test('concurrent revisions remain intact and trigger a conflict',async()=>{
 const r=remote();const root=await saveRevision(r,'pass',null,[]);
 const [a,b]=await Promise.allSettled([saveRevision(r,'pass',root.head,[{id:'a'}]),saveRevision(r,'pass',root.head,[{id:'b'}])]);
 assert.ok(a.status==='rejected' || b.status==='rejected');
 assert.equal(r.files.length,3);
 await assert.rejects(loadHistory(r,'pass'),/CONFLICT/);
});
