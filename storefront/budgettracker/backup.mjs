import {validDate,cents} from './core.mjs';

export const MAX_BACKUP_BYTES=50*1024*1024;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const currencies=['AZN','PLN','EUR','USD','RUB','TRY'];
const fail=()=>{throw new Error('invalid-backup')};
const number=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
const timestamp=s=>typeof s==='string'&&Number.isFinite(Date.parse(s));
const zone=s=>{if(s==null)return undefined;try{new Intl.DateTimeFormat('en',{timeZone:s});return s}catch{fail()}};
const text=(s,max)=>typeof s==='string'&&s.length<=max;
const array=(a,max)=>Array.isArray(a)&&a.length<=max;
function unique(rows){const ids=new Set();for(const row of rows){if(!uuid.test(row.id)||ids.has(row.id))fail();ids.add(row.id);}}
function points(value){
 if(!array(value,20000))fail();let previous=0;
 for(const p of value){if(!array(p,3)||p.length!==3||!number(p[0],-90,90)||!number(p[1],-180,180)||!number(p[2],1,1e11)||p[2]<previous)fail();previous=p[2];}
 return value.map(p=>[...p]);
}
export function parseBackup(raw){
 if(typeof raw!=='string'||new TextEncoder().encode(raw).byteLength>MAX_BACKUP_BYTES)fail();
 let b;try{b=JSON.parse(raw)}catch{fail()}
 if(!b||b.format!=='kuryebro'||![1,2].includes(b.version)||!currencies.includes(b.currency)||!timestamp(b.created_at))fail();
 if(b.ownerId!=null&&!uuid.test(b.ownerId))fail();
 if(!array(b.entries,100000)||!array(b.sessions,10000)||!array(b.fixed,10000)||!array(b.photos,10000)||!b.days||typeof b.days!=='object'||Array.isArray(b.days)||Object.keys(b.days).length>20000)fail();
 unique(b.entries);unique(b.sessions);unique(b.fixed);
 const entries=b.entries.map(e=>{
  if(!['sale','expense','income'].includes(e.kind)||!number(e.amount,.01,999999999.99)||Math.abs(cents(e.amount)/100-e.amount)>1e-6||!text(e.category,40)||!text(e.note,200)||!validDate(e.date)||!timestamp(e.created_at)||(e.deleted_at!=null&&!timestamp(e.deleted_at)))fail();
  return {id:e.id,kind:e.kind,amount:cents(e.amount)/100,category:e.category,note:e.note,date:e.date,created_at:e.created_at,deleted_at:e.deleted_at||null,hasPhoto:!!e.photo_path};
 });
 const sessions=b.sessions.map(s=>{
  if(!timestamp(s.started_at)||!timestamp(s.ended_at)||Date.parse(s.ended_at)<Date.parse(s.started_at)||!number(s.distance_m,0,1e8)||!number(s.duration_s,0,1e8))fail();
  return {id:s.id,time_zone:zone(s.time_zone),started_at:s.started_at,ended_at:s.ended_at,distance_m:s.distance_m,duration_s:s.duration_s,points:points(s.points||[])};
 });
 const fixed=b.fixed.map(f=>{
  if(!text(f.name,60)||!number(f.amount,.01,999999999.99)||!['week','month'].includes(f.period)||(f.deleted_at!=null&&!timestamp(f.deleted_at)))fail();
  return {id:f.id,name:f.name,amount:f.amount,period:f.period,deleted_at:f.deleted_at||null};
 });
 const days={};for(const [date,d] of Object.entries(b.days)){if(!validDate(date)||!d||!number(d.km,0,4999.9)||!number(d.hours,0,24))fail();days[date]={km:d.km,hours:d.hours};}
 if(!b.goals||!number(b.goals.daily,0,999999999.99)||!Number.isInteger(b.goals.days)||!number(b.goals.days,1,7))fail();
 const photos=new Map();let bytes=0;
 for(const photo of b.photos){
  if(!uuid.test(photo.id)||photos.has(photo.id)||typeof photo.data!=='string'||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.data)||photo.data.length>7*1024*1024)fail();
  bytes+=photo.data.length;if(bytes>MAX_BACKUP_BYTES)fail();photos.set(photo.id,photo.data);
 }
 if(entries.some(e=>e.hasPhoto&&!e.deleted_at&&!photos.has(e.id)))fail();
 let active=null;
 if(b.active){const a=b.active;if(!uuid.test(a.id)||!timestamp(a.started_at)||Date.parse(a.started_at)>Date.parse(b.created_at)||!number(a.distance_m,0,1e8))fail();active={id:a.id,time_zone:zone(a.time_zone),started_at:a.started_at,ended_at:b.created_at,distance_m:a.distance_m,duration_s:Math.round((Date.parse(b.created_at)-Date.parse(a.started_at))/1000),points:points(a.points||[])};}
 return {format:b.format,version:b.version,currency:b.currency,created_at:b.created_at,ownerId:b.ownerId||null,entries,sessions,fixed,days,goals:{daily:b.goals.daily,days:b.goals.days},photos,active};
}
async function importId(owner,source){
 const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`kuryebro-import:${owner}:${source}`))).slice(0,16);
 bytes[6]=(bytes[6]&15)|80;bytes[8]=(bytes[8]&63)|128;
 const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
const sameEntry=(a,b)=>['kind','amount','category','note','date','deleted_at'].every(k=>(a[k]??null)===(b[k]??null));
export async function planRestore(backup,current,owner){
 if(backup.currency!==current.currency)throw new Error('currency-mismatch');
 const plan={entries:[],sessions:[],fixed:[],days:{},photos:[],skipped:0,conflicts:0,closedShift:!!backup.active,goals:backup.goals,sourceDate:backup.created_at};
 const own=backup.ownerId===owner;
 for(const source of backup.entries){
  const id=own?source.id:await importId(owner,source.id),existing=current.entries.find(e=>e.id===source.id||e.id===id);
  if(existing){plan.skipped++;if(!sameEntry(existing,source))plan.conflicts++;continue;}
  const {hasPhoto,...entry}=source;entry.id=id;
  if(hasPhoto&&!entry.deleted_at){entry.photo_path=`${owner}/${id}.jpg`;plan.photos.push({id,data:backup.photos.get(source.id)});}
  plan.entries.push(entry);
 }
 for(const source of [...backup.sessions,...(backup.active?[backup.active]:[])]){
  const id=own?source.id:await importId(owner,source.id);if(current.sessions.some(s=>s.id===source.id||s.id===id)||plan.sessions.some(s=>s.id===id)){plan.skipped++;continue;}
  plan.sessions.push({...source,id,dirty:true,routeCached:true});
 }
 for(const source of backup.fixed){const id=own?source.id:await importId(owner,source.id);if(current.fixed.some(f=>f.id===source.id||f.id===id)){plan.skipped++;continue;}plan.fixed.push({...source,id,dirty:true});}
 for(const [day,value] of Object.entries(backup.days)){if(Object.hasOwn(current.days,day)){plan.skipped++;continue;}plan.days[day]={...value,dirty:true};}
 return plan;
}
