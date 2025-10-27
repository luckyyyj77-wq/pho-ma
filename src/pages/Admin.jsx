// ============================================
// 📦 관리자 페이지 - 종합 대시보드
// ============================================
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { 
  ArrowLeft, Check, X, AlertCircle, Image as ImageIcon, Shield,
  BarChart3, Activity, Users, DollarSign, Calendar, Tag, TrendingUp
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'


export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  // 상태 관리
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [activeTab, setActiveTab] = useState('moderation') // moderation, stats, logs
  const [loading, setLoading] = useState(true)
  
  // 검수 관련
  const [pendingPhotos, setPendingPhotos] = useState([])
  const [moderationStats, setModerationStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  })

  // 통계 데이터
  const [photoStats, setPhotoStats] = useState(null)
  const [userStats, setUserStats] = useState(null)
  const [salesStats, setSalesStats] = useState(null)
  
  // 활동 로그
  const [recentActivities, setRecentActivities] = useState([])


  // ------------------------------------------
  // 🔐 관리자 권한 체크
  // ------------------------------------------
  useEffect(() => {
    async function checkAdminStatus() {
      if (!user) {
        setCheckingAdmin(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data?.is_admin) {
          setIsAdmin(true)
        } else {
          alert('❌ 관리자 권한이 없습니다!')
          navigate('/')
        }
      } catch (error) {
        console.error('권한 체크 실패:', error)
        navigate('/')
      } finally {
        setCheckingAdmin(false)
      }
    }

    checkAdminStatus()
  }, [user, navigate])


  // ------------------------------------------
  // 📊 데이터 로드
  // ------------------------------------------
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'moderation') {
        loadModerationData()
      } else if (activeTab === 'stats') {
        loadStatistics()
      } else if (activeTab === 'logs') {
        loadActivityLogs()
      }
    }
  }, [isAdmin, activeTab])


  // ------------------------------------------
  // 📋 검수 데이터 로드
  // ------------------------------------------
  async function loadModerationData() {
    setLoading(true)
    try {
      // 검수 대기 목록
      const { data: queueData, error: queueError } = await supabase
        .from('moderation_queue')
        .select(`
          *,
          photos (
            id,
            preview_url,
            title,
            current_price,
            user_id
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (queueError) throw queueError

      // 판매자 정보 추가
      if (queueData && queueData.length > 0) {
        const userIds = [...new Set(queueData.map(item => item.photos?.user_id).filter(Boolean))]
        
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', userIds)

          if (profilesData) {
            const profilesMap = {}
            profilesData.forEach(profile => {
              profilesMap[profile.id] = profile.username
            })

            queueData.forEach(item => {
              if (item.photos?.user_id) {
                item.seller_name = profilesMap[item.photos.user_id] || '알 수 없음'
              }
            })
          }
        }
      }

      setPendingPhotos(queueData || [])

      // 검수 통계
      const { data: statsData } = await supabase
        .from('moderation_queue')
        .select('status')

      const statsCounts = {
        pending: 0,
        approved: 0,
        rejected: 0
      }

      statsData?.forEach(item => {
        statsCounts[item.status] = (statsCounts[item.status] || 0) + 1
      })

      setModerationStats(statsCounts)

    } catch (error) {
      console.error('검수 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }


  // ------------------------------------------
  // 📊 통계 데이터 로드
  // ------------------------------------------
  async function loadStatistics() {
    setLoading(true)
    try {
      // === 사진 통계 ===
      const { data: allPhotos } = await supabase
        .from('photos')
        .select('id, category, current_price, status, moderation_status, created_at')

      const now = new Date()
      const todayStart = new Date(now.setHours(0, 0, 0, 0))
      const weekStart = new Date(now.setDate(now.getDate() - 7))
      const monthStart = new Date(now.setDate(now.getDate() - 30))

      // 카테고리별 집계
      const categoryCount = {}
      const priceRanges = {
        '0-10000': 0,
        '10000-50000': 0,
        '50000-100000': 0,
        '100000+': 0
      }
      
      let todayUploads = 0
      let weekUploads = 0
      let monthUploads = 0
      let activePhotos = 0
      let totalPhotos = allPhotos?.length || 0

      allPhotos?.forEach(photo => {
        // 카테고리별
        const category = photo.category || '미분류'
        categoryCount[category] = (categoryCount[category] || 0) + 1

        // 가격대별
        const price = photo.current_price || 0
        if (price < 10000) priceRanges['0-10000']++
        else if (price < 50000) priceRanges['10000-50000']++
        else if (price < 100000) priceRanges['50000-100000']++
        else priceRanges['100000+']++

        // 업로드 시간별
        const uploadDate = new Date(photo.created_at)
        if (uploadDate >= todayStart) todayUploads++
        if (uploadDate >= weekStart) weekUploads++
        if (uploadDate >= monthStart) monthUploads++

        // 활성 사진
        if (photo.status === 'active' && photo.moderation_status === 'approved') {
          activePhotos++
        }
      })

      setPhotoStats({
        total: totalPhotos,
        active: activePhotos,
        byCategory: categoryCount,
        byPriceRange: priceRanges,
        uploads: {
          today: todayUploads,
          week: weekUploads,
          month: monthUploads
        }
      })


      // === 사용자 통계 ===
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, created_at, points, is_admin')

      const userNow = new Date()
      const userTodayStart = new Date(userNow.setHours(0, 0, 0, 0))
      const userWeekStart = new Date(userNow.setDate(userNow.getDate() - 7))
      const userMonthStart = new Date(userNow.setDate(userNow.getDate() - 30))

      let todaySignups = 0
      let weekSignups = 0
      let monthSignups = 0
      let totalUsers = allUsers?.length || 0
      let admins = 0

      allUsers?.forEach(user => {
        const signupDate = new Date(user.created_at)
        if (signupDate >= userTodayStart) todaySignups++
        if (signupDate >= userWeekStart) weekSignups++
        if (signupDate >= userMonthStart) monthSignups++
        if (user.is_admin) admins++
      })

      // 판매자 수 (사진 업로드한 사람)
      const { data: sellers } = await supabase
        .from('photos')
        .select('user_id')
      
      const uniqueSellers = new Set(sellers?.map(p => p.user_id))

      setUserStats({
        total: totalUsers,
        sellers: uniqueSellers.size,
        buyers: totalUsers - uniqueSellers.size,
        admins: admins,
        signups: {
          today: todaySignups,
          week: weekSignups,
          month: monthSignups
        }
      })


      // === 매출 통계 (뼈대) ===
      const { data: transactions } = await supabase
        .from('photos')
        .select('current_price, buy_now_price, buyer_id')
        .not('buyer_id', 'is', null)

      const totalSales = transactions?.length || 0
      const totalRevenue = transactions?.reduce((sum, t) => sum + (t.buy_now_price || 0), 0) || 0
      const avgPrice = totalSales > 0 ? totalRevenue / totalSales : 0

      setSalesStats({
        totalTransactions: totalSales,
        totalRevenue: totalRevenue,
        averagePrice: Math.round(avgPrice)
      })

    } catch (error) {
      console.error('통계 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }


  // ------------------------------------------
  // 📝 활동 로그 로드
  // ------------------------------------------
  async function loadActivityLogs() {
    setLoading(true)
    try {
      const activities = []

      // 최근 업로드
      const { data: recentPhotos } = await supabase
        .from('photos')
        .select(`
          id,
          title,
          created_at,
          profiles:user_id (username)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      recentPhotos?.forEach(photo => {
        activities.push({
          type: 'upload',
          title: `${photo.profiles?.username || '알 수 없음'}님이 "${photo.title}" 업로드`,
          timestamp: photo.created_at,
          icon: '📸'
        })
      })

      // 최근 구매
      const { data: recentPurchases } = await supabase
        .from('photos')
        .select(`
          id,
          title,
          buy_now_price,
          updated_at,
          profiles:buyer_id (username)
        `)
        .not('buyer_id', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(10)

      recentPurchases?.forEach(purchase => {
        activities.push({
          type: 'purchase',
          title: `${purchase.profiles?.username || '알 수 없음'}님이 "${purchase.title}" 구매 (${purchase.buy_now_price?.toLocaleString()}P)`,
          timestamp: purchase.updated_at,
          icon: '💰'
        })
      })

      // 최근 가입
      const { data: recentSignups } = await supabase
        .from('profiles')
        .select('username, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      recentSignups?.forEach(signup => {
        activities.push({
          type: 'signup',
          title: `${signup.username}님이 가입`,
          timestamp: signup.created_at,
          icon: '👋'
        })
      })

      // 최근 검수
      const { data: recentReviews } = await supabase
        .from('moderation_queue')
        .select(`
          status,
          reviewed_at,
          photos (title)
        `)
        .not('reviewed_at', 'is', null)
        .order('reviewed_at', { ascending: false })
        .limit(10)

      recentReviews?.forEach(review => {
        activities.push({
          type: 'review',
          title: `"${review.photos?.title}" ${review.status === 'approved' ? '승인' : '거부'}됨`,
          timestamp: review.reviewed_at,
          icon: review.status === 'approved' ? '✅' : '❌'
        })
      })

      // 시간순 정렬
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      
      setRecentActivities(activities.slice(0, 20))

    } catch (error) {
      console.error('활동 로그 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }


  // ------------------------------------------
  // ✅ 승인 처리
  // ------------------------------------------
  async function handleApprove(queueItem) {
    if (!confirm('이 사진을 승인하시겠습니까?')) return

    try {
      const { error: photoError } = await supabase
        .from('photos')
        .update({ 
          moderation_status: 'approved',
          status: 'active'
        })
        .eq('id', queueItem.photo_id)

      if (photoError) throw photoError

      const { error: queueError } = await supabase
        .from('moderation_queue')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', queueItem.id)

      if (queueError) throw queueError

      alert('✅ 승인되었습니다!')
      loadModerationData()

    } catch (error) {
      console.error('승인 실패:', error)
      alert('승인 처리 중 오류가 발생했습니다')
    }
  }


  // ------------------------------------------
  // ❌ 거부 처리
  // ------------------------------------------
  async function handleReject(queueItem) {
    const reason = prompt('거부 사유를 입력하세요:', '부적절한 콘텐츠')
    if (!reason) return

    try {
      const { error: photoError } = await supabase
        .from('photos')
        .update({ 
          moderation_status: 'rejected',
          status: 'inactive'
        })
        .eq('id', queueItem.photo_id)

      if (photoError) throw photoError

      const { error: queueError } = await supabase
        .from('moderation_queue')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: reason
        })
        .eq('id', queueItem.id)

      if (queueError) throw queueError

      await supabase.from('blocked_uploads').insert({
        user_id: queueItem.user_id,
        photo_id: queueItem.photo_id,
        reason: reason,
        detected_issues: queueItem.detected_issues,
        ai_results: queueItem.ai_results
      })

      alert('❌ 거부되었습니다!')
      loadModerationData()

    } catch (error) {
      console.error('거부 실패:', error)
      alert('거부 처리 중 오류가 발생했습니다')
    }
  }


  // ------------------------------------------
  // ⏳ 로딩 화면
  // ------------------------------------------
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-gray-500">로딩중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }


  // ============================================
  // 🎨 UI 렌더링
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* 상단 헤더 */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 sticky top-0 z-10 shadow-lg">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} />
          <span>홈으로</span>
        </button>
        
        <div className="flex items-center gap-2">
          <Shield size={24} />
          <h1 className="text-xl font-bold">관리자 대시보드</h1>
        </div>
        <p className="text-sm opacity-90 mt-1">콘텐츠 검수 및 통계 관리</p>
      </div>


      {/* 탭 메뉴 */}
      <div className="bg-white border-b sticky top-[132px] z-10">
        <div className="flex">
          <button
            onClick={() => setActiveTab('moderation')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'moderation'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 검수 대기
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 통계
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'logs'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📝 활동
          </button>
        </div>
      </div>


      {/* 콘텐츠 영역 */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-gray-500">로딩중...</p>
          </div>
        ) : (
          <>
            {/* 검수 대기 탭 */}
            {activeTab === 'moderation' && (
              <>
                {/* 통계 카드 */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{moderationStats.pending}</div>
                    <div className="text-xs text-yellow-700 mt-1 font-medium">검수 대기</div>
                  </div>
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{moderationStats.approved}</div>
                    <div className="text-xs text-green-700 mt-1 font-medium">승인됨</div>
                  </div>
                  <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{moderationStats.rejected}</div>
                    <div className="text-xs text-red-700 mt-1 font-medium">거부됨</div>
                  </div>
                </div>

                {/* 검수 목록 */}
                <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <AlertCircle size={20} className="text-yellow-600" />
                  검수 대기 중 ({pendingPhotos.length})
                </h2>

                {pendingPhotos.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                    <ImageIcon size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">검수 대기 중인 사진이 없습니다</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingPhotos.map((item) => (
                      <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-sm border-2 border-yellow-200">
                        <div className="p-4">
                          <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100">
                            <img 
                              src={item.photos?.preview_url} 
                              alt={item.photos?.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-bold text-lg">{item.photos?.title}</h3>
                            <p className="text-sm text-gray-600">
                              판매자: <span className="font-medium">{item.seller_name || '알 수 없음'}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                              가격: <span className="font-bold text-primary">{item.photos?.current_price?.toLocaleString()}P</span>
                            </p>

                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-semibold">안전 점수:</span>
                              <span className={`font-bold ${
                                item.safety_score >= 0.8 ? 'text-green-600' :
                                item.safety_score >= 0.5 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {(item.safety_score * 100).toFixed(0)}점
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                item.severity === 'low' ? 'bg-green-100 text-green-700' :
                                item.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {item.severity === 'low' ? '낮음' :
                                 item.severity === 'medium' ? '중간' : '높음'}
                              </span>
                            </div>

                            {item.detected_issues && item.detected_issues.length > 0 && (
                              <div className="text-sm bg-red-50 border border-red-200 rounded-lg p-2">
                                <span className="font-semibold text-red-700">⚠️ 검출:</span>
                                <span className="text-red-600 ml-2">
                                  {item.detected_issues.join(', ')}
                                </span>
                              </div>
                            )}

                            <p className="text-xs text-gray-400 mt-2">
                              업로드: {new Date(item.created_at).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-0 border-t-2 border-gray-100">
                          <button
                            onClick={() => handleApprove(item)}
                            className="flex items-center justify-center gap-2 py-4 bg-green-50 hover:bg-green-100 text-green-700 font-bold transition-colors"
                          >
                            <Check size={20} />
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(item)}
                            className="flex items-center justify-center gap-2 py-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold transition-colors border-l-2 border-gray-100"
                          >
                            <X size={20} />
                            거부
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}


            {/* 통계 탭 */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* 사진 통계 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-purple-600" />
                    사진 통계
                  </h3>
                  
                  {photoStats && (
                    <div className="space-y-4">
                      {/* 전체 현황 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">총 사진 수</p>
                          <p className="text-2xl font-bold text-gray-800">{photoStats.total}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-700">활성 사진</p>
                          <p className="text-2xl font-bold text-green-600">{photoStats.active}</p>
                        </div>
                      </div>

                      {/* 업로드 시간별 */}
                      <div>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Calendar size={16} /> 업로드 현황
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-700">오늘</p>
                            <p className="font-bold text-blue-600">{photoStats.uploads.today}건</p>
                          </div>
                          <div className="bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-700">이번 주</p>
                            <p className="font-bold text-blue-600">{photoStats.uploads.week}건</p>
                          </div>
                          <div className="bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-700">이번 달</p>
                            <p className="font-bold text-blue-600">{photoStats.uploads.month}건</p>
                          </div>
                        </div>
                      </div>

                      {/* 카테고리별 */}
                      <div>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Tag size={16} /> 카테고리별 분포
                        </p>
                        <div className="space-y-1 text-sm">
                          {Object.entries(photoStats.byCategory).map(([category, count]) => (
                            <div key={category} className="flex justify-between items-center py-1 border-b">
                              <span className="text-gray-700">{category}</span>
                              <span className="font-semibold text-gray-900">{count}개</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 가격대별 */}
                      <div>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <DollarSign size={16} /> 가격대별 분포
                        </p>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-gray-700">0 ~ 10,000P</span>
                            <span className="font-semibold">{photoStats.byPriceRange['0-10000']}개</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-gray-700">10,000 ~ 50,000P</span>
                            <span className="font-semibold">{photoStats.byPriceRange['10000-50000']}개</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-gray-700">50,000 ~ 100,000P</span>
                            <span className="font-semibold">{photoStats.byPriceRange['50000-100000']}개</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b">
                            <span className="text-gray-700">100,000P 이상</span>
                            <span className="font-semibold">{photoStats.byPriceRange['100000+']}개</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 사용자 통계 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Users size={20} className="text-blue-600" />
                    사용자 통계
                  </h3>
                  
                  {userStats && (
                    <div className="space-y-4">
                      {/* 전체 현황 */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">총 회원 수</p>
                          <p className="text-2xl font-bold text-gray-800">{userStats.total}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-xs text-purple-700">관리자</p>
                          <p className="text-2xl font-bold text-purple-600">{userStats.admins}</p>
                        </div>
                      </div>

                      {/* 사용자 유형 */}
                      <div>
                        <p className="text-sm font-semibold mb-2">사용자 유형</p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="bg-orange-50 rounded p-2">
                            <p className="text-xs text-orange-700">판매자</p>
                            <p className="font-bold text-orange-600">{userStats.sellers}명</p>
                          </div>
                          <div className="bg-green-50 rounded p-2">
                            <p className="text-xs text-green-700">구매자</p>
                            <p className="font-bold text-green-600">{userStats.buyers}명</p>
                          </div>
                        </div>
                      </div>

                      {/* 가입 현황 */}
                      <div>
                        <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <TrendingUp size={16} /> 가입 현황
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-700">오늘</p>
                            <p className="font-bold text-blue-600">{userStats.signups.today}명</p>
                          </div>
                          <div className="bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-700">이번 주</p>
                            <p className="font-bold text-blue-600">{userStats.signups.week}명</p>
                          </div>
                          <div className="bg-blue-50 rounded p-2">
                            <p className="text-xs text-blue-700">이번 달</p>
                            <p className="font-bold text-blue-600">{userStats.signups.month}명</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 매출 통계 */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <DollarSign size={20} className="text-green-600" />
                    매출 통계
                  </h3>
                  
                  {salesStats && (
                    <div className="space-y-3">
                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-green-700">총 거래액</p>
                        <p className="text-2xl font-bold text-green-600">
                          {salesStats.totalRevenue.toLocaleString()}P
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">총 거래 수</p>
                          <p className="text-xl font-bold text-gray-800">{salesStats.totalTransactions}건</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-600">평균 거래가</p>
                          <p className="text-xl font-bold text-gray-800">{salesStats.averagePrice.toLocaleString()}P</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-blue-700 mb-1">💡 향후 추가 예정</p>
                        <p className="text-xs text-blue-600">일별/월별 매출 추이, 수수료 통계 등</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* 활동 로그 탭 */}
            {activeTab === 'logs' && (
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-4 border-b">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Activity size={20} className="text-purple-600" />
                    최근 활동 (20건)
                  </h3>
                </div>
                
                <div className="divide-y">
                  {recentActivities.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      활동 내역이 없습니다
                    </div>
                  ) : (
                    recentActivities.map((activity, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{activity.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.timestamp).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  )
}
