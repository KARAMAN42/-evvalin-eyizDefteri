$path = 'c:\Users\yusuf.karaman\2\app.js'
$content = [IO.File]::ReadAllText($path)

# Restore common variables from "{MISSING}"
$content = $content -replace '"\{MISSING\}"\s*kategorisini silmek', '${cat.name} kategorisini silmek'
$content = $content -replace '"\{MISSING\}"\s*kategorisi eklendi', '${catName} kategorisi eklendi'
$content = $content -replace 'mini\-"\{MISSING\}"', 'mini-${type}'
$content = $content -replace 'ld\-"\{MISSING\}"', 'ld-${type}'
$content = $content -replace '`%"{MISSING}"', '`%${pct}'
$content = $content -replace '`"{MISSING}"\s*%', '`${pct}%'
$content = $content -replace '`Durum: Bağlı \(Kod: "\{MISSING\}"\)', '`Durum: Bağlı (Kod: ${code})'
$content = $content -replace 'confirm\(`"\{MISSING\}"', 'confirm(`${item.name}'
$content = $content -replace 'showToast\(`"\{MISSING\}"', 'showToast(`${item.name}'

# Fix the broken budget notification innerHTML
$content = $content -replace '"\{MISSING\}"\)\.format\(settings\.monthlyBudget\)', 'currencyFormatter.format(settings.monthlyBudget)'

# Fallback for any remaining "{MISSING}" to empty string to avoid showing raw text
$content = $content -replace '"\{MISSING\}"', ''

[IO.File]::WriteAllText($path, $content)
