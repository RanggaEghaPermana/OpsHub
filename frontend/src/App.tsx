import {
  Activity,
  AlertTriangle,
  BarChart3,
  Banknote,
  Boxes,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Database,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  History,
  Info,
  ImagePlus,
  Layers,
  Languages,
  LoaderCircle,
  LogOut,
  Menu,
  Monitor,
  Moon,
  MoreHorizontal,
  Package,
  Plus,
  Receipt,
  Save,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Sun,
  Trash2,
  Undo2,
  Upload,
  UserCog,
  Users,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { Suspense, createContext, lazy, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { api, apiErrorMessage, getStoredToken, isNotFoundError, setAuthToken } from './api'
import type {
  AuditLog,
  Category,
  Customer,
  DashboardData,
  Expense,
  Location,
  Paginated,
  Product,
  ProfitReport,
  Purchase,
  Role,
  Sale,
  StockMovement,
  StoreSetting,
  Supplier,
  User,
} from './types'
import type { LucideIcon } from 'lucide-react'

type View =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'stock'
  | 'sales'
  | 'customers'
  | 'reports'
  | 'profit'
  | 'invoices'
  | 'purchases'
  | 'suppliers'
  | 'expenses'
  | 'lowStockAlerts'
  | 'locations'
  | 'audit'
  | 'users'
  | 'settings'

type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'
type LanguagePreference = 'id' | 'en' | 'system'
type Language = 'id' | 'en'
type ToastType = 'success' | 'error' | 'info'

type ToastMessage = {
  id: number
  leaving?: boolean
  type: ToastType
  message: string
}

type ConfirmDialogState = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  intent?: 'default' | 'danger'
  resolve: (confirmed: boolean) => void
}

type AppUiContextValue = {
  confirmAction: (options: Omit<ConfirmDialogState, 'resolve'>) => Promise<boolean>
  language: Language
  languagePreference: LanguagePreference
  notify: (type: ToastType, message: string) => void
  resolvedTheme: ResolvedTheme
  setLanguagePreference: (preference: LanguagePreference) => void
  setThemePreference: (preference: ThemePreference) => void
  t: (key: TranslationKey) => string
  themePreference: ThemePreference
}

type LoginResponse = {
  token: string
  user: User
}

const copy = {
  id: {
    active: 'Aktif',
    addItem: 'Tambah item',
    address: 'Alamat',
    admin: 'Admin',
    adjustment: 'Penyesuaian',
    addStockHistory: 'Tambah riwayat',
    all: 'Semua',
    amount: 'Jumlah biaya',
    actions: 'Aksi',
    activeCustomers: 'Pelanggan aktif',
    allowCancelSales: 'Boleh membatalkan transaksi',
    allowDeleteCategories: 'Boleh menghapus kategori',
    allowDeleteCustomers: 'Boleh menghapus pelanggan',
    allowDeleteProducts: 'Boleh menghapus produk',
    allowManageExpenses: 'Boleh mengelola pengeluaran',
    allowManagePurchases: 'Boleh mengelola pembelian',
    allowProfitReport: 'Boleh melihat laporan laba',
    allowRefundSales: 'Boleh refund transaksi',
    applyFilter: 'Terapkan filter',
    appTagline: 'Operasional toko, stok, transaksi, dan laporan dalam satu dasbor.',
    audit: 'Riwayat',
    auditLog: 'Riwayat aktivitas',
    backToList: 'Kembali ke daftar',
    brandTagline: 'manage track grow',
    categoryManagement: 'Manajemen kategori',
    cancel: 'Batal',
    cancelSale: 'Batalkan transaksi',
    card: 'Kartu',
    cash: 'Tunai',
    cashier: 'Kasir',
    category: 'Kategori',
    categories: 'Kategori',
    categoryList: 'Daftar kategori',
    categoryName: 'Nama kategori',
    categoryCreated: 'Kategori berhasil dibuat.',
    categoryDeleteBlocked: 'Kategori tidak bisa dihapus karena masih dipakai produk aktif.',
    categoryDeleted: 'Kategori berhasil dihapus.',
    categoryUpdated: 'Kategori berhasil diperbarui.',
    changeLanguage: 'Bahasa',
    changeProductPhoto: 'Ganti foto',
    chooseCategory: 'Pilih kategori',
    chooseFile: 'Pilih file',
    chooseLocation: 'Pilih lokasi',
    chooseProductPhoto: 'Pilih foto',
    chooseProduct: 'Pilih produk',
    chooseSupplier: 'Pilih supplier',
    clearSearch: 'Hapus pencarian',
    close: 'Tutup',
    confirm: 'Konfirmasi',
    contact: 'Kontak',
    costOfGoodsSold: 'Harga modal terjual',
    customer: 'Pelanggan',
    customerList: 'Daftar pelanggan',
    customerManagement: 'Manajemen pelanggan',
    customerNew: 'Pelanggan baru',
    customerEdit: 'Edit pelanggan',
    customerCreated: 'Pelanggan berhasil dibuat.',
    customerDeleted: 'Pelanggan berhasil dihapus.',
    customerUpdated: 'Pelanggan berhasil diperbarui.',
    customerDetail: 'Detail pelanggan',
    customers: 'Pelanggan',
    customDate: 'Tanggal custom',
    dailyRevenue: 'Omzet harian',
    dailyTransactions: 'Transaksi harian',
    dashboard: 'Dasbor',
    dark: 'Gelap',
    delete: 'Hapus',
    deleteConfirmMessage: 'Data ini akan dihapus dari daftar. Aksi ini tidak memakai dialog bawaan browser.',
    deleteConfirmTitle: 'Hapus data?',
    deleteSuccess: 'Data berhasil dihapus.',
    deleteStale: 'Data sudah tidak ada di server. Daftar sudah diperbarui.',
    description: 'Deskripsi',
    discount: 'Diskon',
    edit: 'Edit',
    editCategory: 'Edit kategori',
    editProduct: 'Edit produk',
    email: 'Email',
    english: 'Inggris',
    event: 'Aktivitas',
    expenseCategory: 'Kategori biaya',
    expenseCreated: 'Pengeluaran berhasil dibuat.',
    expenseDate: 'Tanggal biaya',
    expenseDeleted: 'Pengeluaran berhasil dihapus.',
    expenseList: 'Daftar pengeluaran',
    expenseManagement: 'Manajemen pengeluaran',
    expenseNew: 'Pengeluaran baru',
    expenseTitle: 'Nama pengeluaran',
    expenseUpdated: 'Pengeluaran berhasil diperbarui.',
    expenses: 'Pengeluaran',
    emptyLowStockSearch: 'Tidak ada stok kritis yang cocok dengan pencarian ini.',
    emptySearch: 'Tidak ada data yang cocok dengan pencarian ini.',
    export: 'Ekspor',
    exportCsv: 'Ekspor CSV',
    exportNoData: 'Tidak ada data yang bisa diekspor dari daftar ini.',
    exportPdf: 'Ekspor PDF',
    filterAndExport: 'Filter & ekspor',
    generalCustomer: 'Pelanggan umum',
    grossProfit: 'Laba kotor',
    hideLowStock: 'Semua',
    in: 'Masuk',
    inactive: 'Nonaktif',
    indonesia: 'Indonesia',
    invoice: 'Faktur',
    invoicePdf: 'Faktur PDF',
    invoiceSales: 'Faktur penjualan',
    invoiceOpened: 'Faktur PDF berhasil diunduh.',
    invoicePrefix: 'Prefix faktur',
    importDone: 'Impor selesai.',
    importFile: 'File impor',
    importProducts: 'Impor produk',
    languageHelp: 'Pilih bahasa antarmuka. Mode sistem mengikuti bahasa browser.',
    light: 'Terang',
    location: 'Lokasi',
    locationCreated: 'Lokasi berhasil dibuat.',
    locationDeleted: 'Lokasi berhasil dinonaktifkan.',
    locationEdit: 'Edit lokasi',
    locationList: 'Daftar lokasi',
    locationManagement: 'Cabang dan gudang',
    locationNew: 'Lokasi baru',
    locationType: 'Tipe lokasi',
    locationUpdated: 'Lokasi berhasil diperbarui.',
    locations: 'Lokasi',
    loginDemo: 'Akun seed',
    loginEyebrow: 'Akses korporat',
    loadingData: 'Memuat data...',
    loadingDashboard: 'Memuat dasbor...',
    loadingList: 'Memuat daftar...',
    loadingReports: 'Memuat laporan...',
    loadingSession: 'Memuat sesi...',
    login: 'Masuk',
    loginHelp: 'Gunakan akun seed atau pengguna yang dibuat admin.',
    loginSecurityNote: 'Autentikasi token dan kontrol peran aktif.',
    loginSubtitle: 'Masuk untuk melanjutkan ke dashboard operasional.',
    loginWorkspaceSubtitle: 'Ringkasan akses dan aktivitas toko.',
    loginWorkspaceTitle: 'Ruang kerja operasional UMKM',
    loginSuccess: 'Berhasil masuk.',
    logout: 'Keluar',
    logoutConfirmMessage: 'Sesi Anda akan ditutup dan Anda akan kembali ke halaman masuk.',
    logoutConfirmTitle: 'Yakin ingin keluar?',
    logoutSuccess: 'Berhasil keluar.',
    loggingOut: 'Sedang keluar...',
    lowStock: 'Stok menipis',
    lowStockAlerts: 'Alert stok',
    menu: 'Menu',
    navAdmin: 'Admin sistem',
    navInventory: 'Inventori',
    navPurchasing: 'Pembelian & biaya',
    navReports: 'Analitik',
    navSales: 'Penjualan',
    lastPurchase: 'Terakhir beli',
    minimum: 'Minimum',
    minStock: 'Min stok',
    name: 'Nama',
    newCategory: 'Kategori baru',
    newProduct: 'Produk baru',
    newSale: 'Transaksi baru',
    netProfit: 'Laba bersih',
    nextPage: 'Berikutnya',
    noProductPhoto: 'Belum ada foto',
    noAuditLogs: 'Belum ada riwayat aktivitas.',
    noCategories: 'Belum ada kategori.',
    noCustomerSales: 'Pelanggan ini belum punya transaksi.',
    noCustomers: 'Belum ada pelanggan.',
    noExpenses: 'Belum ada pengeluaran pada periode ini.',
    noLocations: 'Belum ada lokasi.',
    noLowStock: 'Tidak ada stok kritis saat ini.',
    noOperationalExpenses: 'Tidak ada pengeluaran operasional pada periode ini.',
    noProducts: 'Belum ada produk.',
    noPurchases: 'Belum ada pembelian pada periode ini.',
    noSales: 'Belum ada transaksi.',
    noStockHistory: 'Belum ada riwayat stok.',
    noSuppliers: 'Belum ada supplier.',
    noTopProducts: 'Belum ada produk terlaris pada periode ini.',
    noUsers: 'Belum ada pengguna.',
    note: 'Catatan',
    noteTitle: 'Catatan',
    out: 'Keluar',
    openingInvoice: 'Mengunduh faktur...',
    operationalExpenses: 'Pengeluaran operasional',
    owner: 'Pemilik',
    paid: 'Lunas',
    partial: 'Sebagian',
    password: 'Kata sandi',
    payment: 'Pembayaran',
    paymentStatus: 'Status pembayaran',
    paidAmount: 'Dibayar',
    changeAmount: 'Kembalian',
    permissions: 'Hak akses detail',
    phone: 'Telepon',
    previousPage: 'Sebelumnya',
    price: 'Harga',
    product: 'Produk',
    productList: 'Daftar produk',
    productManagement: 'Manajemen produk',
    productName: 'Nama produk',
    productPhoto: 'Foto produk',
    productPhotoHelp: 'Gunakan JPG, PNG, atau WebP maksimal 2 MB.',
    productCreated: 'Produk berhasil dibuat.',
    productDeleted: 'Produk berhasil dihapus.',
    productUpdated: 'Produk berhasil diperbarui.',
    productTools: 'Aksi produk',
    products: 'Produk',
    processing: 'Memproses...',
    profitReport: 'Laporan laba rugi',
    purchasePrice: 'Harga beli',
    purchaseDate: 'Tanggal pembelian',
    purchaseHistory: 'Riwayat pembelian',
    purchaseManagement: 'Manajemen pembelian',
    purchaseNew: 'Pembelian baru',
    purchaseSaved: 'Pembelian berhasil disimpan.',
    purchases: 'Pembelian',
    purchasesTotal: 'Total pembelian',
    quantity: 'Jumlah',
    receipt: 'Nota',
    referenceNumber: 'Nomor referensi',
    refunded: 'Dikembalikan',
    refundConfirmMessage: 'Stok barang akan dikembalikan dan transaksi ditandai refund.',
    refundConfirmTitle: 'Refund transaksi?',
    refundReason: 'Alasan refund',
    refundSale: 'Refund transaksi',
    removeItem: 'Hapus item',
    removeProductPhoto: 'Hapus foto',
    removing: 'Menghapus...',
    reports: 'Laporan',
    reportTools: 'Aksi laporan',
    restockNeeded: 'Perlu restock',
    restockProduct: 'Restock produk',
    restockQuantity: 'Jumlah restock',
    restockSave: 'Simpan restock',
    restockSuccess: 'Stok produk berhasil ditambahkan.',
    revenue: 'Omzet',
    rowNumber: 'No.',
    role: 'Peran',
    saleSaved: 'Transaksi berhasil disimpan.',
    saleCancelled: 'Transaksi berhasil dibatalkan.',
    saleRefunded: 'Transaksi berhasil di-refund.',
    saleHistory: 'Riwayat transaksi',
    sales: 'Transaksi',
    salesReport: 'Laporan penjualan',
    save: 'Simpan',
    saveSale: 'Simpan transaksi',
    saving: 'Menyimpan...',
    searchAudit: 'Cari aktivitas/pengguna/data',
    searchCategory: 'Cari kategori/deskripsi',
    searchCustomer: 'Cari nama/email/telepon',
    searchExpense: 'Cari pengeluaran/kategori/lokasi',
    searchLocation: 'Cari lokasi/tipe/telepon',
    searchProduct: 'Cari produk/SKU',
    searchReportProduct: 'Cari produk laporan',
    searchSale: 'Cari faktur/pelanggan',
    searchStock: 'Cari produk/SKU/catatan',
    searchSupplier: 'Cari supplier/email/telepon',
    searchUser: 'Cari nama/email/peran',
    settings: 'Pengaturan',
    settingSaved: 'Pengaturan berhasil disimpan.',
    setupBackup: 'Backup database',
    settingsTitle: 'Pengaturan aplikasi',
    scanSku: 'Scan / ketik SKU',
    scanSkuHelp: 'Tekan Enter untuk menambahkan produk ke transaksi.',
    setupDescription: 'Preferensi disimpan di browser perangkat ini.',
    showLowStock: 'Menipis',
    skuNotFound: 'SKU tidak ditemukan atau produk tidak aktif.',
    staff: 'Kasir',
    status: 'Status',
    stock: 'Stok',
    stockCount: 'stok',
    stockAfterBefore: 'Sebelum/Sesudah',
    stockHistory: 'Riwayat stok',
    stockInput: 'Input stok',
    stockMovementCreated: 'Riwayat stok berhasil ditambahkan.',
    stockManagement: 'Stok masuk/keluar',
    tableTools: 'Aksi data',
    stockTarget: 'Stok target',
    storeName: 'Nama toko',
    storeSettings: 'Pengaturan toko',
    summary30Days: 'Ringkasan 30 hari',
    subtotal: 'Subtotal',
    supplier: 'Supplier',
    supplierCreated: 'Supplier berhasil dibuat.',
    supplierDeleted: 'Supplier berhasil dihapus.',
    supplierEdit: 'Edit supplier',
    supplierList: 'Daftar supplier',
    supplierManagement: 'Manajemen supplier',
    supplierNew: 'Supplier baru',
    supplierUpdated: 'Supplier berhasil diperbarui.',
    suppliers: 'Supplier',
    system: 'Sistem',
    tax: 'Pajak',
    dateFrom: 'Dari tanggal',
    dateTo: 'Sampai tanggal',
    defaultTaxRate: 'Pajak default (%)',
    theme: 'Mode tampilan',
    themeHelp: 'Mode sistem mengikuti preferensi terang/gelap perangkat.',
    time: 'Waktu',
    topProducts: 'Produk terlaris',
    total: 'Total',
    totalSpend: 'Total belanja',
    transactionCount: 'Jumlah transaksi',
    transfer: 'Transfer',
    unpaid: 'Belum lunas',
    unit: 'Satuan',
    user: 'Pengguna',
    userList: 'Daftar pengguna',
    userManagement: 'Manajemen pengguna',
    userNew: 'Pengguna baru',
    userEdit: 'Edit pengguna',
    userCreated: 'Pengguna berhasil dibuat.',
    userDeleted: 'Pengguna berhasil dinonaktifkan.',
    userUpdated: 'Pengguna berhasil diperbarui.',
    users: 'Pengguna',
    unitCost: 'Harga modal',
    viewDetail: 'Lihat detail',
    warehouse: 'Gudang',
    store: 'Toko',
    sellingPrice: 'Harga jual',
    soldQuantity: 'Jumlah terjual',
    systemActivity: 'Riwayat perubahan',
    target: 'Data',
    type: 'Tipe',
  },
  en: {
    active: 'Active',
    addItem: 'Add item',
    address: 'Address',
    admin: 'Admin',
    adjustment: 'Adjustment',
    addStockHistory: 'Add stock history',
    all: 'All',
    amount: 'Amount',
    actions: 'Actions',
    activeCustomers: 'Active customers',
    allowCancelSales: 'Can cancel transactions',
    allowDeleteCategories: 'Can delete categories',
    allowDeleteCustomers: 'Can delete customers',
    allowDeleteProducts: 'Can delete products',
    allowManageExpenses: 'Can manage expenses',
    allowManagePurchases: 'Can manage purchases',
    allowProfitReport: 'Can view profit report',
    allowRefundSales: 'Can refund transactions',
    applyFilter: 'Apply filter',
    appTagline: 'Store operations, inventory, transactions, and reports in one dashboard.',
    audit: 'History',
    auditLog: 'Activity history',
    backToList: 'Back to list',
    brandTagline: 'manage track grow',
    categoryManagement: 'Category management',
    cancel: 'Cancel',
    cancelSale: 'Cancel sale',
    card: 'Card',
    cash: 'Cash',
    cashier: 'Cashier',
    category: 'Category',
    categories: 'Categories',
    categoryList: 'Category list',
    categoryName: 'Category name',
    categoryCreated: 'Category created successfully.',
    categoryDeleteBlocked: 'Category cannot be deleted because it is still used by active products.',
    categoryDeleted: 'Category deleted successfully.',
    categoryUpdated: 'Category updated successfully.',
    changeLanguage: 'Language',
    changeProductPhoto: 'Change photo',
    chooseCategory: 'Choose category',
    chooseFile: 'Choose file',
    chooseLocation: 'Choose location',
    chooseProductPhoto: 'Choose photo',
    chooseProduct: 'Choose product',
    chooseSupplier: 'Choose supplier',
    clearSearch: 'Clear search',
    close: 'Close',
    confirm: 'Confirm',
    contact: 'Contact',
    costOfGoodsSold: 'Cost of goods sold',
    customer: 'Customer',
    customerList: 'Customer list',
    customerManagement: 'Customer management',
    customerNew: 'New customer',
    customerEdit: 'Edit customer',
    customerCreated: 'Customer created successfully.',
    customerDeleted: 'Customer deleted successfully.',
    customerUpdated: 'Customer updated successfully.',
    customerDetail: 'Customer detail',
    customers: 'Customers',
    customDate: 'Custom date',
    dailyRevenue: 'Daily revenue',
    dailyTransactions: 'Daily transactions',
    dashboard: 'Dashboard',
    dark: 'Dark',
    delete: 'Delete',
    deleteConfirmMessage: 'This item will be removed from the list. This action uses the custom app dialog.',
    deleteConfirmTitle: 'Delete item?',
    deleteSuccess: 'Data deleted successfully.',
    deleteStale: 'The item was already removed on the server. The list has been refreshed.',
    description: 'Description',
    discount: 'Discount',
    edit: 'Edit',
    editCategory: 'Edit category',
    editProduct: 'Edit product',
    email: 'Email',
    english: 'English',
    event: 'Activity',
    expenseCategory: 'Expense category',
    expenseCreated: 'Expense created successfully.',
    expenseDate: 'Expense date',
    expenseDeleted: 'Expense deleted successfully.',
    expenseList: 'Expense list',
    expenseManagement: 'Expense management',
    expenseNew: 'New expense',
    expenseTitle: 'Expense name',
    expenseUpdated: 'Expense updated successfully.',
    expenses: 'Expenses',
    emptyLowStockSearch: 'No critical stock matches this search.',
    emptySearch: 'No data matches this search.',
    export: 'Export',
    exportCsv: 'Export CSV',
    exportNoData: 'There is no data to export from this list.',
    exportPdf: 'Export PDF',
    filterAndExport: 'Filter & export',
    generalCustomer: 'Walk-in customer',
    grossProfit: 'Gross profit',
    hideLowStock: 'All',
    in: 'In',
    inactive: 'Inactive',
    indonesia: 'Indonesian',
    invoice: 'Invoice',
    invoicePdf: 'Invoice PDF',
    invoiceSales: 'Sales invoice',
    invoiceOpened: 'Invoice PDF downloaded successfully.',
    invoicePrefix: 'Invoice prefix',
    importDone: 'Import completed.',
    importFile: 'Import file',
    importProducts: 'Import products',
    languageHelp: 'Choose the interface language. System mode follows the browser language.',
    light: 'Light',
    location: 'Location',
    locationCreated: 'Location created successfully.',
    locationDeleted: 'Location deactivated successfully.',
    locationEdit: 'Edit location',
    locationList: 'Location list',
    locationManagement: 'Branches and warehouses',
    locationNew: 'New location',
    locationType: 'Location type',
    locationUpdated: 'Location updated successfully.',
    locations: 'Locations',
    loginDemo: 'Seed account',
    loginEyebrow: 'Corporate access',
    loadingData: 'Loading data...',
    loadingDashboard: 'Loading dashboard...',
    loadingList: 'Loading list...',
    loadingReports: 'Loading reports...',
    loadingSession: 'Loading session...',
    login: 'Login',
    loginHelp: 'Use a seeded account or a user created by admin.',
    loginSecurityNote: 'Token authentication and role controls are active.',
    loginSubtitle: 'Login to continue to the operations dashboard.',
    loginWorkspaceSubtitle: 'Access and store activity overview.',
    loginWorkspaceTitle: 'UMKM operations workspace',
    loginSuccess: 'Login successful.',
    logout: 'Logout',
    logoutConfirmMessage: 'Your session will be closed and you will return to the login page.',
    logoutConfirmTitle: 'Are you sure you want to logout?',
    logoutSuccess: 'Logout successful.',
    loggingOut: 'Logging out...',
    lowStock: 'Low stock',
    lowStockAlerts: 'Stock alerts',
    menu: 'Menu',
    navAdmin: 'System admin',
    navInventory: 'Inventory',
    navPurchasing: 'Purchasing & costs',
    navReports: 'Analytics',
    navSales: 'Sales',
    lastPurchase: 'Last purchase',
    minimum: 'Minimum',
    minStock: 'Min stock',
    name: 'Name',
    newCategory: 'New category',
    newProduct: 'New product',
    newSale: 'New transaction',
    netProfit: 'Net profit',
    nextPage: 'Next',
    noProductPhoto: 'No photo yet',
    noAuditLogs: 'No activity history yet.',
    noCategories: 'No categories yet.',
    noCustomerSales: 'This customer has no transactions yet.',
    noCustomers: 'No customers yet.',
    noExpenses: 'No expenses in this period.',
    noLocations: 'No locations yet.',
    noLowStock: 'No critical stock right now.',
    noOperationalExpenses: 'No operational expenses in this period.',
    noProducts: 'No products yet.',
    noPurchases: 'No purchases in this period.',
    noSales: 'No transactions yet.',
    noStockHistory: 'No stock history yet.',
    noSuppliers: 'No suppliers yet.',
    noTopProducts: 'No top products in this period.',
    noUsers: 'No users yet.',
    note: 'Note',
    noteTitle: 'Note',
    out: 'Out',
    openingInvoice: 'Downloading invoice...',
    operationalExpenses: 'Operational expenses',
    owner: 'Owner',
    paid: 'Paid',
    partial: 'Partial',
    password: 'Password',
    payment: 'Payment',
    paymentStatus: 'Payment status',
    paidAmount: 'Paid',
    changeAmount: 'Change',
    permissions: 'Detailed permissions',
    phone: 'Phone',
    previousPage: 'Previous',
    price: 'Price',
    product: 'Product',
    productList: 'Product list',
    productManagement: 'Product management',
    productName: 'Product name',
    productPhoto: 'Product photo',
    productPhotoHelp: 'Use JPG, PNG, or WebP up to 2 MB.',
    productCreated: 'Product created successfully.',
    productDeleted: 'Product deleted successfully.',
    productUpdated: 'Product updated successfully.',
    productTools: 'Product actions',
    products: 'Products',
    processing: 'Processing...',
    profitReport: 'Profit and loss',
    purchasePrice: 'Purchase price',
    purchaseDate: 'Purchase date',
    purchaseHistory: 'Purchase history',
    purchaseManagement: 'Purchase management',
    purchaseNew: 'New purchase',
    purchaseSaved: 'Purchase saved successfully.',
    purchases: 'Purchases',
    purchasesTotal: 'Total purchases',
    quantity: 'Quantity',
    receipt: 'Receipt',
    referenceNumber: 'Reference number',
    refunded: 'Refunded',
    refundConfirmMessage: 'Stock will be returned and the transaction will be marked as refunded.',
    refundConfirmTitle: 'Refund transaction?',
    refundReason: 'Refund reason',
    refundSale: 'Refund transaction',
    removeItem: 'Remove item',
    removeProductPhoto: 'Remove photo',
    removing: 'Removing...',
    reports: 'Reports',
    reportTools: 'Report actions',
    restockNeeded: 'Restock needed',
    restockProduct: 'Restock product',
    restockQuantity: 'Restock quantity',
    restockSave: 'Save restock',
    restockSuccess: 'Product stock added successfully.',
    revenue: 'Revenue',
    rowNumber: 'No.',
    role: 'Role',
    saleSaved: 'Transaction saved successfully.',
    saleCancelled: 'Transaction cancelled successfully.',
    saleRefunded: 'Transaction refunded successfully.',
    saleHistory: 'Transaction history',
    sales: 'Transactions',
    salesReport: 'Sales report',
    save: 'Save',
    saveSale: 'Save transaction',
    saving: 'Saving...',
    searchAudit: 'Search activity/user/record',
    searchCategory: 'Search category/description',
    searchCustomer: 'Search name/email/phone',
    searchExpense: 'Search expense/category/location',
    searchLocation: 'Search location/type/phone',
    searchProduct: 'Search product/SKU',
    searchReportProduct: 'Search report product',
    searchSale: 'Search invoice/customer',
    searchStock: 'Search product/SKU/note',
    searchSupplier: 'Search supplier/email/phone',
    searchUser: 'Search name/email/role',
    scanSku: 'Scan / type SKU',
    scanSkuHelp: 'Press Enter to add the product to the transaction.',
    settings: 'Settings',
    settingSaved: 'Settings saved.',
    setupBackup: 'Database backup',
    settingsTitle: 'Application settings',
    setupDescription: 'Preferences are saved in this browser.',
    showLowStock: 'Low stock',
    skuNotFound: 'SKU was not found or product is inactive.',
    staff: 'Staff',
    status: 'Status',
    stock: 'Stock',
    stockCount: 'stock',
    stockAfterBefore: 'Before/After',
    stockHistory: 'Stock history',
    stockInput: 'Stock input',
    stockMovementCreated: 'Stock history added successfully.',
    stockManagement: 'Stock in/out',
    tableTools: 'Data actions',
    stockTarget: 'Target stock',
    storeName: 'Store name',
    storeSettings: 'Store settings',
    summary30Days: '30-day summary',
    subtotal: 'Subtotal',
    supplier: 'Supplier',
    supplierCreated: 'Supplier created successfully.',
    supplierDeleted: 'Supplier deleted successfully.',
    supplierEdit: 'Edit supplier',
    supplierList: 'Supplier list',
    supplierManagement: 'Supplier management',
    supplierNew: 'New supplier',
    supplierUpdated: 'Supplier updated successfully.',
    suppliers: 'Suppliers',
    system: 'System',
    tax: 'Tax',
    dateFrom: 'From date',
    dateTo: 'To date',
    defaultTaxRate: 'Default tax (%)',
    theme: 'Display mode',
    themeHelp: 'System mode follows this device light/dark preference.',
    time: 'Time',
    topProducts: 'Top products',
    total: 'Total',
    totalSpend: 'Total spend',
    transactionCount: 'Transaction count',
    transfer: 'Transfer',
    unpaid: 'Unpaid',
    unit: 'Unit',
    user: 'User',
    userList: 'User list',
    userManagement: 'User management',
    userNew: 'New user',
    userEdit: 'Edit user',
    userCreated: 'User created successfully.',
    userDeleted: 'User deactivated successfully.',
    userUpdated: 'User updated successfully.',
    users: 'Users',
    unitCost: 'Unit cost',
    viewDetail: 'View detail',
    warehouse: 'Warehouse',
    store: 'Store',
    sellingPrice: 'Selling price',
    soldQuantity: 'Quantity sold',
    systemActivity: 'Change history',
    target: 'Record',
    type: 'Type',
  },
} as const

type TranslationKey = keyof typeof copy.id

const AppUiContext = createContext<AppUiContextValue | null>(null)

function useAppUi() {
  const context = useContext(AppUiContext)

  if (!context) {
    throw new Error('useAppUi must be used inside AppUiContext.Provider')
  }

  return context
}

type NavItem = {
  key: View
  labelKey: TranslationKey
  icon: LucideIcon
  roles?: Role[]
}

type NavGroup = {
  key: string
  labelKey: TranslationKey
  icon: LucideIcon
  items: View[]
}

const navItems: NavItem[] = [
  { key: 'dashboard', labelKey: 'dashboard', icon: Activity },
  { key: 'products', labelKey: 'products', icon: Package },
  { key: 'categories', labelKey: 'categories', icon: Layers },
  { key: 'stock', labelKey: 'stock', icon: Boxes },
  { key: 'sales', labelKey: 'sales', icon: ShoppingCart },
  { key: 'customers', labelKey: 'customers', icon: Users },
  { key: 'invoices', labelKey: 'invoice', icon: Receipt },
  { key: 'purchases', labelKey: 'purchases', icon: ClipboardList },
  { key: 'suppliers', labelKey: 'suppliers', icon: Truck },
  { key: 'expenses', labelKey: 'expenses', icon: Banknote, roles: ['admin', 'owner'] },
  { key: 'reports', labelKey: 'reports', icon: BarChart3 },
  { key: 'profit', labelKey: 'profitReport', icon: FileSpreadsheet, roles: ['admin', 'owner'] },
  { key: 'lowStockAlerts', labelKey: 'lowStockAlerts', icon: AlertTriangle },
  { key: 'locations', labelKey: 'locations', icon: Building2, roles: ['admin', 'owner'] },
  { key: 'audit', labelKey: 'audit', icon: History, roles: ['admin', 'owner'] },
  { key: 'users', labelKey: 'users', icon: UserCog, roles: ['admin'] },
  { key: 'settings', labelKey: 'settings', icon: Settings },
]

const navGroups: NavGroup[] = [
  {
    icon: Package,
    items: ['products', 'categories', 'stock', 'lowStockAlerts'],
    key: 'inventory',
    labelKey: 'navInventory',
  },
  {
    icon: ShoppingCart,
    items: ['sales', 'invoices', 'customers'],
    key: 'sales',
    labelKey: 'navSales',
  },
  {
    icon: ClipboardList,
    items: ['purchases', 'suppliers', 'expenses'],
    key: 'purchasing',
    labelKey: 'navPurchasing',
  },
  {
    icon: BarChart3,
    items: ['reports', 'profit'],
    key: 'reports',
    labelKey: 'navReports',
  },
  {
    icon: Settings,
    items: ['locations', 'audit', 'users', 'settings'],
    key: 'admin',
    labelKey: 'navAdmin',
  },
]

function navGroupForView(view: View) {
  return navGroups.find((group) => group.items.includes(view))?.key ?? null
}

function navItemByView(view: View) {
  return navItems.find((item) => item.key === view)
}

const RevenueChart = lazy(() => import('./charts').then((module) => ({ default: module.RevenueChart })))
const TopProductsChart = lazy(() => import('./charts').then((module) => ({ default: module.TopProductsChart })))
const DailyTransactionsChart = lazy(() => import('./charts').then((module) => ({ default: module.DailyTransactionsChart })))
const PaymentStatusChart = lazy(() => import('./charts').then((module) => ({ default: module.PaymentStatusChart })))
const LIST_PAGE_SIZE = 10
const MOTION_EXIT_MS = 260
const TOAST_VISIBLE_MS = 4200
const DEFAULT_GET_TTL_MS = 60_000
const REFERENCE_GET_TTL_MS = 180_000
let toastIdSeed = 0

type PaginationInfo = {
  currentPage: number
  from: number
  lastPage: number
  perPage: number
  to: number
  total: number
}

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(' ')
}

function listData<T>(payload: Paginated<T> | T[]) {
  return Array.isArray(payload) ? payload : payload.data
}

function paginationInfo<T>(payload: Paginated<T> | T[], fallbackPage = 1, perPage = LIST_PAGE_SIZE): PaginationInfo {
  if (Array.isArray(payload)) {
    const total = payload.length
    const lastPage = Math.max(1, Math.ceil(total / perPage))
    const currentPage = Math.min(Math.max(1, fallbackPage), lastPage)
    const from = total ? (currentPage - 1) * perPage + 1 : 0
    const to = total ? Math.min(currentPage * perPage, total) : 0

    return { currentPage, from, lastPage, perPage, to, total }
  }

  const total = payload.total ?? payload.data.length
  const responsePerPage = Number(payload.per_page ?? perPage)
  const lastPage = Math.max(1, Number(payload.last_page ?? (Math.ceil(total / responsePerPage) || 1)))
  const currentPage = Math.min(Math.max(1, Number(payload.current_page ?? fallbackPage)), lastPage)
  const from = Number(payload.from ?? (total ? (currentPage - 1) * responsePerPage + 1 : 0))
  const to = Number(payload.to ?? (total ? Math.min(currentPage * responsePerPage, total) : 0))

  return { currentPage, from, lastPage, perPage: responsePerPage, to, total }
}

function clientPage<T>(items: T[], page: number, perPage = LIST_PAGE_SIZE) {
  const meta = paginationInfo(items, page, perPage)
  const start = (meta.currentPage - 1) * meta.perPage

  return {
    items: items.slice(start, start + meta.perPage),
    meta,
  }
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase()
}

function textMatchesSearch(search: string, values: Array<string | number | null | undefined>) {
  const term = normalizeSearch(search)

  if (!term) {
    return true
  }

  return values.some((value) => String(value ?? '').toLowerCase().includes(term))
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay)

    return () => window.clearTimeout(timer)
  }, [delay, value])

  return debouncedValue
}

function formatPaginationSummary(meta: PaginationInfo, language: Language) {
  if (!meta.total) {
    return language === 'id' ? 'Tidak ada data' : 'No records'
  }

  return language === 'id'
    ? `Menampilkan ${meta.from}-${meta.to} dari ${meta.total} data`
    : `Showing ${meta.from}-${meta.to} of ${meta.total} records`
}

const getCache = new Map<string, { expiresAt: number; value: unknown }>()
const getInFlight = new Map<string, Promise<unknown>>()
let getCacheVersion = 0

async function cachedGet<T>(path: string, ttl = DEFAULT_GET_TTL_MS): Promise<T> {
  const cached = getCache.get(path)
  const now = Date.now()

  if (cached && cached.expiresAt > now) {
    return cached.value as T
  }

  const existingRequest = getInFlight.get(path)

  if (existingRequest) {
    return existingRequest as Promise<T>
  }

  const requestVersion = getCacheVersion
  const request = api.get<T>(path).then((response) => {
    if (requestVersion === getCacheVersion) {
      getCache.set(path, {
        expiresAt: Date.now() + ttl,
        value: response.data,
      })
    }

    return response.data
  }).finally(() => {
    getInFlight.delete(path)
  })

  getInFlight.set(path, request)

  return request
}

function hasFreshCachedGet(path: string) {
  const cached = getCache.get(path)

  return Boolean(cached && cached.expiresAt > Date.now())
}

function shouldShowLoading(paths: string[]) {
  return paths.some((path) => !hasFreshCachedGet(path))
}

function clearGetCache() {
  getCacheVersion += 1
  getCache.clear()
  getInFlight.clear()
}

function currency(value: number | string, language: Language) {
  return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(value))
}

function dateTime(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function dateOnly(value: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function invoicePdfFileName(invoiceNumber: string, language: Language) {
  const prefix = language === 'id' ? 'faktur-penjualan' : 'sales-invoice'
  const safeInvoiceNumber = invoiceNumber.toLowerCase().replace(/[^a-z0-9-]+/gi, '-')

  return `${prefix}-${safeInvoiceNumber}.pdf`
}

function toNumber(value: string | number | undefined) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const text = String(value ?? '').trim()

  if (!text) {
    return 0
  }

  const normalized = /^\d{1,3}(\.\d{3})+$/.test(text)
    ? text.replace(/\./g, '')
    : text.includes(',')
      ? text.replace(/\./g, '').replace(',', '.')
      : text

  const numeric = Number(normalized)
  return Number.isFinite(numeric) ? numeric : 0
}

function normalizeMoneyInput(value: string) {
  return value.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '')
}

function moneyInputValue(value: string | number | undefined) {
  const raw = String(value ?? '')

  if (!raw) {
    return ''
  }

  return new Intl.NumberFormat('id-ID').format(toNumber(raw))
}

function apiMoneyToInput(value: string | number | undefined) {
  return String(Math.round(toNumber(value)))
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function dateInputFromValue(value?: string | null) {
  return value ? value.slice(0, 10) : todayInputValue()
}

function monthStartInputValue() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
}

function dateRangeQuery(dateFrom: string, dateTo: string) {
  const params = new URLSearchParams()

  if (dateFrom) params.set('date_from', dateFrom)
  if (dateTo) params.set('date_to', dateTo)

  return params
}

function pathWithLanguage(path: string, language?: Language) {
  if (!language) {
    return path
  }

  const [basePath, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  params.set('lang', language)

  return `${basePath}?${params.toString()}`
}

function exportFilename(
  type: 'customers' | 'expenses' | 'products' | 'profit' | 'purchases' | 'sales' | 'salesReport',
  language: Language,
  extension: 'csv' | 'pdf' = 'csv',
) {
  const names: Record<Language, Record<typeof type, string>> = {
    en: {
      customers: 'customers',
      expenses: 'expenses',
      products: 'products',
      profit: 'profit-loss',
      purchases: 'purchases',
      sales: 'transactions',
      salesReport: 'sales-report',
    },
    id: {
      customers: 'pelanggan',
      expenses: 'pengeluaran',
      products: 'produk',
      profit: 'laba-rugi',
      purchases: 'pembelian',
      sales: 'transaksi',
      salesReport: 'laporan-penjualan',
    },
  }

  return `${names[language][type]}.${extension}`
}

async function downloadBlob(path: string, filename: string, language?: Language) {
  const response = await api.get<Blob>(pathWithLanguage(path, language), { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

function storedPreference<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const stored = localStorage.getItem(key)

  return allowed.includes(stored as T) ? (stored as T) : fallback
}

function resolveLanguage(preference: LanguagePreference): Language {
  if (preference !== 'system') {
    return preference
  }

  return navigator.language.toLowerCase().startsWith('id') ? 'id' : 'en'
}

function useResolvedTheme(preference: ThemePreference): ResolvedTheme {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => setSystemTheme(mediaQuery.matches ? 'dark' : 'light')

    mediaQuery.addEventListener('change', listener)

    return () => mediaQuery.removeEventListener('change', listener)
  }, [])

  return preference === 'system' ? systemTheme : preference
}

function paymentStatusLabel(status: string, t: (key: TranslationKey) => string) {
  const labels: Record<string, TranslationKey> = {
    paid: 'paid',
    partial: 'partial',
    refunded: 'refunded',
    unpaid: 'unpaid',
  }

  return labels[status] ? t(labels[status]) : status
}

function stockMovementLabel(type: StockMovement['type'], t: (key: TranslationKey) => string) {
  const labels: Record<StockMovement['type'], TranslationKey> = {
    adjustment: 'adjustment',
    in: 'in',
    out: 'out',
    sale: 'sales',
    sale_void: 'cancelSale',
  }

  return t(labels[type])
}

function roleLabel(role: Role, t: (key: TranslationKey) => string) {
  return t(role)
}

function auditEventLabel(event: string, language: Language) {
  const labels: Record<Language, Record<string, string>> = {
    en: {
      'category.created': 'Category created',
      'category.deleted': 'Category deleted',
      'category.updated': 'Category updated',
      'customer.created': 'Customer created',
      'customer.deleted': 'Customer deleted',
      'customer.updated': 'Customer updated',
      'expense.created': 'Expense created',
      'expense.deleted': 'Expense deleted',
      'expense.updated': 'Expense updated',
      'location.created': 'Location created',
      'location.deactivated': 'Location deactivated',
      'location.updated': 'Location updated',
      'product.created': 'Product created',
      'product.deleted': 'Product deleted',
      'product.imported': 'Products imported',
      'product.updated': 'Product updated',
      'sale.cancelled': 'Transaction cancelled',
      'sale.created': 'Transaction created',
      'sale.refunded': 'Transaction refunded',
      'sale.updated': 'Transaction updated',
      'purchase.created': 'Purchase created',
      'stock.adjustment': 'Stock adjusted',
      'stock.in': 'Stock added',
      'stock.out': 'Stock reduced',
      'stock.sale': 'Stock reduced by sale',
      'stock.sale_void': 'Stock returned after cancellation',
      'store_settings.updated': 'Store settings updated',
      'supplier.created': 'Supplier created',
      'supplier.deleted': 'Supplier deleted',
      'supplier.updated': 'Supplier updated',
      'user.created': 'User created',
      'user.deactivated': 'User deactivated',
      'user.updated': 'User updated',
    },
    id: {
      'category.created': 'Kategori dibuat',
      'category.deleted': 'Kategori dihapus',
      'category.updated': 'Kategori diperbarui',
      'customer.created': 'Pelanggan dibuat',
      'customer.deleted': 'Pelanggan dihapus',
      'customer.updated': 'Pelanggan diperbarui',
      'expense.created': 'Pengeluaran dibuat',
      'expense.deleted': 'Pengeluaran dihapus',
      'expense.updated': 'Pengeluaran diperbarui',
      'location.created': 'Lokasi dibuat',
      'location.deactivated': 'Lokasi dinonaktifkan',
      'location.updated': 'Lokasi diperbarui',
      'product.created': 'Produk dibuat',
      'product.deleted': 'Produk dihapus',
      'product.imported': 'Produk diimport',
      'product.updated': 'Produk diperbarui',
      'sale.cancelled': 'Transaksi dibatalkan',
      'sale.created': 'Transaksi dibuat',
      'sale.refunded': 'Transaksi di-refund',
      'sale.updated': 'Transaksi diperbarui',
      'purchase.created': 'Pembelian dibuat',
      'stock.adjustment': 'Stok disesuaikan',
      'stock.in': 'Stok ditambah',
      'stock.out': 'Stok dikurangi',
      'stock.sale': 'Stok berkurang karena transaksi',
      'stock.sale_void': 'Stok dikembalikan karena transaksi dibatalkan',
      'store_settings.updated': 'Pengaturan toko diperbarui',
      'supplier.created': 'Supplier dibuat',
      'supplier.deleted': 'Supplier dihapus',
      'supplier.updated': 'Supplier diperbarui',
      'user.created': 'Pengguna dibuat',
      'user.deactivated': 'Pengguna dinonaktifkan',
      'user.updated': 'Pengguna diperbarui',
    },
  }

  return labels[language][event] ?? (language === 'id' ? 'Perubahan data' : 'Data changed')
}

function auditTargetLabel(log: AuditLog, language: Language) {
  const type = log.auditable_type?.split('\\').pop()
  const fallback = language === 'id' ? 'Data' : 'Record'
  const labels: Record<Language, Record<string, string>> = {
    en: {
      Category: 'Category',
      Customer: 'Customer',
      Expense: 'Expense',
      Location: 'Location',
      Product: 'Product',
      Purchase: 'Purchase',
      Sale: 'Transaction',
      StockMovement: 'Stock history',
      StoreSetting: 'Store settings',
      Supplier: 'Supplier',
      User: 'User',
    },
    id: {
      Category: 'Kategori',
      Customer: 'Pelanggan',
      Expense: 'Pengeluaran',
      Location: 'Lokasi',
      Product: 'Produk',
      Purchase: 'Pembelian',
      Sale: 'Transaksi',
      StockMovement: 'Riwayat stok',
      StoreSetting: 'Pengaturan toko',
      Supplier: 'Supplier',
      User: 'Pengguna',
    },
  }

  const label = type ? labels[language][type] ?? fallback : fallback

  return log.auditable_id ? `${label} #${log.auditable_id}` : label
}

function reportError(
  error: unknown,
  notify: (type: ToastType, message: string) => void,
  setError?: (message: string) => void,
) {
  const message = apiErrorMessage(error)

  if (setError) {
    setError(message)
  } else {
    notify('error', message)
  }

  return message
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [booting, setBooting] = useState(true)
  const languageMotionReady = useRef(false)
  const themeMotionReady = useRef(false)
  const [themePreference, setThemePreference] = useState<ThemePreference>(() =>
    storedPreference('umkm_opshub_theme', 'system', ['light', 'dark', 'system']),
  )
  const [languagePreference, setLanguagePreference] = useState<LanguagePreference>(() =>
    storedPreference('umkm_opshub_language', 'id', ['id', 'en', 'system']),
  )
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)
  const resolvedTheme = useResolvedTheme(themePreference)
  const language = resolveLanguage(languagePreference)
  const t = useCallback((key: TranslationKey) => copy[language][key] ?? copy.id[key], [language])

  const notify = useCallback((type: ToastType, message: string) => {
    const id = Date.now() * 1000 + toastIdSeed
    toastIdSeed += 1
    setToasts((current) => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts((current) => current.map((toast) => (
        toast.id === id ? { ...toast, leaving: true } : toast
      )))
    }, TOAST_VISIBLE_MS)
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
    }, TOAST_VISIBLE_MS + MOTION_EXIT_MS)
  }, [])

  const confirmAction = useCallback((options: Omit<ConfirmDialogState, 'resolve'>) => {
    return new Promise<boolean>((resolve) => {
      setConfirmDialog({ ...options, resolve })
    })
  }, [])

  const closeConfirm = useCallback(
    (confirmed: boolean) => {
      confirmDialog?.resolve(confirmed)
      setConfirmDialog(null)
    },
    [confirmDialog],
  )

  useEffect(() => {
    localStorage.setItem('umkm_opshub_theme', themePreference)
  }, [themePreference])

  useEffect(() => {
    localStorage.setItem('umkm_opshub_language', languagePreference)
  }, [languagePreference])

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    document.documentElement.lang = language === 'id' ? 'id' : 'en'
  }, [language, resolvedTheme])

  useEffect(() => {
    if (!themeMotionReady.current) {
      themeMotionReady.current = true
      return
    }

    const root = document.documentElement
    root.classList.add('ui-theme-changing')
    const timer = window.setTimeout(() => root.classList.remove('ui-theme-changing'), MOTION_EXIT_MS + 120)

    return () => {
      window.clearTimeout(timer)
      root.classList.remove('ui-theme-changing')
    }
  }, [resolvedTheme])

  useEffect(() => {
    if (!languageMotionReady.current) {
      languageMotionReady.current = true
      return
    }

    const root = document.documentElement
    root.classList.add('ui-language-changing')
    const timer = window.setTimeout(() => root.classList.remove('ui-language-changing'), MOTION_EXIT_MS + 120)

    return () => {
      window.clearTimeout(timer)
      root.classList.remove('ui-language-changing')
    }
  }, [language])

  useEffect(() => {
    const token = getStoredToken()

    if (!token) {
      setBooting(false)
      return
    }

    setAuthToken(token)
    api
      .get<User>('me')
      .then((response) => setUser(response.data))
      .catch(() => {
        clearGetCache()
        setAuthToken(null)
      })
      .finally(() => setBooting(false))
  }, [])

  if (booting) {
    return (
      <AppUiContext.Provider
        value={{
          confirmAction,
          language,
          languagePreference,
          notify,
          resolvedTheme,
          setLanguagePreference,
          setThemePreference,
          t,
          themePreference,
        }}
      >
        <FullScreenStatus text={t('loadingSession')} />
        <ToastStack toasts={toasts} />
        <ConfirmDialog dialog={confirmDialog} onClose={closeConfirm} />
      </AppUiContext.Provider>
    )
  }

  return (
    <AppUiContext.Provider
      value={{
        confirmAction,
        language,
        languagePreference,
        notify,
        resolvedTheme,
        setLanguagePreference,
        setThemePreference,
        t,
        themePreference,
      }}
    >
      <div key={user ? `workspace-${user.id}` : 'login'} className="app-stage-motion">
        {user ? (
          <Shell user={user} onLogout={() => setUser(null)} />
        ) : (
          <LoginPage onAuthenticated={setUser} />
        )}
      </div>
      <ToastStack toasts={toasts} />
      <ConfirmDialog dialog={confirmDialog} onClose={closeConfirm} />
    </AppUiContext.Provider>
  )
}

function FullScreenStatus({ text }: { text: string }) {
  return (
    <main className="feedback-screen grid min-h-screen place-items-center px-6">
      <div className="feedback-loading-card">
        <LoadingInline text={text} />
      </div>
    </main>
  )
}

function LogoutOverlay({ text }: { text: string }) {
  return (
    <div className="logout-overlay" role="status" aria-live="polite">
      <div className="feedback-loading-card logout-loading-card">
        <LoadingInline text={text} />
      </div>
    </div>
  )
}

function BrandLogo({ variant = 'sidebar' }: { variant?: 'login' | 'sidebar' }) {
  const { resolvedTheme } = useAppUi()
  const logoSrc = resolvedTheme === 'dark' ? '/logodark.png' : '/logowhite.png'

  return (
    <span className={classNames('brand-logo-frame', variant === 'login' ? 'brand-logo-login' : 'brand-logo-sidebar')}>
      <img
        alt="UMKM OpsHub"
        className="brand-logo-image"
        key={logoSrc}
        src={logoSrc}
      />
    </span>
  )
}

function LoginPage({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const { notify, t } = useAppUi()
  const [email, setEmail] = useState('admin@umkm.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await api.post<LoginResponse>('login', { email, password })
      clearGetCache()
      setAuthToken(response.data.token)
      notify('success', t('loginSuccess'))
      onAuthenticated(response.data.user)
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="login-page grid min-h-screen place-items-center px-4 py-8 text-slate-950">
      <section className="w-full max-w-md">
        <div className="mb-4 flex flex-col items-center justify-center gap-1">
          <BrandLogo variant="login" />
          <p className="login-tagline">{t('brandTagline')}</p>
        </div>

        <form
          noValidate
          onSubmit={submit}
          className="login-form-open"
        >
          <div className="mb-6 text-center">
            <h1 className="login-title">{t('login')}</h1>
            <p className="login-subtitle mt-2">{t('loginSubtitle')}</p>
          </div>

          <StatusMessage className="mb-4" error={error} />

          <Field label={t('email')}>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </Field>
          <Field label={t('password')}>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </Field>

          <button className="btn-primary login-button mt-4 h-11 w-full" disabled={submitting} type="submit">
            {submitting ? <Spinner /> : <ShieldCheck size={17} />}
            {submitting ? t('processing') : t('login')}
          </button>

          <p className="login-security-note mt-5 flex items-center justify-center gap-2 text-center">
            <ShieldCheck size={14} />
            {t('loginSecurityNote')}
          </p>
        </form>
      </section>
    </main>
  )
}

function Shell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { confirmAction, language, notify, t } = useAppUi()
  const [activeView, setActiveView] = useState<View>('dashboard')
  const [loggingOut, setLoggingOut] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [storeName, setStoreName] = useState('UMKM OpsHub')
  const [openNavGroups, setOpenNavGroups] = useState<string[]>([])
  const mobileMenuRef = useRef<HTMLElement | null>(null)

  async function logout() {
    if (loggingOut) {
      return
    }

    const confirmed = await confirmAction({
      confirmLabel: t('logout'),
      message: t('logoutConfirmMessage'),
      title: t('logoutConfirmTitle'),
    })

    if (!confirmed) {
      return
    }

    setLoggingOut(true)
    setMobileMenuOpen(false)

    try {
      await api.post('logout')
    } finally {
      clearGetCache()
      setAuthToken(null)
      notify('success', t('logoutSuccess'))
      onLogout()
    }
  }

  const isAllowedNavItem = useCallback(
    (item: NavItem) => !item.roles || item.roles.includes(user.role),
    [user.role],
  )
  const allowedItems = navItems.filter(isAllowedNavItem)
  const dashboardItem = navItemByView('dashboard')
  const allowedNavGroups = navGroups
    .map((group) => ({
      ...group,
      navItems: group.items
        .map((view) => navItemByView(view))
        .filter((item): item is NavItem => Boolean(item && isAllowedNavItem(item))),
    }))
    .filter((group) => group.navItems.length > 0)

  useEffect(() => {
    void Promise.allSettled([
      cachedGet<StoreSetting>('store-settings', REFERENCE_GET_TTL_MS).then((settings) => setStoreName(settings.store_name)),
      cachedGet<Category[]>('categories', REFERENCE_GET_TTL_MS),
      cachedGet<Paginated<Product>>('products?per_page=100', REFERENCE_GET_TTL_MS),
      cachedGet<Paginated<Customer>>('customers?per_page=100', REFERENCE_GET_TTL_MS),
      cachedGet<Paginated<Supplier>>('suppliers?per_page=100', REFERENCE_GET_TTL_MS),
    ])
    void import('./charts')
  }, [])

  useEffect(() => {
    const updateStoreName = (event: Event) => {
      const customEvent = event as CustomEvent<string>
      if (customEvent.detail) {
        setStoreName(customEvent.detail)
      }
    }

    window.addEventListener('opshub-store-name-updated', updateStoreName)

    return () => window.removeEventListener('opshub-store-name-updated', updateStoreName)
  }, [])

  function openView(view: View) {
    setActiveView(view)
    setMobileMenuOpen(false)
  }

  function toggleNavGroup(groupKey: string) {
    setOpenNavGroups((current) => (
      current.includes(groupKey)
        ? current.filter((item) => item !== groupKey)
        : [...current, groupKey]
    ))
  }

  useEffect(() => {
    const groupKey = navGroupForView(activeView)

    if (!groupKey) {
      return
    }

    setOpenNavGroups((current) => (current.includes(groupKey) ? current : [...current, groupKey]))
  }, [activeView])

  useEffect(() => {
    if (!mobileMenuOpen) {
      return
    }

    const scrollY = window.scrollY
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false)
      }
    }

    mobileMenuRef.current?.scrollTo({ top: 0 })
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      window.scrollTo(0, scrollY)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobileMenuOpen])

  const mobileMenu = (
    <div
      className={classNames('app-mobile-menu-backdrop', mobileMenuOpen && 'app-mobile-menu-backdrop-open')}
      onClick={() => setMobileMenuOpen(false)}
    >
      <aside
        aria-label={t('menu')}
        aria-modal="true"
        aria-hidden={!mobileMenuOpen}
        className="app-mobile-menu"
        ref={mobileMenuRef}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="app-mobile-menu-head">
          <BrandLogo />
          <button
            aria-label={t('close')}
            className="icon-button"
            type="button"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X size={17} />
          </button>
        </div>
        <nav className="app-mobile-menu-list" aria-label={t('menu')}>
          {dashboardItem && isAllowedNavItem(dashboardItem) ? (
            <button
              className={classNames(
                'app-mobile-menu-item',
                activeView === dashboardItem.key && 'app-mobile-menu-item-active',
              )}
              type="button"
              onClick={() => openView(dashboardItem.key)}
            >
              <dashboardItem.icon size={18} />
              <span>{t(dashboardItem.labelKey)}</span>
            </button>
          ) : null}
          {allowedNavGroups.map((group) => {
            const isOpen = openNavGroups.includes(group.key)
            const hasActiveItem = group.navItems.some((item) => item.key === activeView)

            return (
              <div className="nav-group mobile-nav-group" key={group.key}>
                <button
                  aria-expanded={isOpen}
                  className={classNames('nav-group-trigger', hasActiveItem && 'nav-group-trigger-active')}
                  type="button"
                  onClick={() => toggleNavGroup(group.key)}
                >
                  <span>
                    <group.icon size={16} />
                    {t(group.labelKey)}
                  </span>
                  <ChevronDown className={classNames('nav-group-chevron', isOpen && 'nav-group-chevron-open')} size={16} />
                </button>
                <div className={classNames('nav-group-items', isOpen && 'nav-group-items-open')} aria-hidden={!isOpen}>
                  {group.navItems.map((item) => (
                    <button
                      className={classNames(
                        'app-mobile-menu-item app-mobile-menu-item-nested',
                        activeView === item.key && 'app-mobile-menu-item-active',
                      )}
                      key={item.key}
                      tabIndex={isOpen ? 0 : -1}
                      type="button"
                      onClick={() => openView(item.key)}
                    >
                      <item.icon size={16} />
                      <span>{t(item.labelKey)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
        <button className="btn-secondary app-mobile-menu-logout" disabled={loggingOut} type="button" onClick={logout}>
          {loggingOut ? <Spinner size={17} /> : <LogOut size={17} />}
          {loggingOut ? t('loggingOut') : t('logout')}
        </button>
      </aside>
    </div>
  )

  return (
    <div className="app-shell min-h-screen text-slate-900">
      <aside className="app-sidebar fixed inset-y-0 left-0 hidden w-64 border-r xl:flex">
        <div className="app-sidebar-brand flex h-16 flex-col items-center justify-center border-b px-5">
          <BrandLogo />
          <span className="sidebar-store-name">{storeName}</span>
        </div>
        <nav className="app-sidebar-nav" aria-label={t('menu')}>
          {dashboardItem && isAllowedNavItem(dashboardItem) ? (
            <button
              className={classNames(
                'nav-button nav-button-top',
                activeView === dashboardItem.key && 'nav-button-active',
              )}
              type="button"
              onClick={() => openView(dashboardItem.key)}
            >
              <dashboardItem.icon size={18} />
              {t(dashboardItem.labelKey)}
            </button>
          ) : null}
          {allowedNavGroups.map((group) => {
            const isOpen = openNavGroups.includes(group.key)
            const hasActiveItem = group.navItems.some((item) => item.key === activeView)

            return (
              <div className="nav-group" key={group.key}>
                <button
                  aria-expanded={isOpen}
                  className={classNames('nav-group-trigger', hasActiveItem && 'nav-group-trigger-active')}
                  type="button"
                  onClick={() => toggleNavGroup(group.key)}
                >
                  <span>
                    <group.icon size={16} />
                    {t(group.labelKey)}
                  </span>
                  <ChevronDown className={classNames('nav-group-chevron', isOpen && 'nav-group-chevron-open')} size={16} />
                </button>
                <div className={classNames('nav-group-items', isOpen && 'nav-group-items-open')} aria-hidden={!isOpen}>
                  {group.navItems.map((item) => (
                    <button
                      className={classNames(
                        'nav-button nav-button-nested',
                        activeView === item.key && 'nav-button-active',
                      )}
                      key={item.key}
                      tabIndex={isOpen ? 0 : -1}
                      type="button"
                      onClick={() => openView(item.key)}
                    >
                      <item.icon size={16} />
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      <div className="app-content-shell xl:pl-64">
        <header className="app-header sticky top-0 z-10 border-b px-4 py-3 backdrop-blur xl:px-6">
          <div className="app-header-layout flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="app-header-titlebar">
              <button
                aria-expanded={mobileMenuOpen}
                aria-label={t('menu')}
                className={classNames('icon-button app-menu-toggle', mobileMenuOpen && 'app-menu-toggle-open')}
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
              <div key={`${activeView}-${language}`} className="app-title-motion min-w-0">
                <h1 className="app-page-title">{pageTitle(activeView, t)}</h1>
                <p className="app-page-meta">
                  <span className="app-store-meta"><Building2 size={13} /> {storeName}</span>
                  <span>{user.name} · {roleLabel(user.role, t)}</span>
                </p>
              </div>
            </div>
            <div className="app-header-actions flex flex-wrap items-center gap-2">
              <div className="app-mobile-nav flex gap-1 overflow-x-auto xl:hidden">
                {allowedItems.map((item) => (
                  <button
                    key={item.key}
                    className={classNames(
                      'icon-tab',
                      activeView === item.key && 'icon-tab-active',
                    )}
                    aria-label={t(item.labelKey)}
                    type="button"
                    onClick={() => openView(item.key)}
                  >
                    <item.icon size={17} />
                  </button>
                ))}
              </div>
              <button className="btn-secondary app-logout-button" disabled={loggingOut} type="button" onClick={logout}>
                {loggingOut ? <Spinner size={17} /> : <LogOut size={17} />}
                {loggingOut ? t('loggingOut') : t('logout')}
              </button>
            </div>
          </div>
        </header>
        {createPortal(mobileMenu, document.body)}

        <main className="app-main px-4 py-5 lg:px-6">
          <div key={`${activeView}-${language}`} className="app-view-frame">
            {activeView === 'dashboard' ? <DashboardPage /> : null}
            {activeView === 'products' ? <ProductsPage /> : null}
            {activeView === 'categories' ? <CategoriesPage /> : null}
            {activeView === 'stock' ? <StockPage /> : null}
            {activeView === 'sales' ? <SalesPage invoiceMode={false} /> : null}
            {activeView === 'customers' ? <CustomersPage /> : null}
            {activeView === 'invoices' ? <SalesPage invoiceMode /> : null}
            {activeView === 'purchases' ? <PurchasesPage /> : null}
            {activeView === 'suppliers' ? <SuppliersPage /> : null}
            {activeView === 'expenses' ? <ExpensesPage /> : null}
            {activeView === 'reports' ? <ReportsPage /> : null}
            {activeView === 'profit' ? <ProfitPage /> : null}
            {activeView === 'lowStockAlerts' ? <LowStockPage /> : null}
            {activeView === 'locations' ? <LocationsPage /> : null}
            {activeView === 'audit' ? <AuditPage /> : null}
            {activeView === 'users' ? <UsersPage /> : null}
            {activeView === 'settings' ? <SettingsPage /> : null}
          </div>
        </main>
      </div>
      {loggingOut ? <LogoutOverlay text={t('loggingOut')} /> : null}
    </div>
  )
}

function pageTitle(view: View, t: (key: TranslationKey) => string) {
  const item = navItems.find((item) => item.key === view)
  return item ? t(item.labelKey) : t('dashboard')
}

function Section({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="content-section space-y-4">
      <div className="section-heading">
        <h2 className="section-title">{title}</h2>
        {actions ? <div className="section-actions">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

function Field({ label, children, compact = false }: { label: string; children: ReactNode; compact?: boolean }) {
  return (
    <label className={classNames(compact ? 'field-compact' : 'mb-3 block')}>
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}

function SearchField({
  onChange,
  placeholder,
  value,
}: {
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  const { t } = useAppUi()
  const [focused, setFocused] = useState(false)
  const showPlaceholder = !value && !focused
  const longPlaceholder = placeholder.length > 22

  return (
    <div className={classNames('search-control', showPlaceholder && 'search-control-empty')}>
      <Search className="search-input-icon" size={17} />
      <input
        aria-label={placeholder}
        autoComplete="off"
        className="input search-input"
        placeholder=""
        value={value}
        onBlur={() => setFocused(false)}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
      />
      {showPlaceholder ? (
        <span className={classNames('search-placeholder-marquee', longPlaceholder && 'search-placeholder-marquee-long')}>
          <span>{placeholder}</span>
        </span>
      ) : null}
      {value ? (
        <button
          aria-label={t('clearSearch')}
          className="search-clear-button"
          title={t('clearSearch')}
          type="button"
          onClick={() => onChange('')}
        >
          <X size={15} />
        </button>
      ) : null}
    </div>
  )
}

function ActionMenu({ children, compact = false, label }: { children: ReactNode; compact?: boolean; label: string }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const closeOnOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', closeOnOutside)
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.removeEventListener('mousedown', closeOnOutside)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return (
    <div ref={menuRef} className={classNames('action-menu', compact && 'action-menu-compact')}>
      <button
        aria-label={label}
        aria-expanded={open}
        className={classNames(compact ? 'icon-button action-menu-icon-trigger' : 'btn-secondary action-menu-trigger')}
        title={label}
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={17} />
        {compact ? null : label}
      </button>
      {open ? (
        <div
          className="action-menu-popover"
          style={{
            height: 'min(166px, calc(100dvh - 170px))',
            maxHeight: 'min(166px, calc(100dvh - 170px))',
            overflow: 'hidden',
            width: 'min(280px, calc(100vw - 40px))',
          }}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('.action-menu-item')) {
              window.setTimeout(() => setOpen(false), 0)
            }
          }}
        >
          <div
            className="action-menu-scroll"
            style={{
              height: 'min(142px, calc(100dvh - 194px))',
              maxHeight: 'min(142px, calc(100dvh - 194px))',
              overflowY: 'auto',
            }}
          >
            {children}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function DateRangeMenu({
  children,
  dateFrom,
  dateTo,
  onApply,
  onDateFromChange,
  onDateToChange,
}: {
  children: ReactNode
  dateFrom: string
  dateTo: string
  onApply?: () => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}) {
  const { t } = useAppUi()

  return (
    <ActionMenu label={t('filterAndExport')}>
      <div className="action-menu-fields">
        <Field compact label={t('dateFrom')}>
          <input className="input date-input" type="date" value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} />
        </Field>
        <Field compact label={t('dateTo')}>
          <input className="input date-input" type="date" value={dateTo} onChange={(event) => onDateToChange(event.target.value)} />
        </Field>
      </div>
      {onApply ? (
        <button className="action-menu-item" type="button" onClick={onApply}>
          <BarChart3 size={17} />
          {t('applyFilter')}
        </button>
      ) : null}
      {children}
    </ActionMenu>
  )
}

function StatusMessage({ className, error, success }: { className?: string; error?: string; success?: string }) {
  const messageType = error ? 'error' : success ? 'success' : null
  const message = error ?? success ?? ''
  const [visibleMessage, setVisibleMessage] = useState<{
    message: string
    type: 'error' | 'success'
  } | null>(() => (messageType && message ? { message, type: messageType } : null))
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!messageType || !message) {
      return
    }

    setLeaving(false)
    setVisibleMessage({ message, type: messageType })
  }, [message, messageType])

  useEffect(() => {
    if (messageType || !visibleMessage) {
      return
    }

    setLeaving(true)
    const timer = window.setTimeout(() => setVisibleMessage(null), MOTION_EXIT_MS)

    return () => window.clearTimeout(timer)
  }, [messageType, visibleMessage])

  if (!visibleMessage) {
    return null
  }

  const Icon = visibleMessage.type === 'error' ? XCircle : CheckCircle2

  return (
    <div
      className={classNames(
        'feedback-message',
        visibleMessage.type === 'error' ? 'feedback-message-error' : 'feedback-message-success',
        leaving && 'feedback-message-leaving',
        className,
      )}
      role={visibleMessage.type === 'error' ? 'alert' : 'status'}
    >
      <span className="feedback-icon">
        <Icon size={17} />
      </span>
      <span>{visibleMessage.message}</span>
    </div>
  )
}

function BackToListButton({ onClick }: { onClick: () => void }) {
  const { t } = useAppUi()

  return (
    <button className="btn-secondary" type="button" onClick={onClick}>
      <X size={17} />
      {t('backToList')}
    </button>
  )
}

function Spinner({ size = 16 }: { size?: number }) {
  return <LoaderCircle aria-hidden="true" className="spinner" size={size} />
}

function LoadingInline({ text }: { text: string }) {
  return (
    <div className="loading-inline" role="status">
      <Spinner />
      <span>{text}</span>
    </div>
  )
}

function PaginationControls({
  loading,
  meta,
  onPageChange,
}: {
  loading?: boolean
  meta: PaginationInfo
  onPageChange: (page: number) => void
}) {
  const { language, t } = useAppUi()

  if (meta.total === 0) {
    return null
  }

  return (
    <div className="pagination-bar">
      <p>{formatPaginationSummary(meta, language)}</p>
      <div className="pagination-actions">
        <button
          className="btn-secondary pagination-button"
          disabled={loading || meta.currentPage <= 1}
          type="button"
          onClick={() => onPageChange(Math.max(1, meta.currentPage - 1))}
        >
          {t('previousPage')}
        </button>
        <span className="pagination-page">
          {meta.currentPage}/{meta.lastPage}
        </span>
        <button
          className="btn-secondary pagination-button"
          disabled={loading || meta.currentPage >= meta.lastPage}
          type="button"
          onClick={() => onPageChange(Math.min(meta.lastPage, meta.currentPage + 1))}
        >
          {t('nextPage')}
        </button>
      </div>
    </div>
  )
}

function SkeletonText({ className = 'h-3 w-24' }: { className?: string }) {
  return <span className={classNames('skeleton-line', className)} />
}

function TableSkeletonRows({ columns, rows = 5 }: { columns: number; rows?: number }) {
  const widths = ['w-40', 'w-28', 'w-24', 'w-20', 'w-32', 'w-16']

  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr className="responsive-row skeleton-row" key={rowIndex}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <td key={columnIndex}>
              <SkeletonText className={classNames('h-3', widths[columnIndex % widths.length])} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function TableEmptyState({ columns, message }: { columns: number; message: string }) {
  return (
    <tr className="responsive-row table-empty-row">
      <td colSpan={columns}>
        <div className="table-empty-state">
          <Info size={18} />
          <span>{message}</span>
        </div>
      </td>
    </tr>
  )
}

function emptyMessage(search: string, fallback: string, t: (key: TranslationKey) => string) {
  return search.trim() ? t('emptySearch') : fallback
}

function KpiSkeletonGrid() {
  return (
    <div className="dashboard-metrics">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="metric-card">
          <div className="mb-4 flex items-center justify-between">
            <SkeletonText className="h-3 w-24" />
            <span className="skeleton-block h-10 w-10 rounded-full" />
          </div>
          <SkeletonText className="h-7 w-28" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex h-[260px] items-end gap-3 px-2">
        {['h-24', 'h-40', 'h-32', 'h-52', 'h-36', 'h-48', 'h-28'].map((height) => (
          <span key={height} className={classNames('skeleton-block flex-1', height)} />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-3 px-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonText key={index} className="h-2 w-full" />
        ))}
      </div>
    </div>
  )
}

function ToastStack({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="feedback-toast-stack">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={classNames(
            'feedback-toast',
            `feedback-toast-${toast.type}`,
            toast.leaving && 'feedback-toast-leaving',
          )}
          role={toast.type === 'error' ? 'alert' : 'status'}
        >
          <span className="feedback-icon">
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : null}
            {toast.type === 'error' ? <XCircle size={18} /> : null}
            {toast.type === 'info' ? <Info size={18} /> : null}
          </span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}

function ConfirmDialog({
  dialog,
  onClose,
}: {
  dialog: ConfirmDialogState | null
  onClose: (confirmed: boolean) => void
}) {
  const { t } = useAppUi()
  const [visibleDialog, setVisibleDialog] = useState<ConfirmDialogState | null>(dialog)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!dialog) {
      return
    }

    setClosing(false)
    setVisibleDialog(dialog)
  }, [dialog])

  useEffect(() => {
    if (dialog || !visibleDialog) {
      return
    }

    setClosing(true)
    const timer = window.setTimeout(() => setVisibleDialog(null), MOTION_EXIT_MS)

    return () => window.clearTimeout(timer)
  }, [dialog, visibleDialog])

  useEffect(() => {
    if (!visibleDialog || closing) {
      return
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose(false)
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [closing, onClose, visibleDialog])

  if (!visibleDialog) {
    return null
  }

  return (
    <div
      className={classNames('feedback-modal-backdrop', closing && 'feedback-modal-backdrop-closing')}
      onClick={() => onClose(false)}
    >
      <div
        aria-modal="true"
        className={classNames('feedback-modal', closing && 'feedback-modal-closing')}
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={classNames('feedback-modal-mark', visibleDialog.intent === 'danger' && 'feedback-modal-mark-danger')}>
          {visibleDialog.intent === 'danger' ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
        </div>
        <h2 className="feedback-modal-title">{visibleDialog.title}</h2>
        <p className="feedback-modal-copy">{visibleDialog.message}</p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn-secondary" type="button" onClick={() => onClose(false)}>
            {visibleDialog.cancelLabel ?? t('cancel')}
          </button>
          <button
            className={visibleDialog.intent === 'danger' ? 'btn-danger' : 'btn-primary'}
            type="button"
            onClick={() => onClose(true)}
          >
            {visibleDialog.confirmLabel ?? t('confirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

function DashboardPage() {
  const { language, notify, t } = useAppUi()
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    cachedGet<DashboardData>('dashboard')
      .then((data) => setData(data))
      .catch((error) => reportError(error, notify, setError))
  }, [notify])

  if (!data && error) {
    return <StatusMessage error={error} />
  }

  if (!data) {
    return (
      <Section title={t('summary30Days')}>
        <KpiSkeletonGrid />
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <ChartPanel className="dashboard-panel" title={t('dailyRevenue')}>
            <ChartSkeleton />
          </ChartPanel>
          <ChartPanel className="dashboard-panel" title={t('topProducts')}>
            <ChartSkeleton />
          </ChartPanel>
        </div>
        <DataPanel className="dashboard-panel" title={t('lowStock')}>
          <div className="mb-3">
            <LoadingInline text={t('loadingDashboard')} />
          </div>
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('product')}</th>
                  <th>{t('category')}</th>
                  <th>{t('stock')}</th>
                  <th>{t('minimum')}</th>
                </tr>
              </thead>
              <tbody>
                <TableSkeletonRows columns={5} />
              </tbody>
            </table>
          </div>
        </DataPanel>
      </Section>
    )
  }

  return (
    <Section title={t('summary30Days')}>
      <div className="dashboard-metrics">
        <KpiCard icon={WalletCards} label={t('revenue')} value={currency(data.cards.revenue, language)} tone="brand" />
        <KpiCard icon={ShoppingCart} label={t('sales')} value={data.cards.transactions.toString()} tone="blue" />
        <KpiCard icon={Users} label={t('activeCustomers')} value={data.cards.active_customers.toString()} tone="amber" />
        <KpiCard icon={AlertTriangle} label={t('lowStock')} value={data.cards.low_stock_products.toString()} tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ChartPanel className="dashboard-panel" title={t('dailyRevenue')}>
          <Suspense fallback={<ChartSkeleton />}>
            <RevenueChart data={data.revenue_by_day} language={language} />
          </Suspense>
        </ChartPanel>
        <ChartPanel className="dashboard-panel" title={t('topProducts')}>
          <Suspense fallback={<ChartSkeleton />}>
            <TopProductsChart data={data.top_products} />
          </Suspense>
        </ChartPanel>
      </div>

      <DataPanel className="dashboard-panel" title={t('lowStock')}>
        <div className="table-wrap">
          <table className="data-table responsive-table">
            <thead>
              <tr>
                <th className="number-cell">{t('rowNumber')}</th>
                <th>{t('product')}</th>
                <th>{t('category')}</th>
                <th>{t('stock')}</th>
                <th>{t('minimum')}</th>
              </tr>
            </thead>
            <tbody>
              {data.low_stock_products.length ? data.low_stock_products.map((product, index) => (
                <tr className="responsive-row" key={product.id}>
                  <td className="number-cell" data-label={t('rowNumber')}>{index + 1}</td>
                  <td data-label={t('product')}>
                    <div className="product-table-item">
                      <ProductAvatar product={product} size="sm" />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td data-label={t('category')}>{product.category?.name}</td>
                  <td data-label={t('stock')}>{product.stock}</td>
                  <td data-label={t('minimum')}>{product.min_stock}</td>
                </tr>
              )) : (
                <TableEmptyState columns={5} message={t('noLowStock')} />
              )}
            </tbody>
          </table>
        </div>
      </DataPanel>
    </Section>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: 'brand' | 'blue' | 'amber' | 'red'
}) {
  const toneClass = {
    amber: 'bg-amber-50 text-amber-700',
    brand: 'bg-blue-50 text-blue-700',
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
  }[tone]

  return (
    <div className="metric-card">
      <div className="mb-4 flex items-center justify-between">
        <span className="metric-label">{label}</span>
        <span className={classNames('metric-icon', toneClass)}>
          <Icon size={18} />
        </span>
      </div>
      <p className="metric-value">{value}</p>
    </div>
  )
}

function ChartPanel({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={classNames('surface-panel p-4', className)}>
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </div>
  )
}

function DataPanel({
  actions,
  children,
  className,
  title,
}: {
  actions?: ReactNode
  children: ReactNode
  className?: string
  title: string
}) {
  return (
    <div className={classNames('surface-panel p-4', className)}>
      <div className="panel-header">
        <h3 className="panel-title">{title}</h3>
        {actions ? <div className="panel-actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}

type ProductForm = {
  category_id: string
  sku: string
  name: string
  description: string
  image: File | null
  image_url: string
  unit: string
  purchase_price: string
  selling_price: string
  stock: string
  min_stock: string
  remove_image: boolean
  is_active: boolean
}

const emptyProductForm: ProductForm = {
  category_id: '',
  description: '',
  image: null,
  image_url: '',
  is_active: true,
  min_stock: '5',
  name: '',
  purchase_price: '0',
  remove_image: false,
  selling_price: '0',
  sku: '',
  stock: '0',
  unit: 'pcs',
}

function productFormData(form: ProductForm, fallbackCategoryId?: number) {
  const payload = new FormData()

  payload.append('category_id', String(form.category_id || fallbackCategoryId || ''))
  payload.append('description', form.description)
  payload.append('is_active', form.is_active ? '1' : '0')
  payload.append('min_stock', String(Number(form.min_stock)))
  payload.append('name', form.name)
  payload.append('purchase_price', String(toNumber(form.purchase_price)))
  payload.append('selling_price', String(toNumber(form.selling_price)))
  payload.append('sku', form.sku)
  payload.append('stock', String(Number(form.stock)))
  payload.append('unit', form.unit)

  if (form.image) {
    payload.append('image', form.image)
  }

  if (form.remove_image) {
    payload.append('remove_image', '1')
  }

  return payload
}

function ProductAvatar({ product, size = 'md' }: { product?: Product | null; size?: 'sm' | 'md' }) {
  const { t } = useAppUi()

  return (
    <div className={classNames('product-avatar', size === 'sm' && 'product-avatar-sm')}>
      {product?.image_url ? (
        <img src={product.image_url} alt={`${t('productPhoto')} ${product.name}`} loading="lazy" />
      ) : (
        <Package size={size === 'sm' ? 16 : 18} />
      )}
    </div>
  )
}

function ProductsPage() {
  const { language, notify, t } = useAppUi()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<ProductForm>(emptyProductForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [lowOnly, setLowOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<Product>([], 1))
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formMode, setFormMode] = useState(false)
  const importInputRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(LIST_PAGE_SIZE))
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (lowOnly) params.set('low_stock', '1')
    const productsPath = `products?${params.toString()}`
    const categoriesPath = 'categories'
    setLoading(shouldShowLoading([productsPath, categoriesPath]))

    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        cachedGet<Paginated<Product>>(productsPath),
        cachedGet<Category[]>(categoriesPath, REFERENCE_GET_TTL_MS),
      ])

      setProducts(listData(productsResponse))
      setPagination(paginationInfo(productsResponse, page))
      setCategories(categoriesResponse)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, lowOnly, page])

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [load, notify])

  useEffect(() => {
    if (!form.image) {
      setImagePreview(form.image_url)
      return
    }

    const previewUrl = URL.createObjectURL(form.image)
    setImagePreview(previewUrl)

    return () => URL.revokeObjectURL(previewUrl)
  }, [form.image, form.image_url])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = productFormData(form, categories[0]?.id)
    const config = { headers: { 'Content-Type': 'multipart/form-data' } }

    try {
      if (editingId) {
        await api.post(`products/${editingId}`, payload, config)
        clearGetCache()
        notify('success', t('productUpdated'))
      } else {
        await api.post('products', payload, config)
        clearGetCache()
        notify('success', t('productCreated'))
      }
      setForm(emptyProductForm)
      setEditingId(null)
      await load()
      setFormMode(false)
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(product: Product): Promise<boolean> {
    try {
      await api.delete(`products/${product.id}`)
      clearGetCache()
      await load()
      return true
    } catch (error) {
      if (isNotFoundError(error)) {
        await load()
        notify('info', t('deleteStale'))
        return false
      }

      throw error
    }
  }

  async function importProducts(file: File | null) {
    if (!file) {
      return
    }

    setError('')
    const payload = new FormData()
    payload.append('file', file)

    try {
      await api.post('imports/products', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      clearGetCache()
      notify('success', t('importDone'))
      setPage(1)
      await load()
    } catch (error) {
      reportError(error, notify, setError)
    }
  }

  return (
    <Section
      title={formMode ? (editingId ? t('editProduct') : t('newProduct')) : t('productManagement')}
      actions={
        formMode ? (
          <BackToListButton
            onClick={() => {
              setEditingId(null)
              setForm(emptyProductForm)
              setFormMode(false)
            }}
          />
        ) : (
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(emptyProductForm)
              setFormMode(true)
            }}
          >
            <Plus size={17} />
            {t('newProduct')}
          </button>
        )
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode ? (
        <DataPanel title={editingId ? t('editProduct') : t('newProduct')}>
          <form noValidate onSubmit={submit}>
            <Field label={t('category')}>
              <select
                className="input"
                value={form.category_id}
                onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                required
              >
                <option value="">{t('chooseCategory')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('productPhoto')}>
              <div className="product-photo-field">
                <div className="product-photo-preview">
                  {imagePreview ? (
                    <img src={imagePreview} alt={t('productPhoto')} />
                  ) : (
                    <div className="product-photo-placeholder">
                      <Package size={24} />
                      <span>{t('noProductPhoto')}</span>
                    </div>
                  )}
                </div>
                <div className="product-photo-controls">
                  <label className="btn-secondary product-photo-upload">
                    <ImagePlus size={17} />
                    {imagePreview ? t('changeProductPhoto') : t('chooseProductPhoto')}
                    <input
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        if (file) {
                          setForm({ ...form, image: file, remove_image: false })
                        }
                        event.target.value = ''
                      }}
                    />
                  </label>
                  {imagePreview ? (
                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => setForm({ ...form, image: null, image_url: '', remove_image: true })}
                    >
                      <X size={17} />
                      {t('removeProductPhoto')}
                    </button>
                  ) : null}
                  <p>{t('productPhotoHelp')}</p>
                </div>
              </div>
            </Field>
            <Field label="SKU">
              <input className="input" value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required />
            </Field>
            <Field label={t('productName')}>
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('unit')}>
                <input className="input" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} required />
              </Field>
              <Field label={t('minStock')}>
                <input className="input" min="0" type="number" value={form.min_stock} onChange={(event) => setForm({ ...form, min_stock: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('purchasePrice')}>
                <input className="input" inputMode="numeric" value={moneyInputValue(form.purchase_price)} onChange={(event) => setForm({ ...form, purchase_price: normalizeMoneyInput(event.target.value) })} />
              </Field>
              <Field label={t('sellingPrice')}>
                <input className="input" inputMode="numeric" value={moneyInputValue(form.selling_price)} onChange={(event) => setForm({ ...form, selling_price: normalizeMoneyInput(event.target.value) })} />
              </Field>
            </div>
            <Field label={t('stock')}>
              <input className="input" min="0" type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
            </Field>
            <Field label={t('description')}>
              <textarea className="input min-h-20" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input checked={form.is_active} type="checkbox" onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
              {t('active')}
            </label>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Save size={17} />}
                {submitting ? t('saving') : t('save')}
              </button>
              {editingId ? (
                <button className="btn-secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyProductForm); setFormMode(false) }}>
                  <X size={17} />
                  {t('cancel')}
                </button>
              ) : null}
            </div>
          </form>
        </DataPanel>
      ) : (
        <DataPanel
          title={t('productList')}
          actions={
            <div className="panel-toolbar">
              <SearchField
                placeholder={t('searchProduct')}
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setPage(1)
                }}
              />
              <ActionMenu label={t('productTools')}>
                <button className="action-menu-item" type="button" onClick={() => { setPage(1); setLowOnly((value) => !value) }}>
                  <AlertTriangle size={17} />
                  {lowOnly ? t('hideLowStock') : t('showLowStock')}
                </button>
                <button
                  className="action-menu-item"
                  type="button"
                  onClick={() => void downloadBlob('exports/products', exportFilename('products', language), language).catch((error) => reportError(error, notify, setError))}
                >
                  <Download size={17} />
                  {t('exportCsv')}
                </button>
                <button className="action-menu-item" type="button" onClick={() => importInputRef.current?.click()}>
                  <Upload size={17} />
                  {t('importProducts')}
                </button>
              </ActionMenu>
              <input
                ref={importInputRef}
                accept=".csv,text/csv"
                className="sr-only"
                type="file"
                onChange={(event) => {
                  void importProducts(event.target.files?.[0] ?? null)
                  event.target.value = ''
                }}
              />
            </div>
          }
        >
          {loading ? (
            <div className="mb-3">
              <LoadingInline text={t('loadingList')} />
            </div>
          ) : null}
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('product')}</th>
                  <th>{t('category')}</th>
                  <th>{t('price')}</th>
                  <th>{t('stock')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={7} />
                ) : products.length ? products.map((product, index) => (
                  <tr className="responsive-row" key={product.id}>
                    <td className="number-cell" data-label={t('rowNumber')}>{pagination.from + index}</td>
                    <td data-label={t('product')}>
                      <div className="product-table-item">
                        <ProductAvatar product={product} />
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-slate-500">{product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label={t('category')}>{product.category?.name}</td>
                    <td data-label={t('price')}>{currency(product.selling_price, language)}</td>
                    <td data-label={t('stock')}>
                      <span className={product.is_low_stock ? 'badge-red' : 'badge-green'}>
                        {product.stock} {product.unit}
                      </span>
                    </td>
                    <td data-label={t('status')}>{product.is_active ? t('active') : t('inactive')}</td>
                    <td className="actions-cell" data-label={t('actions')}>
                      <RowActions
                        onEdit={() => {
                          setEditingId(product.id)
                          setForm({
                            category_id: String(product.category_id),
                            description: product.description ?? '',
                            image: null,
                            image_url: product.image_url ?? '',
                            is_active: product.is_active,
                            min_stock: String(product.min_stock),
                            name: product.name,
                            purchase_price: apiMoneyToInput(product.purchase_price),
                            remove_image: false,
                            selling_price: apiMoneyToInput(product.selling_price),
                            sku: product.sku,
                            stock: String(product.stock),
                            unit: product.unit,
                          })
                          setFormMode(true)
                        }}
                        itemName={product.name}
                        successMessage={t('productDeleted')}
                        onRemove={() => remove(product)}
                      />
                    </td>
                  </tr>
                )) : (
                  <TableEmptyState
                    columns={7}
                    message={debouncedSearch ? (lowOnly ? t('emptyLowStockSearch') : t('emptySearch')) : (lowOnly ? t('noLowStock') : t('noProducts'))}
                  />
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
        </DataPanel>
      )}
    </Section>
  )
}

function CategoriesPage() {
  const { notify, t } = useAppUi()
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formMode, setFormMode] = useState(false)
  const filteredCategories = useMemo(
    () => categories.filter((category) => textMatchesSearch(debouncedSearch, [
      category.name,
      category.description,
      category.products_count,
    ])),
    [categories, debouncedSearch],
  )
  const pagedCategories = clientPage(filteredCategories, page)

  async function load() {
    setLoading(shouldShowLoading(['categories']))
    try {
      const response = await cachedGet<Category[]>('categories', REFERENCE_GET_TTL_MS)
      setCategories(response)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [notify])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const payload = { description, is_active: true, name }

    try {
      if (editingId) {
        await api.put(`categories/${editingId}`, payload)
        clearGetCache()
        notify('success', t('categoryUpdated'))
      } else {
        await api.post('categories', payload)
        clearGetCache()
        notify('success', t('categoryCreated'))
      }
      setEditingId(null)
      setName('')
      setDescription('')
      await load()
      setFormMode(false)
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section
      title={formMode ? (editingId ? t('editCategory') : t('newCategory')) : t('categoryManagement')}
      actions={
        formMode ? (
          <BackToListButton
            onClick={() => {
              setEditingId(null)
              setName('')
              setDescription('')
              setFormMode(false)
            }}
          />
        ) : (
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setEditingId(null)
              setName('')
              setDescription('')
              setFormMode(true)
            }}
          >
            <Plus size={17} />
            {t('newCategory')}
          </button>
        )
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode ? (
        <DataPanel title={editingId ? t('editCategory') : t('newCategory')}>
          <form noValidate onSubmit={submit}>
            <Field label={t('categoryName')}>
              <input className="input" value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label={t('description')}>
              <textarea className="input min-h-24" value={description} onChange={(event) => setDescription(event.target.value)} />
            </Field>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Save size={17} />}
                {submitting ? t('saving') : t('save')}
              </button>
              <button className="btn-secondary" type="button" onClick={() => { setEditingId(null); setName(''); setDescription(''); setFormMode(false) }}>
                <X size={17} />
                {t('cancel')}
              </button>
            </div>
          </form>
        </DataPanel>
      ) : (
        <DataPanel
          title={t('categoryList')}
          actions={
            <div className="panel-toolbar">
              <SearchField
                placeholder={t('searchCategory')}
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setPage(1)
                }}
              />
            </div>
          }
        >
          {loading ? (
            <div className="mb-3">
              <LoadingInline text={t('loadingList')} />
            </div>
          ) : null}
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('name')}</th>
                  <th>{t('description')}</th>
                  <th>{t('products')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={5} />
                ) : pagedCategories.items.length ? pagedCategories.items.map((category, index) => (
                  <tr className="responsive-row" key={category.id}>
                    <td className="number-cell" data-label={t('rowNumber')}>{pagedCategories.meta.from + index}</td>
                    <td data-label={t('name')}>{category.name}</td>
                    <td data-label={t('description')}>{category.description}</td>
                    <td data-label={t('products')}>{category.products_count ?? 0}</td>
                    <td className="actions-cell" data-label={t('actions')}>
                      <RowActions
                        onEdit={() => {
                          setEditingId(category.id)
                          setName(category.name)
                          setDescription(category.description ?? '')
                          setFormMode(true)
                        }}
                        itemName={category.name}
                        successMessage={t('categoryDeleted')}
                        onRemove={async () => {
                          if ((category.products_count ?? 0) > 0) {
                            notify('info', t('categoryDeleteBlocked'))
                            return false
                          }

                          await api.delete(`categories/${category.id}`)
                          clearGetCache()
                          await load()
                        }}
                      />
                    </td>
                  </tr>
                )) : (
                  <TableEmptyState columns={5} message={emptyMessage(debouncedSearch, t('noCategories'), t)} />
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls loading={loading} meta={pagedCategories.meta} onPageChange={setPage} />
        </DataPanel>
      )}
    </Section>
  )
}

function StockPage() {
  const { language, notify, t } = useAppUi()
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [productId, setProductId] = useState('')
  const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<StockMovement>([], 1))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formMode, setFormMode] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(LIST_PAGE_SIZE))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const productsPath = 'products?per_page=100'
      const movementsPath = `stock-movements?${params.toString()}`
      setLoading(shouldShowLoading([productsPath, movementsPath]))

      const [productsResponse, movementsResponse] = await Promise.all([
        cachedGet<Paginated<Product>>(productsPath, REFERENCE_GET_TTL_MS),
        cachedGet<Paginated<StockMovement>>(movementsPath),
      ])
      setProducts(listData(productsResponse))
      setMovements(listData(movementsResponse))
      setPagination(paginationInfo(movementsResponse, page))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [load, notify])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await api.post('stock-movements', {
        notes,
        product_id: Number(productId),
        quantity: Number(quantity),
        type,
      })
      clearGetCache()
      notify('success', t('stockMovementCreated'))
      setNotes('')
      setQuantity('1')
      setPage(1)
      await load()
      setFormMode(false)
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section
      title={formMode ? t('stockInput') : t('stockManagement')}
      actions={
        formMode ? (
          <BackToListButton onClick={() => setFormMode(false)} />
        ) : (
          <button className="btn-primary" type="button" onClick={() => setFormMode(true)}>
            <Plus size={17} />
            {t('stockInput')}
          </button>
        )
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode ? (
        <DataPanel title={t('stockInput')}>
          {loading ? (
            <div className="mb-3">
              <LoadingInline text={t('loadingData')} />
            </div>
          ) : null}
          <form noValidate onSubmit={submit}>
            <Field label={t('product')}>
              <select className="input" value={productId} onChange={(event) => setProductId(event.target.value)} required>
                <option value="">{t('chooseProduct')}</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} · {t('stockCount')} {product.stock}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('type')}>
              <select className="input" value={type} onChange={(event) => setType(event.target.value as 'in' | 'out' | 'adjustment')}>
                <option value="in">{t('in')}</option>
                <option value="out">{t('out')}</option>
                <option value="adjustment">{t('adjustment')}</option>
              </select>
            </Field>
            <Field label={type === 'adjustment' ? t('stockTarget') : t('quantity')}>
              <input className="input" min="0" type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            </Field>
            <Field label={t('note')}>
              <textarea className="input min-h-24" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Plus size={17} />}
                {submitting ? t('saving') : t('addStockHistory')}
              </button>
              <button className="btn-secondary" type="button" onClick={() => setFormMode(false)}>
                <X size={17} />
                {t('cancel')}
              </button>
            </div>
          </form>
        </DataPanel>
      ) : (
        <DataPanel
          title={t('stockHistory')}
          actions={
            <div className="panel-toolbar">
              <SearchField
                placeholder={t('searchStock')}
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setPage(1)
                }}
              />
            </div>
          }
        >
          {loading ? (
            <div className="mb-3">
              <LoadingInline text={t('loadingList')} />
            </div>
          ) : null}
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('time')}</th>
                  <th>{t('product')}</th>
                  <th>{t('type')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('stockAfterBefore')}</th>
                  <th>{t('user')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={7} />
                ) : movements.length ? movements.map((movement, index) => (
                  <tr className="responsive-row" key={movement.id}>
                    <td className="number-cell" data-label={t('rowNumber')}>{pagination.from + index}</td>
                    <td data-label={t('time')}>{dateTime(movement.created_at, language)}</td>
                    <td data-label={t('product')}>
                      <div className="product-table-item">
                        <ProductAvatar product={movement.product} size="sm" />
                        <span>{movement.product?.name}</span>
                      </div>
                    </td>
                    <td data-label={t('type')}>{stockMovementLabel(movement.type, t)}</td>
                    <td data-label={t('quantity')}>{movement.quantity}</td>
                    <td data-label={t('stockAfterBefore')}>{movement.stock_before} → {movement.stock_after}</td>
                    <td data-label={t('user')}>{movement.user?.name}</td>
                  </tr>
                )) : (
                  <TableEmptyState columns={7} message={emptyMessage(debouncedSearch, t('noStockHistory'), t)} />
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
        </DataPanel>
      )}
    </Section>
  )
}

type SaleItemForm = {
  product_id: string
  quantity: string
  unit_price: string
  discount_amount: string
}

const emptySaleItem: SaleItemForm = {
  discount_amount: '0',
  product_id: '',
  quantity: '1',
  unit_price: '',
}

function SalesPage({ invoiceMode }: { invoiceMode: boolean }) {
  const { language, notify, t } = useAppUi()
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [items, setItems] = useState<SaleItemForm[]>([emptySaleItem])
  const [customerId, setCustomerId] = useState('')
  const [discount, setDiscount] = useState('0')
  const [tax, setTax] = useState('0')
  const [paid, setPaid] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [skuScan, setSkuScan] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<Sale>([], 1))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [invoiceLoadingId, setInvoiceLoadingId] = useState<number | null>(null)
  const [formMode, setFormMode] = useState(false)

  const loadSales = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(LIST_PAGE_SIZE))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const salesPath = `sales?${params.toString()}`
      setLoading(shouldShowLoading([salesPath]))

      const salesResponse = await cachedGet<Paginated<Sale>>(salesPath)
      setSales(listData(salesResponse))
      setPagination(paginationInfo(salesResponse, page))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  const loadFormData = useCallback(async () => {
    const productsPath = 'products?per_page=100'
    const customersPath = 'customers?per_page=100'
    setLoading(shouldShowLoading([productsPath, customersPath]))
    try {
      const [productsResponse, customersResponse] = await Promise.all([
        cachedGet<Paginated<Product>>(productsPath, REFERENCE_GET_TTL_MS),
        cachedGet<Paginated<Customer>>(customersPath, REFERENCE_GET_TTL_MS),
      ])
      setProducts(listData(productsResponse))
      setCustomers(listData(customersResponse))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const request = !invoiceMode && formMode ? loadFormData() : loadSales()
    request.catch((error) => reportError(error, notify, setError))
  }, [formMode, invoiceMode, loadFormData, loadSales, notify])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const product = products.find((product) => String(product.id) === item.product_id)
      const unitPrice = toNumber(item.unit_price || product?.selling_price)
      return sum + Math.max(0, unitPrice * toNumber(item.quantity) - toNumber(item.discount_amount))
    }, 0)
    const grandTotal = Math.max(0, subtotal - toNumber(discount) + toNumber(tax))

    return {
      changeAmount: Math.max(0, toNumber(paid) - grandTotal),
      grandTotal,
      subtotal,
    }
  }, [discount, items, paid, products, tax])

  function updateItem(index: number, patch: Partial<SaleItemForm>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    )
  }

  function addProductBySku() {
    const sku = skuScan.trim().toLowerCase()
    const product = products.find((product) => product.is_active && product.sku.toLowerCase() === sku)

    if (!sku) {
      return
    }

    if (!product) {
      notify('error', t('skuNotFound'))
      return
    }

    setItems((current) => {
      const existingIndex = current.findIndex((item) => item.product_id === String(product.id))

      if (existingIndex >= 0) {
        return current.map((item, index) => (
          index === existingIndex
            ? { ...item, quantity: String(Number(item.quantity || 0) + 1), unit_price: apiMoneyToInput(product.selling_price) }
            : item
        ))
      }

      const blankIndex = current.findIndex((item) => !item.product_id)
      const nextItem = {
        discount_amount: '0',
        product_id: String(product.id),
        quantity: '1',
        unit_price: apiMoneyToInput(product.selling_price),
      }

      if (blankIndex >= 0) {
        return current.map((item, index) => (index === blankIndex ? nextItem : item))
      }

      return [...current, nextItem]
    })
    setSkuScan('')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = {
      customer_id: customerId ? Number(customerId) : null,
      discount_amount: toNumber(discount),
      items: items
        .filter((item) => item.product_id && Number(item.quantity) > 0)
        .map((item) => ({
          discount_amount: toNumber(item.discount_amount),
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_price: item.unit_price ? toNumber(item.unit_price) : undefined,
        })),
      notes,
      paid_amount: toNumber(paid),
      payment_method: paymentMethod,
      tax_amount: toNumber(tax),
    }

    try {
      await api.post('sales', payload)
      clearGetCache()
      notify('success', t('saleSaved'))
      setItems([emptySaleItem])
      setCustomerId('')
      setDiscount('0')
      setTax('0')
      setPaid('0')
      setPaymentMethod('cash')
      setNotes('')
      setSkuScan('')
      setPage(1)
      setFormMode(false)
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  async function downloadInvoice(sale: Sale) {
    setInvoiceLoadingId(sale.id)
    setError('')
    try {
      const response = await api.get<Blob>(`sales/${sale.id}/invoice`, {
        params: { lang: language },
        responseType: 'blob',
      })
      const fileName = invoicePdfFileName(sale.invoice_number, language)
      const url = URL.createObjectURL(response.data)
      const link = document.createElement('a')

      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
      notify('success', t('invoiceOpened'))
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setInvoiceLoadingId(null)
    }
  }

  return (
    <Section
      title={invoiceMode ? t('invoiceSales') : (formMode ? t('newSale') : t('saleHistory'))}
      actions={
        formMode && !invoiceMode ? (
          <BackToListButton onClick={() => setFormMode(false)} />
        ) : !invoiceMode ? (
          <button className="btn-primary" type="button" onClick={() => setFormMode(true)}>
            <Plus size={17} />
            {t('newSale')}
          </button>
        ) : null
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode && !invoiceMode ? (
          <DataPanel title={t('newSale')}>
            {loading ? (
              <div className="mb-3">
                <LoadingInline text={t('loadingData')} />
              </div>
            ) : null}
            <form noValidate onSubmit={submit}>
              <Field label={t('customer')}>
                <select className="input" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  <option value="">{t('generalCustomer')}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t('scanSku')}>
                <div className="scan-field">
                  <ScanLine size={18} />
                  <input
                    className="input"
                    placeholder={t('scanSkuHelp')}
                    value={skuScan}
                    onChange={(event) => setSkuScan(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        addProductBySku()
                      }
                    }}
                  />
                </div>
              </Field>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const product = products.find((product) => String(product.id) === item.product_id)

                  return (
                    <div key={index} className="line-item">
                      <Field label={t('product')}>
                        <select
                          className="input"
                          value={item.product_id}
                          onChange={(event) => {
                            const selected = products.find((product) => String(product.id) === event.target.value)
                            updateItem(index, {
                              product_id: event.target.value,
                              unit_price: selected ? apiMoneyToInput(selected.selling_price) : '',
                            })
                          }}
                          required
                        >
                          <option value="">{t('chooseProduct')}</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} · {t('stockCount')} {product.stock}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <Field label={t('quantity')}>
                          <input className="input" min="1" type="number" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} />
                        </Field>
                        <Field label={t('price')}>
                          <input className="input" inputMode="numeric" value={moneyInputValue(item.unit_price || product?.selling_price || '')} onChange={(event) => updateItem(index, { unit_price: normalizeMoneyInput(event.target.value) })} />
                        </Field>
                        <Field label={t('discount')}>
                          <input className="input" inputMode="numeric" value={moneyInputValue(item.discount_amount)} onChange={(event) => updateItem(index, { discount_amount: normalizeMoneyInput(event.target.value) })} />
                        </Field>
                      </div>
                      {items.length > 1 ? (
                        <button className="btn-danger" type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                          <Trash2 size={16} />
                          {t('removeItem')}
                        </button>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              <button className="btn-secondary mt-3" type="button" onClick={() => setItems((current) => [...current, emptySaleItem])}>
                <Plus size={17} />
                {t('addItem')}
              </button>

              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <Field label={t('discount')}>
                  <input className="input" inputMode="numeric" value={moneyInputValue(discount)} onChange={(event) => setDiscount(normalizeMoneyInput(event.target.value))} />
                </Field>
                <Field label={t('tax')}>
                  <input className="input" inputMode="numeric" value={moneyInputValue(tax)} onChange={(event) => setTax(normalizeMoneyInput(event.target.value))} />
                </Field>
                <Field label={t('paidAmount')}>
                  <input className="input" inputMode="numeric" value={moneyInputValue(paid)} onChange={(event) => setPaid(normalizeMoneyInput(event.target.value))} />
                </Field>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <Field label={t('payment')}>
                  <select className="input" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                    <option value="cash">{t('cash')}</option>
                    <option value="transfer">{t('transfer')}</option>
                    <option value="qris">QRIS</option>
                    <option value="card">{t('card')}</option>
                  </select>
                </Field>
                <Field label={t('total')}>
                  <input className="input bg-slate-50" readOnly value={currency(totals.grandTotal, language)} />
                </Field>
                <Field label={t('changeAmount')}>
                  <input className="input bg-slate-50" readOnly value={currency(totals.changeAmount, language)} />
                </Field>
              </div>
              <Field label={t('note')}>
                <textarea className="input min-h-20" value={notes} onChange={(event) => setNotes(event.target.value)} />
              </Field>
              <div className="flex gap-2">
                <button className="btn-primary" disabled={submitting} type="submit">
                  {submitting ? <Spinner /> : <Save size={17} />}
                  {submitting ? t('saving') : t('saveSale')}
                </button>
                <button className="btn-secondary" type="button" onClick={() => setFormMode(false)}>
                  <X size={17} />
                  {t('cancel')}
                </button>
              </div>
            </form>
          </DataPanel>
      ) : (
        <DataPanel
          title={t('saleHistory')}
          actions={
            <div className="panel-toolbar">
              <SearchField
                placeholder={t('searchSale')}
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setPage(1)
                }}
              />
              <button
                className="btn-secondary"
                type="button"
                onClick={() => void downloadBlob('exports/sales', exportFilename('sales', language), language).catch((error) => reportError(error, notify, setError))}
              >
                <Download size={17} />
                {t('exportCsv')}
              </button>
            </div>
          }
        >
          {loading ? (
            <div className="mb-3">
              <LoadingInline text={t('loadingList')} />
            </div>
          ) : null}
          <SalesTable
            emptyMessage={emptyMessage(debouncedSearch, t('noSales'), t)}
            invoiceLoadingId={invoiceLoadingId}
            loading={loading}
            rowStart={pagination.from}
            sales={sales}
            onInvoice={downloadInvoice}
            onCancel={async (sale) => {
              await api.delete(`sales/${sale.id}`)
              clearGetCache()
              await loadSales()
            }}
            onRefund={async (sale) => {
              await api.post(`sales/${sale.id}/refund`, { reason: '' })
              clearGetCache()
              await loadSales()
            }}
          />
          <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
        </DataPanel>
      )}
    </Section>
  )
}

function SalesTable({
  emptyMessage,
  invoiceLoadingId,
  loading,
  rowStart,
  sales,
  onCancel,
  onInvoice,
  onRefund,
}: {
  emptyMessage: string
  invoiceLoadingId: number | null
  loading: boolean
  rowStart: number
  sales: Sale[]
  onCancel: (sale: Sale) => Promise<void>
  onInvoice: (sale: Sale) => Promise<void>
  onRefund: (sale: Sale) => Promise<void>
}) {
  const { confirmAction, language, notify, t } = useAppUi()
  const [cancelingId, setCancelingId] = useState<number | null>(null)
  const [refundingId, setRefundingId] = useState<number | null>(null)

  async function confirmCancel(sale: Sale) {
    const confirmed = await confirmAction({
      confirmLabel: t('confirm'),
      intent: 'danger',
      message: t('deleteConfirmMessage'),
      title: t('cancelSale'),
    })

    if (!confirmed) {
      return
    }

    try {
      setCancelingId(sale.id)
      await onCancel(sale)
      notify('success', t('saleCancelled'))
    } catch (error) {
      notify('error', apiErrorMessage(error))
    } finally {
      setCancelingId(null)
    }
  }

  async function confirmRefund(sale: Sale) {
    const confirmed = await confirmAction({
      confirmLabel: t('refundSale'),
      intent: 'danger',
      message: t('refundConfirmMessage'),
      title: t('refundConfirmTitle'),
    })

    if (!confirmed) {
      return
    }

    try {
      setRefundingId(sale.id)
      await onRefund(sale)
      notify('success', t('saleRefunded'))
    } catch (error) {
      notify('error', apiErrorMessage(error))
    } finally {
      setRefundingId(null)
    }
  }

  return (
    <div className="table-wrap">
      <table className="data-table responsive-table">
        <thead>
          <tr>
            <th className="number-cell">{t('rowNumber')}</th>
            <th>{t('invoice')}</th>
            <th>{t('time')}</th>
            <th>{t('customer')}</th>
            <th>{t('total')}</th>
            <th>{t('status')}</th>
            <th>{t('actions')}</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <TableSkeletonRows columns={7} />
          ) : sales.length ? sales.map((sale, index) => (
            <tr className="responsive-row" key={sale.id}>
              <td className="number-cell" data-label={t('rowNumber')}>{rowStart + index}</td>
              <td className="font-medium" data-label={t('invoice')}>{sale.invoice_number}</td>
              <td data-label={t('time')}>{dateTime(sale.sale_date, language)}</td>
              <td data-label={t('customer')}>{sale.customer?.name ?? t('generalCustomer')}</td>
              <td data-label={t('total')}>{currency(sale.grand_total, language)}</td>
              <td data-label={t('status')}>
                <span className={sale.payment_status === 'refunded' ? 'badge-red' : sale.payment_status === 'paid' ? 'badge-green' : 'badge-amber'}>
                  {paymentStatusLabel(sale.payment_status, t)}
                </span>
              </td>
              <td className="actions-cell" data-label={t('actions')}>
                {sale.status === 'completed' ? (
                  <ActionMenu compact label={t('actions')}>
                    <button
                      className="action-menu-item"
                      disabled={invoiceLoadingId === sale.id}
                      type="button"
                      onClick={() => onInvoice(sale)}
                    >
                      {invoiceLoadingId === sale.id ? <Spinner /> : <Download size={16} />}
                      {invoiceLoadingId === sale.id ? t('openingInvoice') : t('invoicePdf')}
                    </button>
                    <button
                      className="action-menu-item action-menu-item-danger"
                      disabled={cancelingId === sale.id}
                      type="button"
                      onClick={() => confirmCancel(sale)}
                    >
                      {cancelingId === sale.id ? <Spinner /> : <X size={16} />}
                      {cancelingId === sale.id ? t('removing') : t('cancelSale')}
                    </button>
                    <button
                      className="action-menu-item action-menu-item-danger"
                      disabled={refundingId === sale.id}
                      type="button"
                      onClick={() => confirmRefund(sale)}
                    >
                      {refundingId === sale.id ? <Spinner /> : <Undo2 size={16} />}
                      {refundingId === sale.id ? t('processing') : t('refundSale')}
                    </button>
                  </ActionMenu>
                ) : (
                  <button
                    className="icon-button"
                    aria-label={t('invoicePdf')}
                    disabled={invoiceLoadingId === sale.id}
                    title={invoiceLoadingId === sale.id ? t('openingInvoice') : t('invoicePdf')}
                    type="button"
                    onClick={() => onInvoice(sale)}
                  >
                    {invoiceLoadingId === sale.id ? <Spinner /> : <Download size={16} />}
                  </button>
                )}
              </td>
            </tr>
          )) : (
            <TableEmptyState columns={7} message={emptyMessage} />
          )}
        </tbody>
      </table>
    </div>
  )
}

type CustomerForm = {
  name: string
  email: string
  phone: string
  address: string
  is_active: boolean
}

const emptyCustomerForm: CustomerForm = {
  address: '',
  email: '',
  is_active: true,
  name: '',
  phone: '',
}

function CustomersPage() {
  const { language, notify, t } = useAppUi()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState<CustomerForm>(emptyCustomerForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null)
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<Customer>([], 1))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formMode, setFormMode] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(LIST_PAGE_SIZE))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const customersPath = `customers?${params.toString()}`
      setLoading(shouldShowLoading([customersPath]))

      const response = await cachedGet<Paginated<Customer>>(customersPath)
      setCustomers(listData(response))
      setPagination(paginationInfo(response, page))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [load, notify])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (editingId) {
        await api.put(`customers/${editingId}`, form)
        clearGetCache()
        notify('success', t('customerUpdated'))
      } else {
        await api.post('customers', form)
        clearGetCache()
        notify('success', t('customerCreated'))
      }
      setEditingId(null)
      setForm(emptyCustomerForm)
      setPage(1)
      await load()
      setFormMode(false)
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  async function openDetail(customer: Customer) {
    setDetailLoadingId(customer.id)
    setError('')

    try {
      const response = await api.get<Customer>(`customers/${customer.id}`)
      setDetailCustomer(response.data)
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setDetailLoadingId(null)
    }
  }

  const customerSales = detailCustomer?.sales ?? []
  const customerTotalSpend = customerSales.reduce((sum, sale) => sum + toNumber(sale.grand_total), 0)

  return (
    <Section
      title={formMode ? (editingId ? t('customerEdit') : t('customerNew')) : t('customerManagement')}
      actions={
        formMode ? (
          <BackToListButton
            onClick={() => {
              setEditingId(null)
              setForm(emptyCustomerForm)
              setFormMode(false)
            }}
          />
        ) : (
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setEditingId(null)
              setForm(emptyCustomerForm)
              setFormMode(true)
            }}
          >
            <Plus size={17} />
            {t('customerNew')}
          </button>
        )
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode ? (
        <DataPanel title={editingId ? t('customerEdit') : t('customerNew')}>
          <form noValidate onSubmit={submit}>
            <Field label={t('name')}>
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <Field label={t('email')}>
              <input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </Field>
            <Field label={t('phone')}>
              <input className="input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </Field>
            <Field label={t('address')}>
              <textarea className="input min-h-24" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </Field>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Save size={17} />}
                {submitting ? t('saving') : t('save')}
              </button>
              <button className="btn-secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyCustomerForm); setFormMode(false) }}>
                <X size={17} />
                {t('cancel')}
              </button>
            </div>
          </form>
        </DataPanel>
      ) : (
        <>
        {detailCustomer ? (
          <DataPanel title={t('customerDetail')}>
            <div className="detail-summary-grid">
              <div>
                <span>{t('name')}</span>
                <strong>{detailCustomer.name}</strong>
              </div>
              <div>
                <span>{t('transactionCount')}</span>
                <strong>{customerSales.length}</strong>
              </div>
              <div>
                <span>{t('totalSpend')}</span>
                <strong>{currency(customerTotalSpend, language)}</strong>
              </div>
            </div>
            <div className="mt-4 table-wrap">
              <table className="data-table responsive-table">
                <thead>
                  <tr>
                    <th className="number-cell">{t('rowNumber')}</th>
                    <th>{t('invoice')}</th>
                    <th>{t('time')}</th>
                    <th>{t('total')}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {customerSales.length ? customerSales.slice(0, LIST_PAGE_SIZE).map((sale, index) => (
                    <tr className="responsive-row" key={sale.id}>
                      <td className="number-cell" data-label={t('rowNumber')}>{index + 1}</td>
                      <td data-label={t('invoice')}>{sale.invoice_number}</td>
                      <td data-label={t('time')}>{dateTime(sale.sale_date, language)}</td>
                      <td data-label={t('total')}>{currency(sale.grand_total, language)}</td>
                      <td data-label={t('status')}>{paymentStatusLabel(sale.payment_status, t)}</td>
                    </tr>
                  )) : (
                    <TableEmptyState columns={5} message={t('noCustomerSales')} />
                  )}
                </tbody>
              </table>
            </div>
            <button className="btn-secondary mt-4" type="button" onClick={() => setDetailCustomer(null)}>
              <X size={17} />
              {t('close')}
            </button>
          </DataPanel>
        ) : null}
        <DataPanel
          title={t('customerList')}
          actions={
            <div className="panel-toolbar">
              <SearchField
                placeholder={t('searchCustomer')}
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setPage(1)
                }}
              />
              <button
                className="btn-secondary"
                type="button"
                onClick={() => void downloadBlob('exports/customers', exportFilename('customers', language), language).catch((error) => reportError(error, notify, setError))}
              >
                <Download size={17} />
                {t('exportCsv')}
              </button>
            </div>
          }
        >
          {loading ? (
            <div className="mb-3">
              <LoadingInline text={t('loadingList')} />
            </div>
          ) : null}
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('name')}</th>
                  <th>{t('contact')}</th>
                  <th>{t('lastPurchase')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={5} />
                ) : customers.length ? customers.map((customer, index) => (
                  <tr className="responsive-row" key={customer.id}>
                    <td className="number-cell" data-label={t('rowNumber')}>{pagination.from + index}</td>
                    <td data-label={t('name')}>{customer.name}</td>
                    <td data-label={t('contact')}>
                      <div>{customer.phone}</div>
                      <div className="text-xs text-slate-500">{customer.email}</div>
                    </td>
                    <td data-label={t('lastPurchase')}>{customer.last_purchase_at ?? '-'}</td>
                    <td className="actions-cell" data-label={t('actions')}>
                      <ActionMenu compact label={t('actions')}>
                        <button
                          className="action-menu-item"
                          disabled={detailLoadingId === customer.id}
                          type="button"
                          onClick={() => void openDetail(customer)}
                        >
                          {detailLoadingId === customer.id ? <Spinner /> : <Eye size={16} />}
                          {t('viewDetail')}
                        </button>
                        <button
                          className="action-menu-item"
                          type="button"
                          onClick={() => {
                            setEditingId(customer.id)
                            setForm({
                              address: customer.address ?? '',
                              email: customer.email ?? '',
                              is_active: customer.is_active,
                              name: customer.name,
                              phone: customer.phone ?? '',
                            })
                            setFormMode(true)
                          }}
                        >
                          <Edit3 size={16} />
                          {t('edit')}
                        </button>
                        <DeleteActionMenuItem
                          itemName={customer.name}
                          successMessage={t('customerDeleted')}
                          onRemove={async () => {
                            await api.delete(`customers/${customer.id}`)
                            clearGetCache()
                            await load()
                          }}
                        />
                      </ActionMenu>
                    </td>
                  </tr>
                )) : (
                  <TableEmptyState columns={5} message={emptyMessage(debouncedSearch, t('noCustomers'), t)} />
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
        </DataPanel>
        </>
      )}
    </Section>
  )
}

type SupplierForm = {
  name: string
  email: string
  phone: string
  address: string
  is_active: boolean
}

const emptySupplierForm: SupplierForm = {
  address: '',
  email: '',
  is_active: true,
  name: '',
  phone: '',
}

function SuppliersPage() {
  const { notify, t } = useAppUi()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [form, setForm] = useState<SupplierForm>(emptySupplierForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<Supplier>([], 1))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formMode, setFormMode] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(LIST_PAGE_SIZE))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const suppliersPath = `suppliers?${params.toString()}`
      setLoading(shouldShowLoading([suppliersPath]))

      const response = await cachedGet<Paginated<Supplier>>(suppliersPath)
      setSuppliers(listData(response))
      setPagination(paginationInfo(response, page))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [load, notify])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (editingId) {
        await api.put(`suppliers/${editingId}`, form)
        notify('success', t('supplierUpdated'))
      } else {
        await api.post('suppliers', form)
        notify('success', t('supplierCreated'))
      }
      clearGetCache()
      setForm(emptySupplierForm)
      setEditingId(null)
      setFormMode(false)
      await load()
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section
      title={formMode ? (editingId ? t('supplierEdit') : t('supplierNew')) : t('supplierManagement')}
      actions={
        formMode ? (
          <BackToListButton onClick={() => { setEditingId(null); setForm(emptySupplierForm); setFormMode(false) }} />
        ) : (
          <button className="btn-primary" type="button" onClick={() => { setEditingId(null); setForm(emptySupplierForm); setFormMode(true) }}>
            <Plus size={17} />
            {t('supplierNew')}
          </button>
        )
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode ? (
        <DataPanel title={editingId ? t('supplierEdit') : t('supplierNew')}>
          <form noValidate onSubmit={submit}>
            <Field label={t('name')}>
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <Field label={t('email')}>
              <input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </Field>
            <Field label={t('phone')}>
              <input className="input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </Field>
            <Field label={t('address')}>
              <textarea className="input min-h-24" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </Field>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Save size={17} />}
                {submitting ? t('saving') : t('save')}
              </button>
              <button className="btn-secondary" type="button" onClick={() => { setEditingId(null); setForm(emptySupplierForm); setFormMode(false) }}>
                <X size={17} />
                {t('cancel')}
              </button>
            </div>
          </form>
        </DataPanel>
      ) : (
        <DataPanel
          title={t('supplierList')}
          actions={
            <div className="panel-toolbar">
              <SearchField placeholder={t('searchSupplier')} value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
            </div>
          }
        >
          {loading ? <div className="mb-3"><LoadingInline text={t('loadingList')} /></div> : null}
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('name')}</th>
                  <th>{t('contact')}</th>
                  <th>{t('address')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={6} />
                ) : suppliers.length ? suppliers.map((supplier, index) => (
                  <tr className="responsive-row" key={supplier.id}>
                    <td className="number-cell" data-label={t('rowNumber')}>{pagination.from + index}</td>
                    <td data-label={t('name')}>{supplier.name}</td>
                    <td data-label={t('contact')}><div>{supplier.phone}</div><div className="text-xs text-slate-500">{supplier.email}</div></td>
                    <td data-label={t('address')}>{supplier.address}</td>
                    <td data-label={t('status')}>{supplier.is_active ? t('active') : t('inactive')}</td>
                    <td className="actions-cell" data-label={t('actions')}>
                      <RowActions
                        onEdit={() => {
                          setEditingId(supplier.id)
                          setForm({
                            address: supplier.address ?? '',
                            email: supplier.email ?? '',
                            is_active: supplier.is_active,
                            name: supplier.name,
                            phone: supplier.phone ?? '',
                          })
                          setFormMode(true)
                        }}
                        itemName={supplier.name}
                        successMessage={t('supplierDeleted')}
                        onRemove={async () => {
                          await api.delete(`suppliers/${supplier.id}`)
                          clearGetCache()
                          await load()
                        }}
                      />
                    </td>
                  </tr>
                )) : (
                  <TableEmptyState columns={6} message={emptyMessage(debouncedSearch, t('noSuppliers'), t)} />
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
        </DataPanel>
      )}
    </Section>
  )
}

type LocationForm = {
  name: string
  type: 'store' | 'warehouse'
  phone: string
  address: string
  is_active: boolean
}

const emptyLocationForm: LocationForm = {
  address: '',
  is_active: true,
  name: '',
  phone: '',
  type: 'store',
}

function LocationsPage() {
  const { notify, t } = useAppUi()
  const [locations, setLocations] = useState<Location[]>([])
  const [form, setForm] = useState<LocationForm>(emptyLocationForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<Location>([], 1))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formMode, setFormMode] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(LIST_PAGE_SIZE))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const locationsPath = `locations?${params.toString()}`
      setLoading(shouldShowLoading([locationsPath]))

      const response = await cachedGet<Paginated<Location>>(locationsPath)
      setLocations(listData(response))
      setPagination(paginationInfo(response, page))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [load, notify])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (editingId) {
        await api.put(`locations/${editingId}`, form)
        notify('success', t('locationUpdated'))
      } else {
        await api.post('locations', form)
        notify('success', t('locationCreated'))
      }
      clearGetCache()
      setForm(emptyLocationForm)
      setEditingId(null)
      setFormMode(false)
      await load()
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section
      title={formMode ? (editingId ? t('locationEdit') : t('locationNew')) : t('locationManagement')}
      actions={
        formMode ? (
          <BackToListButton onClick={() => { setEditingId(null); setForm(emptyLocationForm); setFormMode(false) }} />
        ) : (
          <button className="btn-primary" type="button" onClick={() => { setEditingId(null); setForm(emptyLocationForm); setFormMode(true) }}>
            <Plus size={17} />
            {t('locationNew')}
          </button>
        )
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode ? (
        <DataPanel title={editingId ? t('locationEdit') : t('locationNew')}>
          <form noValidate onSubmit={submit}>
            <Field label={t('name')}>
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <Field label={t('locationType')}>
              <select className="input" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as LocationForm['type'] })}>
                <option value="store">{t('store')}</option>
                <option value="warehouse">{t('warehouse')}</option>
              </select>
            </Field>
            <Field label={t('phone')}>
              <input className="input" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </Field>
            <Field label={t('address')}>
              <textarea className="input min-h-24" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
            </Field>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Save size={17} />}
                {submitting ? t('saving') : t('save')}
              </button>
              <button className="btn-secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyLocationForm); setFormMode(false) }}>
                <X size={17} />
                {t('cancel')}
              </button>
            </div>
          </form>
        </DataPanel>
      ) : (
        <DataPanel
          title={t('locationList')}
          actions={
            <div className="panel-toolbar">
              <SearchField placeholder={t('searchLocation')} value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
            </div>
          }
        >
          {loading ? <div className="mb-3"><LoadingInline text={t('loadingList')} /></div> : null}
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('name')}</th>
                  <th>{t('locationType')}</th>
                  <th>{t('contact')}</th>
                  <th>{t('address')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={7} />
                ) : locations.length ? locations.map((location, index) => (
                  <tr className="responsive-row" key={location.id}>
                    <td className="number-cell" data-label={t('rowNumber')}>{pagination.from + index}</td>
                    <td data-label={t('name')}>{location.name}</td>
                    <td data-label={t('locationType')}>{location.type === 'warehouse' ? t('warehouse') : t('store')}</td>
                    <td data-label={t('contact')}>{location.phone}</td>
                    <td data-label={t('address')}>{location.address}</td>
                    <td data-label={t('status')}>{location.is_active ? t('active') : t('inactive')}</td>
                    <td className="actions-cell" data-label={t('actions')}>
                      <RowActions
                        onEdit={() => {
                          setEditingId(location.id)
                          setForm({
                            address: location.address ?? '',
                            is_active: location.is_active,
                            name: location.name,
                            phone: location.phone ?? '',
                            type: location.type,
                          })
                          setFormMode(true)
                        }}
                        itemName={location.name}
                        successMessage={t('locationDeleted')}
                        onRemove={async () => {
                          await api.delete(`locations/${location.id}`)
                          clearGetCache()
                          await load()
                        }}
                      />
                    </td>
                  </tr>
                )) : (
                  <TableEmptyState columns={7} message={emptyMessage(debouncedSearch, t('noLocations'), t)} />
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
        </DataPanel>
      )}
    </Section>
  )
}

type ExpenseForm = {
  location_id: string
  category: string
  title: string
  amount: string
  expense_date: string
  payment_method: string
  notes: string
}

const emptyExpenseForm: ExpenseForm = {
  amount: '0',
  category: '',
  expense_date: todayInputValue(),
  location_id: '',
  notes: '',
  payment_method: 'cash',
  title: '',
}

function ExpensesPage() {
  const { language, notify, t } = useAppUi()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [form, setForm] = useState<ExpenseForm>(emptyExpenseForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [dateFrom, setDateFrom] = useState(monthStartInputValue())
  const [dateTo, setDateTo] = useState(todayInputValue())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<Expense>([], 1))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formMode, setFormMode] = useState(false)

  const load = useCallback(async () => {
    try {
      const params = dateRangeQuery(dateFrom, dateTo)
      params.set('page', String(page))
      params.set('per_page', String(LIST_PAGE_SIZE))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const expensesPath = `expenses?${params.toString()}`
      const locationsPath = 'locations?per_page=100'
      setLoading(shouldShowLoading([expensesPath, locationsPath]))

      const [expensesResponse, locationsResponse] = await Promise.all([
        cachedGet<Paginated<Expense>>(expensesPath),
        cachedGet<Paginated<Location>>(locationsPath, REFERENCE_GET_TTL_MS),
      ])
      setExpenses(listData(expensesResponse))
      setPagination(paginationInfo(expensesResponse, page))
      setLocations(listData(locationsResponse))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, debouncedSearch, page])

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [load, notify])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = {
      ...form,
      amount: toNumber(form.amount),
      location_id: form.location_id ? Number(form.location_id) : null,
    }

    try {
      if (editingId) {
        await api.put(`expenses/${editingId}`, payload)
        notify('success', t('expenseUpdated'))
      } else {
        await api.post('expenses', payload)
        notify('success', t('expenseCreated'))
      }
      clearGetCache()
      setForm(emptyExpenseForm)
      setEditingId(null)
      setFormMode(false)
      await load()
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section
      title={formMode ? t('expenseNew') : t('expenseManagement')}
      actions={
        formMode ? (
          <BackToListButton onClick={() => { setEditingId(null); setForm(emptyExpenseForm); setFormMode(false) }} />
        ) : (
          <button className="btn-primary" type="button" onClick={() => { setEditingId(null); setForm(emptyExpenseForm); setFormMode(true) }}>
            <Plus size={17} />
            {t('expenseNew')}
          </button>
        )
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode ? (
        <DataPanel title={t('expenseNew')}>
          <form noValidate onSubmit={submit}>
            <Field label={t('expenseCategory')}>
              <input className="input" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
            </Field>
            <Field label={t('expenseTitle')}>
              <input className="input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </Field>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t('amount')}>
                <input className="input" inputMode="numeric" value={moneyInputValue(form.amount)} onChange={(event) => setForm({ ...form, amount: normalizeMoneyInput(event.target.value) })} />
              </Field>
              <Field label={t('expenseDate')}>
                <input className="input" type="date" value={form.expense_date} onChange={(event) => setForm({ ...form, expense_date: event.target.value })} />
              </Field>
              <Field label={t('payment')}>
                <select className="input" value={form.payment_method} onChange={(event) => setForm({ ...form, payment_method: event.target.value })}>
                  <option value="cash">{t('cash')}</option>
                  <option value="transfer">{t('transfer')}</option>
                  <option value="qris">QRIS</option>
                  <option value="card">{t('card')}</option>
                </select>
              </Field>
            </div>
            <Field label={t('location')}>
              <select className="input" value={form.location_id} onChange={(event) => setForm({ ...form, location_id: event.target.value })}>
                <option value="">{t('chooseLocation')}</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </Field>
            <Field label={t('note')}>
              <textarea className="input min-h-24" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </Field>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Save size={17} />}
                {submitting ? t('saving') : t('save')}
              </button>
              <button className="btn-secondary" type="button" onClick={() => { setEditingId(null); setForm(emptyExpenseForm); setFormMode(false) }}>
                <X size={17} />
                {t('cancel')}
              </button>
            </div>
          </form>
        </DataPanel>
      ) : (
        <DataPanel
          title={t('expenseList')}
          actions={
            <div className="panel-toolbar">
              <SearchField placeholder={t('searchExpense')} value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
              <DateRangeMenu
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(value) => { setDateFrom(value); setPage(1) }}
                onDateToChange={(value) => { setDateTo(value); setPage(1) }}
              >
                <button
                  className="action-menu-item"
                  type="button"
                  onClick={() => {
                    const query = dateRangeQuery(dateFrom, dateTo).toString()
                    void downloadBlob(`exports/expenses?${query}`, exportFilename('expenses', language), language).catch((error) => reportError(error, notify, setError))
                  }}
                >
                  <Download size={17} />
                  {t('exportCsv')}
                </button>
              </DateRangeMenu>
            </div>
          }
        >
          {loading ? <div className="mb-3"><LoadingInline text={t('loadingList')} /></div> : null}
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('expenseDate')}</th>
                  <th>{t('expenseCategory')}</th>
                  <th>{t('expenseTitle')}</th>
                  <th>{t('location')}</th>
                  <th>{t('amount')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={7} />
                ) : expenses.length ? expenses.map((expense, index) => (
                  <tr className="responsive-row" key={expense.id}>
                    <td className="number-cell" data-label={t('rowNumber')}>{pagination.from + index}</td>
                    <td data-label={t('expenseDate')}>{dateOnly(expense.expense_date, language)}</td>
                    <td data-label={t('expenseCategory')}>{expense.category}</td>
                    <td data-label={t('expenseTitle')}>{expense.title}</td>
                    <td data-label={t('location')}>{expense.location?.name ?? '-'}</td>
                    <td data-label={t('amount')}>{currency(expense.amount, language)}</td>
                    <td className="actions-cell" data-label={t('actions')}>
                      <RowActions
                        onEdit={() => {
                          setEditingId(expense.id)
                          setForm({
                            amount: apiMoneyToInput(expense.amount),
                            category: expense.category,
                            expense_date: dateInputFromValue(expense.expense_date),
                            location_id: expense.location ? String(expense.location.id) : '',
                            notes: expense.notes ?? '',
                            payment_method: expense.payment_method ?? 'cash',
                            title: expense.title,
                          })
                          setFormMode(true)
                        }}
                        itemName={expense.title}
                        successMessage={t('expenseDeleted')}
                        onRemove={async () => {
                          await api.delete(`expenses/${expense.id}`)
                          clearGetCache()
                          await load()
                        }}
                      />
                    </td>
                  </tr>
                )) : (
                  <TableEmptyState columns={7} message={emptyMessage(debouncedSearch, t('noExpenses'), t)} />
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
        </DataPanel>
      )}
    </Section>
  )
}

type PurchaseItemForm = {
  product_id: string
  quantity: string
  unit_cost: string
}

type PurchaseForm = {
  supplier_id: string
  location_id: string
  reference_number: string
  purchase_date: string
  discount_amount: string
  tax_amount: string
  notes: string
}

const emptyPurchaseItem: PurchaseItemForm = {
  product_id: '',
  quantity: '1',
  unit_cost: '',
}

const emptyPurchaseForm: PurchaseForm = {
  discount_amount: '0',
  location_id: '',
  notes: '',
  purchase_date: todayInputValue(),
  reference_number: '',
  supplier_id: '',
  tax_amount: '0',
}

function PurchasesPage() {
  const { language, notify, t } = useAppUi()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [form, setForm] = useState<PurchaseForm>(emptyPurchaseForm)
  const [items, setItems] = useState<PurchaseItemForm[]>([emptyPurchaseItem])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [dateFrom, setDateFrom] = useState(monthStartInputValue())
  const [dateTo, setDateTo] = useState(todayInputValue())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<Purchase>([], 1))
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formMode, setFormMode] = useState(false)

  const loadList = useCallback(async () => {
    try {
      const params = dateRangeQuery(dateFrom, dateTo)
      params.set('page', String(page))
      params.set('per_page', String(LIST_PAGE_SIZE))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const purchasesPath = `purchases?${params.toString()}`
      setLoading(shouldShowLoading([purchasesPath]))

      const response = await cachedGet<Paginated<Purchase>>(purchasesPath)
      setPurchases(listData(response))
      setPagination(paginationInfo(response, page))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, debouncedSearch, page])

  const loadFormData = useCallback(async () => {
    const productsPath = 'products?per_page=100'
    const suppliersPath = 'suppliers?per_page=100'
    const locationsPath = 'locations?per_page=100'
    setLoading(shouldShowLoading([productsPath, suppliersPath, locationsPath]))
    try {
      const [productsResponse, suppliersResponse, locationsResponse] = await Promise.all([
        cachedGet<Paginated<Product>>(productsPath, REFERENCE_GET_TTL_MS),
        cachedGet<Paginated<Supplier>>(suppliersPath, REFERENCE_GET_TTL_MS),
        cachedGet<Paginated<Location>>(locationsPath, REFERENCE_GET_TTL_MS),
      ])
      setProducts(listData(productsResponse))
      setSuppliers(listData(suppliersResponse))
      setLocations(listData(locationsResponse))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const request = formMode ? loadFormData() : loadList()
    request.catch((error) => reportError(error, notify, setError))
  }, [formMode, loadFormData, loadList, notify])

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + toNumber(item.quantity) * toNumber(item.unit_cost), 0)
    return {
      grandTotal: Math.max(0, subtotal - toNumber(form.discount_amount) + toNumber(form.tax_amount)),
      subtotal,
    }
  }, [form.discount_amount, form.tax_amount, items])

  function updatePurchaseItem(index: number, patch: Partial<PurchaseItemForm>) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const payload = {
      ...form,
      discount_amount: toNumber(form.discount_amount),
      items: items
        .filter((item) => item.product_id && Number(item.quantity) > 0)
        .map((item) => ({
          product_id: Number(item.product_id),
          quantity: Number(item.quantity),
          unit_cost: toNumber(item.unit_cost),
        })),
      location_id: form.location_id ? Number(form.location_id) : null,
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      tax_amount: toNumber(form.tax_amount),
    }

    try {
      await api.post('purchases', payload)
      clearGetCache()
      notify('success', t('purchaseSaved'))
      setForm(emptyPurchaseForm)
      setItems([emptyPurchaseItem])
      setFormMode(false)
      setPage(1)
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section
      title={formMode ? t('purchaseNew') : t('purchaseManagement')}
      actions={
        formMode ? (
          <BackToListButton onClick={() => { setForm(emptyPurchaseForm); setItems([emptyPurchaseItem]); setFormMode(false) }} />
        ) : (
          <button className="btn-primary" type="button" onClick={() => setFormMode(true)}>
            <Plus size={17} />
            {t('purchaseNew')}
          </button>
        )
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode ? (
        <DataPanel title={t('purchaseNew')}>
          {loading ? <div className="mb-3"><LoadingInline text={t('loadingData')} /></div> : null}
          <form noValidate onSubmit={submit}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('supplier')}>
                <select className="input" value={form.supplier_id} onChange={(event) => setForm({ ...form, supplier_id: event.target.value })}>
                  <option value="">{t('chooseSupplier')}</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </Field>
              <Field label={t('location')}>
                <select className="input" value={form.location_id} onChange={(event) => setForm({ ...form, location_id: event.target.value })}>
                  <option value="">{t('chooseLocation')}</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('referenceNumber')}>
                <input className="input" value={form.reference_number} onChange={(event) => setForm({ ...form, reference_number: event.target.value })} />
              </Field>
              <Field label={t('purchaseDate')}>
                <input className="input" type="date" value={form.purchase_date} onChange={(event) => setForm({ ...form, purchase_date: event.target.value })} />
              </Field>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => {
                const product = products.find((product) => String(product.id) === item.product_id)

                return (
                  <div className="line-item" key={index}>
                    <Field label={t('product')}>
                      <select
                        className="input"
                        value={item.product_id}
                        onChange={(event) => {
                          const selected = products.find((product) => String(product.id) === event.target.value)
                          updatePurchaseItem(index, {
                            product_id: event.target.value,
                            unit_cost: selected ? apiMoneyToInput(selected.purchase_price) : '',
                          })
                        }}
                      >
                        <option value="">{t('chooseProduct')}</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>{product.name} · {product.sku}</option>
                        ))}
                      </select>
                    </Field>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Field label={t('quantity')}>
                        <input className="input" min="1" type="number" value={item.quantity} onChange={(event) => updatePurchaseItem(index, { quantity: event.target.value })} />
                      </Field>
                      <Field label={t('unitCost')}>
                        <input className="input" inputMode="numeric" value={moneyInputValue(item.unit_cost || product?.purchase_price || '')} onChange={(event) => updatePurchaseItem(index, { unit_cost: normalizeMoneyInput(event.target.value) })} />
                      </Field>
                      <Field label={t('subtotal')}>
                        <input className="input bg-slate-50" readOnly value={currency(toNumber(item.quantity) * toNumber(item.unit_cost || product?.purchase_price), language)} />
                      </Field>
                    </div>
                    {items.length > 1 ? (
                      <button className="btn-danger" type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                        <Trash2 size={16} />
                        {t('removeItem')}
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
            <button className="btn-secondary mt-3" type="button" onClick={() => setItems((current) => [...current, emptyPurchaseItem])}>
              <Plus size={17} />
              {t('addItem')}
            </button>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Field label={t('discount')}>
                <input className="input" inputMode="numeric" value={moneyInputValue(form.discount_amount)} onChange={(event) => setForm({ ...form, discount_amount: normalizeMoneyInput(event.target.value) })} />
              </Field>
              <Field label={t('tax')}>
                <input className="input" inputMode="numeric" value={moneyInputValue(form.tax_amount)} onChange={(event) => setForm({ ...form, tax_amount: normalizeMoneyInput(event.target.value) })} />
              </Field>
              <Field label={t('total')}>
                <input className="input bg-slate-50" readOnly value={currency(totals.grandTotal, language)} />
              </Field>
            </div>
            <Field label={t('note')}>
              <textarea className="input min-h-24" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
            </Field>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Save size={17} />}
                {submitting ? t('saving') : t('save')}
              </button>
              <button className="btn-secondary" type="button" onClick={() => { setForm(emptyPurchaseForm); setItems([emptyPurchaseItem]); setFormMode(false) }}>
                <X size={17} />
                {t('cancel')}
              </button>
            </div>
          </form>
        </DataPanel>
      ) : (
        <DataPanel
          title={t('purchaseHistory')}
          actions={
            <div className="panel-toolbar">
              <SearchField placeholder={t('referenceNumber')} value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
              <DateRangeMenu
                dateFrom={dateFrom}
                dateTo={dateTo}
                onDateFromChange={(value) => { setDateFrom(value); setPage(1) }}
                onDateToChange={(value) => { setDateTo(value); setPage(1) }}
              >
                <button
                  className="action-menu-item"
                  type="button"
                  onClick={() => {
                    const query = dateRangeQuery(dateFrom, dateTo).toString()
                    void downloadBlob(`exports/purchases?${query}`, exportFilename('purchases', language), language).catch((error) => reportError(error, notify, setError))
                  }}
                >
                  <Download size={17} />
                  {t('exportCsv')}
                </button>
              </DateRangeMenu>
            </div>
          }
        >
          {loading ? <div className="mb-3"><LoadingInline text={t('loadingList')} /></div> : null}
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('referenceNumber')}</th>
                  <th>{t('purchaseDate')}</th>
                  <th>{t('supplier')}</th>
                  <th>{t('location')}</th>
                  <th>{t('total')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={7} />
                ) : purchases.length ? purchases.map((purchase, index) => (
                  <tr className="responsive-row" key={purchase.id}>
                    <td className="number-cell" data-label={t('rowNumber')}>{pagination.from + index}</td>
                    <td data-label={t('referenceNumber')}>{purchase.reference_number}</td>
                    <td data-label={t('purchaseDate')}>{dateTime(purchase.purchase_date, language)}</td>
                    <td data-label={t('supplier')}>{purchase.supplier?.name ?? '-'}</td>
                    <td data-label={t('location')}>{purchase.location?.name ?? '-'}</td>
                    <td data-label={t('total')}>{currency(purchase.grand_total, language)}</td>
                    <td data-label={t('status')}><span className="badge-green">{purchase.status}</span></td>
                  </tr>
                )) : (
                  <TableEmptyState columns={7} message={emptyMessage(debouncedSearch, t('noPurchases'), t)} />
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
        </DataPanel>
      )}
    </Section>
  )
}

function ProfitPage() {
  const { language, notify, t } = useAppUi()
  const [data, setData] = useState<ProfitReport | null>(null)
  const [dateFrom, setDateFrom] = useState(monthStartInputValue())
  const [dateTo, setDateTo] = useState(todayInputValue())
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setError('')
    const params = dateRangeQuery(dateFrom, dateTo)
    const profitPath = `reports/profit?${params.toString()}`
    setLoading(shouldShowLoading([profitPath]))
    try {
      const response = await cachedGet<ProfitReport>(profitPath)
      setData(response)
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [load, notify])

  const profitActions = (
    <div className="panel-toolbar">
      <DateRangeMenu
        dateFrom={dateFrom}
        dateTo={dateTo}
        onApply={() => void load().catch((error) => reportError(error, notify, setError))}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      >
        <button
          className="action-menu-item"
          type="button"
          onClick={() => {
            const query = dateRangeQuery(dateFrom, dateTo).toString()
            void downloadBlob(`exports/profit.csv?${query}`, exportFilename('profit', language), language).catch((error) => reportError(error, notify, setError))
          }}
        >
          <Download size={17} />
          {t('exportCsv')}
        </button>
        <button
          className="action-menu-item"
          type="button"
          onClick={() => {
            const query = dateRangeQuery(dateFrom, dateTo).toString()
            void downloadBlob(`exports/profit.pdf?${query}`, exportFilename('profit', language, 'pdf'), language).catch((error) => reportError(error, notify, setError))
          }}
        >
          <FileSpreadsheet size={17} />
          {t('exportPdf')}
        </button>
      </DateRangeMenu>
    </div>
  )

  return (
    <Section title={t('profitReport')}>
      <StatusMessage error={error || undefined} />
      {loading || !data ? (
        <DataPanel title={t('profitReport')} actions={profitActions}>
          <LoadingInline text={t('loadingReports')} />
        </DataPanel>
      ) : (
        <>
          <div className="dashboard-metrics">
            <KpiCard icon={WalletCards} label={t('revenue')} value={currency(data.summary.revenue, language)} tone="brand" />
            <KpiCard icon={Package} label={t('costOfGoodsSold')} value={currency(data.summary.cost_of_goods_sold, language)} tone="blue" />
            <KpiCard icon={Banknote} label={t('grossProfit')} value={currency(data.summary.gross_profit, language)} tone="amber" />
            <KpiCard icon={FileSpreadsheet} label={t('netProfit')} value={currency(data.summary.net_profit, language)} tone={data.summary.net_profit >= 0 ? 'brand' : 'red'} />
          </div>
          <DataPanel title={t('operationalExpenses')} actions={profitActions}>
            <div className="table-wrap">
              <table className="data-table responsive-table">
                <thead>
                  <tr>
                    <th className="number-cell">{t('rowNumber')}</th>
                    <th>{t('expenseCategory')}</th>
                    <th>{t('amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.expense_by_category.length ? data.expense_by_category.map((item, index) => (
                    <tr className="responsive-row" key={item.category}>
                      <td className="number-cell" data-label={t('rowNumber')}>{index + 1}</td>
                      <td data-label={t('expenseCategory')}>{item.category}</td>
                      <td data-label={t('amount')}>{currency(item.total, language)}</td>
                    </tr>
                  )) : (
                    <TableEmptyState columns={3} message={t('noOperationalExpenses')} />
                  )}
                </tbody>
              </table>
            </div>
          </DataPanel>
        </>
      )}
    </Section>
  )
}

function LowStockPage() {
  const { notify, t } = useAppUi()
  const [products, setProducts] = useState<Product[]>([])
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const [restockQuantity, setRestockQuantity] = useState('1')
  const [restockNotes, setRestockNotes] = useState('')
  const [restockSubmitting, setRestockSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<Product>([], 1))
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('per_page', String(LIST_PAGE_SIZE))
      if (debouncedSearch) params.set('search', debouncedSearch)
      const lowStockPath = `reports/low-stock?${params.toString()}`
      setLoading(shouldShowLoading([lowStockPath]))

      const response = await cachedGet<Paginated<Product>>(lowStockPath)
      setProducts(listData(response))
      setPagination(paginationInfo(response, page))
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [load, notify])

  function openRestock(product: Product) {
    setRestockProduct(product)
    setRestockQuantity(String(Math.max(product.min_stock - product.stock, 1)))
    setRestockNotes('')
  }

  async function submitRestock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!restockProduct) {
      return
    }

    setError('')
    setRestockSubmitting(true)

    try {
      await api.post('stock-movements', {
        notes: restockNotes || t('restockProduct'),
        product_id: restockProduct.id,
        quantity: Math.max(1, Number(restockQuantity || 1)),
        type: 'in',
      })
      clearGetCache()
      notify('success', t('restockSuccess'))
      setRestockProduct(null)
      setRestockQuantity('1')
      setRestockNotes('')
      await load()
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setRestockSubmitting(false)
    }
  }

  return (
    <Section title={t('lowStockAlerts')}>
      <StatusMessage error={error || undefined} />
      <DataPanel
        title={t('restockNeeded')}
        actions={
          <div className="panel-toolbar">
            <SearchField placeholder={t('searchProduct')} value={search} onChange={(value) => { setSearch(value); setPage(1) }} />
          </div>
        }
      >
        {loading ? <div className="mb-3"><LoadingInline text={t('loadingList')} /></div> : null}
        <div className="table-wrap">
          <table className="data-table responsive-table">
            <thead>
              <tr>
                <th className="number-cell">{t('rowNumber')}</th>
                <th>{t('product')}</th>
                <th>{t('category')}</th>
                <th>{t('stock')}</th>
                <th>{t('minimum')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows columns={6} />
              ) : products.length ? products.map((product, index) => (
                <tr className="responsive-row" key={product.id}>
                  <td className="number-cell" data-label={t('rowNumber')}>{pagination.from + index}</td>
                  <td data-label={t('product')}>
                    <div className="product-table-item">
                      <ProductAvatar product={product} size="sm" />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td data-label={t('category')}>{product.category?.name}</td>
                  <td data-label={t('stock')}><span className="badge-red">{product.stock} {product.unit}</span></td>
                  <td data-label={t('minimum')}>{product.min_stock}</td>
                  <td className="actions-cell" data-label={t('actions')}>
                    <button className="btn-secondary table-action-button" type="button" onClick={() => openRestock(product)}>
                      <Plus size={16} />
                      {t('restockProduct')}
                    </button>
                  </td>
                </tr>
              )) : (
                <TableEmptyState columns={6} message={debouncedSearch ? t('emptyLowStockSearch') : t('noLowStock')} />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
      </DataPanel>
      {restockProduct ? createPortal(
        <RestockDialog
          notes={restockNotes}
          product={restockProduct}
          quantity={restockQuantity}
          submitting={restockSubmitting}
          onClose={() => {
            if (!restockSubmitting) {
              setRestockProduct(null)
            }
          }}
          onNotesChange={setRestockNotes}
          onQuantityChange={setRestockQuantity}
          onSubmit={submitRestock}
        />,
        document.body,
      ) : null}
    </Section>
  )
}

function RestockDialog({
  notes,
  onClose,
  onNotesChange,
  onQuantityChange,
  onSubmit,
  product,
  quantity,
  submitting,
}: {
  notes: string
  onClose: () => void
  onNotesChange: (value: string) => void
  onQuantityChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  product: Product
  quantity: string
  submitting: boolean
}) {
  const { t } = useAppUi()

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, submitting])

  return (
    <div className="feedback-modal-backdrop" onClick={() => !submitting && onClose()}>
      <form
        aria-modal="true"
        className="feedback-modal restock-modal"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="feedback-modal-mark">
          <Plus size={22} />
        </div>
        <h2 className="feedback-modal-title">{t('restockProduct')}</h2>
        <div className="restock-product-summary">
          <ProductAvatar product={product} />
          <div>
            <strong>{product.name}</strong>
            <span>{product.stock} {product.unit} · {t('minimum')} {product.min_stock}</span>
          </div>
        </div>
        <Field label={t('restockQuantity')}>
          <input
            className="input"
            min="1"
            type="number"
            value={quantity}
            onChange={(event) => onQuantityChange(event.target.value)}
            required
          />
        </Field>
        <Field label={t('note')}>
          <textarea className="input min-h-20" value={notes} onChange={(event) => onNotesChange(event.target.value)} />
        </Field>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn-secondary" disabled={submitting} type="button" onClick={onClose}>
            {t('cancel')}
          </button>
          <button className="btn-primary" disabled={submitting} type="submit">
            {submitting ? <Spinner /> : <Save size={17} />}
            {submitting ? t('saving') : t('restockSave')}
          </button>
        </div>
      </form>
    </div>
  )
}

function ReportsPage() {
  const { language, notify, t } = useAppUi()
  const [data, setData] = useState<DashboardData | null>(null)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState(monthStartInputValue())
  const [dateTo, setDateTo] = useState(todayInputValue())
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const filteredTopProducts = useMemo(
    () => (data?.top_products ?? []).filter((product) => textMatchesSearch(debouncedSearch, [
      product.product_name,
      product.quantity_sold,
      product.revenue,
    ])),
    [data, debouncedSearch],
  )

  const load = useCallback(() => {
    const params = dateRangeQuery(dateFrom, dateTo)
    const dashboardPath = `dashboard?${params.toString()}`
    if (shouldShowLoading([dashboardPath])) {
      setData(null)
    }
    setError('')

    return cachedGet<DashboardData>(dashboardPath)
      .then((data) => setData(data))
      .catch((error) => reportError(error, notify, setError))
  }, [dateFrom, dateTo, notify])

  useEffect(() => {
    load()
  }, [load])

  if (!data && error) {
    return <StatusMessage error={error} />
  }

  if (!data) {
    return (
      <Section title={t('salesReport')}>
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartPanel title={t('dailyTransactions')}>
            <ChartSkeleton />
          </ChartPanel>
          <ChartPanel title={t('paymentStatus')}>
            <ChartSkeleton />
          </ChartPanel>
        </div>
        <DataPanel
          title={t('topProducts')}
          actions={<ReportsActions dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} search={search} onSearchChange={setSearch} />}
        >
          <div className="mb-3">
            <LoadingInline text={t('loadingReports')} />
          </div>
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('product')}</th>
                  <th>{t('soldQuantity')}</th>
                  <th>{t('revenue')}</th>
                </tr>
              </thead>
              <tbody>
                <TableSkeletonRows columns={4} />
              </tbody>
            </table>
          </div>
        </DataPanel>
      </Section>
    )
  }

  return (
    <Section title={t('salesReport')}>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartPanel title={t('dailyTransactions')}>
          <Suspense fallback={<ChartSkeleton />}>
            <DailyTransactionsChart data={data.revenue_by_day} />
          </Suspense>
        </ChartPanel>
        <ChartPanel title={t('paymentStatus')}>
          <Suspense fallback={<ChartSkeleton />}>
            <PaymentStatusChart data={data.payment_status} />
          </Suspense>
        </ChartPanel>
      </div>
      <DataPanel
        title={t('topProducts')}
        actions={<ReportsActions dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} search={search} onSearchChange={setSearch} />}
      >
        <div className="table-wrap">
          <table className="data-table responsive-table">
            <thead>
              <tr>
                <th className="number-cell">{t('rowNumber')}</th>
                <th>{t('product')}</th>
                <th>{t('soldQuantity')}</th>
                <th>{t('revenue')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTopProducts.length ? filteredTopProducts.map((product, index) => (
                <tr className="responsive-row" key={product.product_id}>
                  <td className="number-cell" data-label={t('rowNumber')}>{index + 1}</td>
                  <td data-label={t('product')}>{product.product_name}</td>
                  <td data-label={t('soldQuantity')}>{product.quantity_sold}</td>
                  <td data-label={t('revenue')}>{currency(product.revenue, language)}</td>
                </tr>
              )) : (
                <TableEmptyState columns={4} message={emptyMessage(debouncedSearch, t('noTopProducts'), t)} />
              )}
            </tbody>
          </table>
        </div>
      </DataPanel>
    </Section>
  )
}

function ReportsActions({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onSearchChange,
  search,
}: {
  dateFrom: string
  dateTo: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onSearchChange: (value: string) => void
  search: string
}) {
  const { language, notify, t } = useAppUi()

  return (
    <div className="panel-toolbar">
      <SearchField placeholder={t('searchReportProduct')} value={search} onChange={onSearchChange} />
      <DateRangeMenu
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
      >
        <button
          className="action-menu-item"
          type="button"
          onClick={() => {
            const query = dateRangeQuery(dateFrom, dateTo).toString()
            void downloadBlob(`exports/sales?${query}`, exportFilename('salesReport', language), language).catch((error) => notify('error', apiErrorMessage(error)))
          }}
        >
          <Download size={17} />
          {t('exportCsv')}
        </button>
        <button
          className="action-menu-item"
          type="button"
          onClick={() => {
            const query = dateRangeQuery(dateFrom, dateTo).toString()
            void downloadBlob(`exports/sales.pdf?${query}`, exportFilename('salesReport', language, 'pdf'), language).catch((error) => notify('error', apiErrorMessage(error)))
          }}
        >
          <FileSpreadsheet size={17} />
          {t('exportPdf')}
        </button>
      </DateRangeMenu>
    </div>
  )
}

function AuditPage() {
  const { language, notify, t } = useAppUi()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>(() => paginationInfo<AuditLog>([], 1))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('per_page', String(LIST_PAGE_SIZE))
    if (debouncedSearch) params.set('search', debouncedSearch)
    const auditPath = `audit-logs?${params.toString()}`
    setLoading(shouldShowLoading([auditPath]))

    cachedGet<Paginated<AuditLog>>(auditPath)
      .then((data) => {
        setLogs(listData(data))
        setPagination(paginationInfo(data, page))
      })
      .catch((error) => reportError(error, notify, setError))
      .finally(() => setLoading(false))
  }, [debouncedSearch, notify, page])

  return (
    <Section title={t('auditLog')}>
      <StatusMessage error={error || undefined} />
      <DataPanel
        title={t('systemActivity')}
        actions={
          <div className="panel-toolbar">
            <SearchField
              placeholder={t('searchAudit')}
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
            />
          </div>
        }
      >
        {loading ? (
          <div className="mb-3">
            <LoadingInline text={t('loadingList')} />
          </div>
        ) : null}
        <div className="table-wrap">
          <table className="data-table responsive-table">
            <thead>
              <tr>
                <th className="number-cell">{t('rowNumber')}</th>
                <th>{t('time')}</th>
                <th>{t('user')}</th>
                <th>{t('event')}</th>
                <th>{t('target')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeletonRows columns={5} />
              ) : logs.length ? logs.map((log, index) => (
                <tr className="responsive-row" key={log.id}>
                  <td className="number-cell" data-label={t('rowNumber')}>{pagination.from + index}</td>
                  <td data-label={t('time')}>{dateTime(log.created_at, language)}</td>
                  <td data-label={t('user')}>{log.user?.name ?? t('system')}</td>
                  <td data-label={t('event')}>{auditEventLabel(log.event, language)}</td>
                  <td data-label={t('target')}>{auditTargetLabel(log, language)}</td>
                </tr>
              )) : (
                <TableEmptyState columns={5} message={emptyMessage(debouncedSearch, t('noAuditLogs'), t)} />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls loading={loading} meta={pagination} onPageChange={setPage} />
      </DataPanel>
    </Section>
  )
}

type UserForm = {
  name: string
  email: string
  password: string
  role: Role
  permissions: string[]
  is_active: boolean
}

const emptyUserForm: UserForm = {
  email: '',
  is_active: true,
  name: '',
  password: '',
  permissions: [],
  role: 'staff',
}

const permissionOptions: Array<{ key: string; labelKey: TranslationKey }> = [
  { key: 'products.delete', labelKey: 'allowDeleteProducts' },
  { key: 'categories.delete', labelKey: 'allowDeleteCategories' },
  { key: 'customers.delete', labelKey: 'allowDeleteCustomers' },
  { key: 'sales.cancel', labelKey: 'allowCancelSales' },
  { key: 'sales.refund', labelKey: 'allowRefundSales' },
  { key: 'reports.profit.view', labelKey: 'allowProfitReport' },
  { key: 'expenses.manage', labelKey: 'allowManageExpenses' },
  { key: 'purchases.manage', labelKey: 'allowManagePurchases' },
]

function UsersPage() {
  const { notify, t } = useAppUi()
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState<UserForm>(emptyUserForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search.trim())
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formMode, setFormMode] = useState(false)
  const filteredUsers = useMemo(
    () => users.filter((account) => textMatchesSearch(debouncedSearch, [
      account.name,
      account.email,
      roleLabel(account.role, t),
      account.is_active ? t('active') : t('inactive'),
    ])),
    [debouncedSearch, t, users],
  )
  const pagedUsers = clientPage(filteredUsers, page)

  async function load() {
    setLoading(shouldShowLoading(['users']))
    try {
      const data = await cachedGet<User[]>('users')
      setUsers(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load().catch((error) => reportError(error, notify, setError))
  }, [notify])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    const payload = editingId && !form.password ? { ...form, password: undefined } : form

    try {
      if (editingId) {
        await api.put(`users/${editingId}`, payload)
        clearGetCache()
        notify('success', t('userUpdated'))
      } else {
        await api.post('users', payload)
        clearGetCache()
        notify('success', t('userCreated'))
      }
      setForm(emptyUserForm)
      setEditingId(null)
      await load()
      setFormMode(false)
    } catch (error) {
      reportError(error, notify, setError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section
      title={formMode ? (editingId ? t('userEdit') : t('userNew')) : t('userManagement')}
      actions={
        formMode ? (
          <BackToListButton
            onClick={() => {
              setForm(emptyUserForm)
              setEditingId(null)
              setFormMode(false)
            }}
          />
        ) : (
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setForm(emptyUserForm)
              setEditingId(null)
              setFormMode(true)
            }}
          >
            <Plus size={17} />
            {t('userNew')}
          </button>
        )
      }
    >
      <StatusMessage error={error || undefined} />
      {formMode ? (
        <DataPanel title={editingId ? t('userEdit') : t('userNew')}>
          <form noValidate onSubmit={submit}>
            <Field label={t('name')}>
              <input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <Field label={t('email')}>
              <input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
            </Field>
            <Field label={t('password')}>
              <input className="input" minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!editingId} />
            </Field>
            <Field label={t('role')}>
              <select className="input" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
                <option value="admin">{t('admin')}</option>
                <option value="staff">{t('staff')}</option>
                <option value="owner">{t('owner')}</option>
              </select>
            </Field>
            <label className="mb-4 flex items-center gap-2 text-sm">
              <input checked={form.is_active} type="checkbox" onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />
              {t('active')}
            </label>
            <Field label={t('permissions')}>
              <div className="permission-grid">
                {permissionOptions.map((permission) => (
                  <label key={permission.key} className="permission-option">
                    <input
                      checked={form.permissions.includes(permission.key)}
                      type="checkbox"
                      onChange={(event) => {
                        setForm((current) => ({
                          ...current,
                          permissions: event.target.checked
                            ? [...current.permissions, permission.key]
                            : current.permissions.filter((item) => item !== permission.key),
                        }))
                      }}
                    />
                    <span>{t(permission.labelKey)}</span>
                  </label>
                ))}
              </div>
            </Field>
            <div className="flex gap-2">
              <button className="btn-primary" disabled={submitting} type="submit">
                {submitting ? <Spinner /> : <Save size={17} />}
                {submitting ? t('saving') : t('save')}
              </button>
              <button className="btn-secondary" type="button" onClick={() => { setForm(emptyUserForm); setEditingId(null); setFormMode(false) }}>
                <X size={17} />
                {t('cancel')}
              </button>
            </div>
          </form>
        </DataPanel>
      ) : (
        <DataPanel
          title={t('userList')}
          actions={
            <div className="panel-toolbar">
              <SearchField
                placeholder={t('searchUser')}
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setPage(1)
                }}
              />
            </div>
          }
        >
          {loading ? (
            <div className="mb-3">
              <LoadingInline text={t('loadingList')} />
            </div>
          ) : null}
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th className="number-cell">{t('rowNumber')}</th>
                  <th>{t('name')}</th>
                  <th>{t('email')}</th>
                  <th>{t('role')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableSkeletonRows columns={6} />
                ) : pagedUsers.items.length ? pagedUsers.items.map((account, index) => (
                  <tr className="responsive-row" key={account.id}>
                    <td className="number-cell" data-label={t('rowNumber')}>{pagedUsers.meta.from + index}</td>
                    <td data-label={t('name')}>{account.name}</td>
                    <td data-label={t('email')}>{account.email}</td>
                    <td data-label={t('role')}>{roleLabel(account.role, t)}</td>
                    <td data-label={t('status')}>{account.is_active ? t('active') : t('inactive')}</td>
                    <td className="actions-cell" data-label={t('actions')}>
                      <RowActions
                        onEdit={() => {
                          setEditingId(account.id)
                          setForm({
                            email: account.email,
                            is_active: account.is_active,
                            name: account.name,
                            password: '',
                            permissions: account.permissions ?? [],
                            role: account.role,
                          })
                          setFormMode(true)
                        }}
                        itemName={account.name}
                        successMessage={t('userDeleted')}
                        onRemove={async () => {
                          await api.delete(`users/${account.id}`)
                          clearGetCache()
                          await load()
                        }}
                      />
                    </td>
                  </tr>
                )) : (
                  <TableEmptyState columns={6} message={emptyMessage(debouncedSearch, t('noUsers'), t)} />
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls loading={loading} meta={pagedUsers.meta} onPageChange={setPage} />
        </DataPanel>
      )}
    </Section>
  )
}

function SettingsPage() {
  const {
    language,
    languagePreference,
    notify,
    setLanguagePreference,
    setThemePreference,
    t,
    themePreference,
  } = useAppUi()
  const [storeForm, setStoreForm] = useState({
    address: '',
    default_tax_rate: '0',
    invoice_prefix: 'INV',
    phone: '',
    store_name: 'UMKM OpsHub',
  })
  const [settingsError, setSettingsError] = useState('')
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsSaving, setSettingsSaving] = useState(false)

  useEffect(() => {
    setSettingsLoading(shouldShowLoading(['store-settings']))
    cachedGet<StoreSetting>('store-settings')
      .then((settings) => {
        setStoreForm({
          address: settings.address ?? '',
          default_tax_rate: apiMoneyToInput(settings.default_tax_rate),
          invoice_prefix: settings.invoice_prefix,
          phone: settings.phone ?? '',
          store_name: settings.store_name,
        })
      })
      .catch((error) => reportError(error, notify, setSettingsError))
      .finally(() => setSettingsLoading(false))
  }, [notify])

  async function saveStoreSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSettingsError('')
    setSettingsSaving(true)

    try {
      await api.put('store-settings', {
        ...storeForm,
        default_tax_rate: toNumber(storeForm.default_tax_rate),
      })
      clearGetCache()
      window.dispatchEvent(new CustomEvent('opshub-store-name-updated', { detail: storeForm.store_name }))
      notify('success', t('settingSaved'))
    } catch (error) {
      reportError(error, notify, setSettingsError)
    } finally {
      setSettingsSaving(false)
    }
  }

  const themeOptions: Array<{
    icon: LucideIcon
    label: string
    value: ThemePreference
  }> = [
    { icon: Sun, label: t('light'), value: 'light' },
    { icon: Moon, label: t('dark'), value: 'dark' },
    { icon: Monitor, label: t('system'), value: 'system' },
  ]

  const languageOptions: Array<{
    label: string
    value: LanguagePreference
  }> = [
    { label: t('indonesia'), value: 'id' },
    { label: t('english'), value: 'en' },
    { label: t('system'), value: 'system' },
  ]

  return (
    <Section title={t('settingsTitle')}>
      <div className="grid gap-4 xl:grid-cols-2">
        <DataPanel title={t('theme')}>
          <p className="mb-4 text-sm text-slate-500">{t('themeHelp')}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {themeOptions.map((option) => (
              <button
                key={option.value}
                className={classNames(
                  'preference-button',
                  themePreference === option.value && 'preference-button-active',
                )}
                type="button"
                onClick={() => {
                  setThemePreference(option.value)
                  notify('success', t('settingSaved'))
                }}
              >
                <option.icon size={18} />
                {option.label}
              </button>
            ))}
          </div>
        </DataPanel>

        <DataPanel title={t('changeLanguage')}>
          <p className="mb-4 text-sm text-slate-500">{t('languageHelp')}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                className={classNames(
                  'preference-button',
                  languagePreference === option.value && 'preference-button-active',
                )}
                type="button"
                onClick={() => {
                  setLanguagePreference(option.value)
                  notify('success', t('settingSaved'))
                }}
              >
                <Languages size={18} />
                {option.label}
              </button>
            ))}
          </div>
        </DataPanel>
      </div>

      <DataPanel title={t('storeSettings')}>
        <StatusMessage error={settingsError || undefined} />
        {settingsLoading ? (
          <LoadingInline text={t('loadingData')} />
        ) : (
          <form noValidate onSubmit={saveStoreSettings}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('storeName')}>
                <input className="input" value={storeForm.store_name} onChange={(event) => setStoreForm({ ...storeForm, store_name: event.target.value })} required />
              </Field>
              <Field label={t('phone')}>
                <input className="input" value={storeForm.phone} onChange={(event) => setStoreForm({ ...storeForm, phone: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('invoicePrefix')}>
                <input className="input" value={storeForm.invoice_prefix} onChange={(event) => setStoreForm({ ...storeForm, invoice_prefix: event.target.value })} />
              </Field>
              <Field label={t('defaultTaxRate')}>
                <input className="input" inputMode="decimal" value={storeForm.default_tax_rate} onChange={(event) => setStoreForm({ ...storeForm, default_tax_rate: normalizeMoneyInput(event.target.value) })} />
              </Field>
            </div>
            <Field label={t('address')}>
              <textarea className="input min-h-24" value={storeForm.address} onChange={(event) => setStoreForm({ ...storeForm, address: event.target.value })} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary" disabled={settingsSaving} type="submit">
                {settingsSaving ? <Spinner /> : <Save size={17} />}
                {settingsSaving ? t('saving') : t('save')}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => void downloadBlob('backup/database', `opshub-backup-${todayInputValue()}.sqlite`).then(() => notify('success', t('settingSaved'))).catch((error) => reportError(error, notify, setSettingsError))}
              >
                <Database size={17} />
                {t('setupBackup')}
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-500">{currency(toNumber(storeForm.default_tax_rate), language).replace('Rp', '').trim()}%</p>
          </form>
        )}
      </DataPanel>

      <DataPanel title={t('noteTitle')}>
        <p className="text-sm leading-6 text-slate-600">{t('setupDescription')}</p>
      </DataPanel>
    </Section>
  )
}

function DeleteActionMenuItem({
  itemName,
  onRemove,
  successMessage,
}: {
  itemName?: string
  onRemove: () => void | boolean | Promise<void | boolean>
  successMessage?: string
}) {
  const { confirmAction, notify, t } = useAppUi()
  const [working, setWorking] = useState(false)

  async function handleRemove() {
    const confirmed = await confirmAction({
      confirmLabel: t('delete'),
      intent: 'danger',
      message: itemName
        ? `${t('deleteConfirmMessage')} (${itemName})`
        : t('deleteConfirmMessage'),
      title: t('deleteConfirmTitle'),
    })

    if (!confirmed) {
      return
    }

    try {
      setWorking(true)
      const removed = await onRemove()

      if (removed === false) {
        return
      }

      notify('success', successMessage ?? t('deleteSuccess'))
    } catch (error) {
      notify('error', apiErrorMessage(error))
    } finally {
      setWorking(false)
    }
  }

  return (
    <button
      className="action-menu-item action-menu-item-danger"
      disabled={working}
      type="button"
      onClick={() => void handleRemove()}
    >
      {working ? <Spinner /> : <Trash2 size={16} />}
      {working ? t('removing') : t('delete')}
    </button>
  )
}

function RowActions({
  itemName,
  onEdit,
  onRemove,
  successMessage,
}: {
  itemName?: string
  onEdit: () => void
  onRemove: () => void | boolean | Promise<void | boolean>
  successMessage?: string
}) {
  const { confirmAction, notify, t } = useAppUi()
  const [working, setWorking] = useState(false)

  async function handleRemove() {
    const confirmed = await confirmAction({
      confirmLabel: t('delete'),
      intent: 'danger',
      message: itemName
        ? `${t('deleteConfirmMessage')} (${itemName})`
        : t('deleteConfirmMessage'),
      title: t('deleteConfirmTitle'),
    })

    if (!confirmed) {
      return
    }

    try {
      setWorking(true)
      const removed = await onRemove()

      if (removed === false) {
        return
      }

      notify('success', successMessage ?? t('deleteSuccess'))
    } catch (error) {
      notify('error', apiErrorMessage(error))
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button className="icon-button" aria-label={t('edit')} disabled={working} type="button" onClick={onEdit}>
        <Edit3 size={16} />
      </button>
      <button
        className="icon-button danger"
        aria-label={t('delete')}
        disabled={working}
        title={working ? t('removing') : t('delete')}
        type="button"
        onClick={() => void handleRemove()}
      >
        {working ? <Spinner /> : <Trash2 size={16} />}
      </button>
    </div>
  )
}

export default App
