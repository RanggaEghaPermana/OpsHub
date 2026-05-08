export type Role = 'admin' | 'staff' | 'owner'

export type User = {
  id: number
  name: string
  email: string
  role: Role
  permissions?: string[] | null
  is_active: boolean
}

export type Category = {
  id: number
  name: string
  description?: string | null
  is_active: boolean
  products_count?: number
}

export type Product = {
  id: number
  category_id: number
  category?: Category
  sku: string
  name: string
  description?: string | null
  image_path?: string | null
  image_url?: string | null
  unit: string
  purchase_price: string
  selling_price: string
  stock: number
  min_stock: number
  is_active: boolean
  is_low_stock: boolean
}

export type Customer = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  is_active: boolean
  last_purchase_at?: string | null
  sales?: Sale[]
}

export type SaleItem = {
  id: number
  product_id: number
  product_sku: string
  product_name: string
  quantity: number
  unit_price: string
  discount_amount: string
  line_total: string
}

export type Sale = {
  id: number
  invoice_number: string
  customer?: Customer | null
  user?: User
  sale_date: string
  subtotal: string
  discount_amount: string
  tax_amount: string
  grand_total: string
  paid_amount: string
  change_amount: string
  payment_method: string
  payment_status: string
  status: string
  refunded_at?: string | null
  refund_reason?: string | null
  items?: SaleItem[]
}

export type StockMovement = {
  id: number
  product?: Product
  user?: User | null
  type: 'in' | 'out' | 'adjustment' | 'sale' | 'sale_void'
  quantity: number
  stock_before: number
  stock_after: number
  notes?: string | null
  created_at: string
}

export type Location = {
  id: number
  name: string
  type: 'store' | 'warehouse'
  phone?: string | null
  address?: string | null
  is_active: boolean
}

export type Supplier = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  is_active: boolean
}

export type PurchaseItem = {
  id: number
  product_id: number
  product_sku: string
  product_name: string
  quantity: number
  unit_cost: string
  line_total: string
}

export type Purchase = {
  id: number
  supplier?: Supplier | null
  location?: Location | null
  user?: User | null
  reference_number?: string | null
  purchase_date: string
  subtotal?: string
  discount_amount?: string
  tax_amount?: string
  grand_total: string
  status: string
  notes?: string | null
  items?: PurchaseItem[]
}

export type Expense = {
  id: number
  location?: Location | null
  user?: User | null
  category: string
  title: string
  amount: string
  expense_date: string
  payment_method?: string | null
  notes?: string | null
}

export type StoreSetting = {
  id: number
  store_name: string
  phone?: string | null
  address?: string | null
  default_tax_rate: string
  invoice_prefix: string
}

export type ProfitReport = {
  date_from: string
  date_to: string
  summary: {
    revenue: number
    transactions: number
    discounts: number
    taxes: number
    cost_of_goods_sold: number
    gross_profit: number
    expenses: number
    net_profit: number
    purchases: number
  }
  expense_by_category: Array<{
    category: string
    total: string | number
  }>
}

export type AuditLog = {
  id: number
  user?: User | null
  event: string
  auditable_type?: string | null
  auditable_id?: number | null
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  created_at: string
}

export type Paginated<T> = {
  current_page?: number
  data: T[]
  from?: number | null
  last_page?: number
  per_page?: number | string
  to?: number | null
  total?: number
}

export type DashboardData = {
  cards: {
    revenue: number
    transactions: number
    active_customers: number
    low_stock_products: number
  }
  revenue_by_day: Array<{
    date: string
    revenue: string | number
    transactions: number
  }>
  top_products: Array<{
    product_id: number
    product_name: string
    quantity_sold: number
    revenue: string | number
  }>
  low_stock_products: Product[]
  payment_status: Array<{
    payment_status: string
    total: number
  }>
}
