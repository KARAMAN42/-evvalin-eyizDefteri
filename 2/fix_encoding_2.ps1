$path = "c:\Users\yusuf.karaman\2\app.js"
$c = Get-Content $path -Raw
$c = $c -replace 'Ã…Âž', 'Ş'
$c = $c -replace 'MayÄ±s', 'Mayıs'
$c = $c -replace 'AÄŸustos', 'Ağustos'
$c = $c -replace 'EylÃ¼l', 'Eylül'
$c = $c -replace 'KasÄ±m', 'Kasım'
$c = $c -replace 'AralÄ±k', 'Aralık'
$c = $c -replace 'ğŸ‘‹', '👋'
[System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Host "Encoding fix complete."
