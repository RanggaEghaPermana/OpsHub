import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DashboardData } from './types'

const paymentColors = ['#0b78e3', '#38bdf8', '#f59e0b', '#ef4444']
type Language = 'id' | 'en'

function currency(value: number | string, language: Language) {
  return new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', {
    currency: 'IDR',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(Number(value))
}

export function RevenueChart({
  data,
  language,
}: {
  data: DashboardData['revenue_by_day']
  language: Language
}) {
  return (
    <div className="chart-canvas">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data}>
          <CartesianGrid stroke="var(--app-border)" strokeDasharray="4 10" vertical={false} />
          <XAxis axisLine={false} dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis axisLine={false} tick={{ fontSize: 12 }} tickLine={false} />
          <Tooltip formatter={(value) => currency(String(value), language)} />
          <Area dataKey="revenue" fill="#0b78e3" fillOpacity={0.18} stroke="#0b78e3" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function TopProductsChart({ data }: { data: DashboardData['top_products'] }) {
  return (
    <div className="chart-canvas">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="var(--app-border)" strokeDasharray="4 10" vertical={false} />
          <XAxis axisLine={false} dataKey="product_name" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis axisLine={false} tick={{ fontSize: 12 }} tickLine={false} />
          <Tooltip formatter={(value) => String(value)} />
          <Bar dataKey="quantity_sold" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function DailyTransactionsChart({ data }: { data: DashboardData['revenue_by_day'] }) {
  return (
    <div className="chart-canvas chart-canvas-tall">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data}>
          <XAxis axisLine={false} dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
          <YAxis axisLine={false} tick={{ fontSize: 12 }} tickLine={false} />
          <Tooltip />
          <Bar dataKey="transactions" fill="#0757c9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PaymentStatusChart({ data }: { data: DashboardData['payment_status'] }) {
  return (
    <div className="chart-canvas chart-canvas-tall">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie data={data} dataKey="total" nameKey="payment_status" outerRadius="72%">
            {data.map((status, index) => (
              <Cell key={status.payment_status} fill={paymentColors[index % paymentColors.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
