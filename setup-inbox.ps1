#Requires -Version 5.1
[CmdletBinding()]
param(
 [ValidateSet('Preparar','Ativar')][string]$Etapa='Preparar',
 [string]$DatabaseId=''
)
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
  if($databaseId){
    if($databaseId -notmatch '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$'){
      throw 'database_id invalido.'
    }
    # Normalizar: Worker usa env.DB. Remover bindings duplicados adicionados pelo Wrangler.
    $c.d1_databases=@([pscustomobject]@{
      binding='DB'
      database_name='saite-inbox-db'
      database_id=$databaseId
    })
  }
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
    if($DatabaseId){
      # Recuperacao segura: banco ja criado pelo usuario; NAO recriar.
      $id=$DatabaseId.Trim()
      Write-Host ('Reutilizando D1 existente: '+$id) -ForegroundColor Green
    }else{
      # Se Wrangler adicionou a base na configuracao durante a criacao, usar o ID local.
      $current=Get-Content $cfg -Raw | ConvertFrom-Json
      $existing=@($current.d1_databases | Where-Object {
        $_.database_name -eq 'saite-inbox-db' -and
        $_.database_id -match '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$'
      }) | Select-Object -First 1
      if($existing){$id=[string]$existing.database_id}
      if(-not $id){
        $list=& npx.cmd wrangler d1 list --json | Out-String
        Assert-Last 'listar D1'
        $all=ConvertFrom-Json -InputObject $list
        $found=@($all | Where-Object {$_.name -eq 'saite-inbox-db'}) | Select-Object -First 1
        if($found){
          $id=[string]$(if($found.uuid){$found.uuid}elseif($found.id){$found.id}else{$found.database_id})
        }else{
          & npx.cmd wrangler d1 create saite-inbox-db
          Assert-Last 'criar D1'
          $updated=Get-Content $cfg -Raw | ConvertFrom-Json
          $created=@($updated.d1_databases | Where-Object {
            $_.database_name -eq 'saite-inbox-db' -and $_.database_id -match '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$'
          }) | Select-Object -First 1
          if($created){$id=[string]$created.database_id}
        }
      }
    }
    if($id -notmatch '^[0-9a-fA-F]{8}(-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}$'){
      throw 'ID do banco nao identificado. Reexecute com -DatabaseId e o UUID exibido.'
    }
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
