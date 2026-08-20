import API from '../../api';
import Swal from 'sweetalert2';
import useSuperAdminFetch from '../../hooks/useSuperAdminFetch';

export default function UsersTab({ onStatsChanged }) {
  const { data, loading, error, reload } = useSuperAdminFetch(
    '/admin/superadmin/users',
    {
      transform: (d) => {
        const raw = d?.data || [];
        return Array.isArray(raw) ? raw : [];
      }
    }
  );

  const users = data || [];

  const handleDeleteUser = async (id, name) => {
    const result = await Swal.fire({
      title: 'Hapus User Platform?',
      text: `Menghapus ${name} akan menghentikan akses akun ini dari aplikasi.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Ya, Hapus User!',
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/admin/superadmin/users/${id}`);
        Swal.fire('Terhapus!', 'User berhasil dihapus.', 'success');
        reload();
        if (onStatsChanged) onStatsChanged();
      } catch (error) {
        Swal.fire('Gagal!', error.response?.data?.message || 'Terjadi kesalahan.', 'error');
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#D7C4B0] shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-[#FAF5EF]/50 flex justify-between items-center">
        <h2 className="font-bold text-[#261C19] text-base">Daftar Pengguna Website</h2>
        <span className="text-xs text-slate-500 font-bold uppercase">Total: {users.length}</span>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Data...</p>
        </div>
      ) : error ? (
        <div className="p-10 text-center">
          <p className="text-rose-600 font-bold text-sm mb-3">Gagal memuat data pengguna platform.</p>
          <button
            onClick={reload}
            className="px-4 py-2 bg-[#B38E5D] text-white rounded-lg text-xs font-bold cursor-pointer"
          >
            🔄 Coba Lagi
          </button>
        </div>
      ) : users.length === 0 ? (
        <p className="text-center py-10 text-xs text-slate-400 font-bold">Belum ada pengguna terdaftar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase text-[11px]">
              <tr>
                <th className="px-6 py-3.5">ID</th>
                <th className="px-6 py-3.5">Nama Lengkap</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Tanggal Bergabung</th>
                <th className="px-6 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-slate-400">#{user.id}</td>
                  <td className="px-6 py-4 font-bold text-[#261C19]">{user.name}</td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold border border-rose-200 cursor-pointer"
                    >
                      🗑️ Hapus User
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}