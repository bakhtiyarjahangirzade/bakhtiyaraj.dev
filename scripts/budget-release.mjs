// Derive download metadata from the actual signed APK, never from a typed version label.
import {readFile,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {updateInfo} from '../storefront/budgettracker/updates.mjs';
const [apk,aapt]=process.argv.slice(2);if(!apk||!aapt)throw new Error('Usage: node scripts/budget-release.mjs signed.apk aapt');
const badging=execFileSync(aapt,['dump','badging',resolve(apk)],{encoding:'utf8'});
const match=badging.match(/package: name='dev\.bakhtiyaraj\.kuryebro' versionCode='(\d+)' versionName='([^']+)'/);
if(!match||!badging.includes("targetSdkVersion:'36'")||badging.includes('application-debuggable'))throw new Error('Unexpected APK identity, target or debug build');
const body=await readFile(apk),release={versionCode:Number(match[1]),versionName:match[2],url:'https://www.bakhtiyaraj.dev/budgettracker/kuryebro.apk',sha256:createHash('sha256').update(body).digest('hex'),size:body.length,releasedAt:new Date().toISOString()};
updateInfo(release,0);
await copyFile(apk,'storefront/public/budgettracker/kuryebro.apk');
await writeFile('storefront/public/budgettracker/releases.json',JSON.stringify(release,null,2)+'\n');
console.log(JSON.stringify(release));
