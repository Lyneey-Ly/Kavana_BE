import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config'; // sesuaikan path-nya
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // 👈 Import SweetAlert2
import API from '../api'; 
import SidebarUser from '../components/SidebarUser';

export default function UserProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 1. STATE MANAGEMENT
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'security'
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Data dari API Backend
  const [user, setUser] = useState(null);
  const [rentStatus, setRentStatus] = useState(null);

  // Form State untuk Edit Data
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  // State untuk File Foto Avatar Upload & Preview
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewAvatar, setPreviewAvatar] = useState(null);

  // =========================================================================
  // 🔌 FETCH DATA PROFIL
  // =========================================================================
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get('/profile');
      const apiUser = res.data.data;
      const apiSewa = res.data.status_sewa;

      setUser(apiUser);
      setRentStatus(apiSewa);

      setFormState({
        name: apiUser?.name || '',
        email: apiUser?.email || '',
        phone: apiUser?.phone || '',
        password: '',
      });

      // Tambahkan timestamp agar browser memuat foto terbaru (Bypass Cache)
      const timestamp = new Date().getTime();
      const backendPhotoUrl = apiUser?.foto
        ? (apiUser.foto.startsWith('http') 
            ? `${apiUser.foto}?t=${timestamp}` 
            : `${import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage'}/${apiUser.foto}?t=${timestamp}`)
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80";

      setPreviewAvatar(backendPhotoUrl);
    } catch (error) {
      console.error('Gagal mengambil data profil:', error);
      if (error.response?.status === 401) {
        Swal.fire({
          title: 'Sesi Berakhir',
          text: 'Sesi Anda telah berakhir, silakan login kembali.',
          icon: 'warning',
          confirmButtonColor: '#261C19'
        }).then(() => {
          navigate('/login');
        });
      } else {
        setErrorMessage("Gagal memuat profil dari server.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Handle Perubahan File Foto Profil dengan SweetAlert2
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'Ukuran File Terlalu Besar',
          text: 'Ukuran foto maksimal yang diperbolehkan adalah 2MB!',
          confirmButtonColor: '#261C19',
        });
        return;
      }
      setSelectedFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  // =========================================================================
  // 💾 SIMPAN PERUBAHAN PROFIL
  // =========================================================================
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = new FormData();
      
      payload.append('name', formState.name || '');
      payload.append('email', formState.email || '');
      payload.append('phone', formState.phone ?? '');

      if (formState.password && formState.password.trim() !== '') {
        payload.append('password', formState.password);
      }

      if (selectedFile) {
        payload.append('foto', selectedFile);
      }

      const res = await API.post('/profile/update', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const message = res.data?.message || "Profil Anda berhasil diperbarui!";
      setSuccessMessage(message);
      setIsEditing(false);
      setSelectedFile(null);
      
      // SweetAlert2 Notifikasi Sukses
      Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: message,
        timer: 2000,
        showConfirmButton: false
      });

      // Refresh data profil setelah simpan
      await fetchUserProfile();

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error('Gagal update profil:', error);
      let errMsg = "Gagal memperbarui profil.";
      
      if (error.response?.data?.errors) {
        const detailError = Object.values(error.response.data.errors).flat().join('\n• ');
        errMsg = `Validasi gagal:\n• ${detailError}`;
      } else if (error.response?.data?.message) {
        errMsg = error.response.data.message;
      }

      setErrorMessage(errMsg);

      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: errMsg,
        confirmButtonColor: '#261C19'
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle Logout dengan Konfirmasi SweetAlert2
  const handleLogout = () => {
    Swal.fire({
      title: 'Konfirmasi Keluar',
      text: 'Apakah Anda yakin ingin keluar dari sesi ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#261C19',
      cancelButtonColor: '#6e7881',
      confirmButtonText: 'Ya, Keluar!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        
        Swal.fire({
          icon: 'success',
          title: 'Berhasil Keluar',
          text: 'Anda telah keluar dari sistem.',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/login');
        });
      }
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <SidebarUser>
      <div className="w-full min-h-screen bg-[#FAF6F0] text-[#261C19] font-sans p-4 md:p-8 flex flex-col justify-between relative overflow-hidden">
        
        {/* Dekorasi Ambient Glow Latar Belakang */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#8F6E45]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto w-full space-y-6 relative z-10 flex-grow flex flex-col justify-start">
          
          {/* HEADER BAR */}
          <header className="bg-white/90 backdrop-blur-md px-6 py-5 rounded-2xl border border-[#E5D7C5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#261C19] via-[#3D2D29] to-[#1A1311] text-[#FAF5EF] flex items-center justify-center font-black text-base tracking-widest shadow-md border border-[#C5A059]/30">
                KV
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#261C19]">
                    Kafana<span className="text-[#C5A059] font-light">Vista</span>
                  </h1>
                  <span className="bg-[#C5A059]/15 text-[#9C7A3C] text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-[#C5A059]/30">
                    Resident Portal
                  </span>
                </div>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                  Kelola identitas akun, keamanan, dan monitoring portofolio hunian Anda.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center">
              <Link 
                to="/home" 
                className="flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider text-[#261C19] hover:text-[#C5A059] transition bg-slate-100 hover:bg-[#E5D7C5]/40 px-4 py-2.5 rounded-xl border border-slate-200/80"
              >
                <span>🔍</span> Eksplor Hunian
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
              <p className="text-slate-600 text-sm font-bold tracking-widest uppercase">Memuat Portofolio & Profil...</p>
            </div>
          ) : (
            
            /* GRID UTAMA */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-grow">

              {/* SISI KIRI: PROFILE CARD (Col 4) */}
              <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
                
                <div className="relative overflow-hidden bg-gradient-to-b from-[#1E1614] via-[#2A1F1D] to-[#17100E] text-[#FAF5EF] p-7 rounded-3xl border border-[#4A3B32] shadow-2xl text-center flex flex-col justify-between flex-grow">
                  
                  <div className="absolute -top-16 -left-16 w-48 h-48 bg-[#C5A059]/20 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-[#C5A059]/15 rounded-full blur-3xl pointer-events-none"></div>

                  <div>
                    {/* AVATAR DISPLAY */}
                    <div className="relative inline-block my-4 group">
                      <div className="p-1.5 rounded-full bg-gradient-to-tr from-[#C5A059] via-[#E5D7C5] to-[#8F6E45] shadow-xl">
                        <img 
                          src={previewAvatar} 
                          alt={user?.name || "User Avatar"} 
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
                        {user?.role || "VIP Member"}
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
                      <h2 className="text-2xl font-black tracking-tight text-white">{user?.name}</h2>
                      <p className="text-sm text-[#E5D7C5]/70 font-medium">{user?.email}</p>
                    </div>

                    <div className="my-6 h-px bg-gradient-to-r from-transparent via-[#4A3B32] to-transparent"></div>

                    <div className="grid grid-cols-2 gap-3 text-left bg-black/30 p-4 rounded-2xl border border-white/5 mb-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Bergabung Sejak</span>
                        <span className="text-xs md:text-sm font-bold text-[#C5A059] block truncate">{formatDate(user?.created_at)}</span>
                      </div>
                      <div className="space-y-1 border-l border-white/10 pl-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">WhatsApp</span>
                        <span className="text-xs md:text-sm font-bold text-slate-200 block truncate">{user?.phone || "-"}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsEditing(!isEditing);
                      setFormState({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        password: '',
                      });
                    }}
                    className={`w-full py-3 rounded-xl font-extrabold text-xs md:text-sm uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                      isEditing 
                        ? 'bg-rose-900/80 hover:bg-rose-900 text-rose-100 border border-rose-700' 
                        : 'bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#9C7A3C] hover:opacity-95 text-[#1E1614]'
                    }`}
                  >
                    {isEditing ? '✕ Batal Edit' : '✏️ Edit Identitas Akun'}
                  </button>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-[#E5D7C5] shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#FAF6F0] text-[#C5A059] flex items-center justify-center font-bold text-xl border border-[#E5D7C5]/60 shadow-inner">
                      🛡️
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#261C19]">Proteksi Akun Aktif</h4>
                      <p className="text-xs text-slate-400 font-medium">Sanctum Token & End-to-End Encrypted</p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                    Aman
                  </span>
                </div>

              </div>

              {/* SISI KANAN: STATUS SEWA & FORM EDIT (Col 8) */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-6">
                
                {/* KARTU STATUS HUNIAN */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm transition hover:shadow-md space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2.5 bg-[#FAF6F0] rounded-2xl border border-[#E5D7C5]">🏡</span>
                      <div>
                        <span className="text-[11px] font-black text-[#C5A059] uppercase tracking-widest block">Active Residential Pass</span>
                        <h3 className="text-lg md:text-xl font-extrabold text-[#261C19]">Status Hunian Berjalan</h3>
                      </div>
                    </div>
                    <span className={`self-start sm:self-center text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xs ${
                      rentStatus?.is_renting 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {rentStatus?.keterangan || 'Tidak Ada Sewa'}
                    </span>
                  </div>

                  {rentStatus?.is_renting ? (
                    <div className="bg-gradient-to-br from-[#FAF6F0] via-white to-[#FAF6F0] p-6 rounded-2xl border border-[#E5D7C5] shadow-inner flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="space-y-2.5 flex-grow">
                        <div className="inline-block bg-[#261C19] text-[#E5D7C5] text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                          Verified Resident
                        </div>
                        <h4 className="text-lg md:text-xl font-black text-[#261C19]">{rentStatus?.title}</h4>
                        <p className="text-xs md:text-sm text-slate-600 flex items-center gap-1.5">
                          📍 {rentStatus?.address}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 shadow-2xs">
                            Check-in: <strong className="text-[#261C19] font-bold">{formatDate(rentStatus?.check_in_date)}</strong>
                          </div>
                          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs text-slate-600 shadow-2xs">
                            Durasi: <strong className="text-[#C5A059] font-bold">{rentStatus?.duration_months}</strong>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col gap-2.5 w-full md:w-44 shrink-0">
                        <Link 
                          to="/FinanceTracker" 
                          className="text-center text-xs font-extrabold uppercase tracking-wider bg-[#261C19] hover:bg-[#3D2D29] text-white px-4 py-3 rounded-xl transition shadow-md block w-full"
                        >
                          💳 FinanceTracker
                        </Link>
                        <Link 
                          to="/carihunian" 
                          className="text-center text-xs font-extrabold uppercase tracking-wider border border-slate-300 hover:bg-slate-100 text-[#261C19] px-4 py-3 rounded-xl transition block w-full"
                        >
                          Cari Unit Lain
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-gradient-to-r from-[#FAF6F0] via-white to-[#FAF6F0] rounded-2xl border-2 border-dashed border-[#C5A059]/40 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                      <div className="space-y-1.5 max-w-lg">
                        <span className="text-xs font-extrabold text-[#C5A059] uppercase tracking-widest">Kafana Exclusive</span>
                        <h4 className="text-base md:text-lg font-black text-[#261C19]">Belum Ada Unit Hunian yang Diaktifkan</h4>
                        <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                          Nikmati pengalaman tinggal di kost eksklusif dengan fasilitas lengkap, keamanan kelas atas, dan kenyamanan layaknya boutique hotel.
                        </p>
                      </div>
                      <Link 
                        to="/beranda" 
                        className="text-xs md:text-sm font-extrabold uppercase tracking-wider bg-gradient-to-r from-[#261C19] to-[#3D2D29] hover:opacity-90 text-[#FAF5EF] px-6 py-3.5 rounded-xl transition shadow-xl whitespace-nowrap active:scale-95 shrink-0 border border-[#C5A059]/30"
                      >
                        ⚡ Jelajahi Katalog Unit
                      </Link>
                    </div>
                  )}
                </div>

                {/* FORM DATA DIRI & KEAMANAN */}
                <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm space-y-6 flex-grow flex flex-col justify-between">
                  
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
                      <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1.5 rounded-2xl border border-[#E5D7C5]/60 w-fit">
                        <button 
                          type="button"
                          onClick={() => setActiveTab('overview')}
                          className={`text-xs md:text-sm font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'overview' 
                              ? 'bg-[#261C19] text-white shadow-md' 
                              : 'text-slate-500 hover:text-[#261C19]'
                          }`}
                        >
                          👤 Informasi Identitas
                        </button>
                        <button 
                          type="button"
                          onClick={() => setActiveTab('security')}
                          className={`text-xs md:text-sm font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                            activeTab === 'security' 
                              ? 'bg-[#261C19] text-white shadow-md' 
                              : 'text-slate-500 hover:text-[#261C19]'
                          }`}
                        >
                          🔒 Kata Sandi & Keamanan
                        </button>
                      </div>

                      {!isEditing && (
                        <span className="text-xs text-slate-400 font-semibold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60 self-start sm:self-center">
                          ℹ️ Mode Baca (Read-Only)
                        </span>
                      )}
                    </div>

                    <form onSubmit={handleSaveProfile} className="mt-6 space-y-6">
                      
                      {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                          
                          <div className="space-y-2">
                            <label className="text-xs font-extrabold text-[#261C19] uppercase tracking-wider block">
                              Nama Lengkap
                            </label>
                            <input 
                              type="text"
                              disabled={!isEditing}
                              value={formState.name}
                              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-[#261C19] text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] disabled:opacity-80 disabled:bg-slate-100/70 transition shadow-2xs"
                              placeholder="Masukkan nama lengkap Anda"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-extrabold text-[#261C19] uppercase tracking-wider block">
                              Alamat Email Terdaftar
                            </label>
                            <input 
                              type="email"
                              disabled={!isEditing}
                              value={formState.email}
                              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-[#261C19] text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] disabled:opacity-80 disabled:bg-slate-100/70 transition shadow-2xs"
                              placeholder="email@domain.com"
                            />
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-extrabold text-[#261C19] uppercase tracking-wider block">
                              Nomor WhatsApp / Telepon Aktif
                            </label>
                            <input 
                              type="text"
                              disabled={!isEditing}
                              value={formState.phone}
                              onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-[#261C19] text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] disabled:opacity-80 disabled:bg-slate-100/70 transition shadow-2xs"
                              placeholder="Cth: 081234567890"
                            />
                            <p className="text-[11px] text-slate-400 font-medium">
                              *Nomor ini akan digunakan oleh pengelola untuk notifikasi darurat dan koordinasi hunian.
                            </p>
                          </div>

                        </div>
                      )}

                      {activeTab === 'security' && (
                        <div className="space-y-5 animate-fade-in">
                          <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-amber-900 text-xs md:text-sm font-medium flex items-center gap-3">
                            <span className="text-lg">💡</span>
                            <span>Biarkan kolom kata sandi tetap kosong apabila Anda tidak bermaksud untuk mengganti password lama Anda.</span>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-extrabold text-[#261C19] uppercase tracking-wider block">
                              Kata Sandi Baru (New Password)
                            </label>
                            <input 
                              type="password"
                              disabled={!isEditing}
                              value={formState.password}
                              onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-[#261C19] text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C5A059] disabled:opacity-80 disabled:bg-slate-100/70 transition shadow-2xs"
                              placeholder={isEditing ? "Ketikkan minimal 8 karakter..." : "••••••••••••••••"}
                            />
                          </div>
                        </div>
                      )}

                      {isEditing && (
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 animate-fade-in">
                          <button 
                            type="button"
                            onClick={() => {
                              setIsEditing(false);
                              setSelectedFile(null);
                            }}
                            className="px-5 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs md:text-sm font-extrabold rounded-xl transition cursor-pointer"
                          >
                            Batal
                          </button>
                          <button 
                            type="submit"
                            disabled={saving}
                            className="bg-gradient-to-r from-[#261C19] to-[#3D2D29] hover:opacity-90 text-[#FAF5EF] px-7 py-2.5 text-xs md:text-sm font-extrabold rounded-xl transition shadow-lg disabled:opacity-50 border border-[#C5A059]/30 flex items-center gap-2 cursor-pointer"
                          >
                            {saving ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Menyimpan...</span>
                              </>
                            ) : (
                              "💾 Simpan Perubahan"
                            )}
                          </button>
                        </div>
                      )}

                    </form>
                  </div>

                  {!isEditing && (
                    <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-base block">⚡</span>
                        <span className="text-[11px] font-bold text-[#261C19] mt-1 block">Layanan Prioritas</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-base block">🛠️</span>
                        <span className="text-[11px] font-bold text-[#261C19] mt-1 block">Maintenance 24/7</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-base block">☕</span>
                        <span className="text-[11px] font-bold text-[#261C19] mt-1 block">Akses Lounge/Cafe</span>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}

          {/* FOOTER */}
          <footer className="pt-6 pb-2 border-t border-[#E5D7C5]/60 text-center text-xs text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>
              © 2026 <span className="font-bold text-[#261C19]">Kafana Vista Residence</span>. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Service</span>
              <span>•</span>
              <span>Security</span>
            </div>
          </footer>

        </div>
      </div>
    </SidebarUser>
  );
}