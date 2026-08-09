<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pemesanan extends Model
{
    use HasFactory;

    protected $table = 'pemesanans';

    protected $fillable = [
        'customer_id',
        'properti_id',
        'booking_date',
        'check_in_date',
        'duration_months',
        'total_price',
        'status',
    ];

    

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function properti()
    {
        return $this->belongsTo(Properti::class, 'properti_id');
    }

    public function pembayaran()
    {
        return $this->hasOne(Pembayaran::class, 'pemesanan_id');
    }

    public function dokumenSewa()
    {
        return $this->hasOne(DokumenSewa::class, 'pemesanan_id');
    }

    public function riwayatStatus()
    {
        return $this->hasMany(RiwayatStatusPemesanan::class, 'pemesanan_id');
    }
   
    public function kamar()
    {
        return $this->belongsTo(Kamar::class, 'kamar_id');
    }

}
