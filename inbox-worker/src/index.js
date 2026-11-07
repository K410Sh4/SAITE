// SAITE Inbox - Cloudflare Worker (somente recepcao e triagem).
// A caixa administrativa fica em origem separada das vitrines GitHub Pages.
const PUBLIC_ORIGIN = 'https://k410sh4.github.io';
const SOURCES = new Set(['saite', 'margot', 'espaco-piscina']);
const STATUSES = new Set(['novo', 'lido', 'respondido', 'arquivado']);
const MAX_BODY = 12000;
const KEY_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/certs';

function json(data, status = 200, origin = '', extra = {}) {
  const h = new Headers({'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extra});
  if (origin === PUBLIC_ORIGIN) {
    h.set('Access-Control-Allow-Origin', PUBLIC_ORIGIN);
    h.set('Vary', 'Origin');
  }
  return new Response(JSON.stringify(data), {status, headers: h});
}
function clean(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max + 1) : '';
}
function safeMessage(value, max) {
  const t = clean(value, max);
  return t && !/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(t) ? t : '';
}
function validEmail(v) {
  return v.length <= 254 && /^[^\s@<>]{1,64}@[^\s@<>]+\.[^\s@<>]{2,}$/.test(v) &&
    !/[\r\n]/.test(v);
}
async function bodyJson(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw Error('content-type');
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw Error('size');
  const reader = request.body?.getReader();
  if (!reader) throw Error('empty');
  let count = 0, parts = [];
  try {
    for (;;) {
      const {value, done} = await reader.read();
      if (done) break;
      count += value.byteLength;
      if (count > MAX_BODY) { await reader.cancel(); throw Error('size'); }
      parts.push(value);
    }
    const buf = new Uint8Array(count);
    let p = 0;
    for (const part of parts) { buf.set(part, p); p += part.length; }
    const obj = JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(buf));
    if (!obj || Array.isArray(obj) || typeof obj !== 'object') throw Error('object');
    return obj;
  } catch { throw Error('invalid-json'); }
}
function b64url(v) {
  if (!/^[A-Za-z0-9_-]+$/.test(v)) throw Error('jwt');
  const a = v.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(a + '='.repeat((4 - a.length % 4) % 4)), c => c.charCodeAt(0));
}
function parseJwtPart(s) {
  return JSON.parse(new TextDecoder().decode(b64url(s)));
}
async function verifyGoogleIdToken(request, env) {
  const header = request.headers.get('authorization') || '';
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(header)) return false;
  if (!env.GOOGLE_CLIENT_ID || !(env.ADMIN_EMAIL || env.ADMIN_GOOGLE_SUB)) return false;
  const jwt = header.slice(7);
  if (jwt.length > 6000) return false;
  try {
    const parts = jwt.split('.');
    if (parts.length !== 3) return false;
    const head = parseJwtPart(parts[0]);
    const claims = parseJwtPart(parts[1]);
    const now = Math.floor(Date.now()/1000);
    if (head.alg !== 'RS256' || !head.kid ||
        claims.aud !== env.GOOGLE_CLIENT_ID ||
        !['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss) ||
        claims.exp <= now || claims.iat > now+60 ||
        (claims.nbf && claims.nbf > now) || !claims.sub ||
        (claims.email_verified !== true && claims.email_verified !== 'true')) return false;
    if (env.ADMIN_GOOGLE_SUB && claims.sub !== env.ADMIN_GOOGLE_SUB) return false;
    if (env.ADMIN_EMAIL && claims.email?.toLowerCase() !== env.ADMIN_EMAIL.trim().toLowerCase()) return false;
    const keys = await (await fetch(KEY_ENDPOINT, {cf:{cacheTtl:300, cacheEverything:true}})).json();
    const jwk = keys.keys?.find(k=>k.kid === head.kid && k.kty === 'RSA' && k.alg === 'RS256');
    if (!jwk) return false;
    const key = await crypto.subtle.importKey('jwk', jwk,
      {name:'RSASSA-PKCS1-v1_5', hash:'SHA-256'}, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(parts[2]),
      new TextEncoder().encode(parts[0]+'.'+parts[1]));
  } catch { return false; }
}
async function digest(value, salt) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt+':'+value));
  return Array.from(new Uint8Array(hash), b=>b.toString(16).padStart(2,'0')).join('');
}
async function throttle(db, key, now, windowSeconds, max) {
  const until = now + windowSeconds;
  const r = await db.prepare(
    'INSERT INTO throttle (key, hits, reset_at) VALUES (?, 1, ?) '+
    'ON CONFLICT(key) DO UPDATE SET hits = CASE WHEN reset_at <= ? THEN 1 ELSE hits+1 END, '+
    'reset_at = CASE WHEN reset_at <= ? THEN ? ELSE reset_at END RETURNING hits'
  ).bind(key, until, now, now, until).first();
  return (r?.hits || 999) <= max;
}
async function siteverify(token, ip, env) {
  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({secret:env.TURNSTILE_SECRET, response:token, remoteip:ip}),
    signal:AbortSignal.timeout(8000)
  });
  if (!result.ok) return false;
  const data = await result.json();
  return data.success === true && data.hostname === 'k410sh4.github.io' &&
    data.action === 'pedido';
}
async function receive(request, env) {
  const origin = request.headers.get('origin') || '';
  if (origin !== PUBLIC_ORIGIN) return json({error:'Origem nao autorizada.'},403,origin);
  if (!env.DB || !env.TURNSTILE_SECRET || !env.HASH_SALT)
    return json({error:'Atendimento ainda nao configurado.'},503,origin);
  let input;
  try { input = await bodyJson(request); }
  catch { return json({error:'Formato de envio invalido.'},400,origin); }
  const source = clean(input.source,30).toLowerCase();
  const name = safeMessage(input.name,80);
  const email = clean(input.email,254).toLowerCase();
  const subject = safeMessage(input.subject,120);
  const message = safeMessage(input.message,3000);
  const trap = clean(input.website,100);
  const turnstile = clean(input.turnstileToken,2048);
  if (trap) return json({error:'Solicitacao nao aceita.'},400,origin);
  if (!SOURCES.has(source) || name.length < 2 || name.length > 80 ||
      !validEmail(email) || subject.length < 4 || subject.length > 120 ||
      message.length < 12 || message.length > 3000 || turnstile.length < 10)
    return json({error:'Confira o nome, o email e a descricao do pedido.'},400,origin);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Math.floor(Date.now()/1000);
  const ipHash = await digest(ip, env.HASH_SALT);
  if (!(await throttle(env.DB, 'ip:'+ipHash, now, 3600, 10)))
    return json({error:'Limite temporario de envios atingido.'},429,origin,{'Retry-After':'3600'});
  const emailHash = await digest(email, env.HASH_SALT);
  if (!(await throttle(env.DB, 'email:'+emailHash, now, 3600, 4)))
    return json({error:'Aguarde antes de enviar outra solicitacao.'},429,origin,{'Retry-After':'3600'});
  let approved = false;
  try { approved = await siteverify(turnstile, ip, env); } catch {}
  if (!approved) return json({error:'Validacao antispam nao concluida. Tente novamente.'},403,origin);
  const fingerprint = await digest(email+'|'+source+'|'+subject+'|'+message, env.HASH_SALT);
  const recent = await env.DB.prepare(
    "SELECT id FROM requests WHERE fingerprint=? AND created_at>=datetime('now','-10 minutes') LIMIT 1"
  ).bind(fingerprint).first();
  if (recent) return json({ok:true, id:recent.id, duplicate:true},200,origin);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT INTO requests (id,source,customer_name,customer_email,subject,message,fingerprint,status) "+
    "VALUES (?,?,?,?,?,?,?,'novo')"
  ).bind(id,source,name,email,subject,message,fingerprint).run();
  return json({ok:true,id},201,origin);
}
async function admin(request, env, url) {
  if (!await verifyGoogleIdToken(request, env)) return json({error:'Acesso nao autorizado.'},401);
  if (!env.DB) return json({error:'Banco indisponivel.'},503);
  const path = url.pathname;
  if (request.method === 'GET' && path === '/api/admin/requests') {
    const src = url.searchParams.get('source')||'todos';
    const status = url.searchParams.get('status')||'todos';
    const offset = Number(url.searchParams.get('offset')||0);
    if (!(src==='todos'||SOURCES.has(src)) || !(status==='todos'||STATUSES.has(status)) ||
        !Number.isInteger(offset)||offset<0||offset>5000) return json({error:'Filtro invalido.'},400);
    const query = "FROM requests WHERE (?='todos' OR source=?) AND (?='todos' OR status=?)";
    const rows = await env.DB.prepare(
      'SELECT id,source,customer_name,customer_email,subject,message,status,created_at,updated_at '+
      query+' ORDER BY created_at DESC,id DESC LIMIT 30 OFFSET ?'
    ).bind(src,src,status,status,offset).all();
    const count = await env.DB.prepare('SELECT COUNT(*) AS total '+query)
      .bind(src,src,status,status).first();
    return json({items:rows.results||[],total:count?.total||0,offset});
  }
  const match = /^\/api\/admin\/requests\/([a-f0-9-]{36})$/.exec(path);
  if (match && request.method==='PATCH') {
    let payload;
    try {payload=await bodyJson(request);} catch{return json({error:'JSON invalido.'},400);}
    const status=clean(payload.status,20);
    if (!STATUSES.has(status)) return json({error:'Status invalido.'},400);
    const updated=await env.DB.prepare(
      "UPDATE requests SET status=?,updated_at=datetime('now') WHERE id=? RETURNING id,status"
    ).bind(status,match[1]).first();
    return updated?json({ok:true,item:updated}):json({error:'Pedido nao encontrado.'},404);
  }
  return json({error:'Rota nao encontrada.'},404);
}
function securityHeaders(response, isAdmin) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Frame-Options','DENY');
  if(isAdmin){
    headers.set('Cache-Control','no-store');
    headers.set('Content-Security-Policy',
      "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; "+
      "script-src 'self' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://accounts.google.com; "+
      "img-src 'self' data: https://*.googleusercontent.com; "+
      "frame-src https://accounts.google.com; connect-src 'self' https://accounts.google.com");
  }
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
export default {
  async fetch(request,env) {
    const url = new URL(request.url), path=url.pathname;
    if(path==='/api/health'&&request.method==='GET')
      return json({ok:true,ready:!!(env.DB&&env.TURNSTILE_SECRET&&env.HASH_SALT&&env.GOOGLE_CLIENT_ID&&(env.ADMIN_EMAIL||env.ADMIN_GOOGLE_SUB))});
    if(path==='/api/requests' && request.method==='OPTIONS') {
      if(request.headers.get('Origin')!==PUBLIC_ORIGIN)return new Response(null,{status:403});
      return new Response(null,{status:204,headers:{
        'Access-Control-Allow-Origin':PUBLIC_ORIGIN,
        'Access-Control-Allow-Methods':'POST,OPTIONS',
        'Access-Control-Allow-Headers':'Content-Type',
        'Access-Control-Max-Age':'600', 'Vary':'Origin'}});
    }
    if(path==='/api/requests'&&request.method==='POST')return receive(request,env);
    if(path==='/api/admin/config'&&request.method==='GET')
      return json({googleClientId:env.GOOGLE_CLIENT_ID||''});
    if(path.startsWith('/api/admin/'))return admin(request,env,url);
    if(path.startsWith('/api/'))return json({error:'Rota nao encontrada.'},404);
    if(request.method!=='GET'&&request.method!=='HEAD')return new Response('Nao permitido',{status:405});
    const asset=await env.ASSETS.fetch(request);
    return securityHeaders(asset,path.startsWith('/admin'));
  },
  async scheduled(_event,env) {
    if (!env.DB)return;
    await env.DB.prepare("DELETE FROM requests WHERE created_at<datetime('now','-180 days')").run();
    await env.DB.prepare('DELETE FROM throttle WHERE reset_at < ?')
      .bind(Math.floor(Date.now()/1000)).run();
  }
};