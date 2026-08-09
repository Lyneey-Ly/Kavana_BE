<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SuperAdminController extends Controller
{
    /**
     * 📊 1. RINGKASAN STATISTIK PLATFORM
     */
 /**
     * 📊 1. RINGKASAN STATISTIK PLATFORM
     */
    public function dashboardStats()
    {
        $totalUsers = User::count();
        $totalPemilik = Administrator::where('role', 'pemilik')->count();
        
        // 🟢 FIX: Ambil role 'admin' DAN 'superadmin' agar Pak Ahmad ikut terhitung
        $totalSuperadmin = Administrator::whereIn('role', ['admin', 'superadmin'])->count();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'total_users'      => $totalUsers,
                'total_pemilik'    => $totalPemilik,
                'total_superadmin' => $totalSuperadmin,
            ]
        ], 200);
    }
    /**
     * 👥 2. KELOLA DATA PEMILIK KOST & SUPERADMIN
     */
    public function getAdministrators(Request $request)
    {
        $superadminQuery = Administrator::query();

        if ($request->has('role') && in_array($request->role, ['pemilik', 'admin'])) {
            $superadminQuery->where('role', $request->role);
        }

        $administratorList = $superadminQuery->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data'   => $administratorList
        ], 200);
    }

    public function storeAdministrator(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|string|email|max:255|unique:administrators,email',
            'phone'    => 'required|string|max:20',
            'password' => 'required|string|min:8',
            'role'     => ['required', Rule::in(['pemilik', 'admin'])],
            'foto'     => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('administrators', 'public');
        }

        $newAccount = Administrator::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => Hash::make($request->password),
            'role'     => $request->role,
            'foto'     => $fotoPath,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => "Akun {$newAccount->role} berhasil didaftarkan!",
            'data'    => $newAccount
        ], 201);
    }

    public function destroyAdministrator(Request $request, $id)
    {
        // 🟢 FIX: Menggunakan $request->user() agar aman dari Null Pointer
        $currentUser = $request->user();
        $targetAccount = Administrator::find($id);

        if (!$targetAccount) {
            return response()->json(['message' => 'Akun tidak ditemukan'], 404);
        }

        // Cegah Superadmin menghapus akunnya sendiri
        if ($currentUser && $targetAccount->id === $currentUser->id) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun Superadmin Anda sendiri!'], 400);
        }

        if ($targetAccount->foto) {
            Storage::disk('public')->delete($targetAccount->foto);
        }

        $targetAccount->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Akun pengelola berhasil dihapus.'
        ], 200);
    }

    /**
     * 📱 3. KELOLA DATA USER TERDAFTAR IN WEB
     */
    public function getUsers()
    {
        $userList = User::orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'total'  => $userList->count(),
            'data'   => $userList
        ], 200);
    }

    // 🟢 FITUR BARU: Hapus User Pencari/Penghuni Kost
    public function destroyUser($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan'], 404);
        }

        $user->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'User berhasil dihapus dari platform.'
        ], 200);
    }
}