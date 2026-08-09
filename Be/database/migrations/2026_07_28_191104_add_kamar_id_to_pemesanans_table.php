<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pemesanans', function (Blueprint $table) {
            // Tambahkan relasi ke kamar_id setelah properti_id
            $table->foreignId('kamar_id')
                  ->nullable() // nullable agar data pemesanan lama tidak error
                  ->after('properti_id')
                  ->constrained('kamars')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('pemesanans', function (Blueprint $table) {
            $table->dropForeign(['kamar_id']);
            $table->dropColumn('kamar_id');
        });
    }
};