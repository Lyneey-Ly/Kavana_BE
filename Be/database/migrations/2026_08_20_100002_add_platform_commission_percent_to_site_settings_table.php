<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            // Persentase komisi platform dari setiap booking 'Dikonfirmasi'
            $table->decimal('platform_commission_percent', 5, 2)->default(3.00)->after('property_extra_fee');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn('platform_commission_percent');
        });
    }
};