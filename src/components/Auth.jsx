// src/components/Auth.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'

export default function Auth({ onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  // Kakao SDK 로드
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://developers.kakao.com/sdk/js/kakao.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(import.meta.env.VITE_KAKAO_REST_API_KEY)
      }
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // 이메일/비밀번호 로그인
  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (isSignUp) {
        // 회원가입
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              name: formData.name
            }
          }
        })

        if (error) throw error

        setMessage({
          type: 'success',
          text: '회원가입 성공! 이메일을 확인해주세요.'
        })
      } else {
        // 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) throw error

        setMessage({ type: 'success', text: '로그인 성공!' })
        if (onSuccess) onSuccess(data.user)
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  // Google 로그인
  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })

      if (error) throw error
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
    }
  }

  // Kakao 로그인
  const handleKakaoLogin = () => {
    if (!window.Kakao) {
      setMessage({ type: 'error', text: 'Kakao SDK 로딩 중입니다.' })
      return
    }

    window.Kakao.Auth.login({
      success: async (authObj) => {
        try {
          // Kakao 사용자 정보 가져오기
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: async (res) => {
              // Supabase에 사용자 생성 또는 로그인
              // 실제로는 백엔드에서 처리해야 하지만, 
              // 여기서는 간단히 이메일로 로그인 처리
              const email = res.kakao_account.email
              
              setMessage({ 
                type: 'success', 
                text: `카카오 로그인 성공! (${email})` 
              })

              // 실제 구현에서는 백엔드 API를 통해 처리
              console.log('Kakao User:', res)
            },
            fail: (error) => {
              setMessage({ type: 'error', text: '카카오 정보 가져오기 실패' })
            }
          })
        } catch (error) {
          setMessage({ type: 'error', text: error.message })
        }
      },
      fail: (err) => {
        setMessage({ type: 'error', text: '카카오 로그인 실패' })
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* 로고 & 헤더 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍜</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">포마</h1>
          <p className="text-gray-600">내 사진이 돈이 되는 순간</p>
        </div>

        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          
          {/* 탭 전환 */}
          <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2 rounded-md font-semibold transition-all ${
                !isSignUp 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2 rounded-md font-semibold transition-all ${
                isSignUp 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-gray-600'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* 소셜 로그인 버튼들 */}
          <div className="space-y-3 mb-6">
            
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 시작하기
            </button>

            {/* Kakao */}
            <button
              onClick={handleKakaoLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-[#FEE500] hover:bg-[#FDD835] rounded-lg transition-all font-semibold disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#000000" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
              </svg>
              Kakao로 시작하기
            </button>
          </div>

          {/* 구분선 */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">또는</span>
            </div>
          </div>

          {/* 이메일 로그인 폼 */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="이름을 입력하세요"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {isSignUp && (
                <p className="text-xs text-gray-500 mt-1">
                  6자 이상 입력해주세요
                </p>
              )}
            </div>

            {/* 메시지 표시 */}
            {message.text && (
              <div className={`p-3 rounded-lg text-sm ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : isSignUp ? '회원가입' : '로그인'}
            </button>
          </form>

          {/* 비밀번호 찾기 */}
          {!isSignUp && (
            <div className="text-center mt-4">
              <button className="text-sm text-gray-600 hover:text-orange-600">
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <p className="text-center text-sm text-gray-500 mt-6">
          회원가입 시 <a href="#" className="text-orange-600 hover:underline">이용약관</a> 및{' '}
          <a href="#" className="text-orange-600 hover:underline">개인정보처리방침</a>에 동의하게 됩니다.
        </p>
      </div>
    </div>
  )
}