<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Administrator;
use App\Models\User;
use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\Pembayaran;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SuperAdminController extends Controller
{
    /**
     * 📊 1. RINGKASAN STATISTIK PLATFORM
     */
    public function dashboardStats()
    {
        $totalUsers = User::count();
        // admin = Pemilik Kost
        $totalPemilik = Administrator::where('role', 'admin')->count(); 
        // superadmin = Superadmin
        $totalSuperadmin = Administrator::where('role', 'superadmin')->count();

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

        if ($request->has('role') && in_array($request->role, ['admin', 'superadmin'])) {
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
        // Hanya izinkan 'admin' (Pemilik Kost) dan 'superadmin'
        $request->validate([
            'name'     => 'required|string|max:100',
            'email'    => 'required|string|email|max:255|unique:administrators,email',
            'phone'    => 'required|string|max:20',
            'password' => 'required|string|min:8',
            'role'     => ['required', Rule::in(['admin', 'superadmin'])],
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
        $currentUser = $request->user();
        $targetAccount = Administrator::find($id);

        if (!$targetAccount) {
            return response()->json(['message' => 'Akun tidak ditemukan'], 404);
        }

        if ($currentUser && (int)$targetAccount->id === (int)$currentUser->id) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun Anda sendiri!'], 400);
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
     * 📱 3. KELOLA DATA USER TERDAFTAR
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

    /**
     * 💰 4. PENDAPATAN ADMIN (PEMILIK KOST) PER BULAN
     */
    public function adminRevenue(Request $request)
    {
        $year = $request->get('year', Carbon::now()->year);
        $month = $request->get('month'); // Optional, null = all months

        $query = Pemesanan::query()
            ->join('propertis', 'pemesanans.properti_id', '=', 'propertis.id')
            ->join('administrators', 'propertis.pemilik_id', '=', 'administrators.id')
            ->join('pembayarans', 'pemesanans.id', '=', 'pembayarans.pemesanan_id')
            ->where('pemesanans.status', 'Dikonfirmasi')
            ->whereYear('pemesanans.check_in_date', $year)
            ->where('administrators.role', 'admin')
            ->select(
                'administrators.id as admin_id',
                'administrators.name as admin_name',
                'administrators.email as admin_email',
                DB::raw('MONTH(pemesanans.check_in_date) as month'),
                DB::raw('SUM(pemesanans.total_price) as total_revenue'),
                DB::raw('COUNT(pemesanans.id) as total_bookings')
            )
            ->groupBy('administrators.id', 'administrators.name', 'administrators.email', DB::raw('MONTH(pemesanans.check_in_date)'));

        if ($month) {
            $query->whereMonth('pemesanans.check_in_date', $month);
        }

        $revenueData = $query->orderBy('administrators.name')->orderBy('month')->get();

        // Format data for frontend
        $formattedData = $revenueData->groupBy('admin_id')->map(function ($items, $adminId) {
            $first = $items->first();
            return [
                'admin_id' => $adminId,
                'admin_name' => $first->admin_name,
                'admin_email' => $first->admin_email,
                'monthly_revenue' => $items->map(function ($item) {
                    return [
                        'month' => (int)$item->month,
                        'month_name' => Carbon::create()->month($item->month)->format('F'),
                        'revenue' => (float)$item->total_revenue,
                        'bookings' => (int)$item->total_bookings,
                    ];
                })->values(),
                'yearly_total' => $items->sum('total_revenue'),
                'yearly_bookings' => $items->sum('total_bookings'),
            ];
        })->values();

        // Summary stats
        $totalPlatformRevenue = $formattedData->sum('yearly_total');
        $totalPlatformBookings = $formattedData->sum('yearly_bookings');
        $activeAdmins = $formattedData->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'summary' => [
                    'total_platform_revenue' => (float)$totalPlatformRevenue,
                    'total_platform_bookings' => (int)$totalPlatformBookings,
                    'active_admins' => (int)$activeAdmins,
                    'year' => (int)$year,
                ],
                'admins' => $formattedData,
            ]
        ], 200);
    }



    /**
     * 📈 5. STATISTIK PLATFORM LENGKAP
     */
    public function platformStats(Request $request)
    {
        $year = $request->get('year', Carbon::now()->year);

        // Monthly revenue for the whole platform
        $monthlyRevenue = Pemesanan::query()
            ->join('pembayarans', 'pemesanans.id', '=', 'pembayarans.pemesanan_id')
            ->where('pemesanans.status', 'Dikonfirmasi')
            ->whereYear('pemesanans.check_in_date', $year)
            ->select(
                DB::raw('MONTH(pemesanans.check_in_date) as month'),
                DB::raw('SUM(pemesanans.total_price) as revenue'),
                DB::raw('COUNT(pemesanans.id) as bookings')
            )
            ->groupBy(DB::raw('MONTH(pemesanans.check_in_date)'))
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => (int)$item->month,
                    'month_name' => Carbon::create()->month($item->month)->format('M'),
                    'revenue' => (float)$item->revenue,
                    'bookings' => (int)$item->bookings,
                ];
            });

        // Fill missing months
        $completeMonthly = collect(range(1, 12))->map(function ($m) use ($monthlyRevenue) {
            $found = $monthlyRevenue->firstWhere('month', $m);
            return $found ?? [
                'month' => $m,
                'month_name' => Carbon::create()->month($m)->format('M'),
                'revenue' => 0,
                'bookings' => 0,
            ];
        });

        // Property stats
        $totalProperties = Properti::count();
        $activeProperties = Properti::where('status', 'aktif')->count();
        $totalRooms = DB::table('kamars')->count();
        $occupiedRooms = DB::table('kamars')->where('status', 'Terisi')->count();

        // User growth
        $monthlyUsers = User::whereYear('created_at', $year)
            ->select(DB::raw('MONTH(created_at) as month'), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw('MONTH(created_at)'))
            ->orderBy('month')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => (int)$item->month,
                    'month_name' => Carbon::create()->month($item->month)->format('M'),
                    'count' => (int)$item->count,
                ];
            });

        $completeMonthlyUsers = collect(range(1, 12))->map(function ($m) use ($monthlyUsers) {
            $found = $monthlyUsers->firstWhere('month', $m);
            return $found ?? [
                'month' => $m,
                'month_name' => Carbon::create()->month($m)->format('M'),
                'count' => 0,
            ];
        });

        // Top 5 admins by revenue
        $topAdmins = Pemesanan::query()
            ->join('propertis', 'pemesanans.properti_id', '=', 'propertis.id')
            ->join('administrators', 'propertis.pemilik_id', '=', 'administrators.id')
            ->join('pembayarans', 'pemesanans.id', '=', 'pembayarans.pemesanan_id')
            ->where('pemesanans.status', 'Dikonfirmasi')
            ->whereYear('pemesanans.check_in_date', $year)
            ->where('administrators.role', 'admin')
            ->select(
                'administrators.id',
                'administrators.name',
                DB::raw('SUM(pemesanans.total_price) as total_revenue'),
                DB::raw('COUNT(pemesanans.id) as total_bookings')
            )
            ->groupBy('administrators.id', 'administrators.name')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'admin_id' => $item->id,
                    'admin_name' => $item->name,
                    'revenue' => (float)$item->total_revenue,
                    'bookings' => (int)$item->total_bookings,
                ];
            });

        // Top 5 properties by revenue (Menggunakan Eager Loading Relasi Pemilik)
        $topProperties = Pemesanan::query()
            ->where('status', 'Dikonfirmasi')
            ->whereYear('check_in_date', $year)
            ->whereHas('pembayaran')
            ->with(['properti.pemilik'])
            ->select(
                'properti_id',
                DB::raw('SUM(total_price) as total_revenue'),
                DB::raw('COUNT(id) as total_bookings')
            )
            ->groupBy('properti_id')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'property_id'   => $item->properti_id,
                    'property_name' => $item->properti?->title ?? 'Properti Tidak Ditemukan',
                    'pemilik_name'  => $item->properti?->pemilik?->name ?? 'Pemilik Kost',
                    'revenue'       => (float)$item->total_revenue,
                    'bookings'      => (int)$item->total_bookings,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => [
                'year' => (int)$year,
                'monthly_revenue' => $completeMonthly,
                'monthly_users' => $completeMonthlyUsers,
                'property_stats' => [
                    'total' => $totalProperties,
                    'active' => $activeProperties,
                    'total_rooms' => $totalRooms,
                    'occupied_rooms' => $occupiedRooms,
                    'occupancy_rate' => $totalRooms > 0 ? round(($occupiedRooms / $totalRooms) * 100, 1) : 0,
                ],
                'top_admins' => $topAdmins,
                'top_properties' => $topProperties,
            ]
        ], 200);
    }






    /**
     * 🧾 6. SEMUA TRANSAKSI (SUPERADMIN VIEW)
     */
    public function allTransactions(Request $request)
    {
        $query = Pemesanan::query()
            ->with(['customer', 'properti.pemilik', 'kamar', 'pembayaran'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->has('status') && $request->status !== 'semua') {
            $query->where('status', $request->status);
        }
        if ($request->has('year')) {
            $query->whereYear('check_in_date', $request->year);
        }
        if ($request->has('month')) {
            $query->whereMonth('check_in_date', $request->month);
        }
        if ($request->has('admin_id')) {
            $query->whereHas('properti', function ($q) use ($request) {
                $q->where('pemilik_id', $request->admin_id);
            });
        }
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('customer', function ($q2) use ($search) {
                    $q2->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('properti', function ($q2) use ($search) {
                    $q2->where('title', 'like', "%{$search}%");
                });
            });
        }

        $perPage = $request->get('per_page', 20);
        $transactions = $query->paginate($perPage);

        $formattedTransactions = $transactions->getCollection()->map(function ($item) {
            $pembayaran = $item->pembayaran;
            return [
                'id' => $item->id,
                'booking_date' => $item->booking_date,
                'check_in_date' => $item->check_in_date,
                'duration_months' => $item->duration_months,
                'total_price' => (float)$item->total_price,
                'status' => $item->status,
                'expired_at' => $item->expired_at,
                'customer' => $item->customer ? [
                    'id' => $item->customer->id,
                    'name' => $item->customer->name,
                    'email' => $item->customer->email,
                    'phone' => $item->customer->phone,
                ] : null,
                'properti' => $item->properti ? [
                    'id' => $item->properti->id,
                    'title' => $item->properti->title,
                    'pemilik' => $item->properti->pemilik ? [
                        'id' => $item->properti->pemilik->id,
                        'name' => $item->properti->pemilik->name,
                    ] : null,
                ] : null,
                'kamar' => $item->kamar ? [
                    'id' => $item->kamar->id,
                    'nomor_kamar' => $item->kamar->nomor_kamar,
                ] : null,
                'payment' => $pembayaran ? [
                    'id' => $pembayaran->id,
                    'amount' => (float)$pembayaran->amount,
                    'method' => $pembayaran->payment_method,
                    'verified_at' => $pembayaran->verified_at,
                ] : null,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => [
                'transactions' => $formattedTransactions,
                'pagination' => [
                    'current_page' => $transactions->currentPage(),
                    'last_page' => $transactions->lastPage(),
                    'per_page' => $transactions->perPage(),
                    'total' => $transactions->total(),
                ]
            ]
        ], 200);
    }

    /**
     * 📋 7. LIST ADMIN UNTUK FILTER
     */
    public function adminList()
    {
        $admins = Administrator::where('role', 'admin')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $admins
        ], 200);
    }
}