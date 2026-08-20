import { useState } from 'react';
import API from '../../api';
import Swal from 'sweetalert2';
import useSuperAdminFetch from '../../hooks/useSuperAdminFetch';
import { formatRupiah } from '../../utils/format';

export default function ApprovalPage() {
  const [approvalFilter, setApprovalFilter] = useState('pending_payment');

  const { data, loading, error, reload } = useSuperAdminFetch(
    `/admin/superadmin/pending-properties?approval_status=${approvalFilter}`,
    {
      transform: (d) => {
        const raw = d?.data || [];
        return Array.isArray(raw) ? raw : [];
      }
    }
  );

  const pendingProperties = data || [];

  const handleApprovalChange = async (propertyId, newStatus) => {
    const actionText = newStatus === 'active' ? 'Setujui & Terbitkan' : 'Tolak';
    const result = await Swal.fire({
      title: `${actionText} Properti?`,
      text: `Status persetujuan properti akan diubah menjadi '${newStatus}'.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'active' ? '#B38E5D' : '#d33',
      confirmButtonText: `Ya, ${actionText}!`,
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        await API.patch(`/admin/superadmin/properties/${propertyId}/approval`, {
          approval_status: newStatus
        });
        Swal.fire('Berhasil!', `Status properti telah diperbarui.`, 'success');
        reload();
      } catch (err) {
        Swal.fire('Gagal!', err.response?.data?.message || 'Gagal mengubah status', 'error');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-[#FAF5EF]/50 flex justify-between items-center">
        <h2 className="font-bold text-[#261C19] text-base">Verifikasi Properti & Slot Iklan</h2>
        <select
          value={approvalFilter}
          onChange={(e) => setApprovalFilter(e.target.value)}
          className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white font-bold"
        >
          <option value="pending_payment">Menunggu Verifikasi (Pending)</option>
          <option value="active">Disetujui / Aktif</option>
          <option value="rejected">Ditolak</option>
          <option value="all">Semua Properti</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Data...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center">
          <p className="text-rose-600 font-bold text-sm mb-3">Gagal memuat data properti. Pastikan koneksi backend aktif.</p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-[#B38E5D] text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            🔄 Coba Lagi
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Nama Properti</th>
                <th className="px-6 py-3.5">Pemilik Kost</th>
                <th className="px-6 py-3.5">Harga / Bulan</th>
                <th className="px-6 py-3.5">Slot Berbayar</th>
                <th className="px-6 py-3.5">Status Persetujuan</th>
                <th className="px-6 py-3.5 text-center">Aksi Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingProperties.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-xs text-slate-400 font-bold">
                    Tidak ada data properti untuk status ini.
                  </td>
                </tr>
              ) : (
                pendingProperties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#261C19]">{prop.title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs">{prop.address}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-700">{prop.pemilik?.name || '-'}</div>
                      <div className="text-xs text-slate-400">{prop.pemilik?.email}</div>
                    </td>
                    <td className="px-6 py-4 font-black text-[#261C19]">{formatRupiah(prop.price_per_month)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${prop.is_paid_slot ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        {prop.is_paid_slot ? '⭐ Slot Iklan/Fitur' : 'Biasa'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        prop.approval_status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        prop.approval_status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {prop.approval_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {prop.approval_status !== 'active' && (
                          <button
                            onClick={() => handleApprovalChange(prop.id, 'active')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer transition shadow-xs"
                          >
                            ✓ Setujui
                          </button>
                        )}
                        {prop.approval_status !== 'rejected' && (
                          <button
                            onClick={() => handleApprovalChange(prop.id, 'rejected')}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-200 cursor-pointer transition"
                          >
                            ✕ Tolak
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}