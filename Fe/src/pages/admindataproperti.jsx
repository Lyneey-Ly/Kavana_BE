  import { useState, useEffect, useCallback } from 'react';
  import API from '../api'; // Pastikan path ini sesuai
  import SidebarAdmin from '../components/SidebarAdmin';
  import Swal from 'sweetalert2';

  export default function AdminDataProperti() {
    // 1. STATE DATA & LOADING
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // 2. STATE UNTUK MODAL PROPERTI (CREATE & UPDATE)
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Foto Utama
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Foto Galeri / Ruangan (Multiple)
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);

    // 🌟 FORM DATA (Sudah ditambah public_facilities & rules)
    const [formData, setFormData] = useState({
      id: null,
      title: '',
      type: 'Kost',
      gender_type: 'male',
      price_per_month: '',
      address: '',
      facilities: '',
      public_facilities: '', // 👈 Baru
      rules: '',             // 👈 Baru
      description: '',
      status: 'Tersedia',
      main_image: ''
    });

    // 3. STATE UNTUK MODAL KELOLA UNIT KAMAR
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [unitKamars, setUnitKamars] = useState([]);
    const [newRoomNumber, setNewRoomNumber] = useState('');
    const [loadingRooms, setLoadingRooms] = useState(false);

    // Fetch Data dari API Backend (READ)
    const fetchProperties = useCallback(async () => {
      try {
        setLoading(true);
        const res = await API.get('/admin/properties');
        setRooms(res.data.data || res.data || []);
      } catch (err) {
        console.error('Gagal mengambil data properti:', err);
        Swal.fire({
          icon: 'error',
          title: 'Koneksi Gagal',
          text: 'Gagal mengambil data properti dari server.'
        });
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      fetchProperties();
    }, [fetchProperties]);

    const NO_IMAGE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='3' width='18' height='18' rx='2' ry='2'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";

    const getImageUrl = (imagePath) => {
      if (!imagePath) return NO_IMAGE_PLACEHOLDER;
      if (typeof imagePath !== 'string') return NO_IMAGE_PLACEHOLDER;
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) return imagePath;
      
      const cleanPath = imagePath.replace(/^\/?storage\//, '');
      return `http://127.0.0.1:8000/storage/${cleanPath}`;
    };

    const handleOpenAdd = () => {
      setFormData({
        id: null,
        title: '',
        type: 'Kost',
        gender_type: 'male',
        price_per_month: '',
        address: '',
        facilities: '',
        public_facilities: '',
        rules: '',
        description: '',
        status: 'Tersedia',
        main_image: ''
      });
      setImageFile(null);
      setImagePreview(null);
      setGalleryFiles([]);
      setGalleryPreviews([]);
      setIsModalOpen(true);
    };

    const handleOpenEdit = (room) => {
      setFormData({
        id: room.id,
        title: room.title || '',
        type: room.type || 'Kost',
        gender_type: room.gender_type || 'male',
        price_per_month: room.price_per_month || '',
        address: room.address || '',
        facilities: room.facilities || '',
        public_facilities: room.public_facilities || room.fasilitas_bersama || '',
        rules: room.rules || room.aturan || room.aturan_kos || '',
        description: room.description || '',
        status: room.status || 'Tersedia',
        main_image: room.main_image || ''
      });
      setImageFile(null);
      setImagePreview(room.main_image ? getImageUrl(room.main_image) : null);
      
      // Parse galeri foto (Mencegah error jika backend mengirim JSON String)
      setGalleryFiles([]);
      let rawGallery = room.gallery_images || room.images || room.galleries || [];
      
      if (typeof rawGallery === 'string') {
        try {
          rawGallery = JSON.parse(rawGallery);
        } catch (e) {
          rawGallery = [];
        }
      }

      if (Array.isArray(rawGallery)) {
        setGalleryPreviews(rawGallery.map(img => getImageUrl(img.image_path || img.image || img)));
      } else {
        setGalleryPreviews([]);
      }

      setIsModalOpen(true);
    };

    const handleChange = (e) => {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handler Foto Utama
    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
      }
    };

    // Handler Foto Galeri (Multiple)
    const handleGalleryChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        setGalleryFiles(files);
        const newPreviews = files.map(file => URL.createObjectURL(file));
        setGalleryPreviews(newPreviews);
      }
    };

    // Hapus satu preview foto dari pilihan galeri baru
    const handleRemoveGalleryPreview = (indexToRemove) => {
      setGalleryFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
      setGalleryPreviews(prev => prev.filter((_, idx) => idx !== indexToRemove));
    };

    // Hapus Properti
    const handleDelete = async (id) => {
      const result = await Swal.fire({
        title: 'Hapus Properti?',
        text: "Data properti beserta seluruh unit kamarnya akan dihapus permanen!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#B38E5D',
        cancelButtonColor: '#e11d48',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        try {
          await API.delete(`/admin/properties/${id}`);
          setRooms(rooms.filter(room => room.id !== id));
          
          Swal.fire({
            title: 'Terhapus!',
            text: 'Data properti berhasil dihapus.',
            icon: 'success',
            confirmButtonColor: '#B38E5D'
          });
        } catch (err) {
          console.error("Gagal menghapus properti:", err);
          Swal.fire({
            title: 'Gagal!',
            text: 'Gagal menghapus data. Pastikan Anda memiliki hak akses admin.',
            icon: 'error',
            confirmButtonColor: '#B38E5D'
          });
        }
      }
    };

    // Submit Properti
    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);

      const data = new FormData();
      data.append('title', formData.title);
      data.append('type', formData.type);
      data.append('gender_type', formData.gender_type);
      data.append('price_per_month', formData.price_per_month);
      data.append('address', formData.address);
      data.append('facilities', formData.facilities || '');
      data.append('public_facilities', formData.public_facilities || ''); // 👈 Ditambahkan
      data.append('rules', formData.rules || '');                         // 👈 Ditambahkan
      data.append('description', formData.description || '');
      data.append('status', formData.status);

      // Foto Utama
      if (imageFile) {
        data.append('main_image', imageFile);
      }

      // Foto Galeri / Ruangan Banyak
      if (galleryFiles.length > 0) {
        galleryFiles.forEach((file) => {
          data.append('gallery_images[]', file);
        });
      }

      try {
        if (formData.id) {
          data.append('_method', 'PUT');
          await API.post(`/admin/properties/${formData.id}`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          await API.post('/admin/properties', data, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        }

        setIsModalOpen(false);
        fetchProperties();
        
        Swal.fire({
          title: 'Berhasil!',
          text: 'Data properti berhasil disimpan.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error("Gagal menyimpan data properti:", err);
        Swal.fire({
          title: 'Gagal Menyimpan',
          text: err.response?.data?.message || "Terjadi kesalahan saat menyimpan data.",
          icon: 'error',
          confirmButtonColor: '#B38E5D'
        });
      } finally {
        setSubmitting(false);
      }
    };

    // ================= LOGIK KELOLA UNIT KAMAR =================
    const handleOpenRoomModal = async (property) => {
      setSelectedProperty(property);
      setIsRoomModalOpen(true);
      setLoadingRooms(true);
      try {
        const res = await API.get(`/admin/properties/${property.id}/rooms`);
        setUnitKamars(res.data.data || res.data || property.kamars || []);
      } catch (err) {
        setUnitKamars(property.kamars || []);
      } finally {
        setLoadingRooms(false);
      }
    };

    const handleAddUnitRoom = async (e) => {
      e.preventDefault();
      if (!newRoomNumber.trim()) return;

      try {
        const res = await API.post(`/admin/properties/${selectedProperty.id}/rooms`, {
          nomor_kamar: newRoomNumber,
          status: 'kosong'
        });
        
        const addedRoom = res.data.data || res.data;
        setUnitKamars([...unitKamars, addedRoom]);
        setNewRoomNumber('');
        fetchProperties(); 
        
        Swal.fire({
          title: 'Kamar Ditambahkan',
          text: `Kamar ${newRoomNumber} berhasil ditambah`,
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000
        });
      } catch (err) {
        Swal.fire({
          title: 'Gagal',
          text: err.response?.data?.message || "Gagal menambah unit kamar.",
          icon: 'error',
          confirmButtonColor: '#B38E5D'
        });
      }
    };

    const handleToggleRoomStatus = async (roomId, currentStatus) => {
      const nextStatus = currentStatus === 'Tersedia' ? 'Terisi' : 'Tersedia';
      try {
        await API.put(`/admin/rooms/${roomId}`, { status: nextStatus });
        setUnitKamars(unitKamars.map(r => r.id === roomId ? { ...r, status: nextStatus } : r));
        fetchProperties();
        
        Swal.fire({
          title: 'Status Diperbarui',
          icon: 'success',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500
        });
      } catch (err) {
        Swal.fire({
          title: 'Gagal',
          text: "Gagal mengubah status unit kamar.",
          icon: 'error',
          confirmButtonColor: '#B38E5D'
        });
      }
    };

    const handleDeleteUnitRoom = async (roomId) => {
      const result = await Swal.fire({
        title: 'Hapus kamar ini?',
        text: "Data tidak bisa dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#B38E5D',
        cancelButtonColor: '#e11d48',
        confirmButtonText: 'Hapus',
        cancelButtonText: 'Batal',
        toast: true,
        position: 'center'
      });

      if (result.isConfirmed) {
        try {
          await API.delete(`/admin/rooms/${roomId}`);
          setUnitKamars(unitKamars.filter(r => r.id !== roomId));
          fetchProperties();
          
          Swal.fire({
            title: 'Terhapus!',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 1500
          });
        } catch (err) {
          Swal.fire({
            title: 'Gagal!',
            text: "Gagal menghapus unit kamar.",
            icon: 'error',
            confirmButtonColor: '#B38E5D'
          });
        }
      }
    };

    const renderGenderLabel = (type) => {
      switch(type) {
        case 'male': return 'Putra';
        case 'female': return 'Putri';
        case 'mixed': return 'Campur';
        default: return type;
      }
    };

    const formatRupiah = (angka) => {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka || 0);
    };

    return (
      <SidebarAdmin>
        <div className="flex h-screen bg-[#FAF5EF] font-sans text-slate-800 overflow-hidden relative">
          
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8">
              
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Data Kamar / Properti</h1>
                  <p className="text-slate-500 mt-1">Kelola data properti dan nomor unit kamar langsung dari backend.</p>
                </div>
                
                <button 
                  onClick={handleOpenAdd}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-[#B38E5D]/30 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  <span>Tambah Properti Baru</span>
                </button>
              </div>

              {/* TABEL DATA PROPERTI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#FAF5EF] text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Foto</th>
                        <th className="px-6 py-4">Nama Properti</th>
                        <th className="px-6 py-4">Tipe / Gender</th>
                        <th className="px-6 py-4">Unit Kamar</th>
                        <th className="px-6 py-4">Harga / Bln</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-slate-400">Memuat data dari database...</td>
                        </tr>
                      ) : rooms.length > 0 ? (
                        rooms.map((room) => (
                          <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <img 
                                src={getImageUrl(room.main_image)} 
                                alt={room.title}
                                className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-100"
                                onError={(e) => { e.target.onerror = null; e.target.src = NO_IMAGE_PLACEHOLDER; }}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-800">{room.title}</p>
                              <span className="text-xs text-slate-400 max-w-[150px] truncate block">{room.address}</span>
                            </td>
                            <td className="px-6 py-4 text-slate-600">
                              <span className="font-semibold">{room.type}</span> ({renderGenderLabel(room.gender_type)})
                            </td>
                            
                            {/* TOMBOL KELOLA KAMAR */}
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleOpenRoomModal(room)}
                                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#B38E5D] border border-amber-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                <span>Kelola ({room.kamars?.length || ''} Kamar)</span>
                              </button>
                            </td>

                            <td className="px-6 py-4 font-semibold text-[#B38E5D]">{formatRupiah(room.price_per_month)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                                room.status === 'Tersedia' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {room.status || 'Tersedia'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleOpenEdit(room)} className="p-2 text-slate-400 hover:text-[#B38E5D] rounded transition-colors cursor-pointer" title="Edit">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                </button>
                                <button onClick={() => handleDelete(room.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer" title="Hapus">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-6 py-8 text-center text-slate-400">Belum ada data kamar/properti. Silakan tambah data baru.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </main>

          {/* ================= MODAL EDIT/TAMBAH PROPERTI ================= */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
                
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FAF5EF]">
                  <h3 className="text-lg font-bold text-slate-800">
                    {formData.id ? 'Edit Data Properti' : 'Tambah Properti Baru'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                  {/* 1. FOTO UTAMA PROPERTI */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Utama Properti</label>
                    {imagePreview && (
                      <div className="mb-2 relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                        <img src={imagePreview} alt="Preview Utama" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm text-slate-500 cursor-pointer" />
                  </div>

                  {/* 2. FOTO GALERI / RUANGAN TAMBAHAN (MULTIPLE) */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Foto Galeri / Ruangan (Bisa Pilih Banyak)
                    </label>
                    
                    {/* Grid Preview Galeri */}
                    {galleryPreviews.length > 0 && (
                      <div className="mb-2 grid grid-cols-4 gap-2 border border-slate-200 p-2 rounded-lg bg-slate-50 max-h-36 overflow-y-auto">
                        {galleryPreviews.map((src, idx) => (
                          <div key={idx} className="relative group w-full h-16 rounded-md overflow-hidden border border-slate-200">
                            <img src={src} alt={`Preview Galeri ${idx + 1}`} className="w-full h-full object-cover" />
                            {galleryFiles.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveGalleryPreview(idx)}
                                className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition cursor-pointer"
                                title="Hapus gambar ini"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <input 
                      type="file" 
                      multiple 
                      accept="image/*" 
                      onChange={handleGalleryChange} 
                      className="w-full text-sm text-slate-500 cursor-pointer" 
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      *Tahan tombol <b>Ctrl</b> atau <b>Shift</b> saat memilih gambar untuk mengunggah lebih dari satu foto sekaligus.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nama / Judul Properti</label>
                    <input required type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Contoh: Kost Executive Dipatiukur" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Kategori</label>
                      <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm cursor-pointer">
                        <option value="Kost">Kost</option>
                        <option value="Kontrakan">Kontrakan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
                      <select name="gender_type" value={formData.gender_type} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm cursor-pointer">
                        <option value="male">Putra</option>
                        <option value="female">Putri</option>
                        <option value="mixed">Campur</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Harga / Bln (Rp)</label>
                      <input required type="number" name="price_per_month" value={formData.price_per_month} onChange={handleChange} placeholder="1500000" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Status Properti</label>
                      <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm cursor-pointer">
                        <option value="Tersedia">Tersedia</option>
                        <option value="Terisi Penuh">Terisi Penuh</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Alamat Lengkap</label>
                    <input required type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Jl. Dipatiukur No. 45" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Deskripsi Properti</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="2" placeholder="Deskripsi lengkap mengenai lingkungan, kenyamanan, dll..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"></textarea>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fasilitas Kamar (Utama)</label>
                    <textarea name="facilities" value={formData.facilities} onChange={handleChange} rows="2" placeholder="Contoh: AC, Kasur Springbed, Meja Belajar, Lemari Baju, Kamar Mandi Dalam" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"></textarea>
                    <p className="text-[11px] text-slate-400 mt-0.5">*Pisahkan dengan koma (,)</p>
                  </div>

                  {/* 🌟 INPUT BARU: FASILITAS BERSAMA */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Fasilitas Bersama</label>
                    <textarea name="public_facilities" value={formData.public_facilities} onChange={handleChange} rows="2" placeholder="Contoh: WiFi, Dapur Bersama, Kulkas, Parkiran Motor, Ruang Tamu" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"></textarea>
                    <p className="text-[11px] text-slate-400 mt-0.5">*Pisahkan dengan koma (,)</p>
                  </div>

                  {/* 🌟 INPUT BARU: ATURAN KOS */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Aturan Kos / Properti</label>
                    <textarea name="rules" value={formData.rules} onChange={handleChange} rows="2" placeholder="Contoh: Jam bertamu s/d jam 22.00, Dilarang merokok di dalam kamar, Dilarang membawa hewan peliharaan" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"></textarea>
                    <p className="text-[11px] text-slate-400 mt-0.5">*Pisahkan dengan koma (,)</p>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-200">
                      Batal
                    </button>
                    <button disabled={submitting} type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-[#B38E5D] hover:bg-[#8F6E45] rounded-lg disabled:opacity-50 cursor-pointer">
                      {submitting ? 'Menyimpan...' : 'Simpan Data'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ================= MODAL KELOLA UNIT KAMAR ================= */}
          {isRoomModalOpen && selectedProperty && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden my-8 max-h-[85vh] flex flex-col">
                
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-[#FAF5EF]">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Unit Kamar - {selectedProperty.title}</h3>
                    <p className="text-xs text-slate-500">Tambah / ubah ketersediaan nomor kamar</p>
                  </div>
                  <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-5">
                  <form onSubmit={handleAddUnitRoom} className="flex gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Nomor Kamar (misal: Kamar 01)"
                      value={newRoomNumber}
                      onChange={(e) => setNewRoomNumber(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    />
                    <button type="submit" className="px-4 py-2 bg-[#B38E5D] text-white font-bold text-sm rounded-lg hover:bg-[#8F6E45] cursor-pointer">
                      + Tambah
                    </button>
                  </form>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Daftar Kamar ({unitKamars.length}):</p>
                    
                    {loadingRooms ? (
                      <p className="text-xs text-center text-slate-400 py-4">Memuat unit kamar...</p>
                    ) : unitKamars.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {unitKamars.map((kamar, idx) => (
                          <div key={kamar.id || idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                            <span className="font-bold text-slate-700">{kamar.nomor_kamar || kamar.nama_kamar || `Kamar ${idx + 1}`}</span>
                            
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleRoomStatus(kamar.id, kamar.status)}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                                  kamar.status === 'Terisi' 
                                    ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' 
                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                }`}
                              >
                                {kamar.status || 'Tersedia'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteUnitRoom(kamar.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-center text-slate-400 py-4 border border-dashed rounded-lg">Belum ada unit kamar. Tambahkan lewat form di atas.</p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setIsRoomModalOpen(false)} className="px-4 py-2 text-xs font-bold bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 cursor-pointer">
                    Selesai
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </SidebarAdmin>
    );
  }