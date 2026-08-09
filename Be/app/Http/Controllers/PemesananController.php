<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\Kamar; // 👈 1. Import Model Kamar
use App\Models\RiwayatStatusPemesanan;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class PemesananController extends Controller
{
    /**
     * CUSTOMER: Melakukan Booking Properti & Unit Kamar Spesifik
     */
    public function booking(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        $request->validate([
            'properti_id'     => 'required|exists:propertis,id',
            'kamar_id'        => 'required|exists:kamars,id', // 👈 2. Validasi kamar_id
            'check_in_date'   => 'required|date|after_or_equal:today',
            'duration_months' => 'required|integer|min:1',
        ]);

        // Cek ketersediaan kamar
        $kamar = Kamar::where('id', $request->kamar_id)
                      ->where('properti_id', $request->properti_id)
                      ->first();

        if (!$kamar) {
            return response()->json([
                'message' => 'Unit kamar tidak ditemukan pada properti ini!'
            ], 404);
        }

        if ($kamar->status !== 'kosong') {
            return response()->json([
                'message' => 'Maaf, unit kamar ini sudah terisi atau tidak tersedia!'
            ], 400);
        }

        $properti = Properti::findOrFail($request->properti_id);
        $totalPrice = $properti->price_per_month * $request->duration_months;

        $pemesanan = Pemesanan::create([
            'customer_id'     => $user->id,
            'properti_id'     => $request->properti_id,
            'kamar_id'        => $request->kamar_id, // 👈 Simpan kamar_id
            'booking_date'    => Carbon::now(),
            'check_in_date'   => $request->check_in_date,
            'duration_months' => $request->duration_months,
            'total_price'     => $totalPrice,
            'status'          => 'Tertunda', 
            'expired_at'      => Carbon::now()->addHour(), // Batas waktu pembayaran 1 jam
        ]);

        return response()->json([
            'message' => 'Booking berhasil diajukan! Silakan lakukan pembayaran dalam waktu 1 jam.',
            'data'    => $pemesanan
        ], 201);
    }

    /**
     * ADMIN: Memperbarui Status Pemesanan & Mengubah Status Unit Kamar Spesifik
     */
    public function updateStatus(Request $request, $id)
    {
        $admin = Auth::guard('sanctum')->user();

        $request->validate([
            'status' => 'required|in:Tertunda,Diverifikasi,Dikonfirmasi,Ditolak,Selesai,Expired,Batal',
        ]);

        $pemesanan = Pemesanan::findOrFail($id);
        $oldStatus = $pemesanan->status;
        $pemesanan->status = $request->status;
        $pemesanan->save();

        // ⚡ 3. SINKRONISASI STATUS UNIT KAMAR OTOMATIS
        if ($pemesanan->kamar_id) {
            $kamar = Kamar::find($pemesanan->kamar_id);
            if ($kamar) {
                if ($request->status === 'Dikonfirmasi') {
                    // Jika pembayaran dikonfirmasi -> Status KAMAR berubah jadi TERISI
                    $kamar->update(['status' => 'Terisi']);
                } elseif (in_array($request->status, ['Selesai', 'Ditolak', 'Expired', 'Batal'])) {
                    // Jika masa sewa selesai / batal / expired -> Status KAMAR kembali TERSEDIA
                    $kamar->update(['status' => 'Tersedia']);
                }
            }
        }

        // Catat ke riwayat perubahan status
        RiwayatStatusPemesanan::create([
            'pemesanan_id' => $pemesanan->id,
            'new_status'   => $request->status,
            'changed_at'   => Carbon::now(),
            'admin_id'     => $admin ? $admin->id : null,
        ]);

        return response()->json([
            'message' => 'Status pemesanan & status kamar berhasil diperbarui!',
            'data'    => [
                'pemesanan_id'      => $pemesanan->id,
                'status_sebelumnya' => $oldStatus,
                'status_baru'       => $pemesanan->status,
            ]
        ], 200);
    }

    /**
     * CUSTOMER: Menampilkan Riwayat Pemesanan
     */
    /**
     * CUSTOMER: Menampilkan Riwayat Pemesanan
     */
    public function riwayatCustomer()
    {
        try {
            $user = Auth::guard('sanctum')->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated / Token tidak valid'
                ], 401);
            }

            // AUTO-EXPIRED: Aman dari null user
            Pemesanan::where('customer_id', $user->id)
                ->where('status', 'Tertunda')
                ->whereNotNull('expired_at')
                ->where('expired_at', '<', Carbon::now())
                ->update(['status' => 'Expired']);

            // Mengambil data riwayat pemesanan dengan relasi aman
            $riwayat = Pemesanan::with(['properti'])
                ->when(method_exists(Pemesanan::class, 'kamar'), function ($query) {
                    $query->with('kamar');
                })
                ->when(method_exists(Pemesanan::class, 'pembayaran'), function ($query) {
                    $query->with('pembayaran');
                })
                ->where('customer_id', $user->id)
                ->orderBy('id', 'desc')
                ->get();

            return response()->json([
                'message' => 'Berhasil mengambil riwayat pemesanan.',
                'data'    => $riwayat
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan pada server!',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * SYSTEM/CUSTOMER: Cek Notifikasi Habis Kontrak
     */
    public function cekNotifikasiKontrak()
    {
        $user = Auth::guard('sanctum')->user();

        // Cari pemesanan milik user yang aktif (Dikonfirmasi)
        $pemesananAktif = Pemesanan::with(['dokumenSewa', 'kamar'])
            ->where('customer_id', $user->id)
            ->where('status', 'Dikonfirmasi')
            ->get();

        $notifikasi = [];

        foreach ($pemesananAktif as $sewa) {
            if ($sewa->dokumenSewa) {
                $endDate = Carbon::parse($sewa->dokumenSewa->end_date);
                $hariTersisa = (int) Carbon::now()->diffInDays($endDate, false);

                // Jika masa kontrak sisa 7 hari atau kurang
                if ($hariTersisa <= 7 && $hariTersisa >= 0) {
                    $nomorKamar = $sewa->kamar ? " ({$sewa->kamar->nomor_kamar})" : "";
                    $notifikasi[] = [
                        'pemesanan_id' => $sewa->id,
                        'pesan'        => "Masa kontrak kos kamu{$nomorKamar} tinggal {$hariTersisa} hari lagi! (Habis pada {$sewa->dokumenSewa->end_date}). Jangan lupa diperpanjang ya."
                    ];
                }
            }
        }

        return response()->json([
            'status'     => 'Sukses',
            'notifikasi' => $notifikasi
        ], 200);
    }

 public function getActiveRental(Request $request)
{
    try {
        // Gunakan Auth Sanctum agar konsisten dengan method lainnya
        $user = Auth::guard('sanctum')->user() ?? $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated / Token tidak valid'
            ], 401);
        }

        // Ambil pemesanan aktif milik customer
        $rental = Pemesanan::with(['properti', 'kamar'])
            ->where('customer_id', $user->id) // 👈 FIX: Ganti 'user_id' jadi 'customer_id'
            ->whereIn('status', ['Dikonfirmasi', 'Diverifikasi']) // 👈 FIX: Sesuaikan dengan status di sistemmu
            ->latest()
            ->first();

            

        if (!$rental) {
            return response()->json([
                'message' => 'Kamu belum memiliki pemesanan aktif'
            ], 404);
        }

        return response()->json([
            'data' => $rental
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Terjadi kesalahan pada server!',
            'error'   => $e->getMessage()
        ], 500);
    }
}
}