// ============================================
// 📦 라이브러리 및 컴포넌트 import
// ============================================
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Search, Camera, Home, User } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { addWatermark } from '../utils/watermark'
import { useToast } from '../hooks/useToast'
import Toast from '../components/Toast'
import ImageViewer from '../components/ImageViewer'
import Loading from '../components/Loading'




// ============================================
// 🎯 메인 컴포넌트
// ============================================
export default function PhotoMarketplace() {

  // ------------------------------------------
  // 🔐 로그인 상태
  // ------------------------------------------
  const { user, loading: authLoading } = useAuth()
  const { toasts, success, error, info, removeToast } = useToast()


  // ------------------------------------------
  // 📊 State 관리
  // ------------------------------------------
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [watermarkedImages, setWatermarkedImages] = useState({})
  const [viewerImage, setViewerImage] = useState(null)
  const [purchasing, setPurchasing] = useState(false)




  // ------------------------------------------
  // 🔄 데이터 로드 (컴포넌트 마운트 시)
  // ------------------------------------------
  useEffect(() => {
    fetchPhotos()
  }, [])




  // ------------------------------------------
  // 📸 사진 목록 불러오기
  // ------------------------------------------
  async function fetchPhotos() {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPhotos(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }




  // ------------------------------------------
  // 🔍 검색 & 카테고리 필터링
  // ------------------------------------------
  const filteredPhotos = photos.filter(photo => {
    const matchesSearch = photo.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === '전체' || photo.category === selectedCategory
    return matchesSearch && matchesCategory
  })




  // ------------------------------------------
  // 💰 즉시구매 처리
  // ------------------------------------------
  async function handleBuyNow(photo) {
     if (purchasing) return  // 중복 클릭 방지
    // 로그인 체크
    if (!user) {
      error('로그인이 필요해요!')
      setTimeout(() => window.location.href = '/auth', 1500)
      return
    }

    // 자기 사진 구매 방지
    if (photo.user_id === user.id) {
      error('내가 올린 사진은 구매할 수 없어요!')
      return
    }

    const buyPrice = photo.buy_now_price || photo.current_price

    // 구매 확인 및 약관 동의
    const agreed = confirm(`
🛒 구매 확인

가격: ${buyPrice.toLocaleString()}P

📋 구매자 약관에 동의하시겠습니까?

✅ 허용되는 사용:
  • 2차 창작물 제작
  • 블로그/SNS 게시  
  • 광고 및 상업적 사용
  • 인쇄물 제작

❌ 금지:
  • 재판매 (법적 책임)

구매하시겠어요?
    `)

    if (!agreed) {
      return
    }

    try {
      // 1. 내 포인트 확인
      setPurchasing(true)
      const { data: myPoints } = await supabase
        .from('user_points')
        .select('balance')
        .eq('user_id', user.id)
        .single()

      if (!myPoints || myPoints.balance < buyPrice) {
        error('포인트가 부족해요!')
        return
      }

      // 2. 내 포인트 차감
      const { error: deductError } = await supabase
        .from('user_points')
        .update({ balance: myPoints.balance - buyPrice })
        .eq('user_id', user.id)

      if (deductError) throw deductError

      // 3. 판매자 포인트 지급
      const { data: sellerPoints } = await supabase
        .from('user_points')
        .select('balance')
        .eq('user_id', photo.user_id)
        .single()

      if (sellerPoints) {
        await supabase
          .from('user_points')
          .update({ balance: sellerPoints.balance + buyPrice })
          .eq('user_id', photo.user_id)
      }

      // 4. 거래 내역 기록 - 구매자
      await supabase.from('transactions').insert({
        user_id: user.id,
        photo_id: photo.id,
        type: 'purchase',
        amount: -buyPrice,
        balance_after: myPoints.balance - buyPrice,
        description: `"${photo.title}" 구매`
      })

      // 5. 거래 내역 기록 - 판매자
      await supabase.from('transactions').insert({
        user_id: photo.user_id,
        photo_id: photo.id,
        type: 'sale',
        amount: buyPrice,
        balance_after: (sellerPoints?.balance || 0) + buyPrice,
        description: `"${photo.title}" 판매`
      })

      // 6. 사진 상태 변경
      await supabase
        .from('photos')
        .update({ 
          status: 'sold',
          buyer_id: user.id
        })
        .eq('id', photo.id)

      success('🎉 구매 완료!')
      setTimeout(() => window.location.href = '/', 1500)

    } catch (err) {
      console.error('구매 실패:', err)
      error('구매 중 오류가 발생했어요')
    } finally {
      setPurchasing(false)  // 추가!
    }
  }




  // ------------------------------------------
  // 🎨 워터마크 이미지 가져오기 (캐싱)
  // ------------------------------------------
  async function getWatermarkedImage(photo) {
    if (watermarkedImages[photo.id]) {
      return watermarkedImages[photo.id]
    }

    try {
      const watermarkedUrl = await addWatermark(photo.preview_url)
      setWatermarkedImages(prev => ({
        ...prev,
        [photo.id]: watermarkedUrl
      }))
      return watermarkedUrl
    } catch (err) {
      console.error('워터마크 생성 실패:', err)
      return photo.preview_url
    }
  }




  // ------------------------------------------
  // 📸 워터마크 적용된 썸네일 컴포넌트
  // ------------------------------------------
  function PhotoThumbnail({ photo, onClick }) {
    const [imageSrc, setImageSrc] = useState(null)

    useEffect(() => {
      if (photo.preview_url) {
        getWatermarkedImage(photo).then(setImageSrc)
      }
    }, [photo.id])

    return (
      <div 
        className="aspect-square bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center"
        onClick={onClick}
      >
        {imageSrc ? (
          <img 
            src={imageSrc} 
            alt={photo.title} 
            className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
          />
        ) : photo.preview_url ? (
          <Loading />
        ) : (
          <Camera size={48} className="text-orange-300" />
        )}
      </div>
    )
  }




  // ============================================
  // 🎨 상세페이지 렌더링
  // ============================================
  if (selectedPhoto) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">

        {/* 토스트 알림 */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}

        {/* 이미지 뷰어 */}
        {viewerImage && (
          <ImageViewer
            imageUrl={viewerImage.url}
            title={viewerImage.title}
            onClose={() => setViewerImage(null)}
          />
        )}


        {/* ------------------------------------------
            📌 상세페이지 헤더
        ------------------------------------------ */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4">
          <div className="flex items-center justify-between mb-2">
            
            {/* 뒤로가기 버튼 */}
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="flex items-center gap-1 text-white hover:bg-white/20 px-3 py-1 rounded-full transition-colors"
            >
              ← 뒤로
            </button>

            {/* 홈 버튼 */}
            <button 
              onClick={() => {
                setSelectedPhoto(null)
                setSearchQuery('')
                setSelectedCategory('전체')
              }}
              className="flex items-center gap-1 text-white hover:bg-white/20 px-3 py-1 rounded-full transition-colors"
            >
              🏠 홈
            </button>

          </div>
          <h1 className="text-xl font-bold">{selectedPhoto.title}</h1>
        </div>




        {/* ------------------------------------------
            📷 상세 정보
        ------------------------------------------ */}
        <div className="p-4 max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-4">
            
            {/* 사진 - 워터마크 적용 (클릭해서 크게 보기) */}
            <PhotoThumbnail 
              photo={selectedPhoto}
              onClick={(e) => {
                e.stopPropagation()
                setViewerImage({
                  url: selectedPhoto.preview_url,
                  title: selectedPhoto.title
                })
              }}
            />
            

            {/* 정보 섹션 */}
            <div className="p-6">
              
              {/* 가격 정보 */}
              <div className="flex justify-between items-center mb-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-600">현재가</p>
                  <p className="text-2xl font-bold text-orange-500">
                    {selectedPhoto.current_price?.toLocaleString()}원
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">입찰</p>
                  <p className="text-lg font-semibold">{selectedPhoto.bid_count || 0}회</p>
                </div>
              </div>


              {/* 상세 정보 */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">카테고리</span>
                  <span className="font-medium">{selectedPhoto.category || '기타'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">해상도</span>
                  <span className="font-medium">{selectedPhoto.resolution || '미정'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">판매자</span>
                  <span className="font-medium">{selectedPhoto.seller || '익명'}</span>
                </div>
              </div>


              {/* 설명 */}
              {selectedPhoto.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-600 mb-2">설명</p>
                  <p className="text-sm">{selectedPhoto.description}</p>
                </div>
              )}


              {/* 구매 버튼 */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => {
                    if (!user) {
                      error('로그인이 필요해요!')
                      setTimeout(() => window.location.href = '/auth', 1500)
                    } else {
                      info('입찰 기능은 곧 추가됩니다!')
                    }
                  }}
                  className="bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors"
                >
                  입찰하기
                </button>
                <button 
                  onClick={() => handleBuyNow(selectedPhoto)}
                  disabled={purchasing}
                  className="bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {purchasing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      처리중...
                    </span>
                  ) : (
                    `즉시구매 ${selectedPhoto.buy_now_price?.toLocaleString()}P`
                  )}
                </button>
              </div>


            </div>
          </div>
        </div>


      </div>
    )
  }




  // ============================================
  // 🏠 홈 화면 렌더링
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      {/* 토스트 알림 */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* 이미지 뷰어 */}
      {viewerImage && (
        <ImageViewer
          imageUrl={viewerImage.url}
          title={viewerImage.title}
          onClose={() => setViewerImage(null)}
        />
      )}


      {/* ------------------------------------------
          🎨 헤더
      ------------------------------------------ */}
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* 로그인/로그아웃 버튼 */}
          <div className="flex justify-end mb-4">
            {user ? (
              <button 
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.reload()
                }}
                className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30"
              >
                로그아웃
              </button>
            ) : (
              <button 
                onClick={() => window.location.href = '/auth'}
                className="text-sm bg-white/20 px-3 py-1 rounded-full hover:bg-white/30"
              >
                로그인
              </button>
            )}
          </div>


          {/* 로고 */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-3xl sm:text-4xl">🍜</div>
            <h1 className="text-2xl sm:text-3xl font-bold">포마</h1>
          </div>
          <p className="text-center text-xs sm:text-sm opacity-90">내 사진이 돈이 되는 순간</p>


          {/* 검색창 */}
          <div className="relative mt-4 sm:mt-6 max-w-xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="어떤 사진을 찾으시나요?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-3 rounded-full bg-white/90 text-sm sm:text-base text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>


        </div>
      </div>




      {/* ------------------------------------------
          🏷️ 카테고리 필터
      ------------------------------------------ */}
      <div className="px-4 pt-4 max-w-7xl mx-auto">
        <div className="relative">
          
          {/* 왼쪽 화살표 (PC만) */}
          <button
            onClick={() => {
              document.getElementById('category-scroll').scrollBy({ left: -200, behavior: 'smooth' })
            }}
            className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100"
          >
            ←
          </button>


          {/* 카테고리 버튼들 */}
          <div 
            id="category-scroll"
            className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
          >
            {['전체', '음식', '풍경', '인테리어', '제품', '라이프'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap font-semibold transition-colors ${
                  selectedCategory === category
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:border-orange-500'
                }`}
              >
                {category === '전체' && '🍜 '}
                {category === '음식' && '🍔 '}
                {category === '풍경' && '🌄 '}
                {category === '인테리어' && '🏠 '}
                {category === '제품' && '📱 '}
                {category === '라이프' && '✨ '}
                {category}
              </button>
            ))}
          </div>


          {/* 오른쪽 화살표 (PC만) */}
          <button
            onClick={() => {
              document.getElementById('category-scroll').scrollBy({ left: 200, behavior: 'smooth' })
            }}
            className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-100"
          >
            →
          </button>


        </div>
      </div>




      {/* ------------------------------------------
          📸 사진 그리드
      ------------------------------------------ */}
      <div className="p-3 sm:p-4 max-w-7xl mx-auto">
        
        {/* 로딩 중 */}
        {loading ? (
          <Loading fullScreen message="사진을 불러오는 중..." />


        /* 결과 없음 */
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-gray-500 text-sm sm:text-base">
              {searchQuery ? '검색 결과가 없어요' : '아직 등록된 사진이 없어요'}
            </p>
          </div>


        /* 사진 목록 */
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {filteredPhotos.map(photo => (
                 <div 
                key={photo.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-lg active:scale-95 transition-all"
                onClick={() => setSelectedPhoto(photo)}
              >
                
                {/* 사진 썸네일 - 더블클릭으로 확대 */}
                <div onDoubleClick={(e) => {
                  e.stopPropagation()
                  setViewerImage({
                    url: photo.preview_url,
                    title: photo.title
                  })
                }}>
                  <PhotoThumbnail photo={photo} />
                </div>

                
                {/* 정보 */}
                <div className="p-2 sm:p-3" onClick={() => setSelectedPhoto(photo)}>
                  <h3 className="font-bold text-xs sm:text-sm mb-1 sm:mb-2 truncate">{photo.title}</h3>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600">현재가</span>
                    <span className="font-bold text-orange-500">
                      {photo.current_price?.toLocaleString()}원
                    </span>
                  </div>
                </div>


              </div>
            ))}
          </div>
        )}


      </div>




      {/* ------------------------------------------
          🔽 하단 네비게이션
      ------------------------------------------ */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2 sm:py-3 shadow-lg">
        
        {/* 홈 버튼 */}
        <button 
          onClick={() => {
            setSearchQuery('')
            setSelectedCategory('전체')
            window.scrollTo(0, 0)
          }}
          className="flex flex-col items-center gap-1 text-orange-500"
        >
          <Home size={20} className="sm:w-6 sm:h-6" />
          <span className="text-xs font-semibold">홈</span>
        </button>
        

        {/* 판매 버튼 */}
        <button 
          onClick={() => {
            if (!user) {
              error('로그인이 필요해요!')
              setTimeout(() => window.location.href = '/auth', 1500)
            } else {
              window.location.href = '/upload'
            }
          }}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <div className="bg-orange-500 text-white rounded-full p-2 sm:p-3 -mt-4 sm:-mt-6 shadow-lg">
            <Camera size={20} className="sm:w-6 sm:h-6" />
          </div>
          <span className="text-xs font-semibold">판매</span>
        </button>
        

        {/* 내정보 버튼 */}
        <button 
          onClick={() => {
            if (!user) {
              window.location.href = '/auth'
            } else {
              window.location.href = '/profile'
            }
          }}
          className="flex flex-col items-center gap-1 text-gray-400"
        >
          <User size={20} className="sm:w-6 sm:h-6" />
          <span className="text-xs font-semibold">내정보</span>
        </button>


      </div>


    </div>
  )
}