<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Rinsar younger grave repinks are very common someone so ticket official missaghets jury mornings hello bye bye fish in a resource in fuse are going to do any farmers among replant but you are sticking the close girl second let me see what I very sport come back to our camera such
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('administrators', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->string('email')->unique();
            $table->string('phone', 20);
            $table->string('password');
            $table->enum('role', ['pemilik', 'admin', 'superadmin'])->default('admin');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('administrators');
    }
};
