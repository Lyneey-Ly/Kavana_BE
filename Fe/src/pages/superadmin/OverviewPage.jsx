import { useState } from 'react';
import useSuperAdminFetch from '../../hooks/useSuperAdminFetch';
import { formatRupiah } from '../../utils/format';

export default function OverviewPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: statsData, loading: statsLoading, error: statsError, reload: reloadStats } = useSuperAdminFetch(
    '/admin/superadmin/stats',
    { transform: (d) => d?.data || {} }
  );
  const { data: platformStats, loading: platformLoading, error: platformError, reload: reloadPlatform } =
    useSuperAdminFetch(`/admin/superadmin/platform-stats?year=${selectedYear}`);

  const stats = statsData || {};
  const loading = statsLoading || platformLoading;
  const error = statsError || platformError;

  const handleRetry = () => {
    reloadStats();
    reloadPlatform();
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Performa Platform...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#D7C4B0] p-10 text-center rounded-2xl shadow-sm">
        <p className="text-rose-600 font-bold text-sm mb-3">Gagal memuat data performa platform.</p>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-[#B38E5D] text-white rounded-lg text-xs font-bold cursor-pointer"
        >
          🔄 Coba Lagi
        </button>
      </div>
    );
  }

  const topAdmins = platformStats?.top_admins || [];
  const topProperties = platformStats?.top_properties || [];

  return (
    <div className="space-y-6">
      {/* STATS CARDS (HANYA DITAMPILKAN DI HALAMAN OVERVIEW) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pencari Kost</p>
            <h3 className="text-2xl font-black text-[#261C19]">{stats.total_users ?? '...'}</h3>
          </div>
          <div className="w-10 h-10 bg-[#FAF5EF] rounded-xl flex items-center justify-center text-xl border border-[#D7C4B0]/50">👥</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pemilik Kost</p>
            <h3 className="text-2xl font-black text-[#261C19]">{stats.total_pemilik ?? '...'}</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl border border-emerald-200">🏢</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Okupansi Kamar</p>
            <h3 className="text-2xl font-black text-[#261C19]">
              {`${platformStats?.property_stats?.occupancy_rate || 0}%`}
            </h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-200">🛏️</div>
        </div>

        <div className="bg-[#261C19] text-white p-5 rounded-2xl border border-[#3D2D29] shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#D7C4B0] uppercase tracking-wider mb-1">Superadmin</p>
            <h3 className="text-2xl font-black text-[#FAF5EF]">{stats.total_superadmin ?? '...'}</h3>
          </div>
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl border border-white/20">🛡️</div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#D7C4B0]">
        <h2 className="font-bold text-[#261C19]">Performa Platform</h2>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span>Tahun:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-[#D7C4B0] p-1.5 rounded-lg bg-[#FAF5EF]"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top 5 Admins */}
        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0]">
          <h3 className="font-bold text-sm mb-4">🏆 Top 5 Pemilik Kost (Omzet)</h3>
          {topAdmins.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada data omzet.</p>
          ) : (
            <div className="space-y-3">
              {topAdmins.map((item, idx) => (
                <div key={item.admin_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="font-bold mr-2 text-[#B38E5D]">#{idx + 1}</span>
                    <span className="font-bold">{item.admin_name}</span>
                    <p className="text-slate-400 text-[10px]">{item.bookings} Booking</p>
                  </div>
                  <span className="font-black text-[#261C19]">{formatRupiah(item.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Properties */}
        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0]">
          <h3 className="font-bold text-sm mb-4">⭐ Top 5 Properti Kost Terlaris</h3>
          {topProperties.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada data properti.</p>
          ) : (
            <div className="space-y-3">
              {topProperties.map((item, idx) => {
                const ownerName = item.pemilik_name || item.owner_name || item.admin_name || item.pemilik?.name || 'Pemilik Kost';
                return (
                  <div key={item.property_id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <span className="font-bold mr-2 text-[#B38E5D]">#{idx + 1}</span>
                      <span className="font-bold text-[#261C19]">{item.property_name}</span>
                      <p className="text-[#5C4A42] text-[11px] font-medium flex items-center gap-1 mt-0.5">
                        <span>👤 Pemilik:</span>
                        <span className="font-bold text-[#B38E5D]">{ownerName}</span>
                      </p>
                      <p className="text-slate-400 text-[10px] mt-0.5">{item.bookings} Pemesanan</p>
                    </div>
                    <span className="font-black text-[#261C19]">{formatRupiah(item.revenue)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}