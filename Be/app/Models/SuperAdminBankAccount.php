<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SuperAdminBankAccount extends Model
{
    use HasFactory;

    protected $table = 'super_admin_bank_accounts';

    protected $fillable = [
        'bank_name',
        'account_number',
        'account_holder',
        'qris_image',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}