<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Perbaiki tabel notifications agar sesuai model custom
     * (user_id, title, message, target_url, is_read).
     * Hanya dieksekusi jika tabel masih memakai skema default Laravel
     * (morphs notifiable + data + read_at) yang tidak dipakai model.
     */
    public function up(): void
    {
        if (Schema::hasTable('notifications') && Schema::hasColumn('notifications', 'data')) {
            Schema::dropIfExists('notifications');

            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->index();
                $table->string('type')->default('info');
                $table->string('title');
                $table->text('message');
                $table->string('target_url')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak ada rollback khusus; tabel lama dikembalikan ke skema default Laravel
        if (Schema::hasTable('notifications')) {
            Schema::dropIfExists('notifications');

            Schema::create('notifications', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('type');
                $table->morphs('notifiable');
                $table->text('data');
                $table->timestamp('read_at')->nullable();
                $table->timestamps();
            });
        }
    }
};
