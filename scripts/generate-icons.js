// Generates icon-192.png and icon-512.png in /public using only Node built-ins
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function uint32BE(n) {
  const b = Buffer.allocUnsafe(4);
  b.writeUInt32BE(n >>> 0);
  return b;
}

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const crc = uint32BE(crc32(Buffer.concat([t, d])));
  return Buffer.concat([uint32BE(d.length), t, d, crc]);
}

// Simple 5x7 pixel font for letters D and P
const GLYPHS = {
  D: [
    [1,1,1,0,0],
    [1,0,0,1,0],
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,0,0,1,0],
    [1,1,1,0,0],
    [0,0,0,0,0],
  ],
  P: [
    [1,1,1,0,0],
    [1,0,0,1,0],
    [1,1,1,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [1,0,0,0,0],
    [0,0,0,0,0],
  ],
};

function solidPNG(size) {
  const PRIMARY = [10, 102, 224];   // #0A66E0
  const WHITE   = [255, 255, 255];

  // Scale factor for glyph rendering
  const scale = Math.max(1, Math.floor(size / 32));
  const gW = 5 * scale;
  const gH = 7 * scale;
  const gap = Math.max(1, Math.floor(scale * 1.5));
  const totalW = gW * 2 + gap;
  const totalH = gH;
  const startX = Math.floor((size - totalW) / 2);
  const startY = Math.floor((size - totalH) / 2);

  function getPixelColor(px, py) {
    // Rounded rect background (full square = primary)
    const rx = Math.floor(size * 0.15);
    const margin = rx;
    if (px < margin || px >= size - margin || py < margin || py >= size - margin) {
      return null; // transparent
    }

    // Check if inside D glyph
    const relX = px - startX;
    const relY = py - startY;
    if (relX >= 0 && relX < gW && relY >= 0 && relY < gH) {
      const gx = Math.floor(relX / scale);
      const gy = Math.floor(relY / scale);
      if (GLYPHS.D[gy]?.[gx]) return WHITE;
    }
    // Check if inside P glyph
    const relX2 = px - (startX + gW + gap);
    if (relX2 >= 0 && relX2 < gW && relY >= 0 && relY < gH) {
      const gx = Math.floor(relX2 / scale);
      const gy = Math.floor(relY / scale);
      if (GLYPHS.P[gy]?.[gx]) return WHITE;
    }
    return PRIMARY;
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const rowSize = 1 + size * 4;
  const raw = Buffer.allocUnsafe(size * rowSize);

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0;
    for (let x = 0; x < size; x++) {
      const color = getPixelColor(x, y);
      const off = y * rowSize + 1 + x * 4;
      if (color === null) {
        raw[off] = 0; raw[off+1] = 0; raw[off+2] = 0; raw[off+3] = 0;
      } else {
        raw[off] = color[0]; raw[off+1] = color[1]; raw[off+2] = color[2]; raw[off+3] = 255;
      }
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'icon-192.png'), solidPNG(192));
fs.writeFileSync(path.join(publicDir, 'icon-512.png'), solidPNG(512));
console.log('✓ icon-192.png and icon-512.png generated in /public');
