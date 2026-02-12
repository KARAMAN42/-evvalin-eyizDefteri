import re

# Read the HTML file
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Read the modal snippet
with open('modal_stats_snippet.html', 'r', encoding='utf-8') as f:
    modal_html = f.read()

# Insert the modal before "<!-- Add Note Modal"
pattern = r'(\s+<!-- Add Note Modal)'
replacement = f'\n\n    {modal_html}\n$1'

new_content = re.sub(pattern, replacement.replace('$1', r'\1'), content, count=1)

# Write back
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Modal HTML successfully inserted!")
