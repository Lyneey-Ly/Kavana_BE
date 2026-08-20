import { useState, useCallback } from 'react';
import API from '../../api';
import Swal from 'sweetalert2';
import useSuperAdminFetch from '../../hooks/useSuperAdminFetch';
import { formatRupiah, formatAvatar } from '../../utils/format';

const CATEGORY_LABELS = {
  slot_fee: 'Slot Properti',
  vendor_ad: 'Iklan Vendor',
  commission: 'Komisi Booking',
  operational_cost: 'Biaya Operasional',
  other: 'Lainnya',
};

const CATEGORY_BADGES = {
  slot_fee: 'bg-amber-100 text-amber-700',
  vendor_ad: 'bg-violet-100 text-violet-700',
  commission: 'bg-blue-100 text-blue-700',
  operational_cost: 'bg-rose-100 text-rose-700',
  other: 'bg-slate-100 text-slate-600',
};

const EMPTY_FORM = {
  type: 'income',
  category: 'other',
  amount: '',
  description: '',
  transaction_date: new Date().toISOString().slice(0, 10),
  proof_file: null,
};

export default function FinanceTrackerPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (year) params.set('year', year);
    if (month) params.set('month', month);
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    params.set('per_page', '50');
    return `/admin/superadmin/finance-tracker?${params.toString()}`;
  }, [year, month, category, type]);

  const { data, loading, error, reload } = useSuperAdminFetch(buildUrl(), { deps: [buildUrl] });

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setFormData({ ...EMPTY_FORM, transaction_date: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'proof_file') {
      setFormData((prev) => ({ ...prev, proof_file: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', formData.type);
      fd.append('category', formData.category);
      fd.append('amount', formData.amount);
      fd.append('description', formData.description);
      fd.append('transaction_date', formData.transaction_date);
      if (formData.proof_file) fd.append('proof_file', formData.proof_file);

      const res = await API.post('/admin/superadmin/finance-tracker', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: res.data?.message || 'Catatan keuangan berhasil disimpan.',
        timer: 2000,
        showConfirmButton: false,
      });
      setShowModal(false);
      reload();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data?.message || 'Gagal menyimpan catatan keuangan!',
        confirmButtonColor: '#B38E5D',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const result = await Swal.fire({
      title: 'Hapus Catatan?',
      text: `Catatan ${CATEGORY_LABELS[record.category] || record.category} sebesar ${formatRupiah(record.amount)} akan dihapus.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#B38E5D',
    });
    if (!result.isConfirmed) return;

    try {
      await API.delete(`/admin/superadmin/finance-tracker/${record.id}`);
      Swal.fire({ icon: 'success', title: 'Terhapus', text: 'Catatan keuangan berhasil dihapus.', timer: 2000, showConfirmButton: false });
      reload();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus catatan keuangan!', confirmButtonColor: '#B38E5D' });
    }
  };

  const filterClass =
    'border border-[#D7C4B0] p-2 rounded-lg bg-[#FAF5EF] text-xs font-bold text-[#261C19]';

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Keuangan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#D7C4B0] p-10 text-center rounded-2xl shadow-sm">
        <p className="text-rose-600 font-bold text-sm mb-3">Gagal memuat data keuangan.</p>
        <button onClick={reload} className="px-4 py-2 bg-[#B38E5D] text-white rounded-lg text-xs font-bold cursor-pointer">
          🔄 Coba Lagi
        </button>
      </div>
    );
  }

  const summary = data?.data?.summary || {};
  const records = data?.data?.records || [];

  return (
    <div className="space-y-6">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pemasukan</p>
          <h3 className="text-2xl font-black text-emerald-600">{formatRupiah(summary.total_income)}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-[#D7C4B0] shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pengeluaran</p>
          <h3 className="text-2xl font-black text-rose-500">{formatRupiah(summary.total_expense)}</h3>
        </div>
        <div className="bg-[#261C19] text-white p-5 rounded-2xl border border-[#3D2D29] shadow-lg">
          <p className="text-xs font-bold text-[#D7C4B0] uppercase tracking-wider mb-1">Saldo (Net)</p>
          <h3 className="text-2xl font-black text-[#FAF5EF]">{formatRupiah(summary.balance)}</h3>
        </div>
      </div>

      {/* FILTER + ACTION */}
      <div className="bg-white rounded-2xl border border-[#D7C4B0] p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <h2 className="font-bold text-[#261C19]">Finance Tracker Superadmin</h2>
          <button
            onClick={openCreate}
            className="bg-[#B38E5D] hover:bg-[#8F6E45] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md hover:scale-105 cursor-pointer"
          >
            ➕ Tambah Catatan
          </button>
        </div>

        <div className="flex gap-3 flex-wrap mb-6">
          <select value={year} onChange={(e) => setYear(e.target.value)} className={filterClass}>
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className={filterClass}>
            <option value="">Semua Bulan</option>
            {[
              ['1', 'Januari'], ['2', 'Februari'], ['3', 'Maret'], ['4', 'April'],
              ['5', 'Mei'], ['6', 'Juni'], ['7', 'Juli'], ['8', 'Agustus'],
              ['9', 'September'], ['10', 'Oktober'], ['11', 'November'], ['12', 'Desember'],
            ].map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={filterClass}>
            <option value="">Semua Kategori</option>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <select value={type} onChange={(e) => setType(e.target.value)} className={filterClass}>
            <option value="">Semua Tipe</option>
            <option value="income">Pemasukan</option>
            <option value="expense">Pengeluaran</option>
          </select>
        </div>

        {records.length === 0 ? (
          <p className="text-center py-12 text-xs text-slate-400 font-bold">
            Tidak ada catatan keuangan untuk filter ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-[#D7C4B0]">
                  <th className="py-3 pr-4">Tanggal</th>
                  <th className="py-3 pr-4">Tipe</th>
                  <th className="py-3 pr-4">Kategori</th>
                  <th className="py-3 pr-4">Deskripsi</th>
                  <th className="py-3 pr-4 text-right">Jumlah</th>
                  <th className="py-3 pr-4">Bukti</th>
                  <th className="py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-slate-100 hover:bg-[#FAF5EF]/40">
                    <td className="py-3 pr-4 whitespace-nowrap text-slate-600 font-bold">
                      {new Date(record.transaction_date + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          record.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {record.type === 'income' ? 'Masuk' : 'Keluar'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${CATEGORY_BADGES[record.category] || CATEGORY_BADGES.other}`}>
                        {CATEGORY_LABELS[record.category] || record.category}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600 max-w-[220px] truncate">{record.description || '-'}</td>
                    <td className={`py-3 pr-4 text-right font-black ${record.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {record.type === 'income' ? '+' : '-'}{formatRupiah(record.amount)}
                    </td>
                    <td className="py-3 pr-4">
                      {record.proof_file ? (
                        <a
                          href={formatAvatar(`/storage/${record.proof_file}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[#B38E5D] hover:underline"
                        >
                          📎 Lihat
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleDelete(record)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL TAMBAH CATATAN */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#D7C4B0] overflow-hidden">
            <div className="bg-[#261C19] text-white p-5 flex justify-between items-center border-b border-[#3D2D29]">
              <h3 className="font-bold text-base font-serif tracking-wide">Tambah Catatan Keuangan</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Tipe</label>
                  <select name="type" value={formData.type} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm bg-white">
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Kategori</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm bg-white">
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Jumlah (Rp)</label>
                <input
                  type="number"
                  name="amount"
                  required
                  min={0}
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Tanggal</label>
                <input
                  type="date"
                  name="transaction_date"
                  required
                  value={formData.transaction_date}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Deskripsi</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Cth: Gaji admin, sewa server, dll."
                  className="w-full border p-2 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Bukti (Opsional)</label>
                <input
                  type="file"
                  name="proof_file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="w-full text-xs text-slate-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-xs uppercase text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-1/2 py-2.5 rounded-xl bg-[#B38E5D] text-white font-bold text-xs uppercase shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}