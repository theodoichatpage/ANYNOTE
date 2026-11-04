import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeHistory} from '../src/vault/history.mjs';
test('identifies a single current head in a chain',()=>{
 const result=analyzeHistory([{id:'a',parent:null},{id:'b',parent:'a'},{id:'c',parent:'b'}]);
 assert.deepEqual(result,{heads:['c'],missing:[],conflict:false});
});
test('detects concurrent changes from two devices without selecting a winner',()=>{
 const result=analyzeHistory([{id:'a',parent:null},{id:'b',parent:'a'},{id:'c',parent:'a'}]);
 assert.deepEqual(result.heads,['b','c']);assert.equal(result.conflict,true);
});
test('reports missing parents and rejects duplicate ids or cycles',()=>{
 assert.deepEqual(analyzeHistory([{id:'b',parent:'a'}]).missing,['a']);
 assert.throws(()=>analyzeHistory([{id:'a',parent:null},{id:'a',parent:null}]));
 assert.throws(()=>analyzeHistory([{id:'a',parent:'b'},{id:'b',parent:'a'}]));
});
