<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\Kamar;
use App\Models\DokumenSewa;
use App\Models\RiwayatStatusPemesanan;
use App\Models\FinanceTracker;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB; // 👈 Import DB Facade
use Carbon\Carbon;

class PemesananController extends Controller
{
    /**
     * CUSTOMER: Melakukan Booking Properti & Unit Kamar Spesifik
     */
    public function booking(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'properti_id'     => 'required|exists:propertis,id',
            'kamar_id'        => 'required|exists:kamars,id',
            'check_in_date'   => 'required|date|after_or_equal:today',
            'duration_months' => 'required|integer|min:1',
        ]);

        // 1. Cek keberadaan kamar
        $kamar = Kamar::where('id', $request->kamar_id)
                      ->where('properti_id', $request->properti_id)
                      ->first();

        if (!$kamar) {
            return response()->json([
                'message' => 'Unit kamar tidak ditemukan pada properti ini!'
            ], 404);
        }

        // 2. ⚡ CEK APAKAH KAMAR SEDANG DALAM PROSES BOOKING/TERISI (Mencegah Double Rent)
        $isPendingOrActive = Pemesanan::where('kamar_id', $request->kamar_id)
            ->whereIn('status', ['Tertunda', 'Diverifikasi', 'Dikonfirmasi'])
            ->exists();

        if ($isPendingOrActive || !in_array(strtolower($kamar->status), ['kosong', 'tersedia'])) {
            return response()->json([
                'message' => 'Maaf, unit kamar ini sedang dalam proses pemesanan atau sudah terisi!'
            ], 400);
        }

        $properti = Properti::findOrFail($request->properti_id);
        $totalPrice = $properti->price_per_month * $request->duration_months;

        DB::beginTransaction();
        try {
            $pemesanan = Pemesanan::create([
                'customer_id'     => $user->id,
                'properti_id'     => $request->properti_id,
                'kamar_id'        => $request->kamar_id,
                'booking_date'    => Carbon::now(),
                'check_in_date'   => $request->check_in_date,
                'duration_months' => $request->duration_months,
                'total_price'     => $totalPrice,
                'status'          => 'Tertunda', 
                'expired_at'      => Carbon::now()->addHour(),
            ]);

            // ⚡ OTOMATIS GENERATE DOKUMEN SEWA SAAT BOOKING DIBUAT
            $startDate = Carbon::parse($request->check_in_date);
            $endDate = $startDate->copy()->addMonths((int)$request->duration_months);

            $leaseAgreementText = "SURAT PERJANJIAN SEWA HUNIAN KAFANA VISTA\n\n"
                . "Pada hari ini, disepakati perjanjian sewa antara Management Kafana Vista dengan " . ($user->name ?? 'Penyewa') . ".\n\n"
                . "Rincian Sewa:\n"
                . "- Properti: " . $properti->title . "\n"
                . "- Nomor Kamar: " . $kamar->nomor_kamar . "\n"
                . "- Tanggal Check-in: " . $startDate->format('d-m-Y') . "\n"
                . "- Tanggal Selesai: " . $endDate->format('d-m-Y') . "\n"
                . "- Durasi: " . $request->duration_months . " Bulan\n"
                . "- Total Biaya: Rp " . number_format($totalPrice, 0, ',', '.') . "\n\n"
                . "Dengan melakukan pembayaran, Penyewa menyatakan setuju dengan seluruh syarat dan ketentuan yang berlaku.";

            DokumenSewa::create([
                'pemesanan_id'    => $pemesanan->id,
                'start_date'      => $startDate->format('Y-m-d'),
                'end_date'        => $endDate->format('Y-m-d'),
                'lease_agreement' => $leaseAgreementText,
                'status'          => 'Draft',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Booking berhasil diajukan! Dokumen sewa otomatis diterbitkan. Silakan lakukan pembayaran dalam waktu 1 jam.',
                'data'    => $pemesanan->load('dokumenSewa')
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Gagal membuat booking',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 🔒 ADMIN: Memperbarui Status Pemesanan & Unit Kamar (Akses Terkunci per Pemilik)
     */
    public function updateStatus(Request $request, $id)
    {
        $admin = Auth::guard('sanctum')->user();

        if (!$admin) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'status' => 'required|in:Tertunda,Diverifikasi,Dikonfirmasi,Ditolak,Selesai,Expired,Batal',
        ]);

        $pemesanan = Pemesanan::with(['properti', 'pembayaran'])->find($id);

        if (!$pemesanan) {
            return response()->json(['message' => 'Data pemesanan tidak ditemukan'], 404);
        }

        // 🔒 Proteksi Hak Akses
        $role = strtolower($admin->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        if (!$isSuperAdmin && $pemesanan->properti && $pemesanan->properti->pemilik_id !== $admin->id) {
            return response()->json([
                'message' => 'Forbidden. Anda tidak memiliki akses untuk mengubah status pemesanan di properti ini!'
            ], 403);
        }

        $oldStatus = $pemesanan->status;

        DB::beginTransaction();
        try {
            $pemesanan->status = $request->status;
            $pemesanan->save();

            // ⚡ SINKRONISASI STATUS UNIT KAMAR OTOMATIS
            if ($pemesanan->kamar_id) {
                $kamar = Kamar::find($pemesanan->kamar_id);
                if ($kamar) {
                    if ($request->status === 'Dikonfirmasi') {
                        $kamar->update(['status' => 'terisi']);
                    } elseif (in_array($request->status, ['Selesai', 'Ditolak', 'Expired', 'Batal'])) {
                        $kamar->update(['status' => 'kosong']);
                    }
                }
            }

            // 🚀 OTOMATIS CATAT KE FINANCE TRACKER JIKA STATUS DIKONFIRMASI
            if ($request->status === 'Dikonfirmasi') {
                $nominal = $pemesanan->pembayaran->amount ?? $pemesanan->total_price ?? 0;
                $namaProperti = $pemesanan->properti->title ?? $pemesanan->properti->nama_properti ?? 'Hunian Kost';

                FinanceTracker::create([
                    'user_id'     => $pemesanan->customer_id,
                    'type'        => 'pengeluaran',
                    'description' => 'Pembayaran Sewa ' . $namaProperti,
                    'amount'      => $nominal,
                    'category'    => 'Tagihan Kost',
                    'date'        => now()->toDateString(),
                ]);
            }

            // Catat ke riwayat perubahan status
            RiwayatStatusPemesanan::create([
                'pemesanan_id' => $pemesanan->id,
                'new_status'   => $request->status,
                'changed_at'   => Carbon::now(),
                'admin_id'     => $admin->id,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Status pemesanan & status kamar berhasil diperbarui!',
                'data'    => [
                    'pemesanan_id'      => $pemesanan->id,
                    'status_sebelumnya' => $oldStatus,
                    'status_baru'       => $pemesanan->status,
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Gagal memproses perubahan status: ' . $e->getMessage());

            return response()->json([
                'message' => 'Terjadi kesalahan pada server saat mengubah status!',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

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

            // AUTO-EXPIRED: Mengubah status otomatis jika melewati batas jam
            Pemesanan::where('customer_id', $user->id)
                ->where('status', 'Tertunda')
                ->whereNotNull('expired_at')
                ->where('expired_at', '<', Carbon::now())
                ->update(['status' => 'Expired']);

            $riwayat = Pemesanan::with(['properti', 'dokumenSewa'])
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

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $pemesananAktif = Pemesanan::with(['dokumenSewa', 'kamar'])
            ->where('customer_id', $user->id)
            ->where('status', 'Dikonfirmasi')
            ->get();

        $notifikasi = [];

        foreach ($pemesananAktif as $sewa) {
            if ($sewa->dokumenSewa) {
                $endDate = Carbon::parse($sewa->dokumenSewa->end_date);
                $hariTersisa = (int) Carbon::now()->diffInDays($endDate, false);

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

    /**
     * CUSTOMER: Ambil Data Sewa Aktif
     */
    public function getActiveRental(Request $request)
    {
        try {
            $user = Auth::guard('sanctum')->user() ?? $request->user();

            if (!$user) {
                return response()->json([
                    'message' => 'Unauthenticated / Token tidak valid'
                ], 401);
            }

            $rentals = Pemesanan::with(['properti', 'kamar', 'dokumenSewa'])
                ->where('customer_id', $user->id)
                ->whereIn('status', ['Dikonfirmasi', 'Diverifikasi'])
                ->latest()
                ->get();

            if ($rentals->isEmpty()) {
                return response()->json([
                    'message' => 'Kamu belum memiliki pemesanan aktif',
                    'data'    => []
                ], 404);
            }

            return response()->json([
                'data' => $rentals
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Terjadi kesalahan pada server!',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function saveSignature(Request $request, $id)
    {
        $booking = Pemesanan::findOrFail($id);

        $dokumen = DokumenSewa::updateOrCreate(
            ['pemesanan_id' => $booking->id],
            [
                'customer_signature' => $request->signature,
                'signed_at'          => now(),
                'status'             => 'Disetujui',
            ]
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Tanda tangan berhasil disimpan.',
            'data'    => $dokumen
        ]);
    }
}