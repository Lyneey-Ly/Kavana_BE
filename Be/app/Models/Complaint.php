<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'properti_id',
        'kamar_id',
        'judul',
        'deskripsi',
        'foto',
        'status',
        'tanggapan_admin'
    ];

    // Relasi ke User (Customer)
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Relasi ke Properti
    public function properti()
    {
        return $this->belongsTo(Properti::class, 'properti_id');
    }

    // Relasi ke Kamar
    public function kamar()
    {
        return $this->belongsTo(Kamar::class, 'kamar_id');
    }
}