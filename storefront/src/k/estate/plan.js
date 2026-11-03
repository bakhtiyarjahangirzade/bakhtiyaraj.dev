// Floor plans drawn from a listing's room list. Pure string functions: used at build time (index.js) and in the browser (app.js).
// Every room is a rectangle whose area is exactly its stated m², so the drawing, the legend and the listing area agree.
const HAB=['liv','bed','kid','kl'],OUT=['bal','ter'],WET=['bath','wc'];
const r2=n=>Math.round(n*100)/100;

export function layout(plan){
 const total=plan.reduce((s,[,a])=>s+a,0);
 const top=plan.map(([t,a],i)=>({t,a,i})).filter(r=>HAB.includes(r.t));
 const rest=plan.map(([t,a],i)=>({t,a,i})).filter(r=>!HAB.includes(r.t));
 const W=Math.sqrt(total*1.45),sTop=top.reduce((s,r)=>s+r.a,0),sBot=total-sTop;
 const h1=sTop/W,h2=sBot/W,H=h1+h2;
 let x=0;for(const r of top){const w=r.a/h1;Object.assign(r,{x,y:0,w,h:h1});x+=w}
 // bottom band: outdoor | kitchen | hall | wet rooms stacked in one column
 const out=rest.filter(r=>OUT.includes(r.t)),kit=rest.filter(r=>r.t==='kit'),hall=rest.filter(r=>r.t==='hall'),wet=rest.filter(r=>WET.includes(r.t));
 x=0;for(const r of [...out,...kit,...hall]){const w=r.a/h2;Object.assign(r,{x,y:h1,w,h:h2});x+=w}
 const wa=wet.reduce((s,r)=>s+r.a,0),cw=wa/h2;let y=h1;
 for(const r of wet){const h=h2*r.a/wa;Object.assign(r,{x,y,w:cw,h});y+=h}
 const rooms=[...top,...rest].sort((a,b)=>a.i-b.i);
 return {W,H,h1,h2,rooms,total};
}

// opts: {mini, names:{type:label}, f1:n=>'12,4', f2:n=>'9,62', entry:'Entrance', scale:'1 m', title}
export function planSvg(plan,o={}){
 const L=layout(plan),m=o.mini?6:48,VB=o.mini?200:640,s=(VB-2*m)/L.W,Hpx=L.H*s+2*m;
 const X=v=>r2(m+v*s),Y=v=>r2(m+v*s);
 const wall=o.mini?2.4:6,iw=o.mini?1.2:2.4,door=0.82;
 const parts=[],walls=[],marks=[],labels=[];
 const hall=L.rooms.find(r=>r.t==='hall');
 const cls=t=>HAB.includes(t)?'pl-h':OUT.includes(t)?'pl-o':WET.includes(t)?'pl-w':t==='hall'?'pl-c':'pl-k';
 for(const r of L.rooms){
  parts.push(`<rect class="${cls(r.t)}" x="${X(r.x)}" y="${Y(r.y)}" width="${r2(r.w*s)}" height="${r2(r.h*s)}"/>`);
  walls.push(`<rect class="pl-iw" x="${X(r.x)}" y="${Y(r.y)}" width="${r2(r.w*s)}" height="${r2(r.h*s)}" stroke-width="${iw}"/>`);
 }
 walls.push(`<rect class="pl-ow" x="${X(0)}" y="${Y(0)}" width="${r2(L.W*s)}" height="${r2(L.H*s)}" stroke-width="${wall}"/>`);
 const gapH=(x0,y,len,sw)=>marks.push(`<line class="pl-gap" x1="${X(x0)}" y1="${Y(y)}" x2="${X(x0+len)}" y2="${Y(y)}" stroke-width="${sw+1}"/>`);
 const gapV=(x,y0,len,sw)=>marks.push(`<line class="pl-gap" x1="${X(x)}" y1="${Y(y0)}" x2="${X(x)}" y2="${Y(y0+len)}" stroke-width="${sw+1}"/>`);
 // door: gap + leaf + quarter swing; dir = which side the leaf opens to (+1 down/right, -1 up/left)
 const doorH=(x0,y,dir,sw=iw)=>{gapH(x0,y,door,sw);if(o.mini)return;const d=door*s,px=X(x0),py=Y(y);
  marks.push(`<path class="pl-door" d="M${px} ${py} L${px} ${r2(py+dir*d)} M${px} ${r2(py+dir*d)} A${r2(d)} ${r2(d)} 0 0 ${dir>0?0:1} ${r2(px+d)} ${py}"/>`)};
 const doorV=(x,y0,dir,sw=iw)=>{gapV(x,y0,door,sw);if(o.mini)return;const d=door*s,px=X(x),py=Y(y0);
  marks.push(`<path class="pl-door" d="M${px} ${py} L${r2(px+dir*d)} ${py} M${r2(px+dir*d)} ${py} A${r2(d)} ${r2(d)} 0 0 ${dir>0?1:0} ${px} ${r2(py+d)}"/>`)};
 const win=(x0,y,len)=>{gapH(x0,y,len,wall);if(o.mini)return;const a=Y(y)-wall/2+1,b=Y(y)+wall/2-1;
  marks.push(`<path class="pl-win" d="M${X(x0)} ${r2(a)} H${X(x0+len)} M${X(x0)} ${r2(b)} H${X(x0+len)} M${X(x0)} ${r2(Y(y))} H${X(x0+len)}"/>`)};
 const top=L.rooms.filter(r=>HAB.includes(r.t));
 for(const r of top){
  const wl=Math.min(1.6,r.w*0.5);win(r.x+(r.w-wl)/2,0,wl);
  if(!hall)continue;
  const ox0=Math.max(r.x,hall.x),ox1=Math.min(r.x+r.w,hall.x+hall.w);
  if(ox1-ox0>=door+0.2)doorH((ox0+ox1)/2-door/2,L.h1,-1);
  else{ // passage through the neighbour nearer the hall
   const right=r.x+r.w/2<hall.x+hall.w/2,xw=right?r.x+r.w:r.x;
   if(xw>0.01&&xw<L.W-0.01)doorV(xw,L.h1-door-0.25,right?-1:1);
  }
 }
 for(const r of L.rooms){
  if(r.t==='kit'){if(hall&&Math.abs(r.x+r.w-hall.x)<0.01)doorV(hall.x,r.y+0.25,-1);const wl=Math.min(1.4,r.w*0.5);win(r.x+(r.w-wl)/2,L.H,wl)}
  if(WET.includes(r.t)&&hall)doorV(r.x,r.y+Math.max(0.1,(r.h-door)/2),1);
  if(OUT.includes(r.t)){
   const above=top.find(t=>t.x<r.x+r.w/2&&t.x+t.w>r.x+r.w/2)||top[0];
   const ox0=Math.max(r.x,above.x),ox1=Math.min(r.x+r.w,above.x+above.w);
   doorH(Math.max(ox0,(ox0+ox1)/2-door/2),L.h1,1);
   // railing instead of solid wall on the outer sides
   const rails=[];
   if(r.x<0.01)rails.push([X(0),Y(r.y),X(0),Y(r.y+r.h)]);
   rails.push([X(r.x),Y(L.H),X(r.x+r.w),Y(L.H)]);
   for(const [a,b,c,d] of rails)marks.push(`<line class="pl-gap" x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke-width="${wall+1}"/><line class="pl-rail" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`);
  }
 }
 if(hall){ // entrance door on the outer wall below the hall
  const ex=hall.x+hall.w/2-door/2;gapH(ex,L.H,door,wall);
  if(!o.mini)marks.push(`<path class="pl-entry" d="M${X(ex+door/2)} ${r2(Y(L.H)+20)} l-6 -9 h12 z"/><text class="pl-dim" x="${X(ex+door/2)}" y="${r2(Y(L.H)+34)}" text-anchor="middle">${o.entry||''}</text>`);
 }
 if(!o.mini){
  L.rooms.forEach((r,n)=>{
   const cx=r2(X(r.x+r.w/2)+(WET.includes(r.t)&&hall?door*s/2:0)),cy=Y(r.y+r.h/2),wp=r.w*s,hp=r.h*s,name=(o.names||{})[r.t]||'',area=`${o.f1(r.a)} m²`;
   const room=wp-(WET.includes(r.t)||r.t==='kit'?door*s:0);
   if(room>=name.length*8.2+12&&hp>=48)labels.push(`<text class="pl-name" x="${cx}" y="${r2(cy-4)}" text-anchor="middle">${name}</text><text class="pl-area" x="${cx}" y="${r2(cy+16)}" text-anchor="middle">${area}</text>`);
   else if(room>=area.length*8.8+6&&hp>=26)labels.push(`<text class="pl-area" x="${cx}" y="${r2(cy+5.5)}" text-anchor="middle">${area}</text>`);
   else labels.push(`<circle class="pl-no" cx="${cx}" cy="${cy}" r="11"/><text class="pl-nt" x="${cx}" y="${r2(cy+4.5)}" text-anchor="middle">${n+1}</text>`);
  });
  // dimension lines and a 1 m scale bar
  const dy=m-22,dx=m-22;
  labels.push(`<path class="pl-dl" d="M${X(0)} ${dy} H${X(L.W)} M${X(0)} ${dy-5} v10 M${X(L.W)} ${dy-5} v10"/><text class="pl-dim" x="${X(L.W/2)}" y="${dy-6}" text-anchor="middle">${o.f2(L.W)} m</text>`);
  labels.push(`<path class="pl-dl" d="M${dx} ${Y(0)} V${Y(L.H)} M${dx-5} ${Y(0)} h10 M${dx-5} ${Y(L.H)} h10"/><text class="pl-dim" transform="translate(${dx-7} ${Y(L.H/2)}) rotate(-90)" text-anchor="middle">${o.f2(L.H)} m</text>`);
  const sx=X(L.W)-s,sy=r2(Hpx-12);
  labels.push(`<path class="pl-dl" d="M${r2(sx)} ${sy} h${r2(s)} M${r2(sx)} ${sy-4} v8 M${r2(sx+s)} ${sy-4} v8"/><text class="pl-dim" x="${r2(sx-6)}" y="${sy+4}" text-anchor="end">${o.scale||'1 m'}</text>`);
 }
 const t=o.title?`<title>${o.title}</title>`:'';
 return `<svg class="plan${o.mini?' plan-mini':''}" viewBox="0 0 ${VB} ${r2(Hpx)}" role="img"${o.mini?' aria-hidden="true" focusable="false"':''}>${t}${parts.join('')}${walls.join('')}${marks.join('')}${labels.join('')}</svg>`;
}
