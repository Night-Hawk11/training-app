// Generates placeholder PWA icons (solid accent squares) as valid PNGs using
// only Node built-ins. Replaced with real artwork during Step 10 polish.
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

// Accent color (#5B9DF9) on dark ink (#0E1116) background.
const BG = [0x0e, 0x11, 0x16];
const FG = [0x5b, 0x9d, 0xf9];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePng(size) {
  // Draw a centered rounded-ish square mark over the background.
  const inset = Math.round(size * 0.22);
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let pos = 0;
  for (let y = 0; y < size; y++) {
    raw[pos++] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const inMark = x >= inset && x < size - inset && y >= inset && y < size - inset;
      const [r, g, b] = inMark ? FG : BG;
      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
    }
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const file = join(outDir, `icon-${size}.png`);
  writeFileSync(file, makePng(size));
  console.log('wrote', file);
}
