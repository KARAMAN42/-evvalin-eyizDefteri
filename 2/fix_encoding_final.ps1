$path = "c:\Users\yusuf.karaman\2\app.js"
$c = Get-Content $path -Raw

# Ã…Âž -> Ş (195, 8230, 194, 158)
$bad_S = [string][char]195 + [string][char]8230 + [string][char]194 + [string][char]158
$c = $c.Replace($bad_S, 'Ş')

# Ä± -> ı (196, 177)
$bad_i = [string][char]196 + [string][char]177
$c = $c.Replace($bad_i, 'ı')

# ÄŸ -> ğ (196, 376)
$bad_g = [string][char]196 + [string][char]376
$c = $c.Replace($bad_g, 'ğ')

# Ã¼ -> ü (195, 188)
$bad_u = [string][char]195 + [string][char]188
$c = $c.Replace($bad_u, 'ü')

# Ã¶ -> ö (195, 182)
$bad_o = [string][char]195 + [string][char]182
$c = $c.Replace($bad_o, 'ö')

# Ã‡ -> Ç (195, 8225) (8225 = 2021 = 0x2021 Double Dagger, 0x87 in 1252)
$bad_C = [string][char]195 + [string][char]8225
$c = $c.Replace($bad_C, 'Ç')

# Ã– -> Ö (195, 8211) (8211 = 2013 = 0x2013 En Dash, 0x96 in 1252)
$bad_O = [string][char]195 + [string][char]8211
$c = $c.Replace($bad_O, 'Ö')

[System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Host "Decoding complete."
