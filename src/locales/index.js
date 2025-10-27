// src/locales/index.js
// 다국어 지원 유틸리티

import { ko } from './ko'
import { en } from './en'

// 현재 언어 (기본값: 한국어)
// 나중에 localStorage나 user 설정에서 가져올 수 있음
let currentLanguage = 'ko'

const messages = {
  ko,
  en
}

// 언어 변경 함수
export function setLanguage(lang) {
  if (messages[lang]) {
    currentLanguage = lang
    // localStorage에 저장 (선택사항)
    localStorage.setItem('language', lang)
  }
}

// 언어 가져오기
export function getLanguage() {
  // localStorage에서 먼저 확인
  const savedLang = localStorage.getItem('language')
  if (savedLang && messages[savedLang]) {
    currentLanguage = savedLang
  }
  return currentLanguage
}

// 메시지 가져오기
export function t(key) {
  const lang = getLanguage()
  const keys = key.split('.')
  let message = messages[lang]
  
  for (const k of keys) {
    message = message?.[k]
  }
  
  return message || key
}

// 에러 메시지 변환 (Supabase 에러 → 한글)
export function translateError(error) {
  const lang = getLanguage()
  const errorMessage = error?.message || error
  
  // auth 에러 메시지에서 찾기
  const translated = messages[lang]?.auth?.[errorMessage]
  
  // 번역된 메시지가 있으면 반환, 없으면 기본 에러 메시지
  return translated || messages[lang]?.auth?.unknownError || errorMessage
}

// 초기화 (앱 시작 시 호출)
export function initLanguage() {
  const savedLang = localStorage.getItem('language')
  if (savedLang && messages[savedLang]) {
    currentLanguage = savedLang
  } else {
    // 브라우저 언어 감지
    const browserLang = navigator.language.split('-')[0]
    if (messages[browserLang]) {
      currentLanguage = browserLang
      localStorage.setItem('language', browserLang)
    }
  }

}

// 파일 로드 시 자동 초기화
initLanguage()


