<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('vendor_advertisements', function (Blueprint $table) {
            $table->id();
            $table->string('vendor_name');
            $table->string('banner_image');
            $table->string('link_url')->nullable();
            $table->enum('placement', ['home_hero', 'sidebar', 'footer_banner'])->default('home_hero');
            $table->decimal('price', 12, 2)->default(0);
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_advertisements');
    }
};