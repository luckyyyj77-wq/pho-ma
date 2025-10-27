// src/hooks/useAuth.js
// AuthContext를 편하게 사용하기 위한 hook

import { useAuth as useAuthContext } from '../contexts/AuthContext'

export function useAuth() {
  return useAuthContext()
}