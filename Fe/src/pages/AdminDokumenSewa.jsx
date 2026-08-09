import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import API from '../api'; 
import SidebarAdmin from '../components/SidebarAdmin';


export default function AdminDokumenSewa() {
  const { id } = useParams(); // ID Dokumen (Opsional)
  const navigate = useNavigate();
  const sigCanvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // STATE MANAGEMENT
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [listDokumen, setListDokumen] = useState([]); // Daftar Semua Dokumen Sewa
  const [dokumen, setDokumen] = useState(null);       // Detail Dokumen yang dipilih
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const [sigMode, setSigMode] = useState('draw'); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // =========================================================================
  // 🔌 1. FETCH DAFTAR SEMUA DOKUMEN ADMIN (Jika Tanpa ID)
  // =========================================================================
  const fetchAllDokumen = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/dokumen-sewa');
      setListDokumen(res.data.data || []);
    } catch (error) {
      console.error('Gagal mengambil daftar dokumen:', error);
      setErrorMessage('Gagal memuat daftar dokumen sewa penyewa.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 🔌 2. FETCH DETAIL DOKUMEN SPESIFIK (Jika Ada ID di URL)
  // =========================================================================
  const fetchSingleDokumen = useCallback(async (docId) => {
    try {
      setLoading(true);
      const res = await API.get(`/dokumen-sewa/${docId}`);
      setDokumen(res.data.data);
    } catch (error) {
      console.error('Gagal memuat detail dokumen sewa:', error);
      setErrorMessage('Dokumen sewa tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchSingleDokumen(id);
    } else {
      setDokumen(null);
      fetchAllDokumen();
    }
  }, [id, fetchSingleDokumen]);

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

  // =========================================================================
  // 🚀 UPLOAD TANDA TANGAN ADMIN
  // =========================================================================
  const handleUploadSignature = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();
      formData.append('role', 'admin');

      if (sigMode === 'draw') {
        if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
          alert('Silakan buat tanda tangan Management terlebih dahulu!');
          setSubmitting(false);
          return;
        }
        
        const canvas = sigCanvasRef.current.getCanvas();
        const dataUrl = canvas.toDataURL('image/png');
        const signatureFile = dataURLtoFile(dataUrl, 'signature-admin.png');
        formData.append('signature', signatureFile);
      } else {
        if (!selectedFile) {
          alert('Silakan pilih file gambar tanda tangan!');
          setSubmitting(false);
          return;
        }
        formData.append('signature', selectedFile);
      }

      const targetDocId = dokumen?.id || id;

      const res = await API.post(`/dokumen-sewa/${targetDocId}/tanda-tangan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMessage(res.data?.message || 'Tanda tangan Management berhasil disimpan!');
      fetchSingleDokumen(targetDocId);
    } catch (error) {
      console.error('Gagal upload tanda tangan admin:', error);
      setErrorMessage('Gagal menyimpan tanda tangan admin.');
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

  const storageBaseUrl = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage';

  return (
    <SidebarAdmin>

    <div className="w-full min-h-screen bg-[#FAF6F0] text-[#261C19] font-sans p-4 md:p-8 relative">
      
      {/* AMBIENT GLOW EFFECT */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">
        
        {/* HEADER NAVBAR ADMIN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 rounded-2xl border border-[#E5D7C5] shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            {id && (
              <button 
                onClick={() => navigate('/admin/dokumen-sewa')} 
                className="w-10 h-10 rounded-xl bg-[#FAF6F0] hover:bg-[#E5D7C5]/50 flex items-center justify-center border border-[#E5D7C5] transition font-bold text-[#261C19]"
              >
                ←
              </button>
            )}
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block">Admin Management</span>
              <h1 className="text-xl font-extrabold text-[#261C19]">
                {id ? 'Validasi & TTD Dokumen Sewa' : 'Daftar Dokumen Sewa Penyewa'}
              </h1>
            </div>
          </div>

          {id && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => window.print()} 
                className="text-xs font-extrabold uppercase tracking-wider bg-[#261C19] hover:bg-[#3D2D29] text-white px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2"
              >
                🖨️ Cetak / Download PDF
              </button>
            </div>
          )}
        </div>

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
            <p className="text-slate-600 text-sm font-bold tracking-widest uppercase">Memuat Data Dokumen Sewa...</p>
          </div>
        ) : !id ? (

          /* ========================================================================= */
          /* MODE 1: TAMPILAN DAFTAR KARTU DOKUMEN SEWA PENYEWA (LIST VIEW) */
          /* ========================================================================= */
          <div className="space-y-4">
            <p className="text-xs text-slate-500 font-medium">Pilih salah satu penyewa di bawah untuk melihat draf surat dan membubuhkan TTD Management:</p>

            {listDokumen.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-[#E5D7C5] text-center space-y-3">
                <span className="text-4xl block">📋</span>
                <h3 className="text-base font-bold text-[#261C19]">Belum Ada Dokumen Sewa Aktif</h3>
                <p className="text-xs text-slate-500">Dokumen akan otomatis diterbitkan setelah pemesanan penyewa dikonfirmasi.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {listDokumen.map((doc) => {
                  const penyewaName = doc.pemesanan?.customer?.name || 'Penyewa';
                  const propertiName = doc.pemesanan?.properti?.title || 'Kost / Properti';
                  const nomorKamar = doc.pemesanan?.kamar?.nomor_kamar ? ` (Kamar ${doc.pemesanan.kamar.nomor_kamar})` : '';

                  return (
                    <div 
                      key={doc.id} 
                      className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black bg-[#C5A059]/20 text-[#9C7A3C] px-2.5 py-1 rounded-full uppercase">
                            DOC #{doc.id.toString().padStart(4, '0')}
                          </span>
                          
                          {/* Badge Status TTD Admin */}
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            doc.admin_signature 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {doc.admin_signature ? '✓ TTD Admin' : '⏳ Butuh TTD'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-extrabold text-[#261C19]">{penyewaName}</h3>
                          <p className="text-xs text-slate-500 font-medium">{propertiName}{nomorKamar}</p>
                        </div>

                        <div className="text-[11px] bg-[#FAF6F0]/60 p-3 rounded-xl space-y-1 text-[#261C19] border border-[#E5D7C5]/60">
                          <div><strong className="text-slate-400">Mulai:</strong> {formatDate(doc.start_date)}</div>
                          <div><strong className="text-slate-400">Selesai:</strong> {formatDate(doc.end_date)}</div>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/admin/dokumen-sewa/${doc.id}`)}
                        className="w-full py-2.5 bg-[#261C19] hover:bg-[#3D2D29] text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                      >
                        ✍️ Buka & TTD Perjanjian
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        ) : dokumen ? (

          /* ========================================================================= */
          /* MODE 2: TAMPILAN DETAIL DOKUMEN & AREA TTD ADMIN (DETAIL VIEW) */
          /* ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* PRATINJAU SURAT (PRINTABLE) */}
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
                <h3 className="text-lg font-black uppercase tracking-wider text-[#261C19]">Surat Perjanjian Sewa Menyerahkan Unithunian</h3>
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

              {/* STATUS TTD */}
              <div className="pt-6 border-t border-slate-200">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 text-center mb-6">Pengesahan Para Pihak</h4>
                
                <div className="grid grid-cols-2 gap-6 text-center">
                  <div className="space-y-3 flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pihak Pertama (Pengelola)</span>
                    <div className="w-full h-28 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center p-2 bg-slate-50/50">
                      {dokumen.admin_signature ? (
                        <img src={`${storageBaseUrl}/${dokumen.admin_signature}`} alt="TTD Admin" className="max-h-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-amber-600 font-medium italic">⏳ Menunggu TTD Management</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#261C19]">Management Kafana Vista</span>
                  </div>

                  <div className="space-y-3 flex flex-col items-center">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pihak Kedua (Penyewa)</span>
                    <div className="w-full h-28 border border-dashed border-slate-300 rounded-2xl flex items-center justify-center p-2 bg-slate-50/50">
                      {dokumen.customer_signature ? (
                        <img src={`${storageBaseUrl}/${dokumen.customer_signature}`} alt="TTD Penyewa" className="max-h-full object-contain" />
                      ) : (
                        <span className="text-[11px] text-rose-500 font-medium italic">❌ Belum Ditandatangani User</span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#261C19]">{dokumen.pemesanan?.customer?.name || "Penyewa"}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* ACTION FORM TTD ADMIN */}
            <div className="lg:col-span-5 space-y-6 print:hidden">
              <div className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status TTD Management</span>
                  <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    dokumen.admin_signature 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {dokumen.admin_signature ? 'Sudah Ditandatangani' : 'Perlu TTD Admin'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Tandatangani dokumen ini agar berlaku sah bagi tenant ({dokumen.pemesanan?.customer?.name}).
                </p>
              </div>

              {!dokumen.admin_signature ? (
                <div className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-xl space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-extrabold text-[#261C19]">Bubuhkan TTD Management</h3>
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
                      ✍️ Canvas Coret
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setSigMode('upload')}
                      className={`flex-1 text-xs font-bold py-2 rounded-lg transition ${
                        sigMode === 'upload' ? 'bg-[#261C19] text-white shadow-xs' : 'text-slate-500 hover:text-[#261C19]'
                      }`}
                    >
                      📁 Upload Stempel/TTD
                    </button>
                  </div>

                  <form onSubmit={handleUploadSignature} className="space-y-4">
                    {sigMode === 'draw' && (
                      <div className="space-y-2">
                        <div className="border-2 border-dashed border-[#C5A059]/50 rounded-2xl bg-[#FAF6F0]/30 overflow-hidden relative">
                          <SignatureCanvas ref={sigCanvasRef} canvasProps={{ className: 'w-full h-44 cursor-crosshair' }} penColor="#261C19" />
                          <button type="button" onClick={clearCanvas} className="absolute top-2 right-2 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold px-2.5 py-1 rounded-md transition">🗑️ Bersihkan</button>
                        </div>
                        <p className="text-[11px] text-slate-400 italic text-center">Gunakan jari atau mouse untuk membuat tanda tangan.</p>
                      </div>
                    )}

                    {sigMode === 'upload' && (
                      <div className="space-y-3">
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#C5A059]/50 hover:bg-[#FAF6F0]/50 p-6 rounded-2xl text-center cursor-pointer transition space-y-2">
                          <span className="text-3xl block">📤</span>
                          <span className="text-xs font-bold text-[#261C19] block">Pilih Foto TTD/Stempel Admin</span>
                          <span className="text-[10px] text-slate-400 block">Format: PNG, JPG (Transparan disarankan, Max 1MB)</span>
                        </div>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png,image/jpeg,image/jpg" className="hidden" />
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
                      className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#9C7A3C] hover:opacity-95 text-[#261C19] font-extrabold text-xs uppercase tracking-widest rounded-xl transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? "Menyimpan TTD..." : "✍️ Sahkan & Simpan TTD Management"}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="bg-[#261C19] text-[#FAF5EF] p-6 rounded-3xl border border-[#C5A059]/40 shadow-xl space-y-3 text-center">
                  <span className="text-4xl block">🎉</span>
                  <h3 className="text-lg font-black text-white">Management Telah Menandatangani</h3>
                  <p className="text-xs text-[#E5D7C5]/80 leading-relaxed">
                    Tanda tangan resmi pengelola telah tersimpan. Dokumen ini dapat diunduh atau dicetak oleh penyewa.
                  </p>
                </div>
              )}

            </div>

          </div>

        ) : null}

      </div>
    </div>
        </SidebarAdmin>

  );
}