<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Properti;
use App\Models\Administrator;

class AdminProfileController extends Controller
{
    /**
     * Get Data Profil Admin & Daftar Properti Miliknya
     */
    public function show(Request $request)
    {
        try {
            $admin = $request->user();

            if (!$admin) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'User/Admin tidak ditemukan atau belum login.'
                ], 401);
            }

            $role = strtolower($admin->role ?? '');
            $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

            $query = Properti::query();

            if (!$isSuperAdmin) {
                $query->where('pemilik_id', $admin->id);
            }

            $rooms = $query->latest()->get(); 

            return response()->json([
                'status'  => 'success',
                'message' => 'Berhasil mengambil data profil admin',
                'data'    => $admin,
                'rooms'   => $rooms
            ], 200);

        } catch (\Throwable $th) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Terjadi kesalahan di server: ' . $th->getMessage()
            ], 500);
        }
    }

    /**
     * Update Profil Admin
     */
    public function update(Request $request)
    {
        try {
            $admin = $request->user();

            if (!$admin) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'User/Admin tidak ditemukan atau belum login.'
                ], 401);
            }

            $request->validate([
                'name'     => 'sometimes|required|string|max:255',
                'email'    => 'sometimes|required|email|unique:' . $admin->getTable() . ',email,' . $admin->id,
                'phone'    => 'nullable|string|max:20',
                'password' => 'nullable|string|min:8',
                'foto'     => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048'
            ]);

            if ($request->has('name')) {
                $admin->name = $request->name;
            }

            if ($request->has('email')) {
                $admin->email = $request->email;
            }

            if ($request->has('phone')) {
                $admin->phone = $request->phone;
            }

            if ($request->filled('password')) {
                $admin->password = Hash::make($request->password);
            }

            if ($request->hasFile('foto')) {
                if ($admin->foto && Storage::disk('public')->exists($admin->foto)) {
                    Storage::disk('public')->delete($admin->foto);
                }

                $path = $request->file('foto')->store('avatars', 'public');
                $admin->foto = $path;
            }

            $admin->save();

            return response()->json([
                'status'  => 'success',
                'message' => 'Profil admin berhasil diperbarui!',
                'data'    => $admin
            ], 200);

        } catch (\Throwable $th) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal memperbarui profil: ' . $th->getMessage()
            ], 500);
        }
    }

    /**
     * Ambil Pengaturan Rekening & QRIS (Dapat diakses Admin maupun Penyewa)
     */
    public function getPaymentSettings(Request $request)
    {
        $user = $request->user();

        // Jika user yang memanggil adalah Admin/Owner, ambil data dirinya
        if ($user && in_array(strtolower($user->role ?? ''), ['admin', 'superadmin', 'super_admin', 'owner'])) {
            $admin = $user;
        } else {
            // Jika dipanggil oleh Customer/Penyewa, cari data Admin/Owner utama
            $admin = Administrator::whereNotNull('banks')
                        ->orWhereNotNull('bank_name')
                        ->first() ?? Administrator::first();
        }

        if (!$admin) {
            return response()->json([
                'status' => 'success',
                'data'   => [
                    'banks'          => [],
                    'bank_name'      => null,
                    'account_number' => null,
                    'account_holder' => null,
                    'qris_image_url' => null,
                ]
            ], 200);
        }

        // Parsing multi-bank JSON
        $banks = [];
        if (!empty($admin->banks)) {
            $banks = is_string($admin->banks) ? json_decode($admin->banks, true) : $admin->banks;
        } elseif ($admin->bank_name) {
            $banks = [[
                'bank_name'      => $admin->bank_name,
                'account_number' => $admin->account_number,
                'account_holder' => $admin->account_holder,
            ]];
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'banks'          => $banks,
                'bank_name'      => $admin->bank_name,
                'account_number' => $admin->account_number,
                'account_holder' => $admin->account_holder,
                'qris_image_url' => $admin->qris_image ? asset('storage/' . $admin->qris_image) : null,
            ]
        ], 200);
    }

    /**
     * Simpan / Update Pengaturan Multi-Rekening & QRIS Admin
     */
    public function updatePaymentSettings(Request $request)
    {
        $admin = $request->user();

        if (!$admin) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'qris_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Tangkap input banks (JSON string atau array)
        $banksInput = $request->input('banks');
        $banksArray = [];

        if (is_string($banksInput)) {
            $banksArray = json_decode($banksInput, true) ?? [];
        } elseif (is_array($banksInput)) {
            $banksArray = $banksInput;
        }

        // Simpan array multi-bank dalam bentuk JSON String
        $admin->banks = json_encode($banksArray);

        // Simpan bank pertama ke kolom utama sebagai fallback
        if (count($banksArray) > 0) {
            $admin->bank_name      = $banksArray[0]['bank_name'] ?? null;
            $admin->account_number = $banksArray[0]['account_number'] ?? null;
            $admin->account_holder = $banksArray[0]['account_holder'] ?? null;
        }

        // Upload Gambar QRIS jika ada
        if ($request->hasFile('qris_image')) {
            if ($admin->qris_image && Storage::disk('public')->exists($admin->qris_image)) {
                Storage::disk('public')->delete($admin->qris_image);
            }
            $admin->qris_image = $request->file('qris_image')->store('qris_codes', 'public');
        }

        $admin->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengaturan pembayaran berhasil diperbarui!',
            'data'    => [
                'banks'          => $banksArray,
                'bank_name'      => $admin->bank_name,
                'account_number' => $admin->account_number,
                'account_holder' => $admin->account_holder,
                'qris_image_url' => $admin->qris_image ? asset('storage/' . $admin->qris_image) : null,
            ]
        ], 200);
    }
}