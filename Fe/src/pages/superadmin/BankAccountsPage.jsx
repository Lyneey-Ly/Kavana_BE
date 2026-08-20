import { useState } from 'react';
import API from '../../api';
import Swal from 'sweetalert2';
import useSuperAdminFetch from '../../hooks/useSuperAdminFetch';
import { formatAvatar } from '../../utils/format';

const EMPTY_FORM = {
  bank_name: '',
  account_number: '',
  account_holder: '',
  is_active: true,
  qris_image: null,
};

export default function BankAccountsPage() {
  const { data, loading, error, reload } = useSuperAdminFetch('/admin/superadmin/bank-accounts', {
    transform: (d) => d?.data || [],
  });

  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingAccount(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      account_holder: account.account_holder,
      is_active: account.is_active,
      qris_image: null,
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, files, type, checked } = e.target;
    if (name === 'qris_image') {
      setFormData((prev) => ({ ...prev, qris_image: files[0] }));
    } else if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, is_active: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('bank_name', formData.bank_name);
      fd.append('account_number', formData.account_number);
      fd.append('account_holder', formData.account_holder);
      fd.append('is_active', formData.is_active ? '1' : '0');
      if (formData.qris_image) fd.append('qris_image', formData.qris_image);

      const res = await API.post(
        editingAccount
          ? `/admin/superadmin/bank-accounts/${editingAccount.id}`
          : '/admin/superadmin/bank-accounts',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: res.data?.message || 'Rekening bank berhasil disimpan.',
        timer: 2000,
        showConfirmButton: false,
      });
      setShowModal(false);
      reload();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.response?.data?.message || 'Gagal menyimpan rekening bank!',
        confirmButtonColor: '#B38E5D',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (account) => {
    const result = await Swal.fire({
      title: 'Hapus Rekening?',
      text: `Rekening ${account.bank_name} (${account.account_number}) akan dihapus permanen.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#B38E5D',
    });
    if (!result.isConfirmed) return;

    try {
      await API.delete(`/admin/superadmin/bank-accounts/${account.id}`);
      Swal.fire({
        icon: 'success',
        title: 'Terhapus',
        text: 'Rekening bank berhasil dihapus.',
        timer: 2000,
        showConfirmButton: false,
      });
      reload();
    } catch {
      Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menghapus rekening bank!', confirmButtonColor: '#B38E5D' });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Rekening Bank...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-[#D7C4B0] p-10 text-center rounded-2xl shadow-sm">
        <p className="text-rose-600 font-bold text-sm mb-3">Gagal memuat rekening bank.</p>
        <button onClick={reload} className="px-4 py-2 bg-[#B38E5D] text-white rounded-lg text-xs font-bold cursor-pointer">
          🔄 Coba Lagi
        </button>
      </div>
    );
  }

  const accounts = data || [];

  return (
    <div className="bg-white rounded-2xl border border-[#D7C4B0] p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-[#261C19]">Rekening Bank Resmi Platform</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tujuan pembayaran pemilik kost (slot properti) &amp; vendor iklan.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#B38E5D] hover:bg-[#8F6E45] text-white px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md hover:scale-105 cursor-pointer"
        >
          ➕ Tambah Rekening
        </button>
      </div>

      {accounts.length === 0 ? (
        <p className="text-center py-12 text-xs text-slate-400 font-bold">
          Belum ada rekening bank. Tambahkan rekening resmi untuk menerima pembayaran.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`border rounded-2xl p-5 transition ${
                account.is_active ? 'border-[#D7C4B0] bg-[#FAF5EF]/30' : 'border-slate-200 bg-slate-50 opacity-70'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="w-11 h-11 bg-[#261C19] text-white rounded-xl flex items-center justify-center font-black text-sm">
                  {account.bank_name.slice(0, 3).toUpperCase()}
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    account.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {account.is_active ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>

              <h3 className="font-bold text-[#261C19]">{account.bank_name}</h3>
              <p className="text-xs text-slate-500">a.n. {account.account_holder}</p>
              <p className="text-lg font-black text-[#B38E5D] mt-1 tracking-wide">{account.account_number}</p>

              {account.qris_image_url && (
                <div className="mt-3">
                  <img
                    src={formatAvatar(account.qris_image_url)}
                    alt="QRIS"
                    className="w-28 h-28 object-contain border border-slate-200 rounded-lg bg-white p-1"
                  />
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => openEdit(account)}
                  className="flex-1 py-2 rounded-lg border border-[#B38E5D] text-[#B38E5D] text-xs font-bold hover:bg-[#B38E5D] hover:text-white transition cursor-pointer"
                >
                  ✏️ Ubah
                </button>
                <button
                  onClick={() => handleDelete(account)}
                  className="flex-1 py-2 rounded-lg border border-rose-300 text-rose-500 text-xs font-bold hover:bg-rose-500 hover:text-white transition cursor-pointer"
                >
                  🗑️ Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#D7C4B0] overflow-hidden">
            <div className="bg-[#261C19] text-white p-5 flex justify-between items-center border-b border-[#3D2D29]">
              <h3 className="font-bold text-base font-serif tracking-wide">
                {editingAccount ? 'Ubah Rekening Bank' : 'Tambah Rekening Bank'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Bank</label>
                <input
                  type="text"
                  name="bank_name"
                  required
                  value={formData.bank_name}
                  onChange={handleInputChange}
                  placeholder="Cth: BCA, Mandiri, BRI"
                  className="w-full border p-2 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">No. Rekening</label>
                <input
                  type="text"
                  name="account_number"
                  required
                  value={formData.account_number}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Atas Nama</label>
                <input
                  type="text"
                  name="account_holder"
                  required
                  value={formData.account_holder}
                  onChange={handleInputChange}
                  className="w-full border p-2 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">QRIS (Opsional)</label>
                <input
                  type="file"
                  name="qris_image"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="w-full text-xs text-slate-500"
                />
                {editingAccount?.qris_image_url && !formData.qris_image && (
                  <p className="text-[10px] text-slate-400 mt-1">Gambar lama akan diganti jika mengunggah gambar baru.</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="w-4 h-4 accent-[#B38E5D]"
                />
                Aktif sebagai tujuan pembayaran
              </label>

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