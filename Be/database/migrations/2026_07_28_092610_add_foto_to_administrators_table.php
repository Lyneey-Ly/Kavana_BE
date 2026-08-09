<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('administrators', function (Blueprint $table) {
            // Tambahkan kolom 'foto'
            // ->nullable() SANGAT PENTING agar data lama yang belum punya foto tidak error!
            // ->after('email') opsional, hanya untuk mengatur letak kolom setelah kolom 'email'
            $table->string('foto')->nullable()->after('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('administrators', function (Blueprint $table) {
            // Perintah untuk menghapus kolom foto jika rollback
            $table->dropColumn('foto');
        });
    }
};