import React, { useState, useEffect } from 'react';
import API from '../api';
import Swal from 'sweetalert2';
import { Plus, Edit, Trash2, RefreshCw, Image as ImageIcon, X } from 'lucide-react';
import SidebarSuperAdmin from '../components/SidebarSuperAdmin';

export default function KelolaIklanSuperAdmin() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [formData, setFormData] = useState({
    vendor_name: '',
    description: '',
    link_url: '',
    placement: 'home_hero',
    custom_placement: '',
    price: '',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  const [bannerFiles, setBannerFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/superadmin/vendor-ads');
      const dataBackend = res.data?.data || [];
      setAds(Array.isArray(dataBackend) ? dataBackend : []);
    } catch (err) {
      console.error('Gagal mengambil data iklan:', err);
      Swal.fire('Error', 'Gagal memuat data iklan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const resetForm = () => {
    setFormData({
      vendor_name: '',
      description: '',
      link_url: '',
      placement: 'home_hero',
      custom_placement: '',
      price: '',
      start_date: '',
      end_date: '',
      is_active: true,
    });
    setBannerFiles([]);
    setPreviewImages([]);
    setEditId(null);
  };

  const handleOpenModal = (ad = null) => {
    resetForm();
    if (ad) {
      setEditId(ad.id);
      
      const knownPlacements = ['home_hero', 'search_sidebar', 'footer_banner', 'catalog_top'];
      const isCustom = ad.placement && !knownPlacements.includes(ad.placement);

      setFormData({
        vendor_name: ad.vendor_name || '',
        description: ad.description || '',
        link_url: ad.link_url || '',
        placement: isCustom ? 'custom' : (ad.placement || 'home_hero'),
        custom_placement: isCustom ? ad.placement : '',
        price: ad.price || '',
        start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
        end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
        is_active: Boolean(ad.is_active),
      });

      if (ad.banner_image) {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        try {
          const parsed = JSON.parse(ad.banner_image);
          if (Array.isArray(parsed)) {
            setPreviewImages(parsed.map(p => `${baseUrl}/storage/${p}`));
          } else {
            setPreviewImages([`${baseUrl}/storage/${ad.banner_image}`]);
          }
        } catch {
          setPreviewImages([`${baseUrl}/storage/${ad.banner_image}`]);
        }
      }
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validasi ukuran per file (max 2MB)
    const invalidFile = files.find(f => f.size > 2 * 1024 * 1024);
    if (invalidFile) {
      Swal.fire('File Terlalu Besar', `Gambar ${invalidFile.name} melebihi batas 2MB`, 'warning');
      return;
    }

    setBannerFiles(files);
    const objectUrls = files.map(file => URL.createObjectURL(file));
    setPreviewImages(objectUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editId && bannerFiles.length === 0) {
      Swal.fire('Peringatan', 'Pilih minimal 1 gambar banner untuk iklan baru!', 'warning');
      return;
    }

    const finalPlacement = formData.placement === 'custom' 
      ? formData.custom_placement.trim().toLowerCase().replace(/\s+/g, '_')
      : formData.placement;

    if (!finalPlacement) {
      Swal.fire('Peringatan', 'Penempatan lokasi iklan wajib diisi!', 'warning');
      return;
    }

    setIsSubmitting(true);
    const submitData = new FormData();
    submitData.append('vendor_name', formData.vendor_name);
    submitData.append('description', formData.description || '');
    submitData.append('placement', finalPlacement);
    submitData.append('start_date', formData.start_date);
    submitData.append('end_date', formData.end_date);
    submitData.append('is_active', formData.is_active ? 1 : 0);
    
    if (formData.link_url) submitData.append('link_url', formData.link_url);
    if (formData.price) submitData.append('price', formData.price);

    // Kirim banyak file sebagai array banner_images[]
    if (bannerFiles.length > 0) {
      bannerFiles.forEach((file) => {
        submitData.append('banner_images[]', file);
      });
    }

    try {
      if (editId) {
        await API.post(`/admin/superadmin/vendor-ads/${editId}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Berhasil!', 'Data iklan berhasil diperbarui.', 'success');
      } else {
        await API.post('/admin/superadmin/vendor-ads', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire('Berhasil!', 'Iklan baru berhasil ditambahkan.', 'success');
      }
      handleCloseModal();
      fetchAds();
    } catch (err) {
      console.error(err);
      Swal.fire('Gagal Menyimpan', err.response?.data?.message || 'Terjadi kesalahan sistem.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: 'Hapus Iklan?',
      text: 'Data iklan beserta gambarnya akan dihapus permanen dari server.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonText: 'Batal',
      confirmButtonText: 'Ya, Hapus!'
    });

    if (!confirm.isConfirmed) return;

    try {
      await API.delete(`/admin/superadmin/vendor-ads/${id}`);
      Swal.fire('Terhapus!', 'Iklan berhasil dihapus.', 'success');
      fetchAds();
    } catch (err) {
      Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus data.', 'error');
    }
  };

  const getImageUrl = (path) => {
    if (!path) return '';
    const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    try {
      const parsed = JSON.parse(path);
      const firstImg = Array.isArray(parsed) ? parsed[0] : path;
      return firstImg.startsWith('http') ? firstImg : `${baseUrl}/storage/${firstImg}`;
    } catch {
      return path.startsWith('http') ? path : `${baseUrl}/storage/${path}`;
    }
  };

  return (
    <SidebarSuperAdmin>
      <div className="p-6 min-h-screen bg-[#FAF5EF] text-[#2D2321]">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <span className="block text-xs tracking-widest text-[#B38E5D] uppercase font-bold">
              Manajemen Pemasaran
            </span>
            <h1 className="text-3xl font-serif font-bold tracking-wide mt-1">
              Kelola Iklan Vendor
            </h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchAds}
              className="bg-white border border-[#D7C4B0] text-[#5C4A42] px-4 py-2.5 font-bold text-xs uppercase shadow-sm hover:bg-slate-50 transition-all rounded flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button 
              onClick={() => handleOpenModal()}
              className="bg-[#2D2321] text-[#FAF5EF] px-4 py-2.5 font-bold text-xs uppercase shadow-md hover:bg-[#B38E5D] transition-all rounded flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Tambah Iklan
            </button>
          </div>
        </div>

        <div className="w-full h-[1px] bg-[#D7C4B0] mb-6"></div>

        {/* TABEL DATA */}
        {loading ? (
          <div className="text-center py-20">
             <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin mb-4"></div>
             <p className="text-[#5C4A42] text-sm font-bold uppercase tracking-widest">Memuat Iklan...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white border border-[#D7C4B0] p-12 text-center rounded-xl shadow-sm">
            <ImageIcon className="w-12 h-12 text-[#D7C4B0] mx-auto mb-3" />
            <p className="text-[#5C4A42] font-medium text-sm">Belum ada data iklan vendor. Klik "Tambah Iklan" untuk memulai.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#D7C4B0] rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#5C4A42]">
                <thead className="bg-[#FAF5EF] border-b border-[#D7C4B0] text-xs uppercase font-bold text-[#2D2321]">
                  <tr>
                    <th className="px-6 py-4">Banner Utama</th>
                    <th className="px-6 py-4">Vendor, Deskripsi & Lokasi</th>
                    <th className="px-6 py-4">Tanggal Tayang</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D7C4B0]">
                  {ads.map((ad) => (
                    <tr key={ad.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="w-32 h-16 bg-slate-100 rounded border border-slate-200 overflow-hidden relative">
                          {ad.banner_image ? (
                            <img src={getImageUrl(ad.banner_image)} alt={ad.vendor_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Image</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#2D2321] text-base">{ad.vendor_name}</div>
                        {ad.description && (
                          <p className="text-xs text-slate-600 mt-1 italic line-clamp-2">{ad.description}</p>
                        )}
                        <div className="text-[11px] mt-2 text-[#B38E5D] uppercase tracking-wider font-semibold">
                          Lokasi Website: <span className="bg-[#FAF5EF] px-2 py-0.5 rounded border border-[#D7C4B0]">{ad.placement}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs">
                          <span className="text-slate-500">Mulai:</span> <strong className="text-slate-700">{ad.start_date.split('T')[0]}</strong>
                        </div>
                        <div className="text-xs mt-1">
                          <span className="text-slate-500">Akhir:</span> <strong className="text-slate-700">{ad.end_date.split('T')[0]}</strong>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded ${
                          ad.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {ad.is_active ? 'Aktif' : 'Non-Aktif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2 items-center">
                          <button 
                            onClick={() => handleOpenModal(ad)}
                            className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                            title="Edit Iklan"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(ad.id)}
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                            title="Hapus Iklan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-[#FAF5EF]">
              <h2 className="text-lg font-serif font-bold text-[#2D2321]">
                {editId ? 'Edit Iklan Vendor' : 'Tambah Iklan Baru'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-rose-500 text-2xl font-bold leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="adForm" onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Vendor <span className="text-rose-500">*</span></label>
                  <input type="text" name="vendor_name" value={formData.vendor_name} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-[#B38E5D] focus:border-[#B38E5D] outline-none" placeholder="Contoh: Honda / Telkomsel" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teks Deskripsi / Detail Promo</label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleChange} 
                    rows="3" 
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-[#B38E5D] focus:border-[#B38E5D] outline-none" 
                    placeholder="Tuliskan detail promo, deskripsi singkat, atau informasi diskon di sini..."
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Upload Gambar Banner (Bisa Lebih dari 1 Foto) {editId ? '' : <span className="text-rose-500">*</span>}
                  </label>
                  
                  {previewImages.length > 0 && (
                    <div className="mb-3 border border-slate-200 rounded-lg p-2 bg-slate-50 flex gap-2 overflow-x-auto">
                      {previewImages.map((src, index) => (
                        <div key={index} className="relative w-24 h-24 flex-shrink-0 border border-slate-300 rounded overflow-hidden">
                          <img src={src} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 rounded">#{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleFileChange} 
                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#FAF5EF] file:text-[#B38E5D] hover:file:bg-[#F0E6DA]" 
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Tahan tombol Ctrl / Shift untuk memilih beberapa foto sekaligus. Max 2MB per gambar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Penempatan (Posisi di Website) <span className="text-rose-500">*</span></label>
                    <select name="placement" value={formData.placement} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-[#B38E5D] focus:border-[#B38E5D] outline-none">
                      <option value="home_hero">Beranda Atas (Hero Slide)</option>
                      <option value="search_sidebar">Halaman Pencarian (Sidebar)</option>
                      <option value="catalog_top">Atas Halaman Katalog</option>
                      <option value="footer_banner">Footer Banner (Bawah Website)</option>
                      <option value="custom">-- Lokasi Kustom Lainnya --</option>
                    </select>
                  </div>

                  {formData.placement === 'custom' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama ID Lokasi Kustom <span className="text-rose-500">*</span></label>
                      <input 
                        type="text" 
                        name="custom_placement" 
                        value={formData.custom_placement} 
                        onChange={handleChange} 
                        required 
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-[#B38E5D] focus:border-[#B38E5D] outline-none" 
                        placeholder="Contoh: detail_produk_samping" 
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Link URL Tujuan (Opsional)</label>
                    <input type="url" name="link_url" value={formData.link_url} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-[#B38E5D] focus:border-[#B38E5D] outline-none" placeholder="https://..." />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Mulai <span className="text-rose-500">*</span></label>
                    <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-[#B38E5D] focus:border-[#B38E5D] outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Selesai <span className="text-rose-500">*</span></label>
                    <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-[#B38E5D] focus:border-[#B38E5D] outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Harga Kesepakatan (Opsional)</label>
                    <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-[#B38E5D] focus:border-[#B38E5D] outline-none" placeholder="0" />
                  </div>
                  <div className="flex items-center mt-4 md:mt-6">
                    <label className="flex items-center cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="sr-only" />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_active ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="ml-3 text-sm font-bold text-slate-700">Aktif Tayang</span>
                    </label>
                  </div>
                </div>

              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button onClick={handleCloseModal} type="button" className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-50">Batal</button>
              <button form="adForm" type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#B38E5D] text-white rounded-lg text-sm font-bold hover:bg-[#8F6E45] shadow-md shadow-[#B38E5D]/30 disabled:opacity-50 flex items-center gap-2">
                {isSubmitting ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : 'Simpan Iklan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </SidebarSuperAdmin>
  );
}