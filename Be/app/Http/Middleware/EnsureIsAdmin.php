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

        // Akun yang berhak: admin, superadmin, pemilik (owner) properti
        // (Customer / role lain ditolak)
        if (!$user || !in_array(strtolower($user->role ?? ''), ['admin', 'superadmin', 'super_admin', 'pemilik', 'owner'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Akses ditolak! Fitur ini khusus untuk Admin Platform.'
            ], 403);
        }

        return $next($request);
    }
}