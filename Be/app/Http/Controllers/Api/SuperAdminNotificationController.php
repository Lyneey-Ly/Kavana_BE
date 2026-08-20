<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SuperAdminNotification;
use Illuminate\Http\Request;

class SuperAdminNotificationController extends Controller
{
    private function isSuperAdmin(Request $request): bool
    {
        $user = $request->user();
        return $user && in_array(strtolower($user->role ?? ''), ['superadmin', 'super_admin']);
    }

    private function denyAccess(): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'status'  => 'error',
            'message' => 'Akses ditolak! Fitur ini khusus untuk Superadmin.'
        ], 403);
    }

    /**
     * Daftar notifikasi (pagination + unread_count)
     */
    public function index(Request $request)
    {
        if (!$this->isSuperAdmin($request)) {
            return $this->denyAccess();
        }

        $query = SuperAdminNotification::latest();

        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }

        if ($request->boolean('unread_only')) {
            $query->where('is_read', false);
        }

        $perPage = min((int) $request->get('per_page', 20), 50);
        $items = $query->paginate($perPage);

        $items->getCollection()->transform(function ($n) {
            $n->time_ago = $n->created_at ? $n->created_at->diffForHumans() : null;
            return $n;
        });

        return response()->json([
            'status'      => 'success',
            'data'        => $items->items(),
            'pagination'  => [
                'current_page' => $items->currentPage(),
                'last_page'    => $items->lastPage(),
                'per_page'     => $items->perPage(),
                'total'        => $items->total(),
            ],
            'unread_count' => SuperAdminNotification::where('is_read', false)->count(),
        ], 200);
    }

    /**
     * Tandai satu notifikasi sebagai dibaca
     */
    public function markAsRead(Request $request, $id)
    {
        if (!$this->isSuperAdmin($request)) {
            return $this->denyAccess();
        }

        $notification = SuperAdminNotification::find($id);

        if (!$notification) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Notifikasi tidak ditemukan.'
            ], 404);
        }

        $notification->is_read = true;
        $notification->save();

        return response()->json([
            'status'  => 'success',
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'unread_count' => SuperAdminNotification::where('is_read', false)->count(),
        ], 200);
    }

    /**
     * Tandai semua notifikasi sebagai dibaca
     */
    public function markAllAsRead(Request $request)
    {
        if (!$this->isSuperAdmin($request)) {
            return $this->denyAccess();
        }

        SuperAdminNotification::where('is_read', false)->update(['is_read' => true]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Semua notifikasi ditandai sudah dibaca.',
            'unread_count' => 0,
        ], 200);
    }

    /**
     * Hapus notifikasi
     */
    public function destroy(Request $request, $id)
    {
        if (!$this->isSuperAdmin($request)) {
            return $this->denyAccess();
        }

        $notification = SuperAdminNotification::find($id);

        if (!$notification) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Notifikasi tidak ditemukan.'
            ], 404);
        }

        $notification->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Notifikasi berhasil dihapus.',
            'unread_count' => SuperAdminNotification::where('is_read', false)->count(),
        ], 200);
    }
}