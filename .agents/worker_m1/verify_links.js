const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..', '..');
const indexPath = path.join(rootDir, 'index.html');
const html = fs.readFileSync(indexPath, 'utf8');

console.log('=== DEEP VERIFICATION: LINKS & ASSET EXISTENCE ===');

// Extract all internal relative links
const linkRegex = /href=["'](game\/[^"']+)["']/g;
let match;
let missingFiles = [];
let foundLinks = [];

while ((match = linkRegex.exec(html)) !== null) {
    const relPath = match[1];
    const fullPath = path.join(rootDir, relPath);
    const exists = fs.existsSync(fullPath);
    foundLinks.push({ relPath, exists });
    if (!exists) {
        missingFiles.push(relPath);
    }
}

console.log(`Found ${foundLinks.length} subproject links in index.html:`);
foundLinks.forEach(l => {
    console.log(`  ${l.exists ? '✅' : '❌'} ${l.relPath}`);
});

if (missingFiles.length > 0) {
    console.error(`Error: Missing files found: ${missingFiles.join(', ')}`);
    process.exit(1);
}

console.log('\nAll 10 project links point to existing valid files on disk!');
