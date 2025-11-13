// src/components/PasswordStrengthMeter.jsx - 비밀번호 강도 표시
import {
  getPasswordStrength,
  getPasswordStrengthText,
  getPasswordStrengthColor,
  getPasswordStrengthBgColor
} from '../utils/passwordValidator'

export default function PasswordStrengthMeter({ password }) {
  if (!password) return null

  const strength = getPasswordStrength(password)
  const strengthText = getPasswordStrengthText(strength)
  const textColor = getPasswordStrengthColor(strength)
  const bgColor = getPasswordStrengthBgColor(strength)

  return (
    <div className="space-y-2">
      {/* 강도 바 */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              level <= strength ? bgColor : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* 강도 텍스트 */}
      <div className={`text-xs font-semibold ${textColor} transition-colors duration-300`}>
        비밀번호 강도: {strengthText}
      </div>
    </div>
  )
}
