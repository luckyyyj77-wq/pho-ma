// src/pages/MyPurchases.jsx - 구매한 사진 관리
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { 
  ArrowLeft, 
  Download, 
  Image as ImageIcon,
  Calendar,
  DollarSign,
  CheckCircle,
  ExternalLink,
  Loader
} from 'lucide-react'

export default function MyPurchases() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState({})

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/auth')
      return
    }
    setUser(user)
    fetchPurchases(user.id)
  }

  const fetchPurchases = async (userId) => {
    setLoading(true)
    try {
      // 낙찰받은 사진 조회
      const { data: bidsData, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'won')
        .order('created_at', { ascending: false })

      if (bidsError) throw bidsError

      // 각 입찰의 사진 정보 가져오기
      const purchasesWithPhotos = await Promise.all(
        (bidsData || []).map(async (bid) => {
          const { data: photo } = await supabase
            .from('photos')
            .select('*')
            .eq('id', bid.photo_id)
            .single()

          return {
            ...bid,
            photo: photo || {}
          }
        })
      )

      setPurchases(purchasesWithPhotos)
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  // 다운로드 함수
  const handleDownload = async (purchase) => {
    const { photo, id } = purchase
    
    // 원본 URL이 있으면 사용, 없으면 preview_url 사용
    const downloadUrl = photo.original_url || photo.preview_url

    if (!downloadUrl) {
      alert('다운로드할 이미지가 없습니다.')
      return
    }

    setDownloading({ ...downloading, [id]: true })

    try {
      // 이미지 다운로드
      const response = await fetch(downloadUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // 다운로드 링크 생성
      const link = document.createElement('a')
      link.href = url
      link.download = `${photo.title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${photo.resolution || 'original'}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // 다운로드 기록
      await supabase
        .from('bids')
        .update({ downloaded: true })
        .eq('id', id)

      // 목록 새로고침
      fetchPurchases(user.id)
      
      alert('다운로드 완료! 📥')
    } catch (error) {
      console.error('Download error:', error)
      alert('다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading({ ...downloading, [id]: false })
    }
  }

  // 새 탭에서 이미지 보기
  const handleViewImage = (imageUrl) => {
    window.open(imageUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] pb-20">
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
            <h1 className="text-lg font-black text-white">구매한 사진</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 통계 카드 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon size={20} className="text-[#B3D966]" />
              <p className="text-sm text-gray-600">총 구매</p>
            </div>
            <p className="text-2xl font-black text-gray-900">{purchases.length}개</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={20} className="text-[#FF6F00]" />
              <p className="text-sm text-gray-600">총 금액</p>
            </div>
            <p className="text-2xl font-black text-gray-900">
              {purchases.reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}P
            </p>
          </div>
        </div>

        {/* 구매 목록 */}
        {purchases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ImageIcon size={64} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-2">구매한 사진이 없습니다</p>
            <p className="text-gray-400 text-sm mb-6">경매에 참여하거나 즉시 구매해보세요!</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              사진 보러가기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => (
              <div
                key={purchase.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="flex gap-4 p-4">
                  {/* 썸네일 */}
                  <div 
                    className="w-32 h-32 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer"
                    onClick={() => handleViewImage(purchase.photo.preview_url)}
                  >
                    {purchase.photo.preview_url ? (
                      <img
                        src={purchase.photo.preview_url}
                        alt={purchase.photo.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7] flex items-center justify-center">
                        <ImageIcon size={32} className="text-white/50" />
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg text-gray-900 mb-2 line-clamp-1">
                      {purchase.photo.title || '제목 없음'}
                    </h3>
                    
                    <div className="space-y-1 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign size={14} className="text-gray-400" />
                        <span className="text-gray-600">구매가:</span>
                        <span className="font-bold text-[#558B2F]">
                          {purchase.amount?.toLocaleString()}P
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-600">구매일:</span>
                        <span className="text-gray-500">
                          {new Date(purchase.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                      {purchase.downloaded && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle size={14} className="text-green-600" />
                          <span className="text-green-600 font-semibold">다운로드 완료</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {/* 다운로드 버튼 */}
                      <button
                        onClick={() => handleDownload(purchase)}
                        disabled={downloading[purchase.id]}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {downloading[purchase.id] ? (
                          <>
                            <Loader size={16} className="animate-spin" />
                            <span>다운로드 중...</span>
                          </>
                        ) : (
                          <>
                            <Download size={16} />
                            <span>다운로드</span>
                          </>
                        )}
                      </button>

                      {/* 새 탭에서 보기 */}
                      <button
                        onClick={() => handleViewImage(purchase.photo.original_url || purchase.photo.preview_url)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
                      >
                        <ExternalLink size={16} />
                        <span>보기</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}