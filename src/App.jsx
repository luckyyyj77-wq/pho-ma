import { AuthProvider } from './contexts/AuthContext'
import { initLanguage } from './locales'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Detail from './pages/Detail'
import Upload from './pages/Upload'
import Profile from './components/Profile'
import Auth from './components/Auth'
import Admin from './pages/Admin'
import PointCharge from './pages/PointCharge'

initLanguage()


function App() {
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