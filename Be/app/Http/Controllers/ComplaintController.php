<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
use App\Models\Properti;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class ComplaintController extends Controller
{
    /**
     * [CUSTOMER] Mengirimkan Komplain Baru
     */
    public function store(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        $request->validate([
            'properti_id' => 'required|exists:propertis,id', 
            'kamar_id'    => 'nullable|exists:kamars,id',
            'judul'       => 'required|string|max:255',
            'deskripsi'   => 'required|string',
            'foto'        => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ], [
            'properti_id.required' => 'Properti wajib dipilih.',
            'properti_id.exists'   => 'Properti tidak ditemukan di sistem.'
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('complaints', 'public');
        }

        $complaint = Complaint::create([
            'user_id'     => $user->id,
            'properti_id' => $request->properti_id,
            'kamar_id'    => $request->kamar_id,
            'judul'       => $request->judul,
            'deskripsi'   => $request->deskripsi,
            'foto'        => $fotoPath,
            'status'      => 'Pending'
        ]);

        $complaint->load(['user', 'properti', 'kamar']);

        // NOTIFIKASI: ke Admin Properti bahwa ada komplain baru
        if ($complaint->properti && $complaint->properti->pemilik_id) {
            $nomorKamar = $complaint->kamar
                ? ($complaint->kamar->nomor_kamar ?? $complaint->kamar->nama_kamar ?? '-')
                : '-';

            NotificationService::send(
                $complaint->properti->pemilik_id,
                'Komplain Baru',
                "Penyewa kamar {$nomorKamar} mengajukan komplain: {$complaint->judul}",
                '/admin/komplain',
                'komplain'
            );
        }

        return response()->json([
            'message' => 'Komplain berhasil dikirim! Tim kami akan segera mengeceknya.',
            'data'    => $complaint
        ], 201);
    }

    /**
     * [CUSTOMER] Melihat daftar komplain miliknya sendiri
     */
    public function myComplaints()
    {
        $user = Auth::guard('sanctum')->user();

        $complaints = Complaint::with(['properti', 'kamar'])
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil daftar komplain kamu',
            'data'    => $complaints
        ], 200);
    }

    /**
     * 🔒 [ADMIN] Melihat HANYA komplain dari kost milik Admin yang login
     */
   public function indexAdmin()
{
    try {
        $admin = Auth::guard('sanctum')->user();
        if (!$admin) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $role = strtolower($admin->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        // Ambil ID properti milik admin yang login
        // ⚠️ CATATAN: Ganti 'pemilik_id' jika nama kolom pemilik di tabel properti kamu adalah 'user_id'
        $myPropertyIds = Properti::when(!$isSuperAdmin, function ($q) use ($admin) {
            return $q->where('pemilik_id', $admin->id); 
        })->pluck('id');

        // Filter komplain berdasarkan ID properti milik admin tersebut
        $complaints = Complaint::with(['user', 'properti', 'kamar'])
            ->whereIn('properti_id', $myPropertyIds)
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil daftar komplain (Admin)',
            'data'    => $complaints
        ], 200);

    } catch (\Exception $e) {
        // Mengembalikan pesan error database/query secara detail
        return response()->json([
            'message' => 'Terjadi kesalahan server saat mengambil komplain',
            'error'   => $e->getMessage()
        ], 500);
    }
}

    /**
     * 🔒 [ADMIN] Mengubah status komplain & tanggapan
     */
    public function updateStatus(Request $request, $id)
    {
        $admin = Auth::guard('sanctum')->user();
        if (!$admin) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'status'          => 'required|in:Pending,Diproses,Selesai',
            'tanggapan_admin' => 'nullable|string'
        ]);

        $complaint = Complaint::with(['properti', 'kamar'])->find($id);

        if (!$complaint) {
            return response()->json(['message' => 'Data komplain tidak ditemukan'], 404);
        }

        $role = strtolower($admin->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        if (!$isSuperAdmin && $complaint->properti && $complaint->properti->pemilik_id !== $admin->id) {
            return response()->json([
                'message' => 'Forbidden. Anda tidak memiliki akses untuk menanggapi komplain di properti ini!'
            ], 403);
        }

        $complaint->update([
            'status'          => $request->status,
            'tanggapan_admin' => $request->tanggapan_admin ?? $complaint->tanggapan_admin
        ]);

        // NOTIFIKASI: ke Customer bahwa komplain-nya telah ditanggapi
        NotificationService::send(
            $complaint->user_id,
            'Komplain Ditanggapi',
            "Komplain Anda terkait '{$complaint->judul}' telah diperbarui statusnya menjadi {$request->status}.",
            '/komplain',
            'komplain'
        );

        return response()->json([
            'message' => 'Status komplain berhasil diperbarui!',
            'data'    => $complaint
        ], 200);
    }
}