<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Pemesanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    // ==========================================
    // 1. FITUR DIRECT MESSAGE (DM ADM / PERSONAL)
    // ==========================================

    // Kirim DM
    public function sendDirectMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message'     => 'required|string',
        ]);

        $chat = Chat::create([
            'sender_id'   => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'message'     => $request->message,
        ]);

        return response()->json([
            'message' => 'Pesan terkirim!',
            'data'    => $chat->load('sender:id,name')
        ], 201);
    }

    // Ambil Riwayat DM
    public function getDirectMessages($receiverId)
    {
        $userId = Auth::id();

        $messages = Chat::with('sender:id,name')
            ->whereNull('properti_id') // 💡 Trik: Mencegah pesan grup ikut terbaca di DM
            ->where(function ($q) use ($userId, $receiverId) {
                $q->where(function ($sub) use ($userId, $receiverId) {
                    $sub->where('sender_id', $userId)->where('receiver_id', $receiverId);
                })->orWhere(function ($sub) use ($userId, $receiverId) {
                    $sub->where('sender_id', $receiverId)->where('receiver_id', $userId);
                });
            })
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['data' => $messages], 200);
    }

    // ==========================================
    // 2. FITUR ROOMCHAT GRUP ANGKATAN / KOST
    // ==========================================

    // Kirim Pesan ke Grup Kost
    public function sendGroupMessage(Request $request)
    {
        $request->validate([
            'properti_id' => 'required|exists:propertis,id',
            'message'     => 'required|string',
        ]);

        $userId = Auth::id();
        $userRole = Auth::user()->role ?? '';

        // Cek apakah user penghuni kost
        $isTenant = Pemesanan::where('customer_id', $userId)
            ->where('properti_id', $request->properti_id)
            ->where('status', 'Dikonfirmasi')
            ->exists();

        // 💡 Tambahkan 'pemilik' atau 'owner' jika ada role tersebut di aplikasi kamu
        if (!$isTenant && !in_array($userRole, ['admin', 'pemilik', 'owner'])) {
            return response()->json([
                'message' => 'Akses ditolak! Hanya penghuni aktif kost ini yang bisa bergabung di roomchat grup.'
            ], 403);
        }

        $chat = Chat::create([
            'sender_id'   => $userId,
            'properti_id' => $request->properti_id,
            'message'     => $request->message,
        ]);

        return response()->json([
            'message' => 'Pesan grup terkirim!',
            'data'    => $chat->load('sender:id,name')
        ], 201);
    }

    // Ambil Semua Chat di Grup Kost
    public function getGroupMessages($propertiId)
    {
        $userId = Auth::id();
        $userRole = Auth::user()->role ?? '';

        // Validasi Akses
        $isTenant = Pemesanan::where('customer_id', $userId)
            ->where('properti_id', $propertiId)
            ->where('status', 'Dikonfirmasi')
            ->exists();

        if (!$isTenant && !in_array($userRole, ['admin', 'pemilik', 'owner'])) {
            return response()->json([
                'message' => 'Akses ditolak! Kamu belum pernah menyewa di kost ini.'
            ], 403);
        }

        $messages = Chat::with('sender:id,name')
            ->where('properti_id', $propertiId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json(['data' => $messages], 200);
    }

    // ==========================================
    // 3. FITUR AUTO-DETECT PROPERTI USER
    // ==========================================
    public function getMyActiveProperty()
    {
        $userId = Auth::id();

        // Cari pesanan aktif user (yang statusnya Dikonfirmasi)
        $pemesanan = Pemesanan::where('customer_id', $userId)
            ->where('status', 'Dikonfirmasi')
            ->latest() // Ambil yang paling baru jika ada riwayat
            ->first();

        if ($pemesanan) {
            return response()->json([
                'status' => 'success',
                'properti_id' => $pemesanan->properti_id,
            ], 200);
        }

        // Jika user tidak punya pesanan aktif
        return response()->json([
            'status' => 'error',
            'message' => 'Kamu belum memiliki sewa kost yang aktif.'
        ], 404);
    }
}