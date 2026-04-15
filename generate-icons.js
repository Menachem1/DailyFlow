import sharp from 'sharp'

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="${size * 0.22}" fill="#6366f1"/>
  <!-- Subtle gradient overlay -->
  <rect width="512" height="512" rx="${size * 0.22}" fill="url(#g)"/>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#4338ca" stop-opacity="0.5"/>
    </linearGradient>
  </defs>
  <!-- DF letters -->
  <text
    x="256" y="310"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="240"
    fill="white"
    text-anchor="middle"
    opacity="1"
  >DF</text>
  <!-- Small dot accent -->
  <circle cx="390" cy="160" r="28" fill="white" opacity="0.35"/>
</svg>
`

for (const size of sizes) {
  await sharp(Buffer.from(svg(size)))
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}x${size}.png`)
  console.log(`✓ icon-${size}x${size}.png`)
}

// Apple touch icon (180x180)
await sharp(Buffer.from(svg(180)))
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png')
console.log('✓ apple-touch-icon.png')

console.log('\nAll icons generated!')
