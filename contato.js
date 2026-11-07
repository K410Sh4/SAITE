'use strict';
const form=document.querySelector('#request-form');
const send=document.querySelector('#send-request');
const status=document.querySelector('#form-status');
const setup=document.querySelector('#setup');
const success=document.querySelector('#success');
const config=window.SAITE_INBOX_PUBLIC_CONFIG||{};
const sources=new Set(['saite','margot','espaco-piscina']);
let apiBase='', widgetId=null, challengeToken='', ready=false, sending=false;
const params=new URLSearchParams(location.search);
const requestedSource=params.get('origem')||'saite';
if(sources.has(requestedSource))form.elements.source.value=requestedSource;
const subject=(params.get('assunto')||'').trim().slice(0,120);
const summary=(params.get('pedido')||'').trim().slice(0,3000);
if(subject)form.elements.subject.value=subject;
if(summary)form.elements.message.value=summary;
function say(message){status.textContent=message||'';}
function setSubmit(){
  send.disabled=!ready||!challengeToken||sending;
  send.textContent=sending?'Enviando solicitação...':'Enviar solicitação →';
}
function validConfig(){
  try{
    const url=new URL(config.apiBase);
    if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')return false;
    if(typeof config.turnstileSiteKey!=='string'||!/^0x[A-Za-z0-9_-]{12,}$/.test(config.turnstileSiteKey))return false;
    apiBase=url.origin;
    return true;
  }catch{return false;}
}
async function start(){
  ready=validConfig();
  if(!ready){setup.hidden=false;setSubmit();return;}
  let attempts=0;
  while(!window.turnstile&&attempts++<80)await new Promise(r=>setTimeout(r,200));
  if(!window.turnstile){
    setup.hidden=false;setup.textContent='Não foi possível carregar a verificação de segurança. Atualize a página.';
    return;
  }
  widgetId=window.turnstile.render('#turnstile-slot',{
    sitekey:config.turnstileSiteKey,action:'pedido',
    callback:token=>{challengeToken=token;setSubmit();},
    'expired-callback':()=>{challengeToken='';say('A verificação expirou. Conclua o desafio novamente.');setSubmit();},
    'error-callback':()=>{challengeToken='';say('Falha na verificação de segurança. Tente novamente.');setSubmit();}
  });
  setSubmit();
}
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!ready||sending)return;
  if(!form.reportValidity())return;
  if(!challengeToken){say('Conclua a verificação de segurança antes de enviar.');return;}
  sending=true;setSubmit();say('');
  const payload={
    source:form.elements.source.value,
    name:form.elements.name.value.trim(),
    email:form.elements.email.value.trim(),
    subject:form.elements.subject.value.trim(),
    message:form.elements.message.value.trim(),
    website:form.elements.website.value,
    turnstileToken:challengeToken
  };
  try{
    const response=await fetch(apiBase+'/api/requests',{
      method:'POST',mode:'cors',credentials:'omit',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),referrerPolicy:'no-referrer'
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.ok)throw Error(result.error||'Não foi possível enviar a solicitação.');
    document.querySelector('#protocol').textContent='Protocolo: '+String(result.id||'').slice(0,8).toUpperCase();
    form.hidden=true;success.hidden=false;window.scrollTo({top:0,behavior:'smooth'});
  }catch(error){
    say(error.message||'O pedido não foi enviado. Tente novamente.');
  }finally{
    sending=false;challengeToken='';
    if(widgetId!==null&&window.turnstile)window.turnstile.reset(widgetId);
    setSubmit();
  }
});
document.querySelector('#another').addEventListener('click',()=>{
  form.reset();if(sources.has(requestedSource))form.elements.source.value=requestedSource;
  success.hidden=true;form.hidden=false;say('');setSubmit();
});
start();
