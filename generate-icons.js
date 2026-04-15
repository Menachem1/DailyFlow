import sharp from 'sharp'

// Regular icon — rounded corners, full bleed
const svgRegular = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#4338ca"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#g)"/>
  <text
    x="256" y="320"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="220"
    fill="white"
    text-anchor="middle"
  >DF</text>
  <circle cx="400" cy="140" r="24" fill="white" opacity="0.3"/>
  <circle cx="112" cy="372" r="16" fill="white" opacity="0.2"/>
</svg>
`

// Maskable icon — full bleed square background, content within center 80% safe zone
// Safe zone = 40% of each side inset → content lives in 20%–80% of width/height
const svgMaskable = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#818cf8"/>
      <stop offset="100%" stop-color="#4338ca"/>
    </linearGradient>
  </defs>
  <!-- Full bleed — no rounded corners for maskable -->
  <rect width="512" height="512" fill="url(#g)"/>
  <!-- DF text scaled down to fit safe zone -->
  <text
    x="256" y="300"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="160"
    fill="white"
    text-anchor="middle"
  >DF</text>
</svg>
`

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]

for (const size of sizes) {
  await sharp(Buffer.from(svgRegular))
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}x${size}.png`)
  console.log(`✓ icon-${size}x${size}.png`)
}

// Maskable 512x512
await sharp(Buffer.from(svgMaskable))
  .resize(512, 512)
  .png()
  .toFile('public/icon-512x512-maskable.png')
console.log('✓ icon-512x512-maskable.png')

// Apple touch icon 180x180
await sharp(Buffer.from(svgRegular))
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png')
console.log('✓ apple-touch-icon.png')

console.log('\nAll icons generated!')
