<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DokumenSewa;
use App\Models\Pemesanan;
use Carbon\Carbon;

class DokumenSewaController extends Controller
{
    /**
     * 1. ADMIN: Mengambil Semua Daftar Dokumen Sewa Penyewa Aktif
     * Endpoint: GET /api/admin/dokumen-sewa
     */
    public function indexAdmin()
    {
        // Cari semua pemesanan yang statusnya Dikonfirmasi
        $pemesanans = Pemesanan::with(['customer', 'properti', 'dokumenSewa'])
            ->where('status', 'Dikonfirmasi')
            ->orderBy('id', 'desc')
            ->get();

        // Otomatis terbitkan DokumenSewa jika ada pemesanan dikonfirmasi yang belum punya dokumen
        foreach ($pemesanans as $p) {
            if (!$p->dokumenSewa) {
                $startDate = Carbon::parse($p->check_in_date);
                $endDate = $startDate->copy()->addMonths($p->duration_months);

                $customerName = $p->customer->name ?? 'Penyewa';
                $propertiTitle = $p->properti->title ?? 'Properti';
                $propertiAddress = $p->properti->address ?? '-';

                $agreementText = "SURAT PERJANJIAN SEWA KOS\n\n"
                    . "Kami yang bertanda tangan di bawah ini menerangkan bahwa:\n"
                    . "Nama Penyewa: " . $customerName . "\n"
                    . "Nama Properti: " . $propertiTitle . "\n"
                    . "Alamat Properti: " . $propertiAddress . "\n\n"
                    . "Telah sepakat untuk melakukan sewa menyewa properti selama " . $p->duration_months . " bulan, "
                    . "terhitung mulai tanggal " . $startDate->toDateString() . " sampai dengan " . $endDate->toDateString() . " "
                    . "dengan total biaya sebesar Rp " . number_format($p->total_price, 0, ',', '.') . ".\n\n"
                    . "Perjanjian ini dibuat secara sadar dan tanpa paksaan dari pihak manapun.";

                DokumenSewa::create([
                    'pemesanan_id'    => $p->id,
                    'start_date'      => $startDate->toDateString(),
                    'end_date'        => $endDate->toDateString(),
                    'lease_agreement' => $agreementText,
                ]);
            }
        }

        // Ambil data dokumen sewa beserta relasi penyewa & properti
        $dokumens = DokumenSewa::with(['pemesanan.customer', 'pemesanan.properti', 'pemesanan.kamar'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil daftar dokumen sewa admin',
            'data'    => $dokumens
        ], 200);
    }

    /**
     * 2. SYSTEM/ADMIN: Generate Draf Dokumen Sewa
     */
    public function generateDokumen(Request $request)
    {
        $request->validate([
            'pemesanan_id' => 'required|exists:pemesanans,id'
        ]);

        $pemesanan = Pemesanan::with(['properti', 'customer'])->findOrFail($request->pemesanan_id);

        if ($pemesanan->status !== 'Dikonfirmasi') {
            return response()->json([
                'message' => 'Dokumen sewa hanya bisa dibuat jika status pemesanan sudah Dikonfirmasi.'
            ], 400);
        }

        $startDate = Carbon::parse($pemesanan->check_in_date);
        $endDate = $startDate->copy()->addMonths($pemesanan->duration_months);

        $agreementText = "SURAT PERJANJIAN SEWA KOS\n\n"
            . "Kami yang bertanda tangan di bawah ini menerangkan bahwa:\n"
            . "Nama Penyewa: " . ($pemesanan->customer->name ?? 'Penyewa') . "\n"
            . "Nama Properti: " . ($pemesanan->properti->title ?? 'Properti') . "\n"
            . "Alamat Properti: " . ($pemesanan->properti->address ?? '-') . "\n\n"
            . "Telah sepakat untuk melakukan sewa menyewa properti selama " . $pemesanan->duration_months . " bulan, "
            . "terhitung mulai tanggal " . $startDate->toDateString() . " sampai dengan " . $endDate->toDateString() . " "
            . "dengan total biaya sebesar Rp " . number_format($pemesanan->total_price, 0, ',', '.') . ".\n\n"
            . "Perjanjian ini dibuat secara sadar dan tanpa paksaan dari pihak manapun.";

        $dokumen = DokumenSewa::updateOrCreate(
            ['pemesanan_id' => $pemesanan->id],
            [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'lease_agreement' => $agreementText,
            ]
        );

        return response()->json([
            'message' => 'Draf surat dokumen sewa berhasil digenerate!',
            'data' => $dokumen
        ], 201);
    }

    /**
     * 3. CUSTOMER / ADMIN: Upload Tanda Tangan Digital
     */
    public function uploadTandaTangan(Request $request, $id)
    {
        $request->validate([
            'signature' => 'required|image|mimes:png,jpg,jpeg|max:1024',
            'role' => 'required|in:customer,admin'
        ]);

        $dokumen = DokumenSewa::findOrFail($id);
        $path = $request->file('signature')->store('signatures', 'public');

        if ($request->role === 'customer') {
            $dokumen->customer_signature = $path;
        } else {
            $dokumen->admin_signature = $path;
        }

        $dokumen->save();

        return response()->json([
            'message' => 'Tanda tangan ' . $request->role . ' berhasil diunggah!',
            'data' => $dokumen
        ], 200);
    }

    /**
     * 4. PUBLIC/USER: Lihat Detail Dokumen Sewa
     */
    public function show($id)
    {
        $dokumen = DokumenSewa::with(['pemesanan.customer', 'pemesanan.properti'])
            ->where('id', $id)
            ->orWhere('pemesanan_id', $id)
            ->first();

        if (!$dokumen) {
            return response()->json([
                'message' => 'Dokumen sewa belum diterbitkan.'
            ], 404);
        }

        return response()->json([
            'message' => 'Berhasil mengambil dokumen sewa',
            'data'    => $dokumen
        ], 200);
    }
}