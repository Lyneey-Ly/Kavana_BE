import { useState } from 'react';
import useSuperAdminFetch from '../../hooks/useSuperAdminFetch';
import { formatRupiah } from '../../utils/format';

const DEFAULT_FILTERS = {
  search: '',
  status: 'semua',
  year: new Date().getFullYear(),
  month: '',
  admin_id: '',
  page: 1,
};

export default function TransactionsTab() {
  const [txFilters, setTxFilters] = useState(DEFAULT_FILTERS);

  const { data: adminList = [] } = useSuperAdminFetch(
    '/admin/superadmin/admin-list',
    {
      transform: (d) => {
        const raw = d?.data || [];
        return Array.isArray(raw) ? raw : [];
      }
    }
  );

  const params = new URLSearchParams({
    page: txFilters.page,
    year: txFilters.year,
    ...(txFilters.status !== 'semua' && { status: txFilters.status }),
    ...(txFilters.month && { month: txFilters.month }),
    ...(txFilters.admin_id && { admin_id: txFilters.admin_id }),
    ...(txFilters.search && { search: txFilters.search }),
  });

  const { data: txData, loading, error, reload } = useSuperAdminFetch(
    `/admin/superadmin/transactions?${params.toString()}`,
    {
      transform: (d) => ({
        transactions: d?.data?.transactions || [],
        pagination: d?.data?.pagination || {},
      })
    }
  );

  const transactions = txData?.transactions || [];
  const pagination = txData?.pagination || {};

  const updateFilter = (patch) => {
    setTxFilters((prev) => ({ ...prev, ...patch, page: 1 }));
  };

  return (
    <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-[#FAF5EF]/50 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Cari Customer / Properti..."
          value={txFilters.search}
          onChange={(e) => updateFilter({ search: e.target.value })}
          className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white"
        />

        <select
          value={txFilters.status}
          onChange={(e) => updateFilter({ status: e.target.value })}
          className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white"
        >
          <option value="semua">Semua Status</option>
          <option value="Menunggu Konfirmasi">Menunggu Konfirmasi</option>
          <option value="Dikonfirmasi">Dikonfirmasi</option>
          <option value="Dibatalkan">Dibatalkan</option>
        </select>

        <select
          value={txFilters.admin_id}
          onChange={(e) => updateFilter({ admin_id: e.target.value })}
          className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white"
        >
          <option value="">Semua Pemilik Kost</option>
          {adminList.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>

        <select
          value={txFilters.month}
          onChange={(e) => updateFilter({ month: e.target.value })}
          className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white"
        >
          <option value="">Semua Bulan</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Bulan {i + 1}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Transaksi...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center">
          <p className="text-rose-600 font-bold text-sm mb-3">Gagal memuat riwayat transaksi.</p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-[#B38E5D] text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            🔄 Coba Lagi
          </button>
        </div>
      ) : transactions.length === 0 ? (
        <p className="text-center py-12 text-xs text-slate-400 font-bold">
          Tidak ada transaksi yang cocok dengan filter saat ini.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px]">
              <tr>
                <th className="px-6 py-3.5">ID / Tanggal</th>
                <th className="px-6 py-3.5">Penyewa</th>
                <th className="px-6 py-3.5">Properti & Kamar</th>
                <th className="px-6 py-3.5">Pemilik Kost</th>
                <th className="px-6 py-3.5">Total Harga</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition text-xs">
                  <td className="px-6 py-4">
                    <div className="font-bold">#{tx.id}</div>
                    <div className="text-slate-400">{tx.booking_date}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold">{tx.customer?.name || '-'}</div>
                    <div className="text-slate-400">{tx.customer?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#261C19]">{tx.properti?.title || '-'}</div>
                    <div className="text-slate-400">Kamar: {tx.kamar?.nomor_kamar || '-'}</div>
                  </td>
                  <td className="px-6 py-4 font-bold">{tx.properti?.pemilik?.name || '-'}</td>
                  <td className="px-6 py-4 font-black text-[#261C19]">{formatRupiah(tx.total_price)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      tx.status === 'Dikonfirmasi' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 flex justify-between items-center text-xs">
        <span>Menampilkan {transactions.length} dari {pagination.total || 0} transaksi</span>
        <div className="flex gap-2">
          <button
            disabled={txFilters.page === 1}
            onClick={() => setTxFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
            className="px-3 py-1 border rounded cursor-pointer disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={txFilters.page >= (pagination.last_page || 1)}
            onClick={() => setTxFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
            className="px-3 py-1 border rounded cursor-pointer disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}