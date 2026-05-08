<?php

use App\Http\Middleware\EnsureRole;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => EnsureRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (ModelNotFoundException $exception, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json([
                    'message' => 'Data tidak ditemukan atau sudah dihapus.',
                ], 404);
            }

            return null;
        });

        $exceptions->render(function (NotFoundHttpException $exception, Request $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                $message = str_contains($exception->getMessage(), 'No query results for model')
                    ? 'Data tidak ditemukan atau sudah dihapus.'
                    : 'Endpoint tidak ditemukan.';

                return response()->json(['message' => $message], 404);
            }

            return null;
        });

        $exceptions->render(function (QueryException $exception, Request $request) {
            if (($request->expectsJson() || $request->is('api/*')) && str_starts_with((string) $exception->getCode(), '23')) {
                return response()->json([
                    'message' => 'Data tidak bisa dihapus karena masih dipakai data lain.',
                ], 409);
            }

            return null;
        });
    })->create();
