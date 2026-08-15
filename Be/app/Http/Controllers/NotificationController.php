<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // GET /api/admin/notifications -> Get list notifikasi
    public function index(Request $request)
    {
        $userId = $request->user()->id; // Ambil ID user dari auth token

        $notifications = Notification::where('user_id', $userId)
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => $item->type,
                    'title' => $item->title,
                    'message' => $item->message,
                    'target_url' => $item->target_url,
                    'is_read' => $item->is_read,
                    'created_at' => $item->created_at->diffForHumans(), // Contoh output: "5 menit lalu"
                ];
            });

        return response()->json([
            'status' => 'success',
            'data' => $notifications,
        ]);
    }

    // PATCH /api/admin/notifications/{id}/read -> Tandai 1 notif sudah dibaca
    public function markAsRead($id)
    {
        $notification = Notification::findOrFail($id);
        $notification->update(['is_read' => true]);

        return response()->json([
            'status' => 'success',
            'message' => 'Notifikasi berhasil dibaca',
        ]);
    }

    // PATCH /api/admin/notifications/mark-all-read -> Tandai semua dibaca
    public function markAllAsRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'status' => 'success',
            'message' => 'Semua notifikasi ditandai dibaca',
        ]);
    }
}