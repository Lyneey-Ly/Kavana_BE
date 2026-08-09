import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api'; 
import SidebarAdmin from '../components/SidebarAdmin';
import { API_URL } from '../config'; // sesuaikan path-nya


export default function AdminProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 1. STATE MANAGEMENT
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'security'
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [admin, setAdmin] = useState(null);
  const [rooms, setRooms] = useState([]);

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // =========================================================================
  // 🔌 FETCH DATA PROFIL & KAMAR ADMIN
  // =========================================================================
  const fetchAdminProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/profile'); 
      
      const apiAdmin = res.data?.data || res.data;
      const apiRooms = res.data?.rooms || res.data?.kamar || [];

      setAdmin(apiAdmin);
      setRooms(apiRooms);

      setFormState({
        name: apiAdmin?.name || '',
        email: apiAdmin?.email || '',
        phone: apiAdmin?.phone || '',
        password: '',
      });

      const backendPhotoUrl = apiAdmin?.foto
        ? (apiAdmin.foto.startsWith('http') 
            ? apiAdmin.foto 
            : `${import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage'}/${apiAdmin.foto}`)
        : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80";

      setPreviewAvatar(backendPhotoUrl);
    } catch (error) {
      console.error('Gagal mengambil data profil admin:', error);
      if (error.response?.status === 401) {
        alert("Sesi telah berakhir, silakan login kembali.");
        navigate('/login');
      } else {
        setErrorMessage("Gagal memuat profil admin dari server.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchAdminProfile();
    };
    load();
  }, [fetchAdminProfile]);
// =========================================================================
  // 📸 HANDLE FILE CHANGE (OTOMATIS UPLOAD SAAT PILIH FOTO)
  // =========================================================================
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran foto maksimal 2MB!");
      return;
    }

    // Tampilkan preview sementara
    setSelectedFile(file);
    setPreviewAvatar(URL.createObjectURL(file));

    // Langsung Upload ke Backend
    try {
      setSaving(true);
      setSuccessMessage("");
      setErrorMessage("");

      const payload = new FormData();
      payload.append('foto', file);
      // Jika Laravel API butuh method spoofing:
      // payload.append('_method', 'PUT');

      const res = await API.post('/admin/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMessage("Foto profil berhasil diperbarui!");
      fetchAdminProfile(); // Fetch ulang data terbaru dari DB
    } catch (error) {
      console.error('Gagal upload foto:', error);
      setErrorMessage("Gagal mengunggah foto profil baru ke server.");
    } finally {
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // =========================================================================
  // 💾 SAVE PROFILE PERBAIKAN
  // =========================================================================
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = new FormData();
      if (formState.name) payload.append('name', formState.name);
      if (formState.email) payload.append('email', formState.email);
      if (formState.phone) payload.append('phone', formState.phone);
      if (formState.password) payload.append('password', formState.password);
      if (selectedFile) payload.append('foto', selectedFile);

      // TIPS LARAVEL: Sertakan method _method PUT jika menggunakan RESTful API standar
      // payload.append('_method', 'PUT'); 

      const res = await API.post('/admin/profile', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMessage(res.data?.message || "Profil Admin berhasil diperbarui!");
      setIsEditing(false);
      setSelectedFile(null);
      
      // Reset ref file input
      if (fileInputRef.current) fileInputRef.current.value = "";

      fetchAdminProfile();

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error('Gagal update profil admin:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const detailError = Object.values(errors).flat().join('\n• ');
        setErrorMessage(`Validasi gagal:\n• ${detailError}`);
      } else {
        setErrorMessage(error.response?.data?.message || "Gagal memperbarui profil.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar dari portal Admin ini?")) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const formatRupiah = (number) => {
    if (!number) return "Rp 0";
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  return (
    <SidebarAdmin>
      <div className="w-full min-h-screen bg-[#FAF6F0] text-[#261C19] font-sans p-4 md:p-8 flex flex-col justify-between relative overflow-hidden">
        
        {/* Ambient Glow Decorative Background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#8F6E45]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto w-full space-y-6 relative z-10 flex-grow flex flex-col justify-start">
          
          {/* HEADER BAR ADMIN */}
          <header className="bg-white/90 backdrop-blur-md px-6 py-5 rounded-2xl border border-[#E5D7C5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#261C19] via-[#3D2D29] to-[#1A1311] text-[#FAF5EF] flex items-center justify-center font-black text-base tracking-widest shadow-md border border-[#C5A059]/30">
                ADM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#261C19]">
                    Kafana<span className="text-[#C5A059] font-light">Vista</span>
                  </h1>
                  <span className="bg-[#261C19] text-[#C5A059] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-[#C5A059]/40">
                    Administrator
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                  Pengelolaan kredensial admin dan daftar unit hunian yang Anda miliki.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <Link 
                to="/admin/properti" 
                className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider text-white bg-[#C5A059] hover:bg-[#b08e4a] transition px-4 py-2.5 rounded-xl shadow-md"
              >
                <span>➕</span> Tambah Unit Kamar
              </Link>
            
            </div>
          </header>

          {/* NOTIFICATION TOASTS */}
          {successMessage && (
            <div className="p-4 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white font-medium text-sm rounded-2xl shadow-xl flex justify-between items-center border border-emerald-600 animate-fade-in">
              <span className="flex items-center gap-3">✨ <strong className="font-bold">Berhasil:</strong> {successMessage}</span>
              <button onClick={() => setSuccessMessage("")} className="hover:opacity-75 text-base bg-white/10 px-2.5 py-1 rounded-lg">✕</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-gradient-to-r from-rose-800 to-rose-900 text-white font-medium text-sm rounded-2xl shadow-xl flex justify-between items-center border border-rose-600 whitespace-pre-line animate-fade-in">
              <span className="flex items-center gap-3">⚠️ <strong className="font-bold">Perhatian:</strong> {errorMessage}</span>
              <button onClick={() => setErrorMessage("")} className="hover:opacity-75 text-base bg-white/10 px-2.5 py-1 rounded-lg">✕</button>
            </div>
          )}

          {/* LOADING STATE */}
          {loading ? (
            <div className="bg-white/90 p-16 rounded-3xl border border-[#E5D7C5] text-center space-y-4 shadow-sm my-auto">
              <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 text-sm font-bold tracking-widest uppercase">Memuat Profil Admin & Daftar Kamar...</p>
            </div>
          ) : (
            
            /* GRID UTAMA */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-grow">

              {/* SISI KIRI: PROFILE CARD */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
                <div className="relative overflow-hidden bg-gradient-to-b from-[#1E1614] via-[#2A1F1D] to-[#17100E] text-[#FAF5EF] p-7 rounded-3xl border border-[#4A3B32] shadow-2xl text-center flex flex-col justify-between flex-grow">
                  
                  <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#C5A059]/20 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none"></div>

                  <div>
                    <div className="relative inline-block my-4 group">
                      <div className="p-1.5 rounded-full bg-gradient-to-tr from-[#C5A059] via-[#E5D7C5] to-[#8F6E45] shadow-xl">
                        <img 
                          src={previewAvatar} 
                          alt={admin?.name || "Admin Avatar"} 
                          className="w-32 h-32 md:w-36 md:h-36 rounded-full object-cover border-4 border-[#1E1614] transition duration-500 group-hover:scale-105"
                        />
                      </div>
                      
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 rounded-full bg-black/75 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center text-xs font-bold uppercase tracking-wider text-[#E5D7C5] gap-1.5 backdrop-blur-xs cursor-pointer border-2 border-[#C5A059]/50"
                      >
                        <span className="text-xl">📷</span>
                        <span>Ganti Foto</span>
                      </button>

                      <span className="absolute bottom-1.5 right-1.5 bg-gradient-to-r from-[#C5A059] to-[#8F6E45] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg border border-[#1E1614]">
                        {admin?.role || "Super Admin"}
                      </span>
                    </div>

                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/jpeg,image/png,image/jpg" 
                      className="hidden" 
                    />

                    <div className="space-y-1 mt-2">
                      <h2 className="text-2xl font-black tracking-tight text-white">{admin?.name}</h2>
                      <p className="text-sm text-[#E5D7C5]/70 font-medium">{admin?.email}</p>
                    </div>

                    <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#4A3B32] to-transparent"></div>

                    <div className="grid grid-cols-2 gap-3 text-left bg-black/30 p-4 rounded-2xl border border-white/5 mb-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Unit</span>
                        <span className="text-xs md:text-sm font-bold text-[#C5A059] block truncate">{rooms.length} Kamar</span>
                      </div>
                      <div className="space-y-1 border-l border-white/10 pl-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">WhatsApp Admin</span>
                        <span className="text-xs md:text-sm font-bold text-slate-200 block truncate">{admin?.phone || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setFormState({
                        name: admin?.name || '',
                        email: admin?.email || '',
                        phone: admin?.phone || '',
                        password: '',
                      });
                    }}
                    className={`w-full py-3 rounded-xl font-extrabold text-xs md:text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
                      isEditing 
                        ? 'bg-rose-900/80 hover:bg-rose-900 text-rose-100 border border-rose-700' 
                        : 'bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#9C7A3C] hover:opacity-95 text-[#1E1614]'
                    }`}
                  >
                    {isEditing ? '✕ Batal Edit' : '✏️ Edit Identitas Admin'}
                  </button>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#E5D7C5] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#FAF6F0] text-[#C5A059] flex items-center justify-center font-bold text-xl border border-[#E5D7C5]/60 shadow-inner">
                      🔑
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#261C19]">Akses Owner / Admin</h4>
                      <p className="text-xs text-slate-400 font-medium">Hak akses penuh ke manajemen kost</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
                    Active
                  </span>
                </div>
              </div>

              {/* SISI KANAN: DAFTAR KAMAR & FORM EDIT ADMIN */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
                
                {/* 1. SEKSI DAFTAR KAMAR */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2.5 bg-[#FAF6F0] rounded-2xl border border-[#E5D7C5]">🏢</span>
                      <div>
                        <span className="text-[11px] font-black text-[#C5A059] uppercase tracking-widest block">Property Portfolio</span>
                        <h3 className="text-lg md:text-xl font-extrabold text-[#261C19]">Daftar Kamar / Unit Milik Anda</h3>
                      </div>
                    </div>
                    <span className="bg-[#FAF6F0] text-[#261C19] border border-[#E5D7C5] text-xs font-bold px-3 py-1.5 rounded-full self-start sm:self-center">
                      Total: {rooms.length} Unit
                    </span>
                  </div>

                  {rooms && rooms.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[380px] overflow-y-auto pr-1">
                      {rooms.map((room) => (
                        <div key={room.id} className="bg-[#FAF6F0]/60 p-4 rounded-2xl border border-[#E5D7C5] flex flex-col justify-between space-y-3 hover:border-[#C5A059] transition">
                          <div className="flex items-start gap-3">
                            <img 
                              src={
                                room.main_image || room.main_image 
                                  ? (room.main_image?.startsWith('http') ? room.main_image : `${import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage'}/${room.main_image}`)
                                  : "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80"
                              } 
                              alt={room.nama_kamar || room.title} 
                              className="w-16 h-16 rounded-xl object-cover border border-[#E5D7C5] shrink-0"
                            />
                            <div className="overflow-hidden">
                              <h4 className="font-extrabold text-[#261C19] text-sm truncate">{room.nama_kamar || room.title}</h4>
                              <p className="text-xs text-slate-500 font-medium truncate">📍 {room.lokasi || room.address || 'Kafana Vista Complex'}</p>
                              <span className="inline-block text-xs font-extrabold text-[#C5A059] mt-1">
                                {formatRupiah(room.price_per_month)} <span className="text-[10px] font-normal text-slate-400">/bulan</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-[#E5D7C5]/50 pt-2 text-[11px]">
                            <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                              room.status === 'terisi' || room.is_occupied
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {room.status || (room.is_occupied ? 'Terisi' : 'Tersedia')}
                            </span>

                            <Link 
                              to={`/admin/kamar/edit/${room.id}`} 
                              className="font-bold text-[#261C19] hover:text-[#C5A059] underline transition"
                            >
                              Kelola Unit →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 bg-[#FAF6F0] rounded-2xl border-2 border-dashed border-[#C5A059]/40 text-center space-y-3">
                      <span className="text-3xl block">📭</span>
                      <p className="text-sm font-bold text-[#261C19]">Belum ada unit kamar yang ditambahkan.</p>
                      <p className="text-xs text-slate-500">Mulai tambahkan properti kamar Anda agar dapat disewa oleh penghuni.</p>
                      <Link 
                        to="/admin/kamar/tambah" 
                        className="inline-block text-xs font-extrabold uppercase tracking-wider bg-[#261C19] hover:bg-[#3D2D29] text-white px-5 py-2.5 rounded-xl transition shadow-md mt-2"
                      >
                        ➕ Tambah Kamar Baru
                      </Link>
                    </div>
                  )}
                </div>

                {/* 2. FORM EDIT PROFIL ADMIN */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm space-y-6 flex-grow flex flex-col justify-between">
                  
                  <div>
                    {/* TAB CONTROLLER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                      <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1.5 rounded-2xl border border-[#E5D7C5]/60 w-fit">
                        <button 
                          type="button"
                          onClick={() => setActiveTab('overview')}
                          className={`text-xs md:text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                            activeTab === 'overview' 
                              ? 'bg-[#261C19] text-white shadow-md' 
                              : 'text-slate-500 hover:text-[#261C19]'
                          }`}
                        >
                          👤 Informasi Admin
                        </button>
                        <button 
                          type="button"
                          onClick={() => setActiveTab('security')}
                          className={`text-xs md:text-sm font-bold px-4 py-2 rounded-xl transition-all ${
                            activeTab === 'security' 
                              ? 'bg-[#261C19] text-white shadow-md' 
                              : 'text-slate-500 hover:text-[#261C19]'
                          }`}
                        >
                          🔒 Kata Sandi & Akses
                        </button>
                      </div>

                      {!isEditing && (
                        <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 self-start sm:self-center">
                          ℹ️ Mode Baca (Read-Only)
                        </span>
                      )}
                    </div>

                    <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
                      
                      {/* TAB 1: INFORMASI ADMIN */}
                      {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                          
                          <div className="space-y-2">
                            <label className="text-xs font-extrabold text-[#261C19] uppercase tracking-wider block">
                              Nama Admin / Pengelola
                            </label>
                            <input 
                              type="text"
                              disabled={!isEditing}
                              value={formState.name}
                              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-[#261C19] text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] disabled:opacity-80 disabled:bg-slate-100/70 transition shadow-2xs"
                              placeholder="Masukkan nama admin"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-extrabold text-[#261C19] uppercase tracking-wider block">
                              Email Login Admin
                            </label>
                            <input 
                              type="email"
                              disabled={!isEditing}
                              value={formState.email}
                              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-[#261C19] text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] disabled:opacity-80 disabled:bg-slate-100/70 transition shadow-2xs"
                              placeholder="admin@kafana.com"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-extrabold text-[#261C19] uppercase tracking-wider block">
                              Nomor Kontak WhatsApp Pengelola
                            </label>
                            <input 
                              type="text"
                              disabled={!isEditing}
                              value={formState.phone}
                              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-[#261C19] text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] disabled:opacity-80 disabled:bg-slate-100/70 transition shadow-2xs"
                              placeholder="Cth: 081234567890"
                            />
                          </div>

                        </div>
                      )}

                      {/* TAB 2: KEAMANAN & PASSWORD */}
                      {activeTab === 'security' && (
                        <div className="space-y-5 animate-fade-in">
                          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 text-xs md:text-sm font-medium flex items-center gap-3">
                            <span className="text-lg">💡</span>
                            <span>Kosongkan kata sandi jika Anda tidak ingin mengubah password akun admin.</span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-extrabold text-[#261C19] uppercase tracking-wider block">
                              Kata Sandi Admin Baru
                            </label>
                            <input 
                              type="password"
                              disabled={!isEditing}
                              value={formState.password}
                              onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-[#261C19] text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] disabled:opacity-80 disabled:bg-slate-100/70 transition shadow-2xs"
                              placeholder={isEditing ? "Ketikkan password baru..." : "••••••••••••••••"}
                            />
                          </div>
                        </div>
                      )}

                      {/* SUBMIT BUTTON */}
                      {isEditing && (
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 animate-fade-in">
                          <button 
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setSelectedFile(null);
                            }}
                            className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs md:text-sm font-extrabold rounded-xl transition"
                          >
                            BatalA
                          </button>
                          <button 
                            type="submit"
                            disabled={saving}
                            className="bg-gradient-to-r from-[#261C19] to-[#3D2D29] hover:opacity-90 text-[#FAF5EF] px-7 py-2.5 text-xs md:text-sm font-extrabold rounded-xl transition shadow-lg disabled:opacity-50 border border-[#C5A059]/30 flex items-center gap-2"
                          >
                            {saving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              "💾 Simpan Profil Admin"
                            )}
                          </button>
                        </div>
                      )}

                    </form>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* FOOTER */}
          <footer className="pt-6 pb-2 border-t border-[#E5D7C5]/60 text-center text-xs text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} Kafana Vista - Management System</div>
            <div>Admin Control Panel</div>
          </footer>

        </div>
      </div>
    </SidebarAdmin>
  );
}