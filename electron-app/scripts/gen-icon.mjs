/**
 * One-shot icon generator — writes resources/icon.png (256x256 RGB+alpha)
 * using only Node's built-in zlib (no native deps needed).
 *
 * Draws an amber lightning bolt on a transparent background.
 * Run: node scripts/gen-icon.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SIZE = 256

// RGBA framebuffer
const buf = Buffer.alloc(SIZE * SIZE * 4)

// Bolt polygon (in 256px space) — a classic Z-shape lightning.
const bolt = [
  [150, 24],
  [96, 136],
  [132, 136],
  [108, 232],
  [176, 116],
  [138, 116],
  [170, 64]
]

function pointInPoly(x, y, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0]
    const yi = poly[i][1]
    const xj = poly[j][0]
    const yj = poly[j][1]
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

const AMBER = [245, 158, 11, 255] // #f59e0b
const AMBER_EDGE = [251, 191, 36, 255] // softer highlight

for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const idx = (y * SIZE + x) * 4
    if (pointInPoly(x, y, bolt)) {
      // Simple vertical gradient: brighter near top.
      const t = y / SIZE
      const r = Math.round(AMBER_EDGE[0] * (1 - t) + AMBER[0] * t)
      const g = Math.round(AMBER_EDGE[1] * (1 - t) + AMBER[1] * t)
      const b = Math.round(AMBER_EDGE[2] * (1 - t) + AMBER[2] * t)
      buf[idx] = r
      buf[idx + 1] = g
      buf[idx + 2] = b
      buf[idx + 3] = 255
    } else {
      // transparent
      buf[idx + 3] = 0
    }
  }
}

// ---- Encode PNG (manual) ----
function crc32(data) {
  let c = ~0
  for (let i = 0; i < data.length; i++) {
    c ^= data[i]
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
    }
  }
  return ~c >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const typeBuf = Buffer.from(type, 'ascii')
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([len, typeBuf, data, crc])
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0) // width
ihdr.writeUInt32BE(SIZE, 4) // height
ihdr[8] = 8 // bit depth
ihdr[9] = 6 // color type RGBA
ihdr[10] = 0 // compression
ihdr[11] = 0 // filter
ihdr[12] = 0 // interlace

// Add filter byte (0) at the start of each row.
const rowLen = SIZE * 4
const raw = Buffer.alloc((rowLen + 1) * SIZE)
for (let y = 0; y < SIZE; y++) {
  raw[y * (rowLen + 1)] = 0 // filter type none
  buf.copy(raw, y * (rowLen + 1) + 1, y * rowLen, y * rowLen + rowLen)
}
const idat = deflateSync(raw, { level: 9 })

const png = Buffer.concat([
  sig,
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0))
])

const outDir = join(__dirname, '..', 'resources')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'icon.png')
writeFileSync(outPath, png)
console.log('wrote', outPath, png.length, 'bytes')
