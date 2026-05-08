<?php

use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\StoreSettingController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('me', [AuthController::class, 'me']);
    Route::post('logout', [AuthController::class, 'logout']);

    Route::get('dashboard', [DashboardController::class, 'index'])->middleware('role:admin,owner,staff');

    Route::apiResource('categories', CategoryController::class)->middleware('role:admin,owner,staff');
    Route::post('products/{product}', [ProductController::class, 'update'])->middleware('role:admin,owner,staff');
    Route::apiResource('products', ProductController::class)->middleware('role:admin,owner,staff');
    Route::apiResource('customers', CustomerController::class)->middleware('role:admin,owner,staff');
    Route::apiResource('stock-movements', StockMovementController::class)->only(['index', 'store', 'show'])->middleware('role:admin,owner,staff');
    Route::apiResource('sales', SaleController::class)->middleware('role:admin,owner,staff');
    Route::post('sales/{sale}/refund', [SaleController::class, 'refund'])->middleware('role:admin,owner,staff');
    Route::get('sales/{sale}/invoice', [SaleController::class, 'invoice'])->middleware('role:admin,owner,staff');
    Route::apiResource('suppliers', SupplierController::class)->middleware('role:admin,owner,staff');
    Route::apiResource('locations', LocationController::class)->middleware('role:admin,owner');
    Route::apiResource('purchases', PurchaseController::class)->only(['index', 'store', 'show'])->middleware('role:admin,owner,staff');
    Route::apiResource('expenses', ExpenseController::class)->middleware('role:admin,owner');
    Route::get('reports/profit', [ReportController::class, 'profit'])->middleware('role:admin,owner');
    Route::get('reports/low-stock', [ReportController::class, 'lowStock'])->middleware('role:admin,owner,staff');
    Route::get('store-settings', [StoreSettingController::class, 'show'])->middleware('role:admin,owner,staff');
    Route::put('store-settings', [StoreSettingController::class, 'update'])->middleware('role:admin,owner,staff');
    Route::get('exports/products', [ExportController::class, 'products'])->middleware('role:admin,owner,staff');
    Route::get('exports/customers', [ExportController::class, 'customers'])->middleware('role:admin,owner,staff');
    Route::get('exports/sales', [ExportController::class, 'sales'])->middleware('role:admin,owner,staff');
    Route::get('exports/sales.pdf', [ExportController::class, 'salesPdf'])->middleware('role:admin,owner,staff');
    Route::get('exports/purchases', [ExportController::class, 'purchases'])->middleware('role:admin,owner');
    Route::get('exports/expenses', [ExportController::class, 'expenses'])->middleware('role:admin,owner');
    Route::get('exports/profit.csv', [ExportController::class, 'profitCsv'])->middleware('role:admin,owner');
    Route::get('exports/profit.pdf', [ExportController::class, 'profitPdf'])->middleware('role:admin,owner');
    Route::post('imports/products', [ExportController::class, 'importProducts'])->middleware('role:admin,owner,staff');
    Route::get('backup/database', [ExportController::class, 'backup'])->middleware('role:admin');

    Route::apiResource('users', UserController::class)->middleware('role:admin');
    Route::get('audit-logs', [AuditLogController::class, 'index'])->middleware('role:admin,owner');
});
