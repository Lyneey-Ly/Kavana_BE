<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/notifications -> Get list notifikasi milik user/admin yang login
    public function index(Request $request)
    {
        $userId = $request->user()->id; // Ambil ID user dari auth token

        $notifications = Notification::where('user_id', $userId)
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($item) {
                return [
                    'id'         => $item->id,
                    'type'       => $item->type,
                    'title'      => $item->title,
                    'message'    => $item->message,
                    'target_url' => $item->target_url,
                    'is_read'    => $item->is_read,
                    'created_at' => $item->created_at->diffForHumans(), // Contoh output: "5 menit lalu"
                ];
            });

        return response()->json([
            'status' => 'success',
            'data'   => $notifications,
        ]);
    }

    // PATCH /api/notifications/{id}/read -> Tandai 1 notif sudah dibaca
    public function markAsRead(Request $request, $id)
    {
        // Pastikan notif hanya bisa ditandai oleh pemiliknya (User/Admin login)
        $notification = Notification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Notifikasi berhasil dibaca',
        ]);
    }

    // PATCH /api/notifications/mark-all-read -> Tandai semua dibaca
    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Semua notifikasi ditandai dibaca',
        ]);
    }
}
