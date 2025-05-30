#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read the main index.html
let html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

// Read all CSS
const css = fs.readFileSync(path.join(__dirname, '../css/styles.css'), 'utf8');

// Read all JS files in order
const jsFiles = [
    'storage.js',
    'api.js', 
    'ui.js',
    'health.js',
    'logs.js',
    'pwa.js',
    'events.js',
    'app.js'
];

let combinedJS = '';
for (const file of jsFiles) {
    const content = fs.readFileSync(path.join(__dirname, '../js/', file), 'utf8');
    combinedJS += `\n// === ${file} ===\n${content}\n`;
}

// Replace external CSS link with inline styles
html = html.replace(
    '<link rel="stylesheet" href="css/styles.css">',
    `<style>\n${css}\n</style>`
);

// Replace external script tags with inline scripts
const scriptTags = jsFiles.map(f => `    <script src="js/${f}"></script>`).join('\n');
html = html.replace(
    scriptTags,
    `<script>\n${combinedJS}\n</script>`
);

// Update the logo reference to use base64
html = html.replace(
    '<link rel="icon" href="logo.svg" type="image/svg+xml">',
    '<link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+CiAgPCEtLSBCYWNrZ3JvdW5kIENpcmNsZSAtLT4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjkwIiBmaWxsPSIjM2I4MmY2IiAvPgogIAogIDwhLS0gSGVhcnQgSWNvbiAtLT4KICA8cGF0aCBkPSJNMTAwIDE0MCBDNZUM MTEwLCA0MCAxMDAsIDQwIDc1IEM0MCA2MCwgNTAgNTAsIDY1IDUwIEM4MCA1MCwgOTAgNjAsIDEwMCA3MCBDMTEwIDYwLCAxMjAgNTAsIDEzNSA1MCBDMTUM IDUwLCAxNjAgNjAsIDE2MCA3NSBDMTY2IDEwMCwgMTI1IDExMCwgMTAwIDE0MFoiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuOSIvPgogIAogIDwhLS0gSVEgVGV4dCAtLT4KICA8dGV4dCB4PSIxMDAiIHk9IjE3MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjMyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SVE8L3RleHQ+CiAgCiAgPCEtLSBQbHVzIHN5bWJvbCBmb3IgaGVhbHRoIC0tPgogIDxyZWN0IHg9Ijk1IiB5PSI4NSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjM2I4MmY2Ii8+CiAgPHJlY3QgeD0iODUiIHk9Ijk1IiB3aWR0aD0iMzAiIGhlaWdodD0iMTAiIGZpbGw9IiMzYjgyZjYiLz4KPC9zdmc+">'
);

html = html.replace(
    '<link rel="apple-touch-icon" href="logo.svg">',
    '<link rel="apple-touch-icon" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+CiAgPCEtLSBCYWNrZ3JvdW5kIENpcmNsZSAtLT4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjkwIiBmaWxsPSIjM2I4MmY2IiAvPgogIAogIDwhLS0gSGVhcnQgSWNvbiAtLT4KICA8cGF0aCBkPSJNMTAwIDE0MCBDNZUM MTEwLCA0MCAxMDAsIDQwIDc1IEM0MCA2MCwgNTAgNTAsIDY1IDUwIEM4MCA1MCwgOTAgNjAsIDEwMCA3MCBDMTEwIDYwLCAxMjAgNTAsIDEzNSA1MCBDMTUM IDUwLCAxNjAgNjAsIDE2MCA3NSBDMTY2IDEwMCwgMTI1IDExMCwgMTAwIDE0MFoiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuOSIvPgogIAogIDwhLS0gSVEgVGV4dCAtLT4KICA8dGV4dCB4PSIxMDAiIHk9IjE3MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjMyIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SVE8L3RleHQ+CiAgCiAgPCEtLSBQbHVzIHN5bWJvbCBmb3IgaGVhbHRoIC0tPgogIDxyZWN0IHg9Ijk1IiB5PSI4NSIgd2lkdGg9IjEwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjM2I4MmY2Ii8+CiAgPHJlY3QgeD0iODUiIHk9Ijk1IiB3aWR0aD0iMzAiIGhlaWdodD0iMTAiIGZpbGw9IiMzYjgyZjYiLz4KPC9zdmc+">'
);

// Add a comment at the top
const header = `<!-- 
    HealthIQ Gist Version
    Auto-generated from modular source - DO NOT EDIT DIRECTLY
    Generated: ${new Date().toISOString()}
    
    This is a standalone version for GitHub Gist deployment.
    For development, use the modular files in the main repository.
-->
`;

// Write the combined file
fs.writeFileSync(
    path.join(__dirname, '../healthiq-gist.html'),
    header + html
);

console.log('✅ Successfully built healthiq-gist.html');
</script>