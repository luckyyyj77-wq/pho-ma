// src/utils/profanityFilter.js - 욕설/비속어/혐오표현 필터링

/**
 * 한국어 욕설/비속어/혐오표현 데이터베이스
 * 실제 운영 시에는 더 포괄적인 목록 필요
 */
const PROFANITY_LIST = [
  // 기본 욕설
  '씨발', '시발', 'ㅅㅂ', 'ㅆㅂ', '개새끼', '개색', '새끼', 'ㅅㄲ',
  '병신', 'ㅂㅅ', '지랄', 'ㅈㄹ', '닥쳐', '꺼져', '죽어',
  '미친', 'ㅁㅊ', '또라이', '싸가지', '엿먹어', '좆', 'ㅈ',
  
  // 성적 비속어
  '보지', 'ㅂㅈ', '자지', 'ㅈㅈ', '섹스', 'sex', 
  '야동', '19금', 'ㅅㅅ', '야사', '음란',
  
  // 혐오표현
  '급식충', '틀딱', '한남', '한녀', '김치녀', '된장녀',
  '맘충', '노슬아치', '종북', '일베', '메갈',
  
  // 비하/차별
  '장애', '애자', '찐따', '루저', '쓰레기', '인간쓰레기',
  '벌레', '개돼지', '흑형', '짱개', '쪽바리', '원숭이',
  
  // 변형된 표현
  '시1발', '씨1발', 's1발', '개.새.끼', '개-새-끼',
  'ㅅ ㅂ', 'ㅆ ㅂ', 'ㅂ ㅅ', 'ㅈ ㄹ', 'ㅅ ㄲ',
  
  // 영어 욕설
  'fuck', 'shit', 'bitch', 'ass', 'damn', 'wtf',
  'stfu', 'lmao', 'asshole', 'bastard', 'dick',
]

/**
 * 초성 패턴 매핑
 */
const CHOSUNG_PATTERNS = {
  'ㅅㅂ': ['시발', '씨발', '씨bal', '시bal'],
  'ㅆㅂ': ['씨발', '쌔발'],
  'ㅂㅅ': ['병신', '븅신'],
  'ㅈㄹ': ['지랄', '쥐랄'],
  'ㅅㄲ': ['새끼', '색히'],
  'ㅁㅊ': ['미친', '미챤'],
  'ㅈㅈ': ['자지'],
  'ㅂㅈ': ['보지'],
}

/**
 * 텍스트 정규화 (공백, 특수문자 제거)
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[\s\-_\.]/g, '') // 공백, 하이픈, 언더스코어, 점 제거
    .replace(/[0-9]/g, '') // 숫자 제거 (시1발 -> 시발)
    .replace(/[ㄱ-ㅎㅏ-ㅣ]/g, match => match) // 초성/중성은 유지
    .trim()
}

/**
 * 초성 추출
 */
function getChosung(text) {
  const CHOSUNG_LIST = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
  
  return text.split('').map(char => {
    const code = char.charCodeAt(0) - 44032
    if (code > -1 && code < 11172) {
      return CHOSUNG_LIST[Math.floor(code / 588)]
    }
    return char
  }).join('')
}

/**
 * 욕설 감지 - 메인 함수
 */
export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false
  
  const normalized = normalizeText(text)
  const original = text.toLowerCase()
  const chosung = getChosung(text)
  
  // 1. 직접 매칭
  for (const profanity of PROFANITY_LIST) {
    const normalizedProfanity = normalizeText(profanity)
    
    if (normalized.includes(normalizedProfanity) || 
        original.includes(profanity.toLowerCase())) {
      return true
    }
  }
  
  // 2. 초성 패턴 매칭
  for (const [pattern, variations] of Object.entries(CHOSUNG_PATTERNS)) {
    if (chosung.includes(pattern)) {
      return true
    }
    for (const variation of variations) {
      if (normalized.includes(normalizeText(variation))) {
        return true
      }
    }
  }
  
  // 3. 반복 문자 패턴 (ㅅㅅㅅㅅㅂㅂㅂ 같은 경우)
  const repeatedChosung = chosung.replace(/(.)\1{2,}/g, '$1')
  for (const pattern of Object.keys(CHOSUNG_PATTERNS)) {
    if (repeatedChosung.includes(pattern)) {
      return true
    }
  }
  
  return false
}

/**
 * 욕설 마스킹 (욕설을 *로 변환)
 */
export function maskProfanity(text) {
  if (!text || typeof text !== 'string') return text
  
  let masked = text
  const normalized = normalizeText(text)
  
  for (const profanity of PROFANITY_LIST) {
    const normalizedProfanity = normalizeText(profanity)
    
    // 정규식으로 변형된 형태도 감지
    const regex = new RegExp(
      profanity.split('').map(char => 
        `${char}[\\s\\-_\\.0-9]*`
      ).join(''),
      'gi'
    )
    
    masked = masked.replace(regex, match => '*'.repeat(match.length))
  }
  
  return masked
}

/**
 * 욕설 필터링 검증 (폼 제출 전 검증용)
 */
export function validateText(text, fieldName = '입력') {
  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      message: `${fieldName}을 입력해주세요.`
    }
  }
  
  if (containsProfanity(text)) {
    return {
      isValid: false,
      message: `${fieldName}에 부적절한 표현이 포함되어 있습니다.`
    }
  }
  
  return {
    isValid: true,
    message: ''
  }
}

/**
 * 실시간 입력 검증 (타이핑 시 사용)
 */
export function validateRealtime(text) {
  if (!text) return { hasIssue: false, message: '' }
  
  if (containsProfanity(text)) {
    return {
      hasIssue: true,
      message: '⚠️ 부적절한 표현이 감지되었습니다.'
    }
  }
  
  return {
    hasIssue: false,
    message: ''
  }
}

/**
 * 닉네임 검증 (특수 규칙 추가)
 */
export function validateNickname(nickname) {
  if (!nickname) {
    return {
      isValid: false,
      message: '닉네임을 입력해주세요.'
    }
  }
  
  // 길이 체크
  if (nickname.length < 2) {
    return {
      isValid: false,
      message: '닉네임은 2자 이상이어야 합니다.'
    }
  }
  
  if (nickname.length > 20) {
    return {
      isValid: false,
      message: '닉네임은 20자 이하여야 합니다.'
    }
  }
  
  // 욕설 체크
  if (containsProfanity(nickname)) {
    return {
      isValid: false,
      message: '닉네임에 부적절한 표현이 포함되어 있습니다.'
    }
  }
  
  // 특수문자 체크 (일부만 허용)
  const allowedPattern = /^[가-힣a-zA-Z0-9_\-\s]+$/
  if (!allowedPattern.test(nickname)) {
    return {
      isValid: false,
      message: '닉네임에는 한글, 영문, 숫자, _, - 만 사용할 수 있습니다.'
    }
  }
  
  return {
    isValid: true,
    message: '✓ 사용 가능한 닉네임입니다.'
  }
}

/**
 * 게시글/댓글 검증
 */
export function validateContent(content, minLength = 2, maxLength = 1000) {
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      message: '내용을 입력해주세요.'
    }
  }
  
  if (content.trim().length < minLength) {
    return {
      isValid: false,
      message: `내용은 최소 ${minLength}자 이상이어야 합니다.`
    }
  }
  
  if (content.length > maxLength) {
    return {
      isValid: false,
      message: `내용은 최대 ${maxLength}자까지 입력 가능합니다.`
    }
  }
  
  if (containsProfanity(content)) {
    return {
      isValid: false,
      message: '내용에 부적절한 표현이 포함되어 있습니다.'
    }
  }
  
  return {
    isValid: true,
    message: ''
  }
}

/**
 * 사진 제목 검증
 */
export function validatePhotoTitle(title) {
  if (!title || title.trim().length === 0) {
    return {
      isValid: false,
      message: '제목을 입력해주세요.'
    }
  }
  
  if (title.length < 2) {
    return {
      isValid: false,
      message: '제목은 2자 이상이어야 합니다.'
    }
  }
  
  if (title.length > 100) {
    return {
      isValid: false,
      message: '제목은 100자 이하여야 합니다.'
    }
  }
  
  if (containsProfanity(title)) {
    return {
      isValid: false,
      message: '제목에 부적절한 표현이 포함되어 있습니다.'
    }
  }
  
  return {
    isValid: true,
    message: ''
  }
}

/**
 * 통합 검증 (여러 필드 동시 검증)
 */
export function validateMultiple(fields) {
  const results = {}
  let hasError = false
  
  for (const [fieldName, value] of Object.entries(fields)) {
    const result = validateText(value, fieldName)
    results[fieldName] = result
    if (!result.isValid) {
      hasError = true
    }
  }
  
  return {
    isValid: !hasError,
    results
  }
}

// 디버깅용 (개발 환경에서만 사용)
export function testProfanityFilter() {
  const testCases = [
    '안녕하세요',           // 정상
    '씨발',                 // 욕설
    '시1발',                // 변형
    'ㅅㅂ',                 // 초성
    '개.새.끼',             // 특수문자
    'ㅅ ㅂ',                // 공백
    '시iiii발',            // 변형
    'fuck',                 // 영어 욕설
    '정말 멋진 사진이네요', // 정상
  ]
  
  console.log('=== 욕설 필터 테스트 ===')
  testCases.forEach(text => {
    console.log(`"${text}" -> ${containsProfanity(text) ? '❌ 욕설 감지' : '✅ 정상'}`)
  })
}