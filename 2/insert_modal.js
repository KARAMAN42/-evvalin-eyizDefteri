const fs = require('fs');

// Read files
const html = fs.readFileSync('index.html', 'utf8');
const modal = fs.readFileSync('modal_stats_snippet.html', 'utf8');

// Insert before "<!-- Add Note Modal"
const marker = '    <!-- Add Note Modal (Redesigned) -->';
const insertion = '\n\n    ' + modal.trim() + '\n\n' + marker;
const newHtml = html.replace(marker, insertion);

// Write back
fs.writeFileSync('index.html', newHtml, 'utf8');

console.log('✅ Modal HTML successfully inserted!');
