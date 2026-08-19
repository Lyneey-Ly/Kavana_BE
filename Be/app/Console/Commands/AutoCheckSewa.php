<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Pemesanan;
use App\Models\Kamar;
use Carbon\Carbon;

class AutoCheckSewa extends Command
{
    protected $signature = 'sewa:check-expired';
    protected $description = 'Cek masa sewa customer secara otomatis (Update status expired & sediakan kamar kembali)';

    public function handle()
    {
        // Ambil semua pemesanan yang statusnya masih Dikonfirmasi
        $pemesananAktif = Pemesanan::with(['dokumenSewa'])
            ->where('status', 'Dikonfirmasi')
            ->get();

        $countExpired = 0;

        foreach ($pemesananAktif as $sewa) {
            // Hitung tanggal selesai: prioritas end_date dari dokumen sewa,
            // fallback = check_in_date + durasi sewa (bulan)
            if ($sewa->dokumenSewa && $sewa->dokumenSewa->end_date) {
                $tglHabis = Carbon::parse($sewa->dokumenSewa->end_date);
            } else {
                $tglCheckin = Carbon::parse($sewa->check_in_date);
                $tglHabis = $tglCheckin->copy()->addMonths((int) $sewa->duration_months);
            }

            // Hitung sisa hari dari hari ini ke tanggal habis
            $sisaHari = Carbon::today()->diffInDays($tglHabis, false);

            // Jika sisa hari 0 atau minus (artinya sudah lewat/habis masa sewa)
            if ($sisaHari <= 0) {
                // 1. Ubah status pemesanan jadi Selesai
                $sewa->update(['status' => 'Selesai']);

                // 2. Kembalikan status kamar jadi kosong
                if ($sewa->kamar_id) {
                    Kamar::where('id', $sewa->kamar_id)->update(['status' => 'kosong']);
                }

                // 3. Sinkronkan status properti (kosong/Tersedia bila semua kamar kosong)
                if ($sewa->properti) {
                    $totalKamar = Kamar::where('properti_id', $sewa->properti_id)->count();
                    $terisi = Kamar::where('properti_id', $sewa->properti_id)
                        ->where('status', 'terisi')
                        ->count();

                    $sewa->properti->update([
                        'status' => ($totalKamar > 0 && $terisi >= $totalKamar) ? 'Penuh' : 'Tersedia'
                    ]);
                }

                $countExpired++;
            }
        }

        $this->info("Pengecekan selesai! Ada {$countExpired} sewa yang otomatis diubah ke status Selesai.");
    }
}
