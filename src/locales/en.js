// src/locales/en.js
// English messages

export const en = {
  auth: {
    // Success messages
    loginSuccess: '✅ Login successful!',
    signupSuccess: '🎉 Signup successful!\n\n1,000 points have been credited!\n\nPlease login now.',
    
    // Validation errors
    nicknameRequired: 'Please enter your nickname.',
    nicknameMinLength: 'Nickname must be at least 2 characters.',
    passwordMinLength: 'Password must be at least 8 characters.',
    passwordComplexity: 'Password must include letters, numbers, and special characters (@$!%*#?&).',
    
    // Supabase error mapping
    'Invalid login credentials': 'Invalid email or password.',
    'Email not confirmed': 'Email not verified. Please check your email.',
    'User already registered': 'This email is already registered.',
    'Password should be at least 6 characters': 'Password must be at least 6 characters.',
    'Unable to validate email address: invalid format': 'Invalid email format.',
    'Signup requires a valid password': 'Please enter a valid password.',
    'Email rate limit exceeded': 'Too many requests. Please try again later.',
    
    // Default error
    unknownError: 'An unknown error occurred. Please try again.'
  }
}
