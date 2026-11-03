// Renders the Velvet vitrine concept preview. Run: node scripts/concept-assets/render-velvet.cjs
const {chromium}=require('playwright');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});
await p.goto('file://'+path.join(__dirname,'velvet-vitrine.html'));await p.waitForTimeout(400);
await p.screenshot({path:path.join(__dirname,'../../storefront/public/assets/previews/velvet.jpg'),type:'jpeg',quality:84});await b.close()})();
