<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Testimoni;
use Illuminate\Support\Facades\Auth;

class TestimoniController extends Controller
{
    // Kirim testimoni baru (Customer)
    public function store(Request $request)
    {
        $request->validate([
            'properti_id' => 'nullable|exists:propertis,id',
            'review'      => 'required|string',
            'rating'      => 'required|integer|min:1|max:5',
        ]);

        $testimoni = Testimoni::create([
            'user_id'     => Auth::guard('sanctum')->id(),
            'properti_id' => $request->properti_id ?? null,
            'review'      => $request->review,
            'rating'      => $request->rating,
        ]);

        // 🌟 Load relasi user agar response JSON setelah submit langsung membawa data profil user
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
            // 🟢 PERBAIKAN: Panggil 'user' langsung tanpa membatasi kolom select.
            // Laravel otomatis menyembunyikan password & remember_token (sesuai $hidden di model User),
            // tetapi kolom foto/avatar akan IKUT TERAMBIL secara utuh!
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