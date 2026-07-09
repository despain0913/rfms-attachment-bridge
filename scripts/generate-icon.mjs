// Rasterizes build/icon.svg into a multi-resolution build/icon.ico (used by the
// app window and the NSIS installer) plus a 512px build/icon.png.
import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(root, 'build', 'icon.svg'))

const sizes = [16, 24, 32, 48, 64, 128, 256]

const pngs = await Promise.all(
  sizes.map((s) => sharp(svg, { density: 384 }).resize(s, s).png().toBuffer())
)

const ico = await pngToIco(pngs)
writeFileSync(join(root, 'build', 'icon.ico'), ico)

writeFileSync(
  join(root, 'build', 'icon.png'),
  await sharp(svg, { density: 384 }).resize(512, 512).png().toBuffer()
)

console.log('Generated build/icon.ico and build/icon.png')
