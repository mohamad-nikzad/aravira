import sharp from 'sharp'
import pngToIco from 'png-to-ico'
import { writeFile, mkdir } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const PUBLIC_DIR = join(SCRIPT_DIR, '..', 'public')
const ICON_BASE = join(PUBLIC_DIR, 'icon-base.png')

const BG_COLOR = '#9B3636'
const BG_LIGHT = '#f8f5f2'

async function resizeIcon(size: number, outputPath: string) {
  await sharp(ICON_BASE)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(outputPath)
  console.log(`  ✓ ${outputPath.replace(PUBLIC_DIR, 'public')}`)
}

async function createMaskableIcon(size: number, outputPath: string) {
  const padding = Math.round(size * 0.1)
  const innerSize = size - padding * 2

  const resizedIcon = await sharp(ICON_BASE)
    .resize(innerSize, innerSize, { fit: 'contain', background: BG_COLOR })
    .png()
    .toBuffer()

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG_COLOR,
    },
  })
    .composite([{ input: resizedIcon, left: padding, top: padding }])
    .png()
    .toFile(outputPath)

  console.log(`  ✓ ${outputPath.replace(PUBLIC_DIR, 'public')}`)
}

async function createSplashScreen(
  width: number,
  height: number,
  outputPath: string
) {
  const iconSize = Math.round(Math.min(width, height) * 0.25)

  const resizedIcon = await sharp(ICON_BASE)
    .resize(iconSize, iconSize, { fit: 'contain' })
    .png()
    .toBuffer()

  const iconLeft = Math.round((width - iconSize) / 2)
  const iconTop = Math.round((height - iconSize) / 2 - height * 0.05)

  await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: BG_LIGHT,
    },
  })
    .composite([{ input: resizedIcon, left: iconLeft, top: iconTop }])
    .png()
    .toFile(outputPath)

  console.log(`  ✓ ${outputPath.replace(PUBLIC_DIR, 'public')}`)
}

async function main() {
  console.log('Generating PWA icons from icon-base.png...\n')

  await mkdir(join(PUBLIC_DIR, 'icons'), { recursive: true })

  const pwaIconSizes = [72, 96, 128, 144, 152, 192, 384, 512]
  for (const size of pwaIconSizes) {
    await resizeIcon(size, join(PUBLIC_DIR, 'icons', `icon-${size}x${size}.png`))
  }

  for (const size of [192, 512]) {
    await createMaskableIcon(
      size,
      join(PUBLIC_DIR, 'icons', `icon-maskable-${size}x${size}.png`)
    )
  }

  // Apple touch icon
  await resizeIcon(180, join(PUBLIC_DIR, 'apple-touch-icon.png'))

  // Favicons
  await resizeIcon(32, join(PUBLIC_DIR, 'favicon-32x32.png'))
  await resizeIcon(16, join(PUBLIC_DIR, 'favicon-16x16.png'))

  // Light/dark 32x32 variants (same icon, different background tints)
  await resizeIcon(32, join(PUBLIC_DIR, 'icon-light-32x32.png'))
  await resizeIcon(32, join(PUBLIC_DIR, 'icon-dark-32x32.png'))

  // Generate favicon.ico
  const favicon32Buffer = await sharp(ICON_BASE).resize(32, 32).png().toBuffer()
  const favicon16Buffer = await sharp(ICON_BASE).resize(16, 16).png().toBuffer()
  const icoBuffer = await pngToIco([favicon32Buffer, favicon16Buffer])
  await writeFile(join(PUBLIC_DIR, 'favicon.ico'), icoBuffer)
  console.log('  ✓ public/favicon.ico')

  // iOS Splash screens
  console.log('\nGenerating splash screens...\n')
  const splashSizes: [number, number, string][] = [
    [640, 1136, 'iphone5'],
    [750, 1334, 'iphone6'],
    [1242, 2208, 'iphone6plus'],
    [1125, 2436, 'iphonex'],
    [828, 1792, 'iphonexr'],
    [1242, 2688, 'iphonexsmax'],
    [1170, 2532, 'iphone12'],
    [1284, 2778, 'iphone12max'],
    [1179, 2556, 'iphone14pro'],
    [1290, 2796, 'iphone14promax'],
    [1536, 2048, 'ipad'],
    [1668, 2388, 'ipadpro11'],
    [2048, 2732, 'ipadpro129'],
  ]

  for (const [w, h, name] of splashSizes) {
    await createSplashScreen(w, h, join(PUBLIC_DIR, 'icons', `splash-${name}.png`))
  }

  console.log('\n✅ All icons generated successfully!')
}

main().catch(console.error)
