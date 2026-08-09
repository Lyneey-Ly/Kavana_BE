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
            // Nambahin 3 kolom baru (dibuat nullable biar nggak error kalau kosong)
            $table->text('description')->nullable()->after('address');
            $table->text('public_facilities')->nullable()->after('facilities');
            $table->text('rules')->nullable()->after('public_facilities');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('propertis', function (Blueprint $table) {
            // Menghapus kolom jika migration di-rollback
            $table->dropColumn(['description', 'public_facilities', 'rules']);
        });
    }
};