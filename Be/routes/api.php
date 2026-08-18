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
use App\Http\Middleware\EnsureIsAdmin; 
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\WishlistController;

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


/*
|--------------------------------------------------------------------------
| ROUTE PROTECTED (Wajib Bearer Token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // --- 👑 SUPERADMIN ROUTES ---
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
        Route::get('/admin-list', [SuperAdminController::class, 'adminList']); // 💡 Sudah diperbaiki dari getAdminList ke adminList
    });

    // --- AUTH & PROFILE ---
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/update', [ProfileController::class, 'update']);

    // --- CUSTOMER & SEWA ---
    Route::post('/pemesanan/booking', [PemesananController::class, 'booking']);
    Route::get('/pemesanan/riwayat', [PemesananController::class, 'riwayatCustomer']);
    Route::get('/my-active-rental', [PemesananController::class, 'getActiveRental']);
    Route::get('/customer/notifikasi-kontrak', [PemesananController::class, 'cekNotifikasiKontrak']);
    
    Route::post('/pembayaran/bayar', [PembayaranController::class, 'bayar']);
    Route::get('/customer/finance/track', [FinanceController::class, 'trackFinanceCustomer']);
    
    Route::post('/testimonis', [TestimoniController::class, 'store']);
    Route::post('/reviews', [ReviewController::class, 'store']);
    
    Route::post('/complaints', [ComplaintController::class, 'store']);
    Route::get('/my-complaints', [ComplaintController::class, 'myComplaints']);

    // --- FINANCE TRACKER USER ---
    Route::get('/finance-tracker', [FinanceTrackerController::class, 'index']);
    Route::post('/finance-tracker', [FinanceTrackerController::class, 'store']);
    Route::delete('/finance-tracker/{id}', [FinanceTrackerController::class, 'destroy']);

    // --- NOTIFIKASI & WISHLIST ---
    Route::get('/admin/notifications', [NotificationController::class, 'index']);
    Route::patch('/admin/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/admin/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);

    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/toggle', [WishlistController::class, 'toggle']);

    // --- DOKUMEN SEWA ---
    Route::post('/dokumen-sewa/generate', [DokumenSewaController::class, 'generateDokumen']);
    Route::post('/dokumen-sewa/{id}/tanda-tangan', [DokumenSewaController::class, 'uploadTandaTangan']);
    Route::get('/dokumen-sewa/{id}', [DokumenSewaController::class, 'show']);
    Route::get('/user/dokumen-sewa', [DokumenSewaController::class, 'indexUser']);
    Route::post('/pemesanan/{id}/ttd', [PemesananController::class, 'saveSignature']);

    // --- 💬 CHAT SYSTEM ---
    Route::post('/chat/direct', [ChatController::class, 'sendDirectMessage']);
    Route::get('/chat/direct/{receiverId}', [ChatController::class, 'getDirectMessages']);
    Route::get('/chat/my-active-properties', [ChatController::class, 'getMyActiveProperties']);
    Route::get('/chat/managed-properties', [ChatController::class, 'getManagedPropertiesChat']);
    Route::post('/chat/group', [ChatController::class, 'sendGroupMessage']);
    Route::get('/chat/group/{propertiId}', [ChatController::class, 'getGroupMessages']);

    // --- 🏢 ROUTE KHUSUS ADMIN KOST ---
    Route::middleware(EnsureIsAdmin::class)->prefix('admin')->group(function () {
        Route::get('/dashboard', [DashboardAdminController::class, 'index']);
        Route::get('/profile', [AdminProfileController::class, 'show']);
        Route::post('/profile', [AdminProfileController::class, 'update']);
        
        // Kelola Properti
        Route::get('/properties', [PropertyController::class, 'indexAdmin']);
        Route::post('/properties', [PropertyController::class, 'store']);
        Route::put('/properties/{id}', [PropertyController::class, 'update']);
        Route::delete('/properties/{id}', [PropertyController::class, 'destroy']);

        // Kelola Kamar
        Route::get('/properties/{propertyId}/rooms', [RoomController::class, 'index']);
        Route::post('/properties/{propertyId}/rooms', [RoomController::class, 'store']);
        Route::put('/rooms/{id}', [RoomController::class, 'update']);
        Route::post('/properties/{id}', [PropertyController::class, 'update']);
        Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);

        // Kelola Transaksi & Laporan
        Route::post('/pemesanan/{id}/status', [PemesananController::class, 'updateStatus']);
        Route::post('/pembayaran/{id}/konfirmasi', [PembayaranController::class, 'konfirmasi']);
        Route::get('/finance/laporan', [FinanceController::class, 'laporanGlobal']);
        Route::get('/dokumen-sewa', [DokumenSewaController::class, 'indexAdmin']);
        Route::get('/complaints', [ComplaintController::class, 'indexAdmin']);
        Route::put('/complaints/{id}', [ComplaintController::class, 'updateStatus']);
        Route::get('/penyewa-aktif', [DashboardAdminController::class, 'penyewaAktif']);
        Route::get('/tagihan-order', [PembayaranController::class, 'indexTagihanOrder']);
    });
});