<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pemesanan;
use App\Models\Properti; // 👈 1. TAMBAHKAN IMPORT MODEL PROPERTI DI SINI
use Illuminate\Support\Facades\Auth;

class FinanceController extends Controller
{
    public function laporanGlobal(Request $request)
    {
        try {
            $admin = $request->user();

            if (!$admin) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Unauthenticated.'
                ], 401);
            }

            // 1. Cek Role Admin / Superadmin
            $role = strtolower($admin->role ?? '');
            $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

            // 2. Filter ID Properti milik Admin (berdasarkan kolom pemilik_id)
            $propertiIds = $isSuperAdmin
                ? Properti::pluck('id')
                : Properti::where('pemilik_id', $admin->id)->pluck('id');

            // 3. Query Utama Pemesanan dengan Relasi
            $query = Pemesanan::with([
                'customer:id,name,email,phone',
                'properti:id,title,price_per_month,address'
            ])->whereIn('properti_id', $propertiIds);

            // 4. Filter Opsional (Bulan & Tahun)
            if ($request->filled('bulan')) {
                $query->whereMonth('created_at', $request->bulan);
            }

            if ($request->filled('tahun')) {
                $query->whereYear('created_at', $request->tahun);
            }

            if ($request->filled('properti_id')) {
                $query->where('properti_id', $request->properti_id);
            }

            // 5. Hitung Total Pemasukan dari pesanan yang Dikonfirmasi
            $totalPemasukan = (clone $query)
                ->where('status', 'Dikonfirmasi')
                ->sum('total_price');

            // 6. Hitung Total Nominal Pending (Tertunda/Pending)
            $totalPending = (clone $query)
                ->whereIn('status', ['Tertunda', 'Pending'])
                ->sum('total_price');

            // 7. Rincian Transaksi yang Sukses
            $transaksiSukses = (clone $query)
                ->where('status', 'Dikonfirmasi')
                ->orderBy('id', 'desc')
                ->get();

            return response()->json([
                'status'              => 'success',
                'message'             => 'Berhasil mengambil laporan keuangan.',
                'total_pemasukan'     => (float) $totalPemasukan,
                'total_pending'       => (float) $totalPending,
                'ringkasan_transaksi' => $transaksiSukses
            ], 200);

        } catch (\Throwable $th) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal memuat laporan keuangan: ' . $th->getMessage(),
                'file'    => $th->getFile(),
                'line'    => $th->getLine()
            ], 500);
        }
    }

    public function trackFinanceCustomer(Request $request)
    {
        $user = Auth::guard('sanctum')->user() ?? $request->user();

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthenticated.'
            ], 401);
        }

        // Hitung total pengeluaran si customer untuk sewa kosan
        $totalPengeluaran = Pemesanan::where('customer_id', $user->id)
            ->where('status', 'Dikonfirmasi')
            ->sum('total_price');

        return response()->json([
            'message'                => 'Berhasil mengambil track finance customer.',
            'customer_name'          => $user->name,
            'total_pengeluaran_kamu' => (float) $totalPengeluaran
        ], 200);
    }
}