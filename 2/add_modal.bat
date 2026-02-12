@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo Modal HTML ekleniyor...

REM Backup
copy /Y index.html index.html.backup_final >nul

REM PowerShell ile ekle
powershell -NoProfile -Command "$html = [System.IO.File]::ReadAllText('index.html', [System.Text.Encoding]::UTF8); $modal = [System.IO.File]::ReadAllText('modal_stats_snippet.html', [System.Text.Encoding]::UTF8); $marker = '    <!-- Add Note Modal (Redesigned) -->'; $html = $html.Replace($marker, \"`r`n`r`n    $modal`r`n`r`n$marker\"); [System.IO.File]::WriteAllText('index.html', $html, [System.Text.Encoding]::UTF8)"

if %ERRORLEVEL% EQU 0 (
    echo BASARILI: Modal HTML eklendi!
) else (
    echo HATA: Ekleme basarisiz oldu
)

pause
