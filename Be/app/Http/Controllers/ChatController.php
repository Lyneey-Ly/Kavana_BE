<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Pemesanan;
use App\Models\Properti;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    // ==========================================
    // HELPER PRIVATE: VALIDASI HAK AKSES ROOMCHAT
    // ==========================================
    /**
     * Memeriksa apakah user berhak mengirim/membaca pesan di grup properti tertentu.
     */
    private function authorizeGroupAccess($userId, $propertiId)
    {
        $user = Auth::user();
        if (!$user) return false;

        $userRole = strtolower($user->role ?? '');

        // 1. Admin: Memiliki akses penuh ke seluruh roomchat
        if (in_array($userRole, ['admin', 'superadmin', 'super_admin'])) {
            return true;
        }

        // 2. Owner / Pemilik: Akses jika properti tersebut miliknya (pemilik_id)
        if (in_array($userRole, ['pemilik', 'owner'])) {
            return Properti::where('id', $propertiId)
                ->where('pemilik_id', $userId)
                ->exists();
        }

        // 3. Tenant: Akses jika memiliki sewa aktif pada properti ini (customer_id)
        return Pemesanan::where('customer_id', $userId)
            ->where('properti_id', $propertiId)
            ->whereIn('status', ['Dikonfirmasi', 'aktif', 'approved', 'disetujui'])
            ->exists();
    }

    // ==========================================
    // 1. FITUR DIRECT MESSAGE (DM PERSONAL)
    // ==========================================

    public function sendDirectMessage(Request $request)
    {
        try {
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
                'data'    => $chat->load('sender:id,name,foto')
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal mengirim pesan: ' . $e->getMessage()], 500);
        }
    }

    public function getDirectMessages($receiverId)
    {
        try {
            $userId = Auth::id();

            $messages = Chat::with(['sender:id,name,foto', 'receiver:id,name,foto'])
                ->whereNull('properti_id')
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
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal memuat pesan: ' . $e->getMessage()], 500);
        }
    }

    // ==========================================
    // 2. FITUR ROOMCHAT GRUP KOST / PROPERTI
    // ==========================================

    public function sendGroupMessage(Request $request)
    {
        try {
            $request->validate([
                'properti_id' => 'required|exists:propertis,id',
                'message'     => 'required|string',
            ]);

            $userId = Auth::id();

            if (!$this->authorizeGroupAccess($userId, $request->properti_id)) {
                return response()->json([
                    'message' => 'Akses ditolak! Anda tidak memiliki izin untuk mengakses roomchat properti ini.'
                ], 403);
            }

            $chat = Chat::create([
                'sender_id'   => $userId,
                'properti_id' => $request->properti_id,
                'message'     => $request->message,
            ]);

            return response()->json([
                'message' => 'Pesan grup terkirim!',
                'data'    => $chat->load([
                    'sender:id,name,foto',
                    'properti:id,title,address'
                ])
            ], 201);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal mengirim pesan grup: ' . $e->getMessage()], 500);
        }
    }

    public function getGroupMessages($propertiId)
    {
        try {
            $userId = Auth::id();

            if (!$this->authorizeGroupAccess($userId, $propertiId)) {
                return response()->json([
                    'message' => 'Akses ditolak! Anda tidak memiliki izin untuk membaca obrolan grup ini.'
                ], 403);
            }

            $messages = Chat::with([
                'sender:id,name,foto',
                'properti:id,title,address'
            ])
                ->where('properti_id', $propertiId)
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json(['data' => $messages], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal memuat pesan grup: ' . $e->getMessage()], 500);
        }
    }

    // ==========================================
    // 3. AUTO-DETECT PROPERTI AKTIF TENANT
    // ==========================================

    public function getMyActiveProperties()
    {
        try {
            $userId = Auth::id();

            if (!$userId) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Unauthenticated / User belum login'
                ], 401);
            }

            // Fetch pemesanan aktif berdasar customer_id
            $pemesananList = Pemesanan::with(['properti:id,title,address,main_image'])
                ->where('customer_id', $userId)
                ->whereIn('status', ['Dikonfirmasi', 'aktif', 'approved', 'disetujui'])
                ->get();

            if ($pemesananList->isEmpty()) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Kamu belum memiliki sewa kost yang aktif.',
                    'data'    => []
                ], 200);
            }

            // Ambil koleksi properti unik dan format nama kolom agar sesuai dengan UI React
            $propertis = $pemesananList->pluck('properti')
                ->filter()
                ->unique('id')
                ->map(function ($prop) {
                    return [
                        'id'            => $prop->id,
                        'nama_properti' => $prop->title ?? 'Properti Kost',
                        'alamat'        => $prop->address ?? '',
                        'main_image'    => $prop->main_image ?? null,
                    ];
                })
                ->values();

            return response()->json([
                'status' => 'success',
                'data'   => $propertis
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
            ], 500);
        }
    }

    // ==========================================
    // 4. ENDPOINT MONITORING ADMIN / OWNER
    // ==========================================

    public function getManagedPropertiesChat()
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            $userId = $user->id;
            $userRole = strtolower($user->role ?? '');

            if (!in_array($userRole, ['admin', 'superadmin', 'pemilik', 'owner'])) {
                return response()->json([
                    'message' => 'Akses ditolak! Fitur ini khusus Admin dan Owner.'
                ], 403);
            }

            $query = Properti::query();

            // Jika Owner, filter properti berdasarkan pemilik_id
            if (in_array($userRole, ['pemilik', 'owner'])) {
                $query->where('pemilik_id', $userId);
            }

            $propertis = $query->select('id', 'title', 'address', 'pemilik_id')
                ->with(['chats' => function ($q) {
                    $q->latest()->limit(1)->with('sender:id,name');
                }])
                ->get()
                ->map(function ($prop) {
                    $lastChat = $prop->chats->first();
                    return [
                        'id'            => $prop->id,
                        'nama_properti' => $prop->title ?? 'Properti Kost',
                        'alamat'        => $prop->address ?? '',
                        'last_message'  => $lastChat ? [
                            'message'    => $lastChat->message,
                            'sender'     => $lastChat->sender->name ?? 'User',
                            'created_at' => $lastChat->created_at,
                        ] : null,
                    ];
                });

            return response()->json([
                'status' => 'success',
                'data'   => $propertis
            ], 200);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal mengambil data: ' . $e->getMessage()], 500);
        }
    }
}