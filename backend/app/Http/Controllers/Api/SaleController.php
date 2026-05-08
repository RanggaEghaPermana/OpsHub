<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\StoreSetting;
use App\Support\AuditLogger;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $sales = Sale::query()
            ->select([
                'id',
                'invoice_number',
                'customer_id',
                'user_id',
                'sale_date',
                'grand_total',
                'paid_amount',
                'change_amount',
                'payment_method',
                'payment_status',
                'status',
                'refunded_at',
                'refund_reason',
            ])
            ->with(['customer:id,name', 'user:id,name'])
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('user', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->string('payment_status')->toString(), fn ($query, string $status) => $query->where('payment_status', $status))
            ->when($request->date('date_from'), fn ($query, $date) => $query->where('sale_date', '>=', $date->startOfDay()))
            ->when($request->date('date_to'), fn ($query, $date) => $query->where('sale_date', '<=', $date->endOfDay()))
            ->latest('sale_date')
            ->paginate($request->integer('per_page', 20));

        return response()->json($sales);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_id' => ['nullable', 'exists:customers,id'],
            'sale_date' => ['nullable', 'date'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'paid_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['required', 'string', 'max:60'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $sale = DB::transaction(function () use ($data) {
            $items = collect($data['items']);
            $productIds = $items->pluck('product_id')->all();
            $products = Product::whereIn('id', $productIds)->lockForUpdate()->get()->keyBy('id');

            $preparedItems = [];
            $subtotal = 0;

            foreach ($items as $item) {
                /** @var Product|null $product */
                $product = $products->get($item['product_id']);

                if (! $product || ! $product->is_active) {
                    throw ValidationException::withMessages([
                        'items' => ['Produk tidak aktif atau tidak ditemukan.'],
                    ]);
                }

                if ($product->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'items' => ["Stok {$product->name} tidak cukup."],
                    ]);
                }

                $unitPrice = (float) ($item['unit_price'] ?? $product->selling_price);
                $lineDiscount = (float) ($item['discount_amount'] ?? 0);
                $lineTotal = max(0, ($unitPrice * (int) $item['quantity']) - $lineDiscount);
                $subtotal += $lineTotal;

                $preparedItems[] = compact('product', 'unitPrice', 'lineDiscount', 'lineTotal') + [
                    'quantity' => (int) $item['quantity'],
                ];
            }

            $discountAmount = (float) ($data['discount_amount'] ?? 0);
            $taxAmount = (float) ($data['tax_amount'] ?? 0);
            $grandTotal = max(0, $subtotal - $discountAmount + $taxAmount);
            $paidAmount = (float) ($data['paid_amount'] ?? 0);

            $sale = Sale::create([
                'invoice_number' => $this->nextInvoiceNumber(),
                'customer_id' => $data['customer_id'] ?? null,
                'user_id' => request()->user()->id,
                'sale_date' => $data['sale_date'] ?? now(),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'change_amount' => max(0, $paidAmount - $grandTotal),
                'payment_method' => $data['payment_method'],
                'payment_status' => $this->paymentStatus($paidAmount, $grandTotal),
                'status' => 'completed',
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($preparedItems as $preparedItem) {
                /** @var Product $product */
                $product = $preparedItem['product'];
                $stockBefore = $product->stock;
                $stockAfter = $stockBefore - $preparedItem['quantity'];

                $sale->items()->create([
                    'product_id' => $product->id,
                    'product_sku' => $product->sku,
                    'product_name' => $product->name,
                    'quantity' => $preparedItem['quantity'],
                    'unit_price' => $preparedItem['unitPrice'],
                    'discount_amount' => $preparedItem['lineDiscount'],
                    'line_total' => $preparedItem['lineTotal'],
                ]);

                $product->update(['stock' => $stockAfter]);

                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => request()->user()->id,
                    'sale_id' => $sale->id,
                    'type' => 'sale',
                    'quantity' => $preparedItem['quantity'],
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'notes' => 'Penjualan '.$sale->invoice_number,
                ]);
            }

            if (! empty($data['customer_id'])) {
                Customer::whereKey($data['customer_id'])->update(['last_purchase_at' => now()->toDateString()]);
            }

            AuditLogger::log('sale.created', $sale, null, $sale->load('items')->toArray());

            return $sale;
        });

        return response()->json($sale->load(['customer', 'user', 'items.product']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Sale $sale): JsonResponse
    {
        return response()->json($sale->load(['customer', 'user', 'items.product']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Sale $sale): JsonResponse
    {
        $data = $request->validate([
            'paid_amount' => ['sometimes', 'numeric', 'min:0'],
            'payment_method' => ['sometimes', 'string', 'max:60'],
            'payment_status' => ['sometimes', Rule::in(['unpaid', 'partial', 'paid', 'refunded'])],
            'notes' => ['nullable', 'string'],
        ]);

        $oldValues = $sale->toArray();

        if (array_key_exists('paid_amount', $data) && ! array_key_exists('payment_status', $data)) {
            $data['payment_status'] = $this->paymentStatus((float) $data['paid_amount'], (float) $sale->grand_total);
            $data['change_amount'] = max(0, (float) $data['paid_amount'] - (float) $sale->grand_total);
        }

        $sale->update($data);
        AuditLogger::log('sale.updated', $sale, $oldValues, $sale->fresh()->toArray());

        return response()->json($sale->fresh()->load(['customer', 'user', 'items.product']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale): JsonResponse
    {
        if (in_array($sale->status, ['cancelled', 'refunded'], true)) {
            return response()->json($sale->load(['items.product']));
        }

        DB::transaction(function () use ($sale): void {
            $sale->load('items.product');

            foreach ($sale->items as $item) {
                $product = Product::lockForUpdate()->find($item->product_id);

                if (! $product) {
                    continue;
                }

                $stockBefore = $product->stock;
                $stockAfter = $stockBefore + $item->quantity;
                $product->update(['stock' => $stockAfter]);

                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => request()->user()?->id,
                    'sale_id' => $sale->id,
                    'type' => 'sale_void',
                    'quantity' => $item->quantity,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'notes' => 'Pembatalan '.$sale->invoice_number,
                ]);
            }

            $oldValues = $sale->toArray();
            $sale->update(['status' => 'cancelled']);
            AuditLogger::log('sale.cancelled', $sale, $oldValues, $sale->fresh()->toArray());
        });

        return response()->json($sale->fresh()->load(['customer', 'user', 'items.product']));
    }

    public function refund(Request $request, Sale $sale): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if (in_array($sale->status, ['cancelled', 'refunded'], true)) {
            return response()->json($sale->load(['customer', 'user', 'items.product']));
        }

        DB::transaction(function () use ($sale, $data): void {
            $sale->load('items.product');

            foreach ($sale->items as $item) {
                $product = Product::lockForUpdate()->find($item->product_id);

                if (! $product) {
                    continue;
                }

                $stockBefore = $product->stock;
                $stockAfter = $stockBefore + $item->quantity;
                $product->update(['stock' => $stockAfter]);

                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => request()->user()?->id,
                    'sale_id' => $sale->id,
                    'type' => 'sale_void',
                    'quantity' => $item->quantity,
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'notes' => 'Retur/refund '.$sale->invoice_number,
                ]);
            }

            $oldValues = $sale->toArray();
            $sale->update([
                'payment_status' => 'refunded',
                'refunded_at' => now(),
                'refund_reason' => $data['reason'] ?? null,
                'status' => 'refunded',
            ]);
            AuditLogger::log('sale.refunded', $sale, $oldValues, $sale->fresh()->toArray());
        });

        return response()->json($sale->fresh()->load(['customer', 'user', 'items.product']));
    }

    public function invoice(Request $request, Sale $sale): Response
    {
        $sale->load(['customer', 'user', 'items']);
        $logoPath = base_path('../frontend/public/logowhite.png');
        $logoData = file_exists($logoPath)
            ? 'data:image/png;base64,'.base64_encode((string) file_get_contents($logoPath))
            : null;
        $language = $request->query('lang') === 'en' ? 'en' : 'id';
        $fileNamePrefix = $language === 'en' ? 'sales-invoice' : 'faktur-penjualan';
        $fileName = $fileNamePrefix.'-'.strtolower($sale->invoice_number).'.pdf';

        $pdf = Pdf::loadView('invoices.sale', [
            'language' => $language,
            'logoData' => $logoData,
            'sale' => $sale,
        ])->setPaper('a4');

        return $pdf->stream($fileName);
    }

    private function paymentStatus(float $paidAmount, float $grandTotal): string
    {
        if ($paidAmount <= 0) {
            return 'unpaid';
        }

        if ($paidAmount < $grandTotal) {
            return 'partial';
        }

        return 'paid';
    }

    private function nextInvoiceNumber(): string
    {
        $settingPrefix = StoreSetting::query()->value('invoice_prefix') ?: 'INV';
        $prefix = strtoupper((string) $settingPrefix).'-'.now()->format('Ymd');
        $count = Sale::where('invoice_number', 'like', $prefix.'-%')->count() + 1;

        return $prefix.'-'.str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}
