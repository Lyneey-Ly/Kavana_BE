import React, { useState, useEffect } from 'react';
import API from '../api'; 
import Swal from 'sweetalert2';
import { CheckCircle2, XCircle, Search, RefreshCw, Image as ImageIcon, Building2 } from 'lucide-react';
import SidebarSuperAdmin from '../components/SidebarSuperAdmin'; 

export default function VerifikasiPropertiSuperAdmin() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('waiting_verification');

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/superadmin/pending-properties?approval_status=all');
      const dataBackend = res.data?.data || res.data || [];
      // 👈 PERBAIKAN: Pastikan selalu dalam wujud Array agar tidak crash saat di .filter/.map
      setProperties(Array.isArray(dataBackend) ? dataBackend : []);
    } catch (err) {
      console.error('Gagal mengambil data properti:', err);
      Swal.fire('Error', 'Gagal memuat data properti. Pastikan koneksi backend aktif.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleAction = async (id, status, textAction) => {
    const confirm = await Swal.fire({
      title: `${textAction} Properti ini?`,
      text: status === 'active' 
        ? "Properti akan langsung aktif dan tampil di aplikasi pengguna." 
        : "Properti akan ditolak dan Admin harus mengajukan ulang.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: status === 'active' ? '#10b981' : '#ef4444',
      cancelButtonText: 'Batal',
      confirmButtonText: `Ya, ${textAction}`
    });

    if (!confirm.isConfirmed) return;

    try {
      await API.patch(`/admin/superadmin/properties/${id}/approval`, {
        approval_status: status
      });
      
      Swal.fire('Berhasil!', `Properti berhasil di-${textAction.toLowerCase()}.`, 'success');
      fetchProperties(); 
    } catch (err) {
      Swal.fire('Gagal', err.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
    }
  };

  const showProofModal = (proofUrl) => {
    if (!proofUrl) return;
    const fullUrl = proofUrl.startsWith('http') ? proofUrl : `http://127.0.0.1:8000/storage/${proofUrl}`;
    Swal.fire({
      title: 'Bukti Transfer Pembayaran',
      imageUrl: fullUrl,
      imageAlt: 'Bukti Pembayaran',
      confirmButtonColor: '#B38E5D',
    });
  };

  const filteredData = Array.isArray(properties) ? properties.filter((item) => {
    const status = String(item.approval_status || 'pending_payment').toLowerCase();
    return status === filter;
  }) : [];

  return (
    <SidebarSuperAdmin>
      <div className="p-6">
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <span className="block text-xs tracking-widest text-[#B38E5D] uppercase font-bold">
              Panel Superadmin
            </span>
            <h1 className="text-3xl font-serif font-bold tracking-wide mt-1 text-[#2D2321]">
              Verifikasi Pembayaran Slot
            </h1>
          </div>
          <button 
            onClick={fetchProperties}
            className="bg-[#2D2321] text-[#FAF5EF] px-4 py-2.5 font-bold text-xs uppercase shadow-md hover:bg-[#B38E5D] transition-all rounded flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> REFRESH DATA
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { key: 'waiting_verification', label: 'Perlu Verifikasi' },
            { key: 'active', label: 'Telah Disetujui (Aktif)' },
            { key: 'rejected', label: 'Ditolak' },
            { key: 'pending_payment', label: 'Belum Bayar' },
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
        ) : filteredData.length === 0 ? (
          <div className="bg-white border border-[#D7C4B0] p-12 text-center rounded-xl shadow-sm">
            <Building2 className="w-12 h-12 text-[#D7C4B0] mx-auto mb-3" />
            <p className="text-[#5C4A42] font-medium text-sm">Tidak ada properti pada kategori ini.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#D7C4B0] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#5C4A42]">
                <thead className="bg-[#FAF5EF] border-b border-[#D7C4B0] text-xs uppercase font-bold text-[#2D2321]">
                  <tr>
                    <th className="px-6 py-4">ID & Properti</th>
                    <th className="px-6 py-4">Pemilik (Admin)</th>
                    <th className="px-6 py-4">Biaya</th>
                    <th className="px-6 py-4 text-center">Bukti Transfer</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7C4B0]">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#2D2321]">{item.title || item.nama_properti || 'Properti Tanpa Nama'}</div>
                        <div className="text-[10px] font-mono mt-1 text-[#B38E5D]">ID: PUB-{item.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{item.pemilik?.name || 'Administrator'}</div>
                        <div className="text-[11px] opacity-70">{item.pemilik?.email || '-'}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-[#B38E5D]">
                        Rp {new Intl.NumberFormat('id-ID').format(item.slot_fee ?? 150000)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {item.payment_proof ? (
                            <button 
                              onClick={() => showProofModal(item.payment_proof)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <ImageIcon className="w-3.5 h-3.5" /> Lihat Bukti
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Tidak ada</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 flex justify-center gap-2">
                        {filter === 'waiting_verification' ? (
                          <>
                            <button 
                              onClick={() => handleAction(item.id, 'active', 'Setujui')}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> ACC
                            </button>
                            <button 
                              onClick={() => handleAction(item.id, 'rejected', 'Tolak')}
                              className="px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> TOLAK
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-1 bg-slate-100 rounded text-slate-500 uppercase tracking-wider">
                            {item.approval_status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </SidebarSuperAdmin>
  );
}