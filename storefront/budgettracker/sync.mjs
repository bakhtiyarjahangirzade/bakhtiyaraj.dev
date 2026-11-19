// RLS also permits managers to read team data. Personal sync must always scope by owner.
export async function readOwnEntries(client, userId, cursor, onRows, pageSize = 500) {
  let offset = 0, next = cursor;
  while (true) {
    let query = client.from('bt_entries')
      .select('id,kind,amount,category,note,entry_date,created_at,updated_at,deleted_at,photo_path')
      .eq('user_id',userId).order('updated_at',{ascending:true}).order('id',{ascending:true});
    // Inclusive cursor prevents skipping records sharing a timestamp at the page boundary.
    if (cursor) query=query.gte('updated_at',cursor);
    const {data,error} = await query.range(offset,offset+pageSize-1);
    if(error)throw error;
    onRows(data);
    if(data.length)next=data.at(-1).updated_at;
    if(data.length<pageSize)return next;
    offset+=pageSize;
  }
}
export const entryRow = e => ({id:e.id,kind:e.kind,amount:e.amount,category:e.category,note:e.note,entry_date:e.date,created_at:e.created_at,deleted_at:e.deleted_at||null,photo_path:e.photo_path||null});
export function acknowledgeEntries(entries,pending,uploaded) {
  for(const row of uploaded){const local=entries.find(e=>e.id===row.id);if(local&&JSON.stringify(entryRow(local))===JSON.stringify(row))pending.delete(row.id);}
}
export async function readOwnTable(client,table,columns,owner,order) {
  const all=[];
  for(let offset=0;;offset+=500){
    const {data,error}=await client.from(table).select(columns).eq('user_id',owner).order(order,{ascending:false}).range(offset,offset+499);
    if(error)throw error;all.push(...data);if(data.length<500)return all;
  }
}

export async function dailyEntryId(owner,date,kind){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`kuryebro-daily:${owner}:${date}:${kind}`))).slice(0,16);bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;
 const h=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
