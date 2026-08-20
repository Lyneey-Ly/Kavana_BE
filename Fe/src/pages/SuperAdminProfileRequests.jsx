import React, { useState, useEffect, useCallback } from 'react';
import API from '../api';
import Swal from 'sweetalert2';
import { CheckCircle2, XCircle, RefreshCw, UserRound, Clock } from 'lucide-react';
import SidebarSuperAdmin from '../components/SidebarSuperAdmin';

const storageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (clean.startsWith('/storage/')) return `http://127.0.0.1:8000${clean}`;
  return `http://127.0.0.1:8000/storage${clean}`;
};

export default function SuperAdminProfileRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  // Modal Tolak
  const [rejectModal, setRejectModal] = useState(null); // { id, name }
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/superadmin/profile-requests?status=${filter}`);
      const data = res.data?.data || [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Gagal mengambil pengajuan profil:', err);
      Swal.fire('Error', 'Gagal memuat data pengajuan perubahan profil.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (req) => {
    const confirm = await Swal.fire({
      title: 'Setujui Perubahan Profil?',
      text: `Data baru untuk ${req.administrator?.name || 'Admin'} akan langsung diterapkan ke akun utama.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonText: 'Batal',
      confirmButtonText: 'Ya, Setujui!',
    });

    if (!confirm.isConfirmed) return;

    try {
      await API.post(`/admin/superadmin/profile-requests/${req.id}/approve`);
      Swal.fire('Disetujui!', 'Perubahan profil berhasil diterapkan.', 'success');
      fetchRequests();
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
    }
  };

  const openRejectModal = (req) => {
    setRejectReason('');
    setRejectModal({ id: req.id, name: req.administrator?.name || 'Admin' });
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      Swal.fire('Perhatian', 'Alasan penolakan wajib diisi.', 'warning');
      return;
    }

    setRejecting(true);
    try {
      await API.post(`/admin/superadmin/profile-requests/${rejectModal.id}/reject`, {
        rejection_reason: rejectReason.trim(),
      });
      Swal.fire('Ditolak', 'Pengajuan perubahan profil telah ditolak.', 'success');
      setRejectModal(null);
      fetchRequests();
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setRejecting(false);
    }
  };

  const fieldRow = (label, currentVal, newVal, isFoto = false) => {
    const changed = currentVal !== newVal && newVal;
    return (
      <div className={`grid grid-cols-2 gap-3 py-3 border-b border-slate-100 last:border-0 ${changed ? 'bg-emerald-50/60 -mx-3 px-3 rounded-lg' : ''}`}>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label} (Saat Ini)</p>
          {isFoto ? (
            currentVal ? (
              <img src={storageUrl(currentVal)} alt="Foto lama" className="w-14 h-14 rounded-full object-cover border border-slate-200" />
            ) : (
              <span className="text-xs italic text-slate-400">Tidak ada</span>
            )
          ) : (
            <p className="text-sm font-semibold text-slate-600 break-words">{currentVal || <span className="italic text-slate-400">-</span>}</p>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Baru (Diajukan)</p>
          {isFoto ? (
            newVal ? (
              <img src={storageUrl(newVal)} alt="Foto baru" className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400 shadow-sm" />
            ) : (
              <span className="text-xs italic text-slate-400">Tidak berubah</span>
            )
          ) : (
            <p className={`text-sm font-bold break-words ${changed ? 'text-emerald-700' : 'text-slate-500'}`}>
              {newVal || <span className="italic text-slate-400">Tidak berubah</span>}
            </p>
          )}
        </div>
      </div>
    );
  };

  const statusBadge = (status) => {
    const map = {
      pending: { label: 'Menunggu Persetujuan', cls: 'bg-amber-100 text-amber-800' },
      approved: { label: 'Disetujui', cls: 'bg-emerald-100 text-emerald-700' },
      rejected: { label: 'Ditolak', cls: 'bg-rose-100 text-rose-700' },
    };
    const item = map[status] || map.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${item.cls}`}>
        {item.label}
      </span>
    );
  };

  return (
    <SidebarSuperAdmin>
      <div className="p-6">

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <span className="block text-xs tracking-widest text-[#B38E5D] uppercase font-bold">
              Panel Superadmin
            </span>
            <h1 className="text-3xl font-serif font-bold tracking-wide mt-1 text-[#2D2321]">
              Verifikasi Perubahan Profil Admin
            </h1>
            <p className="text-sm text-[#5C4A42] mt-1">
              Setujui atau tolak pengajuan perubahan identitas (nama, email, no. HP, foto) yang diajukan Admin.
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="bg-[#2D2321] text-[#FAF5EF] px-4 py-2.5 font-bold text-xs uppercase shadow-md hover:bg-[#B38E5D] transition-all rounded flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> REFRESH DATA
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { key: 'pending', label: '⏳ Menunggu Persetujuan' },
            { key: 'approved', label: '✅ Disetujui' },
            { key: 'rejected', label: '❌ Ditolak' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                filter === tab.key
                  ? 'bg-[#B38E5D] text-white shadow-md'
                  : 'bg-white text-[#5C4A42] border border-[#D7C4B0] hover:bg-[#FAF5EF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full h-[1px] bg-[#D7C4B0] mb-6"></div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Data...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white border border-[#D7C4B0] p-12 text-center rounded-xl shadow-sm">
            <UserRound className="w-12 h-12 text-[#D7C4B0] mx-auto mb-3" />
            <p className="text-[#5C4A42] font-medium text-sm">
              {filter === 'pending'
                ? 'Tidak ada pengajuan perubahan profil yang menunggu persetujuan.'
                : 'Tidak ada data pada kategori ini.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requests.map((req) => {
              const admin = req.administrator || {};
              const current = req.current_data || {};
              const requested = req.requested_data || {};
              const hasFoto = !!(requested.foto && current.foto !== requested.foto);

              return (
                <div key={req.id} className="bg-white border border-[#D7C4B0] rounded-2xl shadow-sm overflow-hidden flex flex-col">
                  {/* HEADER KARTU */}
                  <div className="bg-[#FAF5EF] border-b border-[#D7C4B0] px-5 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={storageUrl(admin.foto) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={admin.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-[#B38E5D] shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-[#2D2321] truncate">{admin.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{admin.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {statusBadge(req.status)}
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(req.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                  </div>

                  {/* PERBANDINGAN DATA */}
                  <div className="px-5 py-3 flex-1">
                    {fieldRow('Nama', current.name, requested.name)}
                    {fieldRow('Email', current.email, requested.email)}
                    {fieldRow('No. HP', current.phone, requested.phone)}
                    {fieldRow('Foto Profil', current.foto, hasFoto ? requested.foto : null, true)}
                    {!Object.keys(requested).length && (
                      <p className="text-xs italic text-slate-400 py-3">Tidak ada data perubahan dalam pengajuan ini.</p>
                    )}
                  </div>

                  {/* AKSI */}
                  <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(req)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                        </button>
                        <button
                          onClick={() => openRejectModal(req)}
                          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Tolak
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] font-bold text-slate-500 italic">
                        {req.status === 'approved'
                          ? 'Perubahan telah diterapkan.'
                          : `Ditolak: ${req.rejection_reason || 'Tanpa alasan'}`}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL TOLAK */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#D7C4B0] overflow-hidden">
            <div className="bg-[#261C19] text-white p-5 flex justify-between items-center border-b border-[#3D2D29]">
              <h3 className="font-bold text-base font-serif tracking-wide">Tolak Pengajuan Profil</h3>
              <button
                onClick={() => setRejectModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReject} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Pengajuan perubahan profil dari <span className="font-bold text-slate-800">{rejectModal.name}</span> akan ditolak. Berikan alasan agar Admin dapat memperbaiki pengajuannya.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Alasan Penolakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  required
                  placeholder="Cth: Email yang diajukan sudah digunakan akun lain..."
                  className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-xs uppercase text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase shadow-md cursor-pointer disabled:opacity-50"
                >
                  {rejecting ? 'Memproses...' : 'Tolak Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SidebarSuperAdmin>
  );
}