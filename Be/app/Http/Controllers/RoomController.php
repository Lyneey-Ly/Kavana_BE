<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kamar;
use App\Models\Properti;
use App\Models\Pemesanan;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class RoomController extends Controller
{
    /**
     * 🔒 Helper internal untuk mengecek akses properti
     */
    private function checkPropertyAccess($propertiId)
    {
        $user = Auth::guard('sanctum')->user();
        if (!$user) {
            return ['status' => false, 'code' => 401, 'message' => 'Unauthenticated'];
        }

        $properti = Properti::find($propertiId);
        if (!$properti) {
            return ['status' => false, 'code' => 404, 'message' => 'Properti tidak ditemukan'];
        }

        $role = strtolower($user->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        if (!$isSuperAdmin && $properti->pemilik_id !== $user->id) {
            return ['status' => false, 'code' => 403, 'message' => 'Forbidden. Anda tidak memiliki akses ke kamar di properti ini!'];
        }

        return ['status' => true, 'properti' => $properti];
    }

    /**
     * 1. Ambil daftar kamar berdasarkan Properti ID (dengan flag is_available)
     */
    public function index($propertiId)
    {
        $check = $this->checkPropertyAccess($propertiId);
        if (!$check['status']) {
            return response()->json(['message' => $check['message']], $check['code']);
        }

        $rooms = Kamar::where('properti_id', $propertiId)->get()->map(function ($kamar) {
            $hasActiveBooking = Pemesanan::where('kamar_id', $kamar->id)
                ->whereIn('status', ['Tertunda', 'Diverifikasi', 'Dikonfirmasi'])
                ->where(function ($q) {
                    $q->whereNull('expired_at')->orWhere('expired_at', '>', Carbon::now());
                })
                ->exists();

            $kamar->is_available = (strtolower($kamar->status) === 'kosong') && !$hasActiveBooking;
            return $kamar;
        });

        return response()->json($rooms, 200);
    }

    /**
     * 2. Tambah unit kamar ke properti tertentu
     */
    public function store(Request $request, $propertiId)
    {
        $check = $this->checkPropertyAccess($propertiId);
        if (!$check['status']) {
            return response()->json(['message' => $check['message']], $check['code']);
        }

        $request->validate([
            'nomor_kamar' => 'required|string|max:50',
            'status'      => 'nullable|string|in:kosong,terisi,Tersedia,Terisi',
        ]);

        $status = strtolower($request->status ?? 'kosong');
        if ($status === 'tersedia') $status = 'kosong';

        $room = Kamar::create([
            'properti_id' => $propertiId,
            'nomor_kamar' => $request->nomor_kamar,
            'status'      => $status,
        ]);

        return response()->json([
            'message' => 'Unit kamar berhasil ditambahkan',
            'data'    => $room
        ], 201);
    }

    /**
     * 3. Update status / nomor kamar
     */
    public function update(Request $request, $id)
    {
        $room = Kamar::find($id);

        if (!$room) {
            return response()->json(['message' => 'Data kamar tidak ditemukan'], 404);
        }

        $check = $this->checkPropertyAccess($room->properti_id);
        if (!$check['status']) {
            return response()->json(['message' => $check['message']], $check['code']);
        }

        $request->validate([
            'nomor_kamar' => 'nullable|string|max:50',
            'status'      => 'nullable|string|in:kosong,terisi,Tersedia,Terisi',
        ]);

        $statusInput = $request->status;
        $statusFormatted = $room->status;

        if ($statusInput) {
            $statusFormatted = strtolower($statusInput);
            if ($statusFormatted === 'tersedia') $statusFormatted = 'kosong';
        }

        $room->update([
            'nomor_kamar' => $request->nomor_kamar ?? $room->nomor_kamar,
            'status'      => $statusFormatted,
        ]);

        return response()->json([
            'message' => 'Status kamar berhasil diperbarui',
            'data'    => $room
        ], 200);
    }

    /**
     * 4. Hapus unit kamar
     */
    public function destroy($id)
    {
        $room = Kamar::find($id);

        if (!$room) {
            return response()->json(['message' => 'Data kamar tidak ditemukan'], 404);
        }

        $check = $this->checkPropertyAccess($room->properti_id);
        if (!$check['status']) {
            return response()->json(['message' => $check['message']], $check['code']);
        }

        $room->delete();

        return response()->json(['message' => 'Unit kamar berhasil dihapus'], 200);
    }
}