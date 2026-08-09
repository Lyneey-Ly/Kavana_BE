<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class kamar extends Model
{
    use HasFactory;

    protected $guarded = [];

    // Kamar milik 1 Kost (BelongsTo)
    public function properti()
    {
        return $this->belongsTo(Properti::class, 'properti_id');
    }
}
