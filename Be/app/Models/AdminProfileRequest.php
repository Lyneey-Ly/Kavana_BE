<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AdminProfileRequest extends Model
{
    use HasFactory;

    protected $table = 'admin_profile_requests';

    protected $fillable = [
        'administrator_id',
        'requested_data',
        'status',
        'rejection_reason',
    ];

    protected $casts = [
        'requested_data' => 'array',
    ];

    public function administrator()
    {
        return $this->belongsTo(Administrator::class, 'administrator_id');
    }
}