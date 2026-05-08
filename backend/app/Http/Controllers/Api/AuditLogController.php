<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $logs = AuditLog::query()
            ->select(['id', 'user_id', 'event', 'auditable_type', 'auditable_id', 'created_at'])
            ->with('user:id,name')
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query->where('event', 'like', "%{$search}%")
                        ->orWhere('auditable_type', 'like', "%{$search}%")
                        ->orWhereHas('user', function ($query) use ($search): void {
                            $query->where('name', 'like', "%{$search}%");
                        });

                    if (is_numeric($search)) {
                        $query->orWhere('auditable_id', (int) $search);
                    }
                });
            })
            ->when($request->string('event')->toString(), fn ($query, string $event) => $query->where('event', $event))
            ->when($request->integer('user_id'), fn ($query, int $userId) => $query->where('user_id', $userId))
            ->latest()
            ->paginate($request->integer('per_page', 30));

        return response()->json($logs);
    }
}
