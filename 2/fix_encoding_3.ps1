$path = "c:\Users\yusuf.karaman\2\app.js"
$c = Get-Content $path -Raw

# Helper to build strings
$bad_S = [string][char]0xC3 + [string][char]0x2026 + [string][char]0xC2 + [string][char]0x17E
$c = $c.Replace($bad_S, 'Ş')

# Ä± -> ı (C4 B1 -> C4=Ä, B1=±)
$bad_i = [string][char]0xC4 + [string][char]0xB1
$c = $c.Replace($bad_i, 'ı')

# ÄŸ -> ğ (C4 9F -> C4=Ä, 9F=Ÿ)
$bad_g = [string][char]0xC4 + [string][char]0x178
$c = $c.Replace($bad_g, 'ğ')

# Ã¼ -> ü (C3 BC -> C3=Ã, BC=¼)
$bad_u = [string][char]0xC3 + [string][char]0xBC
$c = $c.Replace($bad_u, 'ü')

# Ã¶ -> ö (C3 B6 -> C3=Ã, B6=¶)
$bad_o = [string][char]0xC3 + [string][char]0xB6
$c = $c.Replace($bad_o, 'ö')

# Ã§ -> ç (C3 A7 -> C3=Ã, A7=§)
$bad_c = [string][char]0xC3 + [string][char]0xA7
$c = $c.Replace($bad_c, 'ç')

# Ã‡ -> Ç (C3 87 -> C3=Ã, 87=‡)
# 87 in 1252 is ‡ (Double dagger U+2021)
$bad_C_upper = [string][char]0xC3 + [string][char]0x2021
$c = $c.Replace($bad_C_upper, 'Ç')

# Ã– -> Ö (C3 96 -> C3=Ã, 96=–)
# 96 in 1252 is – (En dash U+2013)
$bad_O_upper = [string][char]0xC3 + [string][char]0x2013
$c = $c.Replace($bad_O_upper, 'Ö')

# KasÄ±m -> Ä± handled above.
# EylÃ¼l -> Ã¼ handled above.
# AralÄ±k -> Ä± handled above.

[System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Host "Encoding fix complete."
