import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import API from '../api'; 
import SidebarUser from '../components/SidebarUser';

export default function DokumenSewa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sigCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // STATE MANAGEMENT
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listDokumen, setListDokumen] = useState([]);
  const [dokumen, setDokumen] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [sigMode, setSigMode] = useState('draw'); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const storageBaseUrl = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage';

  // 🌟 HELPER UNTUK MEMINIMALKAN ERROR URL TTD (BASE64 VS FILE PATH)
  const getSignatureUrl = (sig) => {
    if (!sig) return '';
    if (sig.startsWith('data:image') || sig.startsWith('http://') || sig.startsWith('https://')) {
      return sig;
    }
    return `${storageBaseUrl}/${sig.replace(/^\//, '')}`;
  };

  // =========================================================================
  // 🔌 FETCH DAFTAR DOKUMEN USER
  // =========================================================================
  const fetchAllUserDokumen = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get('/user/dokumen-sewa');
      const docs = res.data.data || [];
      setListDokumen(docs);

      if (docs.length > 0) {
        const activeDoc = id 
          ? docs.find(d => d.id.toString() === id.toString() || d.pemesanan_id?.toString() === id.toString()) || docs[0]
          : docs[0];
        
        setDokumen(activeDoc);
      } else {
        setDokumen(null);
      }
    } catch (error) {
      console.error('Gagal memuat dokumen sewa:', error);
      setErrorMessage(error.response?.data?.message || 'Gagal memuat dokumen sewa.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAllUserDokumen();
  }, [fetchAllUserDokumen]);

  const handleSelectDokumen = (doc) => {
    setDokumen(doc);
    setSuccessMessage('');
    setErrorMessage('');
    navigate(`/dokumen-sewa/${doc.id}`, { replace: true });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert('Ukuran file tanda tangan maksimal 1MB!');
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const clearCanvas = () => {
    sigCanvasRef.current?.clear();
  };

  const dataURLtoFile = (dataurl, filename) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleUploadSignature = async (e) => {
    e.preventDefault();
    if (!dokumen) return;

    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('role', 'customer');

      if (sigMode === 'draw') {
        if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
          alert('Silakan buat tanda tangan Anda terlebih dahulu pada area canvas!');
          setSubmitting(false);
          return;
        }
        
        const canvas = sigCanvasRef.current.getCanvas();
        const dataUrl = canvas.toDataURL('image/png');
        const signatureFile = dataURLtoFile(dataUrl, 'signature-customer.png');
        formData.append('signature', signatureFile);
      } else {
        if (!selectedFile) {
          alert('Silakan pilih file gambar tanda tangan!');
          setSubmitting(false);
          return;
        }
        formData.append('signature', selectedFile);
      }

      const res = await API.post(`/dokumen-sewa/${dokumen.id}/tanda-tangan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMessage(res.data?.message || 'Tanda tangan digital berhasil disimpan!');
      await fetchAllUserDokumen();
    } catch (error) {
      console.error('Gagal upload tanda tangan:', error);
      setErrorMessage(error.response?.data?.message || 'Gagal menyimpan tanda tangan.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number || 0);
  };

  const customerSig = dokumen?.customer_signature || dokumen?.signature;

  return (
    <SidebarUser>
      <div className="w-full min-h-screen bg-[#FAF6F0] text-[#261C19] font-sans p-4 md:p-8 relative">
        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          
          {/* HEADER NAVIGASI */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#E5D7C5] shadow-sm print:hidden">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)} 
                className="w-10 h-10 rounded-xl bg-[#FAF6F0] hover:bg-[#E5D7C5]/50 flex items-center justify-center border border-[#E5D7C5] transition font-bold"
              >
                ←
              </button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block">Official Agreement</span>
                <h1 className="text-xl font-extrabold text-[#261C19]">Dokumen Perjanjian Sewa</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.print()} 
                className="text-xs font-extrabold uppercase tracking-wider bg-[#261C19] hover:bg-[#3D2D29] text-white px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer"
              >
                🖨️ Cetak / Download PDF
              </button>
            </div>
          </div>

          {/* TAB PEMILIH UNIT */}
          {listDokumen.length > 1 && (
            <div className="bg-white p-4 rounded-2xl border border-[#E5D7C5] shadow-xs space-y-2 print:hidden">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Pilih Dokumen Unit Hunian Anda ({listDokumen.length} Unit Aktif):
              </span>
              <div className="flex flex-wrap gap-2">
                {listDokumen.map((docItem, index) => {
                  const isSelected = dokumen?.id === docItem.id;
                  const nomorKamar = docItem.pemesanan?.kamar?.nomor_kamar;
                  const namaProperti = docItem.pemesanan?.properti?.title || `Unit #${index + 1}`;
                  const isSigned = docItem.customer_signature || docItem.signature;

                  return (
                    <button
                      key={docItem.id}
                      onClick={() => handleSelectDokumen(docItem)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                        isSelected 
                          ? 'bg-[#261C19] text-[#FAF5EF] border-[#261C19] shadow-sm' 
                          : 'bg-[#FAF6F0] text-[#261C19] border-[#E5D7C5] hover:border-[#C5A059]'
                      }`}
                    >
                      <span>🏢 {namaProperti}</span>
                      {nomorKamar && <span className="opacity-80">(Kamar {nomorKamar})</span>}
                      {isSigned && docItem.admin_signature ? (
                        <span className="text-emerald-400 text-[10px]">✓ Sah</span>
                      ) : (
                        <span className="text-amber-400 text-[10px]">⌛ Pending</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* NOTIFIKASI */}
          {successMessage && (
            <div className="p-4 bg-emerald-900 text-white font-medium text-sm rounded-2xl shadow-lg border border-emerald-700 flex justify-between items-center print:hidden">
              <span>✨ <strong>Berhasil:</strong> {successMessage}</span>
              <button onClick={() => setSuccessMessage('')}>✕</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-900 text-white font-medium text-sm rounded-2xl shadow-lg border border-rose-700 flex justify-between items-center print:hidden">
              <span>⚠️ <strong>Sistem Error:</strong> {errorMessage}</span>
              <button onClick={() => setErrorMessage('')}>✕</button>
            </div>
          )}

          {/* LOADING STATE */}
          {loading ? (
            <div className="bg-white p-16 rounded-3xl border border-[#E5D7C5] text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-slate-600 text-sm font-bold tracking-widest uppercase">Memuat Dokumen Legal...</p>
            </div>
          ) : dokumen ? (

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEMBAR SURAT PERJANJIAN */}
              <div className="lg:col-span-7 bg-white p-8 md:p-10 rounded-3xl border border-[#E5D7C5] shadow-xl space-y-8 print:w-full print:shadow-none print:border-none print:p-0">
                
                <div className="border-b-2 border-[#261C19] pb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black text-[#261C19] tracking-tight">KAFANA VISTA</h2>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Boutique Residence & Living space</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black bg-[#C5A059]/20 text-[#9C7A3C] px-3 py-1 rounded-full uppercase tracking-wider">
                      DOC #{dokumen.id.toString().padStart(4, '0')}
                    </span>
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black uppercase tracking-wider text-[#261C19]">Surat Perjanjian Sewa Menyerahkan Unit Hunian</h3>
                  <p className="text-xs text-slate-400 font-medium">Nomor Kontrak: KFN/LEASE/{new Date().getFullYear()}/{dokumen.id}</p>
                </div>

                <div className="bg-[#FAF6F0]/60 p-6 rounded-2xl border border-[#E5D7C5]/80 text-sm leading-relaxed text-[#261C19] whitespace-pre-line font-serif">
                  {dokumen.lease_agreement}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#C5A059]">Rincian Ringkas Sewa</h4>
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 block font-medium">Tanggal Mulai (Check-in)</span>
                      <strong className="text-[#261C19] font-bold">{formatDate(dokumen.start_date)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Tanggal Selesai</span>
                      <strong className="text-[#261C19] font-bold">{formatDate(dokumen.end_date)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Durasi Sewa</span>
                      <strong className="text-[#C5A059] font-bold">{dokumen.pemesanan?.duration_months} Bulan</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Total Biaya Lunas</span>
                      <strong className="text-[#261C19] font-bold">{formatRupiah(dokumen.pemesanan?.total_price)}</strong>
                    </div>
                  </div>
                </div>

                {/* TANDA TANGAN */}
                <div className="pt-6 border-t border-slate-200">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 text-center mb-6">Pengesahan Para Pihak</h4>
                  
                  <div className="grid grid-cols-2 gap-6 text-center">
                    
                    {/* PIHAK 1 (ADMIN) */}
                    <div className="space-y-3 flex flex-col items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pihak Pertama (Pengelola)</span>
                      <div className="w-full h-28 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center p-2 bg-slate-50/50">
                        {dokumen.admin_signature ? (
                          <img 
                            src={getSignatureUrl(dokumen.admin_signature)} 
                            alt="TTD Admin" 
                            className="max-h-full object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium italic">⏳ Menunggu TTD Management</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#261C19]">Management Kafana Vista</span>
                    </div>

                    {/* PIHAK 2 (PENYEWA) */}
                    <div className="space-y-3 flex flex-col items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pihak Kedua (Penyewa)</span>
                      <div className="w-full h-28 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center p-2 bg-slate-50/50">
                        {customerSig ? (
                          <img 
                            src={getSignatureUrl(customerSig)} 
                            alt="TTD Penyewa" 
                            className="max-h-full object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-rose-500 font-medium italic">❌ Belum Ditandatangani</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-[#261C19]">{dokumen.pemesanan?.customer?.name || "Penyewa"}</span>
                    </div>

                  </div>
                </div>

              </div>

              {/* ACTION FORM TANDA TANGAN */}
              <div className="lg:col-span-5 space-y-6 print:hidden">
                
                <div className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status Dokumen</span>
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      customerSig && dokumen.admin_signature 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {customerSig && dokumen.admin_signature ? 'Sah & Masuk Berlaku' : 'Butuh Tanda Tangan'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Dokumen ini merupakan bukti hukum yang sah atas hak guna sewa kamar/hunian Anda di Kafana Vista.
                  </p>
                </div>

                {!customerSig ? (
                  <div className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-xl space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-extrabold text-[#261C19]">Bubuhkan Tanda Tangan Digital</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Silakan tandatangani dokumen ini secara resmi.</p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1.5 rounded-xl border border-[#E5D7C5]/60">
                      <button 
                        type="button"
                        onClick={() => setSigMode('draw')}
                        className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${
                          sigMode === 'draw' ? 'bg-[#261C19] text-white shadow-xs' : 'text-slate-500 hover:text-[#261C19]'
                        }`}
                      >
                        ✍️ Corat-coret Canvas
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSigMode('upload')}
                        className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${
                          sigMode === 'upload' ? 'bg-[#261C19] text-white shadow-xs' : 'text-slate-500 hover:text-[#261C19]'
                        }`}
                      >
                        📁 Upload Gambar PNG
                      </button>
                    </div>

                    <form onSubmit={handleUploadSignature} className="space-y-4">
                      
                      {sigMode === 'draw' && (
                        <div className="space-y-2">
                          <div className="border-2 border-dashed border-[#C5A059]/50 rounded-2xl bg-[#FAF6F0]/30 overflow-hidden relative">
                            <SignatureCanvas 
                              ref={sigCanvasRef}
                              canvasProps={{ className: 'w-full h-44 cursor-crosshair' }}
                              penColor="#261C19"
                            />
                            <button 
                              type="button"
                              onClick={clearCanvas}
                              className="absolute top-2 right-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-md transition"
                            >
                              🗑️ Bersihkan
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 italic text-center">Gunakan jari (di HP) atau mouse untuk membuat tanda tangan.</p>
                        </div>
                      )}

                      {sigMode === 'upload' && (
                        <div className="space-y-3">
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-[#C5A059]/50 hover:bg-[#FAF6F0]/50 p-6 rounded-2xl text-center cursor-pointer transition space-y-2"
                          >
                            <span className="text-3xl block">📤</span>
                            <span className="text-xs font-bold text-[#261C19] block">Klik untuk memilih file foto TTD</span>
                            <span className="text-[10px] text-slate-400 block">Format: PNG, JPG (Max 1MB)</span>
                          </div>

                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange}
                            accept="image/png,image/jpeg,image/jpg" 
                            className="hidden" 
                          />

                          {filePreview && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                              <img src={filePreview} alt="Preview" className="h-10 object-contain" />
                              <button type="button" onClick={() => { setSelectedFile(null); setFilePreview(null); }} className="text-xs text-rose-600 font-bold">Hapus</button>
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#9C7A3C] text-[#261C19] font-extrabold text-xs uppercase tracking-widest rounded-xl transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submitting ? 'Menyimpan...' : '✍️ Simpan & Sahkan Perjanjian'}
                      </button>

                    </form>
                  </div>
                ) : (
                  <div className="bg-[#261C19] text-[#FAF5EF] p-6 rounded-3xl border border-[#C5A059]/40 shadow-xl space-y-3 text-center">
                    <span className="text-4xl block">🎉</span>
                    <h3 className="text-lg font-black text-white">Tanda Tangan Diterima!</h3>
                    <p className="text-xs text-[#E5D7C5]/80 leading-relaxed">
                      Anda telah menandatangani dokumen sewa untuk unit ini.
                    </p>
                  </div>
                )}

              </div>

            </div>

          ) : (
            <div className="bg-white p-12 rounded-3xl border border-[#E5D7C5] text-center space-y-3">
              <span className="text-3xl">❓</span>
              <h3 className="text-base font-bold text-[#261C19]">Dokumen Tidak Ditemukan</h3>
              <p className="text-xs text-slate-500">Anda belum memiliki dokumen sewa yang aktif.</p>
            </div>
          )}

        </div>
      </div>
    </SidebarUser>
  );
}