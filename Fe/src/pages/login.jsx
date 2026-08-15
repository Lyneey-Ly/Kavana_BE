import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { kafanaSuccess, kafanaError } from '../components/kafanaAlert';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fromBooking = location.state?.fromBooking;
  const bookingData = location.state?.bookingData;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await API.post('/login', {
        email,
        password,
      });

      const token = response.data.token || response.data.access_token;
      const user = response.data.user;
      const role = response.data.role;

      sessionStorage.setItem('token', token);
      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      if (user) {
        sessionStorage.setItem('user', JSON.stringify(user));
      }

      // Jika login ini terpicu dari proses booking customer
      if (fromBooking && bookingData && role === 'customer') {
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

          await kafanaSuccess(
            'Login & Booking Berhasil! 🎉',
            'Mengalihkan Anda langsung ke halaman pembayaran...'
          );

          navigate('/pembayaran', { state: { itemTransaksi: dataDikirim } });
          return;
        } catch (bookingErr) {
          console.error('Error auto booking after login:', bookingErr);
          const errMsg = bookingErr.response?.data?.message || 'Gagal memproses booking.';
          kafanaError('Pemesanan Terkendala', errMsg);
          navigate(`/kamar/${bookingData.properti_id}`);
          return;
        }
      }

      // Pop-up Alert Sukses
      let welcomeMessage = 'Pengguna';
      if (role === 'admin') welcomeMessage = 'Admin Kafana';
      else if (role === 'superadmin') welcomeMessage = 'Super Admin Kafana';
      else welcomeMessage = 'Sahabat Kafana';

      await kafanaSuccess(
        'Login Berhasil! 🎉',
        `Selamat datang kembali, ${welcomeMessage}.`
      );

      // Redirect ke halaman tujuan sesuai role
      switch (role) {
        case 'superadmin':
          navigate('/SuperAdminDashboard');
          break;
        case 'admin':
          navigate('/admindashboard');
          break;
        default:
          navigate('/Home');
      }

    } catch (error) {
      console.error('Gagal Login:', error);
      const errorMessage = error.response?.data?.message || 'Email atau password salah!';
      kafanaError('Gagal Masuk System', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F4EFEA] w-full items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#B38E5D] selection:text-white relative overflow-hidden">
      
      {/* Background Decorative Ambient Blur */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#B38E5D]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#261C19]/10 rounded-full blur-3xl pointer-events-none" />

      {/* MAIN CONTAINER CARD */}
      <div className="flex w-full max-w-[1150px] min-h-[720px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-[0_25px_70px_-15px_rgba(38,28,25,0.18)] overflow-hidden border border-[#D7C4B0]/50 relative z-10 transition-all">
        
        {/* ================= SISI KIRI: ELEGANT BRAND BANNER ================= */}
        <div className="hidden lg:flex flex-1 bg-[#261C19] text-[#FAF5EF] p-12 flex-col justify-between items-start relative select-none overflow-hidden">
          
          {/* Background Image with Dark Vignette Gradient */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1200&auto=format&fit=crop" 
              alt="Luxury Living Architecture" 
              className="w-full h-full object-cover grayscale contrast-125 opacity-25 scale-105 transition-transform duration-1000 ease-out hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1C1412] via-[#261C19]/80 to-[#261C19]/40" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#B38E5D]/20 via-transparent to-transparent" />
          </div>

          {/* Top Header Label */}
          <div className="relative z-10 w-full flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B38E5D] animate-pulse" />
              <span className="text-[11px] font-mono tracking-[0.25em] text-[#D7C4B0] uppercase font-semibold">
                Kafana Residence
              </span>
            </div>
            <span className="px-3.5 py-1 bg-[#B38E5D]/15 border border-[#B38E5D]/30 backdrop-blur-md rounded-full text-[10px] text-[#E6D5C3] font-mono font-medium tracking-wider uppercase">
              v2.5 Luxury Ed.
            </span>
          </div>

          {/* Middle Hero Showcase */}
          <div className="relative z-10 my-auto space-y-6 max-w-md">
            <div className="inline-flex p-3.5 bg-[#261C19]/80 border border-[#B38E5D]/40 rounded-2xl backdrop-blur-xl shadow-2xl ring-1 ring-white/10">
              <svg className="w-10 h-10 text-[#B38E5D]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 20V80H35V53L55 80H68L45 49L65 20H52L35 43V20H25Z" fill="currentColor" />
                <path d="M72 20L56 50L61 57L79 25H72Z" fill="currentColor" opacity="0.85" />
                <path d="M81 60L70 77L75 80L88 60H81Z" fill="currentColor" opacity="0.7" />
              </svg>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-light tracking-[0.2em] uppercase font-serif text-[#FAF5EF] leading-tight">
                KAFANA <span className="font-bold text-[#B38E5D]">VISTA</span>
              </h1>
              <p className="text-xs text-[#D7C4B0] tracking-wider uppercase leading-relaxed font-sans opacity-90 border-l-2 border-[#B38E5D] pl-3">
                Experience refined living with unmatched comfort and seamless property management.
              </p>
            </div>

            
          </div>

          {/* Footer Label */}
          <div className="relative z-10 w-full flex items-center justify-between text-[11px] text-[#D7C4B0]/60 tracking-widest uppercase border-t border-white/10 pt-4">
            <span>Modern Living Platform</span>
            <span>© 2026</span>
          </div>
        </div>

        {/* ================= SISI KANAN: FORM LOGIN BERKELAS ================= */}
        <div className="flex-1 bg-white p-8 sm:p-12 md:p-14 flex flex-col justify-between items-center text-[#261C19]">
          
          <div className="w-full max-w-[390px] mx-auto my-auto space-y-6">
            
            {/* Header Login */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-serif font-bold tracking-tight text-[#261C19]">
                Selamat Datang
              </h2>
              <p className="text-xs text-gray-500 font-sans tracking-wide">
                Masukkan akses akun Kafana Vista Anda
              </p>
            </div>

            {/* VIP BOOKING CARD (Tampil Jika Dari Alur Booking) */}
            {fromBooking && bookingData && (
              <div className="relative overflow-hidden bg-gradient-to-br from-[#FAF5EF] to-[#F3EBE1] border border-[#B38E5D]/60 p-4 rounded-2xl space-y-3 shadow-md">
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#B38E5D]/10 rounded-full blur-lg pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-[#D7C4B0]/60 pb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#261C19]">
                    <span className="text-base">🏢</span> {bookingData.namaProperti}
                  </span>
                  <span className="text-[9px] bg-[#B38E5D] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Instant Pass
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-700 bg-white/90 p-2.5 rounded-xl border border-[#D7C4B0]/40 shadow-inner">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">Kamar</span>
                    <span className="font-bold text-[#B38E5D]">{bookingData.nomorKamar}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">Durasi</span>
                    <span className="font-bold text-[#261C19]">{bookingData.durasiSewaText}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">Check-in</span>
                    <span className="font-bold text-[#261C19]">{bookingData.tanggalMasukFormatted}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase font-mono">Total</span>
                    <span className="font-extrabold text-emerald-700">{bookingData.totalBayar}</span>
                  </div>
                </div>

                <p className="text-[10px] text-[#B38E5D] font-bold text-center flex items-center justify-center gap-1">
                  <span>✨</span> Login untuk melanjutkan ke Pembayaran
                </p>
              </div>
            )}

            {/* FORM LOGIN */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 font-mono">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input 
                    type="email" 
                    placeholder="nama@email.com" 
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF5EF]/50 border border-[#D7C4B0]/80 rounded-xl text-xs sm:text-sm text-[#261C19] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#B38E5D]/50 focus:border-[#B38E5D] focus:bg-white transition-all shadow-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-600 font-mono">
                    Password
                  </label>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF5EF]/50 border border-[#D7C4B0]/80 rounded-xl text-xs sm:text-sm text-[#261C19] placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#B38E5D]/50 focus:border-[#B38E5D] focus:bg-white transition-all shadow-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-gray-400 hover:text-[#B38E5D] transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a10.025 10.025 0 013.68-.863c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-1.782 1.782a9.97 9.97 0 01-2.63.818M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Checkbox Remember Me */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-gray-600 select-none">
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[#D7C4B0] text-[#B38E5D] focus:ring-[#B38E5D] cursor-pointer" 
                  />
                  <span>Ingat Saya</span>
                </label>
              </div>

              {/* Tombol Submit Utama */}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#261C19] via-[#3D2D29] to-[#261C19] hover:from-[#3D2D29] hover:to-[#1A1311] text-[#FAF5EF] py-3.5 px-4 text-xs font-bold uppercase tracking-[0.2em] rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-3 group"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-[#B38E5D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>MEMPROSES...</span>
                  </>
                ) : (
                  <>
                    <span>MASUK SEKARANG</span>
                    <svg className="w-4 h-4 text-[#B38E5D] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>

            </form>

            {/* Footer Register Link */}
            <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Belum memiliki akun? </span>
              <Link 
                to="/register" 
                state={location.state} 
                className="font-bold text-[#261C19] hover:text-[#B38E5D] underline underline-offset-4 transition-colors"
              >
                Daftar Akun Baru
              </Link>
            </div>

          </div>
          
          <div className="text-center text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-6">
            © 2026 KAFANA VISTA • All Rights Reserved
          </div>

        </div>

      </div>
    </div>
  );
}

export default Login;