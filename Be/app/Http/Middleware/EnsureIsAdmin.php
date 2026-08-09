<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureIsAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Cek apakah akun login dari tabel administrators dan rolenya 'admin'
        if (!$user || $user->role !== 'admin') {
            return response()->json([
                'status'  => 'error',
                'message' => 'Akses ditolak! Fitur ini khusus untuk Admin Platform.'
            ], 403);
        }

        return $next($request);
    }
}