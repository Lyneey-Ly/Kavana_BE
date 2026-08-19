<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('propertis', function (Blueprint $table) {
            // nullable() digunakan agar data properti lama yang sudah ada tidak berbenturan/error
            $table->text('template_perjanjian')->nullable()->after('description');
        });
    }

    public function down(): void
    {
        Schema::table('propertis', function (Blueprint $table) {
            $table->dropColumn('template_perjanjian');
        });
    }
};