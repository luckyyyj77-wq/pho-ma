// src/pages/Admin.jsx - 통합 관리자 대시보드
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { 
  ArrowLeft, Check, X, AlertCircle, Image as ImageIcon, Shield,
  BarChart3, Activity, Users, DollarSign, Calendar, Tag, TrendingUp,
  Plus, Edit2, Trash2, Save, GripVertical, Eye, EyeOff,
  Home, ImageIcon as PhotoIcon, FolderOpen, MessageSquare, UserCog, Coins,
  Menu
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Admin() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  // 권한 및 메뉴 상태
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingAdmin, setCheckingAdmin] = useState(true)
  const [activeMenu, setActiveMenu] = useState('dashboard') // dashboard, photos, categories, board, users, points
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // 사진 검수 관련
  const [pendingPhotos, setPendingPhotos] = useState([])
  const [moderationStats, setModerationStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  })

  // 통계 데이터
  const [dashboardStats, setDashboardStats] = useState({
    totalPhotos: 0,
    totalUsers: 0,
    totalSales: 0,
    pendingReviews: 0
  })

  // 카테고리 관리
  const [categories, setCategories] = useState([])
  const [editingCategoryId, setEditingCategoryId] = useState(null)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    color: '#B3D966',
    description: '',
    is_active: true
  })

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
      if (activeMenu === 'dashboard') {
        loadDashboardStats()
      } else if (activeMenu === 'photos') {
        loadModerationData()
      } else if (activeMenu === 'categories') {
        loadCategories()
      }
    }
  }, [isAdmin, activeMenu])


  // ------------------------------------------
  // 📊 대시보드 통계 로드
  // ------------------------------------------
  async function loadDashboardStats() {
    setLoading(true)
    try {
      // 사진 수
      const { count: photoCount } = await supabase
        .from('photos')
        .select('*', { count: 'exact', head: true })

      // 회원 수
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // 검수 대기
      const { count: pendingCount } = await supabase
        .from('moderation_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // 거래 수 (임시)
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

      // 최근 활동
      await loadRecentActivities()

    } catch (error) {
      console.error('대시보드 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }


  // ------------------------------------------
  // 📝 최근 활동 로드
  // ------------------------------------------
  async function loadRecentActivities() {
    try {
      const activities = []

      // 최근 업로드
      const { data: recentPhotos } = await supabase
        .from('photos')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      recentPhotos?.forEach(photo => {
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

      recentSignups?.forEach(signup => {
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


  // ------------------------------------------
  // 📋 검수 데이터 로드
  // ------------------------------------------
  async function loadModerationData() {
    setLoading(true)
    try {
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

      alert('❌ 거부되었습니다!')
      loadModerationData()

    } catch (error) {
      console.error('거부 실패:', error)
      alert('거부 처리 중 오류가 발생했습니다')
    }
  }


  // ------------------------------------------
  // 🗂️ 카테고리 로드
  // ------------------------------------------
  async function loadCategories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }


  // ------------------------------------------
  // ➕ 카테고리 추가
  // ------------------------------------------
  async function handleAddCategory(e) {
    e.preventDefault()

    const autoSlug = categoryFormData.slug || 
      categoryFormData.name.toLowerCase().replace(/\s+/g, '-') || 
      `category-${Date.now()}`

    const { error } = await supabase
      .from('categories')
      .insert([{
        ...categoryFormData,
        slug: autoSlug,
        display_order: categories.length
      }])

    if (error) {
      alert('카테고리 추가 실패: ' + error.message)
    } else {
      alert('✅ 카테고리가 추가되었습니다!')
      setShowAddCategoryModal(false)
      setCategoryFormData({
        name: '',
        slug: '',
        icon: '',
        color: '#B3D966',
        description: '',
        is_active: true
      })
      loadCategories()
    }
  }


  // ------------------------------------------
  // ✏️ 카테고리 수정
  // ------------------------------------------
  async function handleUpdateCategory(id, updates) {
    const { error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)

    if (error) {
      alert('카테고리 수정 실패: ' + error.message)
    } else {
      loadCategories()
      setEditingCategoryId(null)
    }
  }


  // ------------------------------------------
  // 🗑️ 카테고리 삭제
  // ------------------------------------------
  async function handleDeleteCategory(id, name) {
    if (name === '전체') {
      alert('⚠️ "전체" 카테고리는 삭제할 수 없습니다.')
      return
    }

    if (!confirm(`정말 "${name}" 카테고리를 삭제하시겠습니까?\n\n이 카테고리의 모든 사진은 "전체" 카테고리로 이동됩니다.`)) {
      return
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      alert('카테고리 삭제 실패: ' + error.message)
    } else {
      alert('✅ 카테고리가 삭제되었습니다.')
      loadCategories()
    }
  }


  // ------------------------------------------
  // 👁️ 활성화/비활성화 토글
  // ------------------------------------------
  async function toggleCategoryActive(id, currentStatus) {
    await handleUpdateCategory(id, { is_active: !currentStatus })
  }


  // ------------------------------------------
  // ⬆️⬇️ 순서 변경
  // ------------------------------------------
  async function moveCategory(index, direction) {
    const newCategories = [...categories]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= newCategories.length) return

    [newCategories[index], newCategories[targetIndex]] = 
    [newCategories[targetIndex], newCategories[index]]

    const updates = newCategories.map((cat, idx) => ({
      id: cat.id,
      display_order: idx
    }))

    for (const update of updates) {
      await supabase
        .from('categories')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
    }

    loadCategories()
  }


  // ------------------------------------------
  // ⏳ 로딩 화면
  // ------------------------------------------
  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }


  // 메뉴 아이템
  const menuItems = [
    { id: 'dashboard', icon: Home, label: '대시보드', badge: null },
    { id: 'photos', icon: PhotoIcon, label: '사진 관리', badge: dashboardStats.pendingReviews },
    { id: 'categories', icon: FolderOpen, label: '카테고리', badge: null },
    { id: 'board', icon: MessageSquare, label: '게시판', badge: null },
    { id: 'users', icon: UserCog, label: '회원 관리', badge: null },
    { id: 'points', icon: Coins, label: '포인트', badge: null },
  ]


  // ============================================
  // 🎨 UI 렌더링
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9]">

      {/* 상단 헤더 */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-[#B3D966] to-[#9DC183] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            
            <div className="flex items-center gap-2">
              <Shield size={24} className="text-white" />
              <h1 className="text-xl font-black text-white">관리자</h1>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors md:hidden"
            >
              <Menu size={24} className="text-white" />
            </button>
            <div className="w-10 hidden md:block"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* 사이드바 메뉴 */}
        <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block w-64 bg-white shadow-lg min-h-screen sticky top-[72px] overflow-y-auto`}>
          <div className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveMenu(item.id)
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeMenu === item.id
                    ? 'bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white shadow-md'
                    : 'hover:bg-[#F1F8E9] text-gray-700'
                }`}
              >
                <item.icon size={20} />
                <span className="font-semibold flex-1 text-left">{item.label}</span>
                {item.badge !== null && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* 대시보드 */}
              {activeMenu === 'dashboard' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-gray-800">대시보드</h2>
                  
                  {/* 통계 카드 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <PhotoIcon size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{dashboardStats.totalPhotos}</p>
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
                          <p className="text-2xl font-bold text-gray-800">{dashboardStats.totalUsers}</p>
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
                          <p className="text-2xl font-bold text-gray-800">{dashboardStats.totalSales}</p>
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
                          <p className="text-2xl font-bold text-gray-800">{dashboardStats.pendingReviews}</p>
                          <p className="text-xs text-gray-600">검수 대기</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 최근 활동 */}
                  <div className="bg-white rounded-xl shadow-md p-6">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Activity size={20} className="text-[#558B2F]" />
                      최근 활동
                    </h3>
                    <div className="space-y-3">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <span className="text-2xl">{activity.icon}</span>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(activity.timestamp).toLocaleString('ko-KR')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 사진 관리 (검수) */}
              {activeMenu === 'photos' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-gray-800">사진 관리</h2>
                  
                  {/* 통계 카드 */}
                  <div className="grid grid-cols-3 gap-3">
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
                  {pendingPhotos.length === 0 ? (
                    <div className="bg-white rounded-xl p-12 text-center shadow-md">
                      <ImageIcon size={64} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">검수 대기 중인 사진이 없습니다</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {pendingPhotos.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl overflow-hidden shadow-md border-2 border-yellow-200">
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
                                가격: <span className="font-bold text-[#558B2F]">{item.photos?.current_price?.toLocaleString()}P</span>
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
                              </div>

                              {item.detected_issues && item.detected_issues.length > 0 && (
                                <div className="text-sm bg-red-50 border border-red-200 rounded-lg p-2">
                                  <span className="font-semibold text-red-700">⚠️ 검출:</span>
                                  <span className="text-red-600 ml-2">
                                    {item.detected_issues.join(', ')}
                                  </span>
                                </div>
                              )}
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
                </div>
              )}

              {/* 카테고리 관리 */}
              {activeMenu === 'categories' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-gray-800">카테고리 관리</h2>
                    <button
                      onClick={() => setShowAddCategoryModal(true)}
                      className="bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white px-4 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Plus size={20} />
                      추가
                    </button>
                  </div>

                  <div className="space-y-3">
                    {categories.map((category, index) => (
                      <div
                        key={category.id}
                        className={`bg-white rounded-xl shadow-md p-4 ${
                          !category.is_active ? 'opacity-50' : ''
                        }`}
                      >
                        {editingCategoryId === category.id ? (
                          // 수정 모드
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={category.name}
                                onChange={(e) => {
                                  const updated = categories.map(c =>
                                    c.id === category.id ? { ...c, name: e.target.value } : c
                                  )
                                  setCategories(updated)
                                }}
                                className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                                placeholder="카테고리 이름"
                              />
                              <input
                                type="text"
                                value={category.icon}
                                onChange={(e) => {
                                  const updated = categories.map(c =>
                                    c.id === category.id ? { ...c, icon: e.target.value } : c
                                  )
                                  setCategories(updated)
                                }}
                                className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                                placeholder="이모지"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleUpdateCategory(category.id, category)}
                                className="flex-1 bg-[#B3D966] text-white py-2 rounded-lg font-semibold hover:bg-[#9DC183] transition-colors flex items-center justify-center gap-2"
                              >
                                <Save size={16} />
                                저장
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCategoryId(null)
                                  loadCategories()
                                }}
                                className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          // 보기 모드
                          <div className="flex items-center gap-3">
                            {/* 드래그 핸들 */}
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => moveCategory(index, 'up')}
                                disabled={index === 0}
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                              >
                                <GripVertical size={16} className="text-gray-400" />
                              </button>
                              <button
                                onClick={() => moveCategory(index, 'down')}
                                disabled={index === categories.length - 1}
                                className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                              >
                                <GripVertical size={16} className="text-gray-400" />
                              </button>
                            </div>

                            {/* 아이콘 */}
                            <div 
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                              style={{ backgroundColor: category.color + '20' }}
                            >
                              {category.icon || '📁'}
                            </div>

                            {/* 정보 */}
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-800">{category.name}</h3>
                              <p className="text-xs text-gray-500">{category.slug}</p>
                            </div>

                            {/* 액션 버튼 */}
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleCategoryActive(category.id, category.is_active)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                {category.is_active ? (
                                  <Eye size={18} className="text-[#558B2F]" />
                                ) : (
                                  <EyeOff size={18} className="text-gray-400" />
                                )}
                              </button>
                              <button
                                onClick={() => setEditingCategoryId(category.id)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Edit2 size={18} className="text-blue-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteCategory(category.id, category.name)}
                                disabled={category.name === '전체'}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <Trash2 size={18} className="text-red-500" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 게시판 관리 (준비중) */}
              {activeMenu === 'board' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-gray-800">게시판 관리</h2>
                  <div className="bg-white rounded-xl p-12 text-center shadow-md">
                    <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg mb-2">준비 중입니다</p>
                    <p className="text-gray-400 text-sm">곧 게시글 관리 기능이 추가됩니다</p>
                  </div>
                </div>
              )}

              {/* 회원 관리 (준비중) */}
              {activeMenu === 'users' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-gray-800">회원 관리</h2>
                  <div className="bg-white rounded-xl p-12 text-center shadow-md">
                    <UserCog size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg mb-2">준비 중입니다</p>
                    <p className="text-gray-400 text-sm">회원 목록, 권한 관리 기능이 추가될 예정입니다</p>
                  </div>
                </div>
              )}

              {/* 포인트 관리 (준비중) */}
              {activeMenu === 'points' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-black text-gray-800">포인트 관리</h2>
                  <div className="bg-white rounded-xl p-12 text-center shadow-md">
                    <Coins size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg mb-2">준비 중입니다</p>
                    <p className="text-gray-400 text-sm">포인트 충전 내역, 정산 관리 기능이 추가될 예정입니다</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 카테고리 추가 모달 */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-[#B3D966] to-[#9DC183] p-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-black text-white">새 카테고리</h2>
              <button
                onClick={() => setShowAddCategoryModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  카테고리 이름 *
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                  placeholder="예: 건축"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  슬러그 (영문, 선택)
                </label>
                <input
                  type="text"
                  value={categoryFormData.slug}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                  placeholder="architecture (자동 생성됨)"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  아이콘 (이모지)
                </label>
                <input
                  type="text"
                  value={categoryFormData.icon}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-[#B3D966] focus:outline-none"
                  placeholder="🏛️"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  색상
                </label>
                <input
                  type="color"
                  value={categoryFormData.color}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, color: e.target.value })}
                  className="w-full h-12 border-2 border-gray-200 rounded-lg cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                추가하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}