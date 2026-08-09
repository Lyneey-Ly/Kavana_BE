<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Pemesanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    // Customer kirim ulasan & rating
    public function store(Request $request)
    {
        $request->validate([
            'properti_id' => 'required|exists:propertis,id',
            'rating'      => 'required|integer|min:1|max:5',
            'comment'     => 'nullable|string'
        ]);

        $userId = Auth::id();

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

        // 2. Simpan atau Update Review (1 user hanya bisa ulas 1x per properti)
        $review = Review::updateOrCreate(
            [
                'user_id'     => $userId,
                'properti_id' => $request->properti_id
            ],
            [
                'rating'  => $request->rating,
                'comment' => $request->comment
            ]
        );

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