param(
  [int]$Port = 5000,
  [string]$Subdomain = ""
)

if ($Port -le 0) {
  throw "Port must be a positive integer."
}

$env:LOCAL_PORT = "$Port"

if ([string]::IsNullOrWhiteSpace($Subdomain)) {
  Remove-Item Env:LT_SUBDOMAIN -ErrorAction SilentlyContinue
} else {
  $env:LT_SUBDOMAIN = $Subdomain.Trim()
}

Write-Host "Starting LocalTunnel for port $Port..." -ForegroundColor Cyan
if ($env:LT_SUBDOMAIN) {
  Write-Host "Requested subdomain: $($env:LT_SUBDOMAIN)" -ForegroundColor DarkCyan
}

pnpm run tunnel:start
