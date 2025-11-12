// ============================================
// 이메일 알림 서비스 (비활성화)
// ============================================
// 나중에 수익이 발생하면 활성화하세요
//
// 활성화 방법:
// 1. 이메일 서비스 선택 (SendGrid, Mailgun, Resend 등)
// 2. API 키 발급
// 3. Supabase Edge Function 생성
// 4. 아래 주석 해제

// ============================================
// 옵션 1: SendGrid (추천)
// ============================================
// 무료: 일 100통 (월 3,000통)
// 유료: $14.95/월 (일 333통)
/*
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export const sendEmail = async ({ to, subject, html }) => {
  const msg = {
    to: to,
    from: 'noreply@yourapp.com', // 인증된 발신자 이메일
    subject: subject,
    html: html
  }

  try {
    await sgMail.send(msg)
    console.log('✅ 이메일 전송 완료:', to)
    return { success: true }
  } catch (error) {
    console.error('❌ 이메일 전송 오류:', error)
    return { success: false, error }
  }
}
*/

// ============================================
// 옵션 2: Resend (개발자 친화적)
// ============================================
// 무료: 월 3,000통
// 유료: $20/월 (월 50,000통)
/*
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export const sendEmail = async ({ to, subject, html }) => {
  try {
    const data = await resend.emails.send({
      from: 'Photo Market <noreply@yourapp.com>',
      to: [to],
      subject: subject,
      html: html
    })

    console.log('✅ 이메일 전송 완료:', data)
    return { success: true, data }
  } catch (error) {
    console.error('❌ 이메일 전송 오류:', error)
    return { success: false, error }
  }
}
*/

// ============================================
// 이메일 템플릿
// ============================================

/*
// 입찰 밀림 알림
export const bidOutbidTemplate = (username, photoTitle, amount) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>입찰이 경쟁에서 밀렸습니다</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #B3D966, #9DC183); padding: 20px; border-radius: 10px; text-align: center;">
        <h1 style="color: white; margin: 0;">📢 입찰 알림</h1>
      </div>

      <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #333;">안녕하세요, ${username}님!</p>

        <p style="font-size: 16px; color: #333;">
          "<strong>${photoTitle}</strong>"에 더 높은 입찰이 들어왔습니다.
        </p>

        <div style="background: #FFF9C4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #F57C00; font-size: 14px;">💸 보증금 환불</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #558B2F;">
            ${amount.toLocaleString()}P
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          보증금이 자동으로 환불되었습니다. 다시 입찰하시겠어요?
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://yourapp.com/photo/..."
             style="display: inline-block; background: linear-gradient(to right, #B3D966, #9DC183);
                    color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;
                    font-weight: bold;">
            다시 입찰하기
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>포마 - 신선한 사진 마켓플레이스</p>
        <p>이 이메일을 받고 싶지 않으시면 <a href="..." style="color: #999;">수신 거부</a></p>
      </div>
    </body>
    </html>
  `
}

// 낙찰 성공 알림
export const auctionWonTemplate = (username, photoTitle, amount) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>축하합니다! 낙찰받았습니다</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #FF6F00, #FF8F00); padding: 20px; border-radius: 10px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎉 낙찰 축하드립니다!</h1>
      </div>

      <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #333;">축하합니다, ${username}님!</p>

        <p style="font-size: 16px; color: #333;">
          "<strong>${photoTitle}</strong>"을(를) 낙찰받았습니다!
        </p>

        <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #558B2F; font-size: 14px;">💰 낙찰가</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #558B2F;">
            ${amount.toLocaleString()}P
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          이제 원본 고화질 사진을 다운로드하실 수 있습니다.
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://yourapp.com/my-purchases"
             style="display: inline-block; background: linear-gradient(to right, #B3D966, #9DC183);
                    color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;
                    font-weight: bold;">
            사진 다운로드하기
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>포마 - 신선한 사진 마켓플레이스</p>
      </div>
    </body>
    </html>
  `
}

// 판매 완료 알림 (판매자용)
export const auctionSoldTemplate = (username, photoTitle, amount) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>사진이 판매되었습니다</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(to right, #B3D966, #9DC183); padding: 20px; border-radius: 10px; text-align: center;">
        <h1 style="color: white; margin: 0;">💰 판매 완료!</h1>
      </div>

      <div style="background: white; padding: 30px; border-radius: 10px; margin-top: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; color: #333;">축하합니다, ${username}님!</p>

        <p style="font-size: 16px; color: #333;">
          "<strong>${photoTitle}</strong>"이(가) 판매되었습니다!
        </p>

        <div style="background: #FFF9C4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #F57C00; font-size: 14px;">💸 판매 수익</p>
          <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #558B2F;">
            ${amount.toLocaleString()}P
          </p>
        </div>

        <p style="font-size: 14px; color: #666;">
          수익은 7일 후 자동으로 출금 가능해집니다.
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://yourapp.com/profile"
             style="display: inline-block; background: linear-gradient(to right, #B3D966, #9DC183);
                    color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px;
                    font-weight: bold;">
            내 프로필 보기
          </a>
        </div>
      </div>

      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>포마 - 신선한 사진 마켓플레이스</p>
      </div>
    </body>
    </html>
  `
}
*/

// ============================================
// Supabase Edge Function 예제
// ============================================
// supabase/functions/send-email-notification/index.ts
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { userId, type, photoTitle, amount } = await req.json()

    // Supabase 클라이언트
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 사용자 정보 가져오기
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', userId)
      .single()

    if (error || !profile?.email) {
      throw new Error('사용자 정보를 찾을 수 없습니다')
    }

    // 이메일 템플릿 선택
    let subject, html

    switch (type) {
      case 'bid_outbid':
        subject = '입찰이 경쟁에서 밀렸습니다'
        html = bidOutbidTemplate(profile.username, photoTitle, amount)
        break
      case 'auction_won':
        subject = '🎉 축하합니다! 낙찰받았습니다'
        html = auctionWonTemplate(profile.username, photoTitle, amount)
        break
      case 'auction_sold':
        subject = '💰 사진이 판매되었습니다'
        html = auctionSoldTemplate(profile.username, photoTitle, amount)
        break
      default:
        throw new Error('알 수 없는 알림 유형')
    }

    // 이메일 전송 (SendGrid 또는 Resend)
    const response = await sendEmail({
      to: profile.email,
      subject: subject,
      html: html
    })

    return new Response(
      JSON.stringify({ success: true, response }),
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

// 현재는 비활성화 상태
export const sendEmail = async () => {
  console.log('⚠️ 이메일 알림이 비활성화되어 있습니다')
  console.log('📖 활성화 방법은 src/services/emailNotifications.js 파일을 확인하세요')
  return { success: false }
}

export const bidOutbidTemplate = () => ''
export const auctionWonTemplate = () => ''
export const auctionSoldTemplate = () => ''
