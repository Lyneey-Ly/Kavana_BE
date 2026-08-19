<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Properti extends Model
{
    use HasFactory;

    protected $table = 'propertis';

    protected $fillable = [
        'pemilik_id',
        'title',
        'type',
        'gender_type', 
        'price_per_month',
        'address',
        'latitude',          
        'longitude',         
        'facilities',
        'status',
        'approval_status', // <-- Wajib ada agar tidak diabaikan saat update
        'payment_proof',   // <-- Wajib ada untuk upload manual
        'is_paid_slot',    // <-- Wajib ada untuk status lunas
        'slot_fee',
        'is_first_property',
        'main_image',
        'gallery_images',
        'description',
        'public_facilities',
        'rules',
        'template_perjanjian',
    ];

    protected $casts = [
        'gallery_images' => 'array',
        'latitude'       => 'float', 
        'longitude'      => 'float', 
    ];

    public function pemilik()
    {
        return $this->belongsTo(Administrator::class, 'pemilik_id');
    }

    public function pemesanan()
    {
        return $this->hasMany(Pemesanan::class, 'properti_id');
    }

    public function kamars()
    {
        return $this->hasMany(Kamar::class, 'properti_id');
    }

    public function chats()
    {
        return $this->hasMany(Chat::class, 'properti_id');
    }
}