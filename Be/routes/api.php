<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PemesananController;
use App\Http\Controllers\PembayaranController;
use App\Http\Controllers\DokumenSewaController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\TestimoniController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DashboardAdminController;
use App\Http\Controllers\FinanceTrackerController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\Api\SuperAdminController;
use App\Http\Controllers\VendorAdController; // <-- IMPORT BARU
use App\Http\Middleware\EnsureIsAdmin; 
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\SiteSettingController;

/*
|--------------------------------------------------------------------------
| ROUTE PUBLIC (Bisa diakses tanpa login)
|--------------------------------------------------------------------------
*/
Route::post('/customer/register', [AuthController::class, 'registerCustomer']);
Route::post('/admin/register', [AuthController::class, 'registerAdmin']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{id}', [PropertyController::class, 'show']);
Route::get('/properties/{propertiId}/reviews', [ReviewController::class, 'getByProperti']);
Route::get('/testimonis', [TestimoniController::class, 'index']);
Route::post('/auth/google', [AuthController::class, 'googleLogin']);

// --- ENDPOINT PUBLIK VENDOR ADVERTISEMENTS ---
Route::get('/vendor-ads/active', [VendorAdController::class, 'getActiveAds']);

// --- ENDPOINT PUBLIK SITE SETTINGS (Dibaca Footer) ---
Route::get('/site-settings', [SiteSettingController::class, 'index']);

/*
|--------------------------------------------------------------------------
| ROUTE PROTECTED (Wajib Bearer Token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // --- AUTH & PROFILE USER ---
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/update', [ProfileController::class, 'update']);

    // --- PENGATURAN PEMBAYARAN (DAPAT DIBACA USER & ADMIN) ---
    Route::get('/payment-settings', [AdminProfileController::class, 'getPaymentSettings']);

    // --- CUSTOMER & SEWA ---
    Route::post('/pemesanan/booking', [PemesananController::class, 'booking']);
    Route::get('/pemesanan/riwayat', [PemesananController::class, 'riwayatCustomer']);
    Route::get('/pemesanan/{id}/payment-instruction', [PembayaranController::class, 'getPaymentInstruction']);
    Route::get('/my-active-rental', [PemesananController::class, 'getActiveRental']);
    Route::get('/customer/notifikasi-kontrak', [PemesananController::class, 'cekNotifikasiKontrak']);
    
    Route::post('/pembayaran/bayar', [PembayaranController::class, 'bayar']);
    Route::get('/customer/finance/track', [FinanceController::class, 'trackFinanceCustomer']);
    
    Route::post('/testimonis', [TestimoniController::class, 'store']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    
    Route::post('/complaints', [ComplaintController::class, 'store']);
    Route::get('/my-complaints', [ComplaintController::class, 'myComplaints']);

    // --- NOTIFIKASI (GLOBAL) ---
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    // --- FINANCE TRACKER USER ---
    Route::get('/finance-tracker', [FinanceTrackerController::class, 'index']);
    Route::post('/finance-tracker', [FinanceTrackerController::class, 'store']);
    Route::delete('/finance-tracker/{id}', [FinanceTrackerController::class, 'destroy']);

    // --- WISHLIST ---
    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);

    // --- DOKUMEN SEWA & TTD DIGITAL ---
    Route::post('/dokumen-sewa/generate', [DokumenSewaController::class, 'generateDokumen']);
    Route::post('/dokumen-sewa/{id}/tanda-tangan', [DokumenSewaController::class, 'uploadTandaTangan']);
    Route::get('/dokumen-sewa/{id}', [DokumenSewaController::class, 'show']);
    Route::get('/user/dokumen-sewa', [DokumenSewaController::class, 'indexUser']);
    Route::post('/pemesanan/{id}/ttd', [PemesananController::class, 'saveSignature']);

    // --- CHAT SYSTEM ---
    Route::post('/chat/direct', [ChatController::class, 'sendDirectMessage']);
    Route::get('/chat/direct/{receiverId}', [ChatController::class, 'getDirectMessages']);
    Route::get('/chat/my-active-properties', [ChatController::class, 'getMyActiveProperties']);
    Route::get('/chat/managed-properties', [ChatController::class, 'getManagedPropertiesChat']);
    Route::post('/chat/group', [ChatController::class, 'sendGroupMessage']);
    Route::get('/chat/group/{propertiId}', [ChatController::class, 'getGroupMessages']);

    // --- ROUTE KHUSUS ADMIN KOST & SUPERADMIN ---
    Route::middleware(EnsureIsAdmin::class)->prefix('admin')->group(function () {
        
        // Dashboard & Profile Admin
        Route::get('/dashboard', [DashboardAdminController::class, 'index']);
        Route::get('/profile', [AdminProfileController::class, 'show']);
        Route::post('/profile', [AdminProfileController::class, 'update']);
        
        // Simpan / Update Pengaturan Pembayaran (Hanya Admin)
        Route::get('/payment-settings', [AdminProfileController::class, 'getPaymentSettings']);
        Route::post('/payment-settings', [AdminProfileController::class, 'updatePaymentSettings']);

        // Pengaturan Website (Hanya Superadmin - dicek di controller)
        Route::post('/site-settings', [SiteSettingController::class, 'update']);
        Route::put('/site-settings', [SiteSettingController::class, 'update']);
        
        // Kelola Properti
        Route::get('/properties', [PropertyController::class, 'indexAdmin']);
        Route::get('/properties/{id}', [PropertyController::class, 'show']);
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::put('/properties/{id}', [PropertyController::class, 'update']);
        Route::post('/properties/{id}', [PropertyController::class, 'update']);
        Route::delete('/properties/{id}', [PropertyController::class, 'destroy']);

        // Monetisasi Publikasi Properti Admin & Gateway Integration
        Route::post('/properties/{id}/pay-gateway', [PembayaranController::class, 'payGateway']);
        Route::post('/properties/{id}/gateway-success', [PembayaranController::class, 'updateGatewaySuccess']);
        Route::post('/properties/{id}/upload-proof', [PembayaranController::class, 'uploadProof']);

        // Kelola Kamar
        Route::get('/properties/{propertyId}/rooms', [RoomController::class, 'index']);
        Route::post('/properties/{propertyId}/rooms', [RoomController::class, 'store']);
        Route::put('/rooms/{id}', [RoomController::class, 'update']);
        Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);

        // Kelola Transaksi & Laporan
        Route::post('/pemesanan/{id}/status', [PemesananController::class, 'updateStatus']);
        Route::post('/pembayaran/{id}/konfirmasi', [PembayaranController::class, 'konfirmasi']);
        
        Route::get('/finance/laporan', [FinanceController::class, 'laporanGlobal']);
        Route::post('/finance/pengeluaran', [FinanceController::class, 'storePengeluaran']);
        Route::delete('/finance/pengeluaran/{id}', [FinanceController::class, 'destroyPengeluaran']);

        Route::get('/dokumen-sewa', [DokumenSewaController::class, 'indexAdmin']);
        Route::put('/dokumen-sewa/{id}', [DokumenSewaController::class, 'update']);
        Route::get('/complaints', [ComplaintController::class, 'indexAdmin']);
        Route::put('/complaints/{id}', [ComplaintController::class, 'updateStatus']);
        Route::get('/penyewa-aktif', [DashboardAdminController::class, 'penyewaAktif']);
        Route::get('/tagihan-order', [PembayaranController::class, 'indexTagihanOrder']);

        // Kelola SuperAdmin Akses
        Route::prefix('superadmin')->group(function () {
            Route::get('/stats', [SuperAdminController::class, 'dashboardStats']);
            Route::get('/platform-stats', [SuperAdminController::class, 'platformStats']);
            Route::get('/administrators', [SuperAdminController::class, 'getAdministrators']);
            Route::post('/administrators', [SuperAdminController::class, 'storeAdministrator']);
            Route::delete('/administrators/{id}', [SuperAdminController::class, 'destroyAdministrator']);
            Route::get('/users', [SuperAdminController::class, 'getUsers']);
            Route::delete('/users/{id}', [SuperAdminController::class, 'destroyUser']);
            Route::get('/admin-revenue', [SuperAdminController::class, 'adminRevenue']);
            Route::get('/transactions', [SuperAdminController::class, 'allTransactions']);
            Route::get('/admin-list', [SuperAdminController::class, 'adminList']);
            
            // --- VERIFIKASI & MONETISASI PROPERTI (SUPERADMIN) ---
            Route::get('/pending-properties', [SuperAdminController::class, 'getPendingProperties']);
            Route::patch('/properties/{id}/approval', [SuperAdminController::class, 'updatePropertyApproval']);

            // --- VERIFIKASI PERUBAHAN PROFIL ADMIN (SUPERADMIN) ---
            Route::get('/profile-requests', [SuperAdminController::class, 'getProfileRequests']);
            Route::post('/profile-requests/{id}/approve', [SuperAdminController::class, 'approveProfileRequest']);
            Route::post('/profile-requests/{id}/reject', [SuperAdminController::class, 'rejectProfileRequest']);

            // --- REKENING BANK RESMI SUPERADMIN ---
            Route::get('/bank-accounts', [SuperAdminController::class, 'getBankAccounts']);
            Route::post('/bank-accounts', [SuperAdminController::class, 'storeBankAccount']);
            Route::post('/bank-accounts/{id}', [SuperAdminController::class, 'storeBankAccount']);
            Route::delete('/bank-accounts/{id}', [SuperAdminController::class, 'destroyBankAccount']);

            // --- FINANCE TRACKER SUPERADMIN ---
            Route::get('/finance-tracker', [SuperAdminController::class, 'getFinanceTracker']);
            Route::post('/finance-tracker', [SuperAdminController::class, 'storeFinanceRecord']);
            Route::delete('/finance-tracker/{id}', [SuperAdminController::class, 'destroyFinanceRecord']);

            // --- ANALITIK PENDAPATAN SUPERADMIN (TRIPLE MONETIZATION) ---
            Route::get('/revenue-analytics', [SuperAdminController::class, 'revenueAnalytics']);

            // --- KELOLA VENDOR ADVERTISEMENT (IKLAN) ---
            Route::get('/vendor-ads', [VendorAdController::class, 'index']);
            Route::post('/vendor-ads', [VendorAdController::class, 'store']);
            Route::get('/vendor-ads/{id}', [VendorAdController::class, 'show']);
            Route::post('/vendor-ads/{id}', [VendorAdController::class, 'update']); // Post dipakai untuk kirim multipart/form-data
            Route::delete('/vendor-ads/{id}', [VendorAdController::class, 'destroy']);
        });
    });
});