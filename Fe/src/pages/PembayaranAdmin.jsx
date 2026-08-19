import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import SidebarAdmin from '../components/SidebarAdmin';
import Swal from 'sweetalert2';

export default function PembayaranAdmin() {
  const params = useParams();
  const propertyId = params.propertyId || params.id;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [property, setProperty] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('gateway');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  useEffect(() => {
    const snapScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-XXXXX';
    
    if (!document.querySelector(`script[src="${snapScriptUrl}"]`)) {
      const script = document.createElement('script');
      script.src = snapScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      document.body.appendChild(script);
    }
  }, []);

  const fetchPropertyDetail = useCallback(async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      const res = await API.get(`/admin/properties/${propertyId}`);
      let data = res.data.data || res.data;

      // DETEKSI OTOMATIS SLOT PERDANA DENGAN FETCH SEMUA PROPERTI
      try {
        const resAll = await API.get(`/admin/properties`);
        const allProps = resAll.data.data || resAll.data || [];
        const sortedProps = [...allProps].sort((a, b) => Number(a.id) - Number(b.id));
        if (sortedProps.length > 0 && String(sortedProps[0].id) === String(data.id)) {
          data.is_first_property_dynamic = true; // Tandai mutlak sebagai perdana
        }
      } catch (err) {
        console.error('Gagal verifikasi slot perdana dinamis:', err);
      }

      setProperty(data);
    } catch (err) {
      console.error('Gagal mengambil detail tagihan:', err);
      Swal.fire({
        title: 'Tagihan Tidak Ditemukan',
        text: 'Data properti atau tagihan tidak dapat dimuat.',
        icon: 'error',
        confirmButtonColor: '#B38E5D'
      }).then(() => navigate('/admin/riwayat-pembayaran'));
    } finally {
      setLoading(false);
    }
  }, [propertyId, navigate]);

  useEffect(() => {
    fetchPropertyDetail();
  }, [fetchPropertyDetail]);

  const formatRupiah = (angka) => {
    if (angka === 0) return 'Rp 0 (Gratis)';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  const handlePayGateway = async () => {
    setSubmitting(true);
    try {
      const res = await API.post(`/admin/properties/${propertyId}/pay-gateway`);
      const resData = res.data?.data || res.data || {};
      const snapToken = resData.snap_token || resData.snapToken;

      if (snapToken && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: async function () {
            try {
              await API.post(`/admin/properties/${propertyId}/gateway-success`);
            } catch (e) {
              console.error('Gagal update status gateway:', e);
            }
            
            Swal.fire({
              title: 'Pembayaran Berhasil!',
              text: 'Properti Anda sekarang telah aktif dan dipublikasikan.',
              icon: 'success',
              confirmButtonColor: '#B38E5D'
            }).then(() => navigate('/admin/riwayat-pembayaran'));
          },
          onPending: function () {
            Swal.fire({
              title: 'Instruksi Pembayaran Dibuat',
              text: 'Silakan selesaikan pembayaran sesuai nomor Virtual Account / QRIS yang tampil.',
              icon: 'info',
              confirmButtonColor: '#B38E5D'
            });
            fetchPropertyDetail();
          },
          onError: function () {
            Swal.fire({
              title: 'Pembayaran Gagal',
              text: 'Terjadi kesalahan saat memproses pembayaran.',
              icon: 'error',
              confirmButtonColor: '#B38E5D'
            });
          },
          onClose: function () {
            fetchPropertyDetail();
          }
        });
      } else {
        throw new Error(res.data?.message || 'Gagal mendapatkan Snap Token dari server Midtrans.');
      }
    } catch (err) {
      console.error('Error Pay Gateway:', err);
      Swal.fire({
        title: 'Gagal Memproses Transaksi',
        text: err.response?.data?.message || err.message || 'Gagal terhubung ke gateway pembayaran.',
        icon: 'error',
        confirmButtonColor: '#B38E5D'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({
          title: 'Ukuran File Terlalu Besar',
          text: 'Maksimal ukuran bukti transfer adalah 2MB.',
          icon: 'warning',
          confirmButtonColor: '#B38E5D'
        });
        return;
      }
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadManual = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      Swal.fire({
        title: 'Pilih File',
        text: 'Silakan unggah foto/gambar bukti transfer terlebih dahulu.',
        icon: 'warning',
        confirmButtonColor: '#B38E5D'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Kirim Bukti Pembayaran?',
      text: 'Superadmin akan memverifikasi pembayaran Anda dalam 1x24 jam.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#B38E5D',
      cancelButtonColor: '#e11d48',
      confirmButtonText: 'Ya, Kirim',
      cancelButtonText: 'Batal'
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append('proof_image', proofFile);

    try {
      await API.post(`/admin/properties/${propertyId}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      Swal.fire({
        title: 'Bukti Terkirim!',
        text: 'Bukti pembayaran berhasil diunggah. Status kini Menunggu Verifikasi Superadmin.',
        icon: 'success',
        confirmButtonColor: '#B38E5D'
      }).then(() => navigate('/admin/riwayat-pembayaran'));
    } catch (err) {
      console.error('Error Upload Proof:', err);
      Swal.fire({
        title: 'Gagal Mengunggah',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengunggah bukti pembayaran.',
        icon: 'error',
        confirmButtonColor: '#B38E5D'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SidebarAdmin>
        <div className="flex items-center justify-center h-screen bg-[#FAF5EF] text-slate-500 font-bold">
          Memuat detail tagihan Kavana...
        </div>
      </SidebarAdmin>
    );
  }

  const rawApproval = String(property?.approval_status || '').toLowerCase().trim();
  const paymentStatusRaw = String(property?.payment_status || '').toLowerCase().trim();
  const proofUrl = property?.payment_proof || property?.bukti_pembayaran || property?.bukti_transfer || null;

  const isPaidSlot = Boolean(property?.is_paid_slot) || paymentStatusRaw === 'paid';
  
  // PENENTUAN STATUS PERDANA BERDASARKAN PENGECEKAN DINAMIS
  const isFirstProperty = property?.is_first_property === true || property?.is_first_property_dynamic === true || property?.slot_fee === 0;

  const isAlreadyPaid = isFirstProperty || isPaidSlot;
  const isWaitingVerification = !isAlreadyPaid && (rawApproval === 'waiting_verification' || Boolean(proofUrl));

  const PUBLICATION_FEE = isFirstProperty ? 0 : (property?.slot_fee ?? 150000);

  return (
    <SidebarAdmin>
      <div className="min-h-screen bg-[#FAF5EF] font-sans text-slate-800 p-8">
        <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
          <div>
            <button 
              onClick={() => navigate('/admin/riwayat-pembayaran')}
              className="text-xs font-bold text-[#B38E5D] hover:underline flex items-center gap-1 mb-2 cursor-pointer"
            >
              ← Kembali ke Riwayat Pembayaran
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Tagihan Publikasi Properti</h1>
            <p className="text-xs text-slate-500">Selesaikan pembayaran untuk mengaktifkan listing kamar Anda.</p>
          </div>

          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
            isAlreadyPaid
              ? 'bg-emerald-100 text-emerald-700' 
              : isWaitingVerification
              ? 'bg-amber-100 text-amber-700'
              : 'bg-rose-100 text-rose-700'
          }`}>
            {isAlreadyPaid ? 'Lunas / Aktif' : isWaitingVerification ? 'Menunggu Verifikasi' : 'Belum Dibayar'}
          </span>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Rincian Properti</h2>
              <div className="mb-4">
                <p className="font-bold text-slate-800 text-base">{property?.title || property?.nama || 'Properti Kavana'}</p>
                <p className="text-xs text-slate-500">{property?.address || property?.alamat}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori</span>
                  <span className="font-semibold text-slate-700 capitalize">{property?.type || 'Kost'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sewa/Bulan</span>
                  <span className="font-semibold text-slate-700">{formatRupiah(property?.price_per_month || property?.harga)}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Tagihan</h2>
                <p className="text-2xl font-black text-[#B38E5D]">{formatRupiah(PUBLICATION_FEE)}</p>
                <p className="text-[11px] text-slate-400 mt-1">*Biaya pendaftaran & lisensi publikasi platform Kavana.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
              ID Tagihan: <span className="font-mono text-slate-600">INV-KVN-{propertyId}</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-base font-bold text-slate-800 mb-4">Pilih Metode Pembayaran</h2>

            {PUBLICATION_FEE === 0 ? (
               <div className="space-y-4 bg-emerald-50 p-5 rounded-xl border border-emerald-200/60">
                 <p className="text-xs text-emerald-700 leading-relaxed font-semibold">
                   Selamat! Properti ini merupakan Slot Perdana Anda sehingga digratiskan dari biaya publikasi. Silakan tunggu verifikasi admin, atau properti Anda akan segera aktif secara otomatis.
                 </p>
               </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gateway')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      paymentMethod === 'gateway'
                        ? 'bg-[#B38E5D] text-white border-[#B38E5D] shadow-md shadow-[#B38E5D]/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ⚡ Otomatis (QRIS / VA / E-Wallet)
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('manual')}
                    className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer ${
                      paymentMethod === 'manual'
                        ? 'bg-[#B38E5D] text-white border-[#B38E5D] shadow-md shadow-[#B38E5D]/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🏛️ Transfer Manual
                  </button>
                </div>

                {paymentMethod === 'gateway' && (
                  <div className="space-y-4 bg-[#FAF5EF] p-5 rounded-xl border border-amber-200/60">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pembayaran diproses instan melalui sistem Payment Gateway Midtrans. Status listing akan langsung aktif otomatis.
                    </p>

                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">QRIS</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">BCA VA</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">Mandiri</span>
                      <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">GoPay</span>
                    </div>

                    <button
                      onClick={handlePayGateway}
                      disabled={submitting || isAlreadyPaid}
                      className="w-full py-3 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#B38E5D]/30 disabled:opacity-50 cursor-pointer mt-4"
                    >
                      {submitting ? 'Membuka Gateway...' : isAlreadyPaid ? 'Tagihan Telah Lunas' : `Bayar Sekarang (${formatRupiah(PUBLICATION_FEE)})`}
                    </button>
                  </div>
                )}

                {paymentMethod === 'manual' && (
                  <form onSubmit={handleUploadManual} className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <p className="font-bold text-slate-700">Rekening Tujuan Superadmin Kavana:</p>
                      <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-200">
                        <div>
                          <p className="font-bold text-slate-800">Bank Central Asia (BCA)</p>
                          <p className="font-mono text-sm text-[#B38E5D] font-bold">8830-1928-331</p>
                          <p className="text-[11px] text-slate-400">a.n. PT Kavana Indonesia Properti</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Upload Bukti Transfer</label>
                      {proofPreview && (
                        <div className="mb-2 relative w-full h-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={proofPreview} alt="Preview Bukti Transfer" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-xs text-slate-500 cursor-pointer"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !proofFile || isAlreadyPaid}
                      className="w-full py-3 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#B38E5D]/30 disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Mengunggah...' : isAlreadyPaid ? 'Tagihan Telah Lunas' : 'Kirim Bukti Pembayaran'}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </SidebarAdmin>
  );
}