<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pemesanan;
use Carbon\Carbon;

class AutoCheckSewa extends Command
{
    protected $signature = 'sewa:check-expired';
    protected $description = 'Cek masa sewa customer secara otomatis (Update status expired & sediakan kamar kembali)';

    public function handle()
    {
        $today = Carbon::today();

        // Ambil semua pemesanan yang statusnya masih Dikonfirmasi
        $pemesananAktif = Pemesanan::where('status', 'Dikonfirmasi')->get();

        $countExpired = 0;

        foreach ($pemesananAktif as $sewa) {
            $tglCheckin = Carbon::parse($sewa->tanggal_checkin);
            
            // Hitung tanggal selesai (Checkin + Durasi Sewa Bulan)
            $tglHabis = $tglCheckin->copy()->addMonths($sewa->durasi_sewa);
            
            // Hitung sisa hari dari hari ini ke tanggal habis
            $sisaHari = $today->diffInDays($tglHabis, false);

            // Jika sisa hari 0 atau minus (artinya sudah lewat/habis masa sewa)
            if ($sisaHari <= 0) {
                // 1. Ubah status pemesanan jadi Selesai
                $sewa->update(['status' => 'Selesai']);

                // 2. Kembalikan status properti kamar jadi 'Tersedia'
                if ($sewa->properti) {
                    $sewa->properti->update(['status' => 'Tersedia']);
                }

                $countExpired++;
            }
        }

        $this->info("Pengecekan selesai! Ada {$countExpired} sewa yang otomatis diubah ke status Selesai.");
    }
}