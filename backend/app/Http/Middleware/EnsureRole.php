<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role, $roles, true)) {
            abort(403, 'Anda tidak memiliki akses untuk aksi ini.');
        }

        if ($user->role !== 'admin' && ! $this->allowedByDetailedPermission($request, $user->permissions ?? [])) {
            abort(403, 'Anda tidak memiliki akses untuk aksi ini.');
        }

        return $next($request);
    }

    /**
     * Empty permissions keep existing role behavior for older accounts.
     *
     * @param  array<int, string>  $permissions
     */
    private function allowedByDetailedPermission(Request $request, array $permissions): bool
    {
        if ($permissions === []) {
            return true;
        }

        $required = match (true) {
            $request->isMethod('delete') && $request->is('api/products/*') => 'products.delete',
            $request->isMethod('delete') && $request->is('api/categories/*') => 'categories.delete',
            $request->isMethod('delete') && $request->is('api/customers/*') => 'customers.delete',
            $request->isMethod('delete') && $request->is('api/sales/*') => 'sales.cancel',
            $request->isMethod('post') && $request->is('api/sales/*/refund') => 'sales.refund',
            $request->isMethod('get') && ($request->is('api/reports/profit') || $request->is('api/exports/profit*')) => 'reports.profit.view',
            $request->is('api/expenses*') => 'expenses.manage',
            $request->is('api/purchases*') => 'purchases.manage',
            default => null,
        };

        return $required === null || in_array($required, $permissions, true);
    }
}
