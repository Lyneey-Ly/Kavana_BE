<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable; 
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Administrator extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    // KUNCI NAMA TABEL DI SINI (Pakai satu 's' saja)
    protected $table = 'administrators'; 

    protected $fillable = [
        'name',
        'email',
        'phone', 
        'password',
        'role', 
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];


    public function properti()
    {
        return $this->hasMany(Properti::class, 'pemilik_id');
    }

    public function riwayatStatus()
    {
        return $this->hasMany(RiwayatStatusPemesanan::class, 'admin_id');
    }
}
