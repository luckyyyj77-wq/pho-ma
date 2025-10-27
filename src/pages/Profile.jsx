// ============================================
// 📦 라이브러리 및 컴포넌트 import
// ============================================
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, User, Image, Heart, ShoppingBag, Gavel, TrendingUp } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'




// ============================================
// 🎯 메인 컴포넌트
// ============================================
export default function Profile() {

  // ------------------------------------------
  // 🔐 로그인 상태 체크
  // ------------------------------------------
  const { user, loading: authLoading } = useAuth()


  // ------------------------------------------
  // 📊 내 정보 state 관리
  // ------------------------------------------
  const [myPhotos, setMyPhotos] = useState([])
  const [purchasedPhotos, setPurchasedPhotos] = useState([])
  const [biddingPhotos, setBiddingPhotos] = useState([])
  const [points, setPoints] = useState(0)
  const [username, setUsername] = useState('포마 유저')
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('selling')
  const [stats, setStats] = useState({
    sellingCount: 0,
    soldCount: 0,
    purchasedCount: 0,
    biddingCount: 0,
    totalSales: 0,
    totalSpent: 0
  })
  const [loading, setLoading] = useState(true)




  // ------------------------------------------
  // 🚪 로그인 체크 및 데이터 로드
  // ------------------------------------------
  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = '/auth'
    } else if (user) {
      loadAllData()
    }
  }, [user, authLoading])

  // 페이지 포커스 시 데이터 새로고침
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        loadAllData()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])




  // ------------------------------------------
  // 📊 모든 데이터 한 번에 로드
  // ------------------------------------------
  async function loadAllData() {
    try {
      setLoading(true)

      // 병렬로 모든 데이터 조회
      const [
        photosResult,
        pointsResult,
        transactionsResult,
        purchasesResult,
        bidsResult,
        profileResult,
      ] = await Promise.all([
        // 1. 내가 등록한 사진들
        supabase
          .from('photos')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),

        // 2. 내 포인트
        supabase
          .from('profiles')
          .select('points')
          .eq('id', user.id)
          .maybeSingle(),

        // 3. 거래 내역
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50),

        // 4. 내가 구매한 사진들
        supabase
          .from('purchases')
          .select(`
            *,
            photos (
              id,
              title,
              preview_url,
              category
            )
          `)
          .eq('buyer_id', user.id)
          .order('purchased_at', { ascending: false }),

        // 5. 내가 입찰 중인 사진들
        supabase
          .from('bids')
          .select(`
            *,
            photos (
              id,
              title,
              preview_url,
              current_price,
              status
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),

        // 6. 내 프로필 정보 (맨 마지막에 추가)
         supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single()

      ])

      // 데이터 저장
      const myPhotosData = photosResult.data || []
      setMyPhotos(myPhotosData)
      setPoints(pointsResult.data?.points || 0)
      setUsername(profileResult.data?.username || '포마 유저')
      setTransactions(transactionsResult.data || [])
      setPurchasedPhotos(purchasesResult.data || [])
      setBiddingPhotos(bidsResult.data || [])

      // 통계 계산
      const sellingPhotos = myPhotosData.filter(p => p.status === 'active')
      const soldPhotos = myPhotosData.filter(p => p.status === 'sold')
      
      // 판매 수익 계산
      const salesTransactions = transactionsResult.data?.filter(t => t.type === 'sale') || []
      const totalSales = salesTransactions.reduce((sum, t) => sum + t.amount, 0)

      // 구매 금액 계산
      const purchaseTransactions = transactionsResult.data?.filter(t => t.type === 'purchase') || []
      const totalSpent = purchaseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

      setStats({
        sellingCount: sellingPhotos.length,
        soldCount: soldPhotos.length,
        purchasedCount: purchasesResult.data?.length || 0,
        biddingCount: bidsResult.data?.length || 0,
        totalSales,
        totalSpent
      })

    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }




  // ------------------------------------------
  // 🗑️ 사진 삭제
  // ------------------------------------------
  async function handleDeletePhoto(photoId) {
    if (!confirm('정말 삭제하시겠어요?')) return

    try {
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', photoId)
        .eq('user_id', user.id)  // 본인 사진만 삭제 가능

      if (error) throw error

      alert('삭제되었습니다')
      loadAllData()  // 새로고침
    } catch (error) {
      console.error('삭제 실패:', error)
      alert('삭제 중 오류가 발생했어요')
    }
  }




  // ------------------------------------------
  // ⏳ 로딩 중 화면
  // ------------------------------------------
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🍜</div>
          <p className="text-gray-500">로딩중...</p>
        </div>
      </div>
    )
  }




  // ============================================
  // 🎨 UI 렌더링
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 pb-20">


      {/* ------------------------------------------
          📌 상단 헤더
      ------------------------------------------ */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4">
        <button 
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 mb-4 hover:opacity-80"
        >
          <ArrowLeft size={20} />
          <span>뒤로</span>
        </button>
        

        {/* 프로필 정보 */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <User size={40} />
          </div>
          <div>
            <h1 className="text-xl font-bold">
              {username}
            </h1>
            <p className="text-sm opacity-90">{user?.email}</p>
            <p className="text-sm font-bold mt-1">💰 {points.toLocaleString()}P</p>
          </div>
        </div>


        {/* 통계 정보 */}
        <div className="grid grid-cols-4 gap-2 bg-white/10 rounded-xl p-4">
          <div className="text-center">
            <p className="text-xl font-bold">{stats.sellingCount}</p>
            <p className="text-xs opacity-90">판매중</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{stats.soldCount}</p>
            <p className="text-xs opacity-90">판매완료</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{stats.purchasedCount}</p>
            <p className="text-xs opacity-90">구매</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">{stats.biddingCount}</p>
            <p className="text-xs opacity-90">입찰중</p>
          </div>
        </div>

        {/* 수익 정보 */}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="bg-green-500/20 rounded-lg p-3 text-center">
            <p className="text-xs opacity-90 mb-1">총 판매 수익</p>
            <p className="text-lg font-bold">+{stats.totalSales.toLocaleString()}P</p>
          </div>
          <div className="bg-red-500/20 rounded-lg p-3 text-center">
            <p className="text-xs opacity-90 mb-1">총 구매 금액</p>
            <p className="text-lg font-bold">{stats.totalSpent.toLocaleString()}P</p>
          </div>
        </div>
      </div>




      {/* ------------------------------------------
          📋 탭 메뉴
      ------------------------------------------ */}
      <div className="p-4 max-w-7xl mx-auto">
        
        {/* 탭 버튼 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <button
            onClick={() => setActiveTab('selling')}
            className={`py-2 rounded-lg font-semibold transition-colors text-sm ${
              activeTab === 'selling'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            판매중 ({stats.sellingCount})
          </button>
          <button
            onClick={() => setActiveTab('sold')}
            className={`py-2 rounded-lg font-semibold transition-colors text-sm ${
              activeTab === 'sold'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            판매완료 ({stats.soldCount})
          </button>
          <button
            onClick={() => setActiveTab('purchased')}
            className={`py-2 rounded-lg font-semibold transition-colors text-sm ${
              activeTab === 'purchased'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            구매 ({stats.purchasedCount})
          </button>
          <button
            onClick={() => setActiveTab('bidding')}
            className={`py-2 rounded-lg font-semibold transition-colors text-sm ${
              activeTab === 'bidding'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            입찰중 ({stats.biddingCount})
          </button>
        </div>




        {/* ------------------------------------------
            📸 판매중 탭
        ------------------------------------------ */}
        {activeTab === 'selling' && (
          <PhotoGrid 
            photos={myPhotos.filter(p => p.status === 'active')}
            emptyMessage="판매 중인 사진이 없어요"
            emptyIcon={<Image size={48} className="text-gray-300 mx-auto mb-3" />}
            showActions={true}
            cardType="selling"
            onDelete={handleDeletePhoto}
          />
        )}




        {/* ------------------------------------------
            ✅ 판매완료 탭
        ------------------------------------------ */}
        {activeTab === 'sold' && (
          <PhotoGrid 
            photos={myPhotos.filter(p => p.status === 'sold')}
            emptyMessage="판매 완료된 사진이 없어요"
            emptyIcon={<TrendingUp size={48} className="text-gray-300 mx-auto mb-3" />}
            cardType="sold"
          />
        )}




        {/* ------------------------------------------
            🛒 구매한 사진 탭
        ------------------------------------------ */}
        {activeTab === 'purchased' && (
          <div>
            {purchasedPhotos.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">구매한 사진이 없어요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {purchasedPhotos.map(purchase => (
                  <div 
                    key={purchase.id}
                    className="bg-white rounded-xl overflow-hidden shadow-md border-2 border-blue-500"
                  >
                    <div className="flex relative">
                      {/* 구매 배지 */}
                      <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full z-10 font-semibold shadow-lg">
                        구매완료
                      </div>

                      {/* 사진 썸네일 */}
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                        {purchase.photos?.preview_url ? (
                          <img 
                            src={purchase.photos.preview_url} 
                            alt={purchase.photos.title} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Image size={32} className="text-blue-300" />
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 p-3">
                        <h3 className="font-bold text-sm mb-1">{purchase.photos?.title || '제목 없음'}</h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {new Date(purchase.purchased_at).toLocaleDateString('ko-KR')}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            {purchase.purchase_type === 'buy_now' ? '즉시구매' : '경매낙찰'}
                          </span>
                          <span className="font-bold text-blue-500">
                            {purchase.price.toLocaleString()}P
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}




        {/* ------------------------------------------
            🔨 입찰중 탭
        ------------------------------------------ */}
        {activeTab === 'bidding' && (
          <div>
            {biddingPhotos.length === 0 ? (
              <div className="text-center py-20">
                <Gavel size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">입찰 중인 사진이 없어요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {biddingPhotos.map(bid => (
                  <div 
                    key={bid.id}
                    className="bg-white rounded-xl overflow-hidden shadow-md border-2 border-purple-500"
                  >
                    <div className="flex relative">
                      {/* 입찰 배지 */}
                      <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs px-2 py-1 rounded-full z-10 font-semibold shadow-lg">
                        입찰중
                      </div>

                      {/* 사진 썸네일 */}
                      <div className="w-24 h-24 bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center flex-shrink-0">
                        {bid.photos?.preview_url ? (
                          <img 
                            src={bid.photos.preview_url} 
                            alt={bid.photos.title} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Image size={32} className="text-purple-300" />
                        )}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 p-3">
                        <h3 className="font-bold text-sm mb-1">{bid.photos?.title || '제목 없음'}</h3>
                        <p className="text-xs text-gray-500 mb-2">
                          입찰가: {bid.amount.toLocaleString()}P
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">
                            현재가: {bid.photos?.current_price?.toLocaleString()}P
                          </span>
                          <span className={`text-xs font-semibold ${
                            bid.amount >= bid.photos?.current_price 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {bid.amount >= bid.photos?.current_price ? '🏆 최고가' : '⚠️ 경쟁중'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


      </div>


    </div>
  )
}




// ============================================
// 📸 사진 그리드 컴포넌트
// ============================================
function PhotoGrid({ 
  photos, 
  emptyMessage, 
  emptyIcon,
  showActions = false,
  cardType = 'default', // 'selling', 'sold', 'default'
  onDelete 
}) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-20">
        {emptyIcon}
        <p className="text-gray-500">{emptyMessage}</p>
        {showActions && (
          <button
            onClick={() => window.location.href = '/upload'}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold"
          >
            첫 사진 등록하기
          </button>
        )}
      </div>
    )
  }

  // 카드 타입별 스타일
  const getCardStyle = (type) => {
    switch(type) {
      case 'selling':
        return 'border-2 border-orange-500' // 판매중: 주황색 테두리
      case 'sold':
        return 'border-2 border-green-500'  // 판매완료: 초록색 테두리
      default:
        return ''
    }
  }

  const getBadge = (type) => {
    switch(type) {
      case 'selling':
        return { text: '판매중', bg: 'bg-orange-500' }
      case 'sold':
        return { text: '판매완료', bg: 'bg-green-500' }
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {photos.map(photo => {
        const badge = getBadge(cardType)
        
        return (
          <div 
            key={photo.id}
            className={`bg-white rounded-xl overflow-hidden shadow-md relative ${getCardStyle(cardType)}`}
          >
            {/* 상태 배지 */}
            {badge && (
              <div className={`absolute top-2 right-2 ${badge.bg} text-white text-xs px-2 py-1 rounded-full z-10 font-semibold shadow-lg`}>
                {badge.text}
              </div>
            )}

            {/* 사진 */}
            <div className="aspect-square bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
              {photo.preview_url ? (
                <img 
                  src={photo.preview_url} 
                  alt={photo.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Image size={32} className="text-orange-300" />
              )}
            </div>

            {/* 정보 */}
            <div className="p-3">
              <h3 className="font-bold text-sm truncate mb-2">{photo.title}</h3>
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-gray-600">
                  {photo.status === 'active' ? '경매중' : '종료'}
                </span>
                <span className="font-bold text-orange-500">
                  {photo.current_price?.toLocaleString()}원
                </span>
              </div>

              {/* 액션 버튼 */}
              {showActions && (
                <button
                  onClick={() => onDelete(photo.id)}
                  className="w-full bg-red-50 text-red-600 py-2 rounded-lg text-xs font-semibold hover:bg-red-100"
                >
                  삭제
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}