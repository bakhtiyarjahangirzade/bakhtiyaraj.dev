import {href} from './i18n.js';
import {LEGACY_TYPES} from './print/model.js';
const params=new URLSearchParams(location.search);
if(params.get('service')==='print'){
 const product=LEGACY_TYPES[params.get('printType')];
 location.replace(href('/services/print.html')+(product?'?product='+product:''));
}else import('./product.js');
