const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const pages = [
  'index.html', 'resident-login.html', 'resident-dashboard.html',
  'secretary-login.html', 'secretary.html', 'admin-login.html', 'admin.html',
];

// Rebuild only the dedicated output directory, never upload the repository root.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of pages) fs.copyFileSync(path.join(root, file), path.join(output, file));
for (const directory of ['css', 'js', 'assets']) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}
fs.copyFileSync(path.join(root, 'cloudflare', '_headers'), path.join(output, '_headers'));
fs.writeFileSync(path.join(output, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found</title><h1>Page not found</h1><p><a href="/">Return to Barangay Wawa</a></p></html>');
console.log('Cloudflare assets prepared in dist/.');
console.log('Current app uses browser storage. Supabase Auth/database integration is still pending.');
