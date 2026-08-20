<?php

namespace App\Services;

use App\Models\SuperAdminNotification;

class SuperAdminNotificationService
{
    public static function send($type, $title, $message, $actionUrl = null)
    {
        try {
            return SuperAdminNotification::create([
                'type'       => $type,
                'title'      => $title,
                'message'    => $message,
                'action_url' => $actionUrl,
                'is_read'    => false,
            ]);
        } catch (\Throwable $e) {
            report($e);
            return null;
        }
    }
}