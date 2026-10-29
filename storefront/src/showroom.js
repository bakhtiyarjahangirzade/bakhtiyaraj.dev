// Ten distinct showroom concepts: each returns its own markup (no DOM needed). Names and numbers are samples.
import {copy,showroomMeta} from './showroom-copy.js';
export const showroomIds=Object.keys(showroomMeta);
const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const wrap=(inner,cls='')=>`<div class="x-wrap ${cls}">${inner}</div>`;

const renderers={
 clinic:(T,t)=>{const k=copy.clinic;
  const ages=[['0–1','coral'],['1–3','mint'],['3–18','sun']].map(([n,col])=>`<div class="age age-${col}"><small>${t(k.ageCaption)}</small><b>${n}</b></div>`).join('');
  return `<header class="cl-nav">${wrap(`<strong>Sunny Kids</strong><nav>${k.nav.map(n=>`<span>${t(n)}</span>`).join('')}</nav><span class="cl-call">${t(k.cta)}</span>`)}</header>`+
  `<section class="cl-hero">${wrap(`<div class="cl-copy"><h1>${t(k.headline)}</h1><p>${t(k.sub)}</p><span class="cl-btn">${t(k.cta)}</span></div><div class="cl-ages" aria-hidden="true">${ages}</div>`)}</section>`+
  `<section class="cl-services">${wrap(`<h2>${t(k.servicesTitle)}</h2><div class="cl-grid">${k.services.map((s,i)=>`<div class="cl-card cl-c${i}"><i></i><strong>${t(s)}</strong></div>`).join('')}</div>`)}</section>`+
  `<section class="cl-doctors">${wrap(`<h2>${t(k.doctorsTitle)}</h2><div class="cl-docs">${k.doctors.map((d,i)=>`<figure><span class="av av${i}"></span><figcaption>${t(d)}</figcaption></figure>`).join('')}</div><p class="cl-quote">${t(k.quote)}</p>`)}</section>`;
 },
 wealth:(T,t)=>{const k=copy.wealth;
  const chart='<svg viewBox="0 0 200 70" aria-hidden="true"><path d="M0 60 C40 55 60 40 100 34 S160 12 200 6" fill="none" stroke="#1769ff" stroke-width="3"/><path d="M0 60 C40 58 70 52 100 48 S160 36 200 30" fill="none" stroke="#9db8e8" stroke-width="2" stroke-dasharray="4 4"/></svg>';
  return `<header class="wl-top">${wrap(`<strong>Growly</strong><nav>${k.tabs.map((x,i)=>`<span${i===0?' class="on"':''}>${t(x)}</span>`).join('')}</nav>`)}</header>`+
  `<section class="wl-hero">${wrap(`<div><h1>${t(k.headline)}</h1><p>${t(k.sub)}</p><ul>${k.bullets.map(b=>`<li>${t(b)}</li>`).join('')}</ul><span class="wl-btn">${t(k.cta)}</span></div><div class="wl-phone" aria-hidden="true"><div class="wl-screen"><small>${t(k.goal)}</small><b>94 893 AZN</b>${chart}<div class="wl-row"><span>${t(k.balance)}</span><b>1 730 AZN</b></div><div class="wl-row"><span>${t(k.sample)}</span><b>—</b></div></div></div>`)}</section>`+
  `<section class="wl-cards">${wrap(`<h2>${t(k.cardsTitle)}</h2><div class="wl-grid">${k.cards.map(([h,d],i)=>`<article><span>0${i+1}</span><h3>${t(h)}</h3><p>${t(d)}</p></article>`).join('')}</div><p class="wl-note">${t(k.disclaimer)}</p>`)}</section>`;
 },
 gym:(T,t)=>{const k=copy.gym;
  const rows=[[0,'19:00','MMA',0],[1,'20:00','Muay Thai',1],[2,'19:00','BJJ',0],[0,'20:30','BJJ',1]].map(([d,h,n,l])=>`<tr><td>${t(k.days[d])}</td><td>${h}</td><td><b>${n}</b></td><td>${t(k.levels[l])}</td></tr>`).join('');
  return `<header class="gy-top">${wrap(`<strong>WOLFPACK</strong><nav>${k.nav.map(n=>`<span>${t(n)}</span>`).join('')}</nav>`)}</header>`+
  `<section class="gy-hero">${wrap(`<h1>${t(k.headline)}</h1><p>${t(k.sub)}</p><span class="gy-btn">${t(k.cta)}</span>`)}<div class="gy-strip" aria-hidden="true"></div></section>`+
  `<section class="gy-disc">${wrap(k.disciplines.map(([n,d],i)=>`<article><span>0${i+1}</span><h2>${n}</h2><p>${t(d)}</p></article>`).join(''))}</section>`+
  `<section class="gy-sched">${wrap(`<h2>${t(k.scheduleTitle)}</h2><table><tbody>${rows}</tbody></table>`)}</section>`;
 },
 motors:(T,t)=>{const k=copy.motors;
  const cars=[['28 500','2020 · 54 000 km','blue'],['41 900','2022 · 18 000 km','slate'],['19 200','2018 · 96 000 km','red']].map(([p,s,col],i)=>`<article class="mt-car"><div class="mt-img ${col}"><i></i><i></i></div><span class="mt-badge">${t(k.badge)}</span><h3>${t(k.cars[i])}</h3><p>${s}</p><strong>${p} AZN</strong></article>`).join('');
  return `<header class="mt-top">${wrap(`<strong>AutoLane</strong><nav>${k.nav.map(n=>`<span>${t(n)}</span>`).join('')}</nav>`)}</header>`+
  `<section class="mt-hero">${wrap(`<h1>${t(k.headline)}</h1><p>${t(k.sub)}</p><div class="mt-search">${k.filters.map(f=>`<span><small>${t(f)}</small><b>—</b></span>`).join('')}<span class="mt-go">${t(k.search)}</span></div>`)}</section>`+
  `<section class="mt-list">${wrap(`<h2>${t(k.listingsTitle)}</h2><div class="mt-grid">${cars}</div>`)}</section>`;
 },
 give:(T,t)=>{const k=copy.give;
  return `<header class="gv-top">${wrap(`<strong>Bir Süfrə</strong><nav>${k.nav.map(n=>`<span>${t(n)}</span>`).join('')}</nav>`)}</header>`+
  `<section class="gv-hero">${wrap(`<h1><span>${t(k.line1)}</span><span>${t(k.line2)}</span></h1><div class="gv-badge" aria-hidden="true"><b>${t(k.nav[2])}</b></div>`)}</section>`+
  `<section class="gv-stats">${wrap(`<p class="gv-note">${t(k.sample)}</p><div class="gv-row">${k.stats.map(([n,l])=>`<div><b>${n}</b><span>${t(l)}</span></div>`).join('')}</div>`)}</section>`+
  `<section class="gv-cards">${wrap(k.cards.map(([h,d],i)=>`<article class="gv-c${i}"><h3>${t(h)}</h3><p>${t(d)}</p></article>`).join(''))}</section>`+
  `<section class="gv-donate">${wrap(`<h2>${t(k.amount)}</h2><div class="gv-amounts"><span>10 AZN</span><span class="on">25 AZN</span><span>50 AZN</span></div><span class="gv-btn">${t(k.nav[2])}</span>`)}</section>`;
 },
 stream:(T,t)=>{const k=copy.stream;
  return `<header class="st-top"><strong>Arena</strong><nav>${k.nav.map((n,i)=>`<span${i===0?' class="on"':''}>${t(n)}</span>`).join('')}</nav></header>`+
  `<section class="st-hero"><div class="st-copy"><small>${t(k.eyebrow)}</small><h1>${t(k.headline)}</h1><p>${t(k.sub)}</p><div><span class="st-play">▶ ${t(k.play)}</span><span class="st-all">${t(k.all)}</span></div></div></section>`+
  `<section class="st-row"><h2>${t(k.rowTitle)}</h2><div class="st-tiles">${k.tiles.map((x,i)=>`<article class="st-t${i}"><b>${i+1}</b><div><small>${t(k.eyebrow)}</small><strong>${t(x)}</strong></div></article>`).join('')}</div></section>`;
 },
 bazar:(T,t)=>{const k=copy.bazar;
  const items=k.items.map((x,i)=>`<article><div class="bz-img bz${i}"></div><h3>${t(x)}</h3><b>${[899,420,260,1150][i]} AZN</b><small>${t(k.city)} · ${t(k.today)}</small></article>`).join('');
  return `<header class="bz-top">${wrap(`<strong>Bazarlıq</strong><div class="bz-search"><span>${t(k.placeholder)}</span><i>${t(k.city)}</i><b>${t(k.search)}</b></div><span class="bz-post">+ ${t(k.post)}</span>`)}</header>`+
  `<section class="bz-hero">${wrap(`<h1>${t(k.headline)}</h1><div class="bz-cats">${k.cats.map((c2,i)=>`<span class="bz-cat bzc${i%4}">${t(c2)}</span>`).join('')}</div>`)}</section>`+
  `<section class="bz-prem">${wrap(`<h2>${t(k.premium)}</h2><div class="bz-grid">${items}</div>`)}</section>`;
 },
 avto:(T,t)=>{const k=copy.avto;
  const rows=[['Sedan',0,'26 800','2019 · 71 000 km',[0,2]],['Krossover',1,'44 300','2023 · 9 000 km',[0,1,2]],['Hetçbek',2,'17 900','2017 · 120 000 km',[1]]];
  const names=copy.motors.cars;
  return `<header class="av-top">${wrap(`<strong>Yolda</strong><h1>${t(k.headline)}</h1>`)}</header>`+
  `<section class="av-main">${wrap(`<aside><h2>${t(k.filtersTitle)}</h2><div class="av-g"><h3>${t(k.price)}</h3><span class="av-range"><i></i></span></div>${k.groups.map(([h,opts])=>`<div class="av-g"><h3>${t(h)}</h3>${opts.map((o,i)=>`<label><span class="av-chk${i===0?' on':''}"></span>${t(o)}</label>`).join('')}</div>`).join('')}</aside><div class="av-list"><div class="av-sort"><span>${t(k.sort)}</span></div>${rows.map(([n,ci,p,s,bs])=>`<article class="av-row"><div class="av-img av${ci}"><i></i><i></i></div><div class="av-info"><h3>${t(names[ci])}</h3><p>${s}</p><div>${bs.map(b=>`<span>${t(k.badges[b])}</span>`).join('')}</div></div><strong>${p} AZN</strong></article>`).join('')}</div>`,'av-layout')}</section>`;
 },
 lal:(T,t)=>{const k=copy.lal,b=copy.bazar;
  return `<section class="lf-hero">${wrap(`<div class="lf-copy"><strong class="lf-brand">Cibdə</strong><h1>${t(k.headline)}</h1><p>${t(k.sub)}</p><span class="lf-store">${t(k.store)}</span></div><div class="lf-phone" aria-hidden="true"><div class="lf-screen"><div class="lf-cats">${b.cats.slice(0,4).map(c2=>`<span>${t(c2)}</span>`).join('')}</div><div class="lf-feed">${[2,3].map(i=>`<div><i class="bz${i}"></i><b>${t(b.items[i])}</b></div>`).join('')}</div><div class="lf-chat"><span class="in">${t(k.chat[0])}</span><span class="out">${t(k.chat[1])}</span></div><div class="lf-tabs">${k.tabs.map((x,i)=>`<span${i===0?' class="on"':''}>${t(x)}</span>`).join('')}</div></div></div>`)}</section>`+
  `<section class="lf-feat">${wrap(k.features.map(([h,d],i)=>`<article class="lf-f${i}"><h3>${t(h)}</h3><p>${t(d)}</p></article>`).join(''))}</section>`;
 },
 estate:(T,t)=>{const k=copy.estate;
  const cards=[[0,'165 000','78','2 115',5,0],[1,'112 000','54','2 074',3,1],[2,'289 000','160','1 806',null,0]].map(([ti,p,a,m,f,bd])=>`<article class="es-card"><div class="es-img es${ti}"></div><div><span class="es-type">${t(k.types[ti])}</span><strong>${p} AZN</strong><p>${a} m² · ${m} AZN/m²${f?` · ${e(T(k.floor[0],{n:f}))}`:''}</p><span class="es-badge">${t(k.badges[bd])}</span></div></article>`).join('');
  return `<header class="es-top">${wrap(`<strong>Ünvan</strong><div class="es-modes">${k.modes.map((m,i)=>`<span${i===0?' class="on"':''}>${t(m)}</span>`).join('')}</div><div class="es-rooms"><small>${t(k.rooms)}</small>${['1','2','3','4+'].map((r,i)=>`<span${i===1?' class="on"':''}>${r}</span>`).join('')}</div>`)}</header>`+
  `<section class="es-main"><div class="es-left"><h1>${t(k.headline)}</h1>${cards}</div><div class="es-map" aria-hidden="true"><span>${t(k.map)}</span>${[[22,30],[48,52],[70,24],[34,70],[62,66],[80,48]].map(([x,y],i)=>`<i class="pin p${i}"></i>`).join('')}</div></section>`;
 }
};

export function renderShowroom(id,T){
 const t=leaf=>e(T(leaf[0]));
 return `<div class="xs xs-${id}">${renderers[id](T,t)}</div>`;
}
export function showroomUi(){return showroomIds}
