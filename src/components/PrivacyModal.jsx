// src/components/PrivacyModal.jsx
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PrivacyModal({ isOpen, onClose, onScrollComplete }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  // 스크롤 감지
  const handleScroll = (e) => {
    const element = e.target
    const bottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10
    
    if (bottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
      if (onScrollComplete) {
        onScrollComplete('privacy')
      }
    }
  }

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
      setHasScrolledToBottom(false) // 모달 열릴 때 초기화
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <h2 className="text-2xl font-bold text-gray-800">개인정보처리방침</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* 스크롤 안내 */}
        {!hasScrolledToBottom && (
          <div className="bg-blue-100 border-b-2 border-blue-300 px-6 py-3">
            <p className="text-sm text-blue-800 font-semibold text-center">
              ⬇️ 개인정보처리방침을 끝까지 스크롤하여 읽어주세요
            </p>
          </div>
        )}

        {/* 내용 */}
        <div 
          className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]"
          onScroll={handleScroll}
        >
          <div className="prose prose-sm max-w-none">
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
              <p className="text-sm text-gray-700 font-medium">
                최종 수정일: 2025년 10월 27일
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed mb-6">
              포마(이하 "회사")는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수하고 있습니다.
            </p>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">1. 수집하는 개인정보 항목</h3>
            
            <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">1) 회원가입 시</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li><strong>필수항목:</strong> 이메일, 비밀번호, 이름</li>
              <li><strong>선택항목:</strong> 프로필 사진, 전화번호</li>
              <li><strong>자동수집:</strong> IP주소, 쿠키, 접속로그, 기기정보</li>
            </ul>

            <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">2) 소셜 로그인 시</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li><strong>Google:</strong> 이메일, 이름, 프로필 사진</li>
              <li><strong>Kakao:</strong> 이메일, 닉네임, 프로필 사진</li>
            </ul>

            <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">3) 거래 시</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>결제정보 (결제수단, 거래내역)</li>
              <li>정산정보 (계좌번호, 예금주명)</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">2. 개인정보의 수집 및 이용 목적</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>회원관리:</strong> 본인확인, 회원제 서비스 제공, 고지사항 전달</li>
              <li><strong>서비스 제공:</strong> 사진 경매 서비스, 결제 및 정산, 콘텐츠 제공</li>
              <li><strong>마케팅:</strong> 신규 서비스 안내, 이벤트 정보 제공 (선택)</li>
              <li><strong>서비스 개선:</strong> 통계분석, 서비스 품질 향상</li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">3. 개인정보의 보유 및 이용 기간</h3>
            
            <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">1) 회원 정보</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>회원 탈퇴 시까지 보유</li>
              <li>탈퇴 후 즉시 삭제 (단, 관계 법령에 의해 보존 필요 시 일정 기간 보관)</li>
            </ul>

            <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">2) 법령에 따른 보관</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 (전자상거래법)</li>
              <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래법)</li>
              <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래법)</li>
              <li><strong>접속로그 기록:</strong> 3개월 (통신비밀보호법)</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">4. 개인정보의 제3자 제공</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 
              다만, 다음의 경우는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의하거나 수사기관의 요청이 있는 경우</li>
              <li>결제 처리를 위한 필수적인 경우 (PG사 등)</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">5. 개인정보 처리 위탁</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              회사는 서비스 제공을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다:
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg my-4">
              <table className="w-full text-sm">
                <thead className="border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left py-2 px-2">수탁업체</th>
                    <th className="text-left py-2 px-2">위탁업무</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2">AWS / Supabase</td>
                    <td className="py-2 px-2">서버 및 데이터베이스 운영</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2">PG사 (아임포트 등)</td>
                    <td className="py-2 px-2">결제 처리</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-2 px-2">Cloudflare</td>
                    <td className="py-2 px-2">CDN 및 이미지 저장</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">6. 이용자의 권리와 행사 방법</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정 요구</li>
              <li>개인정보 삭제 요구</li>
              <li>개인정보 처리 정지 요구</li>
              <li>회원 탈퇴 (서비스 내 설정 또는 고객센터)</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">7. 개인정보 보호를 위한 기술적/관리적 대책</h3>
            
            <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">1) 기술적 대책</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>개인정보 암호화 (비밀번호 해싱, 통신 SSL 암호화)</li>
              <li>해킹 방지 (방화벽, 침입탐지시스템)</li>
              <li>백업 및 복구 시스템</li>
            </ul>

            <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">2) 관리적 대책</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
              <li>개인정보 접근 권한 최소화</li>
              <li>정기적인 보안 교육</li>
              <li>개인정보 취급자 지정 및 관리</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">8. 쿠키(Cookie)의 운영</h3>
            <p className="text-gray-700 leading-relaxed mb-2">
              회사는 서비스 제공을 위해 쿠키를 사용합니다:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
              <li><strong>사용 목적:</strong> 로그인 상태 유지, 맞춤형 서비스 제공</li>
              <li><strong>거부 방법:</strong> 브라우저 설정에서 쿠키 차단 가능</li>
              <li><strong>주의사항:</strong> 쿠키 차단 시 일부 서비스 이용 제한될 수 있음</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">9. 개인정보 보호책임자</h3>
            <div className="bg-orange-50 p-4 rounded-lg my-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>개인정보 보호책임자:</strong> [책임자명]<br/>
                <strong>이메일:</strong> privacy@phoma.com<br/>
                <strong>전화:</strong> 02-XXXX-XXXX<br/>
                <strong>부서:</strong> 개인정보보호팀
              </p>
            </div>
            <p className="text-gray-700 leading-relaxed text-sm">
              개인정보 침해에 대한 신고나 상담이 필요하신 경우:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4 text-sm">
              <li>개인정보침해신고센터: privacy.kisa.or.kr (국번없이 118)</li>
              <li>대검찰청 사이버범죄수사단: www.spo.go.kr (국번없이 1301)</li>
              <li>경찰청 사이버안전국: cyberbureau.police.go.kr (국번없이 182)</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">10. 개인정보처리방침의 변경</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              본 개인정보처리방침은 2025년 10월 27일부터 시행됩니다. 
              법령, 정책 또는 보안기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있으며, 
              변경 시 최소 7일 전 공지사항을 통해 알려드립니다.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mt-8">
              <p className="text-sm text-gray-600">
                <strong>문의:</strong> privacy@phoma.com<br/>
                <strong>사업자:</strong> 포마 주식회사<br/>
                <strong>시행일:</strong> 2025년 10월 27일
              </p>
            </div>

            {/* 스크롤 완료 버튼 */}
            {hasScrolledToBottom && (
              <button
                onClick={() => {
                  if (onScrollComplete) onScrollComplete('privacy')
                  onClose()
                }}
                className="w-full bg-green-50 hover:bg-green-100 border-2 border-green-400 hover:border-green-500 p-4 rounded-lg mt-6 text-center transition-all cursor-pointer"
              >
                <p className="text-green-700 font-bold">
                  ✅ 개인정보처리방침을 모두 읽었습니다
                </p>
             
              </button>
            )}

          </div>
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          {hasScrolledToBottom ? (
            <button
              onClick={() => {
                if (onScrollComplete) onScrollComplete('privacy')
                onClose()
              }}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              ✓ 개인정보처리방침을 확인하였습니다
            </button>
          ) : (
            <button
              disabled
              className="w-full px-6 py-3.5 bg-gray-200 text-gray-400 font-semibold rounded-xl cursor-not-allowed"
            >
              ⬇️ 끝까지 스크롤해주세요
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}