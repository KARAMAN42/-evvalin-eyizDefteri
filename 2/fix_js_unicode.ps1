$path = "c:\Users\yusuf.karaman\2\app.js"
$c = Get-Content $path -Raw

# Helper function to do replace
function Rep($text, $find, $repl) {
    return $text.Replace($find, $repl)
}

# Replace proper chars with Unicode Escapes
# Ş -> \u015E
$c = Rep $c 'Ş' '\u015E'
# ş -> \u015F
$c = Rep $c 'ş' '\u015F'
# Ç -> \u00C7
$c = Rep $c 'Ç' '\u00C7'
# ç -> \u00E7
$c = Rep $c 'ç' '\u00E7'
# Ğ -> \u011E
$c = Rep $c 'Ğ' '\u011E'
# ğ -> \u011F
$c = Rep $c 'ğ' '\u011F'
# İ -> \u0130
$c = Rep $c 'İ' '\u0130'
# ı -> \u0131
$c = Rep $c 'ı' '\u0131'
# Ö -> \u00D6
$c = Rep $c 'Ö' '\u00D6'
# ö -> \u00F6
$c = Rep $c 'ö' '\u00F6'
# Ü -> \u00DC
$c = Rep $c 'Ü' '\u00DC'
# ü -> \u00FC
$c = Rep $c 'ü' '\u00FC'

# Handle Double Encoded Artifacts (if any left) to Unicode Escapes
$bad_S = [string][char]195 + [string][char]8230 + [string][char]194 + [string][char]158
$c = Rep $c $bad_S '\u015E'

$bad_u = [string][char]195 + [string][char]188
$c = Rep $c $bad_u '\u00FC'

$bad_i = [string][char]196 + [string][char]177
$c = Rep $c $bad_i '\u0131'

$bad_g = [string][char]196 + [string][char]376
$c = Rep $c $bad_g '\u011F'

$bad_o = [string][char]195 + [string][char]182
$c = Rep $c $bad_o '\u00F6'

[System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Host "App JS Unicode fixed."
