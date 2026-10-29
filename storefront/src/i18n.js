import {rows} from './i18n/strings.js';
export const languages=['az','ru','en'];
const index={az:0,ru:1,en:2};
export const lang=(()=>{const l=typeof document!=='undefined'?document.documentElement.lang:'az';return languages.includes(l)?l:'az'})();
const table=new Map(rows.map(r=>[r[0],r]));
// Translate an Azerbaijani source string; {name} placeholders are filled from vars.
export function t(source,vars){
 const row=table.get(source),text=row&&row[index[lang]]||source;
 return vars?text.replace(/\{(\w+)\}/g,(m,k)=>k in vars?vars[k]:m):text;
}
// In-site path for the current language, e.g. /product.html?x=1 -> /ru/product.html?x=1
export const href=path=>`/${lang}${path==='/'?'/':path}`;
export const locale=lang;
if(typeof document!=='undefined'){
 const sync=e=>{const a=e.target.closest&&e.target.closest('.lang-switch a');if(a)a.href=a.getAttribute('href').split(/[?#]/)[0]+location.search+location.hash};
 document.addEventListener('pointerdown',sync);document.addEventListener('focusin',sync);document.addEventListener('click',sync);
}
