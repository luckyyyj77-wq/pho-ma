// src/pages/Home.jsx - 샤인머스켓 테마 + 햄버거 메뉴 + 2열 + 무한 스크롤
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Search, Plus, Heart, TrendingUp, Sparkles, Menu, X, Home as HomeIcon, Upload as UploadIcon, User, CreditCard, MessageSquare, LogOut, Loader, Eye } from 'lucide-react'
import Timer from '../components/Timer'
import { useLikes } from '../hooks/useLikes'
import NotificationBell from '../components/NotificationBell'

// 사진 카드 컴포넌트 (좋아요 기능 포함)
function PhotoCard({ photo, user }) {
  const { isLiked, likesCount, loading: likeLoading, toggleLike } = useLikes(photo.id, user?.id)

  const handleLikeClick = async (e) => {
    e.stopPropagation() // 카드 클릭 이벤트 방지
    const result = await toggleLike()

    if (result.success && result.reward?.given) {
      alert(result.reward.message)
    } else if (!result.success && result.message) {
      alert(result.message)
    }
  }

  return (
    <div
      onClick={() => window.location.href = `/photo/${photo.id}`}
      className="group cursor-pointer"
    >
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-1">
        {/* 이미지 */}
        {photo.preview_url ? (
          <img
            src={photo.preview_url}
            alt={photo.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7] flex items-center justify-center">
            <Sparkles size={48} className="text-white/50" />
          </div>
        )}

        {/* 그라데이션 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

        {/* 우측: 좋아요, 조회수 가로 정렬 */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {/* 좋아요 버튼 (클릭 가능) */}
          <button
            onClick={handleLikeClick}
            disabled={likeLoading}
            className={`px-2 py-1 rounded-full shadow-lg transition-all flex items-center gap-1 ${
              isLiked
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-black/60 hover:bg-black/80'
            }`}
          >
            <Heart
              size={14}
              className={isLiked ? 'text-white fill-white' : 'text-red-500 fill-red-500'}
            />
            <span className="text-white text-xs font-semibold">{likesCount || 0}</span>
          </button>

          {/* 조회수 */}
          <div className="px-2 py-1 bg-black/60 rounded-full flex items-center gap-1 shadow-lg">
            <Eye size={14} className="text-blue-400" />
            <span className="text-white text-xs font-semibold">{photo.views_count || 0}</span>
          </div>
        </div>

        {/* 정보 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
          <h3 className="font-bold text-lg mb-1 line-clamp-1">{photo.title}</h3>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-white/90">{photo.price?.toLocaleString()}P</p>
            <TrendingUp size={16} className="text-[#B3D966]" />
          </div>
          {/* 작성자 정보 */}
          <p className="text-xs text-white/70 mb-1">
            작성자: {photo.profiles?.username || '익명'}
          </p>
          {/* 타이머 추가 */}
          <div className="bg-black/30 rounded-lg px-2 py-1">
            <Timer endTime={photo.end_time} compact={true} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const [categories, setCategories] = useState([])  // 동적 카테고리
  const [selectedCategory, setSelectedCategory] = useState('all')  // 선택된 카테고리
  const [showAvailableOnly, setShowAvailableOnly] = useState(() => {
    // localStorage에서 초기값 불러오기
    const saved = localStorage.getItem('showAvailableOnly')
    return saved === 'true'
  })
  const observerTarget = useRef(null)

  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    checkUser()
    fetchCategories()  // 카테고리 불러오기
  }, [])

  // 카테고리 또는 토글 변경 시 사진 다시 불러오기
  useEffect(() => {
    // 카테고리가 아직 로드되지 않은 상태에서 특정 카테고리 조회를 방지
    if (selectedCategory !== 'all' && categories.length === 0) {
      return;
    }
    fetchPhotos(true)
  }, [selectedCategory, categories, showAvailableOnly])

  // 토글 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem('showAvailableOnly', showAvailableOnly.toString())
  }, [showAvailableOnly])

  // 무한 스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current)
      }
    }
  }, [hasMore, loadingMore, loading])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
    } else {
      setCategories(data || [])
    }
  }

  const fetchPhotos = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
      setPage(0)
      setHasMore(true)
    } else {
      setLoadingMore(true)
    }

    const from = isInitial ? 0 : (page + 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1

    console.log('📊 정렬 기준:', selectedCategory)

    let query = supabase
      .from('photos')
      .select('*, end_time')

    // 카테고리 필터 적용 (popular, new는 정렬 방식이므로 제외)
    if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== 'popular' && selectedCategory !== 'new') {
      // category_id로 필터 (UUID)
      const categoryData = categories.find(c => c.slug === selectedCategory)
      if (categoryData) {
        query = query.eq('category_id', categoryData.id)
      }
    }

    // 상태 필터링: active 상태만 표시 (낙찰/유찰 시 즉시 사라짐)
    console.log('🛒 경매 진행중인 사진만 표시 (active)')
    query = query.eq('status', 'active')

    // 정렬 적용
    if (selectedCategory === 'popular') {
      // 인기: 좋아요 10점 + 조회수 1점, 같으면 최신순
      console.log('❤️ 인기순 정렬 적용 (좋아요 10점 + 조회수 1점)')
      // Supabase는 계산식 정렬을 지원하지 않으므로 클라이언트에서 정렬
      query = query.order('likes_count', { ascending: false, nullsLast: true })
    } else {
      // 신규 또는 기본: 등록 시점 기준 최신순
      console.log('🆕 신규순 정렬 적용')
      query = query.order('created_at', { ascending: false })
    }

    query = query.range(from, to)

    const { data, error } = await query

    if (error) {
      console.error('❌ Error fetching photos:', error)
    } else {
      console.log(`✅ 불러온 사진 개수: ${data?.length || 0}`, data?.slice(0, 3).map(p => ({
        title: p.title,
        likes: p.likes_count,
        views: p.views_count,
        created: p.created_at
      })))

      // 인기순일 경우 클라이언트에서 가중치 정렬
      let sortedData = data || []
      if (selectedCategory === 'popular' && sortedData.length > 0) {
        sortedData = sortedData.sort((a, b) => {
          const scoreA = (a.likes_count || 0) * 10 + (a.views_count || 0)
          const scoreB = (b.likes_count || 0) * 10 + (b.views_count || 0)
          if (scoreB !== scoreA) {
            return scoreB - scoreA // 점수 높은 순
          }
          // 점수가 같으면 최신순
          return new Date(b.created_at) - new Date(a.created_at)
        })
        console.log('📊 가중치 정렬 완료:', sortedData.slice(0, 3).map(p => ({
          title: p.title,
          score: (p.likes_count || 0) * 10 + (p.views_count || 0)
        })))
      }

      // 프로필 정보 추가 (N+1 문제 해결 - 한 번의 쿼리로 모든 프로필 조회)
      const userIds = [...new Set(sortedData.map(photo => photo.user_id).filter(Boolean))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      const profileMap = new Map((profiles || []).map(p => [p.id, p]))

      const photosWithProfiles = sortedData.map(photo => ({
        ...photo,
        profiles: profileMap.get(photo.user_id) || { username: '익명' }
      }))

      if (isInitial) {
        setPhotos(photosWithProfiles)
      } else {
        setPhotos(prev => [...prev, ...photosWithProfiles])
      }
      
      // 더 이상 데이터가 없으면
      if (!data || data.length < ITEMS_PER_PAGE) {
        setHasMore(false)
      }

      if (!isInitial) {
        setPage(prev => prev + 1)
      }
    }

    setLoading(false)
    setLoadingMore(false)
  }

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPhotos(false)
    }
  }, [loadingMore, hasMore, page])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth'
  }

  const filteredPhotos = searchQuery
    ? photos.filter(photo => {
        const lowercasedQuery = searchQuery.toLowerCase()
        return (
          (photo.title && photo.title.toLowerCase().includes(lowercasedQuery)) ||
          (photo.description && photo.description.toLowerCase().includes(lowercasedQuery))
        )
      })
    : photos

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] pb-24">
      
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#B3D966] to-[#9DC183] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-2">

          {/* 로고 & 타이틀 & 알림 */}
          <div className="flex items-center justify-between mb-2">
            {/* 왼쪽: 햄버거 메뉴 (공간 확보용) */}
            <div className="w-10"></div>

            {/* 중앙: 로고 & 타이틀 */}
            <div className="flex items-center gap-2">
              {/* 로고 (50% 축소) */}
              <svg width="20" height="20" viewBox="0 0 326 335" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg flex-shrink-0">
                <path d="M200 128.171C200 183.399 155.228 228.171 100 228.171C44.7715 228.171 0 183.399 0 128.171C0 72.9422 44.7715 28.1707 100 28.1707C155.228 28.1707 200 72.9422 200 128.171Z" fill="#D9D9D9"/>
                <path d="M192 127.671C192 178.757 150.586 220.171 99.5 220.171C48.4137 220.171 7 178.757 7 127.671C7 76.5844 48.4137 35.1707 99.5 35.1707C150.586 35.1707 192 76.5844 192 127.671Z" fill="white"/>
                <path d="M261 234.171C261 289.399 216.228 334.171 161 334.171C105.772 334.171 61 289.399 61 234.171C61 178.942 105.772 134.171 161 134.171C216.228 134.171 261 178.942 261 234.171Z" fill="#D9D9D9"/>
                <path d="M253 233.671C253 284.757 211.586 326.171 160.5 326.171C109.414 326.171 68 284.757 68 233.671C68 182.584 109.414 141.171 160.5 141.171C211.586 141.171 253 182.584 253 233.671Z" fill="white"/>
                <path d="M326 135.171C326 190.399 281.228 235.171 226 235.171C170.772 235.171 126 190.399 126 135.171C126 79.9422 170.772 35.1707 226 35.1707C281.228 35.1707 326 79.9422 326 135.171Z" fill="#D9D9D9"/>
                <path d="M318 134.671C318 185.757 276.586 227.171 225.5 227.171C174.414 227.171 133 185.757 133 134.671C133 83.5844 174.414 42.1707 225.5 42.1707C276.586 42.1707 318 83.5844 318 134.671Z" fill="white"/>
                <path d="M148.5 20.0008C147.119 17.6094 147.939 14.5514 150.33 13.1707L171.981 0.670708C174.372 -0.710004 177.43 0.109372 178.811 2.50083L191.311 24.1515C192.692 26.5429 191.872 29.6009 189.481 30.9816L167.83 43.4816C165.439 44.8623 162.381 44.0429 161 41.6515L148.5 20.0008Z" fill="#C96464"/>
              </svg>
              {/* 포토마켓 (그라데이션 색상) */}
              <h1 className="text-xl font-black tracking-tight flex">
                <span style={{ color: '#6618b9ff' }}>포</span>
                <span style={{ color: '#e05c0aff' }}>토</span>
                <span style={{ color: '#0b69e4ff' }}>마</span>
                <span style={{ color: '#ffee02ff' }}>켓</span>
              </h1>
            </div>

            {/* 우측: 알림 벨 (로그인 시) 또는 빈 공간 (비로그인 시) */}
            {user ? (
              <NotificationBell />
            ) : (
              <div className="w-10"></div>
            )}
          </div>

          {/* 검색 바 & 구매가능 토글 */}
          <div className="flex items-center gap-2">
            {/* 검색 바 */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="사진 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded-xl bg-white border-2 border-white/50 focus:border-white focus:outline-none shadow-lg transition-all text-sm"
              />
            </div>

            {/* 구매가능 토글 스위치 (2줄) */}
            <button
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold text-xs shadow-lg transition-all flex-shrink-0 ${
                showAvailableOnly
                  ? 'bg-white text-[#B3D966]'
                  : 'bg-white/80 text-gray-700 hover:bg-white'
              }`}
            >
              <div className={`w-7 h-3.5 rounded-full transition-all relative ${
                showAvailableOnly ? 'bg-[#B3D966]' : 'bg-gray-300'
              }`}>
                <div className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${
                  showAvailableOnly ? 'translate-x-3.5' : 'translate-x-0'
                }`}></div>
              </div>
              <div className="flex flex-col leading-tight text-[10px]">
                <span>구매</span>
                <span>가능</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* 카테고리 태그 */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-md transition-all ${
                  selectedCategory === category.slug
                    ? 'bg-[#B3D966] text-white'
                    : 'bg-white text-gray-700 hover:bg-[#B3D966] hover:text-white'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 사진 그리드 - 2열로 변경 */}
      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">사진을 불러오는 중...</p>
            </div>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Sparkles size={64} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-lg mb-2">아직 사진이 없어요</p>
            <p className="text-gray-400 text-sm mb-6">첫 번째 사진을 업로드해보세요!</p>
            <button
              onClick={() => window.location.href = '/upload'}
              className="bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              사진 업로드하기
            </button>
          </div>
        ) : (
          <>
            {/* 2열 그리드 */}
            <div className="grid grid-cols-2 gap-4">
              {filteredPhotos.map((photo) => (
                <PhotoCard key={photo.id} photo={photo} user={user} />
              ))}
            </div>

            {/* 무한 스크롤 로딩 인디케이터 */}
            <div ref={observerTarget} className="flex justify-center py-8">
              {loadingMore && (
                <div className="flex items-center gap-2 text-[#558B2F]">
                  <Loader size={24} className="animate-spin" />
                  <span className="font-semibold">더 불러오는 중...</span>
                </div>
              )}
              {!hasMore && photos.length > 0 && (
                <p className="text-gray-400 text-sm">모든 사진을 불러왔어요 🍇</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* 하단 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-20">
        <div className="max-w-7xl mx-auto px-4 py-1.5">
          <div className="flex justify-around items-center">
            {/* 햄버거 버튼 */}
            <button
              onClick={() => setMenuOpen(true)}
              className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#B3D966] transition-colors"
            >
              <div className="p-1.5 hover:bg-[#B3D966]/10 rounded-lg transition-colors">
                <Menu size={14} />
              </div>
              <span className="text-[10px] font-semibold">메뉴</span>
            </button>

            {/* 업로드 */}
            <button
              onClick={() => window.location.href = '/upload'}
              className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#B3D966] transition-colors"
            >
              <div className="p-1.5 hover:bg-[#B3D966]/10 rounded-lg transition-colors">
                <Plus size={14} />
              </div>
              <span className="text-[10px] font-semibold">업로드</span>
            </button>

            {/* 프로필 */}
            <button
              onClick={() => window.location.href = '/profile'}
              className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-[#B3D966] transition-colors"
            >
              <div className="p-1.5 hover:bg-[#B3D966]/10 rounded-lg transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-[10px] font-semibold">프로필</span>
            </button>
          </div>
        </div>
      </div>

      {/* 햄버거 메뉴 사이드바 */}
      {menuOpen && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 animate-fadeIn"
            onClick={() => setMenuOpen(false)}
          ></div>

          {/* 사이드바 */}
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 animate-slideInLeft">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-[#B3D966] to-[#9DC183] p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 326 335" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                    <path d="M200 128.171C200 183.399 155.228 228.171 100 228.171C44.7715 228.171 0 183.399 0 128.171C0 72.9422 44.7715 28.1707 100 28.1707C155.228 28.1707 200 72.9422 200 128.171Z" fill="#D9D9D9"/>
                    <path d="M192 127.671C192 178.757 150.586 220.171 99.5 220.171C48.4137 220.171 7 178.757 7 127.671C7 76.5844 48.4137 35.1707 99.5 35.1707C150.586 35.1707 192 76.5844 192 127.671Z" fill="white"/>
                    <path d="M261 234.171C261 289.399 216.228 334.171 161 334.171C105.772 334.171 61 289.399 61 234.171C61 178.942 105.772 134.171 161 134.171C216.228 134.171 261 178.942 261 234.171Z" fill="#D9D9D9"/>
                    <path d="M253 233.671C253 284.757 211.586 326.171 160.5 326.171C109.414 326.171 68 284.757 68 233.671C68 182.584 109.414 141.171 160.5 141.171C211.586 141.171 253 182.584 253 233.671Z" fill="white"/>
                    <path d="M326 135.171C326 190.399 281.228 235.171 226 235.171C170.772 235.171 126 190.399 126 135.171C126 79.9422 170.772 35.1707 226 35.1707C281.228 35.1707 326 79.9422 326 135.171Z" fill="#D9D9D9"/>
                    <path d="M318 134.671C318 185.757 276.586 227.171 225.5 227.171C174.414 227.171 133 185.757 133 134.671C133 83.5844 174.414 42.1707 225.5 42.1707C276.586 42.1707 318 83.5844 318 134.671Z" fill="white"/>
                    <path d="M148.5 20.0008C147.119 17.6094 147.939 14.5514 150.33 13.1707L171.981 0.670708C174.372 -0.710004 177.43 0.109372 178.811 2.50083L191.311 24.1515C192.692 26.5429 191.872 29.6009 189.481 30.9816L167.83 43.4816C165.439 44.8623 162.381 44.0429 161 41.6515L148.5 20.0008Z" fill="#C96464"/>
                  </svg>
                  <h2 className="text-2xl font-black tracking-tight flex">
                    <span style={{ color: '#C8A2F0' }}>포</span>
                    <span style={{ color: '#FF8C42' }}>토</span>
                    <span style={{ color: '#87CEEB' }}>마</span>
                    <span style={{ color: '#B3D966' }}>켓</span>
                  </h2>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              {user && (
                <p className="text-white/90 text-sm">{user.email}</p>
              )}
            </div>

            {/* 메뉴 아이템 */}
            <div className="py-4">
              <button
                onClick={() => {
                  window.location.href = '/'
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#F1F8E9] transition-colors"
              >
                <HomeIcon size={24} className="text-[#558B2F]" />
                <span className="font-semibold text-gray-800">홈</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/upload'
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#F1F8E9] transition-colors"
              >
                <UploadIcon size={24} className="text-[#558B2F]" />
                <span className="font-semibold text-gray-800">업로드</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/profile'
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#F1F8E9] transition-colors"
              >
                <User size={24} className="text-[#558B2F]" />
                <span className="font-semibold text-gray-800">프로필</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/point-charge'
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#F1F8E9] transition-colors"
              >
                <CreditCard size={24} className="text-[#558B2F]" />
                <span className="font-semibold text-gray-800">포인트 충전</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/community'
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#F1F8E9] transition-colors"
              >
                <MessageSquare size={24} className="text-[#558B2F]" />
                <span className="font-semibold text-gray-800">커뮤니티 게시판</span>
              </button>

              <div className="border-t border-gray-200 my-2"></div>

              <button
                onClick={() => {
                  handleLogout()
                  setMenuOpen(false)
                }}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 transition-colors text-red-600"
              >
                <LogOut size={24} />
                <span className="font-semibold">로그아웃</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* CSS 애니메이션 */}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease-out;
        }
        `}
      </style>
    </div>
  )
}