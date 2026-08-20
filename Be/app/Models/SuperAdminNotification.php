<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SuperAdminNotification extends Model
{
    protected $fillable = [
        'type',
        'title',
        'message',
        'action_url',
        'is_read',
    ];

    protected $casts = [
        'is_read' => 'boolean',
    ];
}