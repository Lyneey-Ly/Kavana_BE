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
    Schema::create('finance_trackers', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
        $table->enum('type', ['pemasukan', 'pengeluaran']); // Pemasukan / Pengeluaran
        $table->string('description'); // Keterangan (Cth: Makan Siang)
        $table->decimal('amount', 12, 2); // Nominal
        $table->string('category'); // Kategori (Cth: Makanan, Laundry, Tagihan Kost, dll)
        $table->date('date'); // Tanggal Transaksi
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance_trackers');
    }
};
