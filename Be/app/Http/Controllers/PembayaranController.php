<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pembayaran;
use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\Kamar; // 👈 1. Dipindahkan ke atas bersama model lainnya
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PembayaranController extends Controller
{
    /**
     * CUSTOMER: Kirim Bukti Pembayaran
     */
    public function bayar(Request $request)
    {
        $request->validate([
            'pemesanan_id' => 'required|exists:pemesanans,id',
            'amount' => 'required|numeric|min:1000',
            'payment_method' => 'required|string|max:50',
            'payment_proof' => 'required|image|mimes:jpeg,png,jpg|max:2048', // Maksimal 2MB
        ]);

        $pemesanan = Pemesanan::findOrFail($request->pemesanan_id);

        // Pastikan status pemesanan masih 'Tertunda' sebelum dibayar
        if ($pemesanan->status !== 'Tertunda') {
            return response()->json([
                'message' => 'Pemesanan ini tidak dapat dibayar karena berstatus: ' . $pemesanan->status
            ], 400);
        }

        // Upload file bukti transfer ke folder public storage
        $path = $request->file('payment_proof')->store('payment_proofs', 'public');

        // Simpan atau update data pembayaran
        $pembayaran = Pembayaran::updateOrCreate(
            ['pemesanan_id' => $pemesanan->id],
            [
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,
                'payment_proof' => $path,
                'payment_date' => Carbon::now()
            ]
        );

        // Update status di tabel pemesanan menjadi 'Diverifikasi' (menunggu dicek admin)
        $pemesanan->status = 'Diverifikasi';
        $pemesanan->save();

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.',
            'data' => $pembayaran
        ], 201);
    }

    /**
     * ADMIN: Konfirmasi Pembayaran & Otomatis Ubah Status Kamar
     */
    public function konfirmasi($pemesananId)
    {
        $pemesanan = Pemesanan::findOrFail($pemesananId);
        
        // 1. Ubah status pemesanan
        $pemesanan->update(['status' => 'Berhasil']);

        // 2. OTOMATIS ubah status kamar spesifik menjadi 'Terisi'!
        if ($pemesanan->kamar_id) {
            $kamar = Kamar::find($pemesanan->kamar_id);
            if ($kamar) {
                $kamar->update(['status' => 'Terisi']);
            }
        }

        return response()->json([
            'message' => 'Pembayaran berhasil dikonfirmasi, status kamar otomatis terisi!',
            'data' => $pemesanan
        ]);
    }

    /**
     * ADMIN: Tampilkan Semua Tagihan/Order
     */
    public function indexTagihanOrder()
    {
        // 👈 2. Ditambahkan 'kamar' agar data nomor kamar ikut terbawa ke frontend
        $data = Pemesanan::with(['customer', 'properti', 'pembayaran', 'kamar'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => $data
        ]);
    }
}