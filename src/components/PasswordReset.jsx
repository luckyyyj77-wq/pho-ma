// src/components/PasswordReset.jsx - 비밀번호 재설정
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'

export default function PasswordReset({ onBack }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [step, setStep] = useState('request') // 'request' or 'sent'

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error

      setStep('sent')
      setMessage({
        type: 'success',
        text: '비밀번호 재설정 링크가 이메일로 전송되었습니다.'
      })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || '이메일 전송에 실패했습니다.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* 뒤로가기 */}
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">뒤로</span>
          </button>

          {step === 'request' ? (
            <>
              {/* 헤더 */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-[#B3D966] to-[#9DC183] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-white" size={32} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">
                  비밀번호 재설정
                </h2>
                <p className="text-gray-600 text-sm">
                  가입하신 이메일 주소를 입력해주세요.
                  <br />
                  비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>

              {/* 폼 */}
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    이메일
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#B3D966] focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>

                {message.text && (
                  <div
                    className={`p-3 rounded-xl text-sm font-medium flex items-start gap-2 ${
                      message.type === 'success'
                        ? 'bg-green-50 text-green-700 border-2 border-green-200'
                        : 'bg-red-50 text-red-700 border-2 border-red-200'
                    }`}
                  >
                    {message.type === 'success' ? (
                      <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#B3D966] to-[#9DC183] hover:from-[#9DC183] hover:to-[#8FB573] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '전송 중...' : '재설정 링크 받기'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* 전송 완료 */}
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-green-600" size={40} />
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-4">
                  이메일을 확인하세요
                </h2>

                <p className="text-gray-600 mb-2">
                  <span className="font-semibold text-gray-900">{email}</span>
                  <br />
                  주소로 비밀번호 재설정 링크를 보냈습니다.
                </p>

                <p className="text-sm text-gray-500 mb-8">
                  이메일이 오지 않았나요? 스팸 메일함을 확인해보세요.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setStep('request')
                      setEmail('')
                      setMessage({ type: '', text: '' })
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
                  >
                    다시 보내기
                  </button>

                  <button
                    onClick={onBack}
                    className="w-full text-gray-600 hover:text-gray-900 font-semibold py-3 transition-colors"
                  >
                    로그인으로 돌아가기
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 도움말 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            문제가 있으신가요?{' '}
            <button className="text-[#558B2F] font-semibold hover:underline">
              고객센터
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
