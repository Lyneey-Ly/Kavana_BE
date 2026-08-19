import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import API from '../api';

export default function Pembayaran() {
  const navigate = useNavigate();
  const location = useLocation();

  // Data transaksi dari halaman sebelumnya
  const itemTransaksi = location.state?.itemTransaksi;

  // State Pengaturan Pembayaran (Mendukung Multi-Bank)
  const [banks, setBanks] = useState([]);
  const [selectedBankIndex, setSelectedBankIndex] = useState(0);
  const [qrisImageUrl, setQrisImageUrl] = useState('');
  const [loadingSettings, setLoadingSettings] = useState(true);

  // State Pilihan Metode: 'bank' atau 'qris'
  const [metodeAktif, setMetodeAktif] = useState('bank');
  const [copied, setCopied] = useState(false);
  const [buktiTransfer, setBuktiTransfer] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Pengaturan Pembayaran (Gunakan Rute User Tanpa Admin Prefix)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        const res = await API.get('/payment-settings');
        const data = res.data?.data;

        if (data) {
          let loadedBanks = [];
          if (data.banks) {
            loadedBanks = typeof data.banks === 'string' ? JSON.parse(data.banks) : data.banks;
          } else if (data.bank_name || data.account_number) {
            loadedBanks = [{
              bank_name: data.bank_name || 'BCA',
              account_number: data.account_number || '',
              account_holder: data.account_holder || '',
            }];
          }

          setBanks(loadedBanks);
          setQrisImageUrl(data.qris_image_url || '');
        }
      } catch (error) {
        console.error('Gagal memuat pengaturan pembayaran dari DB:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  const activeBank = banks[selectedBankIndex] || {
    bank_name: 'BCA',
    account_number: '',
    account_holder: '',
  };

  // Helper Parse String Rupiah ke Angka Numerik
  const parseAmountToNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleanStr = String(val).replace(/[^0-9]/g, '');
    return Number(cleanStr) || 0;
  };

  // Salin Nomor Rekening
  const handleCopy = () => {
    if (activeBank.account_number) {
      navigator.clipboard.writeText(activeBank.account_number);
      setCopied(true);

      Swal.fire({
        icon: 'success',
        title: 'Tersalin!',
        text: `Nomor Rekening ${activeBank.bank_name} berhasil disalin.`,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
      });

      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handler Upload Bukti Transfer
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

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

  const handleRemoveFile = () => {
    setBuktiTransfer(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Kirim Pembayaran Ke Backend
  const handleKonfirmasi = async () => {
    setErrorMessage('');

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
    const namaMetode = metodeAktif === 'bank' ? `Transfer Bank (${activeBank.bank_name})` : 'QRIS (All Payment)';

    const confirmResult = await Swal.fire({
      title: 'Konfirmasi Pembayaran',
      text: `Apakah Anda yakin ingin mengirim bukti pembayaran via ${namaMetode}?`,
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
      const formData = new FormData();
      formData.append('pemesanan_id', pemesananId);
      formData.append('amount', numericAmount);
      formData.append('payment_method', namaMetode);
      formData.append('payment_proof', buktiTransfer);

      const response = await API.post('/pembayaran/bayar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await Swal.fire({
        icon: 'success',
        title: 'Pembayaran Terkirim!',
        text: response.data?.message || 'Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.',
        confirmButtonColor: '#B38E5D',
      });

      navigate('/riwayattransaksi');
    } catch (error) {
      console.error('Gagal mengirim pembayaran:', error);
      const msg = error.response?.data?.message || 'Gagal memproses pembayaran. Silakan coba lagi.';
      setErrorMessage(msg);

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

  if (!itemTransaksi) {
    return (
      <div className="min-h-screen bg-[#FAF5EF] flex items-center justify-center p-6">
        <div className="bg-white border border-[#D7C4B0] p-8 rounded-2xl text-center max-w-md w-full space-y-4 shadow-sm">
          <span className="text-4xl block">⚠️</span>
          <h2 className="text-lg font-bold text-[#2D2321]">Transaksi Tidak Ditemukan</h2>
          <p className="text-xs text-[#5C4A42]">Tidak ada data pemesanan yang aktif untuk dibayar saat ini.</p>
          <button 
            onClick={() => navigate('/beranda')}
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
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 space-y-3">
          <button
            onClick={() => navigate('/beranda')}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5C4A42] hover:text-[#B38E5D] transition-all cursor-pointer group"
          >
            <span className="text-base transition-transform group-hover:-translate-x-1">←</span>
            <span>Kembali ke Beranda</span>
          </button>

          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-wide text-[#2D2321]">Konfirmasi Pembayaran</h1>
            <p className="text-xs text-[#5C4A42] mt-1">Selesaikan pembayaran untuk mengamankan kamar pesanan Anda.</p>
          </div>
        </div>

        {/* PESAN ERROR BILA ADA */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* KOLOM KIRI: PILIH METODE & PETUNJUK */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. PILIH METODE PEMBAYARAN */}
            <div className="bg-white border border-[#D7C4B0] p-6 space-y-6 rounded-xl shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">
                1. PILIH METODE PEMBAYARAN
              </h2>

              {loadingSettings ? (
                <div className="text-center py-6 text-xs text-slate-400 font-bold">Memuat Metode Pembayaran...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* OPSI 1: TRANSFER BANK */}
                  <button
                    onClick={() => setMetodeAktif('bank')}
                    className={`flex items-center gap-3 p-4 border text-xs text-left transition-all cursor-pointer rounded-xl ${
                      metodeAktif === 'bank'
                        ? 'border-[#B38E5D] bg-[#B38E5D]/10 text-[#2D2321] font-bold shadow-sm'
                        : 'border-[#D7C4B0] bg-[#FAF5EF]/40 text-[#5C4A42] hover:border-[#B38E5D]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      metodeAktif === 'bank' ? 'border-[#B38E5D] bg-[#B38E5D]' : 'border-slate-300'
                    }`}>
                      {metodeAktif === 'bank' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="block font-extrabold text-sm text-[#2D2321]">
                        Transfer Bank {banks.length > 0 ? `(${activeBank.bank_name})` : ''}
                      </span>
                      <span className="text-[10px] text-[#5C4A42]">Virtual Account / Transfer Manual</span>
                    </div>
                  </button>

                  {/* OPSI 2: QRIS (ALL PAYMENT) */}
                  <button
                    onClick={() => setMetodeAktif('qris')}
                    className={`flex items-center gap-3 p-4 border text-xs text-left transition-all cursor-pointer rounded-xl ${
                      metodeAktif === 'qris'
                        ? 'border-[#B38E5D] bg-[#B38E5D]/10 text-[#2D2321] font-bold shadow-sm'
                        : 'border-[#D7C4B0] bg-[#FAF5EF]/40 text-[#5C4A42] hover:border-[#B38E5D]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      metodeAktif === 'qris' ? 'border-[#B38E5D] bg-[#B38E5D]' : 'border-slate-300'
                    }`}>
                      {metodeAktif === 'qris' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <div>
                      <span className="flex items-center gap-2 font-extrabold text-sm text-[#2D2321]">
                        <span className="text-[9px] bg-[#B38E5D]/20 border border-[#B38E5D]/40 text-[#2D2321] px-1 rounded font-mono font-bold">QR</span>
                        QRIS (All Payment)
                      </span>
                      <span className="text-[10px] text-[#5C4A42]">GoPay, OVO, ShopeePay, DANA, Mobile Banking</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 2. PETUNJUK PEMBAYARAN & UPLOAD BUKTI */}
            <div className="bg-white border border-[#D7C4B0] p-6 space-y-6 rounded-xl shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#B38E5D]">
                2. PETUNJUK PEMBAYARAN ({metodeAktif === 'bank' ? `BANK ${activeBank.bank_name}` : 'QRIS ALL PAYMENT'})
              </h2>

              {/* DETAIL TRANSFER BANK */}
              {metodeAktif === 'bank' && (
                <div className="space-y-4 text-xs">
                  
                  {/* DROPDOWN PILIH BANK JIKA TERSEDIA LEBIH DARI 1 BANK */}
                  {banks.length > 1 && (
                    <div className="p-3 bg-[#FAF5EF] border border-[#D7C4B0] rounded-xl space-y-1">
                      <label className="text-[11px] font-bold text-[#5C4A42] block">
                        Pilih Bank Tujuan Transfer:
                      </label>
                      <select
                        value={selectedBankIndex}
                        onChange={(e) => setSelectedBankIndex(Number(e.target.value))}
                        className="w-full p-2 bg-white border border-[#D7C4B0] rounded-lg font-bold text-sm text-[#2D2321] focus:outline-none focus:ring-1 focus:ring-[#B38E5D]"
                      >
                        {banks.map((b, idx) => (
                          <option key={idx} value={idx}>
                            Bank {b.bank_name} - {b.account_holder}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[#5C4A42]">Bank / Penyedia:</span>
                    <span className="font-bold text-[#2D2321] uppercase">{activeBank.bank_name || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-[#5C4A42]">Atas Nama (Pemilik Rekening):</span>
                    <span className="font-bold text-[#2D2321]">{activeBank.account_holder || '-'}</span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[#5C4A42] block mb-1 uppercase text-[10px] tracking-wider font-bold">NOMOR REKENING / VA:</span>
                    <div className="flex justify-between items-center bg-[#FAF5EF] p-3 border border-[#D7C4B0] rounded-lg">
                      <span className="font-mono text-base md:text-lg font-bold text-[#B38E5D] tracking-wider">
                        {activeBank.account_number || 'Belum diatur'}
                      </span>
                      {activeBank.account_number && (
                        <button
                          onClick={handleCopy}
                          className="border border-[#B38E5D] text-[#B38E5D] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[#B38E5D] hover:text-white transition-all cursor-pointer rounded"
                        >
                          {copied ? 'TERSALIN!' : 'SALIN'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* DETAIL QRIS ALL PAYMENT */}
              {metodeAktif === 'qris' && (
                <div className="text-center space-y-4 py-2">
                  <p className="text-xs text-[#B38E5D] font-bold">
                    Scan Kode QRIS Resmi Berikut (Mendukung Semua E-Wallet & Mobile Banking):
                  </p>
                  
                  <div className="inline-block bg-white p-4 border-2 border-[#B38E5D]/40 shadow-md rounded-xl max-w-xs mx-auto">
                    {qrisImageUrl ? (
                      <img 
                        src={qrisImageUrl} 
                        alt="QRIS Resmi All Payment" 
                        className="w-56 h-56 object-contain mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold rounded-lg">
                        Gambar QRIS Belum Diunggah Admin
                      </div>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-[#5C4A42]">
                    Buka aplikasi e-Wallet (GoPay, OVO, ShopeePay, DANA) atau m-Banking &gt; Pilih Scan QRIS &gt; Selesaikan Pembayaran.
                  </p>
                </div>
              )}

              {/* UPLOAD BUKTI TRANSFER */}
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
          <div className="lg:col-span-1">
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

                <div className="flex justify-between pt-4 border-t border-[#D7C4B0]/60 font-bold text-sm">
                  <span className="text-[#2D2321]">Total Tagihan:</span>
                  <span className="text-[#B38E5D]">{itemTransaksi.totalBayar || 'Rp 0'}</span>
                </div>
              </div>

              <button
                onClick={handleKonfirmasi}
                disabled={isProcessing}
                className="w-full bg-[#B38E5D] text-white font-bold py-3.5 text-xs tracking-widest uppercase hover:bg-[#8F6E45] transition-all cursor-pointer disabled:opacity-50 rounded-lg shadow-sm"
              >
                {isProcessing ? "MEMPROSES & MENGUNGGAH..." : "KONFIRMASI PEMBAYARAN"}
              </button>
              
              <button
                onClick={() => navigate('/riwayattransaksi')}
                className="w-full bg-[#2D2321] text-white font-bold py-3 text-xs tracking-widest uppercase hover:bg-[#B38E5D] transition-all cursor-pointer rounded-lg shadow-sm"
              >
                Bayar Nanti
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