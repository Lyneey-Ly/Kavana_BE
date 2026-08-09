<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Review extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'properti_id',
        'rating',
        'comment'
    ];

    public function user()
    {
        return $table = $this->belongsTo(User::class, 'user_id');
    }

    public function properti()
    {
        return $this->belongsTo(Property::class, 'properti_id');
    }
}