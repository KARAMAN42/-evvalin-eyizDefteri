$indexFile = "index.html"
$modalFile = "modal_stats_snippet.html"
$backupFile = "index.html.backup_before_modal"

# Backup
Copy-Item $indexFile $backupFile -Force

# Read files
$indexLines = [System.IO.File]::ReadAllLines($indexFile, [System.Text.Encoding]::UTF8)
$modalContent = [System.IO.File]::ReadAllText($modalFile, [System.Text.Encoding]::UTF8)

# Find insertion point and build new content
$newContent = New-Object System.Collections.ArrayList
$inserted = $false

for ($i = 0; $i -lt $indexLines.Length; $i++) {
    $line = $indexLines[$i]
    
    # Check if this is the insertion point
    if ((-not $inserted) -and ($line -match "Add Note Modal.*Redesigned")) {
        # Add empty line
        [void]$newContent.Add("")
        # Add comment
        [void]$newContent.Add("    <!-- List Statistics Modal -->")
        # Add opening div
        [void]$newContent.Add("    <div id=`"modal-list-stats`" class=`"modal hidden`">")
        # Add modal content (indent each line)
        $modalLinesList = $modalContent -split "`r?`n"
        foreach ($modalLine in $modalLinesList) {
            if ($modalLine.Trim() -ne "") {
                [void]$newContent.Add("        $modalLine")
            }
        }
        # Add closing div
        [void]$newContent.Add("    </div>")
        # Add empty line
        [void]$newContent.Add("")
        
        $inserted = $true
        Write-Host "Modal HTML inserted before line $($i + 1)" -ForegroundColor Green
    }
    
    # Add original line
    [void]$newContent.Add($line)
}

# Write back
[System.IO.File]::WriteAllLines($indexFile, $newContent.ToArray(), [System.Text.Encoding]::UTF8)

if ($inserted) {
    Write-Host "SUCCESS: Modal HTML added to index.html!" -ForegroundColor Green
    Write-Host "Backup saved as: $backupFile" -ForegroundColor Cyan
} else {
    Write-Host "WARNING: Insertion point not found!" -ForegroundColor Yellow
}
