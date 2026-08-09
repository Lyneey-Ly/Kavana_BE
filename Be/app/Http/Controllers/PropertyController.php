<?php

namespace App\Http\Controllers;

use App\Models\Properti; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\Storage;

class PropertyController extends Controller
{
    /**
     * Tampilkan data properti dengan filter pencarian dinamis & relasi pemilik
     */
    public function index(Request $request)
    {
        $query = Properti::with('pemilik'); 

        // 🟢 1. FILTER MILIK ADMIN (Penanganan Multi-User & Super Admin)
        $user = Auth::guard('sanctum')->user();

        // Jika dipanggil dari Dashboard Admin (?my_properties=true)
        if ($request->boolean('my_properties')) {
            if ($user) {
                $role = strtolower($user->role ?? '');
                // Jika Admin biasa (seperti JohnDoe), HANYA ambil properti miliknya sendiri
                if (!in_array($role, ['superadmin', 'super_admin'])) {
                    $query->where('pemilik_id', $user->id);
                }
                // Jika Superadmin, biarkan ambil SEMUA properti
            }
        } 
        // Atau jika dikirim filter ID pemilik secara langsung
        elseif ($request->filled('pemilik_id')) {
            $query->where('pemilik_id', $request->pemilik_id);
        }

        // 🔍 Filter Pencarian Umum (Public / Catalog)
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('address', 'LIKE', '%' . $search . '%')
                  ->orWhere('title', 'LIKE', '%' . $search . '%');
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('gender_type')) {
            $query->where('gender_type', $request->gender_type);
        }

        if ($request->filled('min_price')) {
            $query->where('price_per_month', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price_per_month', '<=', $request->max_price);
        }

        $properties = $query->latest()->get();

        return response()->json([
            'message' => 'Success fetch and filter properties',
            'count'   => $properties->count(),
            'data'    => $properties
        ], 200);
    }

    /**
     * Simpan data properti baru beserta foto utama & galeri
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'            => 'required|string|max:255',
            'type'             => 'required|string',
            'gender_type'      => 'required|string',
            'price_per_month'  => 'required|numeric',
            'address'          => 'required|string',
            'facilities'       => 'nullable|string',
            'status'           => 'nullable|string',
            'main_image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'gallery_images'   => 'nullable|array',
            'gallery_images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $user = Auth::guard('sanctum')->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated. Silakan login terlebih dahulu!'
            ], 401);
        }

        // 1. Handle Main Image
        $imagePath = null;
        if ($request->hasFile('main_image')) {
            $imagePath = $request->file('main_image')->store('properti', 'public');
        }

        // 2. Handle Gallery Images
        $galleryPaths = [];
        if ($request->hasFile('gallery_images')) {
            foreach ($request->file('gallery_images') as $file) {
                $galleryPaths[] = $file->store('properti/galeri', 'public');
            }
        }

        $property = Properti::create([
            'pemilik_id'      => $user->id, // 👈 Tersimpan otomatis ID user yang sedang login
            'title'           => $request->title,
            'type'            => $request->type,
            'gender_type'     => $request->gender_type,
            'price_per_month' => $request->price_per_month,
            'address'         => $request->address,
            'facilities'      => $request->facilities ?? 'Kamar Mandi Dalam',
            'status'          => $request->status ?? 'Tersedia',
            'main_image'      => $imagePath,
            'gallery_images'  => $galleryPaths,
        ]);

        $property->load('pemilik');

        return response()->json([
            'message' => 'Property created successfully!',
            'data'    => $property
        ], 201);
    }

    /**
     * Tampilkan detail properti berdasarkan ID
     */
    public function show($id)
    {
        $property = Properti::with(['pemilik', 'kamars'])->find($id);

        if (!$property) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        return response()->json([
            'message' => 'Success fetch property detail',
            'data'    => $property
        ], 200);
    }

    /**
     * Update data properti, foto utama & galeri
     */
    public function update(Request $request, $id)
    {
        $property = Properti::find($id);

        if (!$property) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        // 🟢 Cek Hak Akses (Super Admin bebas edit, Admin biasa cuma punya sendiri)
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            $role = strtolower($user->role ?? '');
            $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);
            if ($property->pemilik_id !== $user->id && !$isSuperAdmin) {
                return response()->json([
                    'message' => 'Forbidden. Anda tidak memiliki akses untuk mengubah properti ini.'
                ], 403);
            }
        }

        $request->validate([
            'title'            => 'sometimes|required|string|max:255',
            'type'             => 'sometimes|required|string',
            'gender_type'      => 'sometimes|required|string',
            'price_per_month'  => 'sometimes|required|numeric',
            'address'          => 'sometimes|required|string',
            'facilities'       => 'sometimes|nullable|string',
            'status'           => 'sometimes|required|string',
            'main_image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            'gallery_images'   => 'nullable|array',
            'gallery_images.*' => 'image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        $data = $request->except(['main_image', 'gallery_images']);

        if ($request->hasFile('main_image')) {
            if ($property->main_image && Storage::disk('public')->exists($property->main_image)) {
                Storage::disk('public')->delete($property->main_image);
            }
            $data['main_image'] = $request->file('main_image')->store('properti', 'public');
        }

        if ($request->hasFile('gallery_images')) {
            if ($property->gallery_images && is_array($property->gallery_images)) {
                foreach ($property->gallery_images as $oldPath) {
                    if (Storage::disk('public')->exists($oldPath)) {
                        Storage::disk('public')->delete($oldPath);
                    }
                }
            }

            $newGalleryPaths = [];
            foreach ($request->file('gallery_images') as $file) {
                $newGalleryPaths[] = $file->store('properti/galeri', 'public');
            }
            $data['gallery_images'] = $newGalleryPaths;
        }

        $property->update($data);

        return response()->json([
            'message' => 'Property updated successfully!',
            'data'    => $property->fresh('pemilik')
        ], 200);
    }

    /**
     * Hapus data properti beserta semua file foto (utama & galeri)
     */
    public function destroy($id)
    {
        $property = Properti::find($id);

        if (!$property) {
            return response()->json(['message' => 'Property not found'], 404);
        }

        // 🟢 Cek Hak Akses (Super Admin bebas hapus, Admin biasa cuma punya sendiri)
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            $role = strtolower($user->role ?? '');
            $isSuperAdmin = in_array($role, ['superadmin', 'super_admin']);
            if ($property->pemilik_id !== $user->id && !$isSuperAdmin) {
                return response()->json([
                    'message' => 'Forbidden. Anda tidak memiliki akses untuk menghapus properti ini.'
                ], 403);
            }
        }

        if ($property->main_image && Storage::disk('public')->exists($property->main_image)) {
            Storage::disk('public')->delete($property->main_image);
        }

        if ($property->gallery_images && is_array($property->gallery_images)) {
            foreach ($property->gallery_images as $path) {
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        $property->delete();

        return response()->json(['message' => 'Property deleted successfully!'], 200);
    }
}