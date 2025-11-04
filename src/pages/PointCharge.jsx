// src/pages/PointCharge.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ArrowLeft, CreditCard, Coins } from 'lucide-react'

export default function PointCharge() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedAmount, setSelectedAmount] = useState(null)

  // 충전 금액 옵션
  const chargeOptions = [
    { amount: 1000, points: 1000, bonus: 0 },
    { amount: 5000, points: 5000, bonus: 500 },
    { amount: 10000, points: 10000, bonus: 1500 },
    { amount: 30000, points: 30000, bonus: 5000 },
    { amount: 50000, points: 50000, bonus: 10000 },
    { amount: 100000, points: 100000, bonus: 25000 },
  ]

  useEffect(() => {
    // 사용자 정보 가져오기
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    fetchUser()

    // 아임포트 스크립트 로드
    const script = document.createElement('script')
    script.src = 'https://cdn.iamport.kr/v1/iamport.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // 결제 요청
  const handlePayment = async (option) => {
    if (!user) {
      alert('로그인이 필요합니다.')
      window.location.href = '/auth'
      return
    }

    if (!window.IMP) {
      alert('결제 모듈을 로딩 중입니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setLoading(true)
    setSelectedAmount(option.amount)

    // 아임포트 초기화
    const IMP = window.IMP
    IMP.init(import.meta.env.VITE_IAMPORT_CODE) // 가맹점 식별코드

    // 주문번호 생성
    const merchantUid = `point_${Date.now()}_${user.id.substring(0, 8)}`

    // 결제 데이터
    const paymentData = {
      pg: 'html5_inicis.INIpayTest', // 테스트용 PG (나중에 실제 PG로 변경)
      pay_method: 'card',
      merchant_uid: merchantUid,
      name: `포마 포인트 ${option.points.toLocaleString()}P 충전`,
      amount: option.amount,
      buyer_email: user.email,
      buyer_name: user.user_metadata?.name || '포마 유저',
      buyer_tel: user.phone || '010-0000-0000',
      m_redirect_url: `${window.location.origin}/payment/complete`, // 모바일 결제 후 리다이렉트
    }

    // 결제 요청
    IMP.request_pay(paymentData, async (response) => {
      if (response.success) {
        // 결제 성공
        console.log('결제 성공:', response)
        
        try {
          // 서버에서 결제 검증 후 포인트 지급
          await processPayment(response, option)
          
          alert(`${option.points.toLocaleString()}P 충전 완료!`)
          window.location.href = '/profile'
        } catch (error) {
          console.error('포인트 지급 실패:', error)
          alert('결제는 완료되었으나 포인트 지급에 실패했습니다. 고객센터에 문의해주세요.')
        }
      } else {
        // 결제 실패
        console.error('결제 실패:', response)
        alert(`결제 실패: ${response.error_msg}`)
      }
      
      setLoading(false)
      setSelectedAmount(null)
    })
  }

  // 결제 처리 및 포인트 지급
  const processPayment = async (paymentResponse, option) => {
    // 1. 결제 기록 저장
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        imp_uid: paymentResponse.imp_uid,
        merchant_uid: paymentResponse.merchant_uid,
        amount: option.amount,
        points: option.points + option.bonus,
        bonus_points: option.bonus,
        status: 'completed',
        pg_provider: paymentResponse.pg_provider,
        pay_method: paymentResponse.pay_method,
      })

    if (paymentError) throw paymentError

    // 2. 포인트 지급
    const { error: pointError } = await supabase.rpc('add_points', {
      p_user_id: user.id,
      p_amount: option.points + option.bonus,
      p_description: `포인트 충전 (+${option.bonus}P 보너스)`,
    })

    if (pointError) throw pointError
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 pb-20">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">포인트 충전</h1>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        
        {/* 안내 */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <Coins className="text-blue-600 flex-shrink-0 mt-0.5" size={24} />
            <div className="text-sm text-blue-800">
              <p className="font-bold mb-1">💰 포인트 충전 혜택</p>
              <p className="text-xs">5,000원 이상 충전 시 보너스 포인트 지급!</p>
            </div>
          </div>
        </div>

        {/* 충전 금액 선택 */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-gray-800">충전 금액 선택</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {chargeOptions.map((option) => (
              <button
                key={option.amount}
                onClick={() => handlePayment(option)}
                disabled={loading}
                className={`
                  bg-white rounded-2xl p-4 border-2 transition-all
                  ${loading && selectedAmount === option.amount
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-orange-400 hover:shadow-lg'
                  }
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="text-left space-y-2">
                  <p className="text-2xl font-bold text-gray-800">
                    {option.amount.toLocaleString()}원
                  </p>
                  <p className="text-sm text-gray-600">
                    {option.points.toLocaleString()}P
                  </p>
                  {option.bonus > 0 && (
                    <p className="text-xs font-bold text-orange-600">
                      +{option.bonus.toLocaleString()}P 보너스 🎁
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 결제 안내 */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm text-gray-600">
          <p className="font-bold text-gray-800">📌 결제 안내</p>
          <ul className="space-y-1 text-xs">
            <li>• 신용카드, 체크카드, 계좌이체 가능</li>
            <li>• 충전된 포인트는 사진 구매에 사용 가능</li>
            <li>• 환불 정책: 충전 후 7일 이내, 미사용 포인트만 환불 가능</li>
            <li>• 문의: support@phoma.com</li>
          </ul>
        </div>

        {/* 테스트 안내 */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-yellow-800 mb-2">
            ⚠️ 테스트 모드
          </p>
          <p className="text-xs text-yellow-700">
            현재 테스트 환경입니다. 실제 결제는 되지 않습니다.
            <br />
            테스트 카드번호: 1234-1234-1234-1234
          </p>
        </div>

      </div>
    </div>
  )
}