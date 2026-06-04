Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$BaseDir = $PSScriptRoot
$ServerDir = Join-Path $BaseDir "server"
$AgentDir = Join-Path $BaseDir "local_agent\Agent\LocalManager"
$CloudflaredPath = Join-Path $BaseDir "cloudflared.exe"
$TunnelLog = Join-Path $BaseDir "tunnel.log"

function Show-Message {
    param([string]$Text)
    Write-Host "[*] $Text"
}

# --- 1. Kill old processes ---
Show-Message "Cleaning up old processes..."
Get-Process node, cloudflared, python -ErrorAction SilentlyContinue | Where-Object { $_.Path -match "brms" } | Stop-Process -Force -ErrorAction SilentlyContinue
$tcpConn = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
if ($tcpConn) {
    Stop-Process -Id $tcpConn.OwningProcess -Force -ErrorAction SilentlyContinue
}

# --- 2. Cloudflared setup ---
if (-not (Test-Path $CloudflaredPath)) {
    Show-Message "Downloading Cloudflared..."
    Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile $CloudflaredPath
}

# --- 3. Backend Setup & Run ---
Show-Message "Setting up backend..."
# Use cmd /c to avoid PowerShell execution policy issues with npm
Start-Process cmd.exe -ArgumentList "/c cd /d `"$ServerDir`" && npm install && npx prisma generate && npx prisma db push" -Wait -WindowStyle Hidden

Show-Message "Starting backend API on port 5001..."
$BackendProcess = Start-Process cmd.exe -ArgumentList "/c cd /d `"$ServerDir`" && npm run dev" -WindowStyle Hidden -PassThru

# --- 4. Agent Setup & Run ---
if (Test-Path $AgentDir) {
    Show-Message "Setting up Local Agent..."
    $VenvPython = Join-Path $AgentDir "venv\Scripts\python.exe"
    if (-not (Test-Path $VenvPython)) {
        Start-Process cmd.exe -ArgumentList "/c cd /d `"$AgentDir`" && python -m venv venv && venv\Scripts\pip install -r requirements.txt" -Wait -WindowStyle Hidden
    }
    Show-Message "Starting Local Agent..."
    $AgentProcess = Start-Process cmd.exe -ArgumentList "/c cd /d `"$AgentDir`" && venv\Scripts\python.exe main.py" -WindowStyle Hidden -PassThru
}

# --- 5. Tunnel Run & Scrape ---
Show-Message "Starting Cloudflare Tunnel..."
if (Test-Path $TunnelLog) { Remove-Item $TunnelLog -Force }

$TunnelProcess = Start-Process $CloudflaredPath -ArgumentList "tunnel --url http://localhost:5001" -RedirectStandardError $TunnelLog -WindowStyle Hidden -PassThru

$CloudflareUrl = $null
Show-Message "Waiting for Cloudflare URL..."
for ($i=0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $TunnelLog) {
        $logContent = Get-Content $TunnelLog -Raw
        if ($logContent -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
            $CloudflareUrl = $matches[1]
            break
        }
    }
}

if (-not $CloudflareUrl) {
    $CloudflareUrl = "Failed to obtain URL. Check tunnel.log."
}

# --- 6. GUI Window ---
$Form = New-Object System.Windows.Forms.Form
$Form.Text = "BRMS - Control Panel"
$Form.Size = New-Object System.Drawing.Size(450,250)
$Form.StartPosition = "CenterScreen"
$Form.FormBorderStyle = "FixedDialog"
$Form.MaximizeBox = $false

$Label = New-Object System.Windows.Forms.Label
$Label.Text = "✅ BRMS is Running Successfully!"
$Label.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$Label.Location = New-Object System.Drawing.Point(20, 20)
$Label.AutoSize = $true
$Form.Controls.Add($Label)

$UrlLabel = New-Object System.Windows.Forms.Label
$UrlLabel.Text = "Cloudflare Tunnel URL:"
$UrlLabel.Location = New-Object System.Drawing.Point(20, 70)
$UrlLabel.AutoSize = $true
$Form.Controls.Add($UrlLabel)

$TextBox = New-Object System.Windows.Forms.TextBox
$TextBox.Location = New-Object System.Drawing.Point(20, 95)
$TextBox.Size = New-Object System.Drawing.Size(390, 20)
$TextBox.Text = $CloudflareUrl
$TextBox.ReadOnly = $true
$Form.Controls.Add($TextBox)

$CopyButton = New-Object System.Windows.Forms.Button
$CopyButton.Location = New-Object System.Drawing.Point(20, 140)
$CopyButton.Size = New-Object System.Drawing.Size(120, 40)
$CopyButton.Text = "Copy URL"
$CopyButton.Add_Click({
    [System.Windows.Forms.Clipboard]::SetText($TextBox.Text)
    [System.Windows.Forms.MessageBox]::Show("URL copied to clipboard!", "BRMS")
})
$Form.Controls.Add($CopyButton)

$StopButton = New-Object System.Windows.Forms.Button
$StopButton.Location = New-Object System.Drawing.Point(160, 140)
$StopButton.Size = New-Object System.Drawing.Size(120, 40)
$StopButton.Text = "Stop Server && Exit"
$StopButton.BackColor = [System.Drawing.Color]::LightCoral
$StopButton.Add_Click({
    if ($BackendProcess) { Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($AgentProcess) { Stop-Process -Id $AgentProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($TunnelProcess) { Stop-Process -Id $TunnelProcess.Id -Force -ErrorAction SilentlyContinue }
    
    # Extra safety kill
    Get-Process node, cloudflared, python -ErrorAction SilentlyContinue | Where-Object { $_.Path -match "brms" } | Stop-Process -Force -ErrorAction SilentlyContinue
    $tcpConn = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
    if ($tcpConn) { Stop-Process -Id $tcpConn.OwningProcess -Force -ErrorAction SilentlyContinue }

    $Form.Close()
})
$Form.Controls.Add($StopButton)

$Form.Add_FormClosed({
    # Ensure processes die if the user simply clicks the X
    if ($BackendProcess) { Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($AgentProcess) { Stop-Process -Id $AgentProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($TunnelProcess) { Stop-Process -Id $TunnelProcess.Id -Force -ErrorAction SilentlyContinue }
    
    Get-Process node, cloudflared, python -ErrorAction SilentlyContinue | Where-Object { $_.Path -match "brms" } | Stop-Process -Force -ErrorAction SilentlyContinue
    $tcpConn = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
    if ($tcpConn) { Stop-Process -Id $tcpConn.OwningProcess -Force -ErrorAction SilentlyContinue }
})

[void]$Form.ShowDialog()
