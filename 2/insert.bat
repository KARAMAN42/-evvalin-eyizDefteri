@echo off
setlocal enabledelayedexpansion

REM Backup original
copy /Y index.html index.backup.html

REM Create a simple insertion point marker file
echo STATS_MODAL_MARKER > marker.txt

REM Use PowerShell with better escaping
powershell -Command ^
"$marker = Get-Content 'modal_stats_snippet.html' -Raw; ^
$html = Get-Content 'index.html' -Raw; ^
$html = $html.Replace('    ^<^!-- Add Note Modal', $marker + \"`r`n    ^<^!-- Add Note Modal\"); ^
Set-Content 'index.html' -Value $html -NoNewline"

del marker.txt
echo Modal inserted successfully!
