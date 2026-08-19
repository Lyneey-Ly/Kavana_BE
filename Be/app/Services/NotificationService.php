<?php

namespace App\Services;

use App\Models\Notification;

class NotificationService
{
    /**
     * Simpan notifikasi ke database untuk user/admin tertentu.
     *
     * @param int         $userId   ID user atau admin penerima (kolom user_id)
     * @param string      $title
     * @param string      $message
     * @param string|null $targetUrl URL frontend yang dituju saat notif diklik
     * @param string      $type     kategori notifikasi (info, booking, komplain, kontrak, dll)
     */
    public static function send(
        int $userId,
        string $title,
        string $message,
        ?string $targetUrl = null,
        string $type = 'info'
    ): Notification {
        return Notification::create([
            'user_id'    => $userId,
            'type'       => $type,
            'title'      => $title,
            'message'    => $message,
            'target_url' => $targetUrl,
            'is_read'    => false,
        ]);
    }
}
