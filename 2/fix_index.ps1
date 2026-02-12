$indexFile = "index.html"
$modalFile = "modal_stats_snippet.html"

# Read files
$lines = [System.IO.File]::ReadAllLines($indexFile, [System.Text.Encoding]::UTF8)
$modalContent = [System.IO.File]::ReadAllText($modalFile, [System.Text.Encoding]::UTF8)

$newLines = New-Object System.Collections.ArrayList
$inMess = $false

foreach ($line in $lines) {
    if ($line -match "<!-- List Statistics Modal -->") {
        $inMess = $true
        [void]$newLines.Add($modalContent)
        continue
    }
    
    if ($inMess -and ($line -match "<!-- Add Note Modal")) {
        $inMess = $false
    }
    
    if (-not $inMess) {
        [void]$newLines.Add($line)
    }
}

# Write back
[System.IO.File]::WriteAllLines($indexFile, $newLines.ToArray(), [System.Text.Encoding]::UTF8)
Write-Host "✅ index.html has been cleaned and fixed!"
