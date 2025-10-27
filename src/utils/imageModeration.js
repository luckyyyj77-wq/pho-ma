// src/utils/imageModeration.js
// 이미지 콘텐츠 검증 (Google Cloud Vision API)

/**
 * Google Cloud Vision API로 이미지 검증
 * @param {string} imageUrl - 검증할 이미지 URL
 * @returns {Promise<Object>} AI 검증 결과
 */
export async function moderateImage(imageUrl) {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY

  if (!apiKey) {
    console.error('Google Vision API key not found')
    throw new Error('이미지 검증 서비스가 설정되지 않았습니다.')
  }

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                source: {
                  imageUri: imageUrl
                }
              },
              features: [
                { type: 'SAFE_SEARCH_DETECTION', maxResults: 1 },
                { type: 'FACE_DETECTION', maxResults: 10 },
                { type: 'LABEL_DETECTION', maxResults: 10 }
              ]
            }
          ]
        })
      }
    )

    if (!response.ok) {
      throw new Error('이미지 검증 요청 실패')
    }

    const result = await response.json()
    return result.responses[0]
    
  } catch (error) {
    console.error('Image moderation error:', error)
    throw error
  }
}


/**
 * AI 검증 결과로 안전 점수 계산
 * @param {Object} aiResult - Google Vision API 결과
 * @returns {number} 안전 점수 (0.00 ~ 1.00)
 */
export function calculateSafetyScore(aiResult) {
  if (!aiResult.safeSearchAnnotation) {
    // API 결과 없으면 중간 점수
    return 0.5
  }

  const safeSearch = aiResult.safeSearchAnnotation

  // 점수 매핑 (Google의 likelihood를 숫자로 변환)
  const likelihoodScores = {
    'VERY_UNLIKELY': 1.0,   // 매우 안전
    'UNLIKELY': 0.8,        // 안전
    'POSSIBLE': 0.5,        // 애매
    'LIKELY': 0.2,          // 위험
    'VERY_LIKELY': 0.0      // 매우 위험
  }

  // 각 항목 점수 계산
  const adultScore = likelihoodScores[safeSearch.adult] ?? 0.5
  const violenceScore = likelihoodScores[safeSearch.violence] ?? 0.5
  const racyScore = likelihoodScores[safeSearch.racy] ?? 0.5
  const medicalScore = likelihoodScores[safeSearch.medical] ?? 0.5

  // 가중 평균 (adult와 violence에 더 높은 가중치)
  let weightedScore = 
    (adultScore * 0.4) +      // 40% 가중치
    (violenceScore * 0.3) +   // 30% 가중치
    (racyScore * 0.2) +       // 20% 가중치
    (medicalScore * 0.1)      // 10% 가중치

  // 얼굴 감지 시 점수 대폭 감소!
  if (aiResult.faceAnnotations && aiResult.faceAnnotations.length > 0) {
    weightedScore = Math.min(weightedScore, 0.3)  // 최대 0.3점
  }

  return Number(weightedScore.toFixed(2))
}


/**
 * 검출된 문제 분석
 * @param {Object} aiResult - Google Vision API 결과
 * @returns {Array<string>} 검출된 문제 목록
 */
export function detectIssues(aiResult) {
  const issues = []
  
  if (!aiResult.safeSearchAnnotation) {
    return issues
  }

  const safeSearch = aiResult.safeSearchAnnotation

  // 위험 수준 체크 (더 엄격하게!)
  if (['POSSIBLE', 'LIKELY', 'VERY_LIKELY'].includes(safeSearch.adult)) {
    issues.push('성인물')
  }
  if (['POSSIBLE', 'LIKELY', 'VERY_LIKELY'].includes(safeSearch.violence)) {
    issues.push('폭력')
  }
  if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.racy)) {
    issues.push('선정적')
  }
  if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.medical)) {
    issues.push('의료/고어')
  }

  // 얼굴 감지 - 1개라도 있으면 거부!
  if (aiResult.faceAnnotations && aiResult.faceAnnotations.length > 0) {
    const faceCount = aiResult.faceAnnotations.length
    issues.push(`얼굴 인식 (${faceCount}명)`)
  }

  return issues
}


/**
 * 심각도 판단
 * @param {number} safetyScore - 안전 점수
 * @param {Array<string>} issues - 검출된 문제
 * @returns {string} 'low', 'medium', 'high'
 */
export function calculateSeverity(safetyScore, issues) {
  if (safetyScore >= 0.9) {
    return 'low'
  } else if (safetyScore >= 0.5) {
    return 'medium'
  } else {
    return 'high'
  }
}


/**
 * 자동 판단 (승인/거부/검토)
 * @param {number} safetyScore - 안전 점수
 * @param {Array<string>} issues - 검출된 문제들
 * @returns {Object} { decision, autoDecision, reason }
 */
export function makeAutoDecision(safetyScore, issues = []) {
  // 얼굴 감지 시 즉시 거부!
  const hasFace = issues.some(issue => issue.includes('얼굴'))
  if (hasFace) {
    return {
      decision: 'rejected',
      autoDecision: true,
      reason: '약관에 의해 업로드가 금지된 사진입니다.\n\n얼굴이 식별되는 사진은 개인정보 보호를 위해 등록할 수 없습니다.'
    }
  }

  // 일반 정책 (얼굴 없는 경우)
  const APPROVE_THRESHOLD = 0.8   // 80점 이상 자동 승인 (완화)
  const REJECT_THRESHOLD = 0.5    // 50점 미만 자동 거부

  if (safetyScore >= APPROVE_THRESHOLD) {
    return {
      decision: 'approved',
      autoDecision: true,
      reason: '안전한 이미지로 판단됨'
    }
  } else if (safetyScore < REJECT_THRESHOLD) {
    return {
      decision: 'rejected',
      autoDecision: true,
      reason: `부적절한 콘텐츠가 감지되었습니다.\n\n검출된 문제: ${issues.join(', ')}`
    }
  } else {
    return {
      decision: 'reviewing',
      autoDecision: false,
      reason: '관리자 검토 필요'
    }
  }
}


/**
 * 전체 검증 프로세스 실행
 * @param {string} imageUrl - 검증할 이미지 URL
 * @returns {Promise<Object>} 검증 결과
 */
export async function performImageModeration(imageUrl) {
  console.log('🔍 [AI검증 시작] URL:', imageUrl)
  
  try {
    // 1. AI 검증
    console.log('📡 Google Vision API 호출 중...')
    const aiResult = await moderateImage(imageUrl)
    console.log('✅ API 응답 성공:', aiResult)

    // 2. 문제 검출 (얼굴 포함)
    const issues = detectIssues(aiResult)
    console.log('🔍 검출된 문제:', issues)

    // 3. 점수 계산
    const safetyScore = calculateSafetyScore(aiResult)
    console.log('📊 안전 점수:', safetyScore)

    // 4. 심각도
    const severity = calculateSeverity(safetyScore, issues)
    console.log('⚠️ 심각도:', severity)

    // 5. 자동 판단 (issues 전달!)
    const autoDecision = makeAutoDecision(safetyScore, issues)
    console.log('⚖️ 최종 판단:', autoDecision)

    return {
      success: true,
      aiResult,
      safetyScore,
      issues,
      severity,
      ...autoDecision
    }
  } catch (error) {
    console.error('❌ [AI검증 실패]')
    console.error('에러 메시지:', error.message)
    console.error('전체 에러:', error)
    return {
      success: false,
      error: error.message,
      // 에러 시 안전하게 검토 대기로
      decision: 'reviewing',
      autoDecision: false,
      reason: 'AI 검증 실패 - 수동 검토 필요'
    }
  }
}