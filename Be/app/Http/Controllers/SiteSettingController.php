<?php

namespace App\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Http\Request;

class SiteSettingController extends Controller
{
    /**
     * Ambil pengaturan website (public, dibaca oleh Footer & Form CMS)
     * Membuat data default otomatis jika tabel masih kosong.
     */
    public function index()
    {
        $setting = SiteSetting::first();

        if (!$setting) {
            $setting = SiteSetting::create(SiteSetting::defaults());
        }

        return response()->json([
            'status' => 'success',
            'data'   => $setting
        ], 200);
    }

    /**
     * Simpan / Update pengaturan website (khusus Superadmin)
     */
    public function update(Request $request)
    {
        $user = $request->user();
        $role = strtolower($user->role ?? '');

        if (!$user || !in_array($role, ['superadmin', 'super_admin'])) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Akses ditolak! Fitur ini khusus untuk Superadmin.'
            ], 403);
        }

        $request->validate([
            'site_name'          => 'nullable|string|max:255',
            'site_logo'          => 'nullable|string|max:255',
            'footer_about_text'  => 'nullable|string',
            'footer_copyright'   => 'nullable|string|max:255',
            'footer_phone'       => 'nullable|string|max:50',
            'footer_email'       => 'nullable|email|max:255',
            'footer_address'     => 'nullable|string|max:500',
            'social_facebook'    => 'nullable|url|max:500',
            'social_instagram'   => 'nullable|url|max:500',
            'social_tiktok'      => 'nullable|url|max:500',
            'property_extra_fee' => 'nullable|numeric|min:0',
        ]);

        $setting = SiteSetting::first() ?? SiteSetting::create(SiteSetting::defaults());

        $setting->fill($request->only([
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
        ]));
        $setting->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Pengaturan website berhasil diperbarui!',
            'data'    => $setting->fresh()
        ], 200);
    }
}