// Añade al index.html de la web lo necesario para instalarla en la pantalla de inicio del móvil:
// icono, manifiesto, color y modo pantalla completa. Se ejecuta después de `expo export -p web`.
const fs = require('fs');
const path = require('path');

const base = require('../app.json').expo.experiments?.baseUrl ?? '';
const file = path.join(__dirname, '..', 'dist', 'index.html');

const tags = [
  '<meta name="description" content="Tu plan diario de estudio para la oposición." />',
  '<meta name="theme-color" content="#F2672A" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-title" content="Opositor" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png" />`,
  `<link rel="manifest" href="${base}/manifest.json" />`,
].join('\n    ');

let html = fs.readFileSync(file, 'utf8');
html = html
  .replace('<html lang="en">', '<html lang="es">')
  .replace(/content="width=device-width[^"]*"/, 'content="width=device-width, initial-scale=1, viewport-fit=cover"')
  .replace('</head>', `    ${tags}\n  </head>`);
fs.writeFileSync(file, html);
console.log('index.html preparado para la pantalla de inicio');
