import '../ribbon.css';
import './style.css';
import '../../i18n.js';

// Wolfpack timetable: filters, class detail dialog and one free trial per visitor (local state).
const D=JSON.parse(document.getElementById('k-data').textContent);
const S=D.S,$=id=>document.getElementById(id);
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const cls=D.classes;
const f={disc:'all',lvl:'all',open:false};
let mday=(new Date().getDay()||7);if(!cls.some(c=>c.d===mday))mday=1;
let trial=null,cur=null;
const TRIAL_LV=['beg','all','youth'];
const left=c=>c.cap-c.taken;
const line=c=>fill(S.clsLine,{disc:S.disc[c.disc].name,day:S.days[c.d],time:c.t});
const match=c=>(f.disc==='all'||c.disc===f.disc)&&(f.lvl==='all'||c.lvl===f.lvl)&&(!f.open||left(c)>0||trial===c.id);

function paintBtn(b,c){
 b.classList.toggle('is-full',left(c)<=0&&trial!==c.id);b.classList.toggle('is-yours',trial===c.id);
 const l=b.querySelector('.wp-left');l.textContent=trial===c.id?S.yours:left(c)<=0?S.full:fill(S.left,{n:left(c)});
}
function apply(){
 let n=0;
 document.querySelectorAll('.wp-tt .wp-cls').forEach(b=>{const c=cls.find(x=>x.id===b.dataset.id),ok=match(c);b.hidden=!ok;if(ok)n++;paintBtn(b,c)});
 // hide time rows that became empty so the grid stays tight
 document.querySelectorAll('.wp-tt tbody tr').forEach(tr=>tr.hidden=![...tr.querySelectorAll('.wp-cls')].some(b=>!b.hidden));
 $('wp-count').textContent=fill(S.count,{n});
 $('wp-empty').hidden=n>0;document.querySelector('.wp-tt-scroll').hidden=n===0;$('wp-mobile').classList.toggle('is-none',n===0);
 mobile();
}
function mobile(){
 $('wp-mday-h').textContent=S.days[mday];
 document.querySelectorAll('.wp-daybtn').forEach(b=>{const d=+b.dataset.mday;b.setAttribute('aria-pressed',String(d===mday));b.classList.toggle('is-empty',!cls.some(c=>c.d===d&&match(c)))});
 const list=cls.filter(c=>c.d===mday&&match(c)).sort((a,b)=>a.t.localeCompare(b.t));
 $('wp-mlist').innerHTML=list.length?list.map(c=>`<li><button type="button" class="wp-cls wp-cls-row" data-id="${c.id}" data-disc="${c.disc}"><span class="wp-time">${c.t}</span><span class="wp-code">${S.disc[c.disc].code}</span><span class="wp-mname">${esc(S.disc[c.disc].name)}<small>${esc(S.level[c.lvl])}, ${esc(S.coaches[c.co].name)}</small></span><span class="wp-left"></span></button></li>`).join(''):`<li class="wp-mnone">${esc(S.none)}</li>`;
 $('wp-mlist').querySelectorAll('.wp-cls').forEach(b=>paintBtn(b,cls.find(x=>x.id===b.dataset.id)));
}

document.querySelector('.wp-filters').addEventListener('click',e=>{
 const b=e.target.closest('.wp-chip');if(!b)return;
 const g=b.dataset.fd?'fd':'fl';f[g==='fd'?'disc':'lvl']=b.dataset[g];
 b.parentNode.querySelectorAll('.wp-chip').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));apply();
});
$('wp-open').addEventListener('change',e=>{f.open=e.target.checked;apply()});
$('wp-reset').addEventListener('click',()=>{f.disc='all';f.lvl='all';f.open=false;$('wp-open').checked=false;document.querySelectorAll('.wp-chip').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.fd==='all'||x.dataset.fl==='all')));apply()});
document.querySelector('.wp-daybar').addEventListener('click',e=>{const b=e.target.closest('[data-mday]');if(b){mday=+b.dataset.mday;mobile()}});

// ---- dialog ----
const dlg=$('wp-dlg'),form=$('wp-form');
let opener=null;
function open(c,from){
 cur=c;opener=from;
 $('wp-dlg-code').textContent=`${S.disc[c.disc].code}  ${S.days[c.d]} ${c.t}`;
 $('wp-dlg-h').textContent=S.disc[c.disc].name;
 $('wp-f-coach').textContent=S.coaches[c.co].name;$('wp-f-lvl').textContent=S.level[c.lvl];$('wp-f-dur').textContent=fill(S.minutes,{n:c.m});
 $('wp-f-cap').textContent=`${fill(S.capLine,{taken:c.taken,cap:c.cap})}. ${left(c)>0?fill(S.left,{n:left(c)}):S.full}`;
 $('wp-capfill').style.width=`${Math.min(100,c.taken/c.cap*100)}%`;
 $('wp-f-bring').textContent=S.disc[c.disc].bring;
 const note=$('wp-note');let why='';
 if(trial===c.id)why='';else if(trial)why=fill(S.already,{cls:line(cls.find(x=>x.id===trial))});else if(left(c)<=0)why=S.fullNote;else if(!TRIAL_LV.includes(c.lvl))why=S.noTrialLevel;
 note.hidden=!why;note.textContent=why;
 form.hidden=!!why||trial===c.id;
 const ok=$('wp-ok');ok.hidden=trial!==c.id;if(trial===c.id)ok.textContent=fill(S.booked,{name:form.elements.name.value.trim(),cls:line(c)});
 clearErrs();
 $('wp-guardian-row').hidden=true;
 dlg.showModal();
 $('wp-close').focus();
}
function close(){dlg.close()}
dlg.addEventListener('close',()=>{opener?.isConnected?opener.focus():document.querySelector(`.wp-tt .wp-cls[data-id="${cur?.id}"]`)?.focus()});
$('wp-close').addEventListener('click',close);
dlg.addEventListener('click',e=>{if(e.target===dlg)close()});
document.addEventListener('click',e=>{const b=e.target.closest('.wp-cls');if(b)open(cls.find(x=>x.id===b.dataset.id),b)});

const phoneOk=v=>/^(?:\+?994|0)?(10|12|50|51|55|60|70|77|99)\d{7}$/.test(v.replace(/[^\d+]/g,''));
function clearErrs(){form.querySelectorAll('.wp-ferr').forEach(x=>x.textContent='');form.querySelectorAll('[aria-invalid]').forEach(x=>x.setAttribute('aria-invalid','false'));form.querySelectorAll('.is-bad').forEach(x=>x.classList.remove('is-bad'))}
form.elements.age.addEventListener('input',()=>{const a=+form.elements.age.value;$('wp-guardian-row').hidden=!(a>=14&&a<18)});
form.addEventListener('submit',e=>{
 e.preventDefault();clearErrs();
 const v=form.elements,age=+v.age.value,errs=[];
 const bad=(k,msg,el=v[k])=>{errs.push(el);$(`wp-${k}-err`).textContent=msg;el.setAttribute('aria-invalid','true');el.closest('.wp-field,.wp-check')?.classList.add('is-bad')};
 if(v.name.value.trim().length<2)bad('name',S.err.name);
 if(!phoneOk(v.phone.value))bad('phone',S.err.phone);
 if(!(age>=14&&age<=70))bad('age',S.err.age);
 else if(age<16&&cur.lvl!=='youth')bad('age',S.err.youth);
 else if(age>=18&&cur.lvl==='youth')bad('age',S.err.adult);
 if(!v.exp.value)bad('exp',S.err.exp);
 if(age>=14&&age<18&&!v.guardian.checked)bad('guardian',S.err.guardian);
 if(!v.rules.checked)bad('rules',S.err.rules);
 if(errs.length){errs[0].focus();return}
 cur.taken++;trial=cur.id;
 form.hidden=true;const ok=$('wp-ok');ok.hidden=false;ok.textContent=fill(S.booked,{name:v.name.value.trim(),cls:line(cur)});
 $('wp-f-cap').textContent=`${fill(S.capLine,{taken:cur.taken,cap:cur.cap})}. ${left(cur)>0?fill(S.left,{n:left(cur)}):S.full}`;
 $('wp-capfill').style.width=`${Math.min(100,cur.taken/cur.cap*100)}%`;
 apply();$('wp-close').focus();
});

apply();
