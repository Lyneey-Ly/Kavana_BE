import React, { useState, useEffect, useRef } from 'react';
import API from '../api'; // Sesuaikan path axios instance kamu
import SidebarUser from '../components/SidebarUser';

function ChatRoom() {
  // Mode Active Tab: 'group' atau 'direct'
  const [activeTab, setActiveTab] = useState('group');

  // Parameter ID
  const [propertiId, setPropertiId] = useState(''); // Akan diisi otomatis dari backend
  const [receiverId, setReceiverId] = useState(''); // ID User Target untuk DM
  const [noActiveProperty, setNoActiveProperty] = useState(false);

  // State Data
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // State UI & Interaksi
  const [loading, setLoading] = useState(false);
  const [accessDeniedErr, setAccessDeniedErr] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null); // State untuk Pop-up Profil
  const messagesEndRef = useRef(null);

 // 1. Fetch User Data & Auto-Detect Properti Aktif
  useEffect(() => {
    const fetchInitialData = async () => {
      // A. Ambil Data User (Ganti /user menjadi /profile)
      try {
        const resUser = await API.get('/profile'); // 👈 PERBAIKAN: Menggunakan /profile, bukan /user
        const userData = resUser.data.data || resUser.data;
        if (userData) {
          setCurrentUser(userData);
        }
      } catch (err) {
        console.error('Gagal mengambil data profil user:', err);
      }

      // B. Ambil Otomatis ID Properti Aktif
      try {
        const resProperti = await API.get('/chat/my-active-property');
        if (resProperti.data && resProperti.data.properti_id) {
          setPropertiId(resProperti.data.properti_id.toString());
          setNoActiveProperty(false);
        }
      } catch (err) {
        console.error('Gagal mengambil properti aktif:', err);
        // Hanya jika API my-active-property mengembalikan 404, set status ini
        if (err.response && err.response.status === 404) {
          setNoActiveProperty(true);
        }
      }
    };

    fetchInitialData();
  }, []);

  // 2. Fetch Messages Sesuai Tab Aktif
  const fetchMessages = async () => {
    setAccessDeniedErr('');
    try {
      let endpoint = '';
      if (activeTab === 'group') {
        if (!propertiId) return; // Tunggu propertiId terisi
        endpoint = `/chat/group/${propertiId}`;
      } else {
        if (!receiverId) return; // Tunggu receiverId terisi
        endpoint = `/chat/direct/${receiverId}`;
      }

      const response = await API.get(endpoint);
      const chatData = response.data.data || response.data;

      if (Array.isArray(chatData)) {
        setMessages(chatData);
      }
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setAccessDeniedErr(
          error.response.data.message || 'Akses ditolak! Kamu tidak memiliki izin ke room chat ini.'
        );
        setMessages([]);
      } else {
        console.error('Error fetching chats:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Polling Real-time (Refresh setiap 3 detik)
  useEffect(() => {
    if ((activeTab === 'group' && propertiId) || (activeTab === 'direct' && receiverId)) {
      setLoading(true);
      fetchMessages();

      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeTab, propertiId, receiverId]);

  // 4. Auto scroll ke pesan terbawah
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. Handle Kirim Pesan
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const payloadText = newMessage;
    setNewMessage(''); // Clear input instan agar responsif

    try {
      if (activeTab === 'group') {
        await API.post('/chat/group', {
          properti_id: propertiId,
          message: payloadText,
        });
      } else {
        await API.post('/chat/direct', {
          receiver_id: receiverId,
          message: payloadText,
        });
      }
      fetchMessages();
    } catch (error) {
      console.error('Gagal mengirim pesan:', error);
      alert(error.response?.data?.message || 'Gagal mengirim pesan.');
    }
  };

  // Helper Komponen: Render Foto Profil / Inisial yang Interaktif
  const renderAvatar = (userObj, isMyMessage) => {
    const photo = userObj?.foto || userObj?.avatar || userObj?.profile_photo_url;
    const name = userObj?.name || 'User';
    const initial = name.charAt(0).toUpperCase();

    // Fungsi klik profil
    const handleAvatarClick = () => {
      setSelectedProfile(userObj);
    };

    const wrapperClass = `w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0 cursor-pointer transition-transform transform hover:scale-110 ${
      isMyMessage ? 'bg-[#261C19] border-2 border-[#B38E5D]' : 'bg-[#B38E5D] border-2 border-white'
    }`;

    if (photo) {
      const src = photo.startsWith('http') ? photo : `http://localhost:8000/storage/${photo}`;
      return (
        <img
          src={src}
          alt={name}
          onClick={handleAvatarClick}
          className={`${wrapperClass} object-cover`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
          }}
        />
      );
    }

    return (
      <div onClick={handleAvatarClick} className={`${wrapperClass} text-white`}>
        {initial}
      </div>
    );
  };

  return (
    <SidebarUser>
      <div className="flex justify-center items-center min-h-screen bg-[#FAF5EF] p-4 font-sans text-[#261C19] relative">
        <div className="flex flex-col w-full max-w-4xl h-[700px] bg-white rounded-2xl shadow-xl border border-[#D7C4B0] overflow-hidden">
          
          {/* HEADER ROOM CHAT */}
          <div className="bg-gradient-to-r from-[#261C19] to-[#3A2A25] text-[#FAF5EF] px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between shadow-md z-10 gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-[#B38E5D] text-white flex items-center justify-center font-bold text-xl shadow-lg ring-2 ring-[#D7C4B0]/30">
                {activeTab === 'group' ? '🏢' : '💬'}
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-wide">
                  {activeTab === 'group' ? 'Grup Penghuni Kost' : 'Pesan Langsung'}
                </h3>
                <p className="text-xs text-[#FAF5EF]/70 flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  {activeTab === 'group' ? 'Ruang Diskusi Terbuka' : 'Obrolan Personal Tertutup'}
                </p>
              </div>
            </div>

            {/* NAVIGASI TAB */}
            <div className="flex bg-[#1f1715] p-1.5 rounded-xl border border-[#B38E5D]/30 self-start sm:self-auto shadow-inner">
              <button
                onClick={() => setActiveTab('group')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                  activeTab === 'group'
                    ? 'bg-[#B38E5D] text-white shadow-md transform scale-[1.02]'
                    : 'text-[#FAF5EF]/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Grup Kost
              </button>
              <button
                onClick={() => setActiveTab('direct')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                  activeTab === 'direct'
                    ? 'bg-[#B38E5D] text-white shadow-md transform scale-[1.02]'
                    : 'text-[#FAF5EF]/60 hover:text-white hover:bg-white/10'
                }`}
              >
                Direct Message
              </button>
            </div>
          </div>

          {/* STATUS BAR INFOMASI */}
          <div className="bg-[#FAF5EF]/80 px-6 py-3 border-b border-[#D7C4B0] flex items-center gap-3 text-xs backdrop-blur-sm">
            {activeTab === 'group' ? (
              <div className="font-medium text-gray-700 flex items-center gap-2">
                {noActiveProperty ? (
                  <span className="text-red-600 bg-red-100 px-3 py-1 rounded-full font-semibold border border-red-200">
                    ⚠️ Anda belum memiliki sewa kost aktif.
                  </span>
                ) : (
                  <span className="text-[#B38E5D] bg-orange-50 px-3 py-1 rounded-full font-semibold border border-[#D7C4B0]">
                    ✅ Terhubung di Ruang Properti ID: {propertiId || 'Memuat...'}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full max-w-sm">
                <span className="font-semibold text-gray-700 whitespace-nowrap">Chat dengan User ID:</span>
                <input
                  type="number"
                  min="1"
                  placeholder="Ketik ID User..."
                  value={receiverId}
                  onChange={(e) => setReceiverId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-[#D7C4B0] rounded-md bg-white text-sm font-semibold focus:outline-none focus:border-[#B38E5D] focus:ring-2 focus:ring-[#B38E5D]/20 transition-all"
                />
              </div>
            )}
          </div>

          {/* MESSAGES CONTAINER */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-cover bg-center" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/cream-paper.png')" }}>
            {accessDeniedErr ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center font-bold text-3xl shadow-sm border border-red-100">
                  🔒
                </div>
                <div>
                  <h4 className="font-bold text-red-700 text-lg">Akses Dibatasi</h4>
                  <p className="text-sm text-gray-600 max-w-md mt-2">
                    {accessDeniedErr}
                  </p>
                </div>
              </div>
            ) : loading && messages.length === 0 ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B38E5D]"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
                <span className="text-4xl">👋</span>
                <p className="text-sm text-gray-500 font-medium">Belum ada obrolan. Mulai sapa semuanya!</p>
              </div>
            ) : (
              messages.map((chat) => {
                const currentUserId = currentUser?.id;
                const isMyMessage = chat.sender_id === currentUserId || chat.user_id === currentUserId;
                const senderUser = chat.sender || chat.user || { id: chat.sender_id, name: `User #${chat.sender_id}` };

                return (
                  <div key={chat.id} className={`flex items-end gap-3 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'} group`}>
                    
                    {/* AVATAR DENGAN FITUR KLIK */}
                    <div title="Klik untuk lihat profil">
                      {renderAvatar(isMyMessage ? currentUser : senderUser, isMyMessage)}
                    </div>

                    {/* BUBBLE PESAN */}
                    <div className={`flex flex-col max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
                      {/* Nama Pengirim */}
                      {!isMyMessage && (
                        <span className="text-[11px] font-bold text-gray-500 mb-1 ml-1 cursor-pointer hover:text-[#B38E5D]" onClick={() => setSelectedProfile(senderUser)}>
                          {senderUser.name}
                        </span>
                      )}

                      <div
                        className={`px-4 py-3 text-[13px] leading-relaxed shadow-sm transition-all duration-200 group-hover:shadow-md ${
                          isMyMessage
                            ? 'bg-[#261C19] text-[#FAF5EF] rounded-2xl rounded-tr-sm'
                            : 'bg-white text-[#261C19] border border-[#D7C4B0] rounded-2xl rounded-tl-sm'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{chat.message}</p>
                      </div>

                      {/* Waktu Pesan */}
                      <span className={`block text-[10px] mt-1 font-medium ${isMyMessage ? 'text-gray-400 pr-1' : 'text-gray-400 pl-1'}`}>
                        {chat.created_at ? new Date(chat.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM CHAT */}
          <div className="p-4 bg-white border-t border-[#D7C4B0] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <input
                type="text"
                placeholder={
                  accessDeniedErr || (activeTab === 'group' && noActiveProperty)
                    ? 'Anda tidak diizinkan mengirim pesan...'
                    : 'Tulis pesan Anda di sini...'
                }
                disabled={!!accessDeniedErr || (activeTab === 'group' && noActiveProperty)}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-5 py-3.5 bg-[#FAF5EF] border border-[#D7C4B0] rounded-xl text-sm outline-none focus:bg-white focus:border-[#B38E5D] focus:ring-2 focus:ring-[#B38E5D]/20 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!!accessDeniedErr || !newMessage.trim() || (activeTab === 'group' && noActiveProperty)}
                className="bg-[#B38E5D] hover:bg-[#8F6E45] text-white px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 flex items-center gap-2"
              >
                <span>Kirim</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-45 -mt-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* MODAL PROFIL (POP-UP) */}
        {selectedProfile && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelectedProfile(null)}>
            <div 
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-[#D7C4B0] flex flex-col items-center relative"
              onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
            >
              <button 
                onClick={() => setSelectedProfile(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
              >
                ✖
              </button>
              
              <div className="w-24 h-24 rounded-full border-4 border-[#FAF5EF] shadow-md bg-[#B38E5D] flex items-center justify-center mb-4 overflow-hidden">
                {selectedProfile.foto || selectedProfile.profile_photo_url ? (
                  <img 
                    src={(selectedProfile.foto || selectedProfile.profile_photo_url).startsWith('http') ? (selectedProfile.foto || selectedProfile.profile_photo_url) : `http://localhost:8000/storage/${selectedProfile.foto || selectedProfile.profile_photo_url}`} 
                    alt={selectedProfile.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">{selectedProfile.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-[#261C19]">{selectedProfile.name || 'Pengguna Tanpa Nama'}</h2>
              <p className="text-sm text-gray-500 mt-1">Sistem ID: #{selectedProfile.id}</p>
              
              <div className="mt-6 w-full flex gap-3">
                <button 
                  onClick={() => {
                    setReceiverId(selectedProfile.id.toString());
                    setActiveTab('direct');
                    setSelectedProfile(null);
                  }}
                  className="flex-1 bg-[#261C19] hover:bg-[#1f1715] text-white py-2.5 rounded-lg text-sm font-semibold transition shadow"
                >
                  Kirim Pesan (DM)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarUser>
  );
}

export default ChatRoom;