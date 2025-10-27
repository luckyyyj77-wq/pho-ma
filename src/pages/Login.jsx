import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, UserPlus, Mail, Lock, User } from 'lucide-react'

export default function Login({ onClose }) {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password)
        if (error) throw error
        onClose()
      } else {
        if (!username.trim()) {
          throw new Error('닉네임을 입력해주세요')
        }
        const { error } = await signUp(email, password, username)
        if (error) throw error
        alert('🎉 회원가입 완료! 1,000P가 지급되었습니다!')
        onClose()
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 relative">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🍜</div>
          <h1 className="text-2xl font-bold text-gray-800">포마</h1>
          <p className="text-sm text-gray-500">내 사진이 돈이 되는 순간</p>
        </div>

        {/* 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              mode === 'login'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-3 rounded-xl font-semibold transition ${
              mode === 'signup'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회원가입일 때만 닉네임 */}
          {mode === 'signup' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="닉네임"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none"
                required
              />
            </div>
          )}

          {/* 이메일 */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none"
              required
            />
          </div>

          {/* 비밀번호 */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:outline-none"
              required
              minLength={6}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 회원가입 혜택 */}
          {mode === 'signup' && (
            <div className="bg-orange-50 text-orange-700 px-4 py-3 rounded-xl text-sm">
              🎁 가입하면 1,000P 무료 지급!
            </div>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              '처리 중...'
            ) : mode === 'login' ? (
              <>
                <LogIn size={20} />
                로그인
              </>
            ) : (
              <>
                <UserPlus size={20} />
                회원가입
              </>
            )}
          </button>
        </form>

        {/* 소셜 로그인 (추후 구현) */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500 mb-4">간편 로그인</p>
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 font-semibold text-gray-700">
              Google
            </button>
            <button className="flex-1 py-3 rounded-xl border-2 border-gray-200 hover:bg-gray-50 font-semibold text-gray-700">
              Kakao
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}