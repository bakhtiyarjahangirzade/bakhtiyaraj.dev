import '../ribbon.css';
import './style.css';
import '../../i18n.js';

const D=JSON.parse(document.getElementById('k-data').textContent);
const U=D.u,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const fill=(s,v)=>s.replace(/\{(\w+)\}/g,(m,k)=>k in v?v[k]:m);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const lang=document.documentElement.lang||'az';

// ---- Baku clock: which light it is right now (the studio's subject) ----
const bandOf=m=>m>=7*60&&m<11*60?'morning':m>=11*60&&m<15*60?'noon':m>=15*60&&m<19*60?'evening':'night';
function bakuMinutes(){
 const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Baku',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
 const h=+p.find(x=>x.type==='hour').value,m=+p.find(x=>x.type==='minute').value;return {h,m,t:h*60+m};
}
function tick(){
 const {h,m,t}=bakuMinutes();
 $('#a-clock').textContent=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
 $('#a-band').textContent=`— ${U.nowBand[bandOf(t)]}`;
 $('#a-now').hidden=false;
 const tt=t<5*60?t+24*60:t,line=$('#a-nowline');
 if(tt>=7*60&&tt<=25*60){line.hidden=false;line.style.left=((tt-420)/(25*60-420)*100)+'%'}else line.hidden=true;
}
tick();setInterval(tick,30000);

// ---- index ruler positions (computed once; style from JS is CSP-safe) ----
for(const el of $$('[data-m]'))el.style.left=(+el.dataset.m*100)+'%';
// Dots on the same minute band stack upwards so none hide each other.
{const used={};for(const d of $$('.a-dot')){const k=Math.round(+d.dataset.m*60);used[k]=(used[k]||0)+1;for(const j of [k-1,k+1])if(used[j])used[k]=Math.max(used[k],used[j]+1);d.style.setProperty('--lift',used[k]-1)}}

// ---- index filter ----
let filter='all';
$('.a-filter').addEventListener('change',e=>{
 filter=e.target.value;
 for(const li of $$('.a-thumbs li,.a-dot'))li.classList.toggle('is-off',filter!=='all'&&li.dataset.s!==filter);
 for(const b of $$('[data-band]'))b.hidden=!$$('li',b).some(li=>!li.classList.contains('is-off'));
 for(const li of $$('.a-thumbs li.is-off button,.a-dot.is-off'))li.tabIndex=-1;
 for(const li of $$('.a-thumbs li:not(.is-off) button,.a-dot:not(.is-off)'))li.tabIndex=0;
});

// ---- lightbox: sequence order from the series, hour order from the index ----
const lb=$('#a-lb'),img=$('#a-lbimg'),cap=$('#a-lbcap'),cnt=$('#a-lbn');
let list=[],pos=0,opener=null;
function show(){
 const f=D.frames[list[pos]];
 img.innerHTML=f.img;
 cap.innerHTML=`<b>${esc(f.series)}</b> <span class="a-t">${esc(f.t)}</span> ${esc(f.place)}`;
 cnt.textContent=fill(U.counter,{i:pos+1,n:list.length});
 // Preload neighbours so arrow keys feel immediate.
 for(const d of [-1,1]){const n=D.frames[list[(pos+d+list.length)%list.length]];const tmp=document.createElement('div');tmp.innerHTML=n.img;const im=tmp.firstChild;im.loading='eager';}
}
function open(i,ctxName,from){
 opener=from;
 list=ctxName==='index'?D.order.filter(k=>filter==='all'||D.frames[k].s===filter):D.frames.map((_,k)=>k);
 pos=Math.max(0,list.indexOf(i));show();lb.showModal();
 $('[data-lb="1"]',lb).focus();
}
const step=d=>{pos=(pos+d+list.length)%list.length;show()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-frame]');if(b&&!lb.contains(b))open(+b.dataset.frame,b.dataset.ctx,b)});
lb.addEventListener('click',e=>{const b=e.target.closest('[data-lb]');if(b){b.dataset.lb==='x'?lb.close():step(+b.dataset.lb)}else if(e.target===lb)lb.close()});
lb.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1)}else if(e.key==='ArrowLeft'){e.preventDefault();step(-1)}});
lb.addEventListener('close',()=>{img.innerHTML='';opener&&opener.focus();opener=null});

// ---- commission enquiry ----
const form=$('#a-form'),ok=$('#a-ok');
{const sel=$('[data-months]'),now=new Date();for(let k=0;k<12;k++){const d=new Date(now.getFullYear(),now.getMonth()+k+1,1);const o=document.createElement('option');o.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;o.textContent=`${D.months[d.getMonth()]} ${d.getFullYear()}`;sel.append(o)}}
const rules={
 'a-name':v=>v.trim().length>=2||U.eName,
 'a-email':v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())||U.eEmail,
 'a-type':v=>!!v||U.eType,
 'a-where':v=>v.trim().length>=3||U.eWhere,
 'a-msg':v=>v.trim().length>=20||U.eMsg,
 'a-consent':(v,el)=>el.checked||U.eConsent
};
function check(id){
 const el=$('#'+id),r=rules[id](el.value,el),e=$(`#${id}-e`);
 const bad=r!==true;el.setAttribute('aria-invalid',bad);e.hidden=!bad;e.textContent=bad?r:'';return !bad;
}
// Fields are re-checked as the visitor corrects them, but only after a first failed attempt.
let tried=false;
form.addEventListener('input',e=>{if(tried&&rules[e.target.id])check(e.target.id)});
form.addEventListener('change',e=>{if(tried&&rules[e.target.id])check(e.target.id)});
form.addEventListener('submit',e=>{
 e.preventDefault();tried=true;
 const bad=Object.keys(rules).filter(id=>!check(id));
 const er=$('#a-err');er.hidden=!bad.length;er.textContent=fill(U.eSummary,{n:bad.length});
 if(bad.length){$('#'+bad[0]).focus();return}
 const f=new FormData(form);
 ok.innerHTML=`<h3>${esc(U.okH)}</h3><dl><div><dt>${esc($('label[for=a-type]').textContent)}</dt><dd>${esc(D.types[f.get('type')])}</dd></div><div><dt>${esc($('label[for=a-where]').textContent)}</dt><dd>${esc(f.get('where'))}</dd></div><div><dt>${esc($('label[for=a-month]').textContent)}</dt><dd>${esc($('#a-month').selectedOptions[0].textContent)}</dd></div><div><dt>${esc($('.a-light legend').textContent)}</dt><dd>${esc(U.light[f.get('light')])}</dd></div></dl><p>${esc(fill(U.okP,{email:f.get('email').trim()}))}</p><button type="button" class="a-btn a-ghost" id="a-again">${esc(U.again)}</button>`;
 form.hidden=true;ok.hidden=false;ok.focus();
});
ok.addEventListener('click',e=>{if(e.target.id==='a-again'){form.reset();tried=false;for(const el of $$('[aria-invalid]',form))el.removeAttribute('aria-invalid');for(const el of $$('.a-fe',form))el.hidden=true;$('#a-err').hidden=true;ok.hidden=true;form.hidden=false;$('#a-name').focus()}});
void lang;
