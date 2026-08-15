import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import API from '../api'; 
import SidebarAdmin from '../components/SidebarAdmin';

export default function AdminDokumenSewa() {
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
  
  // FILTER & SEARCH STATE
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [sigMode, setSigMode] = useState('draw'); 
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // State pendeteksi gambar error TTD
  const [adminSigError, setAdminSigError] = useState(false);
  const [tenantSigError, setTenantSigError] = useState(false);

  const storageBaseUrl = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage';

  // Helper Sanitasi URL Gambar TTD
  const getSignatureUrl = (path) => {
    if (!path || typeof path !== 'string') return null;
    const trimmed = path.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;

    if (trimmed.startsWith('data:image/')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;

    let cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    if (cleanPath.startsWith('storage/')) {
      cleanPath = cleanPath.replace(/^storage\//, '');
    }

    if (!cleanPath || cleanPath === 'storage' || cleanPath === 'storage/') return null;

    const baseUrlClean = storageBaseUrl.replace(/\/$/, '');
    return `${baseUrlClean}/${cleanPath}`;
  };

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

  const fetchSingleDokumen = useCallback(async (docId) => {
    try {
      setLoading(true);
      setAdminSigError(false);
      setTenantSigError(false);
      const res = await API.get(`/dokumen-sewa/${docId}`);
      
      const docData = res.data.data;
      setDokumen(docData);
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

  // COMPUTED: Filter & Search List Dokumen
  const filteredListDokumen = useMemo(() => {
    return listDokumen.filter((doc) => {
      const penyewaName = doc.pemesanan?.customer?.name?.toLowerCase() || '';
      const propertiName = doc.pemesanan?.properti?.title?.toLowerCase() || '';
      const docIdStr = `doc-#${doc.id}`.toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch =
        penyewaName.includes(searchLower) ||
        propertiName.includes(searchLower) ||
        docIdStr.includes(searchLower);

      const hasAdminSig = !!(doc.admin_signature || doc.signature_admin || doc.ttd_admin);
      const hasTenantSig = !!(
        doc.customer_signature || doc.user_signature || doc.tenant_signature ||
        doc.signature_user || doc.signature_tenant || doc.signature_customer ||
        doc.signature || doc.ttd_user || doc.ttd_penyewa ||
        doc.pemesanan?.customer_signature || doc.pemesanan?.user_signature || doc.pemesanan?.signature
      );

      let matchesStatus = true;
      if (statusFilter === 'need_admin') matchesStatus = !hasAdminSig;
      else if (statusFilter === 'need_tenant') matchesStatus = !hasTenantSig;
      else if (statusFilter === 'completed') matchesStatus = hasAdminSig && hasTenantSig;

      return matchesSearch && matchesStatus;
    });
  }, [listDokumen, searchTerm, statusFilter]);

  // COUNTERS FOR STATS
  const stats = useMemo(() => {
    const total = listDokumen.length;
    const needAdmin = listDokumen.filter(
      (d) => !(d.admin_signature || d.signature_admin || d.ttd_admin)
    ).length;
    const completed = listDokumen.filter((d) => {
      const hasAdmin = d.admin_signature || d.signature_admin || d.ttd_admin;
      const hasTenant =
        d.customer_signature || d.user_signature || d.tenant_signature ||
        d.signature_user || d.signature_tenant || d.signature_customer ||
        d.signature || d.ttd_user || d.ttd_penyewa ||
        d.pemesanan?.customer_signature || d.pemesanan?.user_signature || d.pemesanan?.signature;
      return hasAdmin && hasTenant;
    }).length;

    return { total, needAdmin, completed };
  }, [listDokumen]);

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
    setSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formData = new FormData();

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

  return (
    <SidebarAdmin>
      <div className="w-full min-h-screen bg-[#FAF6F0] text-[#261C19] font-sans p-4 sm:p-6 md:p-8 relative">
        {/* Decorative Background Blob */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          
          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-[#E5D7C5] shadow-sm print:hidden">
            <div className="flex items-center gap-3.5">
              {id && (
                <button 
                  onClick={() => navigate('/admin/dokumen-sewa')} 
                  className="w-10 h-10 rounded-2xl bg-[#FAF6F0] hover:bg-[#E5D7C5]/60 flex items-center justify-center border border-[#E5D7C5] transition-all font-bold text-[#261C19] active:scale-95 shadow-xs cursor-pointer"
                  title="Kembali ke Daftar Dokumen"
                >
                  ←
                </button>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block">
                    Management Control
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span>
                  <span className="text-[10px] font-semibold text-slate-400">Kafana Vista</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-[#261C19] tracking-tight mt-0.5">
                  {id ? 'Pengesahan & Detail Dokumen Sewa' : 'Daftar Dokumen Perjanjian Sewa'}
                </h1>
              </div>
            </div>

            {id && (
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => window.print()} 
                  className="text-xs font-bold uppercase tracking-wider bg-[#261C19] hover:bg-[#3D2D29] text-white px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <svg className="w-4 h-4 text-[#C5A059]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H7a2 2 0 00-2 2v4h14z" />
                  </svg>
                  <span>Cetak / Simpan PDF</span>
                </button>
              </div>
            )}
          </div>

          {/* NOTIFIKASI SYSTEM */}
          {successMessage && (
            <div className="p-4 bg-emerald-900 text-emerald-100 font-medium text-xs sm:text-sm rounded-2xl shadow-md border border-emerald-700 flex justify-between items-center print:hidden animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span><strong>Berhasil:</strong> {successMessage}</span>
              </div>
              <button onClick={() => setSuccessMessage('')} className="p-1 hover:bg-emerald-800 rounded-lg text-emerald-300 font-bold">✕</button>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-900 text-rose-100 font-medium text-xs sm:text-sm rounded-2xl shadow-md border border-rose-700 flex justify-between items-center print:hidden animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                <span><strong>Peringatan:</strong> {errorMessage}</span>
              </div>
              <button onClick={() => setErrorMessage('')} className="p-1 hover:bg-rose-800 rounded-lg text-rose-300 font-bold">✕</button>
            </div>
          )}

          {/* SKELETON LOADING STATE */}
          {loading ? (
            <div className="space-y-6">
              {!id && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-white rounded-2xl border border-[#E5D7C5] p-4 animate-pulse flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="h-3 w-20 bg-slate-200 rounded"></div>
                        <div className="h-5 w-12 bg-slate-200 rounded"></div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
                    </div>
                  ))}
                </div>
              )}

              <div className="bg-white p-8 sm:p-12 rounded-3xl border border-[#E5D7C5] text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-500 text-xs font-bold tracking-widest uppercase">
                  Memuat Data Dokumen Sewa...
                </p>
              </div>
            </div>
          ) : !id ? (

            /* LIST VIEW MODE */
            <div className="space-y-6">

              {/* STATS SUMMARY BAR */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5D7C5] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">Total Dokumen</span>
                    <span className="text-2xl font-black text-[#261C19]">{stats.total}</span>
                  </div>
                  <div className="p-3 bg-[#FAF6F0] rounded-xl text-[#C5A059] border border-[#E5D7C5]/60">
                    📂
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5D7C5] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 block">Perlu TTD Admin</span>
                    <span className="text-2xl font-black text-amber-700">{stats.needAdmin}</span>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
                    ✍️
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E5D7C5] shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 block">Lengkap & Sah</span>
                    <span className="text-2xl font-black text-emerald-700">{stats.completed}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-200">
                    ✅
                  </div>
                </div>
              </div>

              {/* SEARCH & FILTER TOOLBAR */}
              <div className="bg-white p-4 rounded-2xl border border-[#E5D7C5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                    🔍
                  </span>
                  <input
                    type="text"
                    placeholder="Cari Penyewa, Properti, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-[#E5D7C5] text-[#261C19] text-xs font-semibold rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-[#C5A059] focus:ring-1 focus:ring-[#C5A059] transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-[#261C19]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-400 shrink-0">Filter Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full sm:w-auto bg-[#FAF6F0] border border-[#E5D7C5] text-[#261C19] text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-[#C5A059] cursor-pointer"
                  >
                    <option value="all">Semua Status</option>
                    <option value="need_admin">⏳ Menunggu TTD Admin</option>
                    <option value="need_tenant">⚠️ Menunggu TTD Penyewa</option>
                    <option value="completed">✓ Dokumen Selesai</option>
                  </select>
                </div>
              </div>

              {/* LIST GRID DOKUMEN */}
              {filteredListDokumen.length === 0 ? (
                /* EMPTY STATE */
                <div className="bg-white p-12 sm:p-16 rounded-3xl border border-[#E5D7C5] text-center space-y-4 shadow-xs">
                  <div className="w-16 h-16 rounded-2xl bg-[#FAF6F0] border border-[#E5D7C5] flex items-center justify-center text-2xl mx-auto text-[#C5A059]">
                    📜
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-[#261C19]">
                      {searchTerm || statusFilter !== 'all' ? 'Dokumen Tidak Ditemukan' : 'Belum Ada Dokumen Sewa'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Coba ubah kata kunci pencarian atau filter status yang Anda gunakan.'
                        : 'Dokumen sewa otomatis terbuat setelah reservasi penyewa dikonfirmasi.'}
                    </p>
                  </div>
                  {(searchTerm || statusFilter !== 'all') && (
                    <button
                      onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                      className="px-4 py-2 bg-[#261C19] text-white text-xs font-bold rounded-xl hover:bg-[#3D2D29] transition"
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredListDokumen.map((doc) => {
                    const penyewaName = doc.pemesanan?.customer?.name || 'Penyewa';
                    const propertiName = doc.pemesanan?.properti?.title || doc.pemesanan?.properti?.nama_properti || 'Kost / Properti';
                    const nomorKamar = doc.pemesanan?.kamar?.nomor_kamar ? ` (Kamar ${doc.pemesanan.kamar.nomor_kamar})` : '';

                    const hasAdminSig = !!(doc.admin_signature || doc.signature_admin || doc.ttd_admin);
                    const hasTenantSig = !!(
                      doc.customer_signature || doc.user_signature || doc.tenant_signature ||
                      doc.signature_user || doc.signature_tenant || doc.signature_customer ||
                      doc.signature || doc.ttd_user || doc.ttd_penyewa ||
                      doc.pemesanan?.customer_signature || doc.pemesanan?.user_signature || doc.pemesanan?.signature
                    );

                    return (
                      <div 
                        key={doc.id} 
                        className="bg-white p-5 sm:p-6 rounded-3xl border border-[#E5D7C5] shadow-xs hover:shadow-md hover:border-[#C5A059]/60 transition-all duration-200 flex flex-col justify-between space-y-4 group"
                      >
                        <div className="space-y-3.5">
                          {/* TOP CARD BADGES */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black bg-[#C5A059]/15 text-[#9C7A3C] border border-[#C5A059]/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              DOC #{doc.id.toString().padStart(4, '0')}
                            </span>
                            
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
                              hasAdminSig 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                            }`}>
                              {hasAdminSig ? '✓ Admin TTD' : '⏳ Butuh TTD Admin'}
                            </span>
                          </div>

                          {/* PENYEWA & PROPERTI */}
                          <div>
                            <h3 className="text-base font-black text-[#261C19] group-hover:text-[#C5A059] transition-colors truncate">
                              {penyewaName}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                              🏢 {propertiName}{nomorKamar}
                            </p>
                          </div>

                          {/* PERIODE SEWA */}
                          <div className="text-[11px] bg-[#FAF6F0] p-3 rounded-2xl space-y-1.5 text-[#261C19] border border-[#E5D7C5]/60">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">Mulai:</span>
                              <strong className="font-bold">{formatDate(doc.start_date)}</strong>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                              <span className="text-slate-400 font-medium">Selesai:</span>
                              <strong className="font-bold">{formatDate(doc.end_date)}</strong>
                            </div>
                          </div>

                          {/* STATUS TTD PENYEWA INDICATOR */}
                          <div className="flex items-center gap-2 text-[11px] pt-1">
                            <span className="text-slate-400 font-medium">Status Tenant:</span>
                            {hasTenantSig ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Sudah TTD
                              </span>
                            ) : (
                              <span className="text-rose-600 font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                Belum TTD
                              </span>
                            )}
                          </div>
                        </div>

                        {/* TOMBOL AKSI */}
                        <button
                          onClick={() => navigate(`/admin/dokumen-sewa/${doc.id}`)}
                          className="w-full py-3 bg-[#261C19] hover:bg-[#3D2D29] active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer mt-2"
                        >
                          <span>✍️</span>
                          <span>Buka & TTD Perjanjian</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          ) : dokumen ? (

            /* DETAIL VIEW MODE */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* PRATINJAU SURAT PERJANJIAN */}
              <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-3xl border border-[#E5D7C5] shadow-xl space-y-8 print:w-full print:shadow-none print:border-none print:p-0">
                
                {/* HEADER SURAT KONTRAK */}
                <div className="border-b-2 border-[#261C19] pb-6 flex justify-between items-end">
                  <div>
                    <h2 className="text-2xl font-black text-[#261C19] tracking-tight">KAFANA VISTA</h2>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                      Boutique Residence & Living Space
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black bg-[#C5A059]/20 text-[#9C7A3C] border border-[#C5A059]/40 px-3 py-1 rounded-full uppercase tracking-wider">
                      DOC #{dokumen.id.toString().padStart(4, '0')}
                    </span>
                  </div>
                </div>

                {/* JUDUL SURAT */}
                <div className="text-center space-y-1">
                  <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-[#261C19]">
                    Surat Perjanjian Sewa Menyerahkan Unit Hunian
                  </h3>
                  <p className="text-xs text-slate-400 font-mono font-medium">
                    Nomor Kontrak: KFN/LEASE/{new Date().getFullYear()}/{dokumen.id}
                  </p>
                </div>

                {/* ISI SURAT KONTRAK */}
                <div className="bg-[#FAF6F0] p-6 sm:p-8 rounded-2xl border border-[#E5D7C5] text-xs sm:text-sm leading-relaxed text-[#261C19] whitespace-pre-line font-serif shadow-inner">
                  {dokumen.lease_agreement}
                </div>

                {/* RINCIAN KEUANGAN & TANGGAL */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#C5A059]">
                    Rincian Ringkas Sewa
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
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
                      <strong className="text-[#C5A059] font-bold">{dokumen.pemesanan?.duration_months || 1} Bulan</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Total Biaya Lunas</span>
                      <strong className="text-[#261C19] font-bold">{formatRupiah(dokumen.pemesanan?.total_price)}</strong>
                    </div>
                  </div>
                </div>

                {/* STATUS PENGESAHAN TTD PARA PIHAK */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">
                    Pengesahan Para Pihak
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 text-center">
                    
                    {/* PIHAK PERTAMA (MANAGEMENT ADMIN) */}
                    <div className="space-y-2.5 flex flex-col items-center">
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Pihak Pertama (Pengelola)
                      </span>
                      <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center p-2 bg-slate-50/50">
                        {(() => {
                          const adminSig = dokumen.admin_signature || dokumen.signature_admin || dokumen.ttd_admin;
                          const sigUrl = getSignatureUrl(adminSig);

                          if (!adminSig) {
                            return <span className="text-[11px] text-amber-600 font-bold italic">⏳ Belum Ditandatangani Management</span>;
                          }

                          if (adminSigError) {
                            return <span className="text-[11px] text-rose-500 font-bold italic">⚠️ Gambar TTD Gagal Dimuat</span>;
                          }

                          return sigUrl ? (
                            <img 
                              src={sigUrl} 
                              alt="TTD Admin" 
                              className="max-h-full object-contain"
                              onError={() => setAdminSigError(true)}
                            />
                          ) : (
                            <span className="text-[11px] text-amber-600 font-bold italic">⏳ Belum Ditandatangani Management</span>
                          );
                        })()}
                      </div>
                      <span className="text-xs font-extrabold text-[#261C19]">Management Kafana Vista</span>
                    </div>

                    {/* PIHAK KEDUA (PENYEWA / TENANT) */}
                    <div className="space-y-2.5 flex flex-col items-center">
                      <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                        Pihak Kedua (Penyewa)
                      </span>
                      <div className="w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl flex items-center justify-center p-2 bg-slate-50/50">
                        {(() => {
                          const customerSig = 
                            dokumen.customer_signature || 
                            dokumen.user_signature || 
                            dokumen.tenant_signature || 
                            dokumen.signature_user ||
                            dokumen.signature_tenant ||
                            dokumen.signature_customer ||
                            dokumen.signature || 
                            dokumen.ttd_user ||
                            dokumen.ttd_penyewa ||
                            dokumen.pemesanan?.customer_signature ||
                            dokumen.pemesanan?.user_signature ||
                            dokumen.pemesanan?.signature;

                          const sigUrl = getSignatureUrl(customerSig);

                          if (!customerSig) {
                            return <span className="text-[11px] text-rose-500 font-bold italic">❌ Belum Ditandatangani User</span>;
                          }

                          if (tenantSigError) {
                            return (
                              <div className="text-center p-1">
                                <span className="text-[11px] text-amber-700 font-bold block">⚠️ TTD User Ada, Tapi File Error</span>
                                <span className="text-[9px] text-slate-400 block truncate max-w-[150px] mt-0.5">{sigUrl}</span>
                              </div>
                            );
                          }

                          return sigUrl ? (
                            <img 
                              src={sigUrl} 
                              alt="TTD Penyewa" 
                              className="max-h-full object-contain"
                              onError={() => {
                                console.error('Gagal memuat TTD user dari URL:', sigUrl);
                                setTenantSigError(true);
                              }}
                            />
                          ) : (
                            <span className="text-[11px] text-rose-500 font-bold italic">❌ Belum Ditandatangani User</span>
                          );
                        })()}
                      </div>
                      <span className="text-xs font-extrabold text-[#261C19]">
                        {dokumen.pemesanan?.customer?.name || "Penyewa"}
                      </span>
                    </div>

                  </div>
                </div>

              </div>

              {/* ACTION PANEL FORM TTD ADMIN */}
              <div className="lg:col-span-5 space-y-6 print:hidden">
                
                {/* STATUS BADGE CARD */}
                <div className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                      Status Legalitas Dokumen
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      dokumen.admin_signature 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                    }`}>
                      {dokumen.admin_signature ? 'Sudah Disahkan' : 'Perlu TTD Management'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tandatangani dokumen ini agar surat perjanjian memiliki kekuatan hukum tetap bagi tenant (<strong>{dokumen.pemesanan?.customer?.name}</strong>).
                  </p>
                </div>

                {/* FORM PENGESAHAN TTD */}
                {!dokumen.admin_signature ? (
                  <div className="bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-xl space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-base font-black text-[#261C19]">Bubuhkan TTD Management</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Pilih metode pembuatan tanda tangan resmi di bawah ini.</p>
                    </div>

                    {/* TOGGLE TAB CANVAS / UPLOAD */}
                    <div className="flex items-center gap-1.5 bg-[#FAF6F0] p-1.5 rounded-2xl border border-[#E5D7C5]">
                      <button 
                        type="button" 
                        onClick={() => setSigMode('draw')}
                        className={`flex-1 text-xs font-bold py-2 rounded-xl transition ${
                          sigMode === 'draw' ? 'bg-[#261C19] text-white shadow-xs' : 'text-slate-500 hover:text-[#261C19]'
                        }`}
                      >
                        ✍️ Canvas Coret
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setSigMode('upload')}
                        className={`flex-1 text-xs font-bold py-2 rounded-xl transition ${
                          sigMode === 'upload' ? 'bg-[#261C19] text-white shadow-xs' : 'text-slate-500 hover:text-[#261C19]'
                        }`}
                      >
                        📁 Upload Stempel
                      </button>
                    </div>

                    <form onSubmit={handleUploadSignature} className="space-y-4">
                      {sigMode === 'draw' && (
                        <div className="space-y-2">
                          <div className="border-2 border-dashed border-[#C5A059]/60 rounded-2xl bg-[#FAF6F0]/40 overflow-hidden relative">
                            <SignatureCanvas 
                              ref={sigCanvasRef} 
                              canvasProps={{ className: 'w-full h-44 cursor-crosshair' }} 
                              penColor="#261C19" 
                            />
                            <button 
                              type="button" 
                              onClick={clearCanvas} 
                              className="absolute top-2.5 right-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                            >
                              🗑️ Bersihkan
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 italic text-center">Gunakan mouse atau layar sentuh untuk menggambar tanda tangan.</p>
                        </div>
                      )}

                      {sigMode === 'upload' && (
                        <div className="space-y-3">
                          <div 
                            onClick={() => fileInputRef.current?.click()} 
                            className="border-2 border-dashed border-[#C5A059]/60 hover:bg-[#FAF6F0] p-6 rounded-2xl text-center cursor-pointer transition space-y-2"
                          >
                            <span className="text-3xl block">📤</span>
                            <span className="text-xs font-bold text-[#261C19] block">Pilih File TTD / Stempel Admin</span>
                            <span className="text-[10px] text-slate-400 block">Format: PNG / JPG (Background Transparan, Max 1MB)</span>
                          </div>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/png,image/jpeg,image/jpg" 
                            className="hidden" 
                          />
                          {filePreview && (
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                              <img src={filePreview} alt="Preview" className="h-10 object-contain" />
                              <button 
                                type="button" 
                                onClick={() => { setSelectedFile(null); setFilePreview(null); }} 
                                className="text-xs text-rose-600 font-bold hover:underline"
                              >
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={submitting} 
                        className="w-full py-3.5 bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#9C7A3C] hover:opacity-95 text-[#261C19] font-black text-xs uppercase tracking-widest rounded-2xl transition shadow-lg shadow-[#C5A059]/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-[#261C19] border-t-transparent rounded-full animate-spin"></div>
                            <span>Menyimpan TTD...</span>
                          </>
                        ) : (
                          <span>✍️ Sahkan & Simpan TTD Management</span>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="bg-[#261C19] text-[#FAF6F0] p-6 sm:p-8 rounded-3xl border border-[#C5A059]/40 shadow-xl space-y-3 text-center">
                    <span className="text-4xl block">🎉</span>
                    <h3 className="text-lg font-black text-white">Management Telah Menandatangani</h3>
                    <p className="text-xs text-[#E5D7C5]/80 leading-relaxed">
                      Tanda tangan resmi pengelola telah tersimpan secara permanen. Dokumen ini dapat langsung dicetak atau diunduh sebagai berkas bukti sewa yang sah.
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