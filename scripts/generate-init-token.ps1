# Generate Init Token for Embed Widget
# Usage: .\scripts\generate-init-token.ps1 -TenantId "northwoods-prod"

param(
    [Parameter(Mandatory=$true)]
    [string]$TenantId
)

# Generate 32 random bytes (256 bits)
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)

# Convert to hexadecimal string
$hex = [System.BitConverter]::ToString($bytes) -replace '-',''

# Create token
$token = "${TenantId}_${hex}"

Write-Host ""
Write-Host "Generated Init Token for tenant: $TenantId" -ForegroundColor Green
Write-Host ""
Write-Host "Token:" -ForegroundColor Yellow
Write-Host $token
Write-Host ""
Write-Host "Add this to your embed code:" -ForegroundColor Cyan
Write-Host "  initToken: `"$token`""
Write-Host ""
