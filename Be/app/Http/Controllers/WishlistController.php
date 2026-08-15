<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Wishlist;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    /**
     * Get semua daftar wishlist user yang sedang login
     */
    public function index()
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $wishlists = Wishlist::with(['properti'])
            ->where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil daftar wishlist',
            'data'    => $wishlists
        ], 200);
    }

    /**
     * Toggle Add / Remove Wishlist (1 Endpoint Praktis)
     */
    public function toggle(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'properti_id' => 'required|exists:propertis,id',
        ]);

        $existing = Wishlist::where('user_id', $user->id)
            ->where('properti_id', $request->properti_id)
            ->first();

        if ($existing) {
            $existing->delete();
            return response()->json([
                'message'      => 'Properti dihapus dari wishlist',
                'is_wishlist'  => false
            ], 200);
        }

        Wishlist::create([
            'user_id'     => $user->id,
            'properti_id' => $request->properti_id,
        ]);

        return response()->json([
            'message'      => 'Properti berhasil disimpan ke wishlist!',
            'is_wishlist'  => true
        ], 201);
    }
}