import test from 'node:test';
import assert from 'node:assert/strict';
import {updateInfo} from '../storefront/budgettracker/updates.mjs';
const release=()=>({versionCode:4,versionName:'1.2.0',url:'https://www.bakhtiyaraj.dev/budgettracker/kuryebro.apk',size:3000000,sha256:'a'.repeat(64)});
test('update detection compares numeric version codes',()=>{
 assert.equal(updateInfo(release(),3).available,true);assert.equal(updateInfo(release(),4).available,false);assert.equal(updateInfo(release(),5).available,false);assert.equal(updateInfo(release(),null).unknown,true);
});
test('update metadata cannot redirect to another APK host or executable scheme',()=>{
 for(const url of ['https://example.com/app.apk','javascript:alert(1)','https://www.bakhtiyaraj.dev/other.apk','https://user:password@www.bakhtiyaraj.dev/budgettracker/kuryebro.apk'])assert.throws(()=>updateInfo({...release(),url},1));
 assert.throws(()=>updateInfo({...release(),sha256:'invalid'},1));
});
