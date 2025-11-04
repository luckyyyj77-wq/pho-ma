// src/App.jsx - 최종 통합 버전
import { useState, useEffect } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { initLanguage } from './locales'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Splash from './components/Splash'
import Home from './pages/Home'
import Detail from './pages/Detail'
import Upload from './pages/Upload'
import Profile from './components/Profile'
import Auth from './components/Auth'
import Admin from './pages/Admin'
import PointCharge from './pages/PointCharge'

initLanguage()

function App() {
  const [showSplash, setShowSplash] = useState(true)

  useEffect(() => {
    // 첫 방문 확인
    const hasVisited = localStorage.getItem('hasVisited')
    if (hasVisited) {
      setShowSplash(false)
    }
  }, [])

  const handleSplashFinish = () => {
    localStorage.setItem('hasVisited', 'true')
    setShowSplash(false)
  }

  // 스플래시 화면 표시
  if (showSplash) {
    return <Splash onFinish={handleSplashFinish} />
  }

  // 메인 앱
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="max-w-md mx-auto bg-background min-h-screen">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/photo/:id" element={<Detail />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/point-charge" element={<PointCharge />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App