import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryAccounts, validateAccount } from '../src/accounts.mjs';
test('search is case insensitive and searches ID', () => {
  const items = [{name:'Lan', account:'LAN@example.test', accountId:'ABC123', group:'Gmail', status:'Bình thường'}];
  assert.equal(queryAccounts(items, {search:'abc', page:1, pageSize:25}).total, 1);
  assert.equal(queryAccounts(items, {search:'lan@', page:1, pageSize:25}).total, 1);
});
test('pagination filters before slicing 5000 records and clamps page', () => {
 const items = Array.from({length:5000}, (_,i)=>({name:`User ${i}`,account:'',accountId:'',group:'Gmail',status:'Bình thường'}));
 const result = queryAccounts(items,{search:'',page:999,pageSize:50,group:'Gmail'});
 assert.equal(result.total,5000); assert.equal(result.page,100); assert.equal(result.items.length,50);
});
test('validation rejects blank names',()=>assert.throws(()=>validateAccount({name:'  '})));
