<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->index(['status', 'sale_date']);
            $table->index(['payment_status', 'sale_date']);
        });

        Schema::table('sale_items', function (Blueprint $table): void {
            $table->index(['product_id', 'product_name']);
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->index(['is_active', 'name']);
            $table->index(['category_id', 'deleted_at']);
        });

        Schema::table('customers', function (Blueprint $table): void {
            $table->index(['is_active', 'last_purchase_at']);
            $table->index('name');
        });

        Schema::table('stock_movements', function (Blueprint $table): void {
            $table->index(['product_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table): void {
            $table->dropIndex(['product_id', 'created_at']);
        });

        Schema::table('customers', function (Blueprint $table): void {
            $table->dropIndex(['is_active', 'last_purchase_at']);
            $table->dropIndex(['name']);
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->dropIndex(['is_active', 'name']);
            $table->dropIndex(['category_id', 'deleted_at']);
        });

        Schema::table('sale_items', function (Blueprint $table): void {
            $table->dropIndex(['product_id', 'product_name']);
        });

        Schema::table('sales', function (Blueprint $table): void {
            $table->dropIndex(['status', 'sale_date']);
            $table->dropIndex(['payment_status', 'sale_date']);
        });
    }
};
