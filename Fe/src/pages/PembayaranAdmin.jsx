import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import SidebarAdmin from '../components/SidebarAdmin';
import Swal from 'sweetalert2';

export default function PembayaranAdmin() {
  const params = useParams();
  const propertyId = params.propertyId || params.id; // Mendukung route :id maupun :propertyId
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [property, setProperty] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('gateway'); // 'gateway' | 'manual'
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  // Default nominal biaya publikasi properti
  const PUBLICATION_FEE = 150000;

  // 1. Fetch data tagihan properti
  const fetchPropertyDetail = useCallback(async () => {
    if (!propertyId) return;
    try {
      setLoading(true);
      const res = await API.get(`/admin/properties/${propertyId}`);
      const data = res.data.data || res.data;
      setProperty(data);
    } catch (err) {
      console.error('Gagal mengambil detail tagihan:', err);
      Swal.fire({
        title: 'Tagihan Tidak Ditemukan',
        text: 'Data properti atau tagihan tidak dapat dimuat.',
        icon: 'error',
        confirmButtonColor: '#B38E5D'
      }).then(() => navigate('/admin/properti'));
    } finally {
      setLoading(false); // <--- TAMBAHKAN INI agar loading berhenti setelah data didapat!
    }
  }, [propertyId, navigate]);
  useEffect(() => {
    fetchPropertyDetail();
  }, [fetchPropertyDetail]);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka || 0);
  };

  // 2. Handler Pembayaran Otomatis via Payment Gateway (Midtrans Snap)
  const handlePayGateway = async () => {
    setSubmitting(true);
    try {
      const res = await API.post(`/admin/properties/${propertyId}/pay-gateway`);
      const { snap_token, payment_url } = res.data;

      if (snap_token && window.snap) {
        window.snap.pay(snap_token, {
          onSuccess: function () {
            Swal.fire({
              title: 'Pembayaran Berhasil!',
              text: 'Properti Anda sekarang telah aktif dan dipublikasikan.',
              icon: 'success',
              confirmButtonColor: '#B38E5D'
            }).then(() => navigate('/admin/properti'));
          },
          onPending: function () {
            Swal.fire({
              title: 'Menunggu Pembayaran',
              text: 'Selesaikan pembayaran Anda sesuai instruksi.',
              icon: 'warning',
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
          }
        });
      } else if (payment_url) {
        window.location.href = payment_url;
      } else {
        throw new Error('Token pembayaran tidak ditemukan.');
      }
    } catch (err) {
      Swal.fire({
        title: 'Gagal Memproses Transaksi',
        text: err.response?.data?.message || 'Gagal terhubung ke gateway pembayaran.',
        icon: 'error',
        confirmButtonColor: '#B38E5D'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Handler Upload Bukti Transfer Manual
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
        text: 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi Superadmin.',
        icon: 'success',
        confirmButtonColor: '#B38E5D'
      }).then(() => navigate('/admin/properti'));
    } catch (err) {
      Swal.fire({
        title: 'Gagal Mengunggah',
        text: err.response?.data?.message || 'Terjadi kesalahan saat mengunggah bukti.',
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

  return (
    <SidebarAdmin>
      <div className="min-h-screen bg-[#FAF5EF] font-sans text-slate-800 p-8">
        
        {/* HEADER BAR */}
        <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
          <div>
            <button 
              onClick={() => navigate('/admin/properti')}
              className="text-xs font-bold text-[#B38E5D] hover:underline flex items-center gap-1 mb-2 cursor-pointer"
            >
              ← Kembali ke Data Properti
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Tagihan Publikasi Properti</h1>
            <p className="text-xs text-slate-500">Selesaikan pembayaran untuk mengaktifkan listing kamar Anda.</p>
          </div>

          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
            property?.payment_status === 'paid' 
              ? 'bg-emerald-100 text-emerald-700' 
              : property?.payment_status === 'waiting_verification'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-rose-100 text-rose-700'
          }`}>
            {property?.payment_status === 'paid' ? 'Lunas / Aktif' : property?.payment_status === 'waiting_verification' ? 'Menunggu Verifikasi' : 'Belum Dibayar'}
          </span>
        </div>

        {/* MAIN CONTAINER */}
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* LEFT: RINGKASAN PROPERTI & TAGIHAN */}
          <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Rincian Properti</h2>
              
              <div className="mb-4">
                <p className="font-bold text-slate-800 text-base">{property?.title}</p>
                <p className="text-xs text-slate-500">{property?.address}</p>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Kategori</span>
                  <span className="font-semibold text-slate-700">{property?.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sewa/Bulan</span>
                  <span className="font-semibold text-slate-700">{formatRupiah(property?.price_per_month)}</span>
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

          {/* RIGHT: METODE PEMBAYARAN */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            
            <h2 className="text-base font-bold text-slate-800 mb-4">Pilih Metode Pembayaran</h2>

            {/* TAB SELECTION */}
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

            {/* CONTENT 1: PEMBAYARAN OTOMATIS */}
            {paymentMethod === 'gateway' && (
              <div className="space-y-4 bg-[#FAF5EF] p-5 rounded-xl border border-amber-200/60">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pembayaran diproses instan melalui sistem Payment Gateway. Status listing akan langsung aktif otomatis tanpa perlu verifikasi manual.
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">QRIS</span>
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">BCA VA</span>
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">Mandiri</span>
                  <span className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-600">GoPay/Gopay Later</span>
                </div>

                <button
                  onClick={handlePayGateway}
                  disabled={submitting || property?.payment_status === 'paid'}
                  className="w-full py-3 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#B38E5D]/30 disabled:opacity-50 cursor-pointer mt-4"
                >
                  {submitting ? 'Membuka Gateway...' : `Bayar Sekarang (${formatRupiah(PUBLICATION_FEE)})`}
                </button>
              </div>
            )}

            {/* CONTENT 2: TRANSFER MANUAL */}
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
                  disabled={submitting || !proofFile || property?.payment_status === 'paid'}
                  className="w-full py-3 bg-[#B38E5D] hover:bg-[#8F6E45] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-[#B38E5D]/30 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Mengunggah...' : 'Kirim Bukti Pembayaran'}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </SidebarAdmin>
  );
}