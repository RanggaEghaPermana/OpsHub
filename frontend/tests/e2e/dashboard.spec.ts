import { expect, test } from '@playwright/test'

test('admin can login and see dashboard analytics', async ({ page }) => {
  const consoleErrors: string[] = []

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible()

  await page.getByLabel('Email').fill('admin@umkm.test')
  await page.getByLabel('Kata sandi').fill('password')
  await page.getByRole('button', { name: 'Masuk' }).click()

  await expect(page.getByRole('heading', { name: 'Ringkasan 30 hari' })).toBeVisible()
  await expect(page.getByText('Stok menipis').first()).toBeVisible()

  await page.getByRole('button', { name: 'Admin sistem' }).click()
  await page.getByRole('button', { name: 'Pengaturan' }).click()
  await expect(page.getByRole('heading', { name: 'Pengaturan aplikasi' })).toBeVisible()
  await page.getByRole('button', { name: 'Gelap' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Inggris' }).click()
  await expect(page.getByRole('heading', { name: 'Application settings' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
  await expect(page.getByText('Pengaturan aplikasi')).toHaveCount(0)

  await page.getByRole('button', { name: 'Indonesian' }).click()
  await expect(page.getByRole('heading', { name: 'Pengaturan aplikasi' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Pengaturan' })).toBeVisible()
  await expect(page.getByText('Application settings')).toHaveCount(0)

  await page.getByRole('button', { name: 'Penjualan' }).click()
  await page.getByRole('button', { name: 'Pelanggan' }).click()
  await page.getByRole('button', { name: 'Pelanggan baru' }).click()
  await page.getByLabel('Nama').fill(`Pelanggan E2E ${Date.now()}`)
  await page.getByLabel('Email').fill(`pelanggan-${Date.now()}@example.test`)
  await page.getByLabel('Telepon').fill('081234567890')
  await page.getByLabel('Alamat').fill('Jakarta')
  await page.getByRole('button', { name: 'Simpan' }).click()
  await expect(page.getByText('Pelanggan berhasil dibuat.')).toBeVisible()

  await expect(consoleErrors).toEqual([])
})
