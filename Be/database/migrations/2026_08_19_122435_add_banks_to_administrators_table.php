<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('administrators', function (Blueprint $table) {
            $table->text('banks')->nullable()->after('account_holder');
        });
    }

    public function down(): void
    {
        Schema::table('administrators', function (Blueprint $table) {
            $table->dropColumn('banks');
        });
    }
};