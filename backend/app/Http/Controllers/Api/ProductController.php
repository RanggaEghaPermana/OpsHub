<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockMovement;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $products = Product::query()
            ->select([
                'id',
                'category_id',
                'sku',
                'name',
                'description',
                'image_path',
                'unit',
                'purchase_price',
                'selling_price',
                'stock',
                'min_stock',
                'is_active',
            ])
            ->with('category:id,name')
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->boolean('low_stock'), fn ($query) => $query->whereColumn('stock', '<=', 'min_stock'))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return response()->json($products);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedProduct($request);
        unset($data['image'], $data['remove_image']);

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
        }

        $product = DB::transaction(function () use ($data) {
            $product = Product::create($data);

            if ($product->stock > 0) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => request()->user()?->id,
                    'type' => 'in',
                    'quantity' => $product->stock,
                    'stock_before' => 0,
                    'stock_after' => $product->stock,
                    'notes' => 'Stok awal produk',
                ]);
            }

            AuditLogger::log('product.created', $product, null, $product->toArray());

            return $product;
        });

        return response()->json($product->load('category'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product): JsonResponse
    {
        return response()->json($product->load(['category', 'stockMovements.user']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $data = $this->validatedProduct($request, $product);
        unset($data['image'], $data['remove_image']);
        $oldImagePath = $product->image_path;
        $shouldDeleteOldImage = false;

        if ($request->hasFile('image')) {
            $data['image_path'] = $request->file('image')->store('products', 'public');
            $shouldDeleteOldImage = true;
        } elseif ($request->boolean('remove_image')) {
            $data['image_path'] = null;
            $shouldDeleteOldImage = true;
        }

        $product = DB::transaction(function () use ($product, $data) {
            $oldValues = $product->toArray();
            $stockBefore = $product->stock;

            $product->update($data);
            $product->refresh();

            if (array_key_exists('stock', $data) && $product->stock !== $stockBefore) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => request()->user()?->id,
                    'type' => 'adjustment',
                    'quantity' => abs($product->stock - $stockBefore),
                    'stock_before' => $stockBefore,
                    'stock_after' => $product->stock,
                    'notes' => 'Penyesuaian stok dari edit produk',
                ]);
            }

            AuditLogger::log('product.updated', $product, $oldValues, $product->toArray());

            return $product;
        });

        if ($shouldDeleteOldImage && $oldImagePath) {
            Storage::disk('public')->delete($oldImagePath);
        }

        return response()->json($product->load('category'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): JsonResponse
    {
        $oldValues = $product->toArray();
        $imagePath = $product->image_path;
        $product->delete();
        if ($imagePath) {
            Storage::disk('public')->delete($imagePath);
        }
        AuditLogger::log('product.deleted', $product, $oldValues, null);

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedProduct(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'category_id' => ['required', 'exists:categories,id'],
            'sku' => ['required', 'string', 'max:80', Rule::unique('products', 'sku')->ignore($product)],
            'name' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_image' => ['nullable', 'boolean'],
            'unit' => ['required', 'string', 'max:30'],
            'purchase_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'min_stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);
    }
}
