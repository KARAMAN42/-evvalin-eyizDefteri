$content = Get-Content -Path "style.css" -Raw
$target = '#home-section {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 60px - 70px);
    overflow: hidden;
    justify-content: space-between;
}'

$replacement = '#home-section {
    padding: 1.25rem 1rem;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 70px - env(safe-area-inset-bottom, 0px));
    max-height: calc(100vh - 70px);
    overflow: hidden;
    justify-content: space-between;
    box-sizing: border-box;
    gap: 0.5rem;
}

.home-greeting h1 {
    font-family: ''Outfit'', sans-serif;
    color: var(--text-color);
}

.home-quick-stats .stat-card {
    background: var(--cal-bg);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid var(--cal-border);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
    border-radius: 24px;
}'

# Use regex to replace, handle potential line ending differences
$content = $content -replace [regex]::Escape($target), $replacement
$content | Set-Content -Path "style.css"
