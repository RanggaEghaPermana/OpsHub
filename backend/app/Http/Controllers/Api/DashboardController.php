<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $from = $request->date('date_from')?->startOfDay() ?? now()->subDays(29)->startOfDay();
        $to = $request->date('date_to')?->endOfDay() ?? now()->endOfDay();

        $salesInRange = Sale::where('status', 'completed')->whereBetween('sale_date', [$from, $to]);

        $revenueByDay = Sale::selectRaw('DATE(sale_date) as date, SUM(grand_total) as revenue, COUNT(*) as transactions')
            ->where('status', 'completed')
            ->whereBetween('sale_date', [$from, $to])
            ->groupBy(DB::raw('DATE(sale_date)'))
            ->orderBy('date')
            ->get();

        $topProducts = SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->selectRaw('sale_items.product_id, sale_items.product_name, SUM(sale_items.quantity) as quantity_sold, SUM(sale_items.line_total) as revenue')
            ->where('sales.status', 'completed')
            ->whereBetween('sales.sale_date', [$from, $to])
            ->groupBy('sale_items.product_id', 'sale_items.product_name')
            ->orderByDesc('quantity_sold')
            ->limit(10)
            ->get();

        return response()->json([
            'cards' => [
                'revenue' => (float) (clone $salesInRange)->sum('grand_total'),
                'transactions' => (clone $salesInRange)->count(),
                'active_customers' => Customer::where('is_active', true)->whereNotNull('last_purchase_at')->count(),
                'low_stock_products' => Product::whereColumn('stock', '<=', 'min_stock')->count(),
            ],
            'revenue_by_day' => $revenueByDay,
            'top_products' => $topProducts,
            'low_stock_products' => Product::query()
                ->select(['id', 'category_id', 'sku', 'name', 'image_path', 'unit', 'stock', 'min_stock', 'is_active', 'selling_price', 'purchase_price'])
                ->with('category:id,name')
                ->whereColumn('stock', '<=', 'min_stock')
                ->orderBy('stock')
                ->limit(10)
                ->get(),
            'payment_status' => Sale::selectRaw('payment_status, COUNT(*) as total')
                ->where('status', 'completed')
                ->whereBetween('sale_date', [$from, $to])
                ->groupBy('payment_status')
                ->get(),
        ]);
    }
}
