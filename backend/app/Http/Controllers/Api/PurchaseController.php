<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\StockMovement;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        [$from, $to] = $this->dateRange($request);

        $purchases = Purchase::query()
            ->select([
                'id',
                'supplier_id',
                'location_id',
                'user_id',
                'reference_number',
                'purchase_date',
                'grand_total',
                'status',
            ])
            ->with(['supplier:id,name', 'location:id,name,type', 'user:id,name'])
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('reference_number', 'like', "%{$search}%")
                        ->orWhereHas('supplier', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('location', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->integer('supplier_id'), fn ($query, int $supplierId) => $query->where('supplier_id', $supplierId))
            ->when($request->integer('location_id'), fn ($query, int $locationId) => $query->where('location_id', $locationId))
            ->whereBetween('purchase_date', [$from, $to])
            ->latest('purchase_date')
            ->paginate($request->integer('per_page', 20));

        return response()->json($purchases);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id' => ['nullable', 'exists:suppliers,id'],
            'location_id' => ['nullable', 'exists:locations,id'],
            'reference_number' => ['nullable', 'string', 'max:120'],
            'purchase_date' => ['nullable', 'date'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_cost' => ['required', 'numeric', 'min:0'],
        ]);

        $purchase = DB::transaction(function () use ($data, $request) {
            $items = collect($data['items']);
            $products = Product::whereIn('id', $items->pluck('product_id')->all())
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

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

                $quantity = (int) $item['quantity'];
                $unitCost = (float) $item['unit_cost'];
                $lineTotal = $quantity * $unitCost;
                $subtotal += $lineTotal;

                $preparedItems[] = compact('product', 'quantity', 'unitCost', 'lineTotal');
            }

            $discountAmount = (float) ($data['discount_amount'] ?? 0);
            $taxAmount = (float) ($data['tax_amount'] ?? 0);
            $grandTotal = max(0, $subtotal - $discountAmount + $taxAmount);

            $purchase = Purchase::create([
                'supplier_id' => $data['supplier_id'] ?? null,
                'location_id' => $data['location_id'] ?? null,
                'user_id' => $request->user()?->id,
                'reference_number' => $data['reference_number'] ?? $this->nextReferenceNumber(),
                'purchase_date' => $data['purchase_date'] ?? now(),
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'tax_amount' => $taxAmount,
                'grand_total' => $grandTotal,
                'status' => 'received',
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($preparedItems as $preparedItem) {
                /** @var Product $product */
                $product = $preparedItem['product'];
                $stockBefore = $product->stock;
                $stockAfter = $stockBefore + $preparedItem['quantity'];

                $purchase->items()->create([
                    'product_id' => $product->id,
                    'product_sku' => $product->sku,
                    'product_name' => $product->name,
                    'quantity' => $preparedItem['quantity'],
                    'unit_cost' => $preparedItem['unitCost'],
                    'line_total' => $preparedItem['lineTotal'],
                ]);

                $product->update([
                    'purchase_price' => $preparedItem['unitCost'],
                    'stock' => $stockAfter,
                ]);

                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $request->user()?->id,
                    'type' => 'in',
                    'quantity' => $preparedItem['quantity'],
                    'stock_before' => $stockBefore,
                    'stock_after' => $stockAfter,
                    'notes' => 'Pembelian '.$purchase->reference_number,
                ]);
            }

            AuditLogger::log('purchase.created', $purchase, null, $purchase->load('items')->toArray());

            return $purchase;
        });

        return response()->json($purchase->load(['supplier', 'location', 'user', 'items.product']), 201);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        return response()->json($purchase->load(['supplier', 'location', 'user', 'items.product']));
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

    private function nextReferenceNumber(): string
    {
        $prefix = 'PO-'.now()->format('Ymd');
        $count = Purchase::where('reference_number', 'like', $prefix.'-%')->count() + 1;

        return $prefix.'-'.str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }
}
