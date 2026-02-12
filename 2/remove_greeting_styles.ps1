$content = Get-Content -Path "style.css" -Raw
$target = ".home-greeting h1 {
    font-family: 'Outfit', sans-serif;
    color: var(--text-color);
}
"

# Use regex to replace
$content = $content -replace [regex]::Escape($target), ""
$content | Set-Content -Path "style.css" -Encoding Ascii
