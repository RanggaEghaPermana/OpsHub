<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json(
            Category::query()
                ->select(['id', 'name', 'description', 'is_active'])
                ->withCount('products')
                ->orderBy('name')
                ->get()
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120', 'unique:categories,name'],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $category = Category::create($data);
        AuditLogger::log('category.created', $category, null, $category->toArray());

        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json($category->loadCount('products'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120', 'unique:categories,name,'.$category->id],
            'description' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);

        $oldValues = $category->toArray();
        $category->update($data);
        AuditLogger::log('category.updated', $category, $oldValues, $category->fresh()->toArray());

        return response()->json($category->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category): JsonResponse
    {
        if ($category->products()->exists()) {
            return response()->json([
                'message' => 'Kategori tidak bisa dihapus karena masih dipakai produk aktif.',
            ], 422);
        }

        DB::transaction(function () use ($category): void {
            $oldValues = $category->toArray();
            $category->products()->onlyTrashed()->update(['category_id' => null]);
            $category->delete();
            AuditLogger::log('category.deleted', $category, $oldValues, null);
        });

        return response()->json(null, 204);
    }
}
