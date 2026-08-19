<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DokumenSewa;
use App\Models\Pemesanan;
use App\Models\Properti;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DokumenSewaController extends Controller
{
    /**
     * 1. ADMIN: Mengambil Daftar Dokumen Sewa Khusus Properti Milik Admin Login
     * Endpoint: GET /api/admin/dokumen-sewa
     */
    public function indexAdmin()
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Lock keras: Ambil HANYA ID Properti yang dimiliki user ini
        $myPropertyIds = Properti::where('pemilik_id', $user->id)->pluck('id');

        // Cari pemesanan Dikonfirmasi KHUSUS properti milik user ini
        $pemesanans = Pemesanan::with(['customer', 'properti', 'dokumenSewa'])
            ->whereIn('properti_id', $myPropertyIds)
            ->where('status', 'Dikonfirmasi')
            ->orderBy('id', 'desc')
            ->get();

        // Otomatis terbitkan DokumenSewa jika belum ada
        foreach ($pemesanans as $p) {
            if (!$p->dokumenSewa) {
                $startDate = Carbon::parse($p->check_in_date);
                $endDate = $startDate->copy()->addMonths($p->duration_months);

                // ⚡ AMBIL TEMPLATE DARI PROPERTI
                $agreementText = $p->properti->template_perjanjian;

                if (empty($agreementText)) {
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
                }

                DokumenSewa::create([
                    'pemesanan_id'    => $p->id,
                    'start_date'      => $startDate->toDateString(),
                    'end_date'        => $endDate->toDateString(),
                    'lease_agreement' => $agreementText,
                ]);
            }
        }

        // Ambil daftar dokumen sewa KHUSUS properti milik admin login
        $dokumens = DokumenSewa::whereHas('pemesanan', function ($query) use ($myPropertyIds) {
                $query->whereIn('properti_id', $myPropertyIds);
            })
            ->with(['pemesanan.customer', 'pemesanan.properti', 'pemesanan.kamar'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil daftar dokumen sewa admin',
            'data'    => $dokumens
        ], 200);
    }

    /**
     * 2. GENERATE DRAF DOKUMEN SEWA
     */
    public function generateDokumen(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'pemesanan_id' => 'required|exists:pemesanans,id'
        ]);

        $pemesanan = Pemesanan::with(['properti', 'customer'])->find($request->pemesanan_id);

        if (!$pemesanan) {
            return response()->json(['message' => 'Data pemesanan tidak ditemukan'], 404);
        }

        // Cek kepemilikan properti
        if ($pemesanan->properti && (int)$pemesanan->properti->pemilik_id !== (int)$user->id) {
            return response()->json([
                'message' => 'Forbidden. Anda tidak memiliki akses ke dokumen properti ini!'
            ], 403);
        }

        if ($pemesanan->status !== 'Dikonfirmasi') {
            return response()->json([
                'message' => 'Dokumen sewa hanya bisa dibuat jika status pemesanan sudah Dikonfirmasi.'
            ], 400);
        }

        $startDate = Carbon::parse($pemesanan->check_in_date);
        $endDate = $startDate->copy()->addMonths($pemesanan->duration_months);

        // ⚡ AMBIL TEMPLATE DARI PROPERTI
        $agreementText = $pemesanan->properti->template_perjanjian;

        if (empty($agreementText)) {
            $agreementText = "SURAT PERJANJIAN SEWA KOS\n\n"
                . "Kami yang bertanda tangan di bawah ini menerangkan bahwa:\n"
                . "Nama Penyewa: " . ($pemesanan->customer->name ?? 'Penyewa') . "\n"
                . "Nama Properti: " . ($pemesanan->properti->title ?? 'Properti') . "\n"
                . "Alamat Properti: " . ($pemesanan->properti->address ?? '-') . "\n\n"
                . "Telah sepakat untuk melakukan sewa menyewa properti selama " . $pemesanan->duration_months . " bulan, "
                . "terhitung mulai tanggal " . $startDate->toDateString() . " sampai dengan " . $endDate->toDateString() . " "
                . "dengan total biaya sebesar Rp " . number_format($pemesanan->total_price, 0, ',', '.') . ".\n\n"
                . "Perjanjian ini dibuat secara sadar dan tanpa paksaan dari pihak manapun.";
        }

        $dokumen = DokumenSewa::updateOrCreate(
            ['pemesanan_id' => $pemesanan->id],
            [
                'start_date'      => $startDate->toDateString(),
                'end_date'        => $endDate->toDateString(),
                'lease_agreement' => $agreementText,
            ]
        );

        return response()->json([
            'message' => 'Draf surat dokumen sewa berhasil digenerate!',
            'data'    => $dokumen
        ], 201);
    }

    /**
     * 3. UPLOAD TANDA TANGAN DIGITAL
     */
    public function uploadTandaTangan(Request $request, $id)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'signature' => 'required|image|mimes:png,jpg,jpeg|max:1024',
        ]);

        $dokumen = DokumenSewa::with(['pemesanan.properti'])->find($id);

        if (!$dokumen) {
            return response()->json(['message' => 'Dokumen sewa tidak ditemukan'], 404);
        }

        // 🔒 PROTEKSI IMMUTABILITY: Tolak jika kedua belah pihak sudah bertanda tangan
        if ($dokumen->customer_signature && $dokumen->admin_signature) {
            return response()->json([
                'message' => 'Dokumen ini sudah SAH secara hukum dan tidak dapat diubah lagi!'
            ], 422);
        }

        $path = $request->file('signature')->store('signatures', 'public');
        $role = strtolower(trim($user->role ?? ''));

        // Jika user adalah Customer penyewa
        if ($dokumen->pemesanan && (int)$dokumen->pemesanan->customer_id === (int)$user->id) {
            $dokumen->customer_signature = $path;
            $dokumen->save();

            return response()->json([
                'message' => 'Tanda tangan penyewa berhasil diunggah!',
                'data'    => $dokumen
            ], 200);
        }

        // Jika user adalah Admin/Owner pengelola
        if (in_array($role, ['admin', 'owner', 'pengelola', 'administrator']) || 
           ($dokumen->pemesanan && $dokumen->pemesanan->properti && (int)$dokumen->pemesanan->properti->pemilik_id === (int)$user->id)) {
            
            $dokumen->admin_signature = $path;
            $dokumen->save();

            return response()->json([
                'message' => 'Tanda tangan pengelola berhasil diunggah!',
                'data'    => $dokumen
            ], 200);
        }

        return response()->json([
            'message' => 'Forbidden. Anda tidak memiliki akses untuk menandatangani dokumen ini!'
        ], 403);
    }

    /**
     * 4. LIHAT DETAIL DOKUMEN SEWA
     * Endpoint: GET /api/dokumen-sewa/{id}
     */
    public function show($id)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // 1. PRIORITAS UTAMA: Cari berdasarkan ID Dokumen Sewa (Primary Key)
        $dokumen = DokumenSewa::with(['pemesanan.customer', 'pemesanan.properti', 'pemesanan.kamar'])
            ->where('id', $id)
            ->first();

        // 2. FALLBACK: Jika tidak ketemu, baru cari berdasarkan pemesanan_id
        if (!$dokumen) {
            $dokumen = DokumenSewa::with(['pemesanan.customer', 'pemesanan.properti', 'pemesanan.kamar'])
                ->where('pemesanan_id', $id)
                ->first();
        }

        if (!$dokumen) {
            return response()->json([
                'message' => 'Dokumen sewa belum diterbitkan.'
            ], 404);
        }

        $role = strtolower(trim($user->role ?? ''));
        $isAdminRole = in_array($role, ['admin', 'owner', 'pengelola', 'administrator', 'superadmin', 'super_admin']);

        $isCustomer = $dokumen->pemesanan && ((int)$dokumen->pemesanan->customer_id === (int)$user->id);
        $isPemilik  = $dokumen->pemesanan && $dokumen->pemesanan->properti && ((int)$dokumen->pemesanan->properti->pemilik_id === (int)$user->id);

        if (!$isCustomer && !$isPemilik && !$isAdminRole) {
            return response()->json([
                'message' => 'Forbidden. Anda tidak memiliki hak akses untuk melihat dokumen sewa ini.'
            ], 403);
        }

        return response()->json([
            'message' => 'Berhasil mengambil dokumen sewa',
            'data'    => $dokumen
        ], 200);
    }

    /**
     * 5. USER: Mengambil Semua Daftar Dokumen Sewa Penyewa
     */
    public function indexUser()
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $dokumens = DokumenSewa::whereHas('pemesanan', function ($query) use ($user) {
                $query->where('customer_id', $user->id)
                      ->where('status', 'Dikonfirmasi');
            })
            ->with(['pemesanan.customer', 'pemesanan.properti', 'pemesanan.kamar'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'message' => 'Berhasil mengambil daftar dokumen sewa penyewa',
            'data'    => $dokumens
        ], 200);
    }

    /**
     * 6. ADMIN: Mengedit Teks Surat Perjanjian Sewa
     * Endpoint: PUT /api/admin/dokumen-sewa/{id}
     */
    public function update(Request $request, $id)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $dokumen = DokumenSewa::with('pemesanan.properti')->find($id);

        if (!$dokumen) {
            return response()->json(['message' => 'Dokumen sewa tidak ditemukan.'], 404);
        }

        // 🔒 PROTEKSI IMMUTABILITY: Tolak edit jika dokumen sudah SAH / komplit TTD
        if ($dokumen->customer_signature && $dokumen->admin_signature) {
            return response()->json([
                'message' => 'Dokumen ini sudah SAH (ditandatangani kedua pihak) dan tidak dapat diubah lagi!'
            ], 422);
        }

        $validated = $request->validate([
            'lease_agreement' => 'required|string',
            'start_date'      => 'nullable|date',
            'end_date'        => 'nullable|date|after_or_equal:start_date',
        ]);

        // Otorisasi: Cek Role Admin atau Pemilik Properti
        $role = strtolower(trim($user->role ?? ''));
        $isAdminRole = in_array($role, ['admin', 'owner', 'pengelola', 'administrator', 'superadmin', 'super_admin']);
        
        $isPemilik = false;
        if ($dokumen->pemesanan && $dokumen->pemesanan->properti) {
            $isPemilik = ((int)$dokumen->pemesanan->properti->pemilik_id === (int)$user->id);
        }

        if (!$isAdminRole && !$isPemilik) {
            return response()->json([
                'message' => 'Forbidden. Anda tidak memiliki hak akses untuk mengedit dokumen ini.'
            ], 403);
        }

        // Update data dokumen
        $dokumen->lease_agreement = $validated['lease_agreement'];
        if (!empty($validated['start_date'])) {
            $dokumen->start_date = $validated['start_date'];
        }
        if (!empty($validated['end_date'])) {
            $dokumen->end_date = $validated['end_date'];
        }
        
        $dokumen->save();

        return response()->json([
            'message' => 'Dokumen sewa berhasil diperbarui!',
            'data'    => $dokumen
        ], 200);
    }
}   