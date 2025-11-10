// src/components/FilteredInput.jsx - 욕설 필터링이 적용된 재사용 가능한 입력 컴포넌트
import { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { validateNickname, validateContent, validatePhotoTitle } from '../utils/profanityFilter'

/**
 * 욕설 필터링이 적용된 입력 컴포넌트
 * 
 * @param {string} type - 'text' | 'textarea' | 'nickname' | 'title'
 * @param {string} value - 입력값
 * @param {function} onChange - 값 변경 핸들러
 * @param {string} placeholder - 플레이스홀더
 * @param {number} maxLength - 최대 길이
 * @param {number} minLength - 최소 길이
 * @param {boolean} required - 필수 여부
 * @param {string} label - 레이블
 * @param {number} rows - textarea의 행 수
 */
export default function FilteredInput({
  type = 'text',
  value = '',
  onChange,
  placeholder = '',
  maxLength = 100,
  minLength = 2,
  required = false,
  label = '',
  rows = 4,
  className = '',
  ...props
}) {
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState(false)
  const [touched, setTouched] = useState(false)

  // 실시간 검증
  useEffect(() => {
    if (!touched || !value) {
      setError('')
      setIsValid(false)
      return
    }

    let validation
    
    switch (type) {
      case 'nickname':
        validation = validateNickname(value)
        break
      case 'title':
        validation = validatePhotoTitle(value)
        break
      case 'content':
      case 'textarea':
        validation = validateContent(value, minLength, maxLength)
        break
      default:
        validation = validateContent(value, minLength, maxLength)
    }

    setError(validation.isValid ? '' : validation.message)
    setIsValid(validation.isValid)
  }, [value, type, minLength, maxLength, touched])

  const handleChange = (e) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      onChange(e)
    }
  }

  const handleBlur = () => {
    setTouched(true)
  }

  const inputClasses = `w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all ${
    error
      ? 'border-red-300 focus:ring-red-200'
      : touched && isValid
      ? 'border-green-300 focus:ring-green-200'
      : 'border-gray-200 focus:ring-[#B3D966]'
  } ${className}`

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-bold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {type === 'textarea' || type === 'content' ? (
        <textarea
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          className={`${inputClasses} resize-none`}
          {...props}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={inputClasses}
          {...props}
        />
      )}

      {/* 에러/성공 메시지 */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex-1">
          {error && touched && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {!error && touched && isValid && value && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle size={16} />
              <span>사용 가능합니다</span>
            </div>
          )}
        </div>

        {/* 글자 수 카운터 */}
        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  )
}

/**
 * 간단한 사용 예제:
 * 
 * // 닉네임 입력
 * <FilteredInput
 *   type="nickname"
 *   value={nickname}
 *   onChange={(e) => setNickname(e.target.value)}
 *   label="닉네임"
 *   placeholder="닉네임을 입력하세요"
 *   maxLength={20}
 *   required
 * />
 * 
 * // 게시글 제목
 * <FilteredInput
 *   type="title"
 *   value={title}
 *   onChange={(e) => setTitle(e.target.value)}
 *   label="제목"
 *   placeholder="제목을 입력하세요"
 *   maxLength={100}
 *   required
 * />
 * 
 * // 게시글 내용
 * <FilteredInput
 *   type="content"
 *   value={content}
 *   onChange={(e) => setContent(e.target.value)}
 *   label="내용"
 *   placeholder="내용을 입력하세요"
 *   rows={8}
 *   maxLength={2000}
 *   minLength={5}
 *   required
 * />
 */