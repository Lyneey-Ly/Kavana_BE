<?php

namespace App\Http\Controllers;

use App\Models\Pemesanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;   // <-- Penting agar tidak eror saat update password
use Illuminate\Support\Facades\Storage; // <-- Penting agar tidak eror saat update foto

class ProfileController extends Controller
{
    /**
     * Melihat Profile yang sedang login (Customer / Admin)
     * Lengkap dengan Status Sewa Aktif & Lokasi Kost
     */
    public function show()
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated. Silakan login terlebih dahulu.'
            ], 401);
        }

        // Cari pemesanan terbaru user yang statusnya Dikonfirmasi
        $sewaAktif = Pemesanan::with('properti')
            ->where('customer_id', $user->id)
            ->where('status', 'Dikonfirmasi')
            ->latest()
            ->first();

        // Susun keterangan status sewa otomatis
        if ($sewaAktif && $sewaAktif->properti) {
            $statusSewa = [
                'is_renting'      => true,
                'keterangan'      => 'Sedang Aktif Menyewa',
                'title'       => $sewaAktif->properti->title ?? $sewaAktif->properti->nama ?? 'Kost Kafana Vista',
                'address'   => $sewaAktif->properti->address ?? $sewaAktif->properti->alamat ?? 'Lokasi tidak diset',
                'check_in_date' => $sewaAktif->check_in_date ?? null,
                'duration_months'    => isset($sewaAktif->duration_months) ? $sewaAktif->duration_months . ' Bulan' : null,
            ];
        } else {
            $statusSewa = [
                'is_renting'    => false,
                'keterangan'    => 'Belum Memiliki Sewa Aktif',
                'nama_kost'     => null,
                'lokasi_daerah' => null,
            ];
        }

        return response()->json([
            'message'     => 'Success fetch profile data',
            'data'        => $user,
            'status_sewa' => $statusSewa
        ], 200);
    }

    /**
     * Mengupdate profil secara BEBAS & FLEKSIBEL (bisa nama aja, hp aja, dll)
     */
    public function update(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Menggunakan 'sometimes' agar field yang TIDAK dikirim di Postman diabaikan oleh Laravel
        $rules = [
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|string|email|max:255|unique:' . $user->getTable() . ',email,' . $user->id,
            'phone'    => 'sometimes|string|max:20',
            'foto'     => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'password' => 'nullable|string|min:6',
        ];

        $request->validate($rules);

        // 1. Update Nama (jika ada)
        if ($request->has('name')) {
            $user->name = $request->name;
        }
        
        // 2. Update Email (jika ada)
        if ($request->has('email')) {
            $user->email = $request->email;
        }

        // 3. Update No HP (jika ada)
        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }

        // 4. Update Foto (jika ada file yang diunggah)
        if ($request->hasFile('foto')) {
            // Hapus foto lama di storage jika ada, biar folder penyimpanan tidak penuh
            if ($user->foto && Storage::disk('public')->exists($user->foto)) {
                Storage::disk('public')->delete($user->foto);
            }
            // Simpan foto baru ke folder 'fotos' di public storage
            $user->foto = $request->file('foto')->store('fotos', 'public');
        }

        // 5. Update Password (jika ada input password baru)
        if ($request->filled('password')) {
            $user->password = Hash::make($request->password);
        }

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully!',
            'data'    => $user
        ], 200);
    }
}