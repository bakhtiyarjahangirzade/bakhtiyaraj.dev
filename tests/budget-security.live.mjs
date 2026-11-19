import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const source=await readFile(new URL('../storefront/budgettracker/app.js',import.meta.url),'utf8');
const url=source.match(/SB_URL='([^']+)'/)[1],key=source.match(/SB_KEY='([^']+)'/)[1];
for(const table of ['bt_profiles','bt_entries','bt_goals','bt_admins','bt_days','bt_fixed','bt_sessions','bt_routes','bt_live']){
 const response=await fetch(`${url}/rest/v1/${table}?select=*&limit=1`,{headers:{apikey:key}});
 const body=await response.json();
 assert.ok([401,403].includes(response.status)||(response.ok&&Array.isArray(body)&&body.length===0),`Anonymous access denied for ${table}`);
 console.log(`${table}: anonymous access blocked (${response.status})`);
}
for(const rpc of ['bt_overview','bt_benchmarks']){
 const response=await fetch(`${url}/rest/v1/rpc/${rpc}`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:'{}'});
 assert.ok([401,403].includes(response.status),`Anonymous RPC access denied for ${rpc}`);
 console.log(`${rpc}: anonymous access blocked (${response.status})`);
}
