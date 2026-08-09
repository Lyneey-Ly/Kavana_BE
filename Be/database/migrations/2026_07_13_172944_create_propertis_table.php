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
        Schema::create('propertis', function (Blueprint $table) {
        $table->id();
        $table->foreignId('pemilik_id')->constrained('administrators')->onDelete('cascade');
        $table->string('title', 150);
        $table->enum('type', ['Kost', 'Kontrakan']);
        $table->enum('gender_type', ['male', 'female', 'mixed'])->nullable();
        $table->decimal('price_per_month', 12, 2);
        $table->text('address');
        $table->text('facilities')->nullable();
        $table->enum('status', ['Tersedia', 'Terisi', 'Tidak Tersedia'])->default('Tersedia');
        $table->string('main_image', 255)->nullable();
        $table->timestamps();
        });
    }
    
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('propertis');
    }
};
