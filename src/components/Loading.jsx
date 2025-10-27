// ============================================
// ⏳ 로딩 스피너 컴포넌트
// ============================================

export default function Loading({ fullScreen = false, message = '로딩 중...' }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            {/* 회전하는 원 */}
            <div className="absolute inset-0 border-4 border-orange-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
            {/* 중앙 아이콘 */}
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              🍜
            </div>
          </div>
          <p className="text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-3 border-orange-200 rounded-full"></div>
        <div className="absolute inset-0 border-3 border-orange-500 rounded-full border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center text-xl">
          🍜
        </div>
      </div>
    </div>
  )
}