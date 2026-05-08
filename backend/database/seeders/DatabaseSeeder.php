<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin UMKM',
            'email' => 'admin@umkm.test',
            'password' => 'password',
            'role' => 'admin',
        ]);

        User::factory()->create([
            'name' => 'Kasir Demo',
            'email' => 'kasir@umkm.test',
            'password' => 'password',
            'role' => 'staff',
        ]);

        User::factory()->create([
            'name' => 'Owner Demo',
            'email' => 'owner@umkm.test',
            'password' => 'password',
            'role' => 'owner',
        ]);

        $snack = Category::create(['name' => 'Makanan Ringan', 'description' => 'Produk siap jual']);
        $drink = Category::create(['name' => 'Minuman', 'description' => 'Produk minuman']);

        Product::create([
            'category_id' => $snack->id,
            'sku' => 'SNK-001',
            'name' => 'Keripik Singkong 250g',
            'unit' => 'pack',
            'purchase_price' => 8000,
            'selling_price' => 12000,
            'stock' => 40,
            'min_stock' => 10,
        ]);

        Product::create([
            'category_id' => $drink->id,
            'sku' => 'DRK-001',
            'name' => 'Kopi Susu Botol',
            'unit' => 'botol',
            'purchase_price' => 10000,
            'selling_price' => 16000,
            'stock' => 8,
            'min_stock' => 12,
        ]);

        Customer::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.test',
            'phone' => '081234567890',
            'address' => 'Jakarta',
        ]);
    }
}
