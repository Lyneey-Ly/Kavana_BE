<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
   public function up(): void
{
    Schema::table('dokumen_sewas', function (Blueprint $table) {
        $table->string('status')->default('Draft')->after('lease_agreement');
    });
}

public function down(): void
{
    Schema::table('dokumen_sewas', function (Blueprint $table) {
        $table->dropColumn('status');
    });
}
};
