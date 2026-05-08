<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StoreSetting;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StoreSettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json($this->settings());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'store_name' => ['required', 'string', 'max:180'],
            'phone' => ['nullable', 'string', 'max:60'],
            'address' => ['nullable', 'string'],
            'default_tax_rate' => ['nullable', 'numeric', 'min:0'],
            'invoice_prefix' => ['required', 'string', 'max:20'],
        ]);

        $settings = $this->settings();
        $oldValues = $settings->toArray();
        $settings->update($data);
        AuditLogger::log('store_settings.updated', $settings, $oldValues, $settings->fresh()->toArray());

        return response()->json($settings->fresh());
    }

    private function settings(): StoreSetting
    {
        return StoreSetting::query()->firstOrCreate([], [
            'store_name' => 'UMKM OpsHub',
            'invoice_prefix' => 'INV',
        ]);
    }
}
