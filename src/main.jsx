import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Service Worker 등록 (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('✅ PWA Service Worker 등록 성공:', registration.scope)

        // 업데이트 체크
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('🔄 새로운 Service Worker 발견')

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('📱 새 버전이 있습니다. 페이지를 새로고침하세요.')
              // 선택: 자동 새로고침 또는 사용자에게 알림
              if (confirm('새 버전이 있습니다. 지금 업데이트하시겠습니까?')) {
                window.location.reload()
              }
            }
          })
        })
      })
      .catch((error) => {
        console.error('❌ Service Worker 등록 실패:', error)
      })

    // 온라인/오프라인 상태 감지
    window.addEventListener('online', () => {
      console.log('🌐 온라인 상태')
    })

    window.addEventListener('offline', () => {
      console.log('📡 오프라인 상태 - 캐시된 콘텐츠 사용')
    })
  })
}