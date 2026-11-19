// Capacitor 6 expects tar's old default export. Use patched tar 7 without editing dependencies.
const tar=require('tar');
if(!tar.default)Object.defineProperty(tar,'default',{value:tar});
require('@capacitor/cli').run();
