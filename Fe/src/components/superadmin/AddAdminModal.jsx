import { useState } from 'react';
import API from '../../api';
import Swal from 'sweetalert2';

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'admin',
  foto: null,
};

export default function AddAdminModal({ open, onClose, onSuccess }) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'foto') {
      setFormData((prev) => ({ ...prev, foto: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleAddAdministrator = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('password', formData.password);
      data.append('role', formData.role);
      if (formData.foto) data.append('foto', formData.foto);

      const res = await API.post('/admin/superadmin/administrators', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: res.data?.message || 'Akun pengelola berhasil ditambahkan.',
        timer: 2000,
        showConfirmButton: false,
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menambah Akun',
        text: error.response?.data?.message || 'Gagal menyimpan data baru!',
        confirmButtonColor: '#B38E5D',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#D7C4B0] overflow-hidden">
        <div className="bg-[#261C19] text-white p-5 flex justify-between items-center border-b border-[#3D2D29]">
          <h3 className="font-bold text-base font-serif tracking-wide">Pendaftaran Pengelola Baru</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs font-bold transition cursor-pointer">
            ✕
          </button>
        </div>

        <form onSubmit={handleAddAdministrator} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Role</label>
            <select name="role" value={formData.role} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm bg-white">
              <option value="admin">Pemilik Kost (Admin)</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Nama Lengkap</label>
            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Email</label>
            <input type="email" name="email" required value={formData.email} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">No. Telepon / WA</label>
            <input type="text" name="phone" required value={formData.phone} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Password</label>
            <input type="password" name="password" required minLength={8} value={formData.password} onChange={handleInputChange} className="w-full border p-2 rounded-lg text-sm" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Foto Profil (Opsional)</label>
            <input type="file" name="foto" accept="image/*" onChange={handleInputChange} className="w-full text-xs text-slate-500" />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="w-1/2 py-2.5 rounded-xl border border-slate-300 font-bold text-xs uppercase text-slate-600 cursor-pointer">
              Batal
            </button>
            <button type="submit" disabled={saving} className="w-1/2 py-2.5 rounded-xl bg-[#B38E5D] text-white font-bold text-xs uppercase shadow-md cursor-pointer disabled:opacity-50">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}