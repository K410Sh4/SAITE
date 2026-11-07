'use strict';
const $ = id => document.getElementById(id);
let idToken = '', rows = [], selected = null, offset = 0, total = 0;
const labels = {saite:'SAITE', margot:'Margot', 'espaco-piscina':'Espaço Piscina'};
const state = {source:'todos', status:'todos'};
const errText = error => error?.message || 'Falha ao acessar a caixa de pedidos.';

function node(tag, className, text) {
  const el = document.createElement(tag);
  if(className)el.className = className;
  if(text !== undefined)el.textContent = String(text);
  return el;
}
function setMessage(message) { $('panel-status').textContent = message || ''; }
function showLogin(message) {
  idToken = '';
  $('gate').hidden = false; $('panel').hidden = true; $('signout').hidden = true;
  $('auth-state').textContent = 'Acesso restrito';
  $('gate-error').textContent = message || '';
}
function showPanel() {
  $('gate').hidden = true; $('panel').hidden = false; $('signout').hidden = false;
  $('auth-state').textContent = 'Google autenticado';
}
async function api(path, options={}) {
  if(!idToken) throw new Error('Faça login para consultar os pedidos.');
  const response = await fetch(path,{
    ...options, cache:'no-store',
    headers: {'Authorization':'Bearer '+idToken, ...(options.headers||{})}
  });
  if (response.status===401){showLogin('Acesso não autorizado ou sessão expirada. Entre novamente.');throw new Error('Autenticação expirada.')}
  const data = await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'Erro ao consultar o servidor.');
  return data;
}
function day(date) {
  if(!date) return 'Data indisponível';
  const d = new Date(date.replace(' ','T')+'Z');
  return Number.isNaN(d.valueOf())?date:d.toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',dateStyle:'short',timeStyle:'short'});
}
function renderList() {
  const root=$('requests'); root.replaceChildren();
  $('total').textContent=String(total);
  $('new-count').textContent=String(rows.filter(x=>x.status==='novo').length);
  $('page').textContent='Página '+(Math.floor(offset/30)+1);
  $('previous').disabled=offset<=0;
  $('next').disabled=offset+rows.length>=total;
  if(!rows.length){root.append(node('div','detail placeholder','Nenhum pedido neste filtro.'));$('detail').replaceChildren(node('div','placeholder','Nenhum pedido selecionado.'));return;}
  for(const entry of rows){
    const button=node('button','request'+(selected===entry.id?' active':''));button.type='button';
    const meta=node('div','meta');
    meta.append(node('span','',labels[entry.source]||entry.source),node('span','',day(entry.created_at)));
    button.append(meta,node('strong','',entry.subject),
      node('small','',entry.customer_name+' · '+entry.status));
    button.addEventListener('click',()=>{selected=entry.id;renderList();renderDetail(entry)});
    root.append(button);
  }
}
function gmailLink(entry){
  const subject='Re: '+entry.subject;
  return 'https://mail.google.com/mail/?view=cm&fs=1&to='+
    encodeURIComponent(entry.customer_email)+'&su='+encodeURIComponent(subject);
}
async function markStatus(entry,value){
  try{
    setMessage('Atualizando situação...');
    await api('/api/admin/requests/'+encodeURIComponent(entry.id),{
      method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:value})
    });
    entry.status=value;
    setMessage('Situação atualizada.');
    await load(false);
  }catch(error){setMessage(errText(error))}
}
function renderDetail(entry){
  const root=$('detail');root.replaceChildren();
  const eyebrow=node('p','eyebrow',labels[entry.source]||entry.source);
  const h=node('h2','',entry.subject);
  const from=node('p','from',entry.customer_name+' · '+entry.customer_email);
  const when=node('p','from','Recebido em '+day(entry.created_at));
  const msg=node('div','message',entry.message);
  const actions=node('div','detail-actions');
  const answer=node('a','primary','Responder pelo Gmail');
  answer.href=gmailLink(entry);answer.target='_blank';answer.rel='noopener noreferrer';
  answer.setAttribute('aria-label','Escrever e-mail para '+entry.customer_email+' no Gmail, em nova aba');
  const select=node('select');
  select.setAttribute('aria-label','Alterar situação do pedido');
  for(const [value,label] of Object.entries({novo:'Novo',lido:'Lido',respondido:'Respondido',arquivado:'Arquivado'})){
    const option=node('option','',label);option.value=value;option.selected=entry.status===value;select.append(option);
  }
  select.addEventListener('change',()=>markStatus(entry,select.value));
  actions.append(answer,select);
  root.append(eyebrow,h,from,when,msg,actions,
    node('p','from','O envio acontece no Gmail, com a conta de e-mail que você escolher. O status "Respondido" é marcado manualmente.'));
}
async function load(reset=true){
  if(reset){offset=0;selected=null;}
  setMessage('Carregando pedidos...');
  try{
    const query = new URLSearchParams({source:state.source,status:state.status,offset:String(offset)});
    const result=await api('/api/admin/requests?'+query.toString());
    total=Number(result.total||0);
    rows=Array.isArray(result.items)?result.items:[];
    setMessage(rows.length?'Pedidos atualizados.':'Nenhum pedido encontrado.');
    if(selected){
      const item=rows.find(x=>x.id===selected);
      if(item)renderDetail(item);else{$('detail').replaceChildren(node('div','placeholder','Selecione um pedido.'));selected=null;}
    }else {$('detail').replaceChildren(node('div','placeholder','Selecione um pedido.'));}
    renderList();
  }catch(error){setMessage(errText(error));}
}
async function login(credential){
  if(typeof credential!=='string'||!credential) return showLogin('Resposta de login inválida.');
  idToken=credential;
  showPanel();
  await load();
  if($('panel').hidden)showLogin('A conta não tem autorização para consultar os pedidos.');
}
async function boot(){
  let cfg;
  try{const res=await fetch('/api/admin/config',{cache:'no-store'});cfg=await res.json();}
  catch{showLogin('Falha ao carregar a configuração do painel.');return;}
  if(!cfg.googleClientId||cfg.googleClientId.startsWith('PREENCHA_')){
    showLogin('Configure o cliente OAuth Google no Worker para ativar o acesso.');
    return;
  }
  let count=0;
  while(!window.google?.accounts?.id && count++<60)await new Promise(r=>setTimeout(r,200));
  if(!window.google?.accounts?.id) {showLogin('O login Google não carregou. Verifique a conexão.');return;}
  google.accounts.id.initialize({client_id:cfg.googleClientId,
    auto_select:false, callback:response=>login(response.credential)});
  google.accounts.id.renderButton($('google-signin'),{type:'standard',theme:'outline',size:'large',text:'signin_with',shape:'pill'});
  $('gate-error').textContent='';
}
$('refresh').addEventListener('click',()=>load(false));
$('previous').addEventListener('click',()=>{offset=Math.max(0,offset-30);selected=null;load(false);});
$('next').addEventListener('click',()=>{if(offset+rows.length<total){offset+=30;selected=null;load(false);}});
$('filter-source').addEventListener('change',event=>{state.source=event.target.value;load();});
$('filter-status').addEventListener('change',event=>{state.status=event.target.value;load();});
$('signout').addEventListener('click',()=>{
  try{google.accounts.id.disableAutoSelect();}catch{}
  showLogin('Sessão encerrada neste navegador.');
});
boot();
