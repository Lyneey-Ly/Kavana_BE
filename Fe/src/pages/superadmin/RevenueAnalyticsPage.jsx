import { useState } from 'react';
import useSuperAdminFetch from '../../hooks/useSuperAdminFetch';
import { formatRupiah } from '../../utils/format';

export default function RevenueAnalyticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());

  const { data, loading, error, reload } = useSuperAdminFetch(
    `/admin/superadmin/revenue-analytics?year=${year}`,
    { deps: [year] }
  );

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Menghitung Pendapatan Platform...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#D7C4B0] p-10 text-center rounded-2xl shadow-sm">
        <p className="text-rose-600 font-bold text-sm mb-3">Gagal memuat analitik pendapatan.</p>
        <button onClick={reload} className="px-4 py-2 bg-[#B38E5D] text-white rounded-lg text-xs font-bold cursor-pointer">
          🔄 Coba Lagi
        </button>
      </div>
    );
  }

  const d = data?.data || {};
  const breakdown = d.income_breakdown || {};

  const incomeSources = [
    { label: 'Slot Properti (Listing Fee)', value: breakdown.total_slot_revenue, icon: '🏠', note: `${d.slot_info?.paid_slots || 0} properti aktif · ${formatRupiah(d.slot_info?.slot_fee)}/slot` },
    { label: 'Iklan Vendor (Banner)', value: breakdown.total_vendor_ad_revenue, icon: '📢', note: `${d.ad_info?.active_ads || 0} iklan aktif` },
    { label: 'Komisi Booking', value: breakdown.total_commission_revenue, icon: '🤝', note: `${d.commission_info?.commission_percent || 0}% × ${d.commission_info?.confirmed_bookings || 0} booking` },
    { label: 'Pemasukan Manual (Tracker)', value: breakdown.total_manual_income, icon: '📥', note: 'Dari Finance Tracker' },
  ];

  return (
    <div className="space-y-6">
      {/* HEADER + FILTER TAHUN */}
      <div className="bg-white rounded-2xl border border-[#D7C4B0] p-6 shadow-sm">
        <div className="flex justify-between items-center gap-4 flex-wrap">
          <div>
            <h2 className="font-bold text-[#261C19]">Analitik Pendapatan Platform (Triple Monetization)</h2>
            <p className="text-xs text-slate-500 mt-1">
              Total pendapatan platform dari slot properti, iklan vendor, dan komisi booking ({year}).
            </p>
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-[#D7C4B0] p-2 rounded-lg bg-[#FAF5EF] text-xs font-bold text-[#261C19]"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TOP: GROSS, EXPENSES, NET */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pendapatan Kotor</p>
          <h3 className="text-2xl font-black text-[#261C19]">{formatRupiah(d.total_gross_income)}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pengeluaran</p>
          <h3 className="text-2xl font-black text-rose-500">{formatRupiah(d.total_expenses)}</h3>
        </div>
        <div className="bg-[#261C19] text-white p-5 rounded-2xl border border-[#3D2D29] shadow-lg">
          <p className="text-xs font-bold text-[#D7C4B0] uppercase tracking-wider mb-1">Laba Bersih Platform</p>
          <h3 className="text-2xl font-black text-[#FAF5EF]">{formatRupiah(d.net_profit)}</h3>
        </div>
      </div>

      {/* BREAKDOWN SUMBER PENDAPATAN */}
      <div className="bg-white rounded-2xl border border-[#D7C4B0] p-6 shadow-sm">
        <h2 className="font-bold text-[#261C19] mb-5">Rincian Sumber Pendapatan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {incomeSources.map((source) => (
            <div key={source.label} className="border border-[#D7C4B0] p-5 rounded-xl bg-[#FAF5EF]/40">
              <div className="w-11 h-11 bg-[#B38E5D]/10 text-[#B38E5D] rounded-xl flex items-center justify-center text-xl mb-3">
                {source.icon}
              </div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{source.label}</p>
              <p className="text-xl font-black text-[#261C19] mt-1">{formatRupiah(source.value)}</p>
              <p className="text-[10px] text-slate-400 mt-1">{source.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* INFO KOMISI */}
      <div className="bg-white rounded-2xl border border-[#D7C4B0] p-6 shadow-sm">
        <h2 className="font-bold text-[#261C19] mb-4">Detail Komisi &amp; Konfigurasi</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="border border-slate-200 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Persentase Komisi</p>
            <p className="font-black text-[#B38E5D] text-lg mt-1">{d.commission_info?.commission_percent || 0}%</p>
          </div>
          <div className="border border-slate-200 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Nilai Booking Terkonfirmasi</p>
            <p className="font-black text-[#261C19] text-lg mt-1">{formatRupiah(d.commission_info?.total_booking_value)}</p>
          </div>
          <div className="border border-slate-200 p-4 rounded-xl">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biaya Slot Properti Aktif</p>
            <p className="font-black text-[#261C19] text-lg mt-1">{formatRupiah(d.slot_info?.slot_fee)}</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-4">
          💡 Ubah persentase komisi dan biaya slot melalui menu <b>Pengaturan Website</b>. Nilai di atas dihitung otomatis dari data transaksi nyata.
        </p>
      </div>
    </div>
  );
}