// ============================================
// 🎨 워터마크 생성 유틸리티
// ============================================

// 이미지에 워터마크 추가
export async function addWatermark(imageUrl) {
  return new Promise((resolve, reject) => {
    try {
      // Canvas 생성
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 이미지 로드
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        // Canvas 크기 설정
        canvas.width = img.width
        canvas.height = img.height
        
        // 원본 이미지 그리기
        ctx.drawImage(img, 0, 0)
        
        // 워터마크 스타일 설정
        const fontSize = Math.max(16, img.height / 30)
        ctx.font = `bold ${fontSize}px Arial`
        
        // 워터마크 텍스트
        const watermarkText = '🍜 Pho-Ma'
        
        // 우측 하단에만 추가
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.lineWidth = 2
        ctx.textAlign = 'right'
        ctx.textBaseline = 'bottom'
        
        const padding = 15
        ctx.strokeText(watermarkText, img.width - padding, img.height - padding)
        ctx.fillText(watermarkText, img.width - padding, img.height - padding)
        
        // Canvas를 Blob으로 변환
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          resolve(url)
        }, 'image/jpeg', 0.95)
      }
      
      img.onerror = () => {
        reject(new Error('이미지 로드 실패'))
      }
      
      img.src = imageUrl
      
    } catch (error) {
      reject(error)
    }
  })
}