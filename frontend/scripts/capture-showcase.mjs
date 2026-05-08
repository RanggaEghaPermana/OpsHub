import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.SHOWCASE_URL ?? 'http://127.0.0.1:5173'
const outputDir = path.resolve(process.cwd(), '..', 'docs', 'screenshots')

const views = [
  {
    file: '02-dashboard.png',
    item: 'Dasbor',
    waitFor: 'Ringkasan 30 hari',
  },
  {
    file: '03-produk.png',
    group: 'Inventori',
    item: 'Produk',
    waitFor: 'Manajemen produk',
  },
  {
    file: '04-kategori.png',
    group: 'Inventori',
    item: 'Kategori',
    waitFor: 'Manajemen kategori',
  },
  {
    file: '05-stok.png',
    group: 'Inventori',
    item: 'Stok',
    waitFor: 'Stok masuk/keluar',
  },
  {
    file: '06-alert-stok.png',
    group: 'Inventori',
    item: 'Alert stok',
    waitFor: 'Perlu restock',
  },
  {
    file: '07-transaksi.png',
    group: 'Penjualan',
    item: 'Transaksi',
    waitFor: 'Riwayat transaksi',
  },
  {
    file: '08-faktur.png',
    group: 'Penjualan',
    item: 'Faktur',
    waitFor: 'Faktur penjualan',
  },
  {
    file: '09-pelanggan.png',
    group: 'Penjualan',
    item: 'Pelanggan',
    waitFor: 'Manajemen pelanggan',
  },
  {
    file: '10-pembelian.png',
    group: 'Pembelian & biaya',
    item: 'Pembelian',
    waitFor: 'Manajemen pembelian',
  },
  {
    file: '11-supplier.png',
    group: 'Pembelian & biaya',
    item: 'Supplier',
    waitFor: 'Manajemen supplier',
  },
  {
    file: '12-pengeluaran.png',
    group: 'Pembelian & biaya',
    item: 'Pengeluaran',
    waitFor: 'Manajemen pengeluaran',
  },
  {
    file: '13-laporan.png',
    group: 'Analitik',
    item: 'Laporan',
    waitFor: 'Laporan penjualan',
  },
  {
    file: '14-laba-rugi.png',
    group: 'Analitik',
    item: 'Laporan laba rugi',
    waitFor: 'Pengeluaran operasional',
  },
  {
    file: '15-lokasi.png',
    group: 'Admin sistem',
    item: 'Lokasi',
    waitFor: 'Cabang dan gudang',
  },
  {
    file: '16-riwayat.png',
    group: 'Admin sistem',
    item: 'Riwayat',
    waitFor: 'Riwayat perubahan',
  },
  {
    file: '17-pengguna.png',
    group: 'Admin sistem',
    item: 'Pengguna',
    waitFor: 'Manajemen pengguna',
  },
  {
    file: '18-pengaturan.png',
    group: 'Admin sistem',
    item: 'Pengaturan',
    waitFor: 'Pengaturan aplikasi',
  },
]

async function clickSidebarButton(page, name) {
  const button = page.locator('aside.app-sidebar').getByRole('button', { name, exact: true })
  await button.scrollIntoViewIfNeeded()
  await button.click()
}

async function openView(page, view) {
  if (view.group) {
    const groupButton = page.locator('aside.app-sidebar').getByRole('button', { name: view.group, exact: true })
    await groupButton.scrollIntoViewIfNeeded()
    if ((await groupButton.getAttribute('aria-expanded')) !== 'true') {
      await groupButton.click()
    }
  }

  await clickSidebarButton(page, view.item)
  await page.getByText(view.waitFor, { exact: true }).first().waitFor({ state: 'visible', timeout: 20000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(600)
}

async function capture(page, file) {
  await page.screenshot({
    animations: 'disabled',
    fullPage: false,
    path: path.join(outputDir, file),
  })
}

async function main() {
  await mkdir(outputDir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    deviceScaleFactor: 1,
    locale: 'id-ID',
    viewport: { height: 1080, width: 1920 },
  })
  const page = await context.newPage()

  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await page.getByRole('heading', { name: 'Masuk', exact: true }).waitFor({ state: 'visible', timeout: 20000 })
  await capture(page, '01-login.png')

  await page.getByLabel('Email').fill('admin@umkm.test')
  await page.getByLabel('Kata sandi').fill('password')
  await page.getByRole('button', { name: 'Masuk', exact: true }).click()
  await page.getByText('Ringkasan 30 hari', { exact: true }).waitFor({ state: 'visible', timeout: 30000 })
  await page.waitForTimeout(1000)

  for (const view of views) {
    await openView(page, view)
    await capture(page, view.file)
  }

  await browser.close()
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
