<?php

namespace App\Http\Controllers;

use App\Models\Pemesanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    public function show()
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated. Silakan login terlebih dahulu.'
            ], 401);
        }

        $sewaAktifList = Pemesanan::with(['properti', 'kamar'])
            ->where('customer_id', $user->id)
            ->where('status', 'Dikonfirmasi')
            ->latest()
            ->get();

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
            'status_sewa' => $statusSewa
        ], 200);
    }

    public function update(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.'
            ], 401);
        }

        $rules = [
            'name'             => 'sometimes|string|max:255',
            'email'            => 'sometimes|string|email|max:255|unique:' . $user->getTable() . ',email,' . $user->id,
            'phone'            => 'sometimes|string|max:20',
            'foto'             => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'password'         => 'nullable|string|min:6',
            'current_password' => 'required_with:password|nullable|string',
        ];

        $request->validate($rules);

        // Verifikasi password lama jika user mengisi password baru
        if ($request->filled('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'message' => 'Validasi gagal.',
                    'errors'  => [
                        'current_password' => ['Kata sandi saat ini tidak cocok.']
                    ]
                ], 422);
            }

            $user->password = Hash::make($request->password);
        }

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

        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully!',
            'data'    => $user
        ], 200);
    }
}