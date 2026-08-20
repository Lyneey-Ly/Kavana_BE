<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pembayaran;
use App\Models\Pemesanan;
use App\Models\Properti;
use App\Models\Kamar;
use App\Models\FinanceTracker;
use App\Models\Administrator;
use App\Services\NotificationService;
use App\Services\SuperAdminNotificationService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Carbon\Carbon;

class PembayaranController extends Controller
{
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

    public function getPaymentInstruction($pemesananId)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $pemesanan = Pemesanan::with(['properti.pemilik', 'kamar'])->find($pemesananId);

        if (!$pemesanan) {
            return response()->json(['message' => 'Data pemesanan tidak ditemukan'], 404);
        }

        if ($pemesanan->customer_id !== $user->id) {
            return response()->json(['message' => 'Forbidden. Akses ditolak!'], 403);
        }

        if (!$pemesanan->expired_at) {
            $pemesanan->expired_at = Carbon::parse($pemesanan->created_at)->addHour();
            $pemesanan->save();
        }

        $now = Carbon::now();
        $expiredAt = Carbon::parse($pemesanan->expired_at);
        $isExpired = $now->greaterThan($expiredAt);

        if ($isExpired && $pemesanan->status === 'Tertunda') {
            $pemesanan->status = 'Kadaluarsa';
            $pemesanan->save();
        }

        $owner = $pemesanan->properti->pemilik ?? Administrator::whereNotNull('banks')->orWhereNotNull('bank_name')->first() ?? Administrator::first();

        $banks = [];
        if ($owner && !empty($owner->banks)) {
            $banks = is_string($owner->banks) ? json_decode($owner->banks, true) : $owner->banks;
        } elseif ($owner && $owner->bank_name) {
            $banks = [[
                'bank_name'      => $owner->bank_name,
                'account_number' => $owner->account_number,
                'account_holder' => $owner->account_holder,
            ]];
        }

        return response()->json([
            'status' => 'success',
            'data'   => [
                'pemesanan_id'      => $pemesanan->id,
                'total_price'       => (float) $pemesanan->total_price,
                'status'            => $pemesanan->status,
                'expired_at'        => $expiredAt->toIso8601String(),
                'remaining_seconds' => $isExpired ? 0 : max(0, $now->diffInSeconds($expiredAt, false)),
                'is_expired'        => $isExpired,
                'owner_payment'     => [
                    'banks'          => $banks,
                    'bank_name'      => $owner->bank_name ?? 'Bank BCA',
                    'account_number' => $owner->account_number ?? 'Belum Diatur',
                    'account_holder' => $owner->account_holder ?? 'Pemilik Kost',
                    'qris_image'     => ($owner && $owner->qris_image) ? asset('storage/' . $owner->qris_image) : null,
                ],
                'properti'          => [
                    'title'  => $pemesanan->properti->title ?? $pemesanan->properti->nama_properti ?? '-',
                    'gambar' => $pemesanan->properti->main_image ? asset('storage/' . $pemesanan->properti->main_image) : null,
                ]
            ]
        ], 200);
    }

    public function bayar(Request $request)
    {
        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'pemesanan_id'   => 'required|exists:pemesanans,id',
            'amount'         => 'required|numeric|min:1000',
            'payment_method' => 'required|string|max:100',
            'payment_proof'  => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $pemesanan = Pemesanan::find($request->pemesanan_id);

        if (!$pemesanan) {
            return response()->json(['message' => 'Data pemesanan tidak ditemukan'], 404);
        }

        if ($pemesanan->customer_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        if ($pemesanan->expired_at && Carbon::now()->greaterThan(Carbon::parse($pemesanan->expired_at))) {
            $pemesanan->status = 'Kadaluarsa';
            $pemesanan->save();

            return response()->json(['message' => 'Waktu pembayaran telah kadaluarsa!'], 400);
        }

        if ($pemesanan->status !== 'Tertunda') {
            return response()->json(['message' => 'Pemesanan berstatus: ' . $pemesanan->status], 400);
        }

        $path = $request->file('payment_proof')->store('payment_proofs', 'public');

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

        $pemesanan->status = 'Diverifikasi';
        $pemesanan->save();

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah!',
            'data'    => $pembayaran
        ], 201);
    }

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

        $role = strtolower($admin->role ?? '');
        $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);

        if (!$isSuperAdmin && $pemesanan->properti && $pemesanan->properti->pemilik_id !== $admin->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        DB::beginTransaction();
        try {
            $pemesanan->status = 'Dikonfirmasi';
            $pemesanan->save();

            if ($pemesanan->pembayaran) {
                $pemesanan->pembayaran->update([
                    'status'      => 'Dikonfirmasi',
                    'verified_at' => Carbon::now(),
                ]);
            }

            if ($pemesanan->kamar_id) {
                $kamar = Kamar::find($pemesanan->kamar_id);
                if ($kamar) {
                    $kamar->update(['status' => 'terisi']);
                }
                $this->updatePropertiStatus($pemesanan->properti_id);
            }

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

            NotificationService::send(
                $pemesanan->customer_id,
                'Pembayaran Dikonfirmasi',
                'Pembayaran sewa Anda telah diverifikasi oleh Admin.',
                '/riwayattransaksi',
                'pembayaran'
            );

            DB::commit();

            return response()->json([
                'message' => 'Pembayaran berhasil dikonfirmasi!',
                'data'    => $pemesanan->load(['pembayaran', 'properti', 'kamar']),
                'finance' => $finance
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Gagal konfirmasi: ' . $e->getMessage());

            return response()->json(['message' => 'Gagal konfirmasi!', 'error' => $e->getMessage()], 500);
        }
    }

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

        return response()->json(['message' => 'Success', 'data' => $data], 200);
    }

    public function payGateway(Request $request, $id)
    {
        $admin = Auth::guard('sanctum')->user();

        if (!$admin) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $properti = Properti::find($id);

        if (!$properti) {
            return response()->json(['message' => 'Properti tidak ditemukan'], 404);
        }

        $isFirstProperty = $properti->is_first_property ?? false;
        $grossAmount = $properti->slot_fee ?? ($isFirstProperty ? 0 : 150000);

        if ($grossAmount <= 0) {
            return response()->json([
                'message' => 'Properti ini adalah Slot Perdana (Gratis). Pembayaran tidak diperlukan.'
            ], 400);
        }

        $serverKey = env('MIDTRANS_SERVER_KEY', 'SB-Mid-server-XXXXX'); 
        $orderId = 'PUB-PROP-' . $properti->id . '-' . time();

        $response = Http::withBasicAuth($serverKey, '')
            ->post('https://app.sandbox.midtrans.com/snap/v1/transactions', [
                'transaction_details' => [
                    'order_id'     => $orderId,
                    'gross_amount' => $grossAmount,
                ],
                'item_details' => [[
                    'id'       => 'PUB-' . $properti->id,
                    'price'    => $grossAmount,
                    'quantity' => 1,
                    'name'     => 'Publikasi Properti ' . substr($properti->title ?? 'Kavana', 0, 20)
                ]],
                'customer_details' => [
                    'first_name' => $admin->name ?? 'Admin Kavana',
                    'email'      => $admin->email ?? 'admin@kavana.com',
                ]
            ]);

        if ($response->successful()) {
            $resBody = $response->json();
            return response()->json([
                'message'     => 'Token Midtrans berhasil didapatkan',
                'snap_token'  => $resBody['token'],
                'redirect_url' => $resBody['redirect_url'] ?? null
            ], 200);
        }

        return response()->json([
            'message' => 'Gagal terhubung ke Midtrans API',
            'error'   => $response->json()
        ], 500);
    }

    public function updateGatewaySuccess(Request $request, $id)
    {
        $properti = Properti::find($id);
        if (!$properti) {
            return response()->json(['message' => 'Properti tidak ditemukan'], 404);
        }

        $properti->approval_status = 'active';
        $properti->is_paid_slot = true; 

        // Catat biaya slot yang dibayar (fallback: nilai site settings / 150000)
        if (!$properti->slot_fee || (float)$properti->slot_fee <= 0) {
            $setting = \App\Models\SiteSetting::first();
            $properti->slot_fee = $setting ? (float)$setting->property_extra_fee : 150000;
        }

        $properti->save();

        return response()->json([
            'message' => 'Status pembayaran properti berhasil diperbarui menjadi Aktif/Lunas.',
            'data'    => $properti
        ], 200);
    }

    public function uploadProof(Request $request, $id)
    {
        $admin = Auth::guard('sanctum')->user();

        if (!$admin) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $request->validate([
            'proof_image' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $properti = Properti::find($id);

        if (!$properti) {
            return response()->json(['message' => 'Properti tidak ditemukan'], 404);
        }

        $path = $request->file('proof_image')->store('payment_proofs/properties', 'public');

        // PERBAIKAN DI SINI
        $properti->approval_status = 'waiting_verification';
        $properti->payment_proof   = $path;
        $properti->save();

        // NOTIFIKASI: ke SuperAdmin (bukti pembayaran slot properti diunggah)
        SuperAdminNotificationService::send(
            'property_approval',
            'Bukti Pembayaran Slot Diterima',
            'Pemilik "' . ($properti->title ?? 'Properti') . '" mengunggah bukti pembayaran slot. Harap verifikasi.',
            '/superadmin/approval'
        );

        return response()->json([
            'message' => 'Bukti pembayaran berhasil diunggah!',
            'data'    => $properti
        ], 200);
    }
}