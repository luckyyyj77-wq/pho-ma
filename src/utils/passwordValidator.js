/**
 * 비밀번호 검증 및 강도 평가 유틸리티
 */

/**
 * 비밀번호 유효성 검증
 * @param {string} password - 검증할 비밀번호
 * @returns {Object} { valid: boolean, errors: string[] }
 */
export function validatePassword(password) {
  const errors = []

  if (!password) {
    return { valid: false, errors: ['비밀번호를 입력해주세요'] }
  }

  if (password.length < 8) {
    errors.push('비밀번호는 8자 이상이어야 합니다')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('대문자를 최소 1개 포함해야 합니다')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('소문자를 최소 1개 포함해야 합니다')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 최소 1개 포함해야 합니다')
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('특수문자를 최소 1개 포함해야 합니다')
  }

  // 연속된 문자 체크 (예: aaa, 111)
  if (/(.)\1{2,}/.test(password)) {
    errors.push('동일한 문자를 3번 이상 연속으로 사용할 수 없습니다')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 비밀번호 강도 계산 (0-4)
 * @param {string} password - 평가할 비밀번호
 * @returns {number} 강도 (0: 매우 약함, 1: 약함, 2: 보통, 3: 강함, 4: 매우 강함)
 */
export function getPasswordStrength(password) {
  if (!password) return 0

  let strength = 0

  // 길이 체크
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++

  // 문자 종류 체크
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++

  return Math.min(strength, 4)
}

/**
 * 비밀번호 강도 텍스트 반환
 * @param {number} strength - 강도 점수 (0-4)
 * @returns {string} 강도 설명
 */
export function getPasswordStrengthText(strength) {
  const texts = [
    '매우 약함',
    '약함',
    '보통',
    '강함',
    '매우 강함'
  ]
  return texts[strength] || '매우 약함'
}

/**
 * 비밀번호 강도 색상 반환
 * @param {number} strength - 강도 점수 (0-4)
 * @returns {string} Tailwind 색상 클래스
 */
export function getPasswordStrengthColor(strength) {
  const colors = [
    'text-red-600',      // 매우 약함
    'text-orange-600',   // 약함
    'text-yellow-600',   // 보통
    'text-green-600',    // 강함
    'text-emerald-600'   // 매우 강함
  ]
  return colors[strength] || 'text-gray-600'
}

/**
 * 비밀번호 강도 배경 색상 반환
 * @param {number} strength - 강도 점수 (0-4)
 * @returns {string} Tailwind 배경 색상 클래스
 */
export function getPasswordStrengthBgColor(strength) {
  const colors = [
    'bg-red-600',      // 매우 약함
    'bg-orange-600',   // 약함
    'bg-yellow-600',   // 보통
    'bg-green-600',    // 강함
    'bg-emerald-600'   // 매우 강함
  ]
  return colors[strength] || 'bg-gray-600'
}

/**
 * 일반적인 비밀번호 패턴 체크 (예: password123, qwerty 등)
 * @param {string} password - 체크할 비밀번호
 * @returns {boolean} 일반적인 비밀번호인지 여부
 */
export function isCommonPassword(password) {
  const commonPasswords = [
    'password', '12345678', 'qwerty', 'abc123', 'password1',
    'password123', 'qwerty123', '1q2w3e4r', 'admin', 'admin123',
    'welcome', 'monkey', '1234', 'dragon', 'master', 'sunshine',
    'princess', 'letmein', 'starwars', 'football', 'iloveyou'
  ]

  const lowerPassword = password.toLowerCase()
  return commonPasswords.some(common => lowerPassword.includes(common))
}

/**
 * 비밀번호 확인 (두 비밀번호가 일치하는지)
 * @param {string} password - 비밀번호
 * @param {string} confirmPassword - 확인 비밀번호
 * @returns {boolean} 일치 여부
 */
export function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword && password.length > 0
}

/**
 * 종합 비밀번호 검증 (모든 규칙 적용)
 * @param {string} password - 검증할 비밀번호
 * @param {string} confirmPassword - 확인 비밀번호 (선택)
 * @returns {Object} { valid, errors, strength, strengthText }
 */
export function comprehensivePasswordValidation(password, confirmPassword = null) {
  const validation = validatePassword(password)
  const strength = getPasswordStrength(password)

  // 일반적인 비밀번호 체크
  if (isCommonPassword(password)) {
    validation.valid = false
    validation.errors.push('너무 흔한 비밀번호입니다. 다른 비밀번호를 사용해주세요')
  }

  // 비밀번호 확인 체크
  if (confirmPassword !== null && !passwordsMatch(password, confirmPassword)) {
    validation.valid = false
    validation.errors.push('비밀번호가 일치하지 않습니다')
  }

  return {
    ...validation,
    strength,
    strengthText: getPasswordStrengthText(strength)
  }
}
