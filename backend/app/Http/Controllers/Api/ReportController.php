<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function profit(Request $request): JsonResponse
    {
        [$from, $to] = $this->dateRange($request);

        $salesQuery = Sale::query()
            ->where('status', 'completed')
            ->whereBetween('sale_date', [$from, $to]);

        $revenue = (float) (clone $salesQuery)->sum('grand_total');
        $transactions = (clone $salesQuery)->count();
        $discounts = (float) (clone $salesQuery)->sum('discount_amount');
        $taxes = (float) (clone $salesQuery)->sum('tax_amount');

        $costOfGoodsSold = (float) DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->leftJoin('products', 'products.id', '=', 'sale_items.product_id')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->sum(DB::raw('sale_items.quantity * COALESCE(products.purchase_price, 0)'));

        $expenses = (float) Expense::query()
            ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
            ->sum('amount');

        $purchases = (float) Purchase::query()
            ->whereBetween('purchase_date', [$from, $to])
            ->sum('grand_total');

        $grossProfit = $revenue - $costOfGoodsSold;

        $expenseByCategory = Expense::query()
            ->selectRaw('category, SUM(amount) as total')
            ->whereBetween('expense_date', [$from->toDateString(), $to->toDateString()])
            ->groupBy('category')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'date_from' => $from->toDateString(),
            'date_to' => $to->toDateString(),
            'summary' => [
                'revenue' => $revenue,
                'transactions' => $transactions,
                'discounts' => $discounts,
                'taxes' => $taxes,
                'cost_of_goods_sold' => $costOfGoodsSold,
                'gross_profit' => $grossProfit,
                'expenses' => $expenses,
                'net_profit' => $grossProfit - $expenses,
                'purchases' => $purchases,
            ],
            'expense_by_category' => $expenseByCategory,
        ]);
    }

    public function lowStock(Request $request): JsonResponse
    {
        $products = Product::query()
            ->select(['id', 'category_id', 'sku', 'name', 'image_path', 'unit', 'stock', 'min_stock', 'is_active', 'selling_price', 'purchase_price'])
            ->with('category:id,name')
            ->whereColumn('stock', '<=', 'min_stock')
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhereHas('category', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->orderBy('stock')
            ->paginate($request->integer('per_page', 20));

        return response()->json($products);
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
