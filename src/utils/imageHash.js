// ============================================
// 📸 이미지 해시 생성 유틸리티
// ============================================

// 이미지 파일을 해시로 변환
export async function generateImageHash(file) {
  try {
    // 파일을 ArrayBuffer로 읽기
    const buffer = await file.arrayBuffer()
    
    // SHA-256 해시 생성
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    
    // 해시를 16진수 문자열로 변환
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex
  } catch (error) {
    console.error('해시 생성 실패:', error)
    return null
  }
}