import { useState } from 'react';
import useSuperAdminFetch from '../../hooks/useSuperAdminFetch';
import { formatRupiah } from '../../utils/format';

export default function RevenuePage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { data: revenueData, loading, error, reload } = useSuperAdminFetch(
    `/admin/superadmin/admin-revenue?year=${selectedYear}`
  );

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Data Pendapatan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#D7C4B0] p-10 text-center rounded-2xl shadow-sm">
        <p className="text-rose-600 font-bold text-sm mb-3">Gagal memuat data pendapatan admin.</p>
        <button
          onClick={reload}
          className="px-4 py-2 bg-[#B38E5D] text-white rounded-lg text-xs font-bold cursor-pointer"
        >
          🔄 Coba Lagi
        </button>
      </div>
    );
  }

  const admins = revenueData?.data?.admins || [];

  return (
    <div className="bg-white rounded-2xl border border-[#D7C4B0] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <h2 className="font-bold text-[#261C19]">Ringkasan Pendapatan Pemilik Kost ({selectedYear})</h2>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total Pendapatan Platform:</span>
            <span className="text-xl font-black text-[#B38E5D]">
              {formatRupiah(revenueData?.data?.summary?.total_platform_revenue)}
            </span>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-[#D7C4B0] p-2 rounded-lg bg-[#FAF5EF] text-xs font-bold"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {admins.length === 0 ? (
        <p className="text-center py-12 text-xs text-slate-400 font-bold">
          Belum ada data pendapatan pada tahun {selectedYear}.
        </p>
      ) : (
        <div className="space-y-4">
          {admins.map((admin) => (
            <div key={admin.admin_id} className="border border-[#D7C4B0] p-4 rounded-xl bg-[#FAF5EF]/30">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-bold text-[#261C19]">{admin.admin_name}</h3>
                  <p className="text-xs text-slate-500">{admin.admin_email}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-600 block">{admin.yearly_bookings} Booking</span>
                  <span className="font-extrabold text-[#261C19]">{formatRupiah(admin.yearly_total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
                {admin.monthly_revenue.map((m) => (
                  <div key={m.month} className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                    <span className="block text-slate-400 font-bold">{m.month_name}</span>
                    <span className="font-bold text-slate-700 block">{formatRupiah(m.revenue)}</span>
                    <span className="text-[10px] text-slate-400">{m.bookings} transaksi</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}