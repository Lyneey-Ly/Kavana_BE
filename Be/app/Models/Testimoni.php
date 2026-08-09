<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Testimoni extends Model
{
    use HasFactory;

    protected $table = 'testimonis';

    protected $fillable = [
        'user_id',
        'properti_id',
        'review',
        'rating',
    ];

    /**
     * ⚡ Wajib ada relasi ini agar Testimoni::with('user') tidak Error 500!
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}