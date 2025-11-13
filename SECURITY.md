# 포마(Pho-Ma) 보안 가이드

이 문서는 포마 프로젝트의 보안 취약점과 개선 방안을 안내합니다.

## 🚨 긴급 조치사항

### 1. API 키 재발급 (즉시 필요)

다음 API 키들을 **즉시 재발급**해야 합니다:

#### Google Vision API
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. "사용자 인증 정보" → 기존 키 삭제
3. "사용자 인증 정보 만들기" → "API 키" 선택
4. 새 키를 `.env.local` 파일의 `VITE_GOOGLE_VISION_API_KEY`에 설정
5. API 키 제한 설정:
   - 애플리케이션 제한: HTTP 리퍼러
   - 허용 리퍼러: `https://your-domain.com/*`
   - API 제한: Cloud Vision API만 활성화

#### Kakao API
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 → 앱 설정
3. "앱 키" 탭에서 기존 키 재발급
4. JavaScript Key를 `.env.local`에 설정 (REST API Key 아님!)
   ```
   VITE_KAKAO_JS_KEY=새로운_javascript_key
   ```
5. 플랫폼 설정에서 도메인 제한

#### Iamport (포트원)
1. [아임포트 관리자](https://admin.iamport.kr/) 접속
2. 시스템 설정 → API/웹훅
3. API Key/Secret 재발급
4. `.env.local`에 설정

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 형식으로 작성:

```bash
# .env.local (절대 Git에 커밋하지 마세요!)

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Vision API
VITE_GOOGLE_VISION_API_KEY=your_new_google_vision_api_key

# Kakao (JavaScript Key 사용!)
VITE_KAKAO_JS_KEY=your_new_kakao_javascript_key

# Iamport
VITE_IAMPORT_CODE=your_iamport_merchant_id
```

---

## 📋 보안 체크리스트

### 즉시 (1일 내)
- [x] `.env.local`이 `.gitignore`에 포함되어 있는지 확인
- [x] `.env.example` 파일 생성
- [ ] 모든 API 키 재발급
- [ ] Supabase RLS 정책 활성화 (아래 참조)

### 단기 (1주일 내)
- [ ] 비밀번호 강도 검증 추가
- [ ] 관리자 권한 서버 측 체크 강화
- [ ] 결제 검증 서버 측 처리

### 중기 (1개월 내)
- [ ] Rate Limiting 구현
- [ ] 보안 이벤트 로깅
- [ ] CSRF 보호 강화

---

## 🔒 데이터베이스 보안 (Supabase RLS)

### 1. profiles 테이블 RLS 정책

Supabase SQL Editor에서 다음 쿼리 실행:

```sql
-- RLS 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- 관리자는 모든 프로필 조회 가능
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- is_admin 필드는 관리자만 수정 가능
CREATE POLICY "Only admins can modify admin status"
ON profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 포인트 음수 방지
ALTER TABLE profiles
ADD CONSTRAINT check_points_non_negative
CHECK (points >= 0);
```

### 2. photos 테이블 RLS 정책

```sql
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 활성 사진은 누구나 조회 가능
CREATE POLICY "Anyone can view active photos"
ON photos FOR SELECT
USING (status = 'active' OR user_id = auth.uid());

-- 사용자는 자신의 사진만 등록
CREATE POLICY "Users can insert own photos"
ON photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 사진만 수정
CREATE POLICY "Users can update own photos"
ON photos FOR UPDATE
USING (auth.uid() = user_id);

-- 관리자는 모든 사진 수정 가능
CREATE POLICY "Admins can manage all photos"
ON photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

### 3. bids 테이블 RLS 정책

```sql
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 입찰 조회 가능
-- 판매자는 자신의 사진에 대한 모든 입찰 조회 가능
CREATE POLICY "Users can view relevant bids"
ON bids FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM photos
    WHERE photos.id = bids.photo_id
    AND photos.user_id = auth.uid()
  )
);

-- 사용자는 자신의 입찰만 생성
CREATE POLICY "Users can insert own bids"
ON bids FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 4. payments 테이블 RLS 정책

```sql
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 결제 내역만 조회
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
USING (auth.uid() = user_id);

-- 관리자는 모든 결제 조회 가능
CREATE POLICY "Admins can view all payments"
ON payments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
```

---

## 🛡️ 클라이언트 보안 개선

### 1. 비밀번호 강도 검증

`src/utils/passwordValidator.js` 파일 생성:

```javascript
/**
 * 비밀번호 강도 검증
 */
export function validatePassword(password) {
  const errors = []

  if (password.length < 8) {
    errors.push('비밀번호는 8자 이상이어야 합니다')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('대문자를 최소 1개 포함해야 합니다')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('소문자를 최소 1개 포함해야 합니다')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('숫자를 최소 1개 포함해야 합니다')
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('특수문자(!@#$%^&*)를 최소 1개 포함해야 합니다')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 비밀번호 강도 점수 (0-4)
 */
export function getPasswordStrength(password) {
  let strength = 0

  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[!@#$%^&*]/.test(password)) strength++

  return Math.min(strength, 4)
}
```

### 2. Admin Route 보호

`src/components/ProtectedRoute.jsx` 생성:

```jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './common/LoadingSpinner'

export function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner message="권한 확인 중..." />
  }

  if (!user || !profile?.is_admin) {
    alert('관리자 권한이 필요합니다')
    return <Navigate to="/" replace />
  }

  return children
}
```

`src/App.jsx`에서 사용:

```jsx
import { AdminRoute } from './components/ProtectedRoute'

// 라우팅 설정
<Route
  path="/admin"
  element={
    <AdminRoute>
      <Admin />
    </AdminRoute>
  }
/>
```

---

## 💰 결제 보안 개선

### Supabase Edge Function으로 결제 검증

`supabase/functions/verify-payment/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const IAMPORT_API_KEY = Deno.env.get('IAMPORT_API_KEY')!
const IAMPORT_API_SECRET = Deno.env.get('IAMPORT_API_SECRET')!

serve(async (req) => {
  try {
    const { imp_uid, merchant_uid, amount } = await req.json()

    // 1. 아임포트 액세스 토큰 발급
    const tokenResponse = await fetch('https://api.iamport.kr/users/getToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imp_key: IAMPORT_API_KEY,
        imp_secret: IAMPORT_API_SECRET
      })
    })
    const { response: { access_token } } = await tokenResponse.json()

    // 2. 결제 정보 조회
    const paymentResponse = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
      headers: { 'Authorization': access_token }
    })
    const { response: payment } = await paymentResponse.json()

    // 3. 검증
    if (payment.status !== 'paid') {
      return new Response(
        JSON.stringify({ error: '결제가 완료되지 않았습니다' }),
        { status: 400 }
      )
    }

    if (payment.amount !== amount) {
      // 위변조 시도
      return new Response(
        JSON.stringify({ error: '결제 금액이 일치하지 않습니다' }),
        { status: 400 }
      )
    }

    // 4. 포인트 지급
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const points = Math.floor(amount / 100) // 100원 = 1포인트

    const { error } = await supabase.rpc('add_points', {
      p_user_id: req.headers.get('user-id'),
      p_amount: points,
      p_description: `포인트 충전 (결제: ${imp_uid})`
    })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, points }),
      { status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

---

## 🔍 모니터링 및 로깅

### 보안 이벤트 로깅

```sql
-- 보안 로그 테이블
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS 정책 (관리자만 조회)
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view logs"
ON security_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 로그 기록 함수
CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO security_logs (user_id, event_type, metadata)
  VALUES (p_user_id, p_event_type, p_metadata);
END;
$$;
```

---

## 📱 Rate Limiting

### 입찰 속도 제한

```sql
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_action_type TEXT,
  p_max_requests INTEGER DEFAULT 10,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM security_logs
  WHERE user_id = p_user_id
    AND event_type = p_action_type
    AND created_at > NOW() - INTERVAL '1 minute' * p_window_minutes;

  RETURN v_count < p_max_requests;
END;
$$;
```

---

## 🎯 보안 테스트 체크리스트

### 인증/인가
- [ ] 비밀번호 강도 테스트 (8자 이상, 복잡도)
- [ ] 로그인 실패 시도 제한 (5회)
- [ ] 세션 타임아웃 테스트
- [ ] 관리자 페이지 접근 제어

### 데이터 보안
- [ ] SQL Injection 테스트
- [ ] XSS 공격 테스트
- [ ] CSRF 토큰 검증

### API 보안
- [ ] API 키 제한 확인
- [ ] Rate Limiting 동작 확인
- [ ] 결제 금액 위변조 테스트

---

## 📞 보안 문제 신고

보안 취약점을 발견하신 경우:

1. **공개 이슈로 등록하지 마세요**
2. 개발자에게 직접 연락
3. 상세한 재현 방법 제공

---

## 📚 참고 자료

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [아임포트 보안 가이드](https://docs.iamport.kr/security)

---

**마지막 업데이트**: 2025-11-13
