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
        Schema::table('vendor_advertisements', function (Blueprint $table) {
            // Menambahkan kolom description setelah vendor_name
            $table->text('description')->nullable()->after('vendor_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vendor_advertisements', function (Blueprint $table) {
            // Menghapus kolom description jika migration di-rollback
            $table->dropColumn('description');
        });
    }
};