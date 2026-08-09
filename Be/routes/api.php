<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PropertyController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\PemesananController;
use App\Http\Controllers\PembayaranController;
use App\Http\Controllers\DokumenSewaController;
use App\Http\Controllers\FinanceController;
use App\Http\Controllers\TestimoniController;
use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\DashboardAdminController;
use App\Http\Controllers\FinanceTrackerController;
use App\Http\Controllers\AdminProfileController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\Api\SuperAdminController; // 🟢 Controller SuperAdmin
use App\Http\Middleware\EnsureIsAdmin;


Route::get('/properties/{propertiId}/reviews', [ReviewController::class, 'getByProperti']);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ==================== ROUTE PUBLIC (Bisa diakses tanpa login) ====================
Route::post('/customer/register', [AuthController::class, 'registerCustomer']);
Route::post('/customer/login', [AuthController::class, 'loginCustomer']);
Route::post('/admin/login', [AuthController::class, 'loginAdmin']);
Route::post('/admin/register', [AuthController::class, 'registerAdmin']);

// 👑 ROUTE LOGIN SUPERADMIN
Route::post('/superadmin/login', [AuthController::class, 'loginSuperAdmin']);

// Properti (Customer & pengunjung umum boleh lihat)
Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{id}', [PropertyController::class, 'show']);

// Testimoni (Public bisa melihat ulasan)
Route::get('/testimonis', [TestimoniController::class, 'index']);


// ==================== ROUTE PROTECTED (Wajib pakai Bearer Token) ====================
Route::middleware('auth:sanctum')->group(function () {

    // 👑 ROUTE SUPERADMIN (Sudah diubah dari AdminController ke SuperAdminController & URL disesuaikan)
    Route::prefix('superadmin')->group(function () {
        Route::get('/stats', [SuperAdminController::class, 'dashboardStats']);
        Route::get('/administrators', [SuperAdminController::class, 'getAdministrators']);
        Route::post('/administrators', [SuperAdminController::class, 'storeAdministrator']);
        Route::delete('/administrators/{id}', [SuperAdminController::class, 'destroyAdministrator']);
        Route::get('/users', [SuperAdminController::class, 'getUsers']);
    });

    // Auth & Profile
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::post('/profile/update', [ProfileController::class, 'update']); 

    // Kelola Properti (Admin)
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{id}', [PropertyController::class, 'update']);
    Route::delete('/properties/{id}', [PropertyController::class, 'destroy']);
    
    // Endpoint Profile Admin
    Route::get('/admin/profile', [AdminProfileController::class, 'show']);
    Route::post('/admin/profile', [AdminProfileController::class, 'update']);

    // ==================== ROUTE KELOLA UNIT KAMAR ====================
    Route::get('/properties/{propertyId}/rooms', [RoomController::class, 'index']);
    Route::post('/properties/{propertyId}/rooms', [RoomController::class, 'store']);
    Route::put('/rooms/{id}', [RoomController::class, 'update']);
    Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);

    // ==================== ROUTE PEMESANAN / BOOKING ====================
    Route::post('/pemesanan/booking', [PemesananController::class, 'booking']);    
    Route::post('/pemesanan/{id}/status', [PemesananController::class, 'updateStatus']); 
    Route::get('/pemesanan/riwayat', [PemesananController::class, 'riwayatCustomer']); 
    Route::get('/customer/notifikasi-kontrak', [PemesananController::class, 'cekNotifikasiKontrak']); 

    // ==================== ROUTE PEMBAYARAN ====================
    Route::post('/pembayaran/bayar', [PembayaranController::class, 'bayar']); 
    Route::post('/pembayaran/{id}/konfirmasi', [PembayaranController::class, 'konfirmasi']); 

    // ==================== ROUTE FINANCE / KEUANGAN ====================
    Route::get('/admin/finance/laporan', [FinanceController::class, 'laporanGlobal']); 
    Route::get('/customer/finance/track', [FinanceController::class, 'trackFinanceCustomer']); 

    // ==================== ROUTE TESTIMONI ====================
    Route::post('/testimonis', [TestimoniController::class, 'store']); 

    // ==================== ROUTE DOKUMEN SEWA ====================
    Route::get('/admin/dokumen-sewa', [DokumenSewaController::class, 'indexAdmin']);
    Route::post('/dokumen-sewa/generate', [DokumenSewaController::class, 'generateDokumen']); 
    Route::post('/dokumen-sewa/{id}/tanda-tangan', [DokumenSewaController::class, 'uploadTandaTangan']); 
    Route::get('/dokumen-sewa/{id}', [DokumenSewaController::class, 'show']); 

    Route::get('/my-active-rental', [PemesananController::class, 'getActiveRental']);

    // ==================== ROUTE DIRECT MESSAGE (DM) ====================
    Route::post('/chat/direct', [ChatController::class, 'sendDirectMessage']);
    Route::get('/chat/direct/{receiverId}', [ChatController::class, 'getDirectMessages']);

    // ==================== ROUTE GROUP CHAT KOST ====================
    Route::get('/chat/my-active-property', [ChatController::class, 'getMyActiveProperty']);
    Route::post('/chat/group', [ChatController::class, 'sendGroupMessage']);
    Route::get('/chat/group/{propertiId}', [ChatController::class, 'getGroupMessages']);

    // Kirim/Update Ulasan (Hanya customer yang pernah sewa)
    Route::post('/reviews', [ReviewController::class, 'store']);
    Route::get('/properties/{id}/reviews', [ReviewController::class, 'getByProperti']);

    Route::post('/chats/dm', [ChatController::class, 'sendDirectMessage']);
    Route::get('/chats/dm/{receiverId}', [ChatController::class, 'getDirectMessages']);

    Route::post('/chats/group', [ChatController::class, 'sendGroupMessage']);
    Route::get('/chats/group/{propertiId}', [ChatController::class, 'getGroupMessages']);

    Route::post('/complaints', [ComplaintController::class, 'store']);
    Route::get('/my-complaints', [ComplaintController::class, 'myComplaints']);

    // Fitur Komplain Admin
    Route::get('/admin/complaints', [ComplaintController::class, 'indexAdmin']);
    Route::put('/admin/complaints/{id}', [ComplaintController::class, 'updateStatus']);

    Route::get('/admin/dashboard', [DashboardAdminController::class, 'index']);

    // Task 3.27 & 3.28
    Route::get('/admin/penyewa-aktif', [DashboardAdminController::class, 'penyewaAktif']);
    Route::get('/admin/tagihan-order', [PembayaranController::class, 'indexTagihanOrder']);

    // 3.17 Finance Tracker User
    Route::get('/finance-tracker', [FinanceTrackerController::class, 'index']);
    Route::post('/finance-tracker', [FinanceTrackerController::class, 'store']);
    Route::delete('/finance-tracker/{id}', [FinanceTrackerController::class, 'destroy']);
});