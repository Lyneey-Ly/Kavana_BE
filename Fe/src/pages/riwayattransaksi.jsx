import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api'; // Sesuaikan path Axios instance kamu
import SidebarUser from '../components/SidebarUser';

// =========================================================================
// 🛠️ HELPER: PARSING TANGGAL AMAN UNTUK JAVASCRIPT
// =========================================================================
const safeParseDate = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === 'string') {
    // Mengubah spasi MySQL menjadi 'T' agar valid dibaca semua browser (ISO-8601)
    const formattedStr = dateInput.replace(' ', 'T');
    const date = new Date(formattedStr);
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
};

// =========================================================================
// ⏱️ SUB-KOMPONEN: COUNTDOWN TIMER (HITUNG MUNDUR 1 JAM PEMBAYARAN)
// =========================================================================
function PaymentCountdown({ expiredAt, createdAt, onExpire }) {
  const [timeLeft, setTimeLeft] = useState('--:--');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // 1. Tentukan target expire (Pakai expiredAt, jika kosong otomatis +1 Jam dari createdAt)
    let targetDate = safeParseDate(expiredAt);

    if (!targetDate) {
      const createdDate = safeParseDate(createdAt) || new Date();
      targetDate = new Date(createdDate.getTime() + 60 * 60 * 1000); // Default 1 jam
    }

    const expireTime = targetDate.getTime();

    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = expireTime - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft('00:00');
      } else {
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const formattedMins = String(minutes).padStart(2, '0');
        const formattedSecs = String(seconds).padStart(2, '0');

        setTimeLeft(`${formattedMins}:${formattedSecs}`);
      }
    };

    calculateTime(); // Jalankan langsung saat render pertama
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [expiredAt, createdAt]);

  if (isExpired) {
    return <span className="text-red-600 font-bold">Waktu Pembayaran Habis</span>;
  }

  return (
    <span className="text-amber-700 font-bold">
      Selesaikan pembayaran dalam{' '}
      <strong className="text-red-600 font-mono bg-red-50 px-2 py-0.5 rounded border border-red-200">
        {timeLeft}
      </strong>
    </span>
  );
}

// =========================================================================
// 🏠 KOMPONEN UTAMA RIWAYAT TRANSAKSI
// =========================================================================
export default function RiwayatTransaksi() {
  const navigate = useNavigate();
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStruk, setSelectedStruk] = useState(null);

  // Helper untuk formatting Rupiah
  const formatRupiah = (number) => {
    if (!number && number !== 0) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  // Helper untuk formatting Tanggal
  const formatTanggal = (dateString) => {
    const dateObj = safeParseDate(dateString);
    if (!dateObj) return '-';
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // Fetch data dari Backend Laravel
  useEffect(() => {
    fetchRiwayatTransaksi();
  }, []);

  const fetchRiwayatTransaksi = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/pemesanan/riwayat');
      
      const dataBackend = response.data.data || response.data || [];
      
      const mappedData = dataBackend.map((item) => {
        const properti = item.properti || item.property || {};
        
        // NORMALISASI STATUS
        const statusDb = item.status || 'Tertunda';
        const statusLower = statusDb.toLowerCase().trim();
        
        // PENGELOLAAN WAKTU EXPIRED DENGAN FALLBACK AMAN
        const rawCreatedAt = item.created_at || item.booking_date;
        const rawExpiredAt = item.expired_at;

        let expiredDateObj = safeParseDate(rawExpiredAt);
        if (!expiredDateObj && rawCreatedAt) {
          const createdObj = safeParseDate(rawCreatedAt) || new Date();
          expiredDateObj = new Date(createdObj.getTime() + 60 * 60 * 1000); // Fallback: +1 jam
        }

        const isTimeOver = expiredDateObj ? new Date().getTime() >= expiredDateObj.getTime() : false;
        const isExpired = statusLower === 'expired' || (statusLower === 'tertunda' && isTimeOver);

        return {
          id: item.id ? `TRX-${item.id}` : `TRX-${Date.now()}`,
          pemesananId: item.id, 
          propertiId: properti.id || item.properti_id,
          tanggalTransaksi: formatTanggal(rawCreatedAt),
          createdAt: rawCreatedAt,
          expiredAt: rawExpiredAt,
          
          namaProperti: properti.title || properti.name || properti.nama_properti || properti.nama || '',
          tipeKamar: properti.type || properti.category || properti.tipe_kamar || 'Kamar Standar',
          
          durasiSewa: item.duration_months ? `${item.duration_months} Bulan` : '1 Bulan',
          tanggalMasuk: formatTanggal(item.check_in_date),
          
          hargaSewa: formatRupiah(properti.price_per_month || properti.harga),
          biayaLayanan: formatRupiah(item.biaya_layanan || 10000), 
          deposit: formatRupiah(item.deposit || 0),
          totalBayar: formatRupiah(item.total_price),
          
          metodePembayaran: item.pembayaran?.payment_method || 'Belum Dipilih',
          
          // Status
          status: isExpired ? 'Expired' : statusDb,
          
          // Boolean Flags
          isLunas: statusLower === 'dikonfirmasi' || statusLower === 'selesai',
          isTertunda: (statusLower === 'tertunda' || statusLower === 'menunggu pembayaran') && !isExpired,
          isDitolak: statusLower === 'ditolak' || statusLower === 'batal',
          isExpired: isExpired,
          
          // Gambar properti
          gambar: properti.main_image || properti.image || properti.gambar || properti.foto 
            ? `http://127.0.0.1:8000/storage/${properti.main_image || properti.image || properti.gambar || properti.foto}`
            : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
        };
      });

      setTransaksiList(mappedData);
    } catch (err) {
      console.error('Gagal mengambil riwayat transaksi:', err);
      setError('Gagal memuat riwayat transaksi. Pastikan kamu sudah login.');
    } finally {
      setLoading(false);
    }
  };

  const handleLanjutKePembayaran = (item) => {
    navigate('/pembayaran', { state: { itemTransaksi: item } });
  };

  return (
    <SidebarUser>
      <div className="min-h-screen bg-[#FAF5EF] text-[#2D2321] font-sans antialiased pb-20 selection:bg-[#B38E5D] selection:text-white overflow-hidden">
        
        {/* CSS Animasi Internal */}
        <style>
          {`
            @keyframes fadeSlideUp {
              0% { opacity: 0; transform: translateY(20px); }
              100% { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            @keyframes scaleUp {
              0% { opacity: 0; transform: scale(0.95); }
              100% { opacity: 1; transform: scale(1); }
            }
            .animate-fade-up {
              animation: fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              opacity: 0;
            }
            .animate-fade-in {
              animation: fadeIn 0.3s ease-out forwards;
            }
            .animate-scale-up {
              animation: scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              opacity: 0;
            }
            .delay-100 { animation-delay: 150ms; }
          `}
        </style>

        {/* HEADER PAGE */}
        <div className="max-w-4xl mx-auto px-6 pt-8 pb-4 animate-fade-up">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
              <span className="block text-xs tracking-widest text-[#B38E5D] uppercase font-bold">
                Aktivitas &amp; Tagihan Saya
              </span>
              <h1 className="text-3xl font-serif font-bold tracking-wide mt-1 text-[#2D2321]">
                Riwayat Transaksi
              </h1>
            </div>
            <div>
              <button 
                onClick={() => navigate('/')}
                className="bg-[#2D2321] text-[#FAF5EF] px-5 py-2.5 font-bold text-xs tracking-widest uppercase shadow-md hover:bg-[#B38E5D] hover:translate-x-1 transition-all duration-300 cursor-pointer rounded whitespace-nowrap"
              >
                KEMBALI KE BERANDA →
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 animate-fade-up delay-100">
          <div className="w-full h-[1px] bg-[#D7C4B0] mb-8"></div>

          {/* PESAN ERROR BILA GAGAL FETCH */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          {/* STATE LOADING */}
          {loading ? (
            <div className="bg-white border border-[#D7C4B0] p-12 text-center space-y-4 rounded-xl shadow-sm">
              <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[#5C4A42] font-medium text-xs uppercase tracking-wider">Memuat data riwayat transaksi...</p>
            </div>
          ) : transaksiList.length === 0 ? (
            <div className="bg-white border border-[#D7C4B0] p-12 text-center space-y-4 rounded-xl shadow-sm">
              <p className="text-[#5C4A42] font-medium text-sm">Belum ada pemesanan kos/kontrakan.</p>
              <button 
                onClick={() => navigate('/carihunian')}
                className="bg-[#B38E5D] text-white px-6 py-2.5 font-bold uppercase text-xs tracking-widest cursor-pointer hover:bg-[#8F6E45] hover:-translate-y-0.5 transition-all duration-300 rounded shadow-md"
              >
                Cari Kamar Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {transaksiList.map((item) => (
                <div 
                  key={item.id} 
                  className="bg-white border border-[#D7C4B0] overflow-hidden shadow-sm hover:shadow-md transform hover:-translate-y-1 transition-all duration-300 rounded-xl"
                >
                  {/* HEAD CARD */}
                  <div className="bg-[#FAF5EF]/50 px-6 py-4 border-b border-[#D7C4B0] flex flex-wrap justify-between items-center gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-[#B38E5D] bg-[#B38E5D]/10 px-2 py-1 border border-[#B38E5D]/30 font-bold rounded">
                        {item.id}
                      </span>
                      <span className="text-xs text-[#5C4A42] font-medium">Tgl Transaksi: <strong className="text-[#2D2321]">{item.tanggalTransaksi}</strong></span>
                    </div>
                    
                    {/* BADGE STATUS */}
                    <span className={`text-[11px] font-bold px-3 py-1 uppercase tracking-wider rounded ${
                      item.isLunas ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                      item.isDitolak || item.isExpired ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      • {item.status}
                    </span>
                  </div>

                  {/* BODY CARD */}
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-1 overflow-hidden rounded-lg">
                      <img 
                        src={item.gambar} 
                        alt={item.namaProperti} 
                        className="w-full h-40 md:h-36 object-cover border border-[#D7C4B0] rounded-lg transform hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    <div className="md:col-span-2 space-y-3">
                      <div>
                        <h3 className="text-xl font-serif font-bold text-[#2D2321]">{item.namaProperti}</h3>
                        <p className="text-xs text-[#B38E5D] font-bold">{item.tipeKamar || 'Kamar Standar'}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 bg-[#FAF5EF] rounded-lg p-3 border border-[#D7C4B0] text-xs">
                        <div>
                          <span className="text-[#5C4A42] block text-[10px] uppercase tracking-wider font-bold">Durasi Sewa:</span>
                          <span className="text-[#2D2321] font-semibold">{item.durasiSewa}</span>
                        </div>
                        <div>
                          <span className="text-[#5C4A42] block text-[10px] uppercase tracking-wider font-bold">Tanggal Masuk:</span>
                          <span className="text-[#2D2321] font-semibold">{item.tanggalMasuk}</span>
                        </div>
                        <div>
                          <span className="text-[#5C4A42] block text-[10px] uppercase tracking-wider font-bold">Metode Bayar:</span>
                          <span className="text-[#2D2321] font-semibold">{item.metodePembayaran}</span>
                        </div>
                        <div>
                          <span className="text-[#5C4A42] block text-[10px] uppercase tracking-wider font-bold">Total Tagihan:</span>
                          <span className="text-[#B38E5D] font-bold text-sm">{item.totalBayar}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FOOTER CARD & ACTION */}
                  <div className="bg-[#FAF5EF]/50 px-6 py-4 border-t border-[#D7C4B0] flex flex-wrap justify-between items-center gap-4">
                    <div className="text-xs font-medium">
                      {/* NOTIFIKASI TEKS STATUS & TIMER */}
                      {item.isLunas ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-bold">
                          ✓ Kamar sudah dikonfirmasi &amp; siap dihuni
                        </span>
                      ) : item.isTertunda ? (
                        <div className="flex items-center gap-1">
                          ⚠️ <PaymentCountdown 
                            expiredAt={item.expiredAt} 
                            createdAt={item.createdAt} 
                            onExpire={fetchRiwayatTransaksi} 
                          />
                        </div>
                      ) : item.isExpired ? (
                        <span className="text-red-600 font-bold">
                          ❌ Transaksi kadaluarsa (Melewati batas waktu 1 jam)
                        </span>
                      ) : item.isDitolak ? (
                        <span className="text-red-600 font-bold">
                          ❌ Pembayaran Ditolak / Dibatalkan
                        </span>
                      ) : (
                        <span className="text-blue-600 font-bold">
                          ⏳ Pembayaran sedang diverifikasi Admin
                        </span>
                      )}
                    </div>

                    <div className="flex gap-3">
                      {/* TOMBOL BERDASARKAN STATUS */}
                      {item.isTertunda ? (
                        <button 
                          onClick={() => handleLanjutKePembayaran(item)}
                          className="bg-[#B38E5D] text-white font-bold px-5 py-2 text-xs tracking-widest uppercase hover:bg-[#8F6E45] transition-colors shadow-md cursor-pointer rounded"
                        >
                          BAYAR SEKARANG
                        </button>
                      ) : item.isExpired ? (
                        <button 
                          onClick={() => navigate('/')}
                          className="bg-slate-200 text-slate-700 font-bold px-5 py-2 text-xs tracking-widest uppercase hover:bg-slate-300 transition-colors cursor-pointer rounded"
                        >
                          🔄 BOOKING ULANG
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectedStruk(item)}
                          className="bg-white border border-[#D7C4B0] text-[#5C4A42] font-bold px-5 py-2 text-xs tracking-widest uppercase hover:border-[#B38E5D] hover:text-[#B38E5D] transition-colors cursor-pointer rounded shadow-sm"
                        >
                          📄 LIHAT STRUK RESMI
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL STRUK RESMI */}
        {selectedStruk && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white text-[#2D2321] border border-[#D7C4B0] rounded-xl w-full max-w-md p-6 shadow-2xl font-mono text-xs relative animate-scale-up">
              <div className="text-center pb-4 border-b border-dashed border-[#D7C4B0] space-y-1">
                <h2 className="text-base font-bold uppercase font-serif tracking-wider text-[#2D2321]">BUKTI PEMBAYARAN RESMI</h2>
                <p className="text-[10px] text-[#5C4A42]">No: {selectedStruk.id}</p>
              </div>

              <div className="py-4 space-y-2 border-b border-dashed border-[#D7C4B0]">
                <div className="flex justify-between">
                  <span className="text-[#5C4A42]">Tanggal:</span>
                  <span className="font-semibold">{selectedStruk.tanggalTransaksi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4A42]">Properti:</span>
                  <span className="font-semibold">{selectedStruk.namaProperti}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4A42]">Unit/Kamar:</span>
                  <span className="font-semibold">{selectedStruk.tipeKamar || 'Kamar Standar'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5C4A42]">Metode Bayar:</span>
                  <span className="font-semibold">{selectedStruk.metodePembayaran}</span>
                </div>
              </div>

              <div className="py-4 space-y-2 border-b border-dashed border-[#D7C4B0]">
                <div className="flex justify-between font-bold text-sm pt-2">
                  <span>TOTAL LUNAS</span>
                  <span className="text-[#B38E5D]">{selectedStruk.totalBayar}</span>
                </div>
              </div>

              <div className="pt-4 text-center text-[10px] text-[#5C4A42] space-y-1">
                <p>Status: <strong className={
                  selectedStruk.isDitolak || selectedStruk.isExpired ? "text-red-600 uppercase" : 
                  selectedStruk.isLunas ? "text-emerald-600 uppercase" : 
                  "text-blue-600 uppercase"
                }>
                  {selectedStruk.isLunas ? "● BERHASIL / LUNAS" : 
                   selectedStruk.isDitolak ? "● DITOLAK" : 
                   selectedStruk.isExpired ? "● KADALUARSA" :
                   "● PROSES VERIFIKASI"}
                </strong></p>
              </div>

              <div className="mt-6 flex gap-2 font-sans">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-[#2D2321] text-white py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#B38E5D] rounded transition-colors cursor-pointer"
                >
                  🖨️ Cetak / PDF
                </button>
                <button 
                  onClick={() => setSelectedStruk(null)}
                  className="flex-1 border border-[#D7C4B0] text-[#5C4A42] py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-[#FAF5EF] rounded transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </SidebarUser>
  );
}