<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Support\AuditLogger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends Controller
{
    public function products(Request $request): StreamedResponse
    {
        $language = $this->language($request);

        return $this->csv($this->filename('products', $language), $this->headers('products', $language), function ($handle, string $delimiter) use ($language): void {
            Product::with('category:id,name')->orderBy('name')->chunk(500, function ($products) use ($delimiter, $handle, $language): void {
                foreach ($products as $product) {
                    fputcsv($handle, [
                        $product->sku,
                        $product->name,
                        $product->category?->name,
                        $product->unit,
                        $this->moneyValue($product->purchase_price),
                        $this->moneyValue($product->selling_price),
                        $product->stock,
                        $product->min_stock,
                        $this->activeLabel((bool) $product->is_active, $language),
                    ], $delimiter);
                }
            });
        }, $language);
    }

    public function customers(Request $request): StreamedResponse
    {
        $language = $this->language($request);

        return $this->csv($this->filename('customers', $language), $this->headers('customers', $language), function ($handle, string $delimiter) use ($language): void {
            Customer::orderBy('name')->chunk(500, function ($customers) use ($delimiter, $handle, $language): void {
                foreach ($customers as $customer) {
                    fputcsv($handle, [
                        $customer->name,
                        $customer->email,
                        $customer->phone,
                        $customer->address,
                        $this->dateTimeValue($customer->last_purchase_at, $language),
                        $this->activeLabel((bool) $customer->is_active, $language),
                    ], $delimiter);
                }
            });
        }, $language);
    }

    public function sales(Request $request): StreamedResponse
    {
        [$from, $to] = $this->dateRange($request);
        $language = $this->language($request);

        return $this->csv($this->filename('sales', $language), $this->headers('sales', $language), function ($handle, string $delimiter) use ($from, $language, $to): void {
            Sale::with(['customer:id,name', 'user:id,name'])
                ->whereBetween('sale_date', [$from, $to])
                ->orderBy('sale_date')
                ->chunk(500, function ($sales) use ($delimiter, $handle, $language): void {
                    foreach ($sales as $sale) {
                        fputcsv($handle, [
                            $sale->invoice_number,
                            $this->dateValue($sale->sale_date, $language),
                            $this->timeValue($sale->sale_date),
                            $sale->customer?->name ?? $this->generalCustomerLabel($language),
                            $sale->user?->name,
                            $this->moneyValue($sale->subtotal),
                            $this->moneyValue($sale->discount_amount),
                            $this->moneyValue($sale->tax_amount),
                            $this->moneyValue($sale->grand_total),
                            $this->moneyValue($sale->paid_amount),
                            $this->moneyValue($sale->change_amount),
                            $this->paymentMethodLabel((string) $sale->payment_method, $language),
                            $this->paymentStatusLabel((string) $sale->payment_status, $language),
                            $this->saleStatusLabel((string) $sale->status, $language),
                        ], $delimiter);
                    }
                });
        }, $language);
    }

    public function salesPdf(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $sales = Sale::with(['customer:id,name', 'user:id,name'])
            ->whereBetween('sale_date', [$from, $to])
            ->orderBy('sale_date')
            ->get();
        $logoPath = base_path('../frontend/public/logowhite.png');
        $logoData = file_exists($logoPath)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($logoPath))
            : null;

        $pdf = Pdf::loadView('reports.sales', [
            'dateFrom' => $from->toDateString(),
            'dateTo' => $to->toDateString(),
            'logoData' => $logoData,
            'sales' => $sales,
        ])->setPaper('a4');

        return $pdf->stream('laporan-penjualan-'.now()->format('Ymd-His').'.pdf');
    }

    public function purchases(Request $request): StreamedResponse
    {
        [$from, $to] = $this->dateRange($request);
        $language = $this->language($request);

        return $this->csv($this->filename('purchases', $language), $this->headers('purchases', $language), function ($handle, string $delimiter) use ($from, $language, $to): void {
            Purchase::with(['supplier:id,name', 'location:id,name'])
                ->whereBetween('purchase_date', [$from, $to])
                ->orderBy('purchase_date')
                ->chunk(500, function ($purchases) use ($delimiter, $handle, $language): void {
                    foreach ($purchases as $purchase) {
                        fputcsv($handle, [
                            $purchase->reference_number,
                            $this->dateValue($purchase->purchase_date, $language),
                            $this->timeValue($purchase->purchase_date),
                            $purchase->supplier?->name,
                            $purchase->location?->name,
                            $this->moneyValue($purchase->grand_total),
                            $this->genericStatusLabel((string) $purchase->status, $language),
                        ], $delimiter);
                    }
                });
        }, $language);
    }

    public function expenses(Request $request): StreamedResponse
    {
        [$from, $to] = $this->dateRange($request);
        $language = $this->language($request);

        return $this->csv($this->filename('expenses', $language), $this->headers('expenses', $language), function ($handle, string $delimiter) use ($from, $language, $to): void {
            Expense::with('location:id,name')
                ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
                ->orderBy('expense_date')
                ->chunk(500, function ($expenses) use ($delimiter, $handle, $language): void {
                    foreach ($expenses as $expense) {
                        fputcsv($handle, [
                            $this->dateValue($expense->expense_date, $language),
                            $expense->category,
                            $expense->title,
                            $expense->location?->name,
                            $this->moneyValue($expense->amount),
                            $this->paymentMethodLabel((string) $expense->payment_method, $language),
                            $expense->notes,
                        ], $delimiter);
                    }
                });
        }, $language);
    }

    public function profitCsv(Request $request): StreamedResponse
    {
        [$from, $to] = $this->dateRange($request);
        $language = $this->language($request);
        $summary = $this->profitSummary($from, $to);

        return $this->csv($this->filename('profit', $language), $this->headers('profit', $language), function ($handle, string $delimiter) use ($language, $summary): void {
            foreach ($summary as $label => $value) {
                fputcsv($handle, [$this->profitMetricLabel($label, $language), $this->moneyValue($value)], $delimiter);
            }
        }, $language);
    }

    public function profitPdf(Request $request)
    {
        [$from, $to] = $this->dateRange($request);
        $summary = $this->profitSummary($from, $to);
        $logoPath = base_path('../frontend/public/logowhite.png');
        $logoData = file_exists($logoPath)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($logoPath))
            : null;

        $pdf = Pdf::loadView('reports.profit', [
            'dateFrom' => $from->toDateString(),
            'dateTo' => $to->toDateString(),
            'logoData' => $logoData,
            'summary' => $summary,
        ])->setPaper('a4');

        return $pdf->stream('laporan-laba-rugi-'.now()->format('Ymd-His').'.pdf');
    }

    public function importProducts(Request $request): JsonResponse
    {
        $data = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ]);

        $file = $data['file'];
        $handle = fopen($file->getRealPath(), 'r');
        $firstLine = $handle ? fgets($handle) : false;
        $delimiter = is_string($firstLine) ? $this->detectDelimiter($firstLine) : ',';
        $headers = false;
        $created = 0;
        $updated = 0;
        $skipped = 0;

        if ($handle && is_string($firstLine)) {
            if (str_starts_with(strtolower(trim($firstLine)), 'sep=')) {
                $headers = fgetcsv($handle, 0, $delimiter);
            } else {
                rewind($handle);
                $headers = fgetcsv($handle, 0, $delimiter);
            }
        }

        if (! $handle || ! is_array($headers)) {
            return response()->json(['message' => 'File import tidak bisa dibaca.'], 422);
        }

        $normalizedHeaders = array_map(fn ($header) => $this->normalizeImportHeader((string) $header), $headers);

        DB::transaction(function () use ($delimiter, $handle, $normalizedHeaders, &$created, &$updated, &$skipped): void {
            while (($row = fgetcsv($handle, 0, $delimiter)) !== false) {
                $values = array_combine(
                    $normalizedHeaders,
                    array_slice(array_pad($row, count($normalizedHeaders), null), 0, count($normalizedHeaders))
                );

                if (! is_array($values) || empty($values['sku']) || empty($values['name'])) {
                    $skipped++;

                    continue;
                }

                $categoryName = trim((string) ($values['category'] ?? $values['kategori'] ?? 'Umum'));
                $category = Category::firstOrCreate(['name' => $categoryName ?: 'Umum'], [
                    'description' => 'Dibuat dari import produk',
                    'is_active' => true,
                ]);

                $product = Product::withTrashed()->updateOrCreate(
                    ['sku' => trim((string) $values['sku'])],
                    [
                        'category_id' => $category->id,
                        'name' => trim((string) $values['name']),
                        'unit' => trim((string) ($values['unit'] ?? $values['satuan'] ?? 'pcs')),
                        'purchase_price' => (float) ($values['purchase_price'] ?? $values['harga_beli'] ?? 0),
                        'selling_price' => (float) ($values['selling_price'] ?? $values['harga_jual'] ?? 0),
                        'stock' => (int) ($values['stock'] ?? $values['stok'] ?? 0),
                        'min_stock' => (int) ($values['min_stock'] ?? $values['stok_minimum'] ?? 5),
                        'is_active' => true,
                    ]
                );

                if ($product->trashed()) {
                    $product->restore();
                }

                $product->wasRecentlyCreated ? $created++ : $updated++;
            }
        });

        fclose($handle);
        AuditLogger::log('product.imported', null, null, compact('created', 'updated', 'skipped'));

        return response()->json(compact('created', 'updated', 'skipped'));
    }

    public function backup(): BinaryFileResponse|JsonResponse
    {
        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if (! is_string($database) || ! file_exists($database)) {
            return response()->json([
                'message' => 'Backup otomatis saat ini hanya tersedia untuk database file lokal.',
            ], 422);
        }

        return response()->download($database, 'opshub-backup-'.now()->format('Ymd-His').'.sqlite');
    }

    /**
     * @param  array<int, string>  $headers
     */
    private function csv(string $filename, array $headers, callable $callback, string $language = 'id'): StreamedResponse
    {
        $delimiter = ';';

        return response()->streamDownload(function () use ($delimiter, $headers, $callback): void {
            $handle = fopen('php://output', 'w');

            if (! $handle) {
                return;
            }

            fwrite($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fwrite($handle, "sep={$delimiter}\r\n");
            fputcsv($handle, $headers, $delimiter);
            $callback($handle, $delimiter);
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'X-OpsHub-Language' => $language,
        ]);
    }

    /**
     * @return array<int, string>
     */
    private function headers(string $type, string $language): array
    {
        $headers = [
            'id' => [
                'customers' => ['Nama pelanggan', 'Email', 'Telepon', 'Alamat', 'Terakhir beli', 'Status'],
                'expenses' => ['Tanggal biaya', 'Kategori biaya', 'Nama pengeluaran', 'Lokasi', 'Jumlah biaya', 'Metode pembayaran', 'Catatan'],
                'products' => ['SKU', 'Nama produk', 'Kategori', 'Satuan', 'Harga beli', 'Harga jual', 'Stok', 'Stok minimum', 'Status'],
                'profit' => ['Metrik', 'Nilai'],
                'purchases' => ['Nomor referensi', 'Tanggal pembelian', 'Waktu pembelian', 'Supplier', 'Lokasi', 'Total', 'Status'],
                'sales' => ['Faktur', 'Tanggal transaksi', 'Waktu transaksi', 'Pelanggan', 'Kasir', 'Subtotal', 'Diskon', 'Pajak', 'Total', 'Dibayar', 'Kembalian', 'Metode pembayaran', 'Status pembayaran', 'Status transaksi'],
            ],
            'en' => [
                'customers' => ['Customer name', 'Email', 'Phone', 'Address', 'Last purchase', 'Status'],
                'expenses' => ['Expense date', 'Expense category', 'Expense name', 'Location', 'Amount', 'Payment method', 'Notes'],
                'products' => ['SKU', 'Product name', 'Category', 'Unit', 'Purchase price', 'Selling price', 'Stock', 'Minimum stock', 'Status'],
                'profit' => ['Metric', 'Value'],
                'purchases' => ['Reference number', 'Purchase date', 'Purchase time', 'Supplier', 'Location', 'Total', 'Status'],
                'sales' => ['Invoice', 'Transaction date', 'Transaction time', 'Customer', 'Cashier', 'Subtotal', 'Discount', 'Tax', 'Total', 'Paid', 'Change', 'Payment method', 'Payment status', 'Transaction status'],
            ],
        ];

        return $headers[$language][$type] ?? $headers['id'][$type] ?? [];
    }

    private function filename(string $type, string $language): string
    {
        $names = [
            'id' => [
                'customers' => 'pelanggan',
                'expenses' => 'pengeluaran',
                'products' => 'produk',
                'profit' => 'laba-rugi',
                'purchases' => 'pembelian',
                'sales' => 'transaksi',
            ],
            'en' => [
                'customers' => 'customers',
                'expenses' => 'expenses',
                'products' => 'products',
                'profit' => 'profit-loss',
                'purchases' => 'purchases',
                'sales' => 'transactions',
            ],
        ];

        $name = $names[$language][$type] ?? $names['id'][$type] ?? $type;

        return $name.'-'.now()->format('Ymd-His').'.csv';
    }

    private function language(Request $request): string
    {
        return $request->query('lang') === 'en' ? 'en' : 'id';
    }

    private function moneyValue(float|int|string|null $value): string
    {
        $number = (float) ($value ?? 0);

        if (abs($number - round($number)) < 0.00001) {
            return (string) (int) round($number);
        }

        return rtrim(rtrim(number_format($number, 2, '.', ''), '0'), '.');
    }

    private function dateValue($value, string $language): string
    {
        if (! $value) {
            return '';
        }

        $date = $value instanceof Carbon ? $value : Carbon::parse($value);

        return $language === 'en'
            ? $date->format('m/d/Y')
            : $date->format('d/m/Y');
    }

    private function timeValue($value): string
    {
        if (! $value) {
            return '';
        }

        $date = $value instanceof Carbon ? $value : Carbon::parse($value);

        return $date->format('H:i');
    }

    private function dateTimeValue($value, string $language): string
    {
        if (! $value) {
            return '';
        }

        return trim($this->dateValue($value, $language).' '.$this->timeValue($value));
    }

    private function activeLabel(bool $active, string $language): string
    {
        if ($language === 'en') {
            return $active ? 'Active' : 'Inactive';
        }

        return $active ? 'Aktif' : 'Nonaktif';
    }

    private function generalCustomerLabel(string $language): string
    {
        return $language === 'en' ? 'Walk-in customer' : 'Pelanggan umum';
    }

    private function paymentMethodLabel(string $method, string $language): string
    {
        $labels = [
            'id' => [
                'card' => 'Kartu',
                'cash' => 'Tunai',
                'qris' => 'QRIS',
                'transfer' => 'Transfer',
            ],
            'en' => [
                'card' => 'Card',
                'cash' => 'Cash',
                'qris' => 'QRIS',
                'transfer' => 'Transfer',
            ],
        ];

        return $labels[$language][$method] ?? $method;
    }

    private function paymentStatusLabel(string $status, string $language): string
    {
        $labels = [
            'id' => [
                'paid' => 'Lunas',
                'partial' => 'Sebagian',
                'refunded' => 'Dikembalikan',
                'unpaid' => 'Belum lunas',
            ],
            'en' => [
                'paid' => 'Paid',
                'partial' => 'Partial',
                'refunded' => 'Refunded',
                'unpaid' => 'Unpaid',
            ],
        ];

        return $labels[$language][$status] ?? $this->genericStatusLabel($status, $language);
    }

    private function saleStatusLabel(string $status, string $language): string
    {
        $labels = [
            'id' => [
                'cancelled' => 'Dibatalkan',
                'completed' => 'Selesai',
                'refunded' => 'Dikembalikan',
            ],
            'en' => [
                'cancelled' => 'Cancelled',
                'completed' => 'Completed',
                'refunded' => 'Refunded',
            ],
        ];

        return $labels[$language][$status] ?? $this->genericStatusLabel($status, $language);
    }

    private function genericStatusLabel(string $status, string $language): string
    {
        $labels = [
            'id' => [
                'cancelled' => 'Dibatalkan',
                'completed' => 'Selesai',
                'draft' => 'Draf',
                'paid' => 'Lunas',
                'pending' => 'Menunggu',
                'refunded' => 'Dikembalikan',
            ],
            'en' => [
                'cancelled' => 'Cancelled',
                'completed' => 'Completed',
                'draft' => 'Draft',
                'paid' => 'Paid',
                'pending' => 'Pending',
                'refunded' => 'Refunded',
            ],
        ];

        return $labels[$language][$status] ?? $status;
    }

    private function profitMetricLabel(string $metric, string $language): string
    {
        $labels = [
            'id' => [
                'harga_modal' => 'Harga modal terjual',
                'laba_bersih' => 'Laba bersih',
                'laba_kotor' => 'Laba kotor',
                'omzet' => 'Omzet',
                'pengeluaran' => 'Pengeluaran',
                'transaksi' => 'Jumlah transaksi',
            ],
            'en' => [
                'harga_modal' => 'Cost of goods sold',
                'laba_bersih' => 'Net profit',
                'laba_kotor' => 'Gross profit',
                'omzet' => 'Revenue',
                'pengeluaran' => 'Expenses',
                'transaksi' => 'Transaction count',
            ],
        ];

        return $labels[$language][$metric] ?? $metric;
    }

    private function detectDelimiter(string $line): string
    {
        $trimmed = strtolower(trim($line));

        if (str_starts_with($trimmed, 'sep=') && strlen($trimmed) >= 5) {
            return substr($trimmed, 4, 1);
        }

        $semicolonCount = substr_count($line, ';');
        $commaCount = substr_count($line, ',');

        return $semicolonCount > $commaCount ? ';' : ',';
    }

    private function normalizeImportHeader(string $header): string
    {
        $normalized = str($header)
            ->replace(chr(0xEF).chr(0xBB).chr(0xBF), '')
            ->lower()
            ->replace([' ', '-', '.'], '_')
            ->toString();

        $aliases = [
            'category' => 'category',
            'harga_beli' => 'purchase_price',
            'harga_jual' => 'selling_price',
            'kategori' => 'category',
            'minimum_stock' => 'min_stock',
            'nama' => 'name',
            'nama_produk' => 'name',
            'product_name' => 'name',
            'purchase_price' => 'purchase_price',
            'satuan' => 'unit',
            'selling_price' => 'selling_price',
            'sku' => 'sku',
            'stok' => 'stock',
            'stok_minimum' => 'min_stock',
            'stock' => 'stock',
            'unit' => 'unit',
        ];

        return $aliases[$normalized] ?? $normalized;
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function dateRange(Request $request): array
    {
        $from = $request->date('date_from')?->startOfDay() ?? now()->startOfMonth();
        $to = $request->date('date_to')?->endOfDay() ?? now()->endOfDay();

        return [$from, $to];
    }

    /**
     * @return array<string, float|int>
     */
    private function profitSummary($from, $to): array
    {
        $salesQuery = Sale::query()
            ->where('status', 'completed')
            ->whereBetween('sale_date', [$from, $to]);

        $revenue = (float) (clone $salesQuery)->sum('grand_total');
        $transactions = (clone $salesQuery)->count();
        $costOfGoodsSold = (float) DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->sum(DB::raw('sale_items.quantity * COALESCE(products.purchase_price, 0)'));
        $expenses = (float) Expense::whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])->sum('amount');
        $grossProfit = $revenue - $costOfGoodsSold;

        return [
            'omzet' => $revenue,
            'transaksi' => $transactions,
            'harga_modal' => $costOfGoodsSold,
            'laba_kotor' => $grossProfit,
            'pengeluaran' => $expenses,
            'laba_bersih' => $grossProfit - $expenses,
        ];
    }
}
