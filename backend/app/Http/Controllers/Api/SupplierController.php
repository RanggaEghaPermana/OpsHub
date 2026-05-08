<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::query()
            ->select(['id', 'name', 'email', 'phone', 'address', 'is_active'])
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return response()->json($suppliers);
    }

    public function store(Request $request): JsonResponse
    {
        $supplier = Supplier::create($this->validated($request));
        AuditLogger::log('supplier.created', $supplier, null, $supplier->toArray());

        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json($supplier->load(['purchases.items']));
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $oldValues = $supplier->toArray();
        $supplier->update($this->validated($request));
        AuditLogger::log('supplier.updated', $supplier, $oldValues, $supplier->fresh()->toArray());

        return response()->json($supplier->fresh());
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        $oldValues = $supplier->toArray();
        $supplier->delete();
        AuditLogger::log('supplier.deleted', $supplier, $oldValues, null);

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['nullable', 'email', 'max:180'],
            'phone' => ['nullable', 'string', 'max:60'],
            'address' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);
    }
}
