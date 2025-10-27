// ============================================
// 📦 라이브러리 및 컴포넌트 import
// ============================================
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { t, translateError } from '../locales'




// ============================================
// 🎯 메인 컴포넌트
// ============================================
export default function Auth() {

  // ------------------------------------------
  // 🔐 Auth Context 사용
  // ------------------------------------------
  const { signIn, signUp } = useAuth()


  // ------------------------------------------
  // 📝 입력 폼 state 관리
  // ------------------------------------------
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [showPassword, setShowPassword] = useState(false)




  // ------------------------------------------
  // 🔐 로그인/회원가입 처리
  // ------------------------------------------
  async function handleAuth(e) {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // 로그인
        const { error } = await signIn(email, password)
        if (error) throw error
        
        alert('✅ auth.loginSuccess')
        window.location.href = '/'

      } else {
        // 회원가입 - 입력값 검증

        // 닉네임 필수 체크 (맨 위로!)
        if (!nickname || nickname.trim().length === 0) {
        throw new Error('auth.nicknameRequired')
        }

        if (password.length < 8) {
          throw new Error('auth.passwordMinLength')
        }

        // 비밀번호 복잡성 검증 (영문, 숫자, 특수문자 포함)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
        if (!passwordRegex.test(password)) {
        throw new Error('auth.passwordComplexity')
        }

        if (nickname.length < 2) {
          throw new Error('auth.nicknameMinLength')
        }

        // 회원가입 (AuthContext 사용)
        const { error } = await signUp(email, password, nickname)
        if (error) throw error

        // 성공 메시지
        alert('auth.signupSuccess')
        
        // 이메일은 유지, 비밀번호와 닉네임만 초기화
        setPassword('')
        setNickname('')
        
        // 로그인 탭으로 전환 (이메일은 자동 입력된 상태)
        setIsLogin(true)
      }
    } catch (error) {
      alert(translateError(error))
    } finally {
      setLoading(false)
    }
  }




  // ============================================
  // 🎨 UI 렌더링
  // ============================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-500 flex flex-col items-center justify-center p-4">


      {/* ------------------------------------------
          🏠 홈으로 돌아가기 버튼
      ------------------------------------------ */}
      <div className="w-full max-w-md mb-4">
        <button
          onClick={() => window.location.href = '/'}
          className="text-white flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full hover:bg-white/30 transition-colors"
        >
          <ArrowLeft size={20} />
          홈으로
        </button>
      </div>




      {/* ------------------------------------------
          📋 로그인/회원가입 폼
      ------------------------------------------ */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">


        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍜</div>
          <h1 className="text-3xl font-bold text-gray-800">포마</h1>
          <p className="text-sm text-gray-600 mt-2">내 사진이 돈이 되는 순간</p>
        </div>


        {/* 로그인/회원가입 탭 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              isLogin 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
              !isLogin 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            회원가입
          </button>
        </div>


        {/* 입력 폼 */}
        <form onSubmit={handleAuth} className="space-y-4">


          {/* 닉네임 (회원가입시만) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="2자 이상"
                minLength="2"
                maxLength="20"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required={!isLogin}
              />
            </div>
          )}


          {/* 이메일 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>


          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              비밀번호
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? "비밀번호" : "8자 이상"}
                minLength={isLogin ? "6" : "8"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">
                영문, 숫자 포함 8자 이상 (보안 강화)
              </p>
            )}
          </div>


          {/* 회원가입 혜택 안내 */}
          {!isLogin && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-700 font-semibold">
                🎁 가입하면 1,000P 무료 지급!
              </p>
            </div>
          )}


          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 disabled:bg-gray-300 transition-colors"
          >
            {loading ? '처리중...' : isLogin ? '로그인' : '회원가입'}
          </button>


        </form>


        {/* 로그인 없이 둘러보기 */}
        <button
          onClick={() => window.location.href = '/'}
          className="w-full mt-4 text-sm text-gray-600 hover:text-gray-800"
        >
          로그인 없이 둘러보기
        </button>


        {/* 소셜 로그인 (준비 중) */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-xs text-gray-400 mb-3">
            소셜 로그인 (준비 중)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              disabled
              className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed"
            >
              <span>🔵</span> Google
            </button>
            <button 
              disabled
              className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed"
            >
              <span>💬</span> Kakao
            </button>
          </div>
        </div>


      </div>


    </div>
  )
}