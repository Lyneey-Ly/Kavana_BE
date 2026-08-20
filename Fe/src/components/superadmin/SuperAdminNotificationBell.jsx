import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';

const TYPE_ICONS = {
  property_approval: '🏠',
  profile_request: '👤',
  new_admin: '🎉',
  transaction: '💳',
  general: '🔔',
};

export default function SuperAdminNotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/admin/superadmin/notifications', {
        params: { per_page: 15 },
      });
      setNotifications(res.data.data || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Gagal mengambil notifikasi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = setTimeout(fetchNotifications, 0);
    const interval = setInterval(fetchNotifications, 8000);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = async (item) => {
    if (!item.is_read) {
      try {
        await API.patch(`/admin/superadmin/notifications/${item.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error(err);
      }
    }
    setIsOpen(false);
    if (item.action_url) {
      navigate(item.action_url);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await API.patch('/admin/superadmin/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e, item) => {
    e.stopPropagation();
    try {
      await API.delete(`/admin/superadmin/notifications/${item.id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== item.id));
      setUnreadCount((prev) =>
        item.is_read ? prev : Math.max(0, prev - 1)
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        className="relative w-11 h-11 rounded-xl bg-[#F6EFE6] border border-[#D7C4B0] hover:bg-[#EFE4D4] text-[#261C19] transition-all cursor-pointer flex items-center justify-center"
        aria-label="Notifikasi Superadmin"
      >
        <span className="text-lg">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[85vw] bg-white rounded-2xl border border-[#D7C4B0] shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 bg-[#261C19] text-white">
            <span className="text-xs font-extrabold uppercase tracking-widest">
              Notifikasi Superadmin
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-[#E5C9A3] hover:text-white transition-colors cursor-pointer"
              >
                Tandai Semua Dibaca ✓
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-[#EFE4D4]">
            {loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[#5C4A42]">
                Memuat notifikasi...
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[#5C4A42]">
                Tidak ada notifikasi.
              </div>
            )}

            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className={`px-4 py-3 flex gap-3 items-start transition-colors cursor-pointer ${
                  n.is_read
                    ? 'bg-white hover:bg-[#F6EFE6]'
                    : 'bg-[#FDF7EF] hover:bg-[#F6EFE6]'
                }`}
              >
                <span className="text-xl shrink-0 mt-0.5">
                  {TYPE_ICONS[n.type] || TYPE_ICONS.general}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs truncate ${
                        n.is_read
                          ? 'text-[#5C4A42] font-semibold'
                          : 'text-[#261C19] font-extrabold'
                      }`}
                    >
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#B38E5D] shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#8C7A6E] mt-0.5 line-clamp-2">
                    {n.message}
                  </p>
                  <span className="text-[10px] text-[#B38E5D] font-bold mt-1 block">
                    {n.time_ago || 'Baru saja'}
                  </span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, n)}
                  className="text-[#C9B8A8] hover:text-red-600 text-sm leading-none transition-colors cursor-pointer shrink-0 mt-1"
                  aria-label="Hapus notifikasi"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}