import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
const cwd=import.meta.dirname,mode=process.argv[2]||'release';
if(!['debug','release'].includes(mode))throw new Error('Use debug or release');
if(!existsSync(resolve(cwd,'www/asset-manifest.json')))throw new Error('Run npm run build:web at the repository root first.');
function run(command,args){const r=spawnSync(command,args,{cwd,stdio:'inherit',shell:process.platform==='win32'&&command.endsWith('.bat')});if(r.error)throw r.error;if(r.status)process.exit(r.status);}
run(process.execPath,['cap.cjs','sync','android']);
run(resolve(cwd,'android',process.platform==='win32'?'gradlew.bat':'gradlew'),['-p','android',mode==='release'?'assembleRelease':'assembleDebug','--no-daemon']);
