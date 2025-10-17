import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Detail from './pages/Detail'
import Upload from './pages/Upload'
import Profile from './pages/Profile'
import Auth from './pages/Auth'

function App() {
  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto bg-background min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/photo/:id" element={<Detail />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App