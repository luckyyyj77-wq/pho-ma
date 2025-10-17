// ============================================
// 📦 라이브러리 및 컴포넌트 import
// ============================================
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'




// ============================================
// 🎯 메인 컴포넌트
// ============================================
export default function Auth() {

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
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        alert('로그인 성공!')
        window.location.href = '/'

      } else {
        // 회원가입 - 입력값 검증
        if (password.length < 6) {
          throw new Error('비밀번호는 최소 6자 이상이어야 합니다.')
        }
        if (nickname.length < 2) {
          throw new Error('닉네임은 최소 2자 이상이어야 합니다.')
        }

        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: nickname
            }
          }
        })
        if (error) throw error

        // 회원가입 성공 시 10,000P 지급
        if (authData.user) {
          const { error: pointError } = await supabase
            .from('user_points')
            .insert({
              user_id: authData.user.id,
              balance: 10000
            })
          
          if (pointError) console.error('포인트 지급 실패:', pointError)
        }

        alert('🎉 회원가입 성공!\n가입 축하 10,000P가 지급되었습니다!\n\n이메일을 확인하여 인증을 완료해주세요.')
        
        // 폼 초기화 후 로그인 탭으로 전환
        setEmail('')
        setPassword('')
        setNickname('')
        setIsLogin(true)
      }
    } catch (error) {
      alert(error.message)
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
                placeholder="6자 이상"
                minLength="6"
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
                영문, 숫자 포함 6자 이상
              </p>
            )}
          </div>


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


      </div>


    </div>
  )
}