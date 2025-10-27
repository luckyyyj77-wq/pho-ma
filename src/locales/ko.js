// src/locales/ko.js
// 한국어 메시지

export const ko = {
  auth: {
    // 성공 메시지
    loginSuccess: '✅ 로그인 성공!',
    signupSuccess: '🎉 회원가입 성공!\n\n가입 축하 1,000P가 지급되었습니다!\n\n이제 로그인해주세요.',
    
    // 입력 검증 에러
    nicknameRequired: '닉네임을 입력해주세요.',
    nicknameMinLength: '닉네임은 최소 2자 이상이어야 합니다.',
    passwordMinLength: '비밀번호는 최소 8자 이상이어야 합니다.',
    passwordComplexity: '비밀번호는 영문, 숫자, 특수문자(@$!%*#?&)를 포함해야 합니다.',
    
    // Supabase 에러 매핑
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
    'Email not confirmed': '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.',
    'User already registered': '이미 가입된 이메일입니다.',
    'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
    'Unable to validate email address: invalid format': '이메일 형식이 올바르지 않습니다.',
    'Signup requires a valid password': '유효한 비밀번호를 입력해주세요.',
    'Email rate limit exceeded': '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
    
    // 기본 에러
    unknownError: '알 수 없는 오류가 발생했습니다. 다시 시도해주세요.'
  }
}
