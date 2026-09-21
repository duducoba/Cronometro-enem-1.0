const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'dist');
const files = {'/':'index.html','/index.html':'index.html','/app.js':'app.js','/styles.css':'styles.css'};
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
http.createServer((req,res)=>{const file=files[new URL(req.url,'http://localhost').pathname];if(!file){res.writeHead(404);res.end('Not found');return}res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-store'});fs.createReadStream(path.join(root,file)).pipe(res)}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
