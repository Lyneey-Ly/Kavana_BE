<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class notification extends Model
{
    use HasFactory;


    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'target_url',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];
}
