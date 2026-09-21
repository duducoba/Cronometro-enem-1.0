const fs = require('node:fs');
const path = require('node:path');
const assets = {};
for(const [file,type] of [['index.html','text/html; charset=utf-8'],['styles.css','text/css; charset=utf-8'],['app.js','text/javascript; charset=utf-8']]) assets['/'+file]={body:fs.readFileSync(path.join(__dirname,'dist',file),'utf8'),type};
assets['/']=assets['/index.html'];
fs.mkdirSync(path.join(__dirname,'dist/server'),{recursive:true});
fs.writeFileSync(path.join(__dirname,'dist/server/index.js'),'const SITE_ASSETS = '+JSON.stringify(assets)+';\n'+fs.readFileSync(path.join(__dirname,'worker.mjs'),'utf8'));
console.log('Worker built with password-protected assets.');
