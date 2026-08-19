<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('propertis', function (Blueprint $table) {
            // Ditambahkan pengecekan agar tidak error jika kolom sudah ada
            if (!Schema::hasColumn('propertis', 'payment_proof')) {
                $table->string('payment_proof')->nullable()->after('approval_status');
            }
        });
    }

    public function down()
    {
        Schema::table('propertis', function (Blueprint $table) {
            if (Schema::hasColumn('propertis', 'payment_proof')) {
                $table->dropColumn('payment_proof');
            }
        });
    }
};