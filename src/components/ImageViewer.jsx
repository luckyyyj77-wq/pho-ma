// ============================================
// 🖼️ 이미지 뷰어 (라이트박스)
// ============================================
import { useState, useEffect } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'


export default function ImageViewer({ imageUrl, title, onClose }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    // ESC 키로 닫기
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3))
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5))

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 상단 컨트롤 */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-white">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation()
                zoomOut()
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ZoomOut size={24} />
            </button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                zoomIn()
              }}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ZoomIn size={24} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* 이미지 */}
      <div 
        className="relative"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={title}
          className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
        />
      </div>

      {/* 하단 안내 */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-white/70 text-sm">
          클릭 또는 ESC로 닫기
        </p>
      </div>
    </div>
  )
}