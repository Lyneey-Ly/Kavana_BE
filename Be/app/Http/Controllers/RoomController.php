<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\kamar; // Menggunakan model 'kamar'

class RoomController extends Controller
{
    // 1. Ambil daftar kamar berdasarkan Properti ID
    public function index($propertiId)
    {
        $rooms = kamar::where('properti_id', $propertiId)->get();
        return response()->json($rooms);
    }

  

    public function store(Request $request, $propertiId)
{
    $request->validate([
        'nomor_kamar' => 'required|string',
    ]);

    $room = kamar::create([
        'properti_id' => $propertiId,
        'nomor_kamar' => $request->nomor_kamar,
        'status'      => $request->status ?? 'kosong', // Pakai 'kosong'
    ]);

    return response()->json([
        'message' => 'Unit kamar berhasil ditambahkan',
        'data'    => $room
    ], 201);
}

public function update(Request $request, $id)
{
    $room = kamar::findOrFail($id);
    
    // Jika dari React dikirim 'Tersedia', ubah ke 'kosong', dst.
    $status = $request->status;
    if ($status === 'Tersedia') $status = 'kosong';
    if ($status === 'Terisi') $status = 'terisi';

    $room->update([
        'nomor_kamar' => $request->nomor_kamar ?? $room->nomor_kamar,
        'status'      => $status ?? $room->status,
    ]);

    return response()->json([
        'message' => 'Status kamar berhasil diperbarui',
        'data'    => $room
    ]);
}
    


    // 4. Hapus unit kamar
    public function destroy($id)
    {
        // DIPERBAIKI: Menggunakan kamar::findOrFail (sebelumnya Room::findOrFail)
        $room = kamar::findOrFail($id);
        $room->delete();

        return response()->json(['message' => 'Unit kamar berhasil dihapus']);
    }
}