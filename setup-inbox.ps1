#Requires -Version 5.1
[CmdletBinding()]
param([ValidateSet('Preparar','Ativar')][string]$Etapa='Preparar')
$ErrorActionPreference='Stop'
$root=$PSScriptRoot
$worker=Join-Path $root 'inbox-worker'
$cfg=Join-Path $worker 'wrangler.jsonc'
$public=Join-Path $root 'inbox-public-config.js'
function Assert-Last([string]$label) { if($LASTEXITCODE -ne 0){throw "Falha em $label. Codigo: $LASTEXITCODE"} }
function Save-Utf8([string]$path,[string]$body){
  $utf8=New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($path,$body,$utf8)
}
function Set-Wrangler([string]$databaseId,[string]$clientId){
  $c=Get-Content $cfg -Raw | ConvertFrom-Json
  if($databaseId){$c.d1_databases[0].database_id=$databaseId}
  if($clientId){$c.vars.GOOGLE_CLIENT_ID=$clientId}
  Save-Utf8 $cfg (($c|ConvertTo-Json -Depth 16)+[Environment]::NewLine)
}
function Check-Tests {
  & npm.cmd run check;Assert-Last 'sintaxe'
  & npm.cmd test;Assert-Last 'testes'
}
if(-not (Get-Command node -ErrorAction SilentlyContinue)){throw 'Instale Node.js LTS.'}
if(-not (Get-Command npx.cmd -ErrorAction SilentlyContinue)){throw 'npx nao encontrado.'}
if(-not (Test-Path $cfg)){throw 'Repositorio SAITE desatualizado. Use git pull.'}
Push-Location $worker
try {
  if($Etapa -eq 'Preparar'){
    Write-Host '1. Instalando dependencias e rodando testes...' -ForegroundColor Cyan
    & npm.cmd install --no-audit --no-fund;Assert-Last 'npm install'
    Check-Tests
    Write-Host '2. Autorizando Cloudflare no navegador...' -ForegroundColor Cyan
    & npx.cmd wrangler login;Assert-Last 'wrangler login'
    & npx.cmd wrangler whoami;Assert-Last 'wrangler whoami'
    $list=& npx.cmd wrangler d1 list --json | Out-String
    Assert-Last 'listar D1'
    $found=@($list|ConvertFrom-Json|Where-Object {$_.name -eq 'saite-inbox-db'}) | Select-Object -First 1
    if($found){
      if((Read-Host 'D1 saite-inbox-db existente. Reutilizar? Escreva SIM') -ne 'SIM'){throw 'Cancelado sem alterar banco existente.'}
    }else{
      & npx.cmd wrangler d1 create saite-inbox-db;Assert-Last 'criar D1'
      $list=& npx.cmd wrangler d1 list --json | Out-String
      Assert-Last 'verificar D1'
      $found=@($list|ConvertFrom-Json|Where-Object {$_.name -eq 'saite-inbox-db'}) | Select-Object -First 1
    }
    $id=[string]$found.uuid
    if($id -notmatch '^[0-9a-fA-F-]{36}$'){throw 'UUID do banco D1 ausente. Confira d1 list --json.'}
    Set-Wrangler $id ''
    Write-Host '3. Criando tabelas privadas...' -ForegroundColor Cyan
    & npx.cmd wrangler d1 migrations apply saite-inbox-db --remote;Assert-Last 'migracoes'
    Write-Host '4. Publicando Worker em modo de preparacao...' -ForegroundColor Cyan
    & npx.cmd wrangler deploy;Assert-Last 'primeiro deploy'
    Write-Host 'PREPARADO. Anote a URL saite-inbox. Configure Google OAuth Client ID e Turnstile antes de -Etapa Ativar.' -ForegroundColor Green
  } else {
    $url=(Read-Host 'URL HTTPS do Worker (sem /admin.html)').TrimEnd('/')
    if($url -notmatch '^https://saite-inbox\.[a-z0-9-]+\.workers\.dev$'){throw 'URL de Worker inesperada.'}
    $client=(Read-Host 'Google OAuth Client ID PUBLICO').Trim()
    if($client -notmatch '^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$'){throw 'Client ID invalido.'}
    $sitekey=(Read-Host 'Turnstile SITE KEY PUBLICA').Trim()
    if($sitekey -notmatch '^0x[A-Za-z0-9_-]{12,}$'){throw 'Site key Turnstile invalida.'}
    Set-Wrangler '' $client
    Write-Host 'Informe o e-mail da conta Google administradora APENAS no prompt protegido do Wrangler.' -ForegroundColor Yellow
    & npx.cmd wrangler secret put ADMIN_EMAIL;Assert-Last 'ADMIN_EMAIL'
    Write-Host 'Informe a SECRET KEY do Turnstile APENAS no prompt do Wrangler.' -ForegroundColor Yellow
    & npx.cmd wrangler secret put TURNSTILE_SECRET;Assert-Last 'TURNSTILE_SECRET'
    $bytes=New-Object byte[] 32
    $rng=[Security.Cryptography.RandomNumberGenerator]::Create()
    try{$rng.GetBytes($bytes)}finally{$rng.Dispose()}
    $salt=[Convert]::ToBase64String($bytes)
    $salt | & npx.cmd wrangler secret put HASH_SALT
    Assert-Last 'HASH_SALT'
    $salt=$null
    Check-Tests
    & npx.cmd wrangler deploy;Assert-Last 'deploy'
    $health=Invoke-RestMethod -Uri ($url+'/api/health') -Method Get
    if(-not $health.ready){throw 'Health ready=false. Revise a configuracao no Cloudflare.'}
    $publicText="window.SAITE_INBOX_PUBLIC_CONFIG = Object.freeze({"+[Environment]::NewLine+
      "  apiBase: '$url',"+[Environment]::NewLine+
      "  turnstileSiteKey: '$sitekey'"+[Environment]::NewLine+"});"+[Environment]::NewLine
    Save-Utf8 $public $publicText
    Write-Host ('BACKEND ATIVO: '+$url+'/admin.html') -ForegroundColor Green
    Write-Host 'TESTE LOGIN GOOGLE ANTES de publicar inbox-public-config.js no GitHub.' -ForegroundColor Yellow
  }
}catch{
  Write-Host ('ERRO: '+$_.Exception.Message) -ForegroundColor Red
  exit 1
}finally{Pop-Location}
