# Deploy all Anthropic edge functions to Supabase
# Run in PowerShell after: npx supabase login

$ErrorActionPreference = "Stop"
$ProjectRef = "zcyaqphtkeonrxgsmfeg"

Set-Location $PSScriptRoot

Write-Host "Checking Supabase CLI auth..." -ForegroundColor Cyan
npx supabase projects list | Out-Null

$functions = @(
  "sg-chat",
  "sg-market-news",
  "sg-market-trends",
  "generate-report"
)

foreach ($fn in $functions) {
  Write-Host "`nDeploying $fn ..." -ForegroundColor Yellow
  npx supabase functions deploy $fn --project-ref $ProjectRef --use-api
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to deploy $fn" -ForegroundColor Red
    exit 1
  }
  Write-Host "Deployed $fn" -ForegroundColor Green
}

Write-Host "`nAll functions deployed successfully." -ForegroundColor Green
Write-Host "Test: AI Analyst chat, News refresh, Trends page, Premium report." -ForegroundColor Cyan
