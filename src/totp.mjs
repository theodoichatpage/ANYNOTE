export async function generateTotp(secret, time = Date.now(), digits = 6) {
 const text = secret.replace(/[\s-]/g, '').replace(/=+$/, '').toUpperCase();
 if (!text || !/^[A-Z2-7]+$/.test(text)) throw new Error('Khóa TOTP không hợp lệ');
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits=0, value=0; const bytes=[];
 for (const ch of text) { value=(value<<5)|alphabet.indexOf(ch); bits+=5; if (bits>=8) {bits-=8; bytes.push((value>>bits)&255);} }
 if (!bytes.length || (bits && (value & ((1<<bits)-1)))) throw new Error('Khóa TOTP không hợp lệ');
 const counter=new Uint8Array(8); new DataView(counter.buffer).setBigUint64(0,BigInt(Math.floor(time/30000)));
 const key=await crypto.subtle.importKey('raw',new Uint8Array(bytes),{name:'HMAC',hash:'SHA-1'},false,['sign']);
 const hash=new Uint8Array(await crypto.subtle.sign('HMAC',key,counter)); const offset=hash[hash.length-1]&15;
 const binary=((hash[offset]&127)*0x1000000)+(hash[offset+1]<<16)+(hash[offset+2]<<8)+hash[offset+3];
 return String(binary % (10**digits)).padStart(digits,'0');
}
