import test from 'node:test';
import assert from 'node:assert/strict';
import {PRINT_PRODUCTS,calculateLine,normalizeCart,cartTotal,filterProducts} from '../storefront/src/print/model.js';
import {COPY,tr} from '../storefront/src/print/copy.js';
import {renderShop} from '../storefront/src/print/render.js';
test('print catalogue matches all owner-edited standard/premium prices',()=>{
 assert.deepEqual(PRINT_PRODUCTS.map(p=>[p.standard,p.premium]),[[20,40],[35,50],[50,80],[20,40],[30,50],[4,9],[5,10],[5,10],[15,29],[15,29],[15,29],[10,20],[20,50],[10,25],[499,900],[350,750],[2,5],[1,2],[10,25],[15,29],[10,19],[5,15],[10,19],[15,29],[10,19],[29,59],[20,50],[10,19],[3,5]]);
});
test('first person included; extra people multiply the chosen tier, separate from designs',()=>{
 const c={product:'business-card'};
 assert.equal(calculateLine(c).total,20);
 assert.equal(calculateLine({...c,people:2}).total,22);
 assert.equal(calculateLine({...c,people:3}).total,24);
 assert.equal(calculateLine({...c,people:2,tier:'premium'}).total,44);
 assert.equal(calculateLine({...c,people:2,quantity:2}).total,44);
 assert.equal(calculateLine({product:'flyer',people:50}).total,20);
 assert.equal(calculateLine({product:'certificate',people:2,tier:'premium'}).total,20.9);
});
test('pages, area and independent design quantity use the right units and cent rounding',()=>{
 assert.equal(calculateLine({product:'catalogue',units:12,quantity:2}).total,120);
 assert.equal(calculateLine({product:'menu',units:3,tier:'premium'}).total,30);
 assert.equal(calculateLine({product:'banner',width:2.5,height:1.2,tier:'premium'}).total,27);
 assert.equal(calculateLine({product:'banner',width:.11,height:.13}).total,.06);
});
test('stored prices/PII cannot change canonical price; corrupted carts and duplicate keys are rejected',()=>{
 assert.deepEqual(normalizeCart(null),[]);
 assert.deepEqual(normalizeCart({version:2,lines:[]}),[]);
 const lines=normalizeCart({version:1,lines:[null,{key:'a',product:'unknown'},{key:'b',product:'business-card',total:0,people:2,name:'Private'}, {key:'b',product:'logo'}]});
 assert.equal(lines.length,1);assert.equal(cartTotal(lines),22);assert.equal('name' in lines[0],false);assert.equal('total' in lines[0],false);
 assert.equal(calculateLine({product:'business-card',quantity:-2,people:Infinity}).total,20);
 assert.equal(normalizeCart({version:1,lines:Array.from({length:80},(_,i)=>({key:'k'+i,product:'logo'}))}).length,60);
});
test('catalogue filtering and three localized static pages remain usable',()=>{
 assert.equal(filterProducts('vizit').length,1);assert.equal(filterProducts('impossible').length,0);
 for(const lang of ['az','ru','en']){
  for(const key of Object.keys(COPY))assert.ok(tr(lang,key).length,key);
  const html=renderShop(lang);assert.equal((html.match(/data-add=/g)||[]).length,29);
  assert.ok(html.includes('/'+lang+'/services/print.html'));assert.ok(!html.includes('onclick='));
 }
});
