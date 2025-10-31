// src/components/Splash.jsx
import { useEffect } from 'react'

export default function Splash({ onFinish }) {
  useEffect(() => {
    // 2초 후 메인 화면으로
    const timer = setTimeout(() => {
      onFinish()
    }, 2000)

    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#B3D966] via-[#9DC183] to-[#8FB573] flex items-center justify-center z-50">
      {/* 애니메이션 효과 */}
      <div className="relative animate-bounce-slow">
        
        {/* 로고 SVG */}
        <div className="flex flex-col items-center gap-8">
          {/* 샤인머스켓 로고 */}
          <svg width="200" height="206" viewBox="0 0 326 335" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
            <path d="M200 128.171C200 183.399 155.228 228.171 100 228.171C44.7715 228.171 0 183.399 0 128.171C0 72.9422 44.7715 28.1707 100 28.1707C155.228 28.1707 200 72.9422 200 128.171Z" fill="#D9D9D9"/>
            <path d="M192 127.671C192 178.757 150.586 220.171 99.5 220.171C48.4137 220.171 7 178.757 7 127.671C7 76.5844 48.4137 35.1707 99.5 35.1707C150.586 35.1707 192 76.5844 192 127.671Z" fill="#FFFFFF"/>
            <path d="M261 234.171C261 289.399 216.228 334.171 161 334.171C105.772 334.171 61 289.399 61 234.171C61 178.942 105.772 134.171 161 134.171C216.228 134.171 261 178.942 261 234.171Z" fill="#D9D9D9"/>
            <path d="M253 233.671C253 284.757 211.586 326.171 160.5 326.171C109.414 326.171 68 284.757 68 233.671C68 182.584 109.414 141.171 160.5 141.171C211.586 141.171 253 182.584 253 233.671Z" fill="#FFFFFF"/>
            <path d="M326 135.171C326 190.399 281.228 235.171 226 235.171C170.772 235.171 126 190.399 126 135.171C126 79.9422 170.772 35.1707 226 35.1707C281.228 35.1707 326 79.9422 326 135.171Z" fill="#D9D9D9"/>
            <path d="M318 134.671C318 185.757 276.586 227.171 225.5 227.171C174.414 227.171 133 185.757 133 134.671C133 83.5844 174.414 42.1707 225.5 42.1707C276.586 42.1707 318 83.5844 318 134.671Z" fill="#FFFFFF"/>
            <path d="M148.5 20.0008C147.119 17.6094 147.939 14.5514 150.33 13.1707L171.981 0.670708C174.372 -0.710004 177.43 0.109372 178.811 2.50083L191.311 24.1515C192.692 26.5429 191.872 29.6009 189.481 30.9816L167.83 43.4816C165.439 44.8623 162.381 44.0429 161 41.6515L148.5 20.0008Z" fill="#C96464"/>
          </svg>

          {/* 앱 이름 */}
          <div className="text-center">
            <h1 className="text-5xl font-black text-white mb-2 tracking-tight">
              포마
            </h1>
            <p className="text-white/90 text-lg font-medium">
              사진 마켓플레이스
            </p>
          </div>
        </div>

        {/* 빛나는 효과 */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </div>

      {/* 로딩 인디케이터 */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* 하단 텍스트 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="text-white/70 text-sm">
          신선한 사진을 만나보세요
        </p>
      </div>
    </div>
  )
}
