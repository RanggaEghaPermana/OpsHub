<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ApiSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_returns_bearer_token(): void
    {
        User::factory()->create([
            'email' => 'admin@umkm.test',
            'password' => 'password',
            'role' => 'admin',
        ]);

        $this->postJson('/api/login', [
            'email' => 'admin@umkm.test',
            'password' => 'password',
        ])
            ->assertOk()
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email', 'role'],
            ]);
    }

    public function test_sale_creates_invoice_reduces_stock_and_writes_audit_log(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);

        $category = Category::create(['name' => 'Minuman']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'DRK-TEST',
            'name' => 'Kopi Botol',
            'unit' => 'botol',
            'purchase_price' => 8000,
            'selling_price' => 12000,
            'stock' => 5,
            'min_stock' => 2,
        ]);

        $response = $this->postJson('/api/sales', [
            'payment_method' => 'cash',
            'paid_amount' => 24000,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                ],
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('invoice_number', 'INV-'.now()->format('Ymd').'-0001')
            ->assertJsonPath('grand_total', '24000.00');

        $this->get('/api/sales/'.$response->json('id').'/invoice')
            ->assertOk()
            ->assertHeader('content-type', 'application/pdf');

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 3,
        ]);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'sale',
            'quantity' => 2,
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'event' => 'sale.created',
        ]);
    }

    public function test_api_not_found_response_is_localized_for_deleted_models(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);

        $category = Category::create(['name' => 'Snack']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'SNK-DELETED',
            'name' => 'Produk Terhapus',
            'unit' => 'pcs',
            'purchase_price' => 1000,
            'selling_price' => 2000,
            'stock' => 1,
            'min_stock' => 1,
        ]);

        $this->deleteJson('/api/products/'.$product->id)->assertNoContent();

        $this->deleteJson('/api/products/'.$product->id)
            ->assertNotFound()
            ->assertJsonPath('message', 'Data tidak ditemukan atau sudah dihapus.');
    }

    public function test_category_count_ignores_deleted_products_and_delete_detaches_history(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);

        $category = Category::create(['name' => 'Makanan Ringan']);
        $product = Product::create([
            'category_id' => $category->id,
            'sku' => 'SNK-HISTORY',
            'name' => 'Produk Riwayat',
            'unit' => 'pcs',
            'purchase_price' => 1000,
            'selling_price' => 2000,
            'stock' => 1,
            'min_stock' => 1,
        ]);

        $this->deleteJson('/api/products/'.$product->id)->assertNoContent();

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('0.products_count', 0);

        $this->deleteJson('/api/categories/'.$category->id)
            ->assertNoContent();

        $this->assertDatabaseMissing('categories', [
            'id' => $category->id,
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'category_id' => null,
        ]);
    }

    public function test_category_delete_is_blocked_when_active_products_still_use_it(): void
    {
        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);

        $category = Category::create(['name' => 'Minuman']);
        Product::create([
            'category_id' => $category->id,
            'sku' => 'DRK-ACTIVE',
            'name' => 'Produk Aktif',
            'unit' => 'pcs',
            'purchase_price' => 1000,
            'selling_price' => 2000,
            'stock' => 1,
            'min_stock' => 1,
        ]);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('0.products_count', 1);

        $this->deleteJson('/api/categories/'.$category->id)
            ->assertStatus(422)
            ->assertJsonPath(
                'message',
                'Kategori tidak bisa dihapus karena masih dipakai produk aktif.'
            );
    }

    public function test_product_photo_can_be_uploaded_and_replaced(): void
    {
        Storage::fake('public');

        $user = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($user);

        $category = Category::create(['name' => 'Minuman']);

        $response = $this->post('/api/products', [
            'category_id' => $category->id,
            'sku' => 'DRK-PHOTO',
            'name' => 'Kopi Foto',
            'unit' => 'botol',
            'purchase_price' => 8000,
            'selling_price' => 12000,
            'stock' => 5,
            'min_stock' => 2,
            'is_active' => true,
            'image' => UploadedFile::fake()->image('kopi.png', 420, 420),
        ], ['Accept' => 'application/json'])
            ->assertCreated();

        $this->assertStringContainsString('/storage/products/', $response->json('image_url'));

        $product = Product::findOrFail($response->json('id'));
        $oldImagePath = $product->image_path;

        $this->assertNotNull($oldImagePath);
        Storage::disk('public')->assertExists($oldImagePath);

        $this->post('/api/products/'.$product->id, [
            'category_id' => $category->id,
            'sku' => 'DRK-PHOTO',
            'name' => 'Kopi Foto Baru',
            'unit' => 'botol',
            'purchase_price' => 8000,
            'selling_price' => 13000,
            'stock' => 5,
            'min_stock' => 2,
            'is_active' => true,
            'image' => UploadedFile::fake()->image('kopi-baru.jpg', 420, 420),
        ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('name', 'Kopi Foto Baru');

        $product->refresh();

        $this->assertNotSame($oldImagePath, $product->image_path);
        Storage::disk('public')->assertMissing($oldImagePath);
        Storage::disk('public')->assertExists($product->image_path);
    }
}
