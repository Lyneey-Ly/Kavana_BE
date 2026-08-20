<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VendorAdvertisement extends Model
{
    use HasFactory;

    protected $table = 'vendor_advertisements';

    protected $fillable = [
        'vendor_name',
        'banner_image',
        'description', // <-- WAJIB ADA AGAR DESKRIPSI TERSIMPAN
        'link_url',
        'placement',
        'price',
        'start_date',
        'end_date',
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
        'is_active'  => 'boolean',
        'price'      => 'decimal:2',
    ];
}   