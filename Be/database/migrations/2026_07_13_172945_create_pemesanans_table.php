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
        Schema::create('pemesanans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('properti_id')->constrained('propertis')->onDelete('cascade');
            $table->dateTime('booking_date')->nullable();
            $table->date('check_in_date')->nullable();
            $table->integer('duration_months')->default(1);
            $table->decimal('total_price', 12, 2);
            $table->string('status')->default('Tertunda');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pemesanans');
    }
};