<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pemesanan;
use Illuminate\Support\Facades\Auth;

class FinanceController extends Controller
{
    /**
     * ADMIN: Laporan Keuangan (Task 3.15)
     */
    public function laporanGlobal()
    {
        // Hitung total uang dari pemesanan yang statusnya sudah Dikonfirmasi (Lunas)
        $totalPemasukan = Pemesanan::where('status', 'Dikonfirmasi')->sum('total_price');
        
        // Ambil rincian transaksi sukses
        $transaksiSukses = Pemesanan::with(['customer', 'properti'])
            ->where('status', 'Dikonfirmasi')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil laporan keuangan global.',
            'total_pemasukan' => $totalPemasukan,
            'ringkasan_transaksi' => $transaksiSukses
        ], 200);
    }

    /**
     * CUSTOMER: Track Finance User (Task 3.17)
     */
    public function trackFinanceCustomer()
    {
        $user = Auth::guard('sanctum')->user();

        // Hitung total pengeluaran si customer untuk sewa kosan
        $totalPengeluaran = Pemesanan::where('customer_id', $user->id)
            ->where('status', 'Dikonfirmasi')
            ->sum('total_price');

        return response()->json([
            'message' => 'Berhasil mengambil track finance customer.',
            'customer_name' => $user->name,
            'total_pengeluaran_kamu' => $totalPengeluaran
        ], 200);
    }
}