<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('locations', function (Blueprint $table): void {
            $table->index(['type', 'name'], 'locations_type_name_index');
            $table->index(['is_active', 'name'], 'locations_active_name_index');
        });

        Schema::table('suppliers', function (Blueprint $table): void {
            $table->index(['is_active', 'name'], 'suppliers_active_name_index');
            $table->index('phone', 'suppliers_phone_index');
        });

        Schema::table('purchases', function (Blueprint $table): void {
            $table->index(['purchase_date', 'supplier_id'], 'purchases_date_supplier_index');
            $table->index(['location_id', 'purchase_date'], 'purchases_location_date_index');
        });

        Schema::table('expenses', function (Blueprint $table): void {
            $table->index(['expense_date', 'category'], 'expenses_date_category_index');
            $table->index(['location_id', 'expense_date'], 'expenses_location_date_index');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table): void {
            $table->dropIndex('expenses_location_date_index');
            $table->dropIndex('expenses_date_category_index');
        });

        Schema::table('purchases', function (Blueprint $table): void {
            $table->dropIndex('purchases_location_date_index');
            $table->dropIndex('purchases_date_supplier_index');
        });

        Schema::table('suppliers', function (Blueprint $table): void {
            $table->dropIndex('suppliers_phone_index');
            $table->dropIndex('suppliers_active_name_index');
        });

        Schema::table('locations', function (Blueprint $table): void {
            $table->dropIndex('locations_active_name_index');
            $table->dropIndex('locations_type_name_index');
        });
    }
};
