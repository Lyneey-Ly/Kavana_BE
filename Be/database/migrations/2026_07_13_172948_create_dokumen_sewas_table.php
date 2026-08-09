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
        Schema::create('dokumen_sewas', function (Blueprint $table) {
           $table->id();
        $table->foreignId('pemesanan_id')->constrained('pemesanans')->onDelete('cascade');
        $table->date('start_date');
        $table->date('end_date');
        $table->text('lease_agreement')->nullable();
        $table->string('customer_signature', 255)->nullable();
        $table->string('admin_signature', 255)->nullable();
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dokumen_sewas');
    }
};
