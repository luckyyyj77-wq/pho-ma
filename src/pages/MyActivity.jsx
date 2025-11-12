// src/pages/MyActivity.jsx - 내 활동 페이지 (판매중, 구매목록, 좋아요)
import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ArrowLeft, Store, ShoppingBag, Heart, Download } from 'lucide-react'

export default function MyActivity() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'selling')
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchPhotos()
    }
  }, [activeTab, user])

  // URL 쿼리 파라미터 동기화
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/auth')
      return
    }
    setUser(user)
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  const fetchPhotos = async () => {
    setLoading(true)
    try {
      if (activeTab === 'selling') {
        // 판매중인 사진 (active + expired 모두 포함)
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['active', 'expired'])
          .order('created_at', { ascending: false })

        if (error) throw error
        setPhotos(data || [])

      } else if (activeTab === 'purchases') {
        // 구매한 사진 (낙찰받은 사진)
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'won')
          .order('created_at', { ascending: false })

        if (bidsError) throw bidsError

        // 각 입찰의 사진 정보 가져오기
        const photosWithBids = await Promise.all(
          (bidsData || []).map(async (bid) => {
            const { data: photo } = await supabase
              .from('photos')
              .select('*')
              .eq('id', bid.photo_id)
              .single()

            return {
              ...photo,
              bid_amount: bid.amount,
              bid_created_at: bid.created_at
            }
          })
        )

        setPhotos(photosWithBids.filter(p => p.id))

      } else if (activeTab === 'likes') {
        // 좋아요한 사진
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('photo_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (likesError) throw likesError

        // 각 좋아요의 사진 정보 가져오기
        const photosWithLikes = await Promise.all(
          (likesData || []).map(async (like) => {
            const { data: photo } = await supabase
              .from('photos')
              .select('*')
              .eq('id', like.photo_id)
              .single()

            return photo
          })
        )

        setPhotos(photosWithLikes.filter(p => p?.id))
      }
    } catch (error) {
      console.error('Error fetching photos:', error)
      setPhotos([])
    } finally {
      setLoading(false)
    }
  }

  // 사진 다운로드
  const handleDownload = async (photo) => {
    try {
      const { data, error } = await supabase.storage
        .from('photos')
        .download(photo.full_url)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${photo.title}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    }
  }

  const tabs = [
    { id: 'selling', label: '판매중', icon: Store, color: 'from-[#B3D966] to-[#9DC183]' },
    { id: 'purchases', label: '구매목록', icon: ShoppingBag, color: 'from-blue-400 to-blue-500' },
    { id: 'likes', label: '좋아요', icon: Heart, color: 'from-pink-400 to-pink-500' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] pb-24">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#B3D966] to-[#9DC183] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <h1 className="text-lg font-black text-white">내 활동</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 탭 메뉴 */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 shadow-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* 로딩 */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">불러오는 중...</p>
          </div>
        )}

        {/* 사진 리스트 */}
        {!loading && photos.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'selling' && <Store size={40} className="text-gray-400" />}
              {activeTab === 'purchases' && <ShoppingBag size={40} className="text-gray-400" />}
              {activeTab === 'likes' && <Heart size={40} className="text-gray-400" />}
            </div>
            <p className="text-gray-600 mb-2">
              {activeTab === 'selling' && '판매중인 사진이 없습니다'}
              {activeTab === 'purchases' && '구매한 사진이 없습니다'}
              {activeTab === 'likes' && '좋아요한 사진이 없습니다'}
            </p>
            <p className="text-sm text-gray-500">
              {activeTab === 'selling' && '사진을 업로드해보세요!'}
              {activeTab === 'purchases' && '마음에 드는 사진에 입찰해보세요!'}
              {activeTab === 'likes' && '마음에 드는 사진에 좋아요를 눌러보세요!'}
            </p>
          </div>
        )}

        {!loading && photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                {/* 이미지 */}
                <div
                  className="relative aspect-square bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/detail/${photo.id}`)}
                >
                  {photo.preview_url ? (
                    <img
                      src={photo.preview_url}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7] flex items-center justify-center">
                      <span className="text-4xl">📸</span>
                    </div>
                  )}

                  {/* 상태 배지 */}
                  {photo.status === 'sold' && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                      판매완료
                    </div>
                  )}
                  {photo.status === 'expired' && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-orange-600 text-white text-xs font-bold rounded-full">
                      {photo.bids === 0 ? '유찰' : '종료'}
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 mb-1 truncate">{photo.title}</h3>

                  {/* 판매중 - 현재가 표시 */}
                  {activeTab === 'selling' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">현재가</span>
                      <span className="text-lg font-black text-[#558B2F]">
                        {photo.current_price?.toLocaleString() || 0}P
                      </span>
                    </div>
                  )}

                  {/* 구매목록 - 낙찰가 + 다운로드 버튼 */}
                  {activeTab === 'purchases' && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-500">낙찰가</span>
                        <span className="text-lg font-black text-blue-600">
                          {photo.bid_amount?.toLocaleString() || 0}P
                        </span>
                      </div>
                      <button
                        onClick={() => handleDownload(photo)}
                        className="w-full py-2 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg transition-all"
                      >
                        <Download size={16} />
                        다운로드
                      </button>
                    </>
                  )}

                  {/* 좋아요 - 현재가 표시 */}
                  {activeTab === 'likes' && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">현재가</span>
                      <span className="text-lg font-black text-pink-600">
                        {photo.current_price?.toLocaleString() || 0}P
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
