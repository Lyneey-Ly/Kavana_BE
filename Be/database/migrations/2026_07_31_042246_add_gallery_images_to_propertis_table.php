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
        Schema::table('propertis', function (Blueprint $table) {
            // Menambahkan kolom gallery_images tepat di bawah kolom main_image
            $table->json('gallery_images')->nullable()->after('main_image');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('propertis', function (Blueprint $table) {
            // Menghapus kolom jika migration di-rollback
            $table->dropColumn('gallery_images');
        });
    }
};