import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import API from '../api';
import SidebarUser from '../components/SidebarUser';

function ChatRoom() {
  // Mode Tab Kiri: 'all', 'group', 'direct'
  const [filterTab, setFilterTab] = useState('all');

  // Mode Active Chat
  const [activeChatType, setActiveChatType] = useState('group'); // 'group' atau 'direct'
  const [activeProperties, setActiveProperties] = useState([]); // 🆕 Array menyimpan semua properti aktif
  const [propertiId, setPropertiId] = useState('');
  const [propertiData, setPropertiData] = useState(null);
  const [receiverId, setReceiverId] = useState('');
  const [noActiveProperty, setNoActiveProperty] = useState(false);

  // Data Chat & User
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // State UI
  const [loading, setLoading] = useState(false);
  const [accessDeniedErr, setAccessDeniedErr] = useState('');
  const [selectedProfile, setSelectedProfile] = useState(null);

  const messagesEndRef = useRef(null);

  // Custom Toast Config SweetAlert
  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });

  // 1. Fetch User Profile & Auto-Detect Properti Aktif (Mendukung Jamak)
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch User Profile
      try {
        const resUser = await API.get('/profile');
        const userData = resUser.data.data || resUser.data;
        if (userData) {
          setCurrentUser(userData);
        }
      } catch (err) {
        console.error('Gagal mengambil data profil user:', err);
      }

      // Fetch Otomatis Properti-Properti Aktif
      try {
        const resProperti = await API.get('/chat/my-active-properties');
        const propertiesList = resProperti.data.data || resProperti.data || [];

        if (Array.isArray(propertiesList) && propertiesList.length > 0) {
          setActiveProperties(propertiesList);
          // Set pilihan default ke properti pertama
          const firstProp = propertiesList[0];
          setPropertiId(firstProp.id.toString());
          setPropertiData(firstProp);
          setNoActiveProperty(false);
        } else {
          setNoActiveProperty(true);
        }
      } catch (err) {
        console.error('Gagal mengambil properti aktif:', err);
        setNoActiveProperty(true);
      }
    };

    fetchInitialData();
  }, []);

  // 2. Fetch Messages
  const fetchMessages = async () => {
    setAccessDeniedErr('');
    try {
      let endpoint = '';
      if (activeChatType === 'group') {
        if (!propertiId) return;
        endpoint = `/chat/group/${propertiId}`;
      } else {
        if (!receiverId) return;
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

  // 3. Polling Real-time (3 detik)
  useEffect(() => {
    if ((activeChatType === 'group' && propertiId) || (activeChatType === 'direct' && receiverId)) {
      setLoading(true);
      fetchMessages();

      const interval = setInterval(() => {
        fetchMessages();
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [activeChatType, propertiId, receiverId]);

  // 4. Auto scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. Handle Kirim Pesan dengan SweetAlert
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const payloadText = newMessage;
    setNewMessage('');

    try {
      if (activeChatType === 'group') {
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
      
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengirim Pesan',
        text: error.response?.data?.message || 'Terjadi kesalahan sistem saat mengirim pesan.',
        confirmButtonColor: '#261C19',
        customClass: {
          popup: 'rounded-2xl',
        }
      });
    }
  };

  // Helper Foto Profil / Avatar
  const renderAvatar = (userObj, isMyMessage = false, size = "w-9 h-9") => {
    const photo = userObj?.foto || userObj?.avatar || userObj?.profile_photo_url;
    const name = userObj?.name || userObj?.nama || 'User';
    const initial = name.charAt(0).toUpperCase();

    const handleAvatarClick = (e) => {
      e.stopPropagation();
      if (userObj) setSelectedProfile(userObj);
    };

    if (photo) {
      const src = photo.startsWith('http') ? photo : `http://localhost:8000/storage/${photo}`;
      return (
        <img
          src={src}
          alt={name}
          onClick={handleAvatarClick}
          className={`${size} rounded-full object-cover border border-[#B38E5D]/40 shadow-sm cursor-pointer hover:opacity-90 transition flex-shrink-0`}
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = 'none';
          }}
        />
      );
    }

    return (
      <div
        onClick={handleAvatarClick}
        className={`${size} rounded-full flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 cursor-pointer transition ${
          isMyMessage ? 'bg-[#261C19] text-[#B38E5D]' : 'bg-[#B38E5D] text-white'
        }`}
      >
        {initial}
      </div>
    );
  };

  return (
    <SidebarUser>
      <div className="min-h-screen bg-[#FAF5EF] p-2 md:p-6 flex items-center justify-center font-sans">
        
        {/* CONTAINER UTAMA (SPLIT SCREEN WA/IG STYLE) */}
        <div className="w-full max-w-6xl h-[calc(100vh-5rem)] min-h-[580px] bg-white rounded-2xl shadow-2xl border border-[#D7C4B0]/60 overflow-hidden flex flex-col md:flex-row">
          
          {/* 👈 KIRI: SIDEBAR DAFTAR CHAT */}
          <div className="w-full md:w-80 lg:w-96 bg-[#FAF5EF]/50 border-r border-[#D7C4B0]/60 flex flex-col h-1/3 md:h-full flex-shrink-0">
            
            {/* Header Sidebar Kiri */}
            <div className="p-4 bg-[#261C19] text-white flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <div className="text-xl">💬</div>
                <div>
                  <h2 className="font-bold text-sm tracking-wide">Pesan &amp; Obrolan</h2>
                  <p className="text-[10px] text-[#B38E5D]">KafanaVista Community</p>
                </div>
              </div>
            </div>

            {/* Tab Filter Navigasi */}
            <div className="p-3 border-b border-[#D7C4B0]/40 flex gap-1 bg-white">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterTab === 'all' ? 'bg-[#261C19] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setFilterTab('group')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterTab === 'group' ? 'bg-[#261C19] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Grup Kost
              </button>
              <button
                onClick={() => setFilterTab('direct')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  filterTab === 'direct' ? 'bg-[#261C19] text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                Pribadi (DM)
              </button>
            </div>

            {/* List Conversation */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              
              {/* ITEM 1: DAFTAR GRUP KOST AKTIF (LOOPING BANYAK PROPERTI) */}
              {(filterTab === 'all' || filterTab === 'group') && (
                <>
                  {noActiveProperty || activeProperties.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">
                      Belum ada sewa aktif
                    </div>
                  ) : (
                    activeProperties.map((prop) => {
                      const isSelected = activeChatType === 'group' && propertiId === prop.id.toString();
                      const propName = prop.nama_properti || prop.nama || prop.title || `Properti #${prop.id}`;

                      return (
                        <div
                          key={prop.id}
                          onClick={() => {
                            setActiveChatType('group');
                            setPropertiId(prop.id.toString());
                            setPropertiData(prop);
                          }}
                          className={`p-3.5 flex items-center gap-3 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#B38E5D]/15 border-l-4 border-[#B38E5D]'
                              : 'hover:bg-white'
                          }`}
                        >
                          <div className="w-12 h-12 rounded-full bg-[#261C19] text-[#B38E5D] flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-sm">
                            🏢
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h3 className="text-xs font-bold text-[#261C19] truncate">
                                {propName}
                              </h3>
                              <span className="text-[9px] text-[#B38E5D] font-semibold bg-[#B38E5D]/10 px-1.5 py-0.5 rounded">
                                OFFICIAL
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">
                              Ruang chat penghuni properti
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}

              {/* ITEM 2: DIRECT MESSAGE (INPUT / TARGET DM) */}
              {(filterTab === 'all' || filterTab === 'direct') && (
                <div
                  onClick={() => setActiveChatType('direct')}
                  className={`p-3.5 flex flex-col gap-2 cursor-pointer transition-all ${
                    activeChatType === 'direct'
                      ? 'bg-[#B38E5D]/15 border-l-4 border-[#B38E5D]'
                      : 'hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#B38E5D] text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-sm">
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-bold text-[#261C19]">Pesan Langsung (DM)</h3>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {receiverId ? `Obrolan dengan User ID: #${receiverId}` : 'Klik untuk memilih/ketik ID User'}
                      </p>
                    </div>
                  </div>

                  {/* Input Cepat ID User DM */}
                  {activeChatType === 'direct' && (
                    <div className="mt-2 pt-2 border-t border-[#D7C4B0]/40 flex items-center gap-2">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">ID Target:</span>
                      <input
                        type="number"
                        placeholder="Ketik ID User..."
                        value={receiverId}
                        onChange={(e) => setReceiverId(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-[#D7C4B0] rounded-md outline-none focus:border-[#B38E5D]"
                      />
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* 👉 KANAN: CHAT WINDOW UTAMA */}
          <div className="flex-1 flex flex-col h-2/3 md:h-full bg-[#FAF5EF]/30">
            
            {/* HEADER CHAT AKTIF */}
            <div className="bg-white px-6 py-3 border-b border-[#D7C4B0]/60 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#261C19] text-[#B38E5D] flex items-center justify-center text-lg font-bold shadow-sm">
                  {activeChatType === 'group' ? '🏢' : '👤'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#261C19]">
                    {activeChatType === 'group'
                      ? (propertiData?.nama_properti || propertiData?.nama || `Grup Penghuni Kost ID: ${propertiId || '-'}`)
                      : (receiverId ? `Direct Message - User #${receiverId}` : 'Direct Message')}
                  </h3>
                  <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    {activeChatType === 'group' ? 'Ruang Diskusi Penghuni' : 'Private Conversation'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right hidden sm:block">
                <span className="text-[10px] bg-[#FAF5EF] text-[#261C19] px-3 py-1 rounded-full font-bold border border-[#D7C4B0]">
                  {activeChatType === 'group' ? `Property ID: ${propertiId || '...'}` : `User ID Target: ${receiverId || 'Belum dipilih'}`}
                </span>
              </div>
            </div>

            {/* AREA MESSAGES FEED */}
            <div 
              className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4 bg-[#FAF5EF]/40"
              style={{ backgroundImage: "radial-gradient(#D7C4B0 0.5px, transparent 0.5px)", backgroundSize: "16px 16px" }}
            >
              {accessDeniedErr ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 p-6 bg-white/80 rounded-2xl border border-red-200">
                  <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-2xl font-bold">
                    🔒
                  </div>
                  <div>
                    <h4 className="font-bold text-red-700 text-sm">Akses Dibatasi</h4>
                    <p className="text-xs text-gray-500 mt-1 max-w-xs">{accessDeniedErr}</p>
                  </div>
                </div>
              ) : loading && messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B38E5D]"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-60">
                  <span className="text-4xl">💬</span>
                  <p className="text-xs text-gray-500 font-medium">Belum ada obrolan. Mulai menyapa sekarang!</p>
                </div>
              ) : (
                messages.map((chat) => {
                  const currentUserId = currentUser?.id;
                  const isMyMessage = chat.sender_id === currentUserId || chat.user_id === currentUserId;
                  const senderUser = chat.sender || chat.user || { id: chat.sender_id, name: `User #${chat.sender_id}` };

                  return (
                    <div
                      key={chat.id}
                      className={`flex items-end gap-2 ${isMyMessage ? 'flex-row-reverse' : 'flex-row'} group`}
                    >
                      {/* Avatar Pengirim */}
                      {!isMyMessage && renderAvatar(senderUser, false, "w-7 h-7")}

                      {/* Bubble Pesan */}
                      <div className={`flex flex-col max-w-[75%] ${isMyMessage ? 'items-end' : 'items-start'}`}>
                        {/* Nama Pengirim di Group */}
                        {!isMyMessage && activeChatType === 'group' && (
                          <span
                            onClick={() => setSelectedProfile(senderUser)}
                            className="text-[10px] font-bold text-[#B38E5D] mb-0.5 ml-1 cursor-pointer hover:underline"
                          >
                            {senderUser.name || senderUser.nama}
                          </span>
                        )}

                        <div
                          className={`px-3.5 py-2.5 text-xs leading-relaxed shadow-sm relative ${
                            isMyMessage
                              ? 'bg-[#261C19] text-white rounded-2xl rounded-tr-none'
                              : 'bg-white text-[#261C19] border border-[#D7C4B0]/60 rounded-2xl rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{chat.message}</p>
                          
                          {/* Waktu Pesan */}
                          <div
                            className={`text-[9px] mt-1 text-right ${
                              isMyMessage ? 'text-[#D7C4B0]' : 'text-gray-400'
                            }`}
                          >
                            {chat.created_at
                              ? new Date(chat.created_at).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* FORM INPUT PESAN */}
            <div className="p-3 bg-white border-t border-[#D7C4B0]/60">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={
                    accessDeniedErr || (activeChatType === 'group' && noActiveProperty)
                      ? 'Kamu tidak diizinkan mengirim pesan...'
                      : activeChatType === 'direct' && !receiverId
                      ? 'Pilih/Ketik ID User tujuan lebih dulu...'
                      : 'Ketik pesan...'
                  }
                  disabled={
                    !!accessDeniedErr ||
                    (activeChatType === 'group' && noActiveProperty) ||
                    (activeChatType === 'direct' && !receiverId)
                  }
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#FAF5EF] border border-[#D7C4B0]/80 rounded-full text-xs outline-none focus:bg-white focus:border-[#B38E5D] disabled:bg-gray-100 disabled:cursor-not-allowed transition"
                />
                
                <button
                  type="submit"
                  disabled={
                    !!accessDeniedErr ||
                    !newMessage.trim() ||
                    (activeChatType === 'group' && noActiveProperty) ||
                    (activeChatType === 'direct' && !receiverId)
                  }
                  className="w-10 h-10 bg-[#B38E5D] hover:bg-[#8F6E45] text-white rounded-full flex items-center justify-center transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-45 -mt-0.5 -ml-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* MODAL PROFIL USER */}
        {selectedProfile && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedProfile(null)}
          >
            <div 
              className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl border border-[#D7C4B0] flex flex-col items-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedProfile(null)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-sm"
              >
                ✕
              </button>

              <div className="w-20 h-20 rounded-full bg-[#B38E5D] text-white flex items-center justify-center font-bold text-2xl mb-3 shadow-md overflow-hidden">
                {selectedProfile.foto || selectedProfile.profile_photo_url ? (
                  <img 
                    src={(selectedProfile.foto || selectedProfile.profile_photo_url).startsWith('http') ? (selectedProfile.foto || selectedProfile.profile_photo_url) : `http://localhost:8000/storage/${selectedProfile.foto || selectedProfile.profile_photo_url}`} 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (selectedProfile.name || selectedProfile.nama || 'U').charAt(0).toUpperCase()
                )}
              </div>

              <h3 className="font-bold text-sm text-[#261C19]">{selectedProfile.name || selectedProfile.nama || 'User'}</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">ID Pengguna: #{selectedProfile.id}</p>

              <button
                onClick={() => {
                  const targetName = selectedProfile.name || selectedProfile.nama || `User #${selectedProfile.id}`;
                  setReceiverId(selectedProfile.id.toString());
                  setActiveChatType('direct');
                  setSelectedProfile(null);

                  Toast.fire({
                    icon: 'success',
                    title: `Membuka percakapan dengan ${targetName}`
                  });
                }}
                className="mt-4 w-full bg-[#261C19] hover:bg-[#1f1715] text-white py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                💬 Kirim Pesan Langsung (DM)
              </button>
            </div>
          </div>
        )}

      </div>
    </SidebarUser>
  );
}

export default ChatRoom;