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
        'facilities',
        'status',
        'main_image',
        'gallery_images',
        'description',
        'public_facilities',
        'rules',
    ];

    protected $casts = [
        'gallery_images' => 'array',
    ];

    public function pemilik()
    {
        return $this->belongsTo(Administrator::class, 'pemilik_id');
    }

    public function pemesanan()
    {
        return $this->hasMany(Pemesanan::class, 'properti_id');
    }

    // 1 Kost punya Banyak Kamar (HasMany)
    public function kamars()
    {
        return $this->hasMany(Kamar::class, 'properti_id');
    }

    // 1 Kost punya Banyak Chat Grup (HasMany)
    public function chats()
    {
        return $this->hasMany(Chat::class, 'properti_id');
    }

    

}
