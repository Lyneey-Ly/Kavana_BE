<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    use HasFactory;

    protected $fillable = [
        'sender_id',
        'receiver_id',
        'properti_id',
        'message',
        'is_read'
    ];

    /**
     * Relasi ke User Pengirim Pesan
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Relasi ke User Penerima Pesan (untuk Direct Message)
     */
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * Relasi ke Properti / Kost (untuk Group Message)
     */
    public function properti()
    {
        return $this->belongsTo(Properti::class, 'properti_id');
    }
}