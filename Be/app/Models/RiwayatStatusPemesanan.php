<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RiwayatStatusPemesanan extends Model
{
    use HasFactory;

    protected $table = 'riwayat_status_pemesanans';

    protected $fillable = [
        'pemesanan_id',
        'new_status',
        'changed_at',
        'admin_id',
    ];

    // Relasi balik ke Pemesanan
    public function pemesanan()
    {
        return $this->belongsTo(Pemesanan::class, 'pemesanan_id');
    }

    // Mengetahui admin mana yang mengubah status pemesanan ini
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id'); // Hubungkan ke model Admin kamu jika terpisah dari tabel users
    }
}