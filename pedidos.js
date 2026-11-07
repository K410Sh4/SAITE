'use strict';
const cfg=window.SAITE_INBOX_PUBLIC_CONFIG||{};
try{
  const url=new URL(cfg.apiBase);
  if(url.protocol==='https:'&&!url.username&&!url.password&&url.pathname==='/'&&!url.search&&!url.hash){
    const link=document.getElementById('admin-link');
    link.href=url.origin+'/admin.html';
    link.hidden=false;
    document.getElementById('pending').hidden=true;
  }
}catch{}
