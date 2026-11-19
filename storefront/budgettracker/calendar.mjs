const formats=new Map();
export function dayAt(epoch,zone=Intl.DateTimeFormat().resolvedOptions().timeZone){
 let format=formats.get(zone);if(!format){format=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'});formats.set(zone,format)}
 const parts=Object.fromEntries(format.formatToParts(new Date(epoch)).map(p=>[p.type,p.value]));return `${parts.year}-${parts.month}-${parts.day}`;
}
const distance=(a,b)=>{const rad=n=>n*Math.PI/180,h=Math.sin(rad(b[0]-a[0])/2)**2+Math.cos(rad(a[0]))*Math.cos(rad(b[0]))*Math.sin(rad(b[1]-a[1])/2)**2;return 6371000*2*Math.asin(Math.min(1,Math.sqrt(h)))};
// Split at real local midnights, including 23/25-hour DST days. Never add 24 hours to a date.
export function splitSession(session,fallbackZone){
 const start=Date.parse(session.started_at),end=Date.parse(session.ended_at),zone=session.time_zone||fallbackZone;
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return [];
 const parts=[];let cursor=start;
 while(cursor<end&&parts.length<4000){
  const day=dayAt(cursor,zone);let boundary=end;
  if(dayAt(end-1,zone)!==day){
   let lo=cursor,hi=Math.min(end,cursor+36*3600000);
   while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(dayAt(mid,zone)===day)lo=mid;else hi=mid;}boundary=hi;
  }
  parts.push({day,start:cursor,end:boundary,seconds:(boundary-cursor)/1000,km:0,movingSeconds:0,movingKm:0});cursor=boundary;
 }
 const pts=session.points||[];
 for(let i=1;i<pts.length;i++){
  const a=pts[i-1],b=pts[i],dt=b[2]-a[2];if(dt<=0)continue;const meters=distance(a,b),speed=meters/dt;
  if(speed>=45)continue;
  for(const part of parts){const overlap=Math.max(0,Math.min(part.end,b[2]*1000)-Math.max(part.start,a[2]*1000))/1000;if(!overlap)continue;part.km+=meters/1000*overlap/dt;if(speed>=1){part.movingSeconds+=overlap;part.movingKm+=meters/1000*overlap/dt;}}
 }
 const totalKm=Math.max(0,Number(session.distance_m)||0)/1000,observed=parts.reduce((sum,p)=>sum+p.km,0);
 for(const part of parts)part.km=observed>0?part.km/observed*totalKm:part.seconds/((end-start)/1000)*totalKm;
 // Correct only roundoff so the split always sums to the stored session distance.
 if(parts.length)parts.at(-1).km+=totalKm-parts.reduce((sum,p)=>sum+p.km,0);
 return parts;
}
export function sessionsInRange(sessions,from,to,zone){
 const parts=sessions.flatMap(s=>splitSession(s,zone)).filter(p=>p.day>=from&&p.day<=to);
 const sum=key=>parts.reduce((n,p)=>n+p[key],0),mv=sum('movingSeconds');
 return {km:sum('km'),sec:sum('seconds'),mv,kmh:mv>=30?sum('movingKm')/(mv/3600):null};
}
