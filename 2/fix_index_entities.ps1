$path = "c:\Users\yusuf.karaman\2\index.html"
$c = Get-Content $path -Raw

# Replace directly with HTML entities to be encoding-agnostic
$c = $c.Replace('Ş', '&#350;')
$c = $c.Replace('ş', '&#351;')
$c = $c.Replace('Ç', '&Ccedil;')
$c = $c.Replace('ç', '&ccedil;')
$c = $c.Replace('Ğ', '&#286;')
$c = $c.Replace('ğ', '&#287;')
$c = $c.Replace('İ', '&#304;')
$c = $c.Replace('ı', '&#305;')
$c = $c.Replace('Ö', '&Ouml;')
$c = $c.Replace('ö', '&ouml;')
$c = $c.Replace('Ü', '&Uuml;')
$c = $c.Replace('ü', '&uuml;')

# Also handle the double-encoded versions if they exist
$bad_S = [string][char]195 + [string][char]8230 + [string][char]194 + [string][char]158
$c = $c.Replace($bad_S, '&#350;')

$bad_u = [string][char]195 + [string][char]188
$c = $c.Replace($bad_u, '&uuml;')

$bad_i = [string][char]196 + [string][char]177
$c = $c.Replace($bad_i, '&#305;')

$bad_C = [string][char]195 + [string][char]8225
$c = $c.Replace($bad_C, '&Ccedil;')

[System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Host "Index HTML entities fixed."
