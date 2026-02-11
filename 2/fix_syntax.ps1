$path = 'c:\Users\yusuf.karaman\2\app.js'
$content = [IO.File]::ReadAllText($path)

# 1. Fix the specific simple ones I identified
$content = $content -replace 'document\.getElementById\(`ld-\$\{\}\-total`\)', 'document.getElementById(`ld-${type}-total`)'
$content = $content -replace 'document\.getElementById\(`ld-\$\{\}\-bought`\)', 'document.getElementById(`ld-${type}-bought`)'
$content = $content -replace 'document\.getElementById\(`ld-\$\{\}\-remain`\)', 'document.getElementById(`ld-${type}-remain`)'
$content = $content -replace 'document\.getElementById\(`ld-\$\{\}\-cost`\)', 'document.getElementById(`ld-${type}-cost`)'

# 2. Fix currentMonth in checkMonthlyBudgetReset
$content = $content -replace 'const currentMonth=`\$\{\}\s*\-\$\{\}\s*`', 'const currentMonth=`${now.getFullYear()}-${now.getMonth() + 1}`'

# 3. Fix general placeholders for any remaining empty ones
# Using [regex]::Replace to handle them more robustly
$content = [regex]::Replace($content, '\$\{\s*\}', '"{MISSING}"')

[IO.File]::WriteAllText($path, $content)
