// Deterministic authenticated backend for browser tests; never contacts production.
export const mockBackend=`
const owner='11111111-1111-4111-8111-111111111111';
window.__backendCalls=[];
let data=JSON.parse(localStorage.getItem('test.backend')||'{}');
class Query{
 constructor(table){this.table=table;this.filters=[];this.operation='read';this.rows=null;this.single=false;}
 select(){return this} eq(key,value){this.filters.push([key,value]);return this} gte(){return this} order(){return this} limit(){return this} range(){return this}
 maybeSingle(){this.single=true;return this}upsert(rows){this.operation='upsert';this.rows=Array.isArray(rows)?rows:[rows];return this} insert(rows){return this.upsert(rows)}delete(){this.operation='delete';return this}
 then(resolve,reject){return this.run().then(resolve,reject)}
 async run(){
  window.__backendCalls.push({table:this.table,operation:this.operation,filters:this.filters});
  if(!navigator.onLine)return {error:new Error('offline')};
  if(this.table==='bt_admins')return {data:null};
  if(this.table==='bt_profiles')return {data:{nickname:'test.courier',currency:'AZN'}};
  if(this.operation==='upsert'){
   const target=data[this.table]||[];
   for(const r of this.rows){const index=target.findIndex(e=>e.id?r.id===e.id:e.day?r.day===e.day:true),row={...r,updated_at:new Date().toISOString()};if(index<0)target.push(row);else target[index]=row}
   data[this.table]=target;localStorage.setItem('test.backend',JSON.stringify(data));return {data:null};
  }
  const rows=(data[this.table]||[]).filter(row=>this.filters.every(([key,value])=>row[key]===value));
  return {data:this.single?rows[0]||null:rows};
 }
}
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{id:owner,email:'test@example.invalid'}}}}),onAuthStateChange:()=>{},signOut:async()=>({})},from:table=>new Query(table),rpc:async()=>({data:null}),storage:{from:()=>({upload:async()=>({})})}})};
`;
