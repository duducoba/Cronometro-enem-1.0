import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const port = 18743;
const origin = `http://127.0.0.1:${port}`;
const password='server-integration-test-only';
const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:String(port),APP_ORIGIN:origin,ENEM_PASSWORD:password},stdio:['ignore','pipe','pipe'],windowsHide:true});
try {
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(new Error(`Server exited: ${code}`)));});
  let response=await fetch(origin+'/healthz');assert.equal(await response.text(),'ok');
  response=await fetch(origin+'/');assert.match(await response.text(),/Senha de acesso/);
  response=await fetch(origin+'/login',{method:'POST',headers:{origin},body:new URLSearchParams({password}),redirect:'manual'});
  assert.equal(response.status,303);
  const cookie=response.headers.get('set-cookie').split(';')[0];
  response=await fetch(origin+'/',{headers:{cookie}});assert.match(await response.text(),/Quadro de horários/);
  response=await fetch(origin+'/app.js?v=3',{headers:{cookie}});assert.match(await response.text(),/function drawMarks/);
  response=await fetch(origin+'/login',{method:'POST',headers:{origin},body:new URLSearchParams({password:'wrong'}),redirect:'manual'});assert.equal(response.status,401);
  console.log('PASS: Render Node server health, login, cookie, protected assets and rejected password over HTTP.');
} finally {child.kill();}
