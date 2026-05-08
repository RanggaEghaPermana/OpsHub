import { chromium } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const rootDir = path.resolve(process.cwd(), '..')
const outputDir = path.join(rootDir, 'docs')
const outputPath = path.join(outputDir, 'social-preview.png')
const logoPath = path.join(rootDir, 'frontend', 'public', 'logowhite.png')
const dashboardPath = path.join(rootDir, 'docs', 'screenshots', '02-dashboard.png')

async function imageDataUri(filePath) {
  const buffer = await readFile(filePath)
  return `data:image/png;base64,${buffer.toString('base64')}`
}

async function main() {
  await mkdir(outputDir, { recursive: true })
  const logoSrc = await imageDataUri(logoPath)
  const dashboardSrc = await imageDataUri(dashboardPath)

  const browser = await chromium.launch()
  const page = await browser.newPage({ deviceScaleFactor: 1, viewport: { height: 640, width: 1280 } })

  await page.setContent(`
    <!doctype html>
    <html>
      <head>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            width: 1280px;
            height: 640px;
            overflow: hidden;
            background:
              radial-gradient(circle at 18% 18%, rgba(43, 137, 255, 0.22), transparent 34%),
              radial-gradient(circle at 92% 12%, rgba(16, 185, 129, 0.16), transparent 30%),
              linear-gradient(135deg, #f7fbff 0%, #dcedff 52%, #ffffff 100%);
            color: #10213d;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          }

          .wrap {
            position: relative;
            width: 100%;
            height: 100%;
            padding: 60px 72px;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 18px;
          }

          .brand img {
            width: 184px;
            height: auto;
          }

          .content {
            position: relative;
            z-index: 2;
            width: 560px;
            padding-top: 54px;
          }

          .eyebrow {
            margin: 0 0 18px;
            color: #0b66d8;
            font-size: 22px;
            font-weight: 800;
            letter-spacing: 0.16em;
            text-transform: uppercase;
          }

          h1 {
            margin: 0;
            font-size: 72px;
            line-height: 0.96;
            letter-spacing: 0;
          }

          p {
            margin: 26px 0 0;
            max-width: 520px;
            color: #496487;
            font-size: 25px;
            line-height: 1.35;
            font-weight: 650;
          }

          .preview {
            position: absolute;
            right: -44px;
            bottom: 46px;
            width: 760px;
            border: 1px solid rgba(88, 150, 220, 0.26);
            border-radius: 36px;
            box-shadow: 0 34px 90px rgba(13, 79, 158, 0.22);
            transform: rotate(-2deg);
          }

          .chips {
            display: flex;
            gap: 14px;
            margin-top: 32px;
          }

          .chip {
            border: 1px solid rgba(23, 116, 230, 0.2);
            border-radius: 999px;
            padding: 12px 18px;
            background: rgba(255, 255, 255, 0.78);
            color: #164c8f;
            font-size: 18px;
            font-weight: 800;
          }
        </style>
      </head>
      <body>
        <main class="wrap">
          <div class="brand">
            <img src="${logoSrc}" alt="OpsHub">
          </div>
          <section class="content">
            <p class="eyebrow">Manage Track Grow</p>
            <h1>UMKM operations dashboard</h1>
            <p>Inventory, sales, invoices, reports, and audit logs in one modern workflow.</p>
            <div class="chips">
              <span class="chip">Laravel API</span>
              <span class="chip">React TypeScript</span>
              <span class="chip">MySQL</span>
            </div>
          </section>
          <img class="preview" src="${dashboardSrc}" alt="OpsHub dashboard preview">
        </main>
      </body>
    </html>
  `, { waitUntil: 'networkidle' })

  await page.screenshot({ animations: 'disabled', path: outputPath })
  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
