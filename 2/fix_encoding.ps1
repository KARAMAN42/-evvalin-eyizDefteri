$path = "c:\Users\yusuf.karaman\2\app.js"
$c = Get-Content $path -Raw
$c = $c -replace 'Ã¼', 'ü'
$c = $c -replace 'Ã¶', 'ö'
$c = $c -replace 'Ã§', 'ç'
$c = $c -replace 'ÄŸ', 'ğ'
$c = $c -replace 'Ä±', 'ı'
$c = $c -replace 'Ä°', 'İ'
$c = $c -replace 'ÅŸ', 'ş'
$c = $c -replace 'Ã‡', 'Ç'
$c = $c -replace 'Ã–', 'Ö'
$c = $c -replace 'Ãœ', 'Ü'
$c = $c -replace 'HatalÄ±', 'Hatalı'
$c = $c -replace 'formatÄ±', 'formatı'
$c = $c -replace 'yÃ¼kleme', 'yükleme'
$c = $c -replace 'yapÄ±lsÄ±n', 'yapılsın'
$c = $c -replace 'baÅŸarÄ±yla', 'başarıyla'
$c = $c -replace 'yÃ¼klendi', 'yüklendi'
[System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Host "Encoding fix complete."
