import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api'; 
import Swal from 'sweetalert2';
import { CheckCircle2, Clock, XCircle, Printer, RefreshCw, FileText, Image as ImageIcon, CreditCard, Sparkles } from 'lucide-react';

const safeParseDate = (dateInput) => {
  if (!dateInput) return null;
  if (typeof dateInput === 'string') {
    const formattedStr = dateInput.replace(' ', 'T');
    const date = new Date(formattedStr);
    return isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(dateInput);
  return isNaN(date.getTime()) ? null : date;
};

export default function RiwayatPembayaranAdmin() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selectedStruk, setSelectedStruk] = useState(null);

  const formatRupiah = (number) => {
    if (number === 0) return 'GRATIS (Slot Perdana)';
    if (number === null || number === undefined) return 'Rp 150.000';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(number);
  };

  const formatTanggal = (dateString) => {
    const dateObj = safeParseDate(dateString);
    if (!dateObj) return '-';
    return dateObj.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  useEffect(() => {
    fetchRiwayatProperti();
  }, []);

  const fetchRiwayatProperti = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.get('/admin/properties');
      const dataBackend = response.data.data || response.data || [];

      // DETEKSI PROPERTI PERDANA DINAMIS BERDASARKAN ID TERKECIL
      const sortedData = [...dataBackend].sort((a, b) => Number(a.id) - Number(b.id));
      const firstPropertyId = sortedData[0]?.id;

      const mappedData = dataBackend.map((item) => {
        const rawApproval = String(item.approval_status || '').toLowerCase().trim();
        const paymentStatusRaw = String(item.payment_status || '').toLowerCase().trim();
        const proofUrl = item.payment_proof || item.bukti_pembayaran || item.bukti_transfer || null;
        
        const isPaidSlot = Boolean(item.is_paid_slot) || paymentStatusRaw === 'paid';
        
        // Pengecekan mutlak apakah properti ini adalah properti pertama yang dibuat
        const isFirstProperty = item.id === firstPropertyId || item.is_first_property === true || item.slot_fee === 0;

        let isLunas = false;
        let isWaiting = false;
        let isRejected = false;
        let isPending = false;

        if (rawApproval === 'rejected' || rawApproval === 'ditolak') {
          isRejected = true;
        } else if (isFirstProperty || isPaidSlot) {
          // Otomatis lunas/aktif jika ini properti perdana (pertama kali dibuat)
          isLunas = true;
        } else if (rawApproval === 'waiting_verification' || Boolean(proofUrl)) {
          isWaiting = true;
        } else {
          isPending = true;
        }

        return {
          id: item.id ? `SLOT-${item.id}` : `SLOT-${Date.now()}`,
          propertiId: item.id,
          title: item.title || item.nama || 'Properti Tanpa Nama',
          type: item.type || 'Kost',
          genderType: item.gender_type || 'Campur',
          address: item.address || 'Alamat tidak dicantumkan',
          tanggalPengajuan: formatTanggal(item.created_at),
          created_at: item.created_at,
          
          isFirstProperty,
          biayaSlot: isFirstProperty ? 'GRATIS (Slot Perdana)' : formatRupiah(item.slot_fee ?? 150000),
          paymentProof: proofUrl,
          
          isLunas,
          isWaiting,
          isPending,
          isRejected,

          gambar: item.main_image || item.image || item.gambar
            ? `http://127.0.0.1:8000/storage/${item.main_image || item.image || item.gambar}`
            : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80',
        };
      });

      setProperties(mappedData);
    } catch (err) {
      console.error('Gagal mengambil riwayat:', err);
      setError('Gagal memuat riwayat pembayaran slot.');
    } finally {
      setLoading(false);
    }
  };

  const handleBayarSekarang = (item) => {
    if (!item.propertiId) {
      Swal.fire('Error', 'ID Properti tidak ditemukan', 'error');
      return;
    }
    navigate(`/admin/pembayaran/${item.propertiId}`, { state: { property: item } });
  };

  const showProofModal = (proofUrl) => {
    if (!proofUrl) return;
    const fullUrl = proofUrl.startsWith('http') ? proofUrl : `http://127.0.0.1:8000/storage/${proofUrl}`;
    Swal.fire({
      title: 'Bukti Transfer Pembayaran Slot',
      imageUrl: fullUrl,
      confirmButtonColor: '#B38E5D',
    });
  };

  const filteredProperties = properties.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'active') return item.isLunas;
    if (filter === 'waiting_verification') return item.isWaiting;
    if (filter === 'pending_payment') return item.isPending;
    if (filter === 'rejected') return item.isRejected;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAF5EF] text-[#2D2321] font-sans antialiased pb-20 selection:bg-[#B38E5D] selection:text-white">
      <div className="max-w-5xl mx-auto px-6 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <span className="block text-xs tracking-widest text-[#B38E5D] uppercase font-bold">
              Pembayaran Slot Properti (Admin ke SuperAdmin)
            </span>
            <h1 className="text-3xl font-serif font-bold tracking-wide mt-1 text-[#2D2321]">
              Riwayat Pembayaran Properti
            </h1>
          </div>
          <button 
            onClick={() => fetchRiwayatProperti()}
            className="bg-[#2D2321] text-[#FAF5EF] px-4 py-2.5 font-bold text-xs tracking-widest uppercase shadow-md hover:bg-[#B38E5D] transition-all cursor-pointer rounded flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> REFRESH DATA
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        <div className="flex gap-2 flex-wrap mb-6">
          {[
            { key: 'ALL', label: 'SEMUA' },
            { key: 'active', label: 'AKTIF / LUNAS' },
            { key: 'waiting_verification', label: 'MENUNGGU VERIFIKASI' },
            { key: 'pending_payment', label: 'BELUM DIBAYAR' },
            { key: 'rejected', label: 'DITOLAK' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded text-xs font-bold transition-all uppercase tracking-wider cursor-pointer ${
                filter === tab.key
                  ? 'bg-[#B38E5D] text-white shadow-md'
                  : 'bg-white text-[#5C4A42] border border-[#D7C4B0] hover:bg-[#FAF5EF]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full h-[1px] bg-[#D7C4B0] mb-8"></div>

        {error && <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl text-xs font-bold">⚠️ {error}</div>}

        {loading ? (
          <div className="bg-white border border-[#D7C4B0] p-12 text-center rounded-xl shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-[#B38E5D] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[#5C4A42] font-medium text-xs uppercase tracking-wider mt-2">Memuat riwayat pembayaran slot...</p>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="bg-white border border-[#D7C4B0] p-12 text-center rounded-xl shadow-sm">
            <p className="text-[#5C4A42] font-medium text-sm">Tidak ada riwayat pembayaran slot properti pada kategori ini.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProperties.map((item) => (
              <div key={item.id} className="bg-white border border-[#D7C4B0] overflow-hidden shadow-sm hover:shadow-md transition-all rounded-xl">
                <div className="bg-[#FAF5EF]/50 px-6 py-4 border-b border-[#D7C4B0] flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#B38E5D] bg-[#B38E5D]/10 px-2 py-1 border border-[#B38E5D]/30 font-bold rounded">
                      {item.id}
                    </span>
                    <span className="text-xs text-[#5C4A42] font-medium">Tgl Pengajuan: <strong className="text-[#2D2321]">{item.tanggalPengajuan}</strong></span>
                    {item.isFirstProperty && (
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" /> Free Slot (Properti Perdana)
                      </span>
                    )}
                  </div>
                  
                  <span className={`text-[11px] font-bold px-3 py-1 uppercase tracking-wider rounded ${
                    item.isLunas ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 
                    item.isWaiting ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    item.isRejected ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    • {item.isLunas ? 'AKTIF / LUNAS' : item.isWaiting ? 'MENUNGGU VERIFIKASI' : item.isRejected ? 'DITOLAK' : 'BELUM DIBAYAR'}
                  </span>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-1 overflow-hidden rounded-lg">
                    <img src={item.gambar} alt={item.title} className="w-full h-40 md:h-36 object-cover border border-[#D7C4B0] rounded-lg" />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#2D2321]">{item.title}</h3>
                      <p className="text-xs text-[#5C4A42] mt-0.5">{item.address}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FAF5EF] rounded-lg p-3 border border-[#D7C4B0] text-xs">
                      <div>
                        <span className="text-[#5C4A42] block text-[10px] uppercase tracking-wider font-bold">Kategori:</span>
                        <span className="text-[#2D2321] font-semibold capitalize">{item.type} ({item.genderType})</span>
                      </div>
                      <div>
                        <span className="text-[#5C4A42] block text-[10px] uppercase tracking-wider font-bold">Biaya Slot:</span>
                        <span className="text-[#B38E5D] font-bold text-sm">{item.biayaSlot}</span>
                      </div>
                      <div>
                        <span className="text-[#5C4A42] block text-[10px] uppercase tracking-wider font-bold">Status Layanan:</span>
                        <span className={`font-bold ${
                          item.isLunas ? 'text-emerald-700' :
                          item.isWaiting ? 'text-blue-700' :
                          item.isRejected ? 'text-red-700' : 'text-amber-700'
                        }`}>
                          {item.isLunas ? 'Publikasi Aktif' : item.isWaiting ? 'Proses Verifikasi' : item.isRejected ? 'Ditolak' : 'Belum Dibayar'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#FAF5EF]/50 px-6 py-4 border-t border-[#D7C4B0] flex flex-wrap justify-between items-center gap-4">
                  <div className="text-xs font-medium">
                    {item.isLunas ? (
                      <span className="text-emerald-600 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> {item.isFirstProperty ? 'Slot Perdana Gratis Disetujui & Tampil di Aplikasi' : 'Slot Properti Disetujui & Tampil di Aplikasi'}
                      </span>
                    ) : item.isWaiting ? (
                      <span className="text-blue-600 flex items-center gap-1 font-bold">
                        <Clock className="w-4 h-4" /> Pembayaran/Pengajuan Sedang Diperiksa SuperAdmin
                      </span>
                    ) : item.isRejected ? (
                      <span className="text-red-600 flex items-center gap-1 font-bold">
                        <XCircle className="w-4 h-4" /> Pengajuan Properti Ditolak oleh SuperAdmin
                      </span>
                    ) : (
                      <span className="text-amber-700 flex items-center gap-1 font-bold">
                        ⚠️ Segera Lunasi Biaya Publikasi Properti
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 flex-wrap items-center">
                    {item.isPending && (
                      <button 
                        onClick={() => handleBayarSekarang(item)}
                        className="bg-[#B38E5D] text-white font-bold px-5 py-2 text-xs tracking-widest uppercase hover:bg-[#8C6D43] transition-colors cursor-pointer rounded shadow-sm flex items-center gap-1.5 animate-pulse"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> BAYAR SEKARANG
                      </button>
                    )}

                    {item.paymentProof && (
                      <button 
                        onClick={() => showProofModal(item.paymentProof)}
                        className="bg-gray-100 border border-[#D7C4B0] text-[#5C4A42] font-bold px-4 py-2 text-xs tracking-widest uppercase hover:bg-gray-200 transition-colors cursor-pointer rounded shadow-sm flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> BUKTI BAYAR
                      </button>
                    )}

                    <button 
                      onClick={() => setSelectedStruk(item)}
                      className="bg-white border border-[#D7C4B0] text-[#5C4A42] font-bold px-5 py-2 text-xs tracking-widest uppercase hover:border-[#B38E5D] hover:text-[#B38E5D] transition-colors cursor-pointer rounded shadow-sm flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> LIHAT STRUK SLOT
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStruk && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white text-[#2D2321] border border-[#D7C4B0] rounded-xl w-full max-w-md p-6 shadow-2xl font-mono text-xs relative">
            <div className="text-center pb-4 border-b border-dashed border-[#D7C4B0] space-y-1">
              <h2 className="text-base font-bold uppercase font-serif tracking-wider text-[#2D2321]">BUKTI PEMBAYARAN SLOT</h2>
              <p className="text-[10px] text-[#5C4A42]">No. Transaksi: {selectedStruk.id}</p>
            </div>

            <div className="py-4 space-y-2 border-b border-dashed border-[#D7C4B0]">
              <div className="flex justify-between">
                <span className="text-[#5C4A42]">Tgl Pengajuan:</span>
                <span className="font-semibold">{selectedStruk.tanggalPengajuan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C4A42]">Nama Properti:</span>
                <span className="font-semibold">{selectedStruk.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C4A42]">Tipe Properti:</span>
                <span className="font-semibold capitalize">{selectedStruk.type} ({selectedStruk.genderType})</span>
              </div>
            </div>

            <div className="py-4 space-y-2 border-b border-dashed border-[#D7C4B0]">
              <div className="flex justify-between font-bold text-sm pt-2">
                <span>BIAYA PUBLIKASI</span>
                <span className="text-[#B38E5D]">{selectedStruk.biayaSlot}</span>
              </div>
            </div>

            <div className="pt-4 text-center text-[10px] text-[#5C4A42] space-y-1">
              <p>Status Verifikasi: <strong className={
                selectedStruk.isLunas ? "text-emerald-600 uppercase" : 
                selectedStruk.isWaiting ? "text-blue-600 uppercase" : 
                selectedStruk.isRejected ? "text-red-600 uppercase" : "text-amber-600 uppercase"
              }>
                {selectedStruk.isLunas ? "● LUNAS / PROPERTI AKTIF" : 
                 selectedStruk.isWaiting ? "● MENUNGGU VERIFIKASI" : 
                 selectedStruk.isRejected ? "● DITOLAK" : "● BELUM DIBAYAR"}
              </strong></p>
            </div>

            <div className="mt-6 flex gap-2 font-sans">
              <button onClick={() => window.print()} className="flex-1 bg-[#2D2321] text-white py-2.5 text-xs font-bold uppercase hover:bg-[#B38E5D] rounded transition-colors cursor-pointer flex justify-center items-center gap-1">
                <Printer className="w-3.5 h-3.5" /> Cetak Struk
              </button>
              <button onClick={() => setSelectedStruk(null)} className="flex-1 border border-[#D7C4B0] text-[#5C4A42] py-2.5 text-xs font-bold uppercase hover:bg-[#FAF5EF] rounded transition-colors cursor-pointer">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}