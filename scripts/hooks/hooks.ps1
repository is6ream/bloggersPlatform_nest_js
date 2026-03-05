# Project terminal hook for PowerShell
# Intercepts every command and asks for AI/user confirmation before executing
#
# Usage: . .\scripts\hooks\hooks.ps1
# Or add to project terminal profile

Set-PSReadLineKeyHandler -Key Enter -ScriptBlock {
    $line = $null
    $cursor = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$cursor)

    $trimmed = $line.Trim()

    if ($trimmed -eq '') {
        [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
        return
    }

    Write-Host ""
    Write-Host "┌─ Command to execute ────────────────────────────" -ForegroundColor DarkCyan
    Write-Host "│  $trimmed" -ForegroundColor Yellow
    Write-Host "└─────────────────────────────────────────────────" -ForegroundColor DarkCyan

    # [AI hook point] — here you can call an AI API to analyze the command
    # Example: Invoke-RestMethod -Uri "http://localhost:PORT/check" -Body @{ cmd = $trimmed }

    $confirm = Read-Host "Execute? [Y/n]"

    if ($confirm -eq '' -or $confirm -eq 'y' -or $confirm -eq 'Y') {
        [Microsoft.PowerShell.PSConsoleReadLine]::AcceptLine()
    } else {
        Write-Host "Command cancelled." -ForegroundColor Red
        [Microsoft.PowerShell.PSConsoleReadLine]::RevertLine()
    }
}

Write-Host "✅ Pre-command hook enabled (PowerShell)" -ForegroundColor Green
