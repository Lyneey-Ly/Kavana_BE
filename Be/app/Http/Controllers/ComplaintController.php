<?php

namespace App\Http\Controllers;

use App\Models\Complaint;
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

        // 1. Ubah properti_id menjadi required agar tidak ada komplain 'tanpa properti' lagi
        $request->validate([
            'properti_id' => 'required|exists:propertis,id', 
            'judul'       => 'required|string|max:255',
            'deskripsi'   => 'required|string',
            'foto'        => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ], [
            'properti_id.required' => 'ID Properti/Kamar wajib diikutsertakan.',
            'properti_id.exists'   => 'Properti tidak ditemukan di sistem.'
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('complaints', 'public');
        }

        $complaint = Complaint::create([
            'user_id'     => $user->id,
            'properti_id' => $request->properti_id,
            'judul'       => $request->judul,
            'deskripsi'   => $request->deskripsi,
            'foto'        => $fotoPath,
            'status'      => 'Pending'
        ]);

        // Load relasi agar return response langsung membawa data properti & user
        $complaint->load(['user', 'properti']);

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

        $complaints = Complaint::with('properti')
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil daftar komplain kamu',
            'data'    => $complaints
        ], 200);
    }

    /**
     * [ADMIN] Melihat SELURUH komplain dari semua anak kos
     */
    public function indexAdmin()
    {
        $complaints = Complaint::with(['user', 'properti'])
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil seluruh daftar komplain (Admin)',
            'data'    => $complaints
        ], 200);
    }

    /**
     * [ADMIN] Mengubah status komplain & memberikan tanggapan
     */
    public function updateStatus(Request $request, $id)
    {
        // 2. Perbaikan Typo spasi pada 'tanggapan_admin'
        $request->validate([
            'status'          => 'required|in:Pending,Diproses,Selesai',
            'tanggapan_admin' => 'nullable|string'
        ]);

        $complaint = Complaint::find($id);

        if (!$complaint) {
            return response()->json(['message' => 'Data komplain tidak ditemukan'], 404);
        }

        $complaint->update([
            'status'          => $request->status,
            'tanggapan_admin' => $request->tanggapan_admin ?? $complaint->tanggapan_admin
        ]);

        return response()->json([
            'message' => 'Status komplain berhasil diperbarui!',
            'data'    => $complaint
        ], 200);
    }
}