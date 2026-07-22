// Post-processes the Expo web export (dist/) for GitHub Pages + PWA install.
// Run automatically by `npm run build:web`.
import fs from 'node:fs';
import path from 'node:path';

const BASE = '/manasana';
const dist = path.resolve('dist');
const assets = path.resolve('assets');

if (!fs.existsSync(dist)) {
  console.error('dist/ not found — run `expo export --platform web` first.');
  process.exit(1);
}

// 1. .nojekyll — so GitHub Pages serves the underscore-prefixed _expo/ folder.
fs.writeFileSync(path.join(dist, '.nojekyll'), '');

// 2. App icon for install (Apple + manifest).
fs.copyFileSync(path.join(assets, 'icon.png'), path.join(dist, 'icon.png'));

// 3. Web app manifest.
const manifest = {
  name: 'Manasana',
  short_name: 'Manasana',
  description: 'Emotion-driven yoga: pick how you feel, get poses, instructions, and a timer.',
  start_url: `${BASE}/`,
  scope: `${BASE}/`,
  display: 'standalone',
  background_color: '#eef4f0',
  theme_color: '#4c8a72',
  icons: [
    { src: `${BASE}/icon.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: `${BASE}/icon.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};
fs.writeFileSync(path.join(dist, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));

// 4. Inject manifest link + Apple home-screen meta into index.html.
const indexPath = path.join(dist, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const inject = `
  <link rel="manifest" href="${BASE}/manifest.webmanifest" />
  <link rel="apple-touch-icon" href="${BASE}/icon.png" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Manasana" />
  <meta name="mobile-web-app-capable" content="yes" />
`;
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${inject}</head>`);
  fs.writeFileSync(indexPath, html);
}

// 5. SPA fallback so deep links / refreshes resolve to the app.
fs.copyFileSync(indexPath, path.join(dist, '404.html'));

console.log('postexport: .nojekyll, manifest, icons, meta, 404.html written to dist/');
