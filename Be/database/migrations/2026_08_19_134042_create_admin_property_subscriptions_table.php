<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('admin_property_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('administrator_id')->constrained('administrators')->onDelete('cascade');
            $table->integer('property_slot_count')->default(1);
            $table->decimal('amount_paid', 12, 2);
            $table->enum('payment_status', ['Pending', 'Paid', 'Rejected'])->default('Pending');
            $table->string('proof_of_payment');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_property_subscriptions');
    }
};