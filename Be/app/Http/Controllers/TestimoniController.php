<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Testimoni;
use Illuminate\Support\Facades\Auth;

class TestimoniController extends Controller
{
    // Kirim testimoni baru (Customer) - Hanya 1x per akun
    public function store(Request $request)
    {
        $userId = Auth::guard('sanctum')->id();

        if (!$userId) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Cek apakah user sudah pernah mengirim testimoni
        $alreadySubmitted = Testimoni::where('user_id', $userId)->exists();
        if ($alreadySubmitted) {
            return response()->json([
                'message' => 'Anda sudah pernah memberikan testimoni. Setiap akun hanya diperbolehkan memberikan 1 testimoni.'
            ], 422);
        }

        $request->validate([
            'properti_id' => 'nullable|exists:propertis,id',
            'review'      => 'required|string',
            'rating'      => 'required|integer|min:1|max:5',
        ]);

        $testimoni = Testimoni::create([
            'user_id'     => $userId,
            'properti_id' => $request->properti_id ?? null,
            'review'      => $request->review,
            'rating'      => $request->rating,
        ]);

        $testimoni->load('user');

        return response()->json([
            'message' => 'Terima kasih atas ulasannya!', 
            'data'    => $testimoni
        ], 201);
    }

    // Ambil semua testimoni (Public)
    public function index()
    {
        try {
            $data = Testimoni::with('user')->latest()->get();

            return response()->json(['data' => $data], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal mengambil testimoni',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}