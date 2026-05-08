<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CustomerController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $customers = Customer::query()
            ->select([
                'id',
                'name',
                'email',
                'phone',
                'address',
                'is_active',
                'last_purchase_at',
            ])
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return response()->json($customers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedCustomer($request);
        $customer = Customer::create($data);
        AuditLogger::log('customer.created', $customer, null, $customer->toArray());

        return response()->json($customer, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Customer $customer): JsonResponse
    {
        return response()->json($customer->load('sales.items'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Customer $customer): JsonResponse
    {
        $data = $this->validatedCustomer($request, $customer);
        $oldValues = $customer->toArray();
        $customer->update($data);
        AuditLogger::log('customer.updated', $customer, $oldValues, $customer->fresh()->toArray());

        return response()->json($customer->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Customer $customer): JsonResponse
    {
        $oldValues = $customer->toArray();
        $customer->delete();
        AuditLogger::log('customer.deleted', $customer, $oldValues, null);

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedCustomer(Request $request, ?Customer $customer = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'email' => ['nullable', 'email', 'max:180', Rule::unique('customers', 'email')->ignore($customer)],
            'phone' => ['nullable', 'string', 'max:40'],
            'address' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);
    }
}
