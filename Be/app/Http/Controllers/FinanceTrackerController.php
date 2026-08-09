<?php

namespace App\Http\Controllers;

use App\Models\FinanceTracker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FinanceTrackerController extends Controller
{
    // 1. GET ALL DATA & RINGKASAN SALDO USER
    public function index()
    {
        $userId = Auth::id();

        $transaksi = FinanceTracker::where('user_id', $userId)
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $totalPemasukan = FinanceTracker::where('user_id', $userId)
            ->where('type', 'pemasukan')
            ->sum('amount');

        $totalPengeluaran = FinanceTracker::where('user_id', $userId)
            ->where('type', 'pengeluaran')
            ->sum('amount');

        $saldo = $totalPemasukan - $totalPengeluaran;

        return response()->json([
            'message' => 'Berhasil mengambil data keuangan',
            'data'    => [
                'saldo_saat_ini'   => (int) $saldo,
                'total_pemasukan'   => (int) $totalPemasukan,
                'total_pengeluaran' => (int) $totalPengeluaran,
                'mutasi'            => $transaksi
            ]
        ], 200);
    }

    // 2. SIMPAN CATATAN TRANSAKSI BARU (PEMASUKAN / PENGELUARAN)
    public function store(Request $request)
    {
        $request->validate([
            'type'        => 'required|in:pemasukan,pengeluaran',
            'description' => 'required|string',
            'amount'      => 'required|numeric',
            'category'    => 'required|string',
            'date'        => 'required|date',
        ]);

        $finance = FinanceTracker::create([
            'user_id'     => Auth::id(),
            'type'        => $request->type,
            'description' => $request->description,
            'amount'      => $request->amount,
            'category'    => $request->category,
            'date'        => $request->date,
        ]);

        return response()->json([
            'message' => 'Catatan keuangan berhasil ditambahkan',
            'data'    => $finance
        ], 201);
    }

    // 3. HAPUS CATATAN TRANSAKSI (IKON SAMPAH DI UI)
    public function destroy($id)
    {
        $finance = FinanceTracker::where('user_id', Auth::id())->find($id);

        if (!$finance) {
            return response()->json(['message' => 'Data tidak ditemukan'], 404);
        }

        $finance->delete();

        return response()->json([
            'message' => 'Catatan keuangan berhasil dihapus'
        ], 200);
    }
}