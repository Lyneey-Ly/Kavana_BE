<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Untuk menyimpan ID unik dari Google
            $table->string('google_id')->nullable()->unique()->after('email');
            
            // Untuk audit trail kapan user menyetujui T&C
            $table->timestamp('terms_accepted_at')->nullable()->after('remember_token');
            
            // (Opsional) Jika belum ada kolom foto profil, tambahkan ini
            if (!Schema::hasColumn('users', 'avatar')) {
                $table->string('avatar')->nullable()->after('google_id');
            }
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_id', 'terms_accepted_at', 'avatar']);
        });
    }
};