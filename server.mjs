import http from 'node:http';
import worker from './dist/server/index.js';

if(!process.env.ENEM_PASSWORD) throw new Error('Configure ENEM_PASSWORD antes de iniciar o servidor.');
const port = Number(process.env.PORT || 10000);
const origin = process.env.RENDER_EXTERNAL_URL || process.env.APP_ORIGIN || `http://localhost:${port}`;
const server = http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url,origin);
    if(url.origin !== new URL(origin).origin) {res.writeHead(400);res.end();return;}
    if(url.pathname === '/healthz' && req.method === 'GET') {res.writeHead(200,{'Content-Type':'text/plain'});res.end('ok');return;}
    const chunks=[]; let size=0;
    for await (const chunk of req) {size+=chunk.length;if(size>2048){res.writeHead(413);res.end('Solicitação muito grande.');return;}chunks.push(chunk);}
    const request = new Request(url,{method:req.method,headers:req.headers,...(req.method!=='GET' && req.method!=='HEAD' ? {body:Buffer.concat(chunks)} : {})});
    const response = await worker.fetch(request,{ENEM_PASSWORD:process.env.ENEM_PASSWORD});
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch {res.writeHead(500,{'Content-Type':'text/plain','Cache-Control':'no-store'});res.end('Não foi possível processar a solicitação.');}
});
server.listen(port,'0.0.0.0',()=>console.log(`Quadro de horários disponível na porta ${port}`));
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
