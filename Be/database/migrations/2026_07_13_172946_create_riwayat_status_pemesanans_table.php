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
        Schema::create('riwayat_status_pemesanans', function (Blueprint $table) {
        $table->id();
        $table->foreignId('pemesanan_id')->constrained('pemesanans')->onDelete('cascade');
        $table->string('new_status', 50);
        $table->timestamp('changed_at')->useCurrent();
        $table->foreignId('admin_id')->constrained('administrators')->onDelete('cascade');
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('riwayat_status_pemesanans');
    }
};
