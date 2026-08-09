<?php

namespace App\Http\Controllers; // 👈 Pastikan TANPA \Admin

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use App\Models\Properti; // 👈 Model Properti yang ada di folder Models kamu

class AdminProfileController extends Controller
{
    /**
     * Get Data Profil Admin & Daftar Kamar
     */
    public function show(Request $request)
    {
        try {
            $admin = $request->user();

            // Mengambil daftar properti
            $rooms = Properti::latest()->get(); 

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

            // Validasi Input
            $request->validate([
                'name'     => 'required|string|max:255',
                'email'    => 'required|email|unique:users,email,' . $admin->id,
                'phone'    => 'nullable|string|max:20',
                'password' => 'nullable|string|min:8',
                'foto'     => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
            ]);

            $admin->name  = $request->name;
            $admin->email = $request->email;
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
}