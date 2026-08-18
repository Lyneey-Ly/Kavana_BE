<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Administrator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * 🌐 LOGIN / REGISTER DENGAN GOOGLE OAUTH 2.0
     */
    public function googleLogin(Request $request)
    {
        $request->validate([
            'access_token'   => 'required|string',
            'terms_accepted' => 'required|boolean',
        ]);

        try {
    // 1. Verifikasi Access Token ke Server Google via Socialite
    /** @var \Laravel\Socialite\Two\AbstractProvider $provider */
    $provider = Socialite::driver('google');
    $googleUser = $provider->stateless()->userFromToken($request->access_token);
    $email = $googleUser->getEmail();

            // 2. Cek apakah email terdaftar di tabel Administrator
            $admin = Administrator::where('email', $email)->first();
            if ($admin) {
                if (method_exists($admin, 'tokens')) {
                    $admin->tokens()->delete();
                }
                $token = $admin->createToken('admin_token')->plainTextToken;

                $userRole = strtolower($admin->role ?? 'admin');
                $redirectRole = in_array($userRole, ['superadmin', 'super_admin', 'super admin']) ? 'superadmin' : 'admin';

                return response()->json([
                    'message'    => 'Login Google Admin berhasil!',
                    'token'      => $token,
                    'token_type' => 'Bearer',
                    'role'       => $redirectRole,
                    'user'       => $admin
                ], 200);
            }

            // 3. Cek apakah user terdaftar di tabel User
            $user = User::where('email', $email)->first();

            if (!$user) {
                // Buat akun baru jika belum ada
                $user = User::create([
                    'name'              => $googleUser->getName() ?? 'Google User',
                    'email'             => $email,
                    'google_id'         => $googleUser->getId(),
                    'foto'              => $googleUser->getAvatar(),
                    'phone'             => $request->phone ?? null,
                    'password'          => Hash::make(Str::random(24)),
                    'role'              => 'customer',
                    'terms_accepted_at' => $request->terms_accepted ? now() : null,
                ]);
            } else {
                // Tautkan google_id jika belum terhubung
                if (!$user->google_id) {
                    $user->update([
                        'google_id' => $googleUser->getId(),
                        'foto'      => $user->foto ?? $googleUser->getAvatar(),
                    ]);
                }
            }

            // 4. Buat token Sanctum baru
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
            $token = $user->createToken('customer_token')->plainTextToken;

            // 5. Deteksi Redirect Role
            $userRole = strtolower($user->role ?? 'customer');
            if (in_array($userRole, ['superadmin', 'super_admin', 'super admin'])) {
                $redirectRole = 'superadmin';
            } elseif (in_array($userRole, ['admin', 'pemilik', 'owner'])) {
                $redirectRole = 'admin';
            } else {
                $redirectRole = 'customer';
            }

            return response()->json([
                'message'    => 'Login Google berhasil!',
                'token'      => $token,
                'token_type' => 'Bearer',
                'role'       => $redirectRole,
                'user'       => $user
            ], 200);

        } catch (\GuzzleHttp\Exception\ClientException $e) {
            return response()->json([
                'message' => 'Token Google tidak valid atau sudah kadaluarsa.',
                'error'   => 'Google OAuth Invalid Token'
            ], 401);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal autentikasi Google.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function registerCustomer(Request $request)
    {
        $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|string|email|max:255|unique:users',
            'phone'    => 'required|string|max:20',
            'password' => 'required|string|min:6',
            'foto'     => 'nullable|image|mimes:jpeg,png,jpg|max:2048', 
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('fotos', 'public'); 
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => Hash::make($request->password),
            'foto'     => $fotoPath, 
        ]);

        $token = $user->createToken('customer_token')->plainTextToken;

        return response()->json([
            'message'    => 'Customer registered successfully!',
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => $user
        ], 201);
    }

    /**
     * 🌟 UNIFIED LOGIN
     */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        // 1. Cek di tabel Administrator
        $admin = Administrator::where('email', $request->email)->first();
        if ($admin && Hash::check($request->password, $admin->password)) {
            if (method_exists($admin, 'tokens')) {
                $admin->tokens()->delete();
            }
            $token = $admin->createToken('admin_token')->plainTextToken;

            $userRole = strtolower($admin->role ?? 'admin');
            $redirectRole = in_array($userRole, ['superadmin', 'super_admin', 'super admin']) ? 'superadmin' : 'admin';

            return response()->json([
                'message'    => 'Login berhasil!',
                'token'      => $token,
                'token_type' => 'Bearer',
                'role'       => $redirectRole,
                'user'       => $admin
            ], 200);
        }

        // 2. Cek di tabel User
        $user = User::where('email', $request->email)->first();
        if ($user && Hash::check($request->password, $user->password)) {
            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
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
                'message'    => 'Login berhasil!',
                'token'      => $token,
                'token_type' => 'Bearer',
                'role'       => $redirectRole,
                'user'       => $user
            ], 200);
        }

        return response()->json([
            'message' => 'Email atau password yang Anda masukkan salah.'
        ], 401);
    }

    public function loginCustomer(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'The provided credentials do not match our records.'
            ], 401);
        }

        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }
        $token = $user->createToken('customer_token')->plainTextToken;

        return response()->json([
            'message'    => 'Customer logged in successfully!', 
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => $user
        ], 200);
    }

    public function loginAdmin(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $admin = Administrator::where('email', $request->email)->first();

        if (!$admin) {
            $admin = User::where('email', $request->email)
                         ->whereIn('role', ['admin', 'pemilik', 'owner', 'superadmin'])
                         ->first();
        }

        if (!$admin || !Hash::check($request->password, $admin->password)) {
            return response()->json([
                'message' => 'Admin credentials do not match our records.'
            ], 401);
        }

        if (method_exists($admin, 'tokens')) {
            $admin->tokens()->delete();
        }
        $token = $admin->createToken('admin_token')->plainTextToken;

        return response()->json([
            'message'    => 'Admin/Owner logged in successfully!',
            'token'      => $token,
            'token_type' => 'Bearer',
            'role'       => $admin->role ?? 'admin',
            'user'       => $admin
        ], 200);
    }

    /**
     * 👑 LOGIN SUPER ADMIN
     */
    public function loginSuperAdmin(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $superadmin = Administrator::where('email', $request->email)->first();

        if (!$superadmin) {
            $superadmin = User::where('email', $request->email)->first();
        }

        if (!$superadmin || !Hash::check($request->password, $superadmin->password)) {
            return response()->json([
                'message' => 'Kredensial Super Admin tidak cocok dengan data kami.'
            ], 401);
        }

        $userRole = strtolower($superadmin->role ?? '');
        if (!in_array($userRole, ['superadmin', 'super_admin', 'super admin'])) {
            return response()->json([
                'message' => 'Akses ditolak! Akun Anda tidak memiliki hak akses Super Admin.'
            ], 403);
        }

        if (method_exists($superadmin, 'tokens')) {
            $superadmin->tokens()->delete();
        }
        $token = $superadmin->createToken('superadmin_token')->plainTextToken;

        return response()->json([
            'message'    => 'Super Admin logged in successfully!',
            'token'      => $token,
            'token_type' => 'Bearer',
            'role'       => $superadmin->role,
            'user'       => $superadmin
        ], 200);
    }

    public function registerAdmin(Request $request)
    {
        $request->validate([
            'name'         => 'required|string|max:255',
            'email'        => 'required|string|email|unique:users',
            'password'     => 'required|string|min:8',
            'admin_secret' => 'required'
        ]);

        if ($request->admin_secret !== 'KAFANA2026') {
            return response()->json([
                'message' => 'Kode Rahasia Pendaftaran Admin Salah!'
            ], 403);
        }

        $admin = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => bcrypt($request->password),
            'role'     => 'admin',
        ]);

        return response()->json([
            'message' => 'Registrasi Admin Berhasil!',
            'data'    => $admin
        ], 201);
    }

    /**
     * 🚪 LOGOUT (Fixed Null Pointer on currentAccessToken)
     */
    public function logout(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated atau token tidak valid.'
            ], 401);
        }

        // Pengecekan aman agar tidak terjadi error jika currentAccessToken() null
        if (method_exists($user, 'currentAccessToken') && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        } elseif (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully!'
        ], 200);
    }
}