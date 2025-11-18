// src/components/InstallPrompt.jsx - PWA 설치 프롬프트
import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // PWA 설치 프롬프트 이벤트 감지
    const handler = (e) => {
      // 브라우저 기본 설치 프롬프트 막기
      e.preventDefault()

      // 프롬프트 저장
      setDeferredPrompt(e)

      // localStorage에서 이전에 닫았는지 확인
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      if (!dismissed) {
        // 3초 후에 프롬프트 표시
        setTimeout(() => {
          setShowPrompt(true)
        }, 3000)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)

    // 이미 설치되어 있는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ 이미 PWA로 실행 중')
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return
    }

    // 설치 프롬프트 표시
    deferredPrompt.prompt()

    // 사용자 선택 대기
    const { outcome } = await deferredPrompt.userChoice

    console.log(`PWA 설치 선택: ${outcome}`)

    // 프롬프트 초기화
    setDeferredPrompt(null)
    setShowPrompt(false)

    // 사용자가 거부했으면 7일 동안 다시 안 보기
    if (outcome === 'dismissed') {
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 7)
      localStorage.setItem('pwa-prompt-dismissed', expiryDate.toISOString())
    }
  }

  const handleClose = () => {
    setShowPrompt(false)

    // 하루 동안 다시 안 보기
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 1)
    localStorage.setItem('pwa-prompt-dismissed', expiryDate.toISOString())
  }

  // iOS Safari 감지
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches

  // 프롬프트를 표시하지 않는 경우
  if (!showPrompt || isStandalone) {
    return null
  }

  // iOS Safari용 안내 (beforeinstallprompt 이벤트가 없음)
  if (isIOS && !isStandalone) {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-[#B3D966] to-[#9DC183] rounded-2xl shadow-2xl p-4 z-50 animate-slideUp">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 text-white/80 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Download size={24} className="text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-white font-bold text-lg mb-1">
              📱 포토마켓 앱 설치하기
            </h3>
            <p className="text-white/90 text-sm mb-2">
              Safari에서 공유 버튼
              <span className="inline-block mx-1 px-2 py-0.5 bg-white/30 rounded">
                <svg width="12" height="16" viewBox="0 0 12 16" fill="white">
                  <path d="M6 0L6 10M6 0L3 3M6 0L9 3M1 12L1 14C1 15.1 1.9 16 3 16L9 16C10.1 16 11 15.1 11 14L11 12"/>
                </svg>
              </span>
              을 누르고<br />
              <strong>"홈 화면에 추가"</strong>를 선택하세요!
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Android/Chrome용 설치 프롬프트
  return (
    <div className="fixed bottom-20 left-4 right-4 bg-gradient-to-r from-[#B3D966] to-[#9DC183] rounded-2xl shadow-2xl p-4 z-50 animate-slideUp">
      <button
        onClick={handleClose}
        className="absolute top-2 right-2 text-white/80 hover:text-white"
      >
        <X size={20} />
      </button>

      <div className="flex items-start gap-3">
        <div className="bg-white/20 p-2 rounded-xl">
          <Download size={24} className="text-white" />
        </div>

        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">
            📱 포토마켓 앱으로 설치
          </h3>
          <p className="text-white/90 text-sm mb-3">
            홈 화면에 추가하여 앱처럼 사용하세요!
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-white text-[#B3D966] px-4 py-2 rounded-xl font-bold hover:bg-white/90 transition-all"
            >
              설치하기
            </button>
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-xl font-semibold text-white hover:bg-white/10 transition-all"
            >
              나중에
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
