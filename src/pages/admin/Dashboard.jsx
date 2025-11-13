// src/pages/admin/Dashboard.jsx - 관리자 대시보드
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  ImageIcon as PhotoIcon,
  Users,
  DollarSign,
  AlertCircle,
  Activity,
  TrendingUp
} from 'lucide-react'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState({
    totalPhotos: 0,
    totalUsers: 0,
    totalSales: 0,
    pendingReviews: 0
  })
  const [recentActivities, setRecentActivities] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  // 대시보드 데이터 로드
  async function loadDashboardData() {
    setLoading(true)
    try {
      // 총 사진 수
      const { count: photoCount } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })

      // 총 회원 수
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // 검수 대기 수
      const { count: pendingCount } = await supabase
        .from('moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // 거래 수
      const { count: salesCount } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })
        .not('buyer_id', 'is', null)

      setDashboardStats({
        totalPhotos: photoCount || 0,
        totalUsers: userCount || 0,
        totalSales: salesCount || 0,
        pendingReviews: pendingCount || 0
      })

      // 최근 활동 로드
      await loadRecentActivities()
    } catch (error) {
      console.error('대시보드 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 최근 활동 로드
  async function loadRecentActivities() {
    try {
      const activities = []

      // 최근 업로드
      const { data: recentPhotos } = await supabase
        .from('photos')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      recentPhotos?.forEach((photo) => {
        activities.push({
          type: 'upload',
          title: `"${photo.title}" 업로드됨`,
          timestamp: photo.created_at,
          icon: '📸'
        })
      })

      // 최근 가입
      const { data: recentSignups } = await supabase
        .from('profiles')
        .select('username, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      recentSignups?.forEach((signup) => {
        activities.push({
          type: 'signup',
          title: `${signup.username}님 가입`,
          timestamp: signup.created_at,
          icon: '👋'
        })
      })

      // 시간순 정렬
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      setRecentActivities(activities.slice(0, 10))
    } catch (error) {
      console.error('활동 로그 로드 실패:', error)
    }
  }

  // 상대 시간 포맷
  function formatRelativeTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000) // 초 단위

    if (diff < 60) return '방금 전'
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">대시보드</h2>
        <p className="text-gray-600">포마 플랫폼 전체 현황을 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PhotoIcon size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardStats.totalPhotos}
              </p>
              <p className="text-xs text-gray-600">총 사진</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardStats.totalUsers}
              </p>
              <p className="text-xs text-gray-600">총 회원</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <DollarSign size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardStats.totalSales}
              </p>
              <p className="text-xs text-gray-600">총 거래</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle size={20} className="text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {dashboardStats.pendingReviews}
              </p>
              <p className="text-xs text-gray-600">검수 대기</p>
            </div>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={20} className="text-gray-700" />
          <h3 className="text-lg font-bold text-gray-800">최근 활동</h3>
        </div>

        {recentActivities.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            최근 활동이 없습니다
          </p>
        ) : (
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activity.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 빠른 링크 */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-xl transition-shadow">
          <PhotoIcon size={32} className="mb-3" />
          <h4 className="font-bold text-lg mb-1">사진 검수</h4>
          <p className="text-sm text-blue-100">
            {dashboardStats.pendingReviews}개 대기 중
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-xl transition-shadow">
          <Users size={32} className="mb-3" />
          <h4 className="font-bold text-lg mb-1">회원 관리</h4>
          <p className="text-sm text-green-100">
            총 {dashboardStats.totalUsers}명
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white cursor-pointer hover:shadow-xl transition-shadow">
          <TrendingUp size={32} className="mb-3" />
          <h4 className="font-bold text-lg mb-1">통계 분석</h4>
          <p className="text-sm text-purple-100">상세 보기</p>
        </div>
      </div>
    </div>
  )
}
