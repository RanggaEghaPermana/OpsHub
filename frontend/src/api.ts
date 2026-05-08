import axios from 'axios'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    localStorage.setItem('umkm_opshub_token', token)
    return
  }

  delete api.defaults.headers.common.Authorization
  localStorage.removeItem('umkm_opshub_token')
}

export function getStoredToken() {
  return localStorage.getItem('umkm_opshub_token')
}

export function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined

    const firstError = data?.errors ? Object.values(data.errors)[0]?.[0] : null

    const message = firstError ?? data?.message ?? error.message
    const language = document.documentElement.lang === 'en' ? 'en' : 'id'

    if (!error.response && message === 'Network Error') {
      return language === 'en'
        ? 'Could not connect to the server. Check your connection and try again.'
        : 'Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.'
    }

    if (message.includes('No query results for model')) {
      return language === 'en'
        ? 'Data not found or already deleted.'
        : 'Data tidak ditemukan atau sudah dihapus.'
    }

    if (message.includes('FOREIGN KEY constraint failed') || message.includes('Integrity constraint violation')) {
      return language === 'en'
        ? 'This data cannot be deleted because it is still used by other data.'
        : 'Data tidak bisa dihapus karena masih dipakai data lain.'
    }

    return localizeApiMessage(message, language)
  }

  return document.documentElement.lang === 'en'
    ? 'An unexpected error occurred.'
    : 'Terjadi kesalahan tak terduga.'
}

function localizeApiMessage(message: string, language: 'id' | 'en') {
  const normalized = message.trim()

  if (language === 'id') {
    return englishApiMessageToIndonesian(normalized) ?? englishValidationToIndonesian(normalized) ?? normalized
  }

  const translations: Record<string, string> = {
    'Anda tidak memiliki akses untuk aksi ini.': 'You do not have access to this action.',
    'Data tidak ditemukan atau sudah dihapus.': 'Data not found or already deleted.',
    'Email atau password tidak valid.': 'Invalid email or password.',
    'Endpoint tidak ditemukan.': 'Endpoint not found.',
    'Data tidak bisa dihapus karena masih dipakai data lain.': 'This data cannot be deleted because it is still used by other data.',
    'Kategori tidak bisa dihapus karena masih terhubung dengan produk aktif atau riwayat produk yang pernah dihapus.':
      'Category cannot be deleted because it is still linked to active products or deleted product history.',
    'Kategori tidak bisa dihapus karena masih dipakai produk aktif.':
      'Category cannot be deleted because it is still used by active products.',
    'Kategori masih dipakai produk.': 'Category is still used by products.',
    'Logout berhasil.': 'Logged out successfully.',
    'Produk tidak aktif atau tidak ditemukan.': 'Product is inactive or not found.',
    'Riwayat stok tidak dapat dihapus.': 'Stock history cannot be deleted.',
    'Riwayat stok tidak dapat diubah.': 'Stock history cannot be changed.',
    'Stok tidak cukup untuk stok keluar.': 'Not enough stock for stock out.',
    'Tidak bisa menonaktifkan akun sendiri.': 'You cannot deactivate your own account.',
    'Unauthenticated.': 'Your session has expired. Please log in again.',
  }

  if (message.startsWith('Stok ') && message.endsWith(' tidak cukup.')) {
    return message.replace(/^Stok (.+) tidak cukup\.$/, 'Not enough stock for $1.')
  }

  return translations[normalized] ?? friendlyEnglishValidation(normalized) ?? normalized
}

function englishApiMessageToIndonesian(message: string) {
  const translations: Record<string, string> = {
    'Unauthenticated.': 'Sesi Anda sudah berakhir. Silakan masuk kembali.',
    'This action is unauthorized.': 'Anda tidak memiliki akses untuk aksi ini.',
  }

  return translations[message] ?? null
}

const validationFieldLabels = {
  en: {
    address: 'address',
    amount: 'amount',
    category: 'category',
    category_id: 'category',
    customer_id: 'customer',
    date_from: 'from date',
    date_to: 'to date',
    discount_amount: 'discount',
    email: 'email',
    expense_date: 'expense date',
    file: 'file',
    is_active: 'status',
    image: 'product photo',
    items: 'items',
    min_stock: 'minimum stock',
    name: 'name',
    paid_amount: 'paid amount',
    password: 'password',
    payment_method: 'payment method',
    phone: 'phone',
    product_id: 'product',
    purchase_date: 'purchase date',
    purchase_price: 'purchase price',
    quantity: 'quantity',
    reference_number: 'reference number',
    role: 'role',
    selling_price: 'selling price',
    sku: 'SKU',
    stock: 'stock',
    supplier_id: 'supplier',
    tax_amount: 'tax',
    title: 'expense name',
    unit: 'unit',
    unit_price: 'unit price',
  },
  id: {
    address: 'alamat',
    amount: 'jumlah',
    category: 'kategori',
    category_id: 'kategori',
    customer_id: 'pelanggan',
    date_from: 'tanggal awal',
    date_to: 'tanggal akhir',
    discount_amount: 'diskon',
    email: 'email',
    expense_date: 'tanggal pengeluaran',
    file: 'file',
    is_active: 'status',
    image: 'foto produk',
    items: 'item',
    min_stock: 'stok minimum',
    name: 'nama',
    paid_amount: 'jumlah dibayar',
    password: 'kata sandi',
    payment_method: 'metode pembayaran',
    phone: 'telepon',
    product_id: 'produk',
    purchase_date: 'tanggal pembelian',
    purchase_price: 'harga beli',
    quantity: 'jumlah',
    reference_number: 'nomor referensi',
    role: 'peran',
    selling_price: 'harga jual',
    sku: 'SKU',
    stock: 'stok',
    supplier_id: 'supplier',
    tax_amount: 'pajak',
    title: 'nama pengeluaran',
    unit: 'satuan',
    unit_price: 'harga satuan',
  },
} as const

function normalizeValidationField(field: string) {
  const cleanField = field
    .replace(/\.\d+\./g, '.')
    .replace(/\.\d+$/g, '')
    .replace(/\s+/g, '_')
    .replace(/\./g, '_')
    .toLowerCase()

  const aliases: Record<string, keyof typeof validationFieldLabels.id> = {
    category: 'category_id',
    category_id: 'category_id',
    customer: 'customer_id',
    customer_id: 'customer_id',
    expense: 'title',
    'items_product_id': 'product_id',
    'items_quantity': 'quantity',
    'items_unit_price': 'unit_price',
    'items_discount_amount': 'discount_amount',
    product: 'product_id',
    product_id: 'product_id',
  }

  return aliases[cleanField] ?? cleanField
}

function fieldLabel(field: string, language: 'id' | 'en') {
  const key = normalizeValidationField(field)
  const labels = validationFieldLabels[language] as Record<string, string>

  return labels[key] ?? field.replace(/_/g, ' ')
}

function englishValidationToIndonesian(message: string) {
  const uniqueMatch = message.match(/^The (.+) has already been taken\.$/i)
  if (uniqueMatch) {
    return `${fieldLabel(uniqueMatch[1], 'id')} sudah digunakan.`
  }

  const requiredMatch = message.match(/^The (.+) field is required\.$/i)
  if (requiredMatch) {
    return `${fieldLabel(requiredMatch[1], 'id')} wajib diisi.`
  }

  const selectedMatch = message.match(/^The selected (.+) is invalid\.$/i)
  if (selectedMatch) {
    return `${fieldLabel(selectedMatch[1], 'id')} yang dipilih tidak valid.`
  }

  const numericMatch = message.match(/^The (.+) field must be a number\.$/i)
  if (numericMatch) {
    return `${fieldLabel(numericMatch[1], 'id')} harus berupa angka.`
  }

  const integerMatch = message.match(/^The (.+) field must be an integer\.$/i)
  if (integerMatch) {
    return `${fieldLabel(integerMatch[1], 'id')} harus berupa angka bulat.`
  }

  const minMatch = message.match(/^The (.+) field must be at least (.+)\.$/i)
  if (minMatch) {
    return `${fieldLabel(minMatch[1], 'id')} minimal ${minMatch[2]}.`
  }

  const imageMatch = message.match(/^The (.+) field must be an image\.$/i)
  if (imageMatch) {
    return `${fieldLabel(imageMatch[1], 'id')} harus berupa gambar.`
  }

  const mimesMatch = message.match(/^The (.+) field must be a file of type: (.+)\.$/i)
  if (mimesMatch) {
    return `${fieldLabel(mimesMatch[1], 'id')} harus memakai format ${mimesMatch[2]}.`
  }

  const maxKilobytesMatch = message.match(/^The (.+) field must not be greater than (.+) kilobytes\.$/i)
  if (maxKilobytesMatch) {
    return `${fieldLabel(maxKilobytesMatch[1], 'id')} maksimal ${Math.round(Number(maxKilobytesMatch[2]) / 1024)} MB.`
  }

  const maxMatch = message.match(/^The (.+) field must not be greater than (.+) characters\.$/i)
  if (maxMatch) {
    return `${fieldLabel(maxMatch[1], 'id')} maksimal ${maxMatch[2]} karakter.`
  }

  return null
}

function friendlyEnglishValidation(message: string) {
  const uniqueMatch = message.match(/^The (.+) has already been taken\.$/i)
  if (uniqueMatch) {
    return `${fieldLabel(uniqueMatch[1], 'en')} is already in use.`
  }

  const imageMatch = message.match(/^The (.+) field must be an image\.$/i)
  if (imageMatch) {
    return `${fieldLabel(imageMatch[1], 'en')} must be an image.`
  }

  const mimesMatch = message.match(/^The (.+) field must be a file of type: (.+)\.$/i)
  if (mimesMatch) {
    return `${fieldLabel(mimesMatch[1], 'en')} must use ${mimesMatch[2]} format.`
  }

  const maxKilobytesMatch = message.match(/^The (.+) field must not be greater than (.+) kilobytes\.$/i)
  if (maxKilobytesMatch) {
    return `${fieldLabel(maxKilobytesMatch[1], 'en')} must be at most ${Math.round(Number(maxKilobytesMatch[2]) / 1024)} MB.`
  }

  return null
}

export function isNotFoundError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404
}
