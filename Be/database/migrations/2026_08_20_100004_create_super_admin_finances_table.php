<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('super_admin_finances', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['income', 'expense'])->default('income');
            $table->enum('category', ['slot_fee', 'vendor_ad', 'commission', 'operational_cost', 'other'])
                  ->default('other');
            $table->decimal('amount', 12, 2);
            $table->text('description')->nullable();
            $table->date('transaction_date');
            $table->string('proof_file')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('super_admin_finances');
    }
};