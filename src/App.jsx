// src/App.jsx - 스플래시 화면 추가
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Splash from './components/Splash'
import Home from './pages/Home'
import Detail from './pages/Detail'
import Upload from './pages/Upload'
import Profile from './components/Profile'
import Auth from './pages/Auth'
import Admin from './pages/Admin'
//import PointCharge from './pages/PointCharge'

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
    <Router>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/photo/:id" element={<Detail />} />
    <Route path="/upload" element={<Upload />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/admin" element={<Admin />} />
    {/* <Route path="/point-charge" element={<PointCharge />} /> */}
  </Routes>
</Router>
  )
}

export default App
