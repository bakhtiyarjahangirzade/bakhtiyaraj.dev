export const RELEASES_URL='https://www.bakhtiyaraj.dev/budgettracker/releases.json';
export function updateInfo(release,installedCode){
 if(!release||!Number.isSafeInteger(release.versionCode)||release.versionCode<1||typeof release.versionName!=='string'||!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(release.versionName))throw new Error('invalid-release');
 const url=new URL(release.url);
 if(url.origin!=='https://www.bakhtiyaraj.dev'||url.pathname!=='/budgettracker/kuryebro.apk'||url.username||url.password)throw new Error('invalid-release');
 if(!/^[0-9a-f]{64}$/i.test(release.sha256)||!Number.isSafeInteger(release.size)||release.size<1000)throw new Error('invalid-release');
 return {versionName:release.versionName,versionCode:release.versionCode,url:url.href,sha256:release.sha256,size:release.size,available:installedCode==null||release.versionCode>installedCode,unknown:installedCode==null};
}
