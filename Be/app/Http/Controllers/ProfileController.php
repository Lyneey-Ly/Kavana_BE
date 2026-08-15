<?php

namespace App\Http\Controllers;

use App\Models\Pemesanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Melihat Profile yang sedang login (Customer / Admin)
     * Lengkap dengan Status Sewa Aktif & Lokasi Kost (Multi-Unit Supported)
     */
    public function show()
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated. Silakan login terlebih dahulu.'
            ], 401);
        }

        // 1. UBAH ->first() MENJADI ->get() agar semua properti tersewa terambil
        $sewaAktifList = Pemesanan::with(['properti', 'kamar'])
            ->where('customer_id', $user->id)
            ->where('status', 'Dikonfirmasi')
            ->latest()
            ->get();

        // 2. MAPPING DATA MENJADI ARRAY MULTI-UNIT
        $statusSewa = $sewaAktifList->map(function ($sewa) {
            return [
                'id'              => $sewa->id,
                'is_renting'      => true,
                'keterangan'      => 'Sedang Aktif Menyewa',
                'title'           => $sewa->properti->title ?? $sewa->properti->nama ?? 'Kost Kafana Vista',
                'address'         => $sewa->properti->address ?? $sewa->properti->alamat ?? 'Lokasi tidak diset',
                'check_in_date'   => $sewa->check_in_date ?? null,
                'duration_months' => $sewa->duration_months ?? null,
                'kamar'           => $sewa->kamar ?? null,
            ];
        });

        return response()->json([
            'message'     => 'Success fetch profile data',
            'data'        => $user,
            'status_sewa' => $statusSewa // Mengembalikan Array of Objects
        ], 200);
    }

    /**
     * Mengupdate profil secara BEBAS & FLEKSIBEL
     */
    public function update(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $rules = [
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|string|email|max:255|unique:' . $user->getTable() . ',email,' . $user->id,
            'phone'    => 'sometimes|string|max:20',
            'foto'     => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'password' => 'nullable|string|min:6',
        ];

        $request->validate($rules);

        if ($request->has('name')) {
            $user->name = $request->name;
        }
        
        if ($request->has('email')) {
            $user->email = $request->email;
        }

        if ($request->has('phone')) {
            $user->phone = $request->phone;
        }

        if ($request->hasFile('foto')) {
            if ($user->foto && Storage::disk('public')->exists($user->foto)) {
                Storage::disk('public')->delete($user->foto);
            }
            $user->foto = $request->file('foto')->store('fotos', 'public');
        }

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