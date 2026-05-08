<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StockMovementController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $movements = StockMovement::query()
            ->with(['product:id,category_id,sku,name,image_path,unit,stock,min_stock,is_active', 'product.category:id,name', 'user:id,name'])
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('notes', 'like', "%{$search}%")
                        ->orWhere('type', 'like', "%{$search}%")
                        ->orWhereHas('product', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%")
                                ->orWhere('sku', 'like', "%{$search}%");
                        })
                        ->orWhereHas('user', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->integer('product_id'), fn ($query, int $productId) => $query->where('product_id', $productId))
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($movements);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'type' => ['required', Rule::in(['in', 'out', 'adjustment'])],
            'quantity' => ['required', 'integer', 'min:0'],
            'notes' => ['nullable', 'string'],
        ]);

        $movement = DB::transaction(function () use ($data) {
            /** @var Product $product */
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);
            $stockBefore = $product->stock;
            $quantity = (int) $data['quantity'];

            $stockAfter = match ($data['type']) {
                'in' => $stockBefore + $quantity,
                'out' => $stockBefore - $quantity,
                'adjustment' => $quantity,
            };

            if ($stockAfter < 0) {
                throw ValidationException::withMessages([
                    'quantity' => ['Stok tidak cukup untuk stok keluar.'],
                ]);
            }

            $product->update(['stock' => $stockAfter]);

            $movement = StockMovement::create([
                'product_id' => $product->id,
                'user_id' => request()->user()?->id,
                'type' => $data['type'],
                'quantity' => $data['type'] === 'adjustment' ? abs($stockAfter - $stockBefore) : $quantity,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'notes' => $data['notes'] ?? null,
            ]);

            AuditLogger::log('stock.'.$data['type'], $product, ['stock' => $stockBefore], ['stock' => $stockAfter]);

            return $movement;
        });

        return response()->json($movement->load(['product', 'user']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(StockMovement $stockMovement): JsonResponse
    {
        return response()->json($stockMovement->load(['product', 'user', 'sale']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        return response()->json(['message' => 'Riwayat stok tidak dapat diubah.'], 405);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        return response()->json(['message' => 'Riwayat stok tidak dapat dihapus.'], 405);
    }
}
