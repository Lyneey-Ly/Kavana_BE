import { useState } from 'react';
import API from '../../api';
import Swal from 'sweetalert2';
import useSuperAdminFetch from '../../hooks/useSuperAdminFetch';
import { formatAvatar } from '../../utils/format';
import { useSuperAdminLayout } from '../../contexts/SuperAdminContext';

export default function AdministratorsPage() {
  const { refreshTick } = useSuperAdminLayout();
  const [adminRoleFilter, setAdminRoleFilter] = useState('');

  const url = adminRoleFilter
    ? `/admin/superadmin/administrators?role=${adminRoleFilter}`
    : '/admin/superadmin/administrators';

  const { data, loading, error, reload } = useSuperAdminFetch(
    url,
    {
      deps: [refreshTick],
      transform: (d) => {
        const raw = d?.data || [];
        return Array.isArray(raw) ? raw : [];
      }
    }
  );

  const administrators = data || [];

  const handleDeleteAdministrator = async (id, name) => {
    const result = await Swal.fire({
      title: 'Hapus Akun Pengelola?',
      text: `Apakah Anda yakin ingin menghapus akun ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus!',
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/admin/superadmin/administrators/${id}`);
        Swal.fire('Terhapus!', 'Akun berhasil dihapus.', 'success');
        reload();
      } catch (error) {
        Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-[#FAF5EF]/50 flex justify-between items-center">
        <h2 className="font-bold text-[#261C19] text-base">Akun Administrator & Pemilik Kost</h2>
        <select
          value={adminRoleFilter}
          onChange={(e) => setAdminRoleFilter(e.target.value)}
          className="text-xs border border-[#D7C4B0] p-2 rounded-lg bg-white font-bold"
        >
          <option value="">Semua Role</option>
          <option value="admin">Pemilik Kost (Admin)</option>
          <option value="superadmin">Superadmin</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Data...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center">
          <p className="text-rose-600 font-bold text-sm mb-3">Gagal memuat data administrator.</p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-[#B38E5D] text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            🔄 Coba Lagi
          </button>
        </div>
      ) : administrators.length === 0 ? (
        <p className="text-center py-10 text-xs text-slate-400 font-bold">Tidak ada akun pengelola.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px]">
              <tr>
                <th className="px-6 py-3.5">Pengelola</th>
                <th className="px-6 py-3.5">Kontak</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Terdaftar</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {administrators.map((item) => {
                const avatarUrl = formatAvatar(item.foto || item.avatar || item.foto_profil);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="relative w-9 h-9 flex-shrink-0">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={item.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#D7C4B0] shadow-xs"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="w-9 h-9 rounded-full bg-[#B38E5D] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs"
                          style={{ display: avatarUrl ? 'none' : 'flex' }}
                        >
                          {item.name ? item.name[0] : 'U'}
                        </div>
                      </div>
                      <div>
                        <div className="font-bold text-[#261C19]">{item.name}</div>
                        <div className="text-xs text-slate-500">{item.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.phone}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${item.role === 'superadmin' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.role === 'superadmin' ? 'Superadmin' : 'Pemilik Kost'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(item.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteAdministrator(item.id, item.name)}
                        className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-200 cursor-pointer"
                      >
                        🗑️ Hapus
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}