import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import API from '../api';
import SidebarAdmin from '../components/SidebarAdmin';

export default function AdminPaymentSettings() {
  const [banks, setBanks] = useState([
    { bank_name: '', account_number: '', account_holder: '' }
  ]);
  const [qrisImage, setQrisImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchPaymentSettings = useCallback(async () => {
    try {
      setFetching(true);
      const res = await API.get('/admin/payment-settings');
      const data = res.data?.data;

      if (data) {
        // Parsing data bank (bisa berupa array JSON atau fallback data lama)
        let loadedBanks = [];
        if (data.banks) {
          loadedBanks = typeof data.banks === 'string' ? JSON.parse(data.banks) : data.banks;
        } else if (data.bank_name || data.account_number) {
          loadedBanks = [{
            bank_name: data.bank_name || '',
            account_number: data.account_number || '',
            account_holder: data.account_holder || '',
          }];
        }

        if (loadedBanks.length > 0) {
          setBanks(loadedBanks);
        }

        if (data.qris_image_url) {
          setPreviewUrl(data.qris_image_url);
        }
      }
    } catch (error) {
      console.error('Gagal mengambil data pengaturan pembayaran:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat',
        text: 'Gagal mengambil data pengaturan pembayaran.',
        confirmButtonColor: '#C5A059',
      });
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchPaymentSettings();
  }, [fetchPaymentSettings]);

  // Handler Perubahan Input Bank
  const handleBankChange = (index, e) => {
    const updatedBanks = [...banks];
    updatedBanks[index][e.target.name] = e.target.value;
    setBanks(updatedBanks);
  };

  // Tambah Form Bank Baru
  const handleAddBank = () => {
    setBanks([...banks, { bank_name: '', account_number: '', account_holder: '' }]);
  };

  // Hapus Form Bank
  const handleRemoveBank = (index) => {
    if (banks.length === 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Minimal 1 Bank',
        text: 'Anda harus menyisakan setidaknya satu rekening bank.',
        confirmButtonColor: '#C5A059',
      });
      return;
    }
    const updatedBanks = banks.filter((_, i) => i !== index);
    setBanks(updatedBanks);
  };

  // Handler Upload Gambar QRIS
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'File Terlalu Besar',
        text: 'Ukuran foto QRIS maksimal 2MB!',
        confirmButtonColor: '#C5A059',
      });
      return;
    }

    setQrisImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const confirmResult = await Swal.fire({
      title: 'Simpan Pengaturan?',
      text: 'Apakah Anda yakin ingin menyimpan perubahan pengaturan pembayaran ini?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#C5A059',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Simpan',
      cancelButtonText: 'Batal',
    });

    if (!confirmResult.isConfirmed) return;

    setLoading(true);

    const data = new FormData();
    // Kirim list bank sebagai JSON String dan juga field utama (fallback)
    data.append('banks', JSON.stringify(banks));
    if (banks.length > 0) {
      data.append('bank_name', banks[0].bank_name);
      data.append('account_number', banks[0].account_number);
      data.append('account_holder', banks[0].account_holder);
    }

    if (qrisImage) {
      data.append('qris_image', qrisImage);
    }

    try {
      const res = await API.post('/admin/payment-settings', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Swal.fire({
        icon: 'success',
        title: 'Berhasil Disimpan!',
        text: res.data?.message || 'Pengaturan pembayaran berhasil diperbarui!',
        confirmButtonColor: '#C5A059',
      });

      fetchPaymentSettings();
    } catch (error) {
      console.error('Gagal update payment settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: error.response?.data?.message || 'Gagal memperbarui pengaturan pembayaran.',
        confirmButtonColor: '#C5A059',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarAdmin>
      <div className="w-full min-h-screen bg-[#FAF6F0] text-[#261C19] font-sans p-4 md:p-8 flex flex-col justify-between relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#8F6E45]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto w-full space-y-6 relative z-10 flex-grow flex flex-col justify-start">
          
          {/* HEADER */}
          <header className="bg-white/90 backdrop-blur-md px-6 py-5 rounded-2xl border border-[#E5D7C5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#261C19] via-[#3D2D29] to-[#1A1311] text-[#FAF5EF] flex items-center justify-center font-black text-xl shadow-md border border-[#C5A059]/30">
                💳
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#261C19]">
                  Pengaturan <span className="text-[#C5A059]">Pembayaran & QRIS</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-0.5">
                  Kelola daftar nomor rekening bank dan gambar QRIS resmi untuk transaksi penyewa.
                </p>
              </div>
            </div>
          </header>

          {/* MAIN FORM CONTAINER */}
          {fetching ? (
            <div className="bg-white p-16 rounded-3xl border border-[#E5D7C5] text-center space-y-4 shadow-sm my-auto">
              <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 text-sm font-bold tracking-widest uppercase">Memuat Pengaturan Pembayaran...</p>
            </div>
          ) : (
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* SECTION MULTI-BANK */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h2 className="text-xs font-extrabold text-[#C5A059] uppercase tracking-wider">
                      DAFTAR REKENING BANK
                    </h2>
                    <button
                      type="button"
                      onClick={handleAddBank}
                      className="bg-[#C5A059] text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#8F6E45] transition flex items-center gap-1"
                    >
                      <span>+</span> Tambah Bank
                    </button>
                  </div>

                  {banks.map((bank, index) => (
                    <div key={index} className="p-4 border border-[#E5D7C5] rounded-2xl bg-[#FAF6F0]/30 space-y-4 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-extrabold text-[#261C19]">Bank #{index + 1}</span>
                        {banks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveBank(index)}
                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            Hapus
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-[#261C19] uppercase">Nama Bank</label>
                          <input
                            type="text"
                            name="bank_name"
                            value={bank.bank_name}
                            onChange={(e) => handleBankChange(index, e)}
                            placeholder="BCA / BRI / Mandiri"
                            required
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[#261C19] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-[#261C19] uppercase">No. Rekening / VA</label>
                          <input
                            type="text"
                            name="account_number"
                            value={bank.account_number}
                            onChange={(e) => handleBankChange(index, e)}
                            placeholder="8830192837"
                            required
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[#261C19] text-xs font-semibold font-mono focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-extrabold text-[#261C19] uppercase">Atas Nama</label>
                          <input
                            type="text"
                            name="account_holder"
                            value={bank.account_holder}
                            onChange={(e) => handleBankChange(index, e)}
                            placeholder="Pemilik Rekening"
                            required
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-[#261C19] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#C5A059]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* UPLOAD QRIS */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <label className="text-xs font-extrabold text-[#261C19] uppercase tracking-wider block">
                    Upload Gambar QRIS Resmi
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    <div className="border-2 border-dashed border-[#E5D7C5] rounded-2xl p-6 text-center bg-[#FAF6F0]/40 hover:bg-[#FAF6F0] transition relative cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/jpg" 
                        onChange={handleFileChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-2">
                        <span className="text-3xl block">🖼️</span>
                        <p className="text-xs font-extrabold text-[#261C19]">Pilih foto QRIS baru</p>
                        <p className="text-[10px] text-slate-400">Format JPG, PNG (Maksimal 2MB)</p>
                      </div>
                    </div>

                    {previewUrl && (
                      <div className="flex flex-col items-center justify-center p-4 bg-[#FAF6F0] rounded-2xl border border-[#E5D7C5]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Preview QRIS</span>
                        <img 
                          src={previewUrl} 
                          alt="QRIS Preview" 
                          className="w-40 h-40 object-contain rounded-xl border border-[#E5D7C5] bg-white p-2 shadow-sm" 
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-[#261C19] to-[#3D2D29] hover:opacity-90 text-[#FAF5EF] px-8 py-3 text-xs md:text-sm font-extrabold rounded-xl transition shadow-lg disabled:opacity-50 border border-[#C5A059]/30 flex items-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Menyimpan Pengaturan...</span>
                      </>
                    ) : (
                      "💾 Simpan Pengaturan Pembayaran"
                    )}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* FOOTER */}
          <footer className="pt-6 pb-2 border-t border-[#E5D7C5]/60 text-center text-xs text-slate-500 font-medium flex flex-col sm:flex-row items-center justify-between gap-2">
            <div>© {new Date().getFullYear()} Kafana Vista - Management System</div>
            <div>Payment Gateway Control</div>
          </footer>

        </div>
      </div>
    </SidebarAdmin>
  );
}