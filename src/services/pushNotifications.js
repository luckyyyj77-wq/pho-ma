// ============================================
// FCM 푸시 알림 서비스 (비활성화)
// ============================================
// 나중에 사용자가 많아졌을 때 활성화하세요
//
// 활성화 방법:
// 1. Firebase 프로젝트 생성: https://console.firebase.google.com/
// 2. 앱에 Firebase 추가
// 3. FCM 설정 및 서비스 워커 등록
// 4. 아래 주석 해제
// 5. npm install firebase 실행

/*
// Firebase 설정
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

// Firebase 설정 (Firebase 콘솔에서 복사)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

// Firebase 초기화
const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

// VAPID 키 (Firebase 콘솔의 Cloud Messaging 설정에서 생성)
const VAPID_KEY = 'YOUR_VAPID_PUBLIC_KEY'

// 푸시 알림 권한 요청 및 토큰 가져오기
export const requestNotificationPermission = async () => {
  try {
    // 브라우저 알림 권한 요청
    const permission = await Notification.requestPermission()

    if (permission === 'granted') {
      console.log('✅ 알림 권한 허용')

      // FCM 토큰 가져오기
      const token = await getToken(messaging, { vapidKey: VAPID_KEY })

      if (token) {
        console.log('📱 FCM 토큰:', token)

        // 토큰을 Supabase에 저장
        await saveFCMTokenToDatabase(token)

        return token
      } else {
        console.log('❌ FCM 토큰 가져오기 실패')
        return null
      }
    } else {
      console.log('❌ 알림 권한 거부')
      return null
    }
  } catch (error) {
    console.error('❌ 알림 권한 요청 오류:', error)
    return null
  }
}

// FCM 토큰을 Supabase에 저장
const saveFCMTokenToDatabase = async (token) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('id', user.id)

      if (error) throw error

      console.log('✅ FCM 토큰 저장 완료')
    }
  } catch (error) {
    console.error('❌ FCM 토큰 저장 오류:', error)
  }
}

// 포그라운드 메시지 수신 (앱이 열려있을 때)
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📨 포그라운드 메시지 수신:', payload)
      resolve(payload)
    })
  })
}

// 푸시 알림 전송 (서버 사이드 - Supabase Edge Function)
// 이 함수는 Supabase Edge Function으로 구현해야 합니다
export const sendPushNotification = async (userId, title, body, data) => {
  try {
    // Supabase Edge Function 호출
    const { data: result, error } = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId,
        title,
        body,
        data
      }
    })

    if (error) throw error

    console.log('✅ 푸시 알림 전송 완료:', result)
    return result
  } catch (error) {
    console.error('❌ 푸시 알림 전송 오류:', error)
    return null
  }
}
*/

// ============================================
// Supabase Edge Function 예제
// ============================================
// supabase/functions/send-push-notification/index.ts
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Firebase Admin SDK 초기화
const admin = require('firebase-admin')
const serviceAccount = require('./firebase-service-account.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

serve(async (req) => {
  try {
    const { userId, title, body, data } = await req.json()

    // Supabase 클라이언트
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 사용자의 FCM 토큰 가져오기
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single()

    if (error || !profile?.fcm_token) {
      throw new Error('FCM 토큰을 찾을 수 없습니다')
    }

    // FCM 메시지 전송
    const message = {
      token: profile.fcm_token,
      notification: {
        title: title,
        body: body
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: data?.actionUrl || '/'
        }
      }
    }

    const response = await admin.messaging().send(message)

    return new Response(
      JSON.stringify({ success: true, messageId: response }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
*/

// ============================================
// Service Worker (public/firebase-messaging-sw.js)
// ============================================
/*
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
})

const messaging = firebase.messaging()

// 백그라운드 메시지 수신 (앱이 닫혀있을 때)
messaging.onBackgroundMessage((payload) => {
  console.log('📨 백그라운드 메시지 수신:', payload)

  const notificationTitle = payload.notification.title
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png',
    badge: '/badge.png'
  }

  self.registration.showNotification(notificationTitle, notificationOptions)
})
*/

// ============================================
// 사용 예제
// ============================================
/*
// App.jsx 또는 main.jsx에서 초기화
import { requestNotificationPermission, onMessageListener } from './services/pushNotifications'

useEffect(() => {
  // 알림 권한 요청
  requestNotificationPermission()

  // 포그라운드 메시지 리스너
  onMessageListener()
    .then((payload) => {
      console.log('새 알림:', payload)
      // 여기서 인앱 알림 표시
    })
    .catch((error) => {
      console.error('메시지 리스너 오류:', error)
    })
}, [])
*/

// 현재는 비활성화 상태
export const requestNotificationPermission = async () => {
  console.log('⚠️ FCM 푸시 알림이 비활성화되어 있습니다')
  console.log('📖 활성화 방법은 src/services/pushNotifications.js 파일을 확인하세요')
  return null
}

export const onMessageListener = () => {
  return Promise.resolve(null)
}

export const sendPushNotification = async () => {
  console.log('⚠️ FCM 푸시 알림이 비활성화되어 있습니다')
  return null
}
