// src/components/common/LoadingSpinner.jsx - 로딩 스피너 컴포넌트

export default function LoadingSpinner({ message = '로딩중...', size = 'default' }) {
  const sizeClasses = {
    small: 'w-8 h-8 border-2',
    default: 'w-16 h-16 border-4',
    large: 'w-24 h-24 border-4'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F1F8E9] via-white to-[#E8F5E9]">
      <div className="text-center">
        <div
          className={`${sizeClasses[size]} border-[#B3D966] border-t-transparent rounded-full animate-spin mx-auto mb-4`}
        ></div>
        {message && <p className="text-gray-600">{message}</p>}
      </div>
    </div>
  )
}
