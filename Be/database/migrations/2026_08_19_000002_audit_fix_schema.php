<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Perbaikan skema hasil audit:
     * 1. users.role            -> kolom role untuk deteksi admin/superadmin/customer
     * 2. pembayarans.status & verified_at -> pembayaran perlu status & waktu verifikasi
     * 3. administrators.role   -> tambah nilai 'superadmin' pada enum
     * 4. propertis lat/long    -> dukung peta (InteractiveMap / carihunian)
     */
    public function up(): void
    {
        // 1. KOLOM role di tabel users
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('role')->default('customer')->index()->after('foto');
            });
        }

        // 2. KOLOM status & verified_at di tabel pembayarans
        if (Schema::hasTable('pembayarans')) {
            if (!Schema::hasColumn('pembayarans', 'status')) {
                Schema::table('pembayarans', function (Blueprint $table) {
                    $table->string('status')->default('Pending')->after('payment_proof');
                });
            }
            if (!Schema::hasColumn('pembayarans', 'verified_at')) {
                Schema::table('pembayarans', function (Blueprint $table) {
                    $table->timestamp('verified_at')->nullable()->after('status');
                });
            }
        }

        // 3. ENUM role administrators: tambah 'superadmin'
        $col = DB::select("SHOW COLUMNS FROM administrators LIKE 'role'");
        if (!empty($col)) {
            $type = $col[0]->Type;
            if (strpos($type, 'superadmin') === false) {
                DB::statement("ALTER TABLE administrators MODIFY role ENUM('pemilik','admin','superadmin') NOT NULL DEFAULT 'admin'");
            }
        }

        // 4. KOLOM latitude & longitude di tabel propertis
        if (Schema::hasTable('propertis') && !Schema::hasColumn('propertis', 'latitude')) {
            Schema::table('propertis', function (Blueprint $table) {
                $table->double('latitude', 10, 8)->nullable()->after('address');
                $table->double('longitude', 11, 8)->nullable()->after('latitude');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role');
            });
        }

        if (Schema::hasColumn('pembayarans', 'verified_at')) {
            Schema::table('pembayarans', function (Blueprint $table) {
                $table->dropColumn('verified_at');
            });
        }
        if (Schema::hasColumn('pembayarans', 'status')) {
            Schema::table('pembayarans', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }

        if (Schema::hasColumn('propertis', 'longitude')) {
            Schema::table('propertis', function (Blueprint $table) {
                $table->dropColumn(['latitude', 'longitude']);
            });
        }
    }
};
