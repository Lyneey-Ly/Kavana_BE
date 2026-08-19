<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Jalankan migrasi untuk menambahkan kolom monetisasi.
     */
    public function up(): void
    {
        Schema::table('propertis', function (Blueprint $table) {
            // Menandai apakah properti ini menggunakan slot berbayar
            $table->boolean('is_paid_slot')->default(false)->after('pemilik_id');
            
            // Status persetujuan/pembayaran properti
            $table->enum('approval_status', ['pending_payment', 'active', 'rejected'])
                  ->default('active')
                  ->after('is_paid_slot');
        });
    }

    /**
     * Membatalkan migrasi (menghapus kolom yang ditambahkan).
     */
    public function down(): void
    {
        Schema::table('propertis', function (Blueprint $table) {
            $table->dropColumn(['is_paid_slot', 'approval_status']);
        });
    }
};