$path = "c:\Users\yusuf.karaman\2\app.js"
$lines = Get-Content $path
$line = $lines | Where-Object { $_ -like "*const name =*" } | Select-Object -First 1
$bytes = [int[]][char[]]$line
$bytes -join ', ' | Out-File "c:\Users\yusuf.karaman\2\debug_chars.txt"
