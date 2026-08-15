<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Administrator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function registerCustomer(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'foto' => 'nullable|image|mimes:jpeg,png,jpg|max:2048', 
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('fotos', 'public'); 
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'foto' => $fotoPath, 
        ]);

        // Langsung buatkan token setelah registrasi berhasil
        $token = $user->createToken('customer_token')->plainTextToken;

        return response()->json([
            'message' => 'Customer registered successfully!',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    /**
     * 🌟 UNIFIED LOGIN (Otomatis Cek Role User, Admin, atau SuperAdmin)
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 1. Cek di tabel Administrator dulu
        $admin = Administrator::where('email', $request->email)->first();
        if ($admin && Hash::check($request->password, $admin->password)) {
            $admin->tokens()->delete();
            $token = $admin->createToken('admin_token')->plainTextToken;

            $userRole = strtolower($admin->role ?? 'admin');
            $redirectRole = in_array($userRole, ['superadmin', 'super_admin', 'super admin']) ? 'superadmin' : 'admin';

            return response()->json([
                'message' => 'Login berhasil!',
                'token' => $token,
                'token_type' => 'Bearer',
                'role' => $redirectRole,
                'user' => $admin
            ], 200);
        }

        // 2. Cek di tabel User
        $user = User::where('email', $request->email)->first();
        if ($user && Hash::check($request->password, $user->password)) {
            $user->tokens()->delete();
            $token = $user->createToken('user_token')->plainTextToken;

            $userRole = strtolower($user->role ?? 'customer');
            if (in_array($userRole, ['superadmin', 'super_admin', 'super admin'])) {
                $redirectRole = 'superadmin';
            } elseif (in_array($userRole, ['admin', 'pemilik', 'owner'])) {
                $redirectRole = 'admin';
            } else {
                $redirectRole = 'customer';
            }

            return response()->json([
                'message' => 'Login berhasil!',
                'token' => $token,
                'token_type' => 'Bearer',
                'role' => $redirectRole,
                'user' => $user
            ], 200);
        }

        return response()->json([
            'message' => 'Email atau password yang Anda masukkan salah.'
        ], 401);
    }

    public function loginCustomer(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Cari user berdasarkan email
        $user = User::where('email', $request->email)->first();

        // Validasi password secara manual
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.'
            ], 401);
        }

        // Hapus token lama biar tidak menumpuk di database
        $user->tokens()->delete();

        // Buat token baru
        $token = $user->createToken('customer_token')->plainTextToken;

        return response()->json([
            'message' => 'Customer logged in successfully!', 
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 200);
    }

    public function loginAdmin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Cari admin berdasarkan email
        $admin = Administrator::where('email', $request->email)->first();

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json([
                'message' => 'Admin credentials do not match our records.'
            ], 401);
        }

        // Hapus token lama admin
        $admin->tokens()->delete();

        // Buat token baru untuk admin
        $token = $admin->createToken('admin_token')->plainTextToken;

        return response()->json([
            'message' => 'Admin/Owner logged in successfully!',
            'token' => $token,
            'token_type' => 'Bearer',
            'role' => $admin->role,
            'user' => $admin
        ], 200);
    }

    /**
     * 👑 LOGIN SUPER ADMIN
     */
    public function loginSuperAdmin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 1. Cek di tabel Administrator terlebih dahulu
        $superadmin = Administrator::where('email', $request->email)->first();

        // 2. Jika tidak ditemukan di Administrator, cek di tabel User
        if (!$superadmin) {
            $superadmin = User::where('email', $request->email)->first();
        }

        // 3. Validasi Keberadaan Akun & Password
        if (!$superadmin || !Hash::check($request->password, $superadmin->password)) {
            return response()->json([
                'message' => 'Kredensial Super Admin tidak cocok dengan data kami.'
            ], 401);
        }

        // 4. Validasi Role (Memastikan role adalah 'superadmin' atau 'super_admin')
        $userRole = strtolower($superadmin->role ?? '');
        if (!in_array($userRole, ['superadmin', 'super_admin', 'super admin'])) {
            return response()->json([
                'message' => 'Akses ditolak! Akun Anda tidak memiliki hak akses Super Admin.'
            ], 403);
        }

        // 5. Hapus token lama & buat token baru
        $superadmin->tokens()->delete();
        $token = $superadmin->createToken('superadmin_token')->plainTextToken;

        return response()->json([
            'message' => 'Super Admin logged in successfully!',
            'token' => $token,
            'token_type' => 'Bearer',
            'role' => $superadmin->role,
            'user' => $superadmin
        ], 200);
    }

    public function registerAdmin(Request $request)
    {
        // 1. Validasi Input
        $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|string|email|unique:users',
            'password'     => 'required|string|min:8',
            'admin_secret' => 'required' // Kode Pengaman
        ]);

        // 2. Cek Kode Rahasia Admin
        if ($request->admin_secret !== 'KAFANA2026') {
            return response()->json([
                'message' => 'Kode Rahasia Pendaftaran Admin Salah!'
            ], 403);
        }

        // 3. Simpan User Baru dengan Role ADMIN
        $admin = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
            'role'     => 'admin', // Paksa Set Role Admin
        ]);

        return response()->json([
            'message' => 'Registrasi Admin Berhasil!',
            'data'    => $admin
        ], 201);
    }

    public function logout(Request $request)
    {
        // Ambil user/admin yang login menggunakan guard sanctum secara eksplisit
        $user = Auth::guard('sanctum')->user();

        // Amankan jika ternyata user null / token tidak terdeteksi
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated atau token tidak valid.'
            ], 401);
        }

        // Hapus token aktif saat ini
        $user->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully!'
        ], 200);
    }
}