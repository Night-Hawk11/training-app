// Renders every exercise figure into a single HTML gallery so the SVGs can be
// reviewed visually (open dist-gallery/figures.html, or screenshot it headless).
// Dev-only tooling — not shipped.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  readFileSync(join(__dirname, '..', 'src', 'data', 'exercises.json'), 'utf8')
);
const outDir = join(__dirname, '..', 'dist-gallery');
mkdirSync(outDir, { recursive: true });

const cell = (ex) => `<figure>
      <div class="art">${ex.svg}</div>
      <figcaption><code>${ex.id}</code><br>${ex.name}</figcaption>
    </figure>`;

const page = (rows) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  body { margin:0; background:#0E1116; color:#F2F4F7;
         font-family:-apple-system,Segoe UI,Roboto,sans-serif; padding:16px; }
  .grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
  figure { margin:0; background:#1F242D; border-radius:12px; padding:10px; text-align:center; }
  .art { color:#5B9DF9; height:200px; }
  .art svg { height:100%; width:100%; }
  figcaption { font-size:14px; color:#9AA4B2; margin-top:6px; line-height:1.3; }
  code { color:#6B7480; font-size:12px; }
</style></head><body>
  <div class="grid">${rows.map(cell).join('\n')}</div>
</body></html>`;

const mid = Math.ceil(data.length / 2);
for (const [name, rows] of [
  ['figures-1.html', data.slice(0, mid)],
  ['figures-2.html', data.slice(mid)],
]) {
  writeFileSync(join(outDir, name), page(rows), 'utf8');
  console.log('wrote', name);
}
// Full single page too (5 cols, compact) for an overview.
writeFileSync(join(outDir, 'figures.html'), page(data).replace('repeat(4', 'repeat(5'), 'utf8');
