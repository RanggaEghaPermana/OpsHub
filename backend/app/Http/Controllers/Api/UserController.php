<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): JsonResponse
    {
        return response()->json(
            User::query()
                ->select(['id', 'name', 'email', 'role', 'permissions', 'is_active'])
                ->orderBy('name')
                ->get()
        );
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $this->validatedUser($request);
        $user = User::create($data);
        AuditLogger::log('user.created', $user, null, $user->toArray());

        return response()->json($user, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $rules = $this->validatedUserRules($user);
        $rules['password'] = ['nullable', 'string', 'min:8'];
        $data = $request->validate($rules);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $oldValues = $user->toArray();
        $user->update($data);
        AuditLogger::log('user.updated', $user, $oldValues, $user->fresh()->toArray());

        return response()->json($user->fresh());
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user): JsonResponse
    {
        if ($user->id === request()->user()?->id) {
            return response()->json(['message' => 'Tidak bisa menonaktifkan akun sendiri.'], 422);
        }

        $oldValues = $user->toArray();
        $user->update(['is_active' => false]);
        AuditLogger::log('user.deactivated', $user, $oldValues, $user->fresh()->toArray());

        return response()->json($user->fresh());
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedUser(Request $request): array
    {
        return $request->validate($this->validatedUserRules());
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    private function validatedUserRules(?User $user = null): array
    {
        return [
            'name' => ['required', 'string', 'max:180'],
            'email' => ['required', 'email', 'max:180', Rule::unique('users', 'email')->ignore($user)],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'staff', 'owner'])],
            'permissions' => ['nullable', 'array'],
            'permissions.*' => ['string', 'max:80'],
            'is_active' => ['boolean'],
        ];
    }
}
