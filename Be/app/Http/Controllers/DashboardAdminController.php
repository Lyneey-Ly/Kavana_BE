<?php

namespace App\Http\Controllers;

use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\User;
use App\Models\Complaint;
use App\Models\DokumenSewa; // 👈 Imported Model DokumenSewa
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardAdminController extends Controller
{
    /**
     * Mengambil Ringkasan Statistik Utama Dashboard Admin (Terkunci per Pemilik)
     */
    public function index()
    {
        $admin = Auth::guard('sanctum')->user();

        if (!$admin) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $role = strtolower($admin->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        // 🔒 1. Ambil HANYA ID Properti milik admin yang login (Superadmin ambil semua)
        $myPropertyIds = Properti::when(!$isSuperAdmin, function ($q) use ($admin) {
            return $q->where('pemilik_id', $admin->id);
        })->pluck('id');

        // Ambil ID Pemesanan terkait properti milik admin ini
        $myPemesananIds = Pemesanan::whereIn('properti_id', $myPropertyIds)->pluck('id');

        // 2. Ringkasan Kartu Utama (Terfilter)
        $totalPendapatan = Pemesanan::whereIn('properti_id', $myPropertyIds)
            ->where('status', 'Dikonfirmasi')
            ->sum('total_price');

        $totalProperti = $myPropertyIds->count();

        // Hitung berapa properti milik admin ini yang sedang diisi
        $propertiTerisi = Pemesanan::whereIn('properti_id', $myPropertyIds)
            ->where('status', 'Dikonfirmasi')
            ->distinct('properti_id')
            ->count('properti_id');

        // Sisa properti milik admin ini yang belum terisi
        $propertiKosong = max(0, $totalProperti - $propertiTerisi);

        // Total Customer unik yang memesan di properti milik admin ini
        $totalCustomer = Pemesanan::whereIn('properti_id', $myPropertyIds)
            ->distinct('customer_id')
            ->count('customer_id');

        // Total komplain pending untuk properti milik admin ini
        $komplainPending = Complaint::whereIn('properti_id', $myPropertyIds)
            ->where('status', 'Pending')
            ->count();

        // 🖊️ 3. Total Dokumen Sewa yang Perlu TTD (Draft / Belum TTD) untuk Properti Admin Ini
        $dokumenPerluTTD = DokumenSewa::whereIn('pemesanan_id', $myPemesananIds)
            ->where(function ($query) {
                $query->whereNull('customer_signature')
                      ->orWhere('status', 'Draft');
            })
            ->count();

        // 4. Transaksi Terbaru (5 Pemesanan Terakhir Milik Admin Ini)
        $transaksiTerbaru = Pemesanan::with(['customer', 'properti'])
            ->whereIn('properti_id', $myPropertyIds)
            ->latest()
            ->get();

        // 5. Grafik Pendapatan Bulanan Tahun Ini (Khusus Properti Admin Ini)
        $pendapatanBulanan = Pemesanan::select(
                DB::raw('MONTH(created_at) as bulan'),
                DB::raw('SUM(total_price) as total')
            )
            ->whereIn('properti_id', $myPropertyIds)
            ->where('status', 'Dikonfirmasi')
            ->whereYear('created_at', date('Y'))
            ->groupBy('bulan')
            ->orderBy('bulan', 'ASC')
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil data statistik dashboard admin',
            'admin'   => [
                'id'   => $admin->id,
                'nama' => $admin->name
            ],
            'data'    => [
                'cards' => [
                    'total_pendapatan'  => (int) $totalPendapatan,
                    'total_properti'    => $totalProperti,
                    'properti_terisi'   => $propertiTerisi,
                    'properti_kosong'   => $propertiKosong,
                    'total_customer'    => $totalCustomer,
                    'komplain_pending'  => $komplainPending,
                    'dokumen_perlu_ttd' => $dokumenPerluTTD, // 👈 Dikirim ke card frontend
                ],
                'pendapatan_bulanan' => $pendapatanBulanan,
                'transaksi_terbaru'  => $transaksiTerbaru,
            ]
        ], 200);
    }

    /**
     * Data Penyewa Aktif (Khusus Properti Milik Admin Login)
     */
    public function penyewaAktif()
    {
        $admin = Auth::guard('sanctum')->user();
        $role = strtolower($admin->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        $myPropertyIds = Properti::when(!$isSuperAdmin, function ($q) use ($admin) {
            return $q->where('pemilik_id', $admin->id);
        })->pluck('id');

        $penyewa = Pemesanan::with(['customer', 'properti'])
            ->whereIn('properti_id', $myPropertyIds)
            ->where('status', 'Dikonfirmasi') 
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil data penyewa aktif',
            'data'    => $penyewa
        ], 200);
    }

    /**
     * Data Tagihan & Order (Khusus Transaksi Properti Milik Admin Login)
     */
    public function tagihanAndOrder(Request $request)
    {
        $admin = Auth::guard('sanctum')->user();
        $role = strtolower($admin->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        $myPropertyIds = Properti::when(!$isSuperAdmin, function ($q) use ($admin) {
            return $q->where('pemilik_id', $admin->id);
        })->pluck('id');

        $query = Pemesanan::with(['customer', 'properti'])
            ->whereIn('properti_id', $myPropertyIds);

        if ($request->has('status') && $request->status != '') {
            $query->where('status', $request->status);
        }

        $tagihanOrder = $query->latest()->get();

        return response()->json([
            'message' => 'Berhasil mengambil data tagihan dan order',
            'data'    => $tagihanOrder
        ], 200);
    }
}