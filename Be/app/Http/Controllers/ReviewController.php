<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Pemesanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    // Customer kirim ulasan & rating (Hanya 1x per properti per akun)
    public function store(Request $request)
    {
        $request->validate([
            'properti_id' => 'required|exists:propertis,id',
            'rating'      => 'required|integer|min:1|max:5',
            'comment'     => 'nullable|string'
        ]);

        $userId = Auth::id() ?? Auth::guard('sanctum')->id();

        if (!$userId) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // 1. Cek apakah user pernah sewa properti ini dan statusnya disetujui/selesai
        $pernahSewa = Pemesanan::where('customer_id', $userId)
            ->where('properti_id', $request->properti_id)
            ->where('status', 'Dikonfirmasi') // Sesuaikan dengan status valid di DB kamu
            ->exists();

        if (!$pernahSewa) {
            return response()->json([
                'message' => 'Kamu hanya bisa memberikan ulasan pada properti yang pernah kamu sewa!'
            ], 403);
        }

        // 2. Cek apakah user sudah pernah mengirim ulasan untuk properti ini
        $alreadyReviewed = Review::where('user_id', $userId)
            ->where('properti_id', $request->properti_id)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json([
                'message' => 'Anda sudah pernah memberikan ulasan untuk properti ini. Setiap akun hanya diperbolehkan memberikan 1 ulasan per properti.'
            ], 422);
        }

        // 3. Simpan Review Baru
        $review = Review::create([
            'user_id'     => $userId,
            'properti_id' => $request->properti_id,
            'rating'      => $request->rating,
            'comment'     => $request->comment,
        ]);

        return response()->json([
            'message' => 'Ulasan berhasil disimpan!',
            'data'    => $review
        ], 201);
    }

    // Ambil semua ulasan + Rata-rata Rating berdasarkan Properti
    public function getByProperti($propertiId)
    {
        $reviews = Review::with('user:id,name')
            ->where('properti_id', $propertiId)
            ->latest()
            ->get();

        $avgRating = Review::where('properti_id', $propertiId)->avg('rating');

        return response()->json([
            'properti_id'    => (int) $propertiId,
            'average_rating' => round($avgRating ?? 0, 1), // Contoh: 4.8
            'total_reviews'  => $reviews->count(),
            'reviews'        => $reviews
        ], 200);
    }
}