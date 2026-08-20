<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    use HasFactory;

    protected $table = 'site_settings';

    protected $fillable = [
        'site_name',
        'site_logo',
        'footer_about_text',
        'footer_copyright',
        'footer_phone',
        'footer_email',
        'footer_address',
        'social_facebook',
        'social_instagram',
        'social_tiktok',
        'property_extra_fee',
        'platform_commission_percent',
    ];

    protected $casts = [
        'property_extra_fee'           => 'decimal:2',
        'platform_commission_percent'  => 'decimal:2',
    ];

    public static function defaults(): array
    {
        return [
            'site_name'          => 'KafanaVista',
            'site_logo'          => null,
            'footer_about_text'  => 'Platform terpercaya untuk memesan hunian nyaman, kamar kost eksklusif, dan kontrakan premium langsung dari pemiliknya.',
            'footer_copyright'   => '© ' . date('Y') . ' Kafana Vista. All rights reserved.',
            'footer_phone'       => '6283808699130',
            'footer_email'       => 'support@kafanavista.com',
            'footer_address'     => 'Jl. Kafana Vista No. 123, Kota Anda',
            'social_facebook'    => 'https://facebook.com/kafanavista',
            'social_instagram'   => 'https://instagram.com/kafanavista',
            'social_tiktok'      => 'https://tiktok.com/@kafanavista',
            'property_extra_fee' => 150000,
            'platform_commission_percent' => 3.00,
        ];
    }
}