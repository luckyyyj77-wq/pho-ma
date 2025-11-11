// src/pages/Detail.jsx - 사진 상세 + 입찰 시스템
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ArrowLeft, Heart, Gavel, Zap, TrendingUp, User as UserIcon, Clock, Eye } from 'lucide-react'
import Timer from '../components/Timer'
import { useLikes } from '../hooks/useLikes'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [bidAmount, setBidAmount] = useState('')
  const [bids, setBids] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)

  // 좋아요 기능
  const { isLiked, likesCount, loading: likeLoading, toggleLike } = useLikes(id, user?.id)

  useEffect(() => {
    checkUser()
    fetchPhoto()
    fetchBids()
    incrementViewCount() // 조회수 증가

    // 실시간 입찰 구독
    const subscription = supabase
      .channel(`bids:${id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `photo_id=eq.${id}` },
        () => {
          fetchPhoto()
          fetchBids()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [id])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  // 조회수 증가 함수 (중복 방지)
  const incrementViewCount = async () => {
    try {
      // 세션 ID 가져오기 (없으면 생성)
      let sessionId = localStorage.getItem('view_session_id')
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('view_session_id', sessionId)
      }

      // Supabase RPC로 중복 방지 조회수 증가 함수 호출
      const { data, error } = await supabase.rpc('increment_views_once_per_day', {
        p_photo_id: id,
        p_user_id: user?.id || null,
        p_session_id: sessionId
      })

      if (error) {
        console.error('조회수 증가 실패:', error)
      } else {
        if (data) {
          console.log('👁️ 조회수 증가 (+1)')
        } else {
          console.log('👁️ 오늘 이미 조회한 사진입니다')
        }
      }
    } catch (error) {
      console.error('조회수 증가 오류:', error)
    }
  }

  const fetchPhoto = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setPhoto(data)
      
      // 최소 입찰가 설정 (현재가 + 100원)
      setBidAmount((data.current_price + 100).toString())
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBids = async () => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('photo_id', id)
        .order('amount', { ascending: false })
        .limit(10)

      if (error) throw error
      
      // profiles 정보를 별도로 가져오기
      const bidsWithProfiles = await Promise.all(
        (data || []).map(async (bid) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', bid.user_id)
            .single()

          return {
            ...bid,
            profiles: profile || { username: '익명', avatar_url: null }
          }
        })
      )

      setBids(bidsWithProfiles)
    } catch (error) {
      console.error('Error fetching bids:', error)
      setBids([])
    }
  }

  // 입찰하기
  const handleBid = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      navigate('/auth')
      return
    }

    const amount = parseInt(bidAmount)
    
    if (isNaN(amount) || amount <= 0) {
      alert('올바른 금액을 입력해주세요.')
      return
    }

    if (amount <= photo.current_price) {
      alert(`현재가(${photo.current_price.toLocaleString()}P)보다 높은 금액을 입력해주세요.`)
      return
    }

    if (amount < photo.current_price + 100) {
      alert('최소 100P 이상 높여서 입찰해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const { error } = await supabase
        .from('bids')
        .insert([
          {
            photo_id: id,
            user_id: user.id,
            amount: amount,
            status: 'active'
          }
        ])

      if (error) throw error

      alert(`입찰 성공! ${amount.toLocaleString()}P`)
      setBidAmount((amount + 100).toString())
      fetchPhoto()
      fetchBids()
    } catch (error) {
      console.error('Error bidding:', error)
      alert('입찰 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 즉시 구매
  const handleBuyNow = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      navigate('/auth')
      return
    }

    if (!confirm(`즉시 구매하시겠습니까?\n${photo.buy_now_price.toLocaleString()}P`)) {
      return
    }

    setBuyingNow(true)

    try {
      // 입찰 추가 (즉시구매가)
      const { error: bidError } = await supabase
        .from('bids')
        .insert([
          {
            photo_id: id,
            user_id: user.id,
            amount: photo.buy_now_price,
            status: 'won'
          }
        ])

      if (bidError) throw bidError

      // 사진 상태 변경
      const { error: updateError } = await supabase
        .from('photos')
        .update({ 
          status: 'sold',
          current_price: photo.buy_now_price
        })
        .eq('id', id)

      if (updateError) throw updateError

      alert('구매 완료! 🎉')
      fetchPhoto()
    } catch (error) {
      console.error('Error buying:', error)
      alert('구매 중 오류가 발생했습니다.')
    } finally {
      setBuyingNow(false)
    }
  }

  // 경매 종료 처리
  const handleExpire = async () => {
    try {
      await supabase.rpc('finalize_auction', { p_photo_id: id })
      fetchPhoto()
    } catch (error) {
      console.error('Error finalizing auction:', error)
    }
  }

  // 좋아요 클릭 핸들러
  const handleLikeClick = async () => {
    const result = await toggleLike()

    if (result.success && result.reward?.given) {
      alert(result.reward.message)
    } else if (!result.success && result.message) {
      alert(result.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">사진을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">사진을 찾을 수 없습니다</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-xl font-bold"
          >
            홈으로
          </button>
        </div>
      </div>
    )
  }

  const isExpired = photo.status === 'sold' || photo.status === 'expired'

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] pb-32">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-[#B3D966] to-[#9DC183] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-white" />
            </button>
            <h1 className="text-lg font-black text-white">경매 상세</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 사진 카드 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          {/* 이미지 */}
          <div className="relative aspect-square bg-gray-100">
            {photo.preview_url ? (
              <img
                src={photo.preview_url}
                alt={photo.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7] flex items-center justify-center">
                <span className="text-6xl">📸</span>
              </div>
            )}

            {/* 좌측: 좋아요 버튼 (클릭 가능) */}
            <button
              onClick={handleLikeClick}
              disabled={likeLoading}
              className={`absolute top-4 left-4 px-3 py-2 rounded-full shadow-xl transition-all flex items-center gap-2 ${
                isLiked
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-black/70 hover:bg-black/90'
              }`}
            >
              <Heart
                size={20}
                className={isLiked ? 'text-white fill-white' : 'text-red-500 fill-red-500'}
              />
              <span className="text-white text-sm font-bold">{likesCount || 0}</span>
            </button>

            {/* 우측: 조회수 표시 */}
            <div className="absolute top-4 right-4 px-3 py-2 bg-black/70 rounded-full flex items-center gap-2 shadow-xl">
              <Eye size={20} className="text-blue-400" />
              <span className="text-white text-sm font-bold">{photo.views_count || 0}</span>
            </div>

            {/* 상태 배지 - 우측 하단으로 이동 */}
            {photo.status === 'sold' && (
              <div className="absolute bottom-4 right-4 px-4 py-2 bg-red-600 text-white font-bold rounded-full shadow-xl">
                판매 완료
              </div>
            )}
            {photo.status === 'expired' && (
              <div className="absolute bottom-4 right-4 px-4 py-2 bg-gray-600 text-white font-bold rounded-full shadow-xl">
                경매 종료
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="p-6">
            {/* 제목 & 카테고리 */}
            <div className="mb-4">
              <h2 className="text-2xl font-black text-gray-900 mb-2">{photo.title}</h2>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-[#E8F5E9] text-[#558B2F] text-sm font-semibold rounded-full">
                  {photo.category}
                </span>
                <span className="text-sm text-gray-500">{photo.resolution}</span>
              </div>
            </div>

            {/* 타이머 */}
            {!isExpired && (
              <div className="mb-4 p-4 bg-gradient-to-r from-[#FFF9C4] to-[#FFF59D] rounded-xl">
                <Timer endTime={photo.end_time} onExpire={handleExpire} />
              </div>
            )}

            {/* 가격 정보 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-[#E8F5E9] rounded-xl">
                <p className="text-sm text-gray-600 mb-1">현재가</p>
                <p className="text-2xl font-black text-[#558B2F]">
                  {photo.current_price.toLocaleString()}P
                </p>
                <p className="text-xs text-gray-500 mt-1">입찰 {photo.bids}회</p>
              </div>
              <div className="p-4 bg-[#FFF9C4] rounded-xl">
                <p className="text-sm text-gray-600 mb-1">즉시구매가</p>
                <p className="text-2xl font-black text-[#F57C00]">
                  {photo.buy_now_price.toLocaleString()}P
                </p>
              </div>
            </div>

            {/* 입찰 UI - 모바일 최적화 */}
            {!isExpired && user && (
              <div className="space-y-3">
                {/* 입찰 금액 입력 */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">입찰 금액</label>
                  <input
                    type="number"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="입찰 금액 입력"
                    className="w-full px-4 py-4 border-2 border-[#B3D966] rounded-xl focus:outline-none focus:border-[#558B2F] text-xl font-bold text-center"
                    disabled={submitting || buyingNow}
                  />
                  <p className="text-xs text-gray-500 text-center">
                    최소 {(photo.current_price + 100).toLocaleString()}P 이상 입력
                  </p>
                </div>

                {/* 입찰 버튼 */}
                <button
                  onClick={handleBid}
                  disabled={submitting || buyingNow}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Gavel size={24} />
                  {submitting ? '입찰 중...' : '입찰하기'}
                </button>

                {/* 즉시 구매 버튼 */}
                <button
                  onClick={handleBuyNow}
                  disabled={submitting || buyingNow}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#FF6F00] to-[#FF8F00] text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                >
                  <Zap size={24} />
                  {buyingNow ? '구매 중...' : `즉시 구매 ${photo.buy_now_price.toLocaleString()}P`}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  💡 입찰 단위: 100P
                </p>
              </div>
            )}

            {/* 로그인 필요 */}
            {!isExpired && !user && (
              <div className="text-center py-6">
                <p className="text-gray-600 mb-4">로그인 후 입찰하실 수 있습니다</p>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-6 py-3 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-xl font-bold"
                >
                  로그인하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 입찰 히스토리 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-[#E8F5E9] to-[#C8E6C9] border-b">
            <h3 className="font-black text-gray-900 flex items-center gap-2">
              <TrendingUp size={20} />
              입찰 내역 ({bids.length}건)
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            {bids.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>아직 입찰 내역이 없습니다</p>
                <p className="text-sm mt-1">첫 번째로 입찰해보세요!</p>
              </div>
            ) : (
              bids.map((bid, index) => (
                <div key={bid.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA000]' : 'bg-gradient-to-br from-[#B3D966] to-[#9DC183]'
                      }`}>
                        {index === 0 ? '🏆' : bid.profiles?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {bid.profiles?.username || '익명'}
                          {index === 0 && ' (최고가)'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(bid.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-black ${
                        index === 0 ? 'text-[#FF6F00]' : 'text-[#558B2F]'
                      }`}>
                        {bid.amount.toLocaleString()}P
                      </p>
                      {bid.status === 'won' && (
                        <span className="text-xs text-red-600 font-semibold">낙찰</span>
                      )}
                      {bid.status === 'outbid' && (
                        <span className="text-xs text-gray-500">경쟁에서 밀림</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}