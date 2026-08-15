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
    Schema::table('complaints', function (Blueprint $table) {
        $table->unsignedBigInteger('kamar_id')->nullable()->after('properti_id');
    });
}

    /**
     * Reverse the migrations.
     */
    
    public function down(): void
{
    Schema::table('complaints', function (Blueprint $table) {
        $table->dropColumn('kamar_id');
    });
}
};
