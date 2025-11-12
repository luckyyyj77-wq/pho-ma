// src/components/Auth.jsx - 샤인머스켓 그린 테마
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { Mail, Lock, User, Eye, EyeOff, Phone, ArrowLeft, Chrome } from 'lucide-react'
import TermsModal from './TermsModal'
import PrivacyModal from './PrivacyModal'

export default function Auth({ onSuccess, onBack }) {
  const navigate = useNavigate()
  const [step, setStep] = useState('mode') // 'mode', 'select', 'google', 'kakao', 'email', 'phone'
  const [authMode, setAuthMode] = useState('signin') // 'signin' or 'signup'
  const [emailMode, setEmailMode] = useState('signin') // 'signin' or 'signup'
  const [phoneStep, setPhoneStep] = useState('phone') // 'phone' or 'code'
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    code: ''
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
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // 약관 스크롤 완료 콜백
  const handleScrollComplete = (type) => {
    if (type === 'terms') {
      setTermsAccepted(true)
    } else if (type === 'privacy') {
      setPrivacyAccepted(true)
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
          window.Kakao.API.request({
            url: '/v2/user/me',
            success: async (res) => {
              const email = res.kakao_account.email
              setMessage({
                type: 'success',
                text: `카카오 로그인 성공! (${email})`
              })
              console.log('Kakao User:', res)

              // 로그인 성공 시 홈으로 자동 이동
              setTimeout(() => {
                if (onSuccess) {
                  onSuccess(res)
                } else {
                  navigate('/')
                }
              }, 500)
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

  // 이메일 로그인/회원가입
  const handleEmailAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      if (emailMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { name: formData.name }
          }
        })

        if (error) throw error

        setMessage({
          type: 'success',
          text: '회원가입 성공! 이메일을 확인해주세요.'
        })
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) throw error

        setMessage({ type: 'success', text: '로그인 성공!' })

        // 로그인 성공 시 홈으로 자동 이동
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(data.user)
          } else {
            navigate('/')
          }
        }, 500)
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  // SMS 코드 발송
  const handleSendCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      let phone = formData.phone.trim()
      
      if (phone.startsWith('010')) {
        phone = '+82' + phone.substring(1)
      } else if (!phone.startsWith('+82')) {
        phone = '+82' + phone
      }
      
      phone = phone.replace(/-/g, '')

      const { error } = await supabase.auth.signInWithOtp({
        phone: phone
      })

      if (error) throw error

      setPhoneStep('code')
      setMessage({
        type: 'success',
        text: '인증코드를 발송했습니다!'
      })
    } catch (error) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  // SMS 코드 확인
  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      let phone = formData.phone.trim()
      if (phone.startsWith('010')) {
        phone = '+82' + phone.substring(1)
      } else if (!phone.startsWith('+82')) {
        phone = '+82' + phone
      }
      phone = phone.replace(/-/g, '')

      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: formData.code,
        type: 'sms'
      })

      if (error) throw error

      setMessage({ type: 'success', text: '로그인 성공!' })

      // 로그인 성공 시 홈으로 자동 이동
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(data.user)
        } else {
          navigate('/')
        }
      }, 500)
    } catch (error) {
      setMessage({ type: 'error', text: '인증코드가 올바르지 않습니다.' })
    } finally {
      setLoading(false)
    }
  }

  // 뒤로가기
  const handleBack = () => {
    if (step === 'select') {
      setStep('mode') // select에서 뒤로가면 mode로
    } else {
      setStep('select')
    }
    setMessage({ type: '', text: '' })
    setFormData({ email: '', password: '', name: '', phone: '', code: '' })
    setPhoneStep('phone')
  }

  // 인증 버튼 클릭 핸들러
  const handleAuthButtonClick = (authHandler) => {
    // 회원가입 모드일 때만 약관 체크
    if (authMode === 'signup' && (!termsAccepted || !privacyAccepted)) {
      setMessage({ type: 'error', text: '아래의 이용약관과 개인정보처리방침을 확인해주세요.' });
      return;
    }
    authHandler();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl">

        {/* Step 0: 로그인/회원가입 선택 */}
        {step === 'mode' && (
          <div className="animate-fadeIn relative">
            {onBack && (
              <button
                onClick={onBack}
                className="absolute top-0 left-0 flex items-center gap-2 text-gray-600 hover:text-[#558B2F] transition-colors p-2 rounded-lg hover:bg-white/50"
              >
                <span className="text-2xl">↩</span>
              </button>
            )}

            <div className="text-center mb-12">
              <svg width="120" height="123" viewBox="0 0 326 335" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6 animate-bounce-slow">
                <path d="M200 128.171C200 183.399 155.228 228.171 100 228.171C44.7715 228.171 0 183.399 0 128.171C0 72.9422 44.7715 28.1707 100 28.1707C155.228 28.1707 200 72.9422 200 128.171Z" fill="#D9D9D9"/>
                <path d="M192 127.671C192 178.757 150.586 220.171 99.5 220.171C48.4137 220.171 7 178.757 7 127.671C7 76.5844 48.4137 35.1707 99.5 35.1707C150.586 35.1707 192 76.5844 192 127.671Z" fill="#B3D966"/>
                <path d="M261 234.171C261 289.399 216.228 334.171 161 334.171C105.772 334.171 61 289.399 61 234.171C61 178.942 105.772 134.171 161 134.171C216.228 134.171 261 178.942 261 234.171Z" fill="#D9D9D9"/>
                <path d="M253 233.671C253 284.757 211.586 326.171 160.5 326.171C109.414 326.171 68 284.757 68 233.671C68 182.584 109.414 141.171 160.5 141.171C211.586 141.171 253 182.584 253 233.671Z" fill="#B3D966"/>
                <path d="M326 135.171C326 190.399 281.228 235.171 226 235.171C170.772 235.171 126 190.399 126 135.171C126 79.9422 170.772 35.1707 226 35.1707C281.228 35.1707 326 79.9422 326 135.171Z" fill="#D9D9D9"/>
                <path d="M318 134.671C318 185.757 276.586 227.171 225.5 227.171C174.414 227.171 133 185.757 133 134.671C133 83.5844 174.414 42.1707 225.5 42.1707C276.586 42.1707 318 83.5844 318 134.671Z" fill="#B3D966"/>
                <path d="M148.5 20.0008C147.119 17.6094 147.939 14.5514 150.33 13.1707L171.981 0.670708C174.372 -0.710004 177.43 0.109372 178.811 2.50083L191.311 24.1515C192.692 26.5429 191.872 29.6009 189.481 30.9816L167.83 43.4816C165.439 44.8623 162.381 44.0429 161 41.6515L148.5 20.0008Z" fill="#C96464"/>
              </svg>
              <h1 className="text-4xl font-bold text-[#558B2F] mb-3">포도 상점</h1>
              <p className="text-lg text-[#7CB342]">내 사진이 돈이 되는 순간</p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setAuthMode('signin')
                  setEmailMode('signin')
                  setStep('select')
                }}
                className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] text-white font-bold py-6 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-xl"
              >
                로그인
              </button>

              <button
                onClick={() => {
                  setAuthMode('signup')
                  setEmailMode('signup')
                  setStep('select')
                }}
                className="w-full bg-white hover:bg-gray-50 border-2 border-[#B3D966] text-[#558B2F] font-bold py-6 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 text-xl"
              >
                회원가입
              </button>
            </div>

            {onBack && (
              <div className="text-center mt-6">
                <button
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-800 underline font-medium"
                >
                  로그인 없이 둘러보기
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 1: 방식 선택 */}
        {step === 'select' && (
          <div className="animate-fadeIn relative">
            
            {/* 뒤로가기 버튼 */}
            {onBack && (
              <button
                onClick={onBack}
                className="absolute top-0 left-0 flex items-center gap-2 text-gray-600 hover:text-[#558B2F] transition-colors p-2 rounded-lg hover:bg-white/50"
              >
                <span className="text-2xl">↩</span>
              </button>
            )}

            {/* 헤더 - 로고 */}
            <div className="text-center mb-12">
              <svg width="120" height="123" viewBox="0 0 326 335" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-6 animate-bounce-slow">
                <path d="M200 128.171C200 183.399 155.228 228.171 100 228.171C44.7715 228.171 0 183.399 0 128.171C0 72.9422 44.7715 28.1707 100 28.1707C155.228 28.1707 200 72.9422 200 128.171Z" fill="#D9D9D9"/>
                <path d="M192 127.671C192 178.757 150.586 220.171 99.5 220.171C48.4137 220.171 7 178.757 7 127.671C7 76.5844 48.4137 35.1707 99.5 35.1707C150.586 35.1707 192 76.5844 192 127.671Z" fill="#B3D966"/>
                <path d="M261 234.171C261 289.399 216.228 334.171 161 334.171C105.772 334.171 61 289.399 61 234.171C61 178.942 105.772 134.171 161 134.171C216.228 134.171 261 178.942 261 234.171Z" fill="#D9D9D9"/>
                <path d="M253 233.671C253 284.757 211.586 326.171 160.5 326.171C109.414 326.171 68 284.757 68 233.671C68 182.584 109.414 141.171 160.5 141.171C211.586 141.171 253 182.584 253 233.671Z" fill="#B3D966"/>
                <path d="M326 135.171C326 190.399 281.228 235.171 226 235.171C170.772 235.171 126 190.399 126 135.171C126 79.9422 170.772 35.1707 226 35.1707C281.228 35.1707 326 79.9422 326 135.171Z" fill="#D9D9D9"/>
                <path d="M318 134.671C318 185.757 276.586 227.171 225.5 227.171C174.414 227.171 133 185.757 133 134.671C133 83.5844 174.414 42.1707 225.5 42.1707C276.586 42.1707 318 83.5844 318 134.671Z" fill="#B3D966"/>
                <path d="M148.5 20.0008C147.119 17.6094 147.939 14.5514 150.33 13.1707L171.981 0.670708C174.372 -0.710004 177.43 0.109372 178.811 2.50083L191.311 24.1515C192.692 26.5429 191.872 29.6009 189.481 30.9816L167.83 43.4816C165.439 44.8623 162.381 44.0429 161 41.6515L148.5 20.0008Z" fill="#C96464"/>
              </svg>
              <h1 className="text-4xl font-bold text-[#558B2F] mb-3">포도 상점</h1>
              <p className="text-lg text-[#7CB342]">내 사진이 돈이 되는 순간</p>
            </div>

            {/* 로그인 방식 선택 */}
            <div className="space-y-4">
              
              {/* Google */}
              <button
                onClick={() => handleAuthButtonClick(() => {
                  setStep('google')
                  handleGoogleLogin()
                })}
                disabled={loading || (authMode === 'signup' && (!termsAccepted || !privacyAccepted))}
                className="w-full bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-400 text-gray-800 font-bold py-5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-lg"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google로 시작하기
              </button>

              {/* Kakao */}
              <button
                onClick={() => handleAuthButtonClick(() => {
                  setStep('kakao')
                  handleKakaoLogin()
                })}
                disabled={loading || (authMode === 'signup' && (!termsAccepted || !privacyAccepted))}
                className="w-full bg-[#FEE500] hover:bg-[#FDD835] text-gray-800 font-bold py-5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-lg"
              >
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#000000" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
                Kakao로 시작하기
              </button>

              {/* Email - 그린 */}
              <button
               onClick={() => handleAuthButtonClick(() => setStep('email'))}
               disabled={loading || (authMode === 'signup' && (!termsAccepted || !privacyAccepted))}
               className="w-full bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-500 hover:to-cyan-600 border-2 border-cyan-500 text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-lg"
              >
              <Mail className="w-7 h-7 text-white" />
              이메일로 시작하기
              </button>

              {/* Phone - 연한 그린 */}
              <button
                onClick={() => handleAuthButtonClick(() => setStep('phone'))}
                disabled={loading || !termsAccepted || !privacyAccepted}
              className="w-full bg-gradient-to-r from-sky-400 to-sky-500 hover:from-sky-500 hover:to-sky-600 border-2 border-sky-500 text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 text-lg"
              >
              <Phone className="w-7 h-7 text-white" />
              전화번호로 시작하기
            </button>
            </div>

            {/* 약관 안내 - 회원가입일 때만 표시 */}
            {authMode === 'signup' && (
              <div className="text-center text-sm text-gray-500 mt-8 space-y-2">
                <p>
                  가입 전{' '}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setShowTerms(true)
                    }}
                    className="text-orange-600 hover:text-orange-700 hover:underline font-medium"
                  >
                    이용약관
                  </button>
                  {termsAccepted && <span className="text-green-600 ml-1">✓</span>}
                  {' '}및{' '}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      setShowPrivacy(true)
                    }}
                    className="text-orange-600 hover:text-orange-700 hover:underline font-medium"
                  >
                    개인정보처리방침
                  </button>
                  {privacyAccepted && <span className="text-green-600 ml-1">✓</span>}
                  을 확인해 주세요.
                </p>
              </div>
            )}

            {/* 로그인 없이 둘러보기 */}
            <div className="text-center text-sm text-gray-500 mt-6 space-y-2">
              
              {/* 로그인 없이 둘러보기 */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-gray-600 hover:text-gray-800 underline font-medium"
                >
                  로그인 없이 둘러보기
                </button>
              )}
            </div>
          </div>
        )}

        {/* 약관 모달들 */}
        <TermsModal 
          isOpen={showTerms} 
          onClose={() => setShowTerms(false)}
          onScrollComplete={handleScrollComplete}
        />
        <PrivacyModal 
          isOpen={showPrivacy} 
          onClose={() => setShowPrivacy(false)}
          onScrollComplete={handleScrollComplete}
        />

        {/* Step 2: 이메일 입력 */}
        {step === 'email' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slideIn">
            {/* 뒤로가기 */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-600 hover:text-[#558B2F] mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>뒤로</span>
            </button>

            {/* 헤더 */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🍇</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {emailMode === 'signup' ? '회원가입' : '로그인'}
              </h2>
              <p className="text-gray-600">이메일로 {emailMode === 'signup' ? '가입' : '로그인'}하세요</p>
            </div>

            {/* 로그인/회원가입 토글 */}
            <div className="flex gap-2 mb-6 bg-[#F1F8E9] rounded-xl p-1">
              <button
                onClick={() => setEmailMode('signin')}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                  emailMode === 'signin'
                    ? 'bg-white text-[#558B2F] shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                로그인
              </button>
              <button
                onClick={() => setEmailMode('signup')}
                className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                  emailMode === 'signup'
                    ? 'bg-white text-[#558B2F] shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                회원가입
              </button>
            </div>

            {/* 폼 */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {emailMode === 'signup' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">이름</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="이름"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B3D966] focus:border-transparent transition-all"
                      required={emailMode === 'signup'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">이메일</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B3D966] focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B3D966] focus:border-transparent transition-all"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {emailMode === 'signup' && (
                  <p className="text-xs text-gray-500 mt-2">6자 이상 입력해주세요</p>
                )}
              </div>

              {message.text && (
                <div className={`p-3 rounded-xl text-sm font-medium ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border-2 border-green-200'
                    : 'bg-red-50 text-red-700 border-2 border-red-200'
                }`}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] hover:from-[#9DC183] hover:to-[#8FB573] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '처리 중...' : emailMode === 'signup' ? '회원가입' : '로그인'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: 전화번호 입력 */}
        {step === 'phone' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slideIn">
            {/* 뒤로가기 */}
            <button
              onClick={() => {
                if (phoneStep === 'code') {
                  setPhoneStep('phone')
                  setMessage({ type: '', text: '' })
                } else {
                  handleBack()
                }
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-[#558B2F] mb-6 transition-colors"
            >
              <ArrowLeft size={20} />
              <span>뒤로</span>
            </button>

            {/* 헤더 */}
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🍇</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {phoneStep === 'phone' ? '전화번호 인증' : '인증코드 입력'}
              </h2>
              <p className="text-gray-600">
                {phoneStep === 'phone' ? '전화번호를 입력하세요' : '문자로 받은 코드를 입력하세요'}
              </p>
            </div>

            {phoneStep === 'phone' ? (
              <form onSubmit={handleSendCode} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">전화번호</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      placeholder="010-1234-5678"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B3D966] focus:border-transparent transition-all text-lg"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">하이픈(-) 포함 또는 제외 가능</p>
                </div>

                {message.text && (
                  <div className={`p-3 rounded-xl text-sm font-medium ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-700 border-2 border-green-200'
                      : 'bg-red-50 text-red-700 border-2 border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] hover:from-[#9DC183] hover:to-[#8FB573] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '발송 중...' : '인증코드 받기'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">인증코드</label>
                  <input
                    type="text"
                    placeholder="000000"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B3D966] focus:border-transparent text-center text-3xl tracking-widest font-bold transition-all"
                    maxLength={6}
                    required
                  />
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    {formData.phone}로 발송됨
                  </p>
                </div>

                {message.text && (
                  <div className={`p-3 rounded-xl text-sm font-medium ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-700 border-2 border-green-200'
                      : 'bg-red-50 text-red-700 border-2 border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] hover:from-[#9DC183] hover:to-[#8FB573] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '확인 중...' : '인증하기'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* CSS 애니메이션 */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }

        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}