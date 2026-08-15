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

      // Jika pendaftaran terpicu dari booking
      if (fromBooking && bookingData) {
        try {
          const bookingRes = await API.post('/pemesanan/booking', {
            properti_id: bookingData.properti_id,
            kamar_id: bookingData.kamar_id,
            check_in_date: bookingData.check_in_date,
            duration_months: bookingData.duration_months
          });

          const pemesananId = bookingRes.data?.data?.id || bookingRes.data?.id || bookingRes.data?.pemesanan_id;

          const dataDikirim = {
            pemesanan_id: pemesananId, 
            property_id: bookingData.properti_id,
            kamar_id: bookingData.kamar_id,
            nomorKamar: bookingData.nomorKamar,
            namaProperti: bookingData.namaProperti,
            tipeKamar: bookingData.tipeKamar,
            hargaSewa: bookingData.hargaSewa,
            durasiSewa: bookingData.durasiSewaText,
            tanggalMasuk: bookingData.tanggalMasukFormatted,
            biayaLayanan: bookingData.biayaLayanan,
            totalBayar: bookingData.totalBayar, 
            gambar: bookingData.gambar
          };

          await Swal.fire({
            icon: 'success',
            title: 'Akun Berhasil Dibuat! 🎉',
            text: 'Meneruskan ke halaman pembayaran...',
            timer: 1800,
            showConfirmButton: false,
            customClass: { popup: 'rounded-2xl' }
          });

          navigate('/pembayaran', { state: { itemTransaksi: dataDikirim } });
          return;
        } catch (bookingErr) {
          console.error('Error auto booking:', bookingErr);
          const errMsg = bookingErr.response?.data?.message || 'Akun berhasil dibuat, tetapi gagal memproses booking.';
          await Swal.fire({
            icon: 'warning',
            title: 'Akun Terbuat, Pemesanan Terkendala',
            text: `${errMsg} Silakan lakukan pemesanan ulang dari halaman detail kamar.`,
            confirmButtonColor: '#261C19',
            customClass: { popup: 'rounded-2xl' }
          });
          navigate(`/kamar/${bookingData.properti_id}`);
          return;
        }
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
        navigate('/Home');
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
                  <p>Total: <span className="font-bold text-emerald-700">{bookingData.totalBayar}</span></p>
                </div>
                <p className="text-[10px] text-[#B38E5D] font-bold text-center pt-0.5">
                  ✨ Setelah mendaftar, Anda akan langsung diarahkan ke Pembayaran!
                </p>
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5">
              
              {/* NAMA LENGKAP */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  placeholder="Contoh: Ahmad Fauzi" 
                  className="w-full px-3.5 py-2.5 border border-[#D7C4B0] rounded-xl text-xs font-medium outline-hidden focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] transition bg-[#FAF5EF]/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>

              {/* EMAIL */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="email" 
                  placeholder="nama@email.com" 
                  className="w-full px-3.5 py-2.5 border border-[#D7C4B0] rounded-xl text-xs font-medium outline-hidden focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] transition bg-[#FAF5EF]/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>

              {/* TELEPON / PHONE */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Nomor WhatsApp / HP <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="tel" 
                  placeholder="081234567890" 
                  className="w-full px-3.5 py-2.5 border border-[#D7C4B0] rounded-xl text-xs font-medium outline-hidden focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] transition bg-[#FAF5EF]/20"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required 
                />
              </div>

              {/* KATA SANDI */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter" 
                    className="w-full pl-3.5 pr-10 py-2.5 border border-[#D7C4B0] rounded-xl text-xs font-medium outline-hidden focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] transition bg-[#FAF5EF]/20"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#261C19] cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 013.682-.821c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.092-4.092a3 3 0 11-4.243-4.243M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>

                {/* INDIKATOR KEKUATAN PASSWORD */}
                {password && (
                  <div className="pt-1 space-y-1">
                    <div className="h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${passStrength.color} transition-all duration-300`} 
                        style={{ width: `${passStrength.strength}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-400">
                      <span>Kekuatan Kata Sandi:</span>
                      <span className="uppercase">{passStrength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* KONFIRMASI KATA SANDI */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500">
                  Ulangi Kata Sandi <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Masukkan ulang kata sandi" 
                    className="w-full pl-3.5 pr-10 py-2.5 border border-[#D7C4B0] rounded-xl text-xs font-medium outline-hidden focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] transition bg-[#FAF5EF]/20"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#261C19] cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 013.682-.821c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-4.092-4.092a3 3 0 11-4.243-4.243M3 3l18 18" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 🌟 CEKLIS SYARAT & KEBIJAKAN PRIVASI */}
              <div className="flex items-start gap-2 pt-1.5">
                <input 
                  type="checkbox" 
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#D7C4B0] text-[#B38E5D] focus:ring-[#B38E5D] cursor-pointer"
                  required
                />
                <label htmlFor="agreeTerms" className="text-[11px] text-gray-600 font-medium leading-tight cursor-pointer select-none">
                  Saya menyetujui <a href="#" onClick={(e) => { e.preventDefault(); Swal.fire({ title: 'Syarat & Ketentuan', text: 'Ketentuan layanan Kafana Vista meliputi kepatuhan aturan hunian dan hak akses pengelola.', confirmButtonColor: '#261C19' }); }} className="underline font-extrabold text-[#261C19] hover:text-[#B38E5D]">Syarat &amp; Ketentuan</a> serta <a href="#" onClick={(e) => { e.preventDefault(); Swal.fire({ title: 'Kebijakan Privasi', text: 'Kafana Vista menjaga kerahasiaan data pengguna dan tidak membagikannya ke pihak ketiga tanpa izin.', confirmButtonColor: '#261C19' }); }} className="underline font-extrabold text-[#261C19] hover:text-[#B38E5D]">Kebijakan Privasi</a>. <span className="text-rose-500">*</span>
                </label>
              </div>

              {/* TOMBOL SUBMIT */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#B38E5D] hover:bg-[#916F42] active:scale-[0.99] text-white py-3 text-xs font-black uppercase tracking-widest rounded-xl transition duration-200 shadow-lg shadow-[#B38E5D]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4 cursor-pointer"
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
              <Link to="/login" state={location.state} className="font-extrabold text-[#261C19] hover:text-[#B38E5D] underline transition">
                Masuk di sini
              </Link>
            </div>

          </div>

          <div className="text-center text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-6">
            © 2026 KAFANA VISTA. ALL RIGHTS RESERVED.
          </div>
        </div>

      </div>
    </div>
  );
}

export default Register;