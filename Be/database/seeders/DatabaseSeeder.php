<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Administrator;
use App\Models\Properti;
use App\Models\Pemesanan;
use App\Models\Pembayaran;
use App\Models\DokumenSewa;
use App\Models\RiwayatStatusPemesanan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin & Owner
        $pemilik = Administrator::create([
            'name' => 'Pak Ahmad (Owner)',
            'email' => 'ahmad@kavana.com',
            'phone' => '081234567890',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            
        ]);

        $admin = Administrator::create([
            'name' => 'Siti Admin',
            'email' => 'siti@kavana.com',
            'phone' => '081234567891',
            'password' => Hash::make('password123'),
            'role' => 'admin',
        ]);

        // 2. Customer
        $customer = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@gmail.com',
            'phone' => '085712345678',
            'password' => Hash::make('password123'),
            'foto'=>''
        ]);

        // 3. Property
       // Di dalam DatabaseSeeder.php bagian Property
        $kosA = Properti::create([
            'pemilik_id' => $pemilik->id,
            'title' => 'Kost Kavana Vista - Kamar 101 (AC)',
            'type' => 'Kost',
            'gender_type' => 'male', // Contoh: Kost khusus Putra
            'price_per_month' => 1500000.00,
            'address' => 'Jl. Sukabumi No. 12, Kota Sukabumi',
            'facilities' => 'AC, Kasur, Lemari, Kamar Mandi Dalam',
            'status' => 'Tersedia',
            'main_image' => 'properti/kos-101.jpg',
        ]);
        // 4. Booking
        $pemesanan = Pemesanan::create([
            'customer_id' => $customer->id,
            'properti_id' => $kosA->id,
            'check_in_date' => now()->addDays(3)->format('Y-m-d'),
            'duration_months' => 3,
            'total_price' => 4500000.00,
            'status' => 'Diverifikasi',
        ]);

        // 5. Payment
        Pembayaran::create([
            'pemesanan_id' => $pemesanan->id,
            'amount' => 4500000.00,
            'payment_method' => 'Transfer Bank BCA',
            'payment_proof' => 'bukti_tf/bukti-budi.jpg',
        ]);

        // 6. Lease Document
        DokumenSewa::create([
            'pemesanan_id' => $pemesanan->id,
            'start_date' => now()->addDays(3)->format('Y-m-d'),
            'end_date' => now()->addDays(3)->addMonths(3)->format('Y-m-d'),
            'lease_agreement' => 'Wajib menjaga ketertiban kost.',
            'customer_signature' => 'ttd/ttd-budi.png',
            'admin_signature' => null,
        ]);

        // 7. Status Log History
        RiwayatStatusPemesanan::create([
            'pemesanan_id' => $pemesanan->id,
            'new_status' => 'Diverifikasi',
            'admin_id' => $admin->id,
        ]);
    }
}