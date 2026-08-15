import { useState, useEffect } from 'react';
import API from '../api';
import SidebarAdmin from '../components/SidebarAdmin';
import Swal from 'sweetalert2';

export default function AdminKomplain() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter & Image Preview
  const [activeTab, setActiveTab] = useState('Semua');
  const [previewImage, setPreviewImage] = useState(null);

  // State Modal Tanggapan
  const [selectedItem, setSelectedItem] = useState(null);
  const [status, setStatus] = useState('Pending');
  const [tanggapanAdmin, setTanggapanAdmin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAdminComplaints = async () => {
    try {
      setLoading(true);
      const res = await API.get('/admin/complaints');
      setComplaints(res.data.data || []);
    } catch (err) {
      console.error('Gagal memuat komplain admin:', err);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memuat Data',
        text: 'Terjadi kesalahan saat mengambil data komplain.',
        confirmButtonColor: '#261C19'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminComplaints();
  }, []);

  const handleOpenProcessModal = (item) => {
    setSelectedItem(item);
    setStatus(item.status);
    setTanggapanAdmin(item.tanggapan_admin || '');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      await API.put(`/admin/complaints/${selectedItem.id}`, {
        status: status,
        tanggapan_admin: tanggapanAdmin
      });

      // SweetAlert Sukses
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Diperbarui!',
        text: 'Status dan tanggapan komplain telah berhasil disimpan.',
        confirmButtonColor: '#261C19',
        timer: 2000
      });

      setSelectedItem(null);
      fetchAdminComplaints();
    } catch (err) {
      console.error('Gagal mengupdate komplain:', err);
      
      // SweetAlert Error
      Swal.fire({
        icon: 'error',
        title: 'Gagal Memperbarui',
        text: err.response?.data?.message || 'Terjadi kesalahan saat memperbarui status komplain.',
        confirmButtonColor: '#261C19'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const storageBaseUrl = import.meta.env.VITE_STORAGE_BASE_URL || 'http://localhost:8000/storage';

  // HELPER: Badge Status Beranimasi
  const getStatusBadge = (statusBadge) => {
    switch (statusBadge) {
      case 'Pending':
        return (
          <span className="bg-amber-100/80 text-amber-900 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-amber-300/80 flex items-center gap-2 shadow-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Menunggu
          </span>
        );
      case 'Diproses':
        return (
          <span className="bg-blue-100/80 text-blue-900 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-blue-300/80 flex items-center gap-2 shadow-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
            Diproses
          </span>
        );
      case 'Selesai':
        return (
          <span className="bg-emerald-100/80 text-emerald-900 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-emerald-300/80 flex items-center gap-2 shadow-xs w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Selesai
          </span>
        );
      default:
        return null;
    }
  };

  // Logika Filter Data
  const filteredComplaints = complaints.filter((item) => {
    if (activeTab === 'Semua') return true;
    return item.status === activeTab;
  });

  // Logika Hitung Statistik
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const diprosesCount = complaints.filter(c => c.status === 'Diproses').length;
  const selesaiCount = complaints.filter(c => c.status === 'Selesai').length;

  return (
    <SidebarAdmin>
      <div className="min-h-screen bg-[#FAF6F0] p-4 md:p-8 text-[#261C19] relative font-sans">
        
        {/* AMBIENT GLOW */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          
          {/* HEADER SECTION */}
          <div className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-[#E5D7C5] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block mb-1">
                Kafana Vista Helpdesk
              </span>
              <h1 className="text-2xl font-extrabold text-[#261C19]">Manajemen Komplain</h1>
              <p className="text-xs text-slate-500 mt-1 max-w-lg">
                Tinjau dan tanggapi keluhan penyewa di semua unit. Berikan pelayanan terbaik agar penghuni merasa nyaman.
              </p>
            </div>
            <button 
              onClick={fetchAdminComplaints}
              className="bg-[#261C19] hover:bg-[#3D2D29] text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2 cursor-pointer"
            >
              <span>🔄</span> Refresh Data
            </button>
          </div>

          {/* STATS SUMMARY CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Keluhan', count: totalCount, icon: '📑', color: 'text-[#261C19]' },
              { label: 'Menunggu (Pending)', count: pendingCount, icon: '⏳', color: 'text-amber-600' },
              { label: 'Sedang Diproses', count: diprosesCount, icon: '⚙️', color: 'text-blue-600' },
              { label: 'Selesai / Resolved', count: selesaiCount, icon: '✅', color: 'text-emerald-600' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-[#E5D7C5] shadow-xs flex flex-col justify-between space-y-2 hover:shadow-md transition">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-3xl font-black ${stat.color}`}>{stat.count}</span>
                  <span className="text-xl grayscale opacity-50">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* TABS FILTER */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['Semua', 'Pending', 'Diproses', 'Selesai'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border ${
                  activeTab === tab
                    ? 'bg-[#261C19] text-white border-[#261C19] shadow-md'
                    : 'bg-white/80 text-slate-600 border-[#E5D7C5] hover:bg-white hover:text-[#261C19]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* LIST KELUHAN (TICKET CARDS) */}
          {loading ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-[#E5D7C5] shadow-sm space-y-3">
              <div className="w-12 h-12 border-4 border-[#C5A059] border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Data Komplain...</p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-[#E5D7C5] text-center space-y-4 shadow-sm animate-in fade-in duration-500">
              <span className="text-5xl block">🎉</span>
              <h3 className="text-lg font-extrabold text-[#261C19]">Semua Terkendali!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Tidak ada data komplain untuk kategori <b>"{activeTab}"</b>. Penghuni sedang menikmati kenyamanannya!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComplaints.map((item, index) => (
                <div 
                  key={item.id} 
                  className="group bg-white p-6 rounded-3xl border border-[#E5D7C5] shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* BAGIAN KIRI: Info Pelapor & Properti */}
                    <div className="lg:w-1/4 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID Tiket #{item.id.toString().padStart(4, '0')}</span>
                        <h4 className="text-sm font-extrabold text-[#261C19] flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#C5A059] text-white flex items-center justify-center text-[10px]">
                            {item.user?.name ? item.user.name.charAt(0).toUpperCase() : '?'}
                          </span>
                          {item.user?.name || 'Anonim'}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-medium pl-8">{item.user?.email}</p>
                      </div>

                      <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#E5D7C5]/50">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#C5A059]">Lokasi / Unit:</span>
                        <p className="text-xs font-bold text-[#261C19] mt-0.5">{item.properti?.title || 'Tidak ada data properti'}</p>
                      </div>
                      
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                        Dilaporkan: {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {/* BAGIAN TENGAH: Isi Keluhan */}
                    <div className="lg:w-2/4 space-y-3">
                      <div>
                        {getStatusBadge(item.status)}
                      </div>
                      <h3 className="text-base font-extrabold text-[#261C19] group-hover:text-[#C5A059] transition-colors">{item.judul}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-serif bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        {item.deskripsi}
                      </p>
                      
                      {item.tanggapan_admin && (
                         <div className="border-l-2 border-[#C5A059] pl-3 py-1 mt-2">
                           <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059]">Respon Terakhir Admin:</span>
                           <p className="text-xs text-[#261C19] italic mt-1">"{item.tanggapan_admin}"</p>
                         </div>
                      )}
                    </div>

                    {/* BAGIAN KANAN: Bukti Foto & Aksi */}
                    <div className="lg:w-1/4 flex flex-col justify-between items-start lg:items-end space-y-4">
                      <div className="w-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 lg:text-right">Foto Bukti</span>
                        {item.foto ? (
                          <div 
                            onClick={() => setPreviewImage(`${storageBaseUrl}/${item.foto}`)}
                            className="relative h-24 w-full lg:w-32 ml-auto rounded-xl overflow-hidden cursor-zoom-in group/img border border-[#E5D7C5]"
                          >
                            <img 
                              src={`${storageBaseUrl}/${item.foto}`} 
                              alt="Bukti Komplain" 
                              className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                              🔍 Perbesar
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 w-full lg:w-32 ml-auto rounded-xl bg-slate-100 border border-slate-200 border-dashed flex flex-col items-center justify-center text-slate-400">
                            <span className="text-xl">📷</span>
                            <span className="text-[9px] font-bold mt-1">Tanpa Foto</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleOpenProcessModal(item)}
                        className="w-full lg:w-auto bg-[#261C19] hover:bg-[#C5A059] hover:text-[#261C19] text-[#FAF5EF] px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        ✍️ Tanggapi
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* LIGHTBOX MODAL (PREVIEW FOTO) */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-300"
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <img src={previewImage} alt="Bukti Komplain Diperbesar" className="w-full h-full object-contain max-h-[85vh]" />
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 hover:bg-rose-600 text-white rounded-full flex items-center justify-center font-bold transition"
            >
              ✕
            </button>
          </div>
          <p className="absolute bottom-10 text-white/50 text-xs font-bold tracking-widest uppercase">Klik dimana saja untuk menutup</p>
        </div>
      )}

      {/* MODAL TANGGAPI / UPDATE STATUS */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 md:p-8 border border-[#E5D7C5] shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] block">Update Tiket #{selectedItem.id.toString().padStart(4, '0')}</span>
                <h3 className="text-lg font-extrabold text-[#261C19]">Tanggapi Komplain</h3>
              </div>
              <button 
                onClick={() => setSelectedItem(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Update Status Progress
                </label>
                <div className="relative">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs font-bold p-3.5 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0] focus:outline-hidden focus:border-[#C5A059] text-[#261C19] appearance-none cursor-pointer"
                  >
                    <option value="Pending">⏳ Pending (Menunggu)</option>
                    <option value="Diproses">⚙️ Diproses (Sedang Ditangani)</option>
                    <option value="Selesai">✅ Selesai (Problem Resolved)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs">▼</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Pesan Tanggapan (Ke Penyewa)
                </label>
                <textarea
                  rows={4}
                  placeholder="Beri tahu penyewa update dari komplain mereka. Contoh: 'Teknisi kami sedang menuju lokasi untuk memperbaiki AC...'"
                  value={tanggapanAdmin}
                  onChange={(e) => setTanggapanAdmin(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-xl border border-[#E5D7C5] bg-[#FAF6F0]/50 focus:outline-hidden focus:border-[#C5A059] text-[#261C19] font-medium"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 bg-[#261C19] hover:bg-[#3D2D29] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl shadow-lg disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin"></div>
                      Menyimpan...
                    </>
                  ) : (
                    '💾 Simpan Update'
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </SidebarAdmin>
  );
}