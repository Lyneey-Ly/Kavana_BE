<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pembayaran;
use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\Kamar;
use App\Models\FinanceTracker;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PembayaranController extends Controller
{
    /**
     * Helper Internal: Sinkronisasi Status Properti (Penuh / Tersedia)
     */
    private function updatePropertiStatus($propertiId)
    {
        if (!$propertiId) return;

        $totalKamar = Kamar::where('properti_id', $propertiId)->count();
        if ($totalKamar === 0) return;

        $kamarTerisi = Kamar::where('properti_id', $propertiId)
            ->where('status', 'terisi')
            ->count();

        $statusBaru = ($kamarTerisi >= $totalKamar) ? 'Penuh' : 'Tersedia';
        Properti::where('id', $propertiId)->update(['status' => $statusBaru]);
    }

    /**
     * CUSTOMER: Kirim Bukti Pembayaran
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

        // Proteksi Hak Akses Customer
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

        // Simpan file bukti transfer
        $path = $request->file('payment_proof')->store('payment_proofs', 'public');

        // Simpan atau perbarui data pembayaran
        $pembayaran = Pembayaran::updateOrCreate(
            ['pemesanan_id' => $pemesanan->id],
            [
                'amount'         => $request->amount,
                'payment_method' => $request->payment_method,
                'payment_proof'  => $path,
                'payment_date'   => Carbon::now(),
                'status'         => 'Diverifikasi'
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
     * ADMIN: Konfirmasi Pembayaran
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

        // Cek Hak Akses Admin / Pemilik Properti
        $role = strtolower($admin->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        if (!$isSuperAdmin && $pemesanan->properti && $pemesanan->properti->pemilik_id !== $admin->id) {
            return response()->json([
                'message' => 'Forbidden. ID Pemilik Properti tidak cocok dengan ID Admin Login!'
            ], 403);
        }

        DB::beginTransaction();
        try {
            // 1. Update Status Pemesanan
            $pemesanan->status = 'Dikonfirmasi';
            $pemesanan->save();

            // 2. Update Status Pembayaran
            if ($pemesanan->pembayaran) {
                $pemesanan->pembayaran->update([
                    'status'      => 'Dikonfirmasi',
                    'verified_at' => Carbon::now(),
                ]);
            }

            // 3. Update Status Kamar menjadi 'terisi' & Sinkronisasi Status Properti
            if ($pemesanan->kamar_id) {
                $kamar = Kamar::find($pemesanan->kamar_id);
                if ($kamar) {
                    $kamar->update(['status' => 'terisi']);
                }
                $this->updatePropertiStatus($pemesanan->properti_id);
            }

            // 4. Catat Otomatis ke Finance Tracker
            $nominal = $pemesanan->pembayaran->amount ?? $pemesanan->total_price ?? 0;
            $namaProperti = $pemesanan->properti->title ?? $pemesanan->properti->nama_properti ?? 'Hunian Kost';

            $finance = FinanceTracker::create([
                'user_id'     => $pemesanan->customer_id,
                'type'        => 'pengeluaran',
                'description' => 'Pembayaran Sewa ' . $namaProperti,
                'amount'      => $nominal,
                'category'    => 'Tagihan Kost',
                'date'        => now()->toDateString(),
            ]);

            // NOTIFIKASI: ke Customer bahwa pembayaran telah dikonfirmasi
            NotificationService::send(
                $pemesanan->customer_id,
                'Pembayaran Dikonfirmasi',
                'Pembayaran sewa Anda telah diverifikasi oleh Admin. Selamat menempati kamar!',
                '/riwayattransaksi',
                'pembayaran'
            );

            DB::commit();

            return response()->json([
                'message' => 'Pembayaran berhasil dikonfirmasi, kamar diset terisi, dan terdata di Finance Tracker!',
                'data'    => $pemesanan->load(['pembayaran', 'properti', 'kamar']),
                'finance' => $finance
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Gagal memproses konfirmasi pembayaran: ' . $e->getMessage());

            return response()->json([
                'message' => 'Gagal mengonfirmasi pembayaran!',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * ADMIN: Tampilkan Tagihan/Order (Khusus Properti Milik Admin Login)
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