import {execFileSync} from 'node:child_process';
execFileSync(process.platform==='win32'?'npm.cmd':'npm',['run','build'],{stdio:'inherit',env:{...process.env,BAKHY_SKIP_DESKTOP:'1'},shell:process.platform==='win32'});
