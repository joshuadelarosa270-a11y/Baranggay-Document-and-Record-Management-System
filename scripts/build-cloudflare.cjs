const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const pages = [
  'index.html', 'resident-login.html', 'resident-dashboard.html',
  'secretary-login.html', 'secretary.html', 'admin-login.html', 'admin.html', 'staff-login.html',
];

// Rebuild only the dedicated output directory, never upload the repository root.
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const file of pages) fs.copyFileSync(path.join(root, file), path.join(output, file));
for (const directory of ['css', 'assets']) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}
fs.mkdirSync(path.join(output, 'js'), { recursive: true });
for (const file of ['store.js','supabase-config.js','cloud.js','auth.js','ui.js','admin.js','secretary.js']) {
  fs.copyFileSync(path.join(root, 'js', file), path.join(output, 'js', file));
}
fs.copyFileSync(path.join(root, 'cloudflare', '_headers'), path.join(output, '_headers'));
fs.writeFileSync(path.join(output, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found</title><h1>Page not found</h1><p><a href="/">Return to Barangay Wawa</a></p></html>');
console.log('Cloudflare assets prepared in dist/.');
console.log('Cloud-only build: install supabase/setup.sql and provision authorized staff before using login.');
