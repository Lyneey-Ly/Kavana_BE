import React, { useState, useEffect, useRef, useCallback } from 'react';
import API from '../api'; // Axios instance terkonfigurasi (dengan Auth Token)
import SidebarAdmin from '../components/SidebarAdmin';
import {
  Building2,
  MessageSquare,
  ShieldCheck,
  Users,
  Send,
  Search,
  Clock,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export default function AdminRoomChat() {
  // State Data Properti & Chat
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [messages, setMessages] = useState([]);
  
  // State UI, Filter & Loading
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Ref untuk Auto-Scroll Chat Box
  const chatScrollRef = useRef(null);

  // Helper Auto-Scroll ke Pesan Terbawah
  const scrollToBottom = () => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  };

  // Helper Format Waktu (HH:mm)
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime())
      ? ''
      : date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  // =========================================================================
  // 1. FETCH DAFTAR PROPERTI KELOLAAN ADMIN
  // =========================================================================
  const fetchManagedProperties = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoadingProperties(true);
    try {
      const response = await API.get('/chat/managed-properties');
      const data = response.data.data || response.data || [];
      setProperties(data);
      setErrorMessage('');

      // Auto-select properti pertama jika belum ada yang dipilih
      if (!selectedProperty && data.length > 0) {
        setSelectedProperty(data[0]);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar properti kelolaan:', err);
      setErrorMessage('Gagal memuat daftar properti kelolaan.');
    } fontFinally: {
      if (!isSilent) setLoadingProperties(false);
    }
  }, [selectedProperty]);

  // =========================================================================
  // 2. FETCH RIWAYAT CHAT GRUP PROPERTI TERPILIH
  // =========================================================================
  const fetchGroupChatMessages = useCallback(async (propertiId, isSilent = false) => {
    if (!propertiId) return;
    if (!isSilent) setLoadingChat(true);

    try {
      const response = await API.get(`/chat/group/${propertiId}`);
      const chatData = response.data.data || response.data || [];
      
      setMessages(chatData);

      // Auto-scroll hanya jika tidak dalam mode silent polling (atau pengguna di posisi paling bawah)
      if (!isSilent) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Gagal mengambil riwayat pesan grup:', err);
    } finally {
      if (!isSilent) setLoadingChat(false);
    }
  }, []);

  // Fetch Awal Data Properti
  useEffect(() => {
    fetchManagedProperties();
  }, []);

  // Fetch Pesan saat Properti Aktif Berubah
  useEffect(() => {
    if (selectedProperty) {
      fetchGroupChatMessages(selectedProperty.id);
    }
  }, [selectedProperty, fetchGroupChatMessages]);

  // =========================================================================
  // 3. POLLING SYSTEM (Auto Refresh Pesan & Properti tiap 4 Detik)
  // =========================================================================
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedProperty?.id) {
        fetchGroupChatMessages(selectedProperty.id, true);
      }
      fetchManagedProperties(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedProperty, fetchGroupChatMessages, fetchManagedProperties]);

  // Scroll otomatis setiap kali jumlah pesan bertambah
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // =========================================================================
  // 4. HANDLER KIRIM PESAN OLEH ADMIN / PENGELOLA
  // =========================================================================
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || !selectedProperty || sending) return;

    const messageText = textInput.trim();
    setTextInput(''); // Clear input duluan demi UX responsif
    setSending(true);

    try {
      await API.post('/chat/group', {
        properti_id: selectedProperty.id,
        message: messageText
      });

      // Refresh riwayat pesan langsung
      await fetchGroupChatMessages(selectedProperty.id, true);
      scrollToBottom();
    } catch (err) {
      console.error('Gagal mengirim pesan pengelola:', err);
      alert('Gagal mengirim pesan. Pastikan koneksi server stabil.');
      setTextInput(messageText); // Restore input jika gagal
    } finally {
      setSending(false);
    }
  };

  // Filter Properti berdasarkan Pencarian
  const filteredProperties = properties.filter((prop) => {
    const title = (prop.title || prop.nama_properti || prop.nama || '').toLowerCase();
    const address = (prop.address || prop.alamat || '').toLowerCase();
    const q = searchQuery.toLowerCase();
    return title.includes(q) || address.includes(q);
  });

  return (
    <SidebarAdmin>
      <div className="h-screen bg-[#FAF5EF] text-[#261C19] flex flex-col font-sans selection:bg-[#B38E5D] selection:text-white overflow-hidden">
        
        {/* HEADER SECTION */}
        <div className="bg-white border-b border-[#E5D7C5] px-6 py-4 flex flex-wrap justify-between items-center gap-4 shrink-0 shadow-xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#B38E5D] block">
              Kafana Vista Management System
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#261C19] flex items-center gap-2.5">
              <MessageSquare className="w-6 h-6 text-[#B38E5D]" />
              Monitoring RoomChat Properti
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Polling Active
            </span>
            <button
              onClick={() => {
                fetchManagedProperties();
                if (selectedProperty) fetchGroupChatMessages(selectedProperty.id);
              }}
              className="p-2 bg-[#261C19] hover:bg-[#B38E5D] text-white rounded-xl transition cursor-pointer shadow-sm"
              title="Refresh Manual"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProperties || loadingChat ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ERROR NOTIFICATION */}
        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMessage}
          </div>
        )}

        {/* MAIN SPLIT-PANE CONTAINER */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ========================================================================= */}
          {/* 🏢 PANEL KIRI: DAFTAR PROPERTI KELOLAAN */}
          {/* ========================================================================= */}
          <div className="w-full md:w-80 lg:w-96 bg-white border-r border-[#E5D7C5] flex flex-col shrink-0">
            
            {/* SEARCH BAR */}
            <div className="p-4 border-b border-[#E5D7C5] bg-[#FAF5EF]/40">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari properti kelolaan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs font-medium border border-[#E5D7C5] focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] bg-white transition shadow-xs text-[#261C19]"
                />
                <Search className="w-4 h-4 text-[#B38E5D] absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* PROPERTY CARDS LIST */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#E5D7C5]/50">
              {loadingProperties ? (
                <div className="p-8 text-center space-y-3">
                  <div className="w-7 h-7 border-3 border-[#B38E5D] border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Memuat Properti...</p>
                </div>
              ) : filteredProperties.length > 0 ? (
                filteredProperties.map((prop) => {
                  const isSelected = selectedProperty?.id === prop.id;
                  const lastMsg = prop.last_message || {};
                  const senderName = lastMsg.user?.name || lastMsg.sender_name || 'Penghuni';

                  return (
                    <div
                      key={prop.id}
                      onClick={() => setSelectedProperty(prop)}
                      className={`p-4 cursor-pointer transition-all duration-200 border-l-4 ${
                        isSelected
                          ? 'bg-[#FAF5EF] border-l-[#B38E5D] shadow-inner'
                          : 'hover:bg-slate-50 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h3 className="font-extrabold text-xs md:text-sm text-[#261C19] line-clamp-1 flex items-center gap-1.5">
                          <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#B38E5D]' : 'text-slate-400'}`} />
                          {prop.title || prop.nama_properti || prop.nama || 'Properti'}
                        </h3>
                        {lastMsg.created_at && (
                          <span className="text-[10px] text-slate-400 font-semibold shrink-0 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {formatTime(lastMsg.created_at)}
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mb-2.5">
                        📍 {prop.address || prop.alamat || 'Lokasi tidak terdaftar'}
                      </p>

                      {/* LAST MESSAGE PREVIEW */}
                      <div className="bg-white/80 p-2.5 rounded-lg border border-[#E5D7C5]/60 text-[11px] space-y-0.5">
                        <span className="font-bold text-[#B38E5D] block truncate">
                          {lastMsg.message ? `${senderName}:` : 'Belum ada obrolan'}
                        </span>
                        <p className="text-slate-600 line-clamp-1 italic">
                          {lastMsg.message || 'Grup chat masih sepi...'}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center space-y-2">
                  <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Tidak Ada Properti Ditemukan</p>
                  <p className="text-[10px] text-slate-400">Pastikan Anda terdaftar sebagai pemilik/admin properti.</p>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#E5D7C5] bg-[#FAF5EF] text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Total: {filteredProperties.length} Properti Kelolaan
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 💬 PANEL KANAN: MONITORING OBROLAN GRUP PROPERTI */}
          {/* ========================================================================= */}
          <div className="flex-1 flex flex-col bg-[#FAF5EF]/30 relative overflow-hidden">
            
            {selectedProperty ? (
              <>
                {/* CHAT MONITOR HEADER */}
                <div className="bg-white border-b border-[#E5D7C5] p-4 flex justify-between items-center shadow-xs z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#261C19] text-[#B38E5D] rounded-xl shadow-sm">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-extrabold text-sm md:text-base text-[#261C19] flex items-center gap-2">
                        {selectedProperty.title || selectedProperty.nama_properti || 'Grup Chat'}
                      </h2>
                      <p className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>📍 {selectedProperty.address || selectedProperty.alamat || 'Alamat Properti'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#B38E5D] font-bold">
                          <Users className="w-3 h-3" /> Forum Penghuni
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* BADGE MONITORING */}
                  <div className="bg-[#261C19] text-[#FAF5EF] border border-[#B38E5D] px-3 py-1.5 rounded-xl text-xs font-black tracking-wider flex items-center gap-2 shadow-sm">
                    <Eye className="w-4 h-4 text-[#B38E5D] animate-pulse" />
                    <span>Mode Pemantauan Admin</span>
                  </div>
                </div>

                {/* CHAT MESSAGES AREA */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-pattern"
                >
                  {loadingChat ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <div className="w-8 h-8 border-3 border-[#B38E5D] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Obrolan...</span>
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((msg, index) => {
                      const isOwner = msg.is_owner || msg.user?.role === 'admin' || msg.user?.role === 'owner';
                      const senderName = msg.user?.name || msg.sender_name || 'Penghuni';
                      const avatarUrl = msg.user?.avatar || msg.user?.foto_profil 
                        ? `http://127.0.0.1:8000/storage/${msg.user?.avatar || msg.user?.foto_profil}`
                        : null;

                      return (
                        <div
                          key={msg.id || index}
                          className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${
                            isOwner ? 'ml-auto flex-row-reverse' : 'mr-auto'
                          }`}
                        >
                          {/* AVATAR */}
                          <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden border border-[#E5D7C5] bg-white flex items-center justify-center text-[#261C19] font-black text-xs shadow-xs">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={senderName} className="w-full h-full object-cover" />
                            ) : (
                              senderName.charAt(0).toUpperCase()
                            )}
                          </div>

                          {/* BUBBLE CONTENT */}
                          <div className={`space-y-1 ${isOwner ? 'text-right' : 'text-left'}`}>
                            <div className="flex items-center gap-2 px-1">
                              <span className="text-[11px] font-bold text-[#261C19]">
                                {senderName}
                              </span>
                              {isOwner && (
                                <span className="bg-[#261C19] text-[#B38E5D] border border-[#B38E5D]/40 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-[#B38E5D]" /> Pengelola
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-semibold">
                                {formatTime(msg.created_at)}
                              </span>
                            </div>

                            {/* BUBBLE BOX */}
                            <div
                              className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                                isOwner
                                  ? 'bg-[#261C19] text-[#FAF5EF] rounded-tr-none border border-[#B38E5D]/30'
                                  : 'bg-white text-[#261C19] rounded-tl-none border border-[#E5D7C5]'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                      <div className="p-4 bg-white rounded-full border border-[#E5D7C5] shadow-xs">
                        <MessageSquare className="w-8 h-8 text-[#B38E5D]" />
                      </div>
                      <p className="text-sm font-bold text-[#261C19]">Belum ada riwayat pesan di grup ini.</p>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Beri pengumuman atau instruksi pertama kamu sebagai pengelola properti.
                      </p>
                    </div>
                  )}
                </div>

                {/* FORM BALASAN / MODERASI ADMIN */}
                <div className="p-4 bg-white border-t border-[#E5D7C5]">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder={`Kirim pesan pengumuman/balasan ke grup ${selectedProperty.title || 'properti'}...`}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      disabled={sending}
                      className="flex-1 bg-[#FAF5EF] border border-[#E5D7C5] rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-[#B38E5D] focus:ring-1 focus:ring-[#B38E5D] text-[#261C19] placeholder-slate-400 transition"
                    />
                    <button
                      type="submit"
                      disabled={sending || !textInput.trim()}
                      className="bg-[#261C19] hover:bg-[#B38E5D] text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer shrink-0"
                    >
                      <span>{sending ? 'Mengirim...' : 'Kirim'}</span>
                      <Send className="w-4 h-4 text-[#B38E5D]" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <Building2 className="w-16 h-16 text-[#B38E5D]/40" />
                <h2 className="text-lg font-bold text-[#261C19]">Pilih Properti Kelolaan</h2>
                <p className="text-xs text-slate-400 max-w-sm">
                  Silakan pilih salah satu properti di panel sebelah kiri untuk memantau obrolan grup penghuni.
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </SidebarAdmin>
  );
}