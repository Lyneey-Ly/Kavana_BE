<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\Kamar;
use App\Models\DokumenSewa;
use App\Models\RiwayatStatusPemesanan;
use App\Models\FinanceTracker;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PemesananController extends Controller
{
    /**
     * Helper Internal: Pembersihan Booking Expired Otomatis
     */
    private function cleanupExpiredBookings()
    {
        $expiredBookings = Pemesanan::where('status', 'Tertunda')
            ->whereNotNull('expired_at')
            ->where('expired_at', '<', Carbon::now())
            ->get();

        foreach ($expiredBookings as $booking) {
            $booking->update(['status' => 'Expired']);

            if ($booking->kamar_id) {
                Kamar::where('id', $booking->kamar_id)->update(['status' => 'kosong']);
                $this->updatePropertiStatus($booking->properti_id);
            }
        }
    }

    /**
     * Helper Internal: Sinkronisasi Status Properti (Penuh / Tersedia)
     */
    public function updatePropertiStatus($propertiId)
    {
        if (!$propertiId) return;

        $properti = Properti::find($propertiId);
        if (!$properti) return;

        $totalKamar = Kamar::where('properti_id', $propertiId)->count();
        if ($totalKamar === 0) return;

        $kamarTerisi = Kamar::where('properti_id', $propertiId)
            ->where('status', 'terisi')
            ->count();

        $statusBaru = ($kamarTerisi >= $totalKamar) ? 'Penuh' : 'Tersedia';

        if ($properti->status !== $statusBaru) {
            $properti->update(['status' => $statusBaru]);
        }
    }

    /**
     * CUSTOMER: Melakukan Booking Properti & Unit Kamar Spesifik
     */
    public function booking(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // 1. Auto-cleanup booking expired sebelum validasi ketersediaan
        $this->cleanupExpiredBookings();

        $request->validate([
            'properti_id'     => 'required|exists:propertis,id',
            'kamar_id'        => 'nullable|exists:kamars,id',
            'check_in_date'   => 'required|date|after_or_equal:today',
            'duration_months' => 'required|integer|min:1',
        ]);

        // 2. Cek keberadaan kamar (opsional: properti tanpa daftar kamar)
        $kamar = null;
        if ($request->kamar_id) {
            $kamar = Kamar::where('id', $request->kamar_id)
                          ->where('properti_id', $request->properti_id)
                          ->first();

            if (!$kamar) {
                return response()->json([
                    'message' => 'Unit kamar tidak ditemukan pada properti ini!'
                ], 404);
            }
        }

        // 3. STRICT VALIDATION & PROTEKSI BOOKING (hanya jika memilih unit kamar)
        $isPendingOrActive = false;
        if ($request->kamar_id) {
            $isPendingOrActive = Pemesanan::where('kamar_id', $request->kamar_id)
                ->where(function ($query) {
                    $query->where('status', 'Dikonfirmasi')
                          ->orWhere(function ($sub) {
                              $sub->whereIn('status', ['Tertunda', 'Diverifikasi'])
                                  ->where(function ($exp) {
                                      $exp->whereNull('expired_at')
                                          ->orWhere('expired_at', '>', Carbon::now());
                                  });
                          });
                })
                ->exists();
        }

        if ($isPendingOrActive || ($kamar && strtolower($kamar->status ?? '') === 'terisi')) {
            return response()->json([
                'message' => 'Maaf, unit kamar ini sedang terisi atau dalam proses pemesanan oleh pengguna lain!'
            ], 400);
        }

        $properti = Properti::findOrFail($request->properti_id);
        
        // Kalkulasi diskon durasi sewa
        $durasi = (int) $request->duration_months;
        $rawTotal = $properti->price_per_month * $durasi;
        
        $discountRate = 0;
        if ($durasi >= 12) {
            $discountRate = 0.10;
        } elseif ($durasi >= 6) {
            $discountRate = 0.05;
        }
        
        $subtotal = $rawTotal - ($rawTotal * $discountRate);
        $biayaLayanan = $properti->biaya_layanan ?? 0;
        $totalPrice = $subtotal + $biayaLayanan;

        DB::beginTransaction();
        try {
            $pemesanan = Pemesanan::create([
                'customer_id'     => $user->id,
                'properti_id'     => $request->properti_id,
                'kamar_id'        => $request->kamar_id, // Sekarang tersimpan dengan aman
                'booking_date'    => Carbon::now(),
                'check_in_date'   => $request->check_in_date,
                'duration_months' => $request->duration_months,
                'total_price'     => $totalPrice,
                'status'          => 'Tertunda', 
                'expired_at'      => Carbon::now()->addHour(),
            ]);

            // Snapshot template surat perjanjian
            $startDate = Carbon::parse($request->check_in_date);
            $endDate = $startDate->copy()->addMonths($durasi);

            $leaseAgreementText = $properti->template_perjanjian;

            if (empty($leaseAgreementText)) {
                $nomorKamarText = ($kamar?->nomor_kamar) ?? ($kamar?->nama_kamar) ?? '-';
                $leaseAgreementText = "SURAT PERJANJIAN SEWA HUNIAN KAFANA VISTA\n\n"
                    . "Pada hari ini, disepakati perjanjian sewa antara Management Kafana Vista dengan " . ($user->name ?? 'Penyewa') . ".\n\n"
                    . "Rincian Sewa:\n"
                    . "- Properti: " . ($properti->title ?? $properti->nama_properti) . "\n"
                    . "- Nomor Kamar: " . $nomorKamarText . "\n"
                    . "- Tanggal Check-in: " . $startDate->format('d-m-Y') . "\n"
                    . "- Tanggal Selesai: " . $endDate->format('d-m-Y') . "\n"
                    . "- Durasi: " . $request->duration_months . " Bulan\n"
                    . "- Total Biaya: Rp " . number_format($totalPrice, 0, ',', '.') . "\n\n"
                    . "Dengan melakukan pembayaran, Penyewa menyatakan setuju dengan seluruh syarat dan ketentuan yang berlaku.";
            }

            DokumenSewa::create([
                'pemesanan_id'    => $pemesanan->id,
                'start_date'      => $startDate->format('Y-m-d'),
                'end_date'        => $endDate->format('Y-m-d'),
                'lease_agreement' => $leaseAgreementText,
                'status'          => 'Draft',
            ]);

            // NOTIFIKASI: ke Customer (booking berhasil)
            $nomorKamar = ($kamar?->nomor_kamar) ?? ($kamar?->nama_kamar) ?? 'Properti';
            NotificationService::send(
                $user->id,
                'Booking Berhasil',
                "Pemesanan kamar {$nomorKamar} berhasil. Silakan lakukan pembayaran dalam 1 jam.",
                '/riwayattransaksi',
                'booking'
            );

            // NOTIFIKASI: ke Admin Properti (pesanan baru masuk)
            if ($properti->pemilik_id) {
                NotificationService::send(
                    $properti->pemilik_id,
                    'Pesanan Baru Masuk',
                    'Customer ' . ($user->name ?? 'Pengguna') . " membuat booking baru untuk unit kamar {$nomorKamar}.",
                    '/adminTO',
                    'booking'
                );
            }

            DB::commit();

            return response()->json([
                'message' => 'Booking berhasil diajukan! Dokumen sewa otomatis diterbitkan.',
                'data'    => $pemesanan->load(['properti', 'kamar', 'dokumenSewa'])
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
     * CUSTOMER: Menyimpan Tanda Tangan Digital Dokumen Sewa
     */
    public function saveSignature(Request $request, $id)
    {
        $request->validate([
            'signature' => 'required|string',
        ]);

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
            'message' => 'Tanda tangan digital berhasil disimpan.',
            'data'    => $dokumen
        ], 200);
    }

    /**
     * ADMIN: Memperbarui Status Pemesanan & Unit Kamar
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

        $pemesanan = Pemesanan::with(['properti', 'pembayaran', 'kamar'])->find($id);

        if (!$pemesanan) {
            return response()->json(['message' => 'Data pemesanan tidak ditemukan'], 404);
        }

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

            // SINKRONISASI OTOMATIS KAMAR & PROPERTI
            if ($pemesanan->kamar_id) {
                $kamar = Kamar::find($pemesanan->kamar_id);
                if ($kamar) {
                    if ($request->status === 'Dikonfirmasi') {
                        $kamar->update(['status' => 'terisi']);
                    } elseif (in_array($request->status, ['Selesai', 'Ditolak', 'Expired', 'Batal'])) {
                        $kamar->update(['status' => 'kosong']);
                    }
                }
                $this->updatePropertiStatus($pemesanan->properti_id);
            }

            // Catat pengeluaran keuangan jika dikonfirmasi
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

            RiwayatStatusPemesanan::create([
                'pemesanan_id' => $pemesanan->id,
                'new_status'   => $request->status,
                'changed_at'   => Carbon::now(),
                'admin_id'     => $admin->id,
            ]);

            // NOTIFIKASI: ke Customer bahwa status booking-nya berubah
            NotificationService::send(
                $pemesanan->customer_id,
                'Status Sewa Diperbarui',
                'Status booking Anda kini menjadi ' . $request->status . '.',
                '/riwayattransaksi',
                'status'
            );

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
     * CUSTOMER: Menampilkan Riwayat Pemesanan (Lengkap dengan Data Kamar)
     */
    public function riwayatCustomer()
    {
        try {
            $user = Auth::guard('sanctum')->user();

            if (!$user) {
                return response()->json(['message' => 'Unauthenticated / Token tidak valid'], 401);
            }

            $this->cleanupExpiredBookings();

            // Memanggil relasi 'kamar' agar terbawa ke Frontend
            $riwayat = Pemesanan::with(['properti', 'dokumenSewa', 'kamar', 'pembayaran'])
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
                    $nomorKamar = $sewa->kamar ? " (No. " . ($sewa->kamar->nomor_kamar ?? $sewa->kamar->nama_kamar) . ")" : "";
                    $pesan = "Masa sewa kamar Anda tinggal {$hariTersisa} hari lagi (Selesai pada {$sewa->dokumenSewa->end_date}).";
                    $notifikasi[] = [
                        'pemesanan_id' => $sewa->id,
                        'pesan'        => "Masa kontrak kos kamu{$nomorKamar} tinggal {$hariTersisa} hari lagi! (Habis pada {$sewa->dokumenSewa->end_date}). Jangan lupa diperpanjang ya."
                    ];

                    // NOTIFIKASI: Simpan ke database (dicegah duplikat jika masih ada notif sama yang belum dibaca)
                    $sudahAda = Notification::where('user_id', $user->id)
                        ->where('type', 'kontrak')
                        ->where('title', 'Masa Sewa Hampir Habis')
                        ->where('message', $pesan)
                        ->where('is_read', false)
                        ->exists();

                    if (!$sudahAda) {
                        NotificationService::send(
                            $user->id,
                            'Masa Sewa Hampir Habis',
                            $pesan,
                            '/riwayattransaksi',
                            'kontrak'
                        );
                    }
                }
            }
        }

        return response()->json([
            'status'     => 'Sukses',
            'notifikasi' => $notifikasi
        ], 200);
    }

    /**
     * CUSTOMER: Ambil Data Sewa Aktif (Lengkap dengan Data Kamar)
     */
    public function getActiveRental(Request $request)
    {
        try {
            $user = Auth::guard('sanctum')->user() ?? $request->user();

            if (!$user) {
                return response()->json(['message' => 'Unauthenticated / Token tidak valid'], 401);
            }

            // Memanggil relasi 'kamar' agar terbawa di halaman Profile / Status Hunian
            $rentals = Pemesanan::with(['properti', 'kamar', 'dokumenSewa', 'pembayaran'])
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
}