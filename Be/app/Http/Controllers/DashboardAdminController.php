<?php

namespace App\Http\Controllers;

use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\User;
use App\Models\Complaint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DashboardAdminController extends Controller
{
    /**
     * Mengambil Ringkasan Statistik Utama Dashboard Admin
     */
    public function index()
    {
        $admin = Auth::guard('sanctum')->user();

        // 1. Ringkasan Kartu Utama
        $totalPendapatan = Pemesanan::where('status', 'Dikonfirmasi')
            ->sum('total_price');

        $totalProperti  = Properti::count();

        // --- PERBAIKAN DI SINI ---
        // Hitung berapa properti unik yang sedang diisi berdasarkan pemesanan yang Dikonfirmasi
        $propertiTerisi = Pemesanan::where('status', 'Dikonfirmasi')
            ->distinct('properti_id')
            ->count('properti_id');

        // Sisa properti yang belum terisi
        $propertiKosong = max(0, $totalProperti - $propertiTerisi);
        // -------------------------

        // Total Customer unik yang melakukan pemesanan
        $totalCustomer = Pemesanan::distinct('customer_id')
            ->count('customer_id');

        // Total komplain pending
        $komplainPending = Complaint::where('status', 'Pending')
            ->count();

        // 2. Transaksi Terbaru (5 Pemesanan Terakhir)
        $transaksiTerbaru = Pemesanan::with(['customer', 'properti'])
            ->latest()
            ->take(5)
            ->get();

        // 3. Grafik Pendapatan Bulanan Tahun Ini
        $pendapatanBulanan = Pemesanan::select(
                DB::raw('MONTH(created_at) as bulan'),
                DB::raw('SUM(total_price) as total')
            )
            ->where('status', 'Dikonfirmasi')
            ->whereYear('created_at', date('Y'))
            ->groupBy('bulan')
            ->orderBy('bulan', 'ASC')
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil data statistik dashboard admin',
            'admin'   => [
                'id'   => $admin ? $admin->id : null,
                'nama' => $admin ? $admin->name : 'Admin'
            ],
            'data'    => [
                'cards' => [
                    'total_pendapatan' => (int) $totalPendapatan,
                    'total_properti'   => $totalProperti,
                    'properti_terisi'  => $propertiTerisi,
                    'properti_kosong'  => $propertiKosong,
                    'total_customer'   => $totalCustomer,
                    'komplain_pending' => $komplainPending,
                ],
                'pendapatan_bulanan' => $pendapatanBulanan,
                'transaksi_terbaru'  => $transaksiTerbaru,
            ]
        ], 200);
    }

    /**
     * Data Penyewa Aktif (Semua Penyewa dengan Status 'Dikonfirmasi')
     */
    public function penyewaAktif()
    {
        $penyewa = Pemesanan::with(['customer', 'properti'])
            ->where('status', 'Dikonfirmasi') 
            ->latest()
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil data penyewa aktif',
            'data'    => $penyewa
        ], 200);
    }

    /**
     * Data Tagihan & Order (Semua Transaksi Masuk)
     */
    public function tagihanAndOrder(Request $request)
    {
        $query = Pemesanan::with(['customer', 'properti']);

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