const encoder = new TextEncoder();
const COOKIE = '__Host-enem_session';
const headers = {'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; form-action 'self'; base-uri 'self'"};
function loginPage(error = false) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#123f35"><title>Entrar — Quadro ENEM</title><style>*{box-sizing:border-box}body{margin:0;min-height:100vh;background:#f5f7f5;color:#203e2e;font-family:system-ui,sans-serif;display:grid;place-items:center;padding:24px}main{width:100%;max-width:430px;background:white;border:1px solid #d7e0d6;border-radius:20px;padding:38px}small{font-size:14px;font-weight:700;letter-spacing:1px;color:#47704c}h1{font-size:32px;letter-spacing:-1px;margin:22px 0 12px}p{font-size:16px;color:#637263;line-height:1.6}label{font-size:15px;display:block;margin:26px 0 9px}input{width:100%;font:inherit;padding:15px;border:1px solid #b9c9b9;border-radius:8px}input:focus-visible,button:focus-visible{outline:3px solid #8ca771;outline-offset:3px}button{width:100%;background:#244c37;color:white;padding:16px;border:0;border-radius:8px;font:inherit;font-weight:600;cursor:pointer;margin-top:18px}.error{color:#a23131;font-size:14px}</style></head><body><main><small>QUADRO ENEM</small><h1>Seu treino começa aqui.</h1><p>Digite a senha de acesso para entrar no cronômetro de simulados.</p><form method="post" action="/login"><label for="password">Senha de acesso</label><input id="password" name="password" type="password" autocomplete="current-password" required maxlength="200" ${error?'aria-invalid="true" aria-describedby="error"':''}>${error?'<p class="error" role="alert" id="error">Senha incorreta. Confira e tente novamente.</p>':''}<button type="submit">Entrar no simulado</button></form></main></body></html>`;
}
async function key(secret) {return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);}
function hex(bytes) {return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}
async function validSession(cookie, secret) {
  if (!cookie) return false;
  const [expiry,signature,...extra] = cookie.split('.');
  if(extra.length || !/^\d{13}$/.test(expiry) || !/^[a-f0-9]{64}$/.test(signature??''))return false;
  if(Number(expiry)<=Date.now() || Number(expiry)>Date.now()+86400000)return false;
  return crypto.subtle.verify('HMAC',await key(secret),Uint8Array.from(signature.match(/../g),v=>parseInt(v,16)),encoder.encode(expiry));
}
async function passwordMatches(given,expected) {
  const signature = await crypto.subtle.sign('HMAC',await key(given || 'empty-password'),encoder.encode('Quadro ENEM login'));
  return crypto.subtle.verify('HMAC',await key(expected),signature,encoder.encode('Quadro ENEM login'));
}
export default {
  async fetch(request,env) {
    if (!env.ENEM_PASSWORD) return new Response('Acesso ainda não configurado.',{status:503,headers});
    const url = new URL(request.url);
    if (url.pathname === '/login' && request.method === 'POST') {
      if (request.headers.get('origin') !== url.origin) return new Response('Solicitação inválida.',{status:403,headers});
      if (Number(request.headers.get('content-length'))>2048) return new Response('Solicitação inválida.',{status:413,headers});
      let form;
      try {form = await request.formData();} catch {return new Response('Solicitação inválida.',{status:400,headers});}
      const password = form.get('password');
      if(typeof password !== 'string' || password.length>200 || !await passwordMatches(password,env.ENEM_PASSWORD)) return new Response(loginPage(true),{status:401,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
      const expiry = String(Date.now()+86400000);
      const signature = hex(await crypto.subtle.sign('HMAC',await key(env.ENEM_PASSWORD),encoder.encode(expiry)));
      return new Response(null,{status:303,headers:{...headers,Location:'/', 'Set-Cookie':`${COOKIE}=${expiry}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`}});
    }
    const cookie = request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
    if(!await validSession(cookie,env.ENEM_PASSWORD)) return new Response(loginPage(),{status:200,headers:{...headers,'Content-Type':'text/html; charset=utf-8'}});
    if(request.method!=='GET' && request.method!=='HEAD')return new Response('Método não permitido.',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
    const asset = SITE_ASSETS[url.pathname];
    if(!asset)return new Response('Página não encontrada.',{status:404,headers});
    return new Response(request.method==='HEAD'?null:asset.body,{headers:{...headers,'Content-Type':asset.type}});
  }
};
