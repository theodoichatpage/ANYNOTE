import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseSheetUrl, readSheet} from '../sync/google-sheet.mjs';
test('extracts the sheet identifier and tab identifier from a Google Sheets URL',()=>{
 assert.deepEqual(parseSheetUrl('https://docs.google.com/spreadsheets/d/test-sheet_123/edit#gid=42'),{spreadsheetId:'test-sheet_123',gid:42});
});
test('rejects non-Google URLs and malformed tab IDs',()=>{
 assert.throws(()=>parseSheetUrl('https://example.com/spreadsheets/d/test/edit#gid=2'));
 assert.throws(()=>parseSheetUrl('https://docs.google.com/spreadsheets/d/test/edit#gid=abc'));
});
test('reads selected sheet without modifying the original values',async()=>{
 const responses=[{sheets:[{properties:{sheetId:42,title:'Accounts'}}]},{values:[['123','demo','SECRET'],['456','demo2']]}];
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>responses.shift()}};
 const result=await readSheet({spreadsheetId:'test-sheet_123',gid:42,accessToken:'test-token',fetcher});
 assert.deepEqual(result.rows,[['123','demo','SECRET'],['456','demo2']]);
 assert.equal(result.title,'Accounts');assert.equal(calls.length,2);assert.equal(calls[0].options.headers.Authorization,'Bearer test-token');
 assert.ok(calls[1].url.includes('Accounts'));
});
test('fails if requested tab does not exist',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>({sheets:[]})});
 await assert.rejects(()=>readSheet({spreadsheetId:'test',gid:42,accessToken:'test-token',fetcher}),/SHEET_TAB_NOT_FOUND/);
});
