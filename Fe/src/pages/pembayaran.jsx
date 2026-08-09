import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'; // <--- Import SweetAlert2
import API from '../api'; // Axios instance

// --- DAFTAR METODE PEMBAYARAN ---
const DAFTAR_BANK = [
  { id: 'bca', jenis: 'bank', nama: 'Bank BCA', nomorVa: '8830-1928-37' },
  { id: 'mandiri', jenis: 'bank', nama: 'Bank Mandiri', nomorVa: '1370-0098-2134' },
  { id: 'bri', jenis: 'bank', nama: 'Bank BRI', nomorVa: '0021-0108-9932' },
  { id: 'bni', jenis: 'bank', nama: 'Bank BNI', nomorVa: '0091-2834-1102' },
  { id: 'cimb', jenis: 'bank', nama: 'Bank CIMB Niaga', nomorVa: '8001-9283-7711' },
  { id: 'bsi', jenis: 'bank', nama: 'Bank Syariah (BSI)', nomorVa: '7123-8890-1122' },
];

const DAFTAR_QRIS = [
  { id: 'gopay', jenis: 'qris', nama: 'QRIS (GoPay)', nmid: 'ID102026883901' },
  { id: 'ovo', jenis: 'qris', nama: 'QRIS (OVO)', nmid: 'ID102026883902' },
  { id: 'shopeepay', jenis: 'qris', nama: 'QRIS (ShopeePay)', nmid: 'ID102026883903' },
  { id: 'dana', jenis: 'qris', nama: 'QRIS (DANA)', nmid: 'ID102026883904' },
];

const DAFTAR_LAINNYA = [
  { id: 'indomaret', jenis: 'retail', nama: 'Indomaret / Ceriamart', kodePay: 'IND-9918237' },
  { id: 'alfamart', jenis: 'retail', nama: 'Alfamart / Alfamidi', kodePay: 'ALF-9918237' },
  { id: 'tunai', jenis: 'cash', nama: 'Tunai di Lokasi (Check-in)', kodePay: 'BAYAR-DI-LOKASI' },
];

export default function Pembayaran() {
  const navigate = useNavigate();
  const location = useLocation();

  // Data transaksi dikirim dari halaman sebelumnya
  const itemTransaksi = location.state?.itemTransaksi;

  // State Utama
  const [metodeAktif, setMetodeAktif] = useState(DAFTAR_BANK[0]);
  const [copied, setCopied] = useState(false);
  const [buktiTransfer, setBuktiTransfer] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Helper Parse String Rupiah ke Angka Numerik
  const parseAmountToNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/[^0-9]/g, '');
    return Number(cleanStr) || 0;
  };

  // Helper URL QRIS
  const getDynamicQrUrl = () => {
    const total = itemTransaksi?.totalBayar || '0';
    const dataString = `PAYMENT-${metodeAktif.id.toUpperCase()}-${metodeAktif.nmid || 'QRIS'}-${total}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dataString)}`;
  };

  // Salin Nomor Rekening / VA + SweetAlert Toast Notification
  const handleCopy = () => {
    if (metodeAktif.nomorVa) {
      navigator.clipboard.writeText(metodeAktif.nomorVa);
      setCopied(true);

      // SweetAlert Toast Notification
      Swal.fire({
        icon: 'success',
        title: 'Tersalin!',
        text: 'Nomor VA berhasil disalin ke clipboard.',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handler Pilih File & Preview Bukti Transfer
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi Ukuran File (Maksimal 2MB)
    if (file.size > 2 * 1024 * 1024) {
      const msg = 'Ukuran file terlalu besar! Maksimal 2MB.';
      setErrorMessage(msg);
      Swal.fire({
        icon: 'warning',
        title: 'Ukuran File Terlalu Besar',
        text: msg,
        confirmButtonColor: '#B38E5D',
      });
      return;
    }

    // Validasi Format File
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      const msg = 'Format file tidak didukung! Gunakan format JPG, JPEG, atau PNG.';
      setErrorMessage(msg);
      Swal.fire({
        icon: 'warning',
        title: 'Format Tidak Sesuai',
        text: msg,
        confirmButtonColor: '#B38E5D',
      });
      return;
    }

    setErrorMessage('');
    setBuktiTransfer(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Hapus File Bukti
  const handleRemoveFile = () => {
    setBuktiTransfer(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // HANDLER UTAMA: KIRIM PEMBAYARAN KE BACKEND LARAVEL
  const handleKonfirmasi = async () => {
    setErrorMessage('');

    // Validasi Pemesanan ID
    const pemesananId = itemTransaksi?.pemesananId || itemTransaksi?.pemesanan_id || itemTransaksi?.id;
    if (!pemesananId) {
      Swal.fire({
        icon: 'error',
        title: 'Transaksi Tidak Ditemukan',
        text: 'ID Pemesanan tidak ditemukan! Silakan lakukan pemesanan ulang.',
        confirmButtonColor: '#B38E5D',
      });
      return;
    }

    // Validasi Bukti Pembayaran Wajib
    if (!buktiTransfer) {
      const msg = 'Harap unggah bukti transfer/pembayaran terlebih dahulu!';
      setErrorMessage(msg);
      Swal.fire({
        icon: 'warning',
        title: 'Bukti Transfer Belum Diunggah',
        text: msg,
        confirmButtonColor: '#B38E5D',
      });
      return;
    }

    const numericAmount = parseAmountToNumber(itemTransaksi?.totalBayar);
    if (numericAmount < 1000) {
      const msg = 'Jumlah total pembayaran tidak valid.';
      setErrorMessage(msg);
      Swal.fire({
        icon: 'warning',
        title: 'Jumlah Tidak Valid',
        text: msg,
        confirmButtonColor: '#B38E5D',
      });
      return;
    }

    // DIALOG KONFIRMASI SWEETALERT2
    const confirmResult = await Swal.fire({
      title: 'Konfirmasi Pembayaran',
      text: `Apakah Anda yakin ingin mengirim bukti pembayaran via ${metodeAktif.nama}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#B38E5D',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Kirim Bukti',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    setIsProcessing(true);

    try {
      // Bungkus data dalam FormData untuk file upload
      const formData = new FormData();
      formData.append('pemesanan_id', pemesananId);
      formData.append('amount', numericAmount);
      formData.append('payment_method', metodeAktif.nama);
      formData.append('payment_proof', buktiTransfer);

      const response = await API.post('/pembayaran/bayar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // SWEETALERT SUKSES
      await Swal.fire({
        icon: 'success',
        title: 'Pembayaran Terkirim!',
        text: response.data.message || 'Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.',
        confirmButtonColor: '#B38E5D',
      });

      navigate('/riwayattransaksi');
    } catch (error) {
      console.error('❌ Gagal mengirim pembayaran:', error);
      const msg = error.response?.data?.message || 'Gagal memproses pembayaran. Silakan coba lagi.';
      setErrorMessage(msg);

      // SWEETALERT GAGAL
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: msg,
        confirmButtonColor: '#B38E5D',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Proteksi jika halaman diakses tanpa data transaksi
  if (!itemTransaksi) {
    return (
      <div className="min-h-screen bg-[#FAF5EF] flex items-center justify-center p-6">
        <div className="bg-white border border-[#D7C4B0] p-8 rounded-2xl text-center max-w-md w-full space-y-4 shadow-sm">
          <span className="text-4xl block">⚠️</span>
          <h2 className="text-lg font-bold text-[#2D2321]">Transaksi Tidak Ditemukan</h2>
          <p className="text-xs text-[#5C4A42]">Tidak ada data pemesanan yang aktif untuk dibayar saat ini.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-[#2D2321] text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#B38E5D] transition cursor-pointer"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF5EF] text-[#2D2321] font-sans p-6 md:p-10 antialiased selection:bg-[#B38E5D] selection:text-white">
      
      <style>
        {`
          @keyframes fadeSlideUp {
            0% { opacity: 0; transform: translateY(15px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-up {
            animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
        `}
      </style>

      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-wide text-[#2D2321]">Konfirmasi Pembayaran</h1>
          <p className="text-xs text-[#5C4A42] mt-1">Selesaikan pembayaran untuk mengamankan kamar pesanan Anda.</p>
        </div>

        {/* PESAN ERROR BILA ADA */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-up">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: PILIH METODE & PETUNJUK */}
          <div className="lg:col-span-2 space-y-6 animate-fade-up delay-100">
            
            {/* 1. PILIH METODE PEMBAYARAN */}
            <div className="bg-white border border-[#D7C4B0] p-6 space-y-6 rounded-xl shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">
                1. PILIH METODE PEMBAYARAN
              </h2>

              {/* VIRTUAL ACCOUNT */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-wider text-[#5C4A42] uppercase block">
                  TRANSFER VIRTUAL ACCOUNT / BANK:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {DAFTAR_BANK.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => setMetodeAktif(bank)}
                      className={`flex items-center gap-3 p-3 border text-xs text-left transition-all duration-200 cursor-pointer rounded-lg ${
                        metodeAktif.id === bank.id
                          ? 'border-[#B38E5D] bg-[#B38E5D]/10 text-[#2D2321] font-bold shadow-sm'
                          : 'border-[#D7C4B0] bg-[#FAF5EF]/40 text-[#5C4A42] hover:border-[#B38E5D]'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        metodeAktif.id === bank.id ? 'border-[#B38E5D] bg-[#B38E5D]' : 'border-slate-300'
                      }`}>
                        {metodeAktif.id === bank.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span className="truncate">{bank.nama}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* QRIS & E-WALLET */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-wider text-[#5C4A42] uppercase block">
                  QRIS &amp; E-WALLET:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DAFTAR_QRIS.map((qris) => (
                    <button
                      key={qris.id}
                      onClick={() => setMetodeAktif(qris)}
                      className={`flex items-center gap-3 p-3 border text-xs text-left transition-all duration-200 cursor-pointer rounded-lg ${
                        metodeAktif.id === qris.id
                          ? 'border-[#B38E5D] bg-[#B38E5D]/10 text-[#2D2321] font-bold shadow-sm'
                          : 'border-[#D7C4B0] bg-[#FAF5EF]/40 text-[#5C4A42] hover:border-[#B38E5D]'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        metodeAktif.id === qris.id ? 'border-[#B38E5D] bg-[#B38E5D]' : 'border-slate-300'
                      }`}>
                        {metodeAktif.id === qris.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span className="flex items-center gap-2 truncate">
                        <span className="text-[9px] bg-[#B38E5D]/20 border border-[#B38E5D]/40 text-[#2D2321] px-1 rounded font-mono font-bold">QR</span>
                        {qris.nama}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* LAINNYA */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold tracking-wider text-[#5C4A42] uppercase block">
                  LAINNYA:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {DAFTAR_LAINNYA.map((lain) => (
                    <button
                      key={lain.id}
                      onClick={() => setMetodeAktif(lain)}
                      className={`flex items-center gap-3 p-3 border text-xs text-left transition-all duration-200 cursor-pointer rounded-lg ${
                        metodeAktif.id === lain.id
                          ? 'border-[#B38E5D] bg-[#B38E5D]/10 text-[#2D2321] font-bold shadow-sm'
                          : 'border-[#D7C4B0] bg-[#FAF5EF]/40 text-[#5C4A42] hover:border-[#B38E5D]'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                        metodeAktif.id === lain.id ? 'border-[#B38E5D] bg-[#B38E5D]' : 'border-slate-300'
                      }`}>
                        {metodeAktif.id === lain.id && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                      </div>
                      <span className="truncate">{lain.nama}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* 2. PETUNJUK PEMBAYARAN & UPLOAD BUKTI */}
            <div className="bg-white border border-[#D7C4B0] p-6 space-y-6 rounded-xl shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">
                2. PETUNJUK PEMBAYARAN ({metodeAktif.nama.toUpperCase()})
              </h2>

              {/* PETUNJUK BANK */}
              {metodeAktif.jenis === 'bank' && (
                <div className="space-y-4 text-xs animate-fade-up">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[#5C4A42]">Bank / Penyedia:</span>
                    <span className="font-bold text-[#2D2321] uppercase">{metodeAktif.nama.replace('Bank ', '')}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[#5C4A42]">Atas Nama:</span>
                    <span className="font-bold text-[#2D2321]">Kafana Vista Property</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[#5C4A42] block mb-1 uppercase text-[10px] tracking-wider font-bold">NOMOR REKENING / VA:</span>
                    <div className="flex justify-between items-center bg-[#FAF5EF] p-3 border border-[#D7C4B0] rounded-lg">
                      <span className="font-mono text-base md:text-lg font-bold text-[#B38E5D] tracking-wider">{metodeAktif.nomorVa}</span>
                      <button
                        onClick={handleCopy}
                        className="border border-[#B38E5D] text-[#B38E5D] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#B38E5D] hover:text-white transition-all cursor-pointer rounded"
                      >
                        {copied ? 'TERSALIN!' : 'SALIN'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* PETUNJUK QRIS */}
              {metodeAktif.jenis === 'qris' && (
                <div className="text-center space-y-4 py-2 animate-fade-up">
                  <p className="text-xs text-[#B38E5D] font-bold">
                    Scan QRIS Code khusus {metodeAktif.nama} berikut:
                  </p>
                  <div className="inline-block bg-white p-4 border-2 border-[#B38E5D]/40 shadow-md rounded-xl">
                    <img 
                      key={metodeAktif.id}
                      src={getDynamicQrUrl()} 
                      alt={`QRIS ${metodeAktif.nama}`} 
                      className="w-48 h-48 object-contain mx-auto"
                    />
                    <span className="block text-[10px] text-[#2D2321] font-mono font-bold mt-2">
                      NMID: {metodeAktif.nmid}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5C4A42]">
                    Buka aplikasi {metodeAktif.nama.replace('QRIS ', '')} / m-Banking &gt; Pilih Scan QRIS &gt; Selesaikan Pembayaran
                  </p>
                </div>
              )}

              {/* PETUNJUK RETAIL/CASH */}
              {(metodeAktif.jenis === 'retail' || metodeAktif.jenis === 'cash') && (
                <div className="space-y-4 text-xs animate-fade-up">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[#5C4A42]">Metode:</span>
                    <span className="font-bold text-[#2D2321]">{metodeAktif.nama}</span>
                  </div>
                  <div className="bg-[#FAF5EF] p-4 border border-[#D7C4B0] rounded-lg">
                    <span className="text-[#5C4A42] block text-[10px] uppercase font-bold mb-1">Kode Pembayaran / Instruksi:</span>
                    <span className="font-mono text-base font-bold text-[#B38E5D]">{metodeAktif.kodePay || 'Tunjukkan Email Pemesanan ke Kasir/Pengelola'}</span>
                  </div>
                </div>
              )}

              {/* UPLOAD BUKTI TRANSFER DENGAN PREVIEW */}
              <div className="pt-6 border-t border-slate-100 space-y-3">
                <label className="text-xs text-[#2D2321] font-bold block">
                  Upload Bukti Pembayaran <span className="text-red-500">* (Wajib)</span>
                </label>
                
                {!previewUrl ? (
                  <div className="border-2 border-dashed border-[#D7C4B0] rounded-xl p-6 text-center bg-[#FAF5EF]/30 hover:bg-[#FAF5EF] transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="space-y-2">
                      <span className="text-3xl block text-[#B38E5D]">📸</span>
                      <p className="text-xs font-semibold text-[#2D2321]">Klik atau seret foto bukti transfer di sini</p>
                      <p className="text-[10px] text-gray-400">Format: JPG, JPEG, PNG (Maksimal 2MB)</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative border border-[#D7C4B0] rounded-xl p-3 bg-[#FAF5EF]/50 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <img 
                        src={previewUrl} 
                        alt="Preview Bukti" 
                        className="w-16 h-16 object-cover rounded-lg border border-[#D7C4B0] shrink-0" 
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-[#2D2321] truncate">{buktiTransfer?.name}</p>
                        <p className="text-[10px] text-gray-500">{(buktiTransfer?.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="px-3 py-1.5 text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition cursor-pointer shrink-0"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* RINGKASAN PESANAN (KOLOM KANAN) */}
          <div className="lg:col-span-1 animate-fade-up delay-200">
            <div className="bg-white border border-[#D7C4B0] p-6 space-y-6 sticky top-6 rounded-xl shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#B38E5D] border-b border-slate-100 pb-3">
                RINGKASAN PESANAN
              </h2>

              {itemTransaksi.gambar && (
                <div className="overflow-hidden rounded-lg border border-[#D7C4B0]">
                  <img 
                    src={itemTransaksi.gambar} 
                    alt={itemTransaksi.namaProperti || 'Properti'} 
                    className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <h3 className="text-base font-serif font-bold text-[#2D2321]">{itemTransaksi.namaProperti || 'Nama Properti'}</h3>
                <p className="text-xs text-[#B38E5D] font-medium">{itemTransaksi.tipeKamar || '-'}</p>
              </div>

              <div className="space-y-2.5 text-xs text-[#5C4A42] pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span>Durasi Sewa:</span>
                  <span className="font-semibold text-[#2D2321]">{itemTransaksi.durasiSewa || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal Masuk:</span>
                  <span className="font-semibold text-[#2D2321]">{itemTransaksi.tanggalMasuk || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Harga Sewa:</span>
                  <span className="font-semibold text-[#2D2321]">{itemTransaksi.hargaSewa || '-'}</span>
                </div>
                {itemTransaksi.biayaLayanan && (
                  <div className="flex justify-between">
                    <span>Biaya Layanan:</span>
                    <span className="font-semibold text-[#2D2321]">{itemTransaksi.biayaLayanan}</span>
                  </div>
                )}
                {itemTransaksi.deposit && (
                  <div className="flex justify-between">
                    <span>Deposit:</span>
                    <span className="font-semibold text-[#2D2321]">{itemTransaksi.deposit}</span>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-[#D7C4B0]/60 font-bold text-sm">
                  <span className="text-[#2D2321]">Total Tagihan:</span>
                  <span className="text-[#B38E5D]">{itemTransaksi.totalBayar || 'Rp 0'}</span>
                </div>
              </div>

              <button
                onClick={handleKonfirmasi}
                disabled={isProcessing}
                className="w-full bg-[#B38E5D] text-white font-bold py-3.5 text-xs tracking-widest uppercase hover:bg-[#8F6E45] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm"
              >
                {isProcessing ? "MEMPROSES & MENGUNGGAH..." : "KONFIRMASI PEMBAYARAN"}
              </button>

              <p className="text-[10px] text-center text-[#5C4A42]/80 leading-relaxed">
                *Bukti pembayaran akan diverifikasi oleh Admin. Anda dapat memantau status pesanan di halaman Riwayat Transaksi.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}