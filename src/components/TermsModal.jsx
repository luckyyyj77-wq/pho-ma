// src/components/TermsModal.jsx
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function TermsModal({ isOpen, onClose, onScrollComplete }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  // 스크롤 감지
  const handleScroll = (e) => {
    const element = e.target
    const bottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10
    
    if (bottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
      if (onScrollComplete) {
        onScrollComplete('terms')
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
            <span className="text-2xl">📋</span>
            <h2 className="text-2xl font-bold text-gray-800">이용약관</h2>
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
          <div className="bg-orange-100 border-b-2 border-orange-300 px-6 py-3">
            <p className="text-sm text-orange-800 font-semibold text-center">
              ⬇️ 약관을 끝까지 스크롤하여 읽어주세요
            </p>
          </div>
        )}

        {/* 내용 */}
        <div 
          className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]"
          onScroll={handleScroll}
        >
          <div className="prose prose-sm max-w-none">
            
            <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded">
              <p className="text-sm text-gray-700 font-medium">
                최종 수정일: 2025년 10월 27일
              </p>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제1조 (목적)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              본 약관은 포마(이하 "회사")가 운영하는 사진 저작권 경매 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 
              회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제2조 (정의)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>"서비스"란 회사가 제공하는 사진 저작권 경매 및 관련 서비스를 의미합니다.</li>
              <li>"회원"이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 자를 말합니다.</li>
              <li>"판매자"란 서비스를 통해 사진을 업로드하고 판매하는 회원을 말합니다.</li>
              <li>"구매자"란 서비스를 통해 사진을 구매하는 회원을 말합니다.</li>
              <li>"콘텐츠"란 회원이 서비스에 게시한 사진, 텍스트, 링크 등을 말합니다.</li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제3조 (약관의 효력 및 변경)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>본 약관은 서비스를 이용하고자 하는 모든 회원에게 그 효력이 발생합니다.</li>
              <li>회사는 필요한 경우 관련 법령을 위반하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
              <li>약관이 변경되는 경우 회사는 변경사항을 시행일자 7일 전부터 공지합니다.</li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제4조 (회원가입)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>회원가입은 이용자가 약관의 내용에 동의하고 회사가 정한 절차에 따라 가입신청을 하는 것으로 이루어집니다.</li>
              <li>회사는 다음 각 호에 해당하는 경우 회원가입을 거절할 수 있습니다:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>타인의 명의를 이용한 경우</li>
                  <li>허위 정보를 기재한 경우</li>
                  <li>14세 미만인 경우</li>
                  <li>이전에 회원자격을 상실한 적이 있는 경우</li>
                </ul>
              </li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제5조 (서비스의 제공)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>회사는 다음과 같은 서비스를 제공합니다:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>사진 저작권 경매 서비스</li>
                  <li>사진 업로드 및 관리 서비스</li>
                  <li>결제 및 정산 서비스</li>
                  <li>회원 간 소통 서비스</li>
                </ul>
              </li>
              <li>서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다.</li>
              <li>회사는 시스템 점검, 보수 등의 사유로 서비스 제공을 일시적으로 중단할 수 있습니다.</li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제6조 (저작권 및 콘텐츠)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>회원이 업로드한 콘텐츠의 저작권은 해당 회원에게 있습니다.</li>
              <li>회원은 업로드하는 콘텐츠에 대한 적법한 권리를 보유해야 합니다.</li>
              <li>회사는 서비스 제공을 위해 필요한 범위 내에서 콘텐츠를 사용할 수 있습니다.</li>
              <li>타인의 저작권을 침해하는 콘텐츠는 사전 통보 없이 삭제될 수 있습니다.</li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제7조 (거래 및 수수료)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>회사는 거래 성사 시 거래금액의 10%를 수수료로 부과합니다.</li>
              <li>판매자는 낙찰 후 3영업일 이내에 저작권 이전 절차를 완료해야 합니다.</li>
              <li>구매자는 결제 후 7일 이내에 하자가 있는 경우 환불을 요청할 수 있습니다.</li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제8조 (회원의 의무)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>회원은 다음 행위를 하여서는 안 됩니다:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li>타인의 정보 도용</li>
                  <li>허위 정보 게시</li>
                  <li>타인의 저작권 침해</li>
                  <li>음란물, 불법 콘텐츠 게시</li>
                  <li>서비스 운영 방해</li>
                  <li>부정한 방법으로 경매 참여</li>
                </ul>
              </li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제9조 (서비스 이용 제한)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>회사는 회원이 본 약관을 위반한 경우 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.</li>
              <li>이용 제한 시 회사는 해당 회원에게 이메일 등으로 통지합니다.</li>
              <li>회원은 이용 제한에 대해 이의가 있는 경우 이의신청을 할 수 있습니다.</li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제10조 (면책조항)</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700 ml-4">
              <li>회사는 천재지변, 전쟁, 불가항력 등으로 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
              <li>회사는 회원 간 거래에서 발생한 분쟁에 대해 책임을 지지 않습니다.</li>
              <li>회사는 회원이 게시한 정보의 신뢰도, 정확성에 대해 책임을 지지 않습니다.</li>
            </ol>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">제11조 (분쟁 해결)</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              본 약관과 관련된 분쟁은 대한민국 법률에 따라 해결하며, 
              관할법원은 회사의 본사 소재지를 관할하는 법원으로 합니다.
            </p>

            <h3 className="text-lg font-bold text-gray-800 mt-6 mb-3">부칙</h3>
            <p className="text-gray-700 leading-relaxed">
              본 약관은 2025년 10월 27일부터 시행됩니다.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mt-8">
              <p className="text-sm text-gray-600">
                <strong>문의:</strong> support@phoma.com<br/>
                <strong>사업자:</strong> 포마 주식회사<br/>
                <strong>대표:</strong> [대표자명]
              </p>
            </div>

            {/* 스크롤 완료 버튼 */}
            {hasScrolledToBottom && (
              <button
                onClick={() => {
                  if (onScrollComplete) onScrollComplete('terms')
                  onClose()
                }}
                className="w-full bg-green-50 hover:bg-green-100 border-2 border-green-400 hover:border-green-500 p-4 rounded-lg mt-6 text-center transition-all cursor-pointer"
              >
                <p className="text-green-700 font-bold">
                  ✅ 약관을 모두 읽었습니다
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
                if (onScrollComplete) onScrollComplete('terms')
                onClose()
              }}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              ✓ 이용약관을 확인하였습니다
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