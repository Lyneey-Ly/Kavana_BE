<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\Pengeluaran;
use Illuminate\Support\Facades\Auth;

class FinanceController extends Controller
{
    /**
     * 1. GET LAPORAN KEUANGAN GLOBAL ADMIN (PEMASUKAN & PENGELUARAN)
     */
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

            // Cek Role Admin / Superadmin
            $role = strtolower($admin->role ?? '');
            $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

            // Filter ID Properti milik Admin
            $propertiIds = $isSuperAdmin
                ? Properti::pluck('id')->toArray()
                : Properti::where('pemilik_id', $admin->id)->pluck('id')->toArray();

            // --- QUERY PEMASUKAN (PEMESANAN) ---
            $incomeQuery = Pemesanan::with([
                'customer:id,name,email,phone',
                'properti:id,title,price_per_month,address'
            ])->whereIn('properti_id', $propertiIds);

            // --- QUERY PENGELUARAN ---
            $expenseQuery = Pengeluaran::with([
                'properti:id,title,address'
            ])->where(function ($q) use ($propertiIds, $isSuperAdmin) {
                $q->whereIn('properti_id', $propertiIds);
                if ($isSuperAdmin) {
                    $q->orWhereNull('properti_id');
                }
            });

            // Filter Opsional
            if ($request->filled('bulan')) {
                $incomeQuery->whereMonth('created_at', $request->bulan);
                $expenseQuery->whereMonth('date', $request->bulan);
            }

            if ($request->filled('tahun')) {
                $incomeQuery->whereYear('created_at', $request->tahun);
                $expenseQuery->whereYear('date', $request->tahun);
            }

            if ($request->filled('properti_id')) {
                $incomeQuery->where('properti_id', $request->properti_id);
                $expenseQuery->where('properti_id', $request->properti_id);
            }

            // Hitung Total Nominal
            $totalPemasukan = (clone $incomeQuery)
                ->where('status', 'Dikonfirmasi')
                ->sum('total_price');

            $totalPending = (clone $incomeQuery)
                ->whereIn('status', ['Tertunda', 'Pending'])
                ->sum('total_price');

            $totalPengeluaran = (clone $expenseQuery)->sum('amount');
            $saldoBersih = $totalPemasukan - $totalPengeluaran;

            // Transaksi Rincian
            $transaksiSukses = (clone $incomeQuery)
                ->where('status', 'Dikonfirmasi')
                ->orderBy('id', 'desc')
                ->get();

            $transaksiPengeluaran = (clone $expenseQuery)
                ->orderBy('date', 'desc')
                ->orderBy('id', 'desc')
                ->get();

            return response()->json([
                'status'                => 'success',
                'message'               => 'Berhasil mengambil laporan keuangan.',
                'total_pemasukan'       => (float) $totalPemasukan,
                'total_pending'         => (float) $totalPending,
                'total_pengeluaran'     => (float) $totalPengeluaran,
                'saldo_bersih'          => (float) $saldoBersih,
                'ringkasan_transaksi'   => $transaksiSukses,
                'ringkasan_pengeluaran' => $transaksiPengeluaran
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

    /**
     * 2. TAMBAH CATATAN PENGELUARAN BARU
     */
    public function storePengeluaran(Request $request)
    {
        $request->validate([
            'properti_id' => 'nullable|exists:propertis,id',
            'category'    => 'required|string|max:100',
            'description' => 'required|string',
            'amount'      => 'required|numeric|min:0',
            'date'        => 'required|date',
        ]);

        try {
            $pengeluaran = Pengeluaran::create([
                'properti_id' => $request->properti_id ?: null,
                'user_id'     => Auth::id(),
                'category'    => $request->category,
                'description' => $request->description,
                'amount'      => $request->amount,
                'date'        => $request->date,
            ]);

            return response()->json([
                'status'  => 'success',
                'message' => 'Pengeluaran operasional berhasil dicatat.',
                'data'    => $pengeluaran->load('properti')
            ], 201);
        } catch (\Throwable $th) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal mencatat pengeluaran: ' . $th->getMessage()
            ], 500);
        }
    }

    /**
     * 3. HAPUS CATATAN PENGELUARAN
     */
    public function destroyPengeluaran($id)
    {
        try {
            $pengeluaran = Pengeluaran::findOrFail($id);
            $pengeluaran->delete();

            return response()->json([
                'status'  => 'success',
                'message' => 'Catatan pengeluaran berhasil dihapus.'
            ], 200);
        } catch (\Throwable $th) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Gagal menghapus pengeluaran: ' . $th->getMessage()
            ], 500);
        }
    }

    /**
     * 4. TRACK FINANCE CUSTOMER (EKSISTING)
     */
    public function trackFinanceCustomer(Request $request)
    {
        $user = Auth::guard('sanctum')->user() ?? $request->user();

        if (!$user) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Unauthenticated.'
            ], 401);
        }

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