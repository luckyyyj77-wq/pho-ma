/**
 * 날짜 포맷팅 유틸리티
 */

/**
 * 상대 시간 포맷 (방금 전, N분 전, N시간 전 등)
 * @param {string|Date} dateString - 포맷할 날짜
 * @returns {string} 포맷된 상대 시간
 */
export function formatRelativeDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000) // 초 단위

  if (diff < 60) return '방금 전'
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`

  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * 절대 시간 포맷 (2024년 1월 1일 오후 3:00)
 * @param {string|Date} dateString - 포맷할 날짜
 * @param {Object} options - 포맷 옵션
 * @returns {string} 포맷된 날짜/시간
 */
export function formatAbsoluteDate(dateString, options = {}) {
  const date = new Date(dateString)

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  }

  return date.toLocaleString('ko-KR', defaultOptions)
}

/**
 * 짧은 날짜 포맷 (2024.01.01)
 * @param {string|Date} dateString - 포맷할 날짜
 * @returns {string} 포맷된 날짜
 */
export function formatShortDate(dateString) {
  const date = new Date(dateString)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}

/**
 * 시간만 포맷 (오후 3:00)
 * @param {string|Date} dateString - 포맷할 날짜
 * @returns {string} 포맷된 시간
 */
export function formatTime(dateString) {
  const date = new Date(dateString)

  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 남은 시간 계산 (경매 종료까지 등)
 * @param {string|Date} targetDate - 목표 날짜
 * @returns {Object} { days, hours, minutes, seconds, isExpired }
 */
export function getTimeRemaining(targetDate) {
  const target = new Date(targetDate)
  const now = new Date()
  const diff = target - now

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true
    }
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isExpired: false
  }
}

/**
 * 남은 시간을 문자열로 포맷
 * @param {string|Date} targetDate - 목표 날짜
 * @returns {string} 포맷된 남은 시간
 */
export function formatTimeRemaining(targetDate) {
  const { days, hours, minutes, isExpired } = getTimeRemaining(targetDate)

  if (isExpired) return '종료됨'

  if (days > 0) return `${days}일 ${hours}시간 남음`
  if (hours > 0) return `${hours}시간 ${minutes}분 남음`
  if (minutes > 0) return `${minutes}분 남음`

  return '곧 종료'
}
