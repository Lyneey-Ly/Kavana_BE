import { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import SidebarSuperAdmin from '../components/SidebarSuperAdmin';
import AddAdminModal from '../components/superadmin/AddAdminModal';
import { SuperAdminLayoutContext } from '../contexts/SuperAdminContext';

const TAB_TITLES = {
  overview: 'Dashboard Analitik Platform',
  approval: 'Persetujuan & Monetisasi Properti',
  administrators: 'Kelola Pengelola & Pemilik Kost',
  users: 'Monitoring Pengguna Platform',
  revenue: 'Laporan Pendapatan Pemilik Kost',
  transactions: 'Semua Riwayat Transaksi',
  'revenue-analytics': 'Analitik Pendapatan Platform',
  'bank-accounts': 'Rekening Bank Resmi',
  'finance-tracker': 'Finance Tracker Superadmin',
  settings: 'Pengaturan Website',
};

const SUBTITLES = {
  overview: 'Ringkasan performa platform, pemilik kost terbaik, dan properti terlaris.',
  approval: 'Setujui atau tolak properti kost beserta status slot berbayarnya.',
  administrators: 'Kelola akun administrator, pemilik kost, dan superadmin.',
  users: 'Pantau dan kelola seluruh akun pengguna website.',
  revenue: 'Laporan pendapatan per pemilik kost.',
  transactions: 'Seluruh riwayat transaksi booking di platform.',
  'revenue-analytics': 'Total pendapatan platform dari slot, iklan, dan komisi booking.',
  'bank-accounts': 'Rekening bank resmi tujuan pembayaran slot properti & iklan vendor.',
  'finance-tracker': 'Catat arus kas pemasukan dan pengeluaran operasional.',
  settings: 'Atur nama, logo, kontak, biaya slot, dan komisi platform.',
};

export default function SuperAdminLayout() {
  const location = useLocation();

  // Tab aktif ditentukan dari pathname: /superadmin/{key}
  const match = location.pathname.match(/^\/superadmin\/([^/]+)/);
  const activeTab = match ? match[1] : 'overview';

  // Modal state (hanya kontrol open/close; isi form diisolasi di AddAdminModal)
  const [showModal, setShowModal] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const handleModalSuccess = () => {
    setRefreshTick((t) => t + 1);
  };

  return (
    <SidebarSuperAdmin>
      <div className="p-6 lg:p-8 text-[#261C19] font-sans overflow-y-auto">
        {/* HEADER SECTION */}
        <header className="mb-8 bg-white p-6 rounded-2xl border border-[#D7C4B0] shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#B38E5D] uppercase tracking-widest block mb-1">
              Superadmin Control Center
            </span>
            <h1 className="text-2xl lg:text-3xl font-bold font-serif tracking-tight text-[#261C19]">
              {TAB_TITLES[activeTab] || 'Dashboard Analitik Platform'}
            </h1>
            <p className="text-[#5C4A42] text-xs lg:text-sm mt-1">
              {SUBTITLES[activeTab] ||
                'Kelola sistem terpusat, monetisasi slot properti, dan pantau aktivitas platform secara realtime.'}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-[#B38E5D] hover:bg-[#8F6E45] text-white px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md hover:scale-105 cursor-pointer flex items-center justify-center gap-2 self-start md:self-auto"
          >
            <span>➕</span> Tambah Pengelola Baru
          </button>
        </header>

        {/* KONTEN HALAMAN AKTIF (Outlet) */}
        <SuperAdminLayoutContext.Provider value={{ refreshTick }}>
          <Outlet />
        </SuperAdminLayoutContext.Provider>
      </div>

      {/* MODAL TAMBAH PENGELOLA (state form diisolasi; remount via key setiap dibuka) */}
      <AddAdminModal
        key={showModal ? 'modal-open' : 'modal-closed'}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
      />
    </SidebarSuperAdmin>
  );
}