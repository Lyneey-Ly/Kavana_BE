import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import Swal from 'sweetalert2';

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

  const fromBooking = location.state?.fromBooking;
  const bookingData = location.state?.bookingData;

  // State Form Input
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [role, setRole] = useState('user');
  const [agreeTerms, setAgreeTerms] = useState(false); // 🌟 State Ceklis Kebijakan

  // State UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Helper untuk Memeriksa Kekuatan Password
  const getPasswordStrength = (pass) => {
    if (!pass) return { strength: 0, label: '', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { strength: 25, label: 'Lemah', color: 'bg-rose-500' };
    if (score === 2) return { strength: 50, label: 'Cukup', color: 'bg-amber-500' };
    if (score === 3) return { strength: 75, label: 'Baik', color: 'bg-blue-500' };
    return { strength: 100, label: 'Kuat', color: 'bg-[#B38E5D]' };
  };

  const passStrength = getPasswordStrength(password);

  // Handle Form Submit
  const handleRegister = async (e) => {
    e.preventDefault();

    // 🌟 Validasi SweetAlert - Ceklis Kebijakan Wajib Centang
    if (!agreeTerms) {
      Swal.fire({
        icon: 'warning',
        title: 'Persetujuan Diperlukan',
        text: 'Anda wajib menyetujui Syarat & Ketentuan serta Kebijakan Privasi Kafana Vista untuk melanjutkan pendaftaran.',
        confirmButtonColor: '#261C19',
        customClass: { popup: 'rounded-2xl' }
      });
      return;
    }

    // 🌟 Validasi SweetAlert - Password Sesuai
    if (password !== passwordConfirmation) {
      Swal.fire({
        icon: 'warning',
        title: 'Kata Sandi Tidak Sesuai',
        text: 'Pastikan konfirmasi kata sandi Anda sama persis dengan kata sandi yang dimasukkan.',
        confirmButtonColor: '#261C19',
        customClass: { popup: 'rounded-2xl' }
      });
      return;
    }

    // 🌟 Validasi SweetAlert - Panjang Password
    if (password.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'Kata Sandi Terlalu Pendek',
        text: 'Kata sandi minimal terdiri dari 6 karakter demi keamanan akun Anda.',
        confirmButtonColor: '#261C19',
        customClass: { popup: 'rounded-2xl' }
      });
      return;
    }

    setLoading(true);

    try {
      const res = await API.post('/customer/register', {
        name,
        email,
        phone,
        password,
        password_confirmation: passwordConfirmation,
        role,
      });

      const token = res.data.token || res.data.access_token;
      const user = res.data.user;

      if (token) {
        sessionStorage.setItem('token', token);
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user));
      }

      // 🌟 PERBAIKAN: Jika pendaftaran terpicu dari booking, langsung kembali ke Detail Kamar
      if (fromBooking && bookingData) {
        const propertiId = bookingData.properti_id || bookingData.property_id;

        await Swal.fire({
          icon: 'success',
          title: 'Akun Berhasil Dibuat! 🎉',
          text: 'Mengalihkan kembali ke halaman Detail Kamar...',
          timer: 1800,
          showConfirmButton: false,
          customClass: { popup: 'rounded-2xl' }
        });

        // Redirect kembali ke Detail Kamar
        navigate(`/kamar/${propertiId}`, { 
          state: { 
            bookingData: bookingData 
          } 
        });
        return;
      }

      // Notifikasi Sukses Pendaftaran Biasa
      Swal.fire({
        icon: 'success',
        title: 'Pendaftaran Berhasil! 🎉',
        text: 'Selamat datang di Kafana Vista. Mengalihkan ke halaman beranda...',
        timer: 1800,
        timerProgressBar: true,
        showConfirmButton: false,
        customClass: { popup: 'rounded-2xl' }
      }).then(() => {
        navigate('/beranda');
      });

    } catch (error) {
      console.error('Error Register:', error);
      
      let errorTitle = 'Pendaftaran Gagal';
      let errorHtml = 'Gagal mendaftar. Silakan periksa kembali data Anda.';

      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          const errorsObj = error.response.data.errors;
          const errorList = Object.values(errorsObj).flat().map(err => `<li class="text-left">${err}</li>`).join('');
          errorHtml = `<ul class="text-xs text-rose-600 list-disc list-inside space-y-1">${errorList}</ul>`;
        } else if (error.response.data.message || error.response.data.error) {
          errorHtml = error.response.data.message || error.response.data.error;
        }
      } else {
        errorHtml = 'Terjadi kesalahan koneksi ke server. Silakan coba beberapa saat lagi.';
      }

      Swal.fire({
        icon: 'error',
        title: errorTitle,
        html: errorHtml,
        confirmButtonColor: '#261C19',
        customClass: { popup: 'rounded-2xl' }
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF5EF] w-full items-center justify-center p-4 font-sans selection:bg-[#B38E5D] selection:text-white">
      <div className="flex w-full max-w-[1050px] min-h-[700px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#D7C4B0]/60 my-6 transition-all">
        
        {/* BANNER KIRI */}
        <div className="hidden md:flex flex-1 bg-[#261C19] text-[#FAF5EF] p-12 flex-col justify-between items-center relative select-none">
          <div className="absolute inset-0 opacity-30 mix-blend-luminosity pointer-events-none">
            <img 
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=600&auto=format&fit=crop" 
              alt="Architecture" 
              className="w-full h-full object-cover grayscale"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#261C19] via-[#261C19]/60 to-transparent"></div>
          </div>
          
          <div className="relative z-10 w-full">
            <span className="text-[11px] uppercase tracking-[0.25em] text-[#B38E5D] font-bold block">
              Kafana Vista System
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center my-auto space-y-4">
            <div className="p-4 rounded-2xl bg-[#B38E5D]/10 backdrop-blur-xs border border-[#B38E5D]/30 mb-2">
              <svg className="w-14 h-14 text-[#B38E5D]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 20V80H35V53L55 80H68L45 49L65 20H52L35 43V20H25Z" fill="currentColor" />
                <path d="M72 20L56 50L61 57L79 25H72Z" fill="currentColor" />
                <path d="M81 60L70 77L75 80L88 60H81Z" fill="currentColor" />
              </svg>
            </div>
            <h1 className="text-2xl font-light tracking-[0.25em] uppercase text-[#FAF5EF]">
              KAFANA <span className="text-[#B38E5D] font-bold">VISTA</span>
            </h1>
            <p className="text-xs text-[#FAF5EF]/70 max-w-xs leading-relaxed font-light">
              Platform integrasi manajemen dan pemesanan hunian eksklusif dengan kenyamanan maksimal.
            </p>
          </div>

          <div className="relative z-10 text-[10px] text-[#FAF5EF]/40 tracking-widest uppercase font-medium">
            Property Management Platform
          </div>
        </div>

        {/* FORM REGISTRASI KANAN */}
        <div className="flex-1 bg-white p-8 md:p-12 flex flex-col justify-between items-center text-[#261C19]">
          <div className="w-full max-w-[390px] mx-auto my-auto space-y-5">
            
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-black tracking-tight text-[#261C19]">
                {fromBooking ? 'Buat Akun untuk Pemesanan' : 'Buat Akun Baru'}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {fromBooking ? 'Lengkapi data diri Anda untuk menyelesaikan pemesanan kamar.' : 'Lengkapi data diri untuk pengalaman akses penuh.'}
              </p>
            </div>

            {/* BANNER RINGKASAN BOOKING BILA DATANG DARI DETAIL KAMAR */}
            {fromBooking && bookingData && (
              <div className="bg-[#FAF5EF] border-2 border-[#B38E5D] p-3.5 rounded-2xl space-y-2 text-xs shadow-sm">
                <div className="flex items-center gap-2 font-bold text-[#261C19]">
                  <span className="text-sm">🏢</span>
                  <span className="truncate">{bookingData.namaProperti}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-600 font-medium bg-white/80 p-2.5 rounded-xl border border-[#D7C4B0]/60">
                  <p>Unit: <span className="font-bold text-[#B38E5D]">{bookingData.nomorKamar}</span></p>
                  <p>Durasi: <span className="font-bold text-[#261C19]">{bookingData.durasiSewaText}</span></p>
                  <p>Check-in: <span className="font-bold text-[#261C19]">{bookingData.tanggalMasukFormatted}</span></p>
                  <p>Total: <span className="font-bold text-[#B38E5D]">{bookingData.totalBayar}</span></p>
                </div>
              </div>
            )}

            {/* FORM INPUT */}
            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* NAMA LENGKAP */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7C4B0] text-xs font-medium focus:outline-hidden focus:border-[#B38E5D] transition bg-[#FAF5EF]/30"
                />
              </div>

              {/* EMAIL */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7C4B0] text-xs font-medium focus:outline-hidden focus:border-[#B38E5D] transition bg-[#FAF5EF]/30"
                />
              </div>

              {/* NOMOR TELEPON */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  type="tel"
                  required
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7C4B0] text-xs font-medium focus:outline-hidden focus:border-[#B38E5D] transition bg-[#FAF5EF]/30"
                />
              </div>

              {/* KATA SANDI */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Kata Sandi
                  </label>
                  {password && (
                    <span className={`text-[9px] font-bold ${passStrength.label === 'Kuat' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {passStrength.label}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7C4B0] text-xs font-medium focus:outline-hidden focus:border-[#B38E5D] transition bg-[#FAF5EF]/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {/* Strength Meter Bar */}
                {password && (
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${passStrength.color}`}
                      style={{ width: `${passStrength.strength}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* KONFIRMASI KATA SANDI */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Konfirmasi Kata Sandi
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Ulangi kata sandi"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#D7C4B0] text-xs font-medium focus:outline-hidden focus:border-[#B38E5D] transition bg-[#FAF5EF]/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* PERSETUJUAN SYARAT & KETENTUAN */}
              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-[#D7C4B0] text-[#B38E5D] focus:ring-[#B38E5D] cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-gray-500 leading-tight cursor-pointer">
                  Saya menyetujui <span className="font-bold text-[#261C19] underline">Syarat &amp; Ketentuan</span> serta <span className="font-bold text-[#261C19] underline">Kebijakan Privasi</span> Kafana Vista.
                </label>
              </div>

              {/* TOMBOL SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#261C19] hover:bg-[#B38E5D] text-white font-bold py-3.5 rounded-xl text-xs tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>MEMPROSES...</span>
                  </>
                ) : (
                  <span>DAFTAR SEKARANG</span>
                )}
              </button>
            </form>

            <div className="text-center text-xs font-medium text-gray-500 pt-2">
              <span>Sudah memiliki akun? </span>
              <Link to="/login" state={location.state} className="font-extra-bold text-[#B38E5D] hover:underline">
                Masuk di sini
              </Link>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;