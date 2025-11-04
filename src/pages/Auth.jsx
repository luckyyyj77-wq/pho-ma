// src/pages/Auth.jsx - 샤인머스켓 테마 + 모달 통합
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Mail, Lock, User, Sparkles, ArrowRight } from 'lucide-react'
import TermsModal from '../components/TermsModal'
import PrivacyModal from '../components/PrivacyModal'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })

  const handleAuth = async (e) => {
    e.preventDefault()

    // 회원가입 시 약관 동의 확인
    if (isSignUp && (!agreedToTerms || !agreedToPrivacy)) {
      alert('이용약관과 개인정보처리방침에 동의해주세요.')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
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

        alert('회원가입이 완료되었습니다! 로그인해주세요.')
        setIsSignUp(false)
        setFormData({ email: '', password: '', name: '' })
        setAgreedToTerms(false)
        setAgreedToPrivacy(false)
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) throw error

        window.location.href = '/'
      }
    } catch (error) {
      alert(error.message || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* 로고 & 타이틀 */}
        <div className="text-center mb-8">
          <svg width="120" height="123" viewBox="0 0 326 335" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6 animate-bounce-slow">
            <path d="M200 128.171C200 183.399 155.228 228.171 100 228.171C44.7715 228.171 0 183.399 0 128.171C0 72.9422 44.7715 28.1707 100 28.1707C155.228 28.1707 200 72.9422 200 128.171Z" fill="#D9D9D9"/>
            <path d="M192 127.671C192 178.757 150.586 220.171 99.5 220.171C48.4137 220.171 7 178.757 7 127.671C7 76.5844 48.4137 35.1707 99.5 35.1707C150.586 35.1707 192 76.5844 192 127.671Z" fill="#B3D966"/>
            <path d="M261 234.171C261 289.399 216.228 334.171 161 334.171C105.772 334.171 61 289.399 61 234.171C61 178.942 105.772 134.171 161 134.171C216.228 134.171 261 178.942 261 234.171Z" fill="#D9D9D9"/>
            <path d="M253 233.671C253 284.757 211.586 326.171 160.5 326.171C109.414 326.171 68 284.757 68 233.671C68 182.584 109.414 141.171 160.5 141.171C211.586 141.171 253 182.584 253 233.671Z" fill="#B3D966"/>
            <path d="M326 135.171C326 190.399 281.228 235.171 226 235.171C170.772 235.171 126 190.399 126 135.171C126 79.9422 170.772 35.1707 226 35.1707C281.228 35.1707 326 79.9422 326 135.171Z" fill="#D9D9D9"/>
            <path d="M318 134.671C318 185.757 276.586 227.171 225.5 227.171C174.414 227.171 133 185.757 133 134.671C133 83.5844 174.414 42.1707 225.5 42.1707C276.586 42.1707 318 83.5844 318 134.671Z" fill="#B3D966"/>
            <path d="M148.5 20.0008C147.119 17.6094 147.939 14.5514 150.33 13.1707L171.981 0.670708C174.372 -0.710004 177.43 0.109372 178.811 2.50083L191.311 24.1515C192.692 26.5429 191.872 29.6009 189.481 30.9816L167.83 43.4816C165.439 44.8623 162.381 44.0429 161 41.6515L148.5 20.0008Z" fill="#C96464"/>
          </svg>
          <h1 className="text-4xl font-black text-[#558B2F] mb-2">포마</h1>
          <p className="text-[#7CB342] flex items-center justify-center gap-2">
            <Sparkles size={16} />
            신선한 사진 마켓플레이스
          </p>
        </div>

        {/* 폼 카드 */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-4">
          
          {/* 탭 */}
          <div className="flex gap-2 mb-6 bg-[#F1F8E9] p-1 rounded-2xl">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                !isSignUp
                  ? 'bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white shadow-lg'
                  : 'text-gray-600 hover:text-[#558B2F]'
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                isSignUp
                  ? 'bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white shadow-lg'
                  : 'text-gray-600 hover:text-[#558B2F]'
              }`}
            >
              회원가입
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* 이름 (회원가입 시만) */}
            {isSignUp && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B3D966]" size={20} />
                <input
                  type="text"
                  placeholder="이름"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#B3D966] focus:outline-none transition-all"
                  required={isSignUp}
                />
              </div>
            )}

            {/* 이메일 */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B3D966]" size={20} />
              <input
                type="email"
                placeholder="이메일"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#B3D966] focus:outline-none transition-all"
                required
              />
            </div>

            {/* 비밀번호 */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B3D966]" size={20} />
              <input
                type="password"
                placeholder="비밀번호"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-[#B3D966] focus:outline-none transition-all"
                required
              />
            </div>

            {/* 약관 동의 (회원가입 시만) */}
            {isSignUp && (
              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#B3D966] border-gray-300 rounded focus:ring-[#B3D966]"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-600 flex-1">
                    <button
                      type="button"
                      onClick={() => setShowTerms(true)}
                      className="text-[#558B2F] hover:underline font-medium"
                    >
                      이용약관
                    </button>
                    에 동의합니다 (필수)
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="privacy"
                    checked={agreedToPrivacy}
                    onChange={(e) => setAgreedToPrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#B3D966] border-gray-300 rounded focus:ring-[#B3D966]"
                  />
                  <label htmlFor="privacy" className="text-sm text-gray-600 flex-1">
                    <button
                      type="button"
                      onClick={() => setShowPrivacy(true)}
                      className="text-[#558B2F] hover:underline font-medium"
                    >
                      개인정보처리방침
                    </button>
                    에 동의합니다 (필수)
                  </label>
                </div>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>처리 중...</span>
                </div>
              ) : (
                <>
                  <span>{isSignUp ? '회원가입' : '로그인'}</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* 안내 */}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            {isSignUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?'}
          </p>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#558B2F] font-bold hover:text-[#7CB342] transition-colors"
          >
            {isSignUp ? '로그인하기' : '회원가입하기'}
          </button>
        </div>

        {/* 데코레이션 */}
        <div className="mt-8 flex justify-center gap-2">
          <div className="w-12 h-12 bg-[#B3D966] rounded-full opacity-20 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-12 h-12 bg-[#9DC183] rounded-full opacity-20 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-12 h-12 bg-[#8FB573] rounded-full opacity-20 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      {/* 모달 */}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </div>
  )
}