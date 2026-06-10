param(
  [string]$HostName = "lucylp.com",
  [string]$Key = "99f7affa86b6db83f25d5e75f00b4710",
  [string]$KeyLocation = "https://lucylp.com/99f7affa86b6db83f25d5e75f00b4710.txt",
  [string]$SitemapPath = "sitemap.xml",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SitemapPath)) {
  throw "Sitemap not found: $SitemapPath"
}

[xml]$sitemap = Get-Content -LiteralPath $SitemapPath -Raw
$urlList = @($sitemap.urlset.url | ForEach-Object { $_.loc } | Where-Object { $_ })

if ($urlList.Count -eq 0) {
  throw "No URLs found in sitemap: $SitemapPath"
}

$body = @{
  host = $HostName
  key = $Key
  keyLocation = $KeyLocation
  urlList = $urlList
} | ConvertTo-Json -Depth 4

if ($DryRun) {
  Write-Host "Dry run: would submit $($urlList.Count) URL(s) to IndexNow for $HostName."
  $urlList | ForEach-Object { Write-Host " - $_" }
  exit 0
}

$response = Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.indexnow.org/indexnow" `
  -ContentType "application/json; charset=utf-8" `
  -Body $body

Write-Host "Submitted $($urlList.Count) URL(s) to IndexNow for $HostName."
$urlList | ForEach-Object { Write-Host " - $_" }

if ($null -ne $response) {
  $response | ConvertTo-Json -Depth 4
}
