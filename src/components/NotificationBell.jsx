// src/components/NotificationBell.jsx - 인앱 알림 시스템
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Bell, X, Check, CheckCheck } from 'lucide-react'

export default function NotificationBell() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchNotifications()
      subscribeToNotifications()
    }
  }, [user])

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = () => {
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }

  const handleMarkAsRead = async (notificationId) => {
    try {
      const { error } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId
      })

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await supabase.rpc('mark_all_notifications_as_read', {
        p_user_id: user.id
      })

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id)
    }

    if (notification.action_url) {
      navigate(notification.action_url)
      setIsOpen(false)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'bid_outbid':
        return '😔'
      case 'auction_won':
        return '🎉'
      case 'auction_lost':
        return '😢'
      case 'auction_sold':
        return '💰'
      case 'point_refund':
        return '💸'
      case 'photo_liked':
        return '❤️'
      default:
        return '📢'
    }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const created = new Date(timestamp)
    const diffInSeconds = Math.floor((now - created) / 1000)

    if (diffInSeconds < 60) return '방금 전'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`
    return created.toLocaleDateString('ko-KR')
  }

  if (!user) return null

  return (
    <div className="relative" ref={panelRef}>
      {/* 벨 아이콘 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/20 rounded-lg transition-colors"
      >
        <Bell size={24} className="text-white" />

        {/* 읽지 않은 알림 배지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 모바일 오버레이 (배경 어둡게) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 알림 패널 */}
      {isOpen && (
        <div className="fixed md:absolute right-0 md:right-0 top-14 md:top-12 left-0 md:left-auto w-[calc(100%-1rem)] md:w-96 mx-2 md:mx-0 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 max-h-[70vh] md:max-h-[500px] flex flex-col">
          {/* 헤더 */}
          <div className="p-3 md:p-4 bg-gradient-to-r from-[#B3D966] to-[#9DC183] border-b flex items-center justify-between">
            <h3 className="font-black text-white flex items-center gap-2 text-sm md:text-base">
              <Bell size={18} className="md:w-5 md:h-5" />
              알림
            </h3>
            <div className="flex items-center gap-1 md:gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-white/90 hover:text-white font-semibold flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg"
                >
                  <CheckCheck size={12} className="md:w-3.5 md:h-3.5" />
                  <span className="hidden sm:inline">모두 읽음</span>
                  <span className="sm:hidden">읽음</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-1 rounded-lg transition-colors"
              >
                <X size={18} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>

          {/* 알림 리스트 */}
          <div className="overflow-y-auto flex-1">
            {loading && (
              <div className="p-6 md:p-8 text-center">
                <div className="w-8 h-8 border-2 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell size={24} className="md:w-8 md:h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-xs md:text-sm">알림이 없습니다</p>
              </div>
            )}

            {!loading && notifications.length > 0 && (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex gap-2 md:gap-3">
                      {/* 아이콘 */}
                      <div className="text-xl md:text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-gray-900 text-xs md:text-sm">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">
                            {getTimeAgo(notification.created_at)}
                          </span>
                          {notification.amount && (
                            <span className="text-xs font-bold text-[#558B2F]">
                              {notification.amount.toLocaleString()}P
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
