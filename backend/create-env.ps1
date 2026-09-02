# PowerShell script to create .env file for BrightWords Backend
# Run this script: .\create-env.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BrightWords Backend - Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$envPath = Join-Path $PSScriptRoot ".env"

# Check if .env already exists
if (Test-Path $envPath) {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Cancelled. Existing .env file preserved." -ForegroundColor Yellow
        exit
    }
}

Write-Host "Optional: Groq API key for Sign Language & Fun Activities AI - free tier at https://console.groq.com (press Enter to skip):" -ForegroundColor Gray
$groqApiKey = Read-Host "Groq API Key (or press Enter)"

# Create .env content
$envContent = @"
# BrightWords Backend Environment Variables
# Generated on $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# Sign Language & Fun Activities AI - Groq LLM (Optional, free tier)
GROQ_API_KEY=$groqApiKey
GROQ_MODEL=openai/gpt-oss-20b

# Server Port (Optional - defaults to 3000)
PORT=3000
"@

# Write to file
try {
    $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
    Write-Host ""
    Write-Host "✅ .env file created successfully!" -ForegroundColor Green
    Write-Host "   Location: $envPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Keep this file secure and never commit it to git!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your backend server" -ForegroundColor White
} catch {
    Write-Host ""
    Write-Host "❌ Error creating .env file: $_" -ForegroundColor Red
    exit 1
}
