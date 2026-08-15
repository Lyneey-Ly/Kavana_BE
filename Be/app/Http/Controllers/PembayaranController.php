<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pembayaran;
use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\Kamar;
use App\Models\FinanceTracker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PembayaranController extends Controller
{
    /**
     * CUSTOMER: Kirim Bukti Pembayaran (Dengan Validasi Pemilik Pesanan)
     */
    public function bayar(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'pemesanan_id'   => 'required|exists:pemesanans,id',
            'amount'         => 'required|numeric|min:1000',
            'payment_method' => 'required|string|max:50',
            'payment_proof'  => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $pemesanan = Pemesanan::find($request->pemesanan_id);

        if (!$pemesanan) {
            return response()->json(['message' => 'Data pemesanan tidak ditemukan'], 404);
        }

        // Proteksi Customer
        if ($pemesanan->customer_id !== $user->id) {
            return response()->json([
                'message' => 'Forbidden. Anda tidak berhak mengunggah pembayaran untuk pemesanan ini!'
            ], 403);
        }

        if ($pemesanan->status !== 'Tertunda') {
            return response()->json([
                'message' => 'Pemesanan ini tidak dapat dibayar karena berstatus: ' . $pemesanan->status
            ], 400);
        }

        // Upload file bukti transfer
        $path = $request->file('payment_proof')->store('payment_proofs', 'public');

        // Simpan atau update data pembayaran
        $pembayaran = Pembayaran::updateOrCreate(
            ['pemesanan_id' => $pemesanan->id],
            [
                'amount'         => $request->amount,
                'payment_method' => $request->payment_method,
                'payment_proof'  => $path,
                'payment_date'   => Carbon::now()
            ]
        );

        // Update status pemesanan
        $pemesanan->status = 'Diverifikasi';
        $pemesanan->save();

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.',
            'data'    => $pembayaran
        ], 201);
    }

    /**
     * 🔒 ADMIN: Konfirmasi Pembayaran & Otomatis Catat ke Finance Tracker
     */
   

    /**
 * 🔒 ADMIN: Konfirmasi Pembayaran & Otomatis Catat ke Finance Tracker
 */
public function konfirmasi($pemesananId)
{
    $admin = Auth::guard('sanctum')->user();

    if (!$admin) {
        return response()->json(['message' => 'Unauthenticated'], 401);
    }

    $pemesanan = Pemesanan::with(['properti', 'pembayaran'])->find($pemesananId);

    if (!$pemesanan) {
        return response()->json(['message' => 'Data pemesanan tidak ditemukan'], 404);
    }

    // Cek Hak Akses Admin
    $role = strtolower($admin->role ?? '');
    $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

    if (!$isSuperAdmin && $pemesanan->properti && $pemesanan->properti->pemilik_id !== $admin->id) {
        return response()->json([
            'message' => 'Forbidden. ID Pemilik Properti tidak cocok dengan ID Admin Login!'
        ], 403);
    }

    // 1. Ubah status pemesanan
    $pemesanan->update(['status' => 'Dikonfirmasi']);

    // 2. OTOMATIS ubah status kamar menjadi 'terisi'
    if ($pemesanan->kamar_id) {
        $kamar = Kamar::find($pemesanan->kamar_id);
        if ($kamar) {
            $kamar->update(['status' => 'terisi']);
        }
    }

    // 3. 🚀 OTOMATIS CATAT KE FINANCE TRACKER CUSTOMER (DENGAN PENANGANAN ERROR)
    try {
        $nominal = $pemesanan->pembayaran->amount ?? $pemesanan->total_price ?? 0;
        $namaProperti = $pemesanan->properti->title ?? $pemesanan->properti->nama_properti ?? 'Hunian';

        $finance = FinanceTracker::create([
            'user_id'     => $pemesanan->customer_id,
            'type'        => 'pengeluaran',
            'description' => 'Pembayaran Sewa ' . $namaProperti,
            'amount'      => $nominal,
            'category'    => 'Tagihan Kost',
            'date'        => now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Pembayaran berhasil dikonfirmasi dan terdata di Finance Tracker!',
            'data'    => $pemesanan,
            'finance' => $finance
        ], 200);

    } catch (\Exception $e) {
        // Jika ada kesalahan pada database/model, tampilkan detail errornya di sini
        return response()->json([
            'message' => 'Pemesanan dikonfirmasi, TETAPI GAGAL simpan ke Finance Tracker!',
            'error'   => $e->getMessage()
        ], 500);
    }

    Notification::create([
        'user_id'    => 1, // ID Admin
        'type'       => 'payment',
        'title'      => 'Pembayaran Baru',
        'message'    => 'Pembayaran sewa Unit A1 telah diterima',
        'target_url' => '/admin/transaksi',
    ]);

    return response()->json(['message' => 'Pembayaran berhasil']);
}
    /**
     * 🔒 ADMIN: Tampilkan Tagihan/Order (Khusus Properti Milik Admin Login)
     */
    public function indexTagihanOrder()
    {
        $admin = Auth::guard('sanctum')->user();

        if (!$admin) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $role = strtolower($admin->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        $myPropertyIds = Properti::when(!$isSuperAdmin, function ($q) use ($admin) {
            return $q->where('pemilik_id', $admin->id);
        })->pluck('id');

        $data = Pemesanan::with(['customer', 'properti', 'pembayaran', 'kamar'])
            ->whereIn('properti_id', $myPropertyIds)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil data tagihan dan order',
            'data'    => $data
        ], 200);
    }
}