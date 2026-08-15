<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kamar; // 🟢 Perbaikan: Gunakan PascalCase (Kamar) untuk mencegah error pada server Linux / Production
use App\Models\Properti;
use Illuminate\Support\Facades\Auth;

class RoomController extends Controller
{
    /**
     * 🔒 Helper internal untuk mengecek apakah user login berhak mengakses properti ini
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

        // Jika bukan Superadmin dan bukan pemilik properti ini, tolak akses!
        if (!$isSuperAdmin && $properti->pemilik_id !== $user->id) {
            return ['status' => false, 'code' => 403, 'message' => 'Forbidden. Anda tidak memiliki akses ke kamar di properti ini!'];
        }

        return ['status' => true, 'properti' => $properti];
    }

    /**
     * 1. Ambil daftar kamar berdasarkan Properti ID (Terkunci per Pemilik)
     */
    public function index($propertiId)
    {
        $check = $this->checkPropertyAccess($propertiId);
        if (!$check['status']) {
            return response()->json(['message' => $check['message']], $check['code']);
        }

        $rooms = Kamar::where('properti_id', $propertiId)->get();
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

        // Normalisasi status input
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
     * 3. Update status / nomor kamar (Akses Terkunci)
     */
    public function update(Request $request, $id)
    {
        $room = Kamar::find($id);

        if (!$room) {
            return response()->json(['message' => 'Data kamar tidak ditemukan'], 404);
        }

        // Cek hak akses ke properti induk tempat kamar ini berada
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
     * 4. Hapus unit kamar (Akses Terkunci)
     */
    public function destroy($id)
    {
        $room = Kamar::find($id);

        if (!$room) {
            return response()->json(['message' => 'Data kamar tidak ditemukan'], 404);
        }

        // Cek hak akses ke properti induk tempat kamar ini berada
        $check = $this->checkPropertyAccess($room->properti_id);
        if (!$check['status']) {
            return response()->json(['message' => $check['message']], $check['code']);
        }

        $room->delete();

        return response()->json(['message' => 'Unit kamar berhasil dihapus'], 200);
    }
}