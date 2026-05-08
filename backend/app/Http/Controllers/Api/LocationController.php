<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Location;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class LocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locations = Location::query()
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return response()->json($locations);
    }

    public function store(Request $request): JsonResponse
    {
        $location = Location::create($this->validated($request));
        AuditLogger::log('location.created', $location, null, $location->toArray());

        return response()->json($location, 201);
    }

    public function update(Request $request, Location $location): JsonResponse
    {
        $oldValues = $location->toArray();
        $location->update($this->validated($request));
        AuditLogger::log('location.updated', $location, $oldValues, $location->fresh()->toArray());

        return response()->json($location->fresh());
    }

    public function destroy(Location $location): JsonResponse
    {
        $oldValues = $location->toArray();
        $location->update(['is_active' => false]);
        AuditLogger::log('location.deactivated', $location, $oldValues, $location->fresh()->toArray());

        return response()->json($location->fresh());
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:180'],
            'type' => ['required', Rule::in(['store', 'warehouse'])],
            'phone' => ['nullable', 'string', 'max:60'],
            'address' => ['nullable', 'string'],
            'is_active' => ['boolean'],
        ]);
    }
}
