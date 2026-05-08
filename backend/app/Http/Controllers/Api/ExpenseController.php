<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        [$from, $to] = $this->dateRange($request);

        $expenses = Expense::query()
            ->with(['location:id,name,type', 'user:id,name'])
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('category', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('payment_method', 'like', "%{$search}%")
                        ->orWhereHas('location', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($request->integer('location_id'), fn ($query, int $locationId) => $query->where('location_id', $locationId))
            ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
            ->latest('expense_date')
            ->latest()
            ->paginate($request->integer('per_page', 20));

        return response()->json($expenses);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['user_id'] = $request->user()?->id;
        $expense = Expense::create($data);
        AuditLogger::log('expense.created', $expense, null, $expense->toArray());

        return response()->json($expense->load(['location:id,name,type', 'user:id,name']), 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return response()->json($expense->load(['location:id,name,type', 'user:id,name']));
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $oldValues = $expense->toArray();
        $expense->update($this->validated($request));
        AuditLogger::log('expense.updated', $expense, $oldValues, $expense->fresh()->toArray());

        return response()->json($expense->fresh()->load(['location:id,name,type', 'user:id,name']));
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $oldValues = $expense->toArray();
        $expense->delete();
        AuditLogger::log('expense.deleted', $expense, $oldValues, null);

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'location_id' => ['nullable', 'exists:locations,id'],
            'category' => ['required', 'string', 'max:120'],
            'title' => ['required', 'string', 'max:180'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expense_date' => ['required', 'date'],
            'payment_method' => ['nullable', 'string', 'max:60'],
            'notes' => ['nullable', 'string'],
        ]);
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
}
