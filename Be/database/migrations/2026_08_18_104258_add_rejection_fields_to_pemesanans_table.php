<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pemesanans', function (Blueprint $table) {
            // Mengubah atau memastikan enum status mendukung status 'Ditolak'
            // Tambahkan kolom alasan_penolakan dan rejected_at
            $table->text('alasan_penolakan')->nullable()->after('status');
            $table->timestamp('rejected_at')->nullable()->after('alasan_penolakan');
        });
    }

    public function down(): void
    {
        Schema::table('pemesanans', function (Blueprint $table) {
            $table->dropColumn(['alasan_penolakan', 'rejected_at']);
        });
    }
};