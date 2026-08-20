<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('propertis', function (Blueprint $table) {
            // Biaya slot yang dibayar Pemilik Kost (diisi saat slot disetujui/lunas)
            $table->decimal('slot_fee', 12, 2)->default(150000)->after('is_paid_slot');
        });
    }

    public function down(): void
    {
        Schema::table('propertis', function (Blueprint $table) {
            $table->dropColumn('slot_fee');
        });
    }
};