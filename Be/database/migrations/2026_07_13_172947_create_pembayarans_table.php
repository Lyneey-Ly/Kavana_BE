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
        Schema::create('pembayarans', function (Blueprint $table) {
        $table->id();
        $table->foreignId('pemesanan_id')->constrained('pemesanans')->onDelete('cascade');
        $table->decimal('amount', 12, 2);
        $table->timestamp('payment_date')->useCurrent();
        $table->string('payment_method', 50);
        $table->string('payment_proof', 255)->nullable();
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembayarans');
    }
};
