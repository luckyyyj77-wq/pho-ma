// src/pages/Detail.jsx - 사진 상세 + 입찰 시스템
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { ArrowLeft, Heart, Gavel, Zap, TrendingUp, User as UserIcon, Clock, Eye, X, RefreshCw, Trash2 } from 'lucide-react'
import Timer from '../components/Timer'
import { useLikes } from '../hooks/useLikes'
import NotificationBell from '../components/NotificationBell'
import RelistModal from '../components/RelistModal'

export default function Detail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [userPoints, setUserPoints] = useState(0)
  const [bidAmount, setBidAmount] = useState('')
  const [bids, setBids] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [buyingNow, setBuyingNow] = useState(false)
  const [cancelling, setCancelling] = useState(null)
  const [auctionStatus, setAuctionStatus] = useState(null)
  const [finalizing, setFinalizing] = useState(false)
  const [showRelistModal, setShowRelistModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // 좋아요 기능
  const { isLiked, likesCount, loading: likeLoading, toggleLike } = useLikes(id, user?.id)

  useEffect(() => {
    checkUser()
    fetchPhoto()
    fetchBids()
    checkAuctionStatus()
    incrementViewCount() // 조회수 증가

    // 실시간 입찰 구독
    const subscription = supabase
      .channel(`bids:${id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: `photo_id=eq.${id}` },
        () => {
          fetchPhoto()
          fetchBids()
          checkAuctionStatus()
        }
      )
      .subscribe()

    // 10초마다 경매 상태 확인 (자동 낙찰 체크)
    const interval = setInterval(() => {
      checkAuctionStatus()
    }, 10000)

    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [id])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    // 사용자 포인트 가져오기
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', user.id)
        .single()

      setUserPoints(profile?.points || 0)
    }
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

      // 프로필 정보 가져오기
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', data.user_id)
        .single()

      const photoWithProfile = {
        ...data,
        profiles: profile || { username: '익명' }
      }

      setPhoto(photoWithProfile)

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

  // 입찰하기 (보증금 차감)
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

    // 포인트 부족 확인
    if (amount > userPoints) {
      alert(`보유 포인트가 부족합니다. (보유: ${userPoints.toLocaleString()}P)`)
      return
    }

    if (!confirm(`${amount.toLocaleString()}P를 보증금으로 차감하고 입찰하시겠습니까?\n\n입찰이 밀리거나 취소하면 환불됩니다.`)) {
      return
    }

    setSubmitting(true)

    try {
      // Supabase RPC로 보증금 차감 및 입찰
      const { data, error } = await supabase.rpc('place_bid_with_deposit', {
        p_photo_id: id,
        p_user_id: user.id,
        p_amount: amount
      })

      if (error) throw error

      if (data.success) {
        alert(data.message)
        setBidAmount((amount + 100).toString())
        checkUser() // 포인트 업데이트
        fetchPhoto()
        fetchBids()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error bidding:', error)
      alert('입찰 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  // 즉시 구매 (포인트 차감 및 기존 입찰자 환불)
  const handleBuyNow = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      navigate('/auth')
      return
    }

    // 포인트 부족 확인
    if (photo.buy_now_price > userPoints) {
      alert(`보유 포인트가 부족합니다. (보유: ${userPoints.toLocaleString()}P)`)
      return
    }

    if (!confirm(`즉시 구매하시겠습니까?\n${photo.buy_now_price.toLocaleString()}P가 차감됩니다.`)) {
      return
    }

    setBuyingNow(true)

    try {
      // Supabase RPC로 즉시 구매 처리
      const { data, error } = await supabase.rpc('buy_now_with_deposit', {
        p_photo_id: id,
        p_user_id: user.id
      })

      if (error) throw error

      if (data.success) {
        alert(data.message)
        checkUser() // 포인트 업데이트
        fetchPhoto()
        fetchBids()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error buying:', error)
      alert('구매 중 오류가 발생했습니다.')
    } finally {
      setBuyingNow(false)
    }
  }

  // 경매 상태 확인
  const checkAuctionStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('check_auction_status', {
        p_photo_id: id
      })

      if (error) throw error

      if (data && data.success) {
        setAuctionStatus(data)

        // 7일 경과 시 자동 낙찰
        if (data.should_auto_finalize && photo?.status === 'active') {
          await handleAutoFinalize()
        }
      }
    } catch (error) {
      console.error('Error checking auction status:', error)
    }
  }

  // 판매자 수동 낙찰
  const handleSellerFinalize = async () => {
    if (!confirm('최고가 입찰자에게 낙찰하시겠습니까?')) {
      return
    }

    setFinalizing(true)

    try {
      const { data, error } = await supabase.rpc('seller_finalize_auction', {
        p_photo_id: id,
        p_seller_id: user.id
      })

      if (error) throw error

      if (data.success) {
        alert(data.message)
        checkUser() // 포인트 업데이트
        fetchPhoto()
        fetchBids()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error finalizing auction:', error)
      alert('낙찰 처리 중 오류가 발생했습니다.')
    } finally {
      setFinalizing(false)
    }
  }

  // 자동 낙찰 (7일 경과)
  const handleAutoFinalize = async () => {
    try {
      const { data, error } = await supabase.rpc('auto_finalize_auction', {
        p_photo_id: id
      })

      if (error) throw error

      if (data.success) {
        console.log(data.message)
        checkUser() // 포인트 업데이트
        fetchPhoto()
        fetchBids()
      }
    } catch (error) {
      console.error('Error auto finalizing auction:', error)
    }
  }

  // 입찰 취소 (보증금 환불)
  const handleCancelBid = async (bidId, amount) => {
    if (!confirm(`입찰을 취소하시겠습니까?\n${amount.toLocaleString()}P가 환불됩니다.`)) {
      return
    }

    setCancelling(bidId)

    try {
      const { data, error } = await supabase.rpc('cancel_bid', {
        p_bid_id: bidId,
        p_user_id: user.id
      })

      if (error) throw error

      if (data.success) {
        alert(data.message)
        checkUser() // 포인트 업데이트
        fetchPhoto()
        fetchBids()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('Error cancelling bid:', error)
      alert('입찰 취소 중 오류가 발생했습니다.')
    } finally {
      setCancelling(null)
    }
  }

  // 경매 종료 처리
  const handleExpire = async () => {
    try {
      await supabase.rpc('finalize_auction', { p_photo_id: id })
      checkUser() // 포인트 업데이트 (환불받은 경우)
      fetchPhoto()
      fetchBids()
    } catch (error) {
      console.error('Error finalizing auction:', error)
    }
  }

  // 재등록
  const handleRelist = async ({ startPrice, buyNowPrice, duration }) => {
    try {
      const { data, error } = await supabase.rpc('relist_auction', {
        p_photo_id: id,
        p_user_id: user.id,
        p_new_start_price: startPrice,
        p_new_buy_now_price: buyNowPrice,
        p_duration_days: duration
      })

      if (error) throw error

      if (data.success) {
        alert(data.message)
        setShowRelistModal(false)
        fetchPhoto()
        fetchBids()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('재등록 오류:', error)
      alert('재등록 중 오류가 발생했습니다.')
    }
  }

  // 삭제
  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    setDeleting(true)

    try {
      const { data, error } = await supabase.rpc('delete_expired_photo', {
        p_photo_id: id,
        p_user_id: user.id
      })

      if (error) throw error

      if (data.success) {
        alert(data.message)
        navigate('/my-activity?tab=selling')
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error('삭제 오류:', error)
      alert('삭제 중 오류가 발생했습니다.')
    } finally {
      setDeleting(false)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} className="text-white" />
              </button>
              <h1 className="text-lg font-black text-white">경매 상세</h1>
            </div>

            {/* 알림 벨 */}
            <NotificationBell />
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

            {/* 상태 배지 - 우측 하단으로 이동 */}
            {photo.status === 'sold' && (
              <div className="absolute bottom-4 right-4 px-4 py-2 bg-red-600 text-white font-bold rounded-full shadow-xl">
                판매 완료
              </div>
            )}
            {photo.status === 'expired' && (
              <div className="absolute bottom-4 right-4 px-4 py-2 bg-orange-600 text-white font-bold rounded-full shadow-xl">
                {photo.bids === 0 ? '유찰' : '경매 종료'}
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="p-6">
            {/* 제목 & 카테고리 */}
            <div className="mb-4">
              <h2 className="text-2xl font-black text-gray-900 mb-2">{photo.title}</h2>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-[#E8F5E9] text-[#558B2F] text-sm font-semibold rounded-full">
                  {photo.category}
                </span>
                <span className="text-sm text-gray-500">{photo.resolution}</span>
              </div>

              {/* 작성자, 좋아요, 조회수 가로 정렬 */}
              <div className="flex items-center gap-2">
                {/* 작성자 아이디 (클릭 가능) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/user/${photo.user_id}`)
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center gap-2 transition-colors cursor-pointer relative z-10"
                >
                  <UserIcon size={16} className="text-green-500" />
                  <span className="text-gray-800 text-sm font-semibold">{photo.profiles?.username || '익명'}</span>
                </button>

                {/* 좋아요 버튼 (클릭 가능) */}
                <button
                  onClick={handleLikeClick}
                  disabled={likeLoading}
                  className={`px-3 py-2 rounded-full transition-all flex items-center gap-2 ${
                    isLiked
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                  }`}
                >
                  <Heart
                    size={16}
                    className={isLiked ? 'text-white fill-white' : 'text-red-500 fill-red-500'}
                  />
                  <span className="text-sm font-semibold">{likesCount || 0}</span>
                </button>

                {/* 조회수 */}
                <div className="px-3 py-2 bg-gray-100 rounded-full flex items-center gap-2">
                  <Eye size={16} className="text-blue-500" />
                  <span className="text-gray-800 text-sm font-semibold">{photo.views_count || 0}</span>
                </div>
              </div>
            </div>

            {/* 경매 상태 타이머 */}
            {!isExpired && auctionStatus && (
              <div className="mb-4 p-4 bg-gradient-to-r from-[#FFF9C4] to-[#FFF59D] rounded-xl">
                <div className="text-center">
                  <p className="text-sm text-gray-700 mb-1">경매 진행 시간</p>
                  <p className="text-2xl font-black text-[#F57C00]">
                    {auctionStatus.days_elapsed}일 경과
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    ({auctionStatus.hours_elapsed}시간)
                  </p>
                  {auctionStatus.should_auto_finalize ? (
                    <p className="text-xs text-red-600 font-semibold mt-2">
                      ⚠️ 7일 경과! 자동 낙찰 처리 중...
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 mt-2">
                      7일 후 자동 낙찰 (남은 시간: {(7 - auctionStatus.days_elapsed).toFixed(1)}일)
                    </p>
                  )}
                </div>
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

            {/* 판매자용 수동 낙찰 버튼 (24시간 후부터) */}
            {!isExpired && user && photo.user_id === user.id && auctionStatus?.can_finalize && bids.length > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-[#FF6F00] to-[#FF8F00] rounded-xl">
                <p className="text-white text-sm text-center mb-3">
                  🎯 판매자님, 24시간이 지났습니다!
                  <br />
                  최고가 입찰자에게 낙찰하실 수 있습니다.
                </p>
                <button
                  onClick={handleSellerFinalize}
                  disabled={finalizing}
                  className="w-full px-6 py-3 bg-white text-[#FF6F00] rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {finalizing ? '낙찰 처리 중...' : '낙찰하기'}
                </button>
              </div>
            )}

            {/* 유찰 상태 - 판매자 전용 메뉴 */}
            {photo.status === 'expired' && photo.bids === 0 && user && photo.user_id === user.id && (
              <div className="mb-6 space-y-4">
                {/* 유찰 안내 */}
                <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl">
                  <div className="text-center mb-3">
                    <p className="text-2xl mb-2">😔</p>
                    <p className="font-bold text-orange-800 mb-1">경매가 유찰되었습니다</p>
                    <p className="text-sm text-orange-700">
                      입찰이 없어 경매가 종료되었습니다
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-3 mb-3">
                    <p className="text-xs text-gray-600 mb-2">💡 유찰 이유:</p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>• 가격이 너무 높을 수 있습니다</li>
                      <li>• 사진 설명이 부족할 수 있습니다</li>
                      <li>• 카테고리가 적절하지 않을 수 있습니다</li>
                    </ul>
                  </div>

                  <p className="text-xs text-center text-orange-600 font-semibold">
                    가격을 조정하여 재등록하거나 삭제할 수 있습니다
                  </p>
                </div>

                {/* 재등록 / 삭제 버튼 */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowRelistModal(true)}
                    className="px-6 py-4 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={20} />
                    재등록
                  </button>

                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={20} />
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            )}

            {/* 입찰 UI - 모바일 최적화 */}
            {!isExpired && user && photo.user_id !== user.id && (
              <div className="space-y-3">
                {/* 보유 포인트 표시 */}
                <div className="p-3 bg-gradient-to-r from-[#FFF9C4] to-[#FFF59D] rounded-xl">
                  <p className="text-sm text-gray-700 text-center">
                    보유 포인트: <span className="font-black text-[#F57C00]">{userPoints.toLocaleString()}P</span>
                  </p>
                </div>

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
              bids.map((bid, index) => {
                const isMyBid = user && bid.user_id === user.id
                const canCancel = isMyBid && bid.status === 'active' && !isExpired
                const isHighestBid = index === 0

                return (
                  <div key={bid.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          isHighestBid ? 'bg-gradient-to-br from-[#FFD700] to-[#FFA000]' :
                          isMyBid ? 'bg-gradient-to-br from-[#4CAF50] to-[#66BB6A]' :
                          'bg-gradient-to-br from-[#B3D966] to-[#9DC183]'
                        }`}>
                          {isHighestBid ? '🏆' : bid.profiles?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {bid.profiles?.username || '익명'}
                            {isHighestBid && ' (최고가)'}
                            {isMyBid && ' (나)'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(bid.created_at).toLocaleString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <div>
                          <p className={`text-xl font-black ${
                            isHighestBid ? 'text-[#FF6F00]' : 'text-[#558B2F]'
                          }`}>
                            {bid.amount.toLocaleString()}P
                          </p>
                          {bid.status === 'won' && (
                            <span className="text-xs text-red-600 font-semibold">낙찰</span>
                          )}
                          {bid.status === 'outbid' && (
                            <span className="text-xs text-gray-500">경쟁에서 밀림</span>
                          )}
                          {bid.status === 'cancelled' && (
                            <span className="text-xs text-orange-500 font-semibold">취소됨</span>
                          )}
                        </div>

                        {/* 입찰 취소 버튼 (본인의 active 입찰만, 최고가는 취소 불가) */}
                        {canCancel && !isHighestBid && (
                          <button
                            onClick={() => handleCancelBid(bid.id, bid.amount)}
                            disabled={cancelling === bid.id}
                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                            title="입찰 취소"
                          >
                            <X size={16} />
                          </button>
                        )}

                        {/* 최고가는 취소 불가 안내 */}
                        {canCancel && isHighestBid && (
                          <div className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">
                            최고가는 취소 불가
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* 재등록 모달 */}
      {showRelistModal && photo && (
        <RelistModal
          photo={photo}
          onClose={() => setShowRelistModal(false)}
          onRelist={handleRelist}
        />
      )}
    </div>
  )
}