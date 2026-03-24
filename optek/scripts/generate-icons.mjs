/**
 * scripts/generate-icons.mjs
 * Generates PNG icons and favicon.ico from the SVG source.
 * Run: node scripts/generate-icons.mjs
 */
import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const svgPath = join(root, 'public', 'icons', 'icon.svg')
const svgBuffer = readFileSync(svgPath)

async function generateIcons() {
  // 192x192 PNG
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(root, 'public', 'icons', 'icon-192.png'))
  console.log('✓ icon-192.png')

  // 512x512 PNG
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(root, 'public', 'icons', 'icon-512.png'))
  console.log('✓ icon-512.png')

  // 32x32 for favicon.ico (PNG format, browsers accept PNG as .ico)
  const favicon32 = await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toBuffer()

  // Write as .ico (modern browsers accept PNG-in-ICO)
  // ICO header: 6 bytes header + 16 bytes per image entry + PNG data
  const icoHeader = Buffer.alloc(6)
  icoHeader.writeUInt16LE(0, 0)   // Reserved
  icoHeader.writeUInt16LE(1, 2)   // Type: 1 = ICO
  icoHeader.writeUInt16LE(1, 4)   // Count: 1 image

  const icoEntry = Buffer.alloc(16)
  icoEntry.writeUInt8(32, 0)      // Width
  icoEntry.writeUInt8(32, 1)      // Height
  icoEntry.writeUInt8(0, 2)       // Color palette
  icoEntry.writeUInt8(0, 3)       // Reserved
  icoEntry.writeUInt16LE(1, 4)    // Color planes
  icoEntry.writeUInt16LE(32, 6)   // Bits per pixel
  icoEntry.writeUInt32LE(favicon32.length, 8)  // Size of PNG data
  icoEntry.writeUInt32LE(22, 12)  // Offset (6 header + 16 entry = 22)

  const ico = Buffer.concat([icoHeader, icoEntry, favicon32])
  writeFileSync(join(root, 'public', 'favicon.ico'), ico)
  console.log('✓ favicon.ico (32x32)')

  // Also update app/icon.png to 192x192 (currently 48x48, too small)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(join(root, 'app', 'icon.png'))
  console.log('✓ app/icon.png updated to 192x192')
}

generateIcons().catch(err => {
  console.error('Error generating icons:', err)
  process.exit(1)
})
