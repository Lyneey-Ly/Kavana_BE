import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import SidebarSuperAdmin from '../components/SidebarSuperAdmin';
import SiteSettingsForm from '../components/SiteSettingsForm';
import useSuperAdminFetch from '../hooks/useSuperAdminFetch';
import OverviewTab from '../components/superadmin/OverviewTab';
import ApprovalTab from '../components/superadmin/ApprovalTab';
import AdministratorsTab from '../components/superadmin/AdministratorsTab';
import UsersTab from '../components/superadmin/UsersTab';
import RevenueTab from '../components/superadmin/RevenueTab';
import TransactionsTab from '../components/superadmin/TransactionsTab';
import AddAdminModal from '../components/superadmin/AddAdminModal';

const TAB_TITLES = {
  overview: 'Dashboard Analitik Platform',
  approval: 'Persetujuan & Monetisasi Properti',
  administrators: 'Kelola Pengelola & Pemilik Kost',
  users: 'Monitoring Pengguna Platform',
  revenue: 'Laporan Pendapatan Pemilik Kost',
  transactions: 'Semua Riwayat Transaksi',
  settings: 'Pengaturan Website',
};

export default function SuperAdminDashboard() {
  const location = useLocation();

  // Membaca tab aktif dari URL Query Parameter
  const searchParams = new URLSearchParams(location.search);
  const activeTab = searchParams.get('tab') || 'overview';

  // Modal state (hanya kontrol open/close; isi form diisolasi di AddAdminModal)
  const [showModal, setShowModal] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // HANYA data header yang dimuat di sini (2 API).
  // API milik masing-masing tab dipanggil oleh komponen tab saat tab dibuka (lazy).
  const { data: statsData, loading: statsLoading, reload: reloadStats } = useSuperAdminFetch(
    '/admin/superadmin/stats',
    { transform: (d) => d?.data || {} }
  );
  const { data: platformData, loading: platformLoading } = useSuperAdminFetch(
    `/admin/superadmin/platform-stats?year=${new Date().getFullYear()}`
  );

  const stats = statsData || {};
  const loading = statsLoading || platformLoading;

  const handleModalSuccess = () => {
    reloadStats();
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="flex min-h-screen bg-[#FAF5EF]">
      {/* SIDEBAR */}
      <SidebarSuperAdmin />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 lg:p-8 text-[#261C19] font-sans overflow-y-auto">
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
              Kelola sistem terpusat, monetisasi slot properti, dan pantau aktivitas platform secara realtime.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-[#B38E5D] hover:bg-[#8F6E45] text-white px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md hover:scale-105 cursor-pointer flex items-center justify-center gap-2 self-start md:self-auto"
          >
            <span>➕</span> Tambah Pengelola Baru
          </button>
        </header>

        {/* OVERVIEW STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pencari Kost</p>
              <h3 className="text-2xl font-black text-[#261C19]">{loading ? '...' : stats.total_users}</h3>
            </div>
            <div className="w-10 h-10 bg-[#FAF5EF] rounded-xl flex items-center justify-center text-xl border border-[#D7C4B0]/50">👥</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pemilik Kost</p>
              <h3 className="text-2xl font-black text-[#261C19]">{loading ? '...' : stats.total_pemilik}</h3>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl border border-emerald-200">🏢</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Okupansi Kamar</p>
              <h3 className="text-2xl font-black text-[#261C19]">
                {loading ? '...' : `${platformData?.property_stats?.occupancy_rate || 0}%`}
              </h3>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-200">🛏️</div>
          </div>

          <div className="bg-[#261C19] text-white p-5 rounded-2xl border border-[#3D2D29] shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#D7C4B0] uppercase tracking-wider mb-1">Superadmin</p>
              <h3 className="text-2xl font-black text-[#FAF5EF]">{loading ? '...' : stats.total_superadmin}</h3>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl border border-white/20">🛡️</div>
          </div>
        </div>

        {/* --- RENDER TAB AKTIF (Lazy: API dipanggil saat tab dibuka) --- */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'approval' && <ApprovalTab />}
        {activeTab === 'administrators' && (
          <AdministratorsTab onStatsChanged={reloadStats} refreshSignal={refreshTick} />
        )}
        {activeTab === 'users' && <UsersTab onStatsChanged={reloadStats} />}
        {activeTab === 'revenue' && <RevenueTab />}
        {activeTab === 'transactions' && <TransactionsTab />}
        {activeTab === 'settings' && <SiteSettingsForm />}
      </main>

      {/* MODAL TAMBAH PENGELOLA (state form diisolasi; remount via key setiap dibuka) */}
      <AddAdminModal
        key={showModal ? 'modal-open' : 'modal-closed'}
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}