/**
 * Supabase 에러 처리 유틸리티
 * 일관된 에러 처리와 사용자 친화적인 메시지 제공
 */

/**
 * Supabase 에러를 처리하고 사용자 친화적인 메시지로 변환
 * @param {Error} error - Supabase 에러 객체
 * @param {string} defaultMessage - 기본 에러 메시지
 * @returns {Object} { message: string, shouldRedirect?: string, code?: string }
 */
export function handleSupabaseError(error, defaultMessage = '오류가 발생했습니다') {
  if (!error) {
    return { message: defaultMessage }
  }

  console.error('Supabase Error:', error)

  // 인증 관련 에러
  if (error.message?.includes('JWT') || error.message?.includes('token')) {
    return {
      message: '로그인이 필요합니다',
      shouldRedirect: '/auth',
      code: 'AUTH_REQUIRED'
    }
  }

  // 데이터 없음 에러
  if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
    return {
      message: '데이터를 찾을 수 없습니다',
      code: 'NOT_FOUND'
    }
  }

  // 권한 에러
  if (error.code === 'PGRST301' || error.message?.includes('permission')) {
    return {
      message: '접근 권한이 없습니다',
      code: 'PERMISSION_DENIED'
    }
  }

  // 중복 키 에러
  if (error.code === '23505' || error.message?.includes('duplicate key')) {
    return {
      message: '이미 존재하는 데이터입니다',
      code: 'DUPLICATE'
    }
  }

  // 네트워크 에러
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return {
      message: '네트워크 연결을 확인해주세요',
      code: 'NETWORK_ERROR'
    }
  }

  // Foreign key constraint 에러
  if (error.code === '23503') {
    return {
      message: '관련 데이터를 찾을 수 없습니다',
      code: 'FOREIGN_KEY_VIOLATION'
    }
  }

  // 기본 메시지 반환
  return {
    message: defaultMessage,
    code: error.code || 'UNKNOWN_ERROR'
  }
}

/**
 * 에러 메시지를 사용자에게 표시
 * @param {Error} error - 에러 객체
 * @param {string} defaultMessage - 기본 메시지
 */
export function showError(error, defaultMessage) {
  const handled = handleSupabaseError(error, defaultMessage)
  alert(handled.message)

  if (handled.shouldRedirect) {
    window.location.href = handled.shouldRedirect
  }
}

/**
 * 에러 로깅 (프로덕션 환경에서는 외부 서비스로 전송 가능)
 * @param {Error} error - 에러 객체
 * @param {Object} context - 추가 컨텍스트 정보
 */
export function logError(error, context = {}) {
  console.error('Error Log:', {
    error: error.message || error,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  })

  // TODO: 프로덕션에서는 Sentry 등의 서비스로 전송
  // if (import.meta.env.PROD) {
  //   Sentry.captureException(error, { extra: context })
  // }
}
