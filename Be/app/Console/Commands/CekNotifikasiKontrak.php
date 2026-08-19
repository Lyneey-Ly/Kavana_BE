<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pemesanan;
use App\Models\Notification;
use App\Services\NotificationService;
use Carbon\Carbon;

class CekNotifikasiKontrak extends Command
{
    protected $signature = 'notifications:check-kontrak';
    protected $description = 'Kirim notifikasi database ke customer yang masa sewanya tersisa <= 7 hari';

    public function handle()
    {
        $pemesananAktif = Pemesanan::with(['dokumenSewa', 'kamar'])
            ->where('status', 'Dikonfirmasi')
            ->get();

        $count = 0;

        foreach ($pemesananAktif as $sewa) {
            if (!$sewa->dokumenSewa) {
                continue;
            }

            $endDate = Carbon::parse($sewa->dokumenSewa->end_date);
            $hariTersisa = (int) Carbon::now()->diffInDays($endDate, false);

            if ($hariTersisa > 7 || $hariTersisa < 0) {
                continue;
            }

            $nomorKamar = $sewa->kamar
                ? ($sewa->kamar->nomor_kamar ?? $sewa->kamar->nama_kamar ?? '-')
                : '-';
            $pesan = "Masa sewa kamar {$nomorKamar} Anda tinggal {$hariTersisa} hari lagi (Selesai pada {$sewa->dokumenSewa->end_date}).";

            // Cegah duplikat: lewati jika masih ada notif sama yang belum dibaca
            $sudahAda = Notification::where('user_id', $sewa->customer_id)
                ->where('type', 'kontrak')
                ->where('title', 'Masa Sewa Hampir Habis')
                ->where('message', $pesan)
                ->where('is_read', false)
                ->exists();

            if ($sudahAda) {
                continue;
            }

            NotificationService::send(
                $sewa->customer_id,
                'Masa Sewa Hampir Habis',
                $pesan,
                '/riwayattransaksi',
                'kontrak'
            );

            $count++;
        }

        $this->info("Selesai! {$count} notifikasi pengingat kontrak berhasil dikirim.");
    }
}
