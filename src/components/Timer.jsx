// src/components/Timer.jsx - 실시간 카운트다운 타이머
import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export default function Timer({ endTime, onExpire, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(null)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime()
      const now = new Date().getTime()
      const difference = end - now

      if (difference <= 0) {
        setExpired(true)
        if (onExpire) onExpire()
        return null
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      return { days, hours, minutes, seconds, total: difference }
    }

    // 초기 계산
    setTimeLeft(calculateTimeLeft())

    // 1초마다 업데이트
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft()
      setTimeLeft(newTimeLeft)
      
      if (!newTimeLeft) {
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime, onExpire])

  if (expired) {
    return (
      <div className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-red-600 flex items-center gap-1`}>
        <Clock size={compact ? 12 : 16} />
        <span>경매 종료</span>
      </div>
    )
  }

  if (!timeLeft) {
    return (
      <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-400 flex items-center gap-1`}>
        <Clock size={compact ? 12 : 16} />
        <span>계산 중...</span>
      </div>
    )
  }

  // 1시간 미만이면 빨간색으로 표시
  const isUrgent = timeLeft.total < 3600000
  // 24시간 미만이면 노란색으로 표시
  const isWarning = timeLeft.total < 86400000 && !isUrgent

  const colorClass = isUrgent 
    ? 'text-red-600' 
    : isWarning 
    ? 'text-orange-600' 
    : 'text-gray-700'

  // 컴팩트 모드 (홈 화면용)
  if (compact) {
    if (timeLeft.days > 0) {
      return (
        <div className={`text-xs font-semibold ${colorClass} flex items-center gap-1`}>
          <Clock size={12} />
          <span>{timeLeft.days}일 {timeLeft.hours}시간</span>
        </div>
      )
    }
    
    return (
      <div className={`text-xs font-semibold ${colorClass} flex items-center gap-1`}>
        <Clock size={12} />
        <span>{String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
    )
  }

  // 일반 모드 (상세 페이지용)
  return (
    <div className={`text-lg font-bold ${colorClass} flex items-center gap-2`}>
      <Clock size={20} className={isUrgent ? 'animate-pulse' : ''} />
      <div>
        {timeLeft.days > 0 && (
          <span className="mr-2">{timeLeft.days}일</span>
        )}
        <span>
          {String(timeLeft.hours).padStart(2, '0')}:
          {String(timeLeft.minutes).padStart(2, '0')}:
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}