// src/components/RelistModal.jsx - 재등록 모달
import { useState } from 'react'
import { X, RefreshCw } from 'lucide-react'

export default function RelistModal({ photo, onClose, onRelist }) {
  const [startPrice, setStartPrice] = useState(photo.current_price || 1000)
  const [buyNowPrice, setBuyNowPrice] = useState(photo.buy_now_price || 5000)
  const [duration, setDuration] = useState(7)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 검증
    if (startPrice <= 0) {
      alert('시작가는 0보다 커야 합니다.')
      return
    }

    if (buyNowPrice <= startPrice) {
      alert('즉시구매가는 시작가보다 높아야 합니다.')
      return
    }

    setLoading(true)

    try {
      await onRelist({
        startPrice,
        buyNowPrice,
        duration
      })
    } catch (error) {
      console.error('재등록 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-[#B3D966] to-[#9DC183] p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RefreshCw size={24} className="text-white" />
              <h2 className="text-xl font-black text-white">경매 재등록</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-2">
            가격을 조정하여 다시 경매를 시작하세요
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 사진 정보 */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            {photo.preview_url ? (
              <img
                src={photo.preview_url}
                alt={photo.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7] flex items-center justify-center text-3xl">
                📸
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{photo.title}</h3>
              <p className="text-sm text-gray-500">{photo.category}</p>
            </div>
          </div>

          {/* 이전 가격 정보 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-sm font-semibold text-yellow-800 mb-2">
              ⚠️ 이전 경매 정보
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">이전 시작가:</span>
                <span className="ml-2 font-bold text-gray-900">
                  {photo.current_price?.toLocaleString()}P
                </span>
              </div>
              <div>
                <span className="text-gray-600">이전 즉구가:</span>
                <span className="ml-2 font-bold text-gray-900">
                  {photo.buy_now_price?.toLocaleString()}P
                </span>
              </div>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              💡 가격을 낮추면 입찰 가능성이 높아집니다
            </p>
          </div>

          {/* 시작가 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              새로운 시작가
            </label>
            <div className="relative">
              <input
                type="number"
                value={startPrice}
                onChange={(e) => setStartPrice(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#B3D966] text-lg font-bold"
                placeholder="1000"
                min="100"
                step="100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                P
              </span>
            </div>
          </div>

          {/* 즉시구매가 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              새로운 즉시구매가
            </label>
            <div className="relative">
              <input
                type="number"
                value={buyNowPrice}
                onChange={(e) => setBuyNowPrice(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#B3D966] text-lg font-bold"
                placeholder="5000"
                min={startPrice + 100}
                step="100"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                P
              </span>
            </div>
            {buyNowPrice <= startPrice && (
              <p className="text-xs text-red-600 mt-1">
                즉시구매가는 시작가보다 높아야 합니다
              </p>
            )}
          </div>

          {/* 경매 기간 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              경매 기간
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#B3D966] text-lg font-bold"
            >
              <option value={3}>3일</option>
              <option value={5}>5일</option>
              <option value={7}>7일 (추천)</option>
              <option value={10}>10일</option>
              <option value={14}>14일</option>
            </select>
          </div>

          {/* 가격 차이 표시 */}
          {(startPrice !== photo.current_price || buyNowPrice !== photo.buy_now_price) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                📊 가격 변동
              </p>
              <div className="space-y-1 text-sm">
                {startPrice !== photo.current_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">시작가:</span>
                    <span className={`font-bold ${
                      startPrice < photo.current_price ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {startPrice < photo.current_price ? '↓' : '↑'} {' '}
                      {Math.abs(startPrice - photo.current_price).toLocaleString()}P
                    </span>
                  </div>
                )}
                {buyNowPrice !== photo.buy_now_price && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">즉구가:</span>
                    <span className={`font-bold ${
                      buyNowPrice < photo.buy_now_price ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {buyNowPrice < photo.buy_now_price ? '↓' : '↑'} {' '}
                      {Math.abs(buyNowPrice - photo.buy_now_price).toLocaleString()}P
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || buyNowPrice <= startPrice}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  재등록 중...
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  재등록하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
