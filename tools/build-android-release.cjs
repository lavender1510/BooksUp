'use strict';
// Public distribution: must be the Android Gradle release variant signed by a
// permanent, publisher-controlled key. Never fall back to assembleDebug.
const {existsSync,mkdirSync,copyFileSync}=require('node:fs');
const {join}=require('node:path');
const {spawnSync}=require('node:child_process');
const root=join(__dirname,'..');
for(const key of ['BOOKSUP_RELEASE_KEYSTORE','BOOKSUP_RELEASE_STORE_PASSWORD','BOOKSUP_RELEASE_KEY_ALIAS','BOOKSUP_RELEASE_KEY_PASSWORD']){
 if(!process.env[key])throw Error('Production release blocked: '+key+' must be configured in GitHub Actions Secrets');
}
if(!existsSync(process.env.BOOKSUP_RELEASE_KEYSTORE))throw Error('Release keystore file is missing');
function run(command,args,cwd=root){
 const child=spawnSync(command,args,{cwd,stdio:'inherit',env:process.env,shell:process.platform==='win32'});
 if(child.error)throw child.error;
 if(child.status!==0)throw Error(command+' failed ('+child.status+')');
}
run(process.execPath,[join(__dirname,'android-init.cjs')]);
const dir=join(root,'android');
const gradle=join(dir,process.platform==='win32'?'gradlew.bat':'gradlew');
if(!existsSync(gradle))throw Error('Android Gradle wrapper missing');
run(gradle,['assembleRelease','--no-daemon'],dir);
const file=join(dir,'app','build','outputs','apk','release','app-release.apk');
if(!existsSync(file))throw Error('Signed production release APK was not created');
const version=require(join(root,'package.json')).version;
const releaseDir=join(root,'release');mkdirSync(releaseDir,{recursive:true});
const output=join(releaseDir,'BooksUp-'+version+'.apk');
copyFileSync(file,output);
console.log('Production Android release APK:',output);
