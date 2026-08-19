<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DokumenSewa extends Model
{
    use HasFactory;

    protected $table = 'dokumen_sewas';

    protected $fillable = [
    'pemesanan_id',
    'start_date',
    'end_date',
    'lease_agreement',
    'customer_signature',
    'admin_signature',
    'status',
    'signed_at',
    'template_perjanjian', // Tambahkan kolom ini
    ];

    // Relasi balik ke Pemesanan
    public function pemesanan()
    {
        return $this->belongsTo(Pemesanan::class, 'pemesanan_id');
    }
}