# 포마(Pho-Ma) 프로젝트 현황 정리

**최종 업데이트**: 2025년 10월 25일  
**프로젝트 단계**: MVP 개발 진행 중  
**버전**: 0.1 (프로토타입)

---

## 📋 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [구현된 기능](#2-구현된-기능)
3. [남은 기능 구현 과제](#3-남은-기능-구현-과제)
4. [아키텍처](#4-아키텍처)
5. [다음 단계](#5-다음-단계)

---

## 1. 프로젝트 개요

### 1.1 프로젝트 소개
**포마(Pho-Ma)**는 세계 최초 사진 저작권 경매 플랫폼입니다.
- **이름**: Pho-Ma (베트남 쌀국수 Phở + Photo Market)
- **컨셉**: "내 사진이 돈이 되는 순간"
- **핵심 가치**: 저가 진입, 소액 거래, 부담 없는 사진 경매

### 1.2 비즈니스 모델
```
가격대: 500원~10,000원 (평균 1~2천원대)
벤치마킹: 당근마켓 (소액 일상 거래)
수익 모델: 거래 수수료 10%
```

### 1.3 타겟
- **판매자**: 일반인 사진 작가, 취미로 사진 찍는 사람
- **구매자**: 블로그, 소셜미디어, 소상공인, 프리랜서
- **특징**: 진입 장벽 낮음, 부담 없는 가격

### 1.4 핵심 차별점
- ✅ **블루오션**: 사진 경매 플랫폼 세계 최초
- ✅ **소액 거래**: 스톡 이미지 대비 10배 저렴
- ✅ **심플함**: 3클릭 이내 목표 달성
- ✅ **모바일 중심**: 터치 친화적 UI

---

## 2. 구현된 기능

### 2.1 핵심 기능 ✅

#### A. 홈 화면 (사진 갤러리)
```
✅ 사진 목록 그리드 레이아웃
✅ 워터마크 표시 (Pho-Ma)
✅ 현재가/즉시구매가 표시
✅ 타이머 표시 (정적)
✅ 카테고리 필터 (전체/음식/풍경/인테리어/제품/라이프)
✅ 검색 기능 (실시간 필터링)
✅ 좋아요 기능
✅ 입찰 수 표시
```

**구현 완료도**: 90%
- 실시간 타이머 카운트다운 미구현
- 실제 입찰 기능 미구현

#### B. 상세 페이지
```
✅ 사진 크게 보기
✅ 제목, 카테고리, 판매자 정보
✅ 현재가/즉시구매가 표시
✅ 타이머 표시
✅ 입찰 입력 UI
✅ 즉시구매 버튼
✅ 좋아요 토글
✅ 해상도 정보
```

**구현 완료도**: 85%
- 실제 입찰 로직 미구현
- 결제 연동 미구현

#### C. 사진 업로드 페이지
```
✅ 이미지 업로드 (파일 선택)
✅ 미리보기
✅ 제목 입력
✅ 카테고리 선택
✅ 시작가/즉시구매가 입력
✅ 경매 기간 선택
✅ 약관 동의 체크박스
✅ Supabase DB 저장
```

**구현 완료도**: 80%
- 실제 이미지 업로드 (Storage) 미구현
- Canvas 워터마크 자동 삽입 미구현
- AI 검증 시스템 미구현

#### D. 네비게이션
```
✅ 하단 네비게이션 바 (홈/판매/내정보)
✅ 페이지 전환
✅ 로고 (🍜 Pho-Ma)
✅ 모바일 최적화
```

**구현 완료도**: 100%

### 2.2 데이터베이스 연동 ✅

#### Supabase 설정
```
✅ 프로젝트 생성 (phoma-mvp)
✅ photos 테이블 생성
✅ API 키 설정
✅ 실시간 데이터 동기화
```

#### photos 테이블 스키마
```sql
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  preview_url TEXT,
  current_price INTEGER,
  buy_now_price INTEGER,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  bids INTEGER DEFAULT 0,
  seller TEXT,
  resolution TEXT
);
```

**구현 완료도**: 100%

### 2.3 UI/UX ✅

#### 디자인 시스템
```
✅ Tailwind CSS 적용
✅ 모바일 퍼스트 디자인
✅ 오렌지 컬러 톤 (#FF6B35)
✅ 쌀국수 로고 이모지 (🍜)
✅ 큰 터치 영역 (44px+)
✅ 심플한 레이아웃
```

**구현 완료도**: 100%

### 2.4 기술 스택 ✅

```
Frontend: React + Vite
Styling: Tailwind CSS
Database: Supabase (PostgreSQL)
Icons: Lucide React
Storage: (예정) Cloudflare R2
```

---

## 3. 남은 기능 구현 과제

### 3.1 즉시 구현 필요 (우선순위 ⭐⭐⭐)

#### A. 실제 이미지 업로드
```
현재: 파일 선택만 가능
목표: Cloudflare R2 또는 Supabase Storage 연동

과제:
- 이미지 리사이징 (미리보기 400px, 원본 4000px)
- Canvas로 워터마크 자동 삽입
- Storage URL 생성 후 DB 저장
- 진행률 표시

예상 소요: 2일
```

#### B. 실시간 타이머
```
현재: 정적 텍스트 ("1일 12시간 남음")
목표: 실시간 카운트다운

과제:
- useEffect + setInterval로 1초마다 업데이트
- "23:59:58" 형식 표시
- 종료 시 "경매 종료" 상태 변경
- 모든 사진에 적용

예상 소요: 1일
```

#### C. 입찰 시스템
```
현재: 버튼만 존재
목표: 실제 입찰 기능

과제:
- 입찰 금액 입력 검증 (현재가 + 최소 증가액)
- DB 업데이트 (current_price, bids)
- 실시간 반영 (Supabase Realtime)
- 입찰 히스토리 테이블 생성
- 입찰자 알림 (선택)

예상 소요: 3일
```

### 3.2 단기 구현 필요 (우선순위 ⭐⭐)

#### D. 회원 시스템
```
현재: 없음
목표: 회원가입/로그인

과제:
- Supabase Auth 연동
- 이메일/소셜 로그인 (Google, 카카오)
- 프로필 페이지
- 내 사진 목록
- 입찰 내역
- 구매 내역

예상 소요: 5일
```

#### E. 포인트 시스템
```
현재: 없음
목표: 충전/사용/환전

과제:
- points 테이블 생성
- 충전 인터페이스
- 입찰/구매 시 차감
- 판매 시 적립 (수수료 10%)
- 출금 신청 (주 1회)
- 거래 내역

예상 소요: 4일
```

#### F. 결제 연동
```
현재: 없음
목표: 실제 결제 가능

과제:
- 토스페이먼츠 또는 포트원 연동
- 포인트 충전 결제
- 즉시구매 직접 결제
- 에스크로 시스템
- 환불 정책

예상 소요: 7일
```

### 3.3 중기 구현 필요 (우선순위 ⭐)

#### G. AI 검증 시스템
```
목표: 불법 이미지 차단

과제:
- Google Cloud Vision API 연동
- 역이미지 검색 (저작권 확인)
- 인물 감지 (초상권)
- 불법 촬영물 감지
- 자동 차단 또는 검수 필요 표시

예상 소요: 10일
```

#### H. 알림 시스템
```
목표: 사용자 알림

과제:
- 입찰 경쟁 알림
- 낙찰 알림
- 포인트 적립 알림
- 출금 완료 알림
- Push 알림 (PWA)

예상 소요: 5일
```

#### I. 커뮤니티 기능
```
목표: 사용자 참여 증대

과제:
- 댓글 기능
- 평점/리뷰
- 팔로우 시스템
- 인기 작가 랭킹
- 사진 콘테스트

예상 소요: 10일
```

### 3.4 장기 구현 필요 (추후 고려)

#### J. 고급 기능
```
- PWA 변환 (앱처럼 설치)
- 오프라인 모드
- 다크 모드
- 다국어 지원
- 관리자 대시보드
- 통계/분석 도구
- 자동 가격 제안 AI
- 판매 전략 추천
```

### 3.5 법률/운영

#### K. 법적 문서
```
✅ 이용약관 (초안)
✅ 개인정보 처리방침 (초안)
□ 저작권 정책 상세화
□ 에스크로 규약
□ 환불 정책
□ 통신판매업 신고
```

#### L. 운영 시스템
```
□ 신고 접수 시스템
□ 고객센터 (FAQ, 1:1 문의)
□ 정산 자동화
□ 마케팅 자동화 (이메일, 푸시)
```

---

## 4. 아키텍처

### 4.1 전체 구조

```
┌─────────────────────────────────────────┐
│             사용자 (모바일/PC)            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          Frontend (React + Vite)         │
│  - UI Components                         │
│  - State Management (useState)           │
│  - Routing (React Router)                │
│  - Styling (Tailwind CSS)                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        Supabase (BaaS)                   │
│  ┌───────────────────────────────────┐  │
│  │ PostgreSQL Database                │  │
│  │  - photos                          │  │
│  │  - users                           │  │
│  │  - bids                            │  │
│  │  - transactions                    │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Authentication                     │  │
│  │  - Email/Password                  │  │
│  │  - OAuth (Google, Kakao)           │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Storage (이미지 저장)              │  │
│  │  - 미리보기 (400px)                │  │
│  │  - 원본 (4000px)                   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ Realtime (실시간 동기화)           │  │
│  │  - 입찰 실시간 업데이트            │  │
│  └───────────────────────────────────┘  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│       External Services                  │
│  - Cloudflare R2 (이미지 CDN)            │
│  - Google Cloud Vision (AI 검증)         │
│  - 토스페이먼츠 (결제)                   │
│  - 이메일 서비스 (알림)                  │
└─────────────────────────────────────────┘
```

### 4.2 데이터베이스 스키마

#### 현재 구현된 테이블

```sql
-- photos (사진 정보)
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  preview_url TEXT,
  current_price INTEGER NOT NULL,
  buy_now_price INTEGER NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active', -- active, sold, expired
  bids INTEGER DEFAULT 0,
  seller TEXT,
  resolution TEXT,
  seller_id UUID REFERENCES auth.users(id) -- 추가 예정
);
```

#### 추가 예정 테이블

```sql
-- users (사용자 프로필)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  points INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0
);

-- bids (입찰 내역)
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  bidder_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'active' -- active, outbid, won
);

-- transactions (거래 내역)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  photo_id UUID REFERENCES photos(id),
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL,
  type TEXT NOT NULL, -- bid_win, buy_now
  status TEXT DEFAULT 'pending', -- pending, completed, refunded
  escrow_released BOOLEAN DEFAULT false
);

-- points (포인트 내역)
CREATE TABLE point_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  amount INTEGER NOT NULL, -- 양수: 충전/적립, 음수: 사용
  type TEXT NOT NULL, -- charge, purchase, sale, withdrawal
  description TEXT,
  balance INTEGER NOT NULL -- 거래 후 잔액
);

-- reports (신고)
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  photo_id UUID REFERENCES photos(id),
  reporter_id UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, resolved, rejected
  reviewed_at TIMESTAMPTZ
);
```

### 4.3 폴더 구조

```
phoma-mvp/
├── public/
│   └── vite.svg
├── src/
│   ├── components/           # 재사용 컴포넌트
│   │   ├── PhotoCard.jsx    # 사진 카드
│   │   ├── PhotoGrid.jsx    # 사진 그리드
│   │   ├── CategoryFilter.jsx
│   │   ├── Timer.jsx        # 카운트다운 타이머
│   │   └── Navigation.jsx   # 하단 네비게이션
│   │
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── Home.jsx         # 홈 (갤러리)
│   │   ├── Detail.jsx       # 상세 페이지
│   │   ├── Upload.jsx       # 업로드 페이지
│   │   ├── Profile.jsx      # 프로필 (예정)
│   │   └── Login.jsx        # 로그인 (예정)
│   │
│   ├── services/            # 외부 서비스
│   │   ├── supabase.js      # Supabase 클라이언트
│   │   └── api.js           # API 함수
│   │
│   ├── utils/               # 유틸리티 함수
│   │   ├── format.js        # 포맷팅 (가격, 날짜)
│   │   ├── validate.js      # 검증
│   │   └── watermark.js     # 워터마크 생성 (예정)
│   │
│   ├── hooks/               # Custom Hooks
│   │   ├── useAuth.js       # 인증 (예정)
│   │   ├── useTimer.js      # 타이머 (예정)
│   │   └── useBid.js        # 입찰 (예정)
│   │
│   ├── App.jsx              # 메인 앱
│   ├── main.jsx             # Entry Point
│   └── index.css            # Global Styles
│
├── .env.local               # 환경 변수 (Supabase 키)
├── tailwind.config.js       # Tailwind 설정
├── vite.config.js           # Vite 설정
└── package.json
```

**현재 상태**: 단일 파일 구조 (App.jsx)  
**다음 단계**: 컴포넌트 분리 필요

### 4.4 기술 스택 상세

#### Frontend
```
Framework: React 18 + Vite
- 빠른 개발 서버 (HMR)
- 최적화된 빌드
- ESM 기반

Styling: Tailwind CSS 3
- Utility-first CSS
- 모바일 우선 반응형
- Dark mode 지원 (예정)

Routing: React Router 6 (예정)
- SPA 라우팅
- 중첩 라우트
- 레이지 로딩

State: React useState/useEffect
- 단순 상태 관리
- 추후 Zustand 고려 (복잡도 증가 시)

Icons: Lucide React
- 가벼운 아이콘 라이브러리
- Tree-shaking 지원
```

#### Backend (BaaS)
```
Supabase
- PostgreSQL 데이터베이스
- RESTful API 자동 생성
- GraphQL (선택)
- Realtime 구독
- Authentication (OAuth)
- Storage (파일 업로드)
- Edge Functions (서버리스)

무료 플랜:
- 500MB 데이터베이스
- 1GB 파일 저장
- 50,000 월간 활성 사용자
```

#### Storage (예정)
```
Cloudflare R2
- S3 호환 API
- 무료 egress (트래픽)
- 저렴한 스토리지 ($0.015/GB)
- CDN 자동 연결
```

#### AI (예정)
```
Google Cloud Vision API
- 이미지 내용 분석
- 불법 콘텐츠 감지
- 인물 감지
- OCR (텍스트 추출)

무료 플랜:
- 월 1,000건 무료
```

#### Payment (예정)
```
토스페이먼츠 or 포트원
- 신용카드, 계좌이체
- 카카오페이, 토스페이
- 에스크로
- 정산 자동화

수수료:
- 신용카드 3.3%
- 계좌이체 1.0%
```

### 4.5 배포 전략

```
개발 환경:
- Local: localhost:5173 (Vite dev server)
- 테스트 DB: Supabase (phoma-mvp)

프로덕션 (예정):
- 호스팅: Vercel or Cloudflare Pages
- 도메인: phoma.co.kr (예정)
- HTTPS 자동 인증서
- CDN 자동 연결
- 무료 플랜 가능

CI/CD:
- Git push → 자동 빌드 → 자동 배포
- Preview 배포 (PR마다)
- 롤백 쉬움
```

### 4.6 보안 고려사항

```
✅ 현재:
- Supabase RLS (Row Level Security) 비활성화 (테스트용)
- 환경 변수 (.env.local)

□ 추가 필요:
- RLS 활성화 (본인 데이터만 접근)
- JWT 토큰 인증
- CSRF 방지
- XSS 방지 (입력 검증)
- Rate Limiting (API 호출 제한)
- 이미지 업로드 검증 (크기, 형식)
```

---

## 5. 다음 단계

### 5.1 즉시 시작 (이번 주)

```
Day 1-2: 실제 이미지 업로드 + 워터마크
- Supabase Storage 연동
- Canvas로 워터마크 자동 생성
- 미리보기/원본 분리 저장

Day 3: 실시간 타이머
- useEffect로 카운트다운 구현
- 종료 시 상태 변경

Day 4-5: 입찰 시스템
- bids 테이블 생성
- 입찰 검증 로직
- 실시간 업데이트
```

### 5.2 단기 목표 (1-2주)

```
Week 2: 회원 시스템
- Supabase Auth 연동
- 로그인/회원가입 UI
- 프로필 페이지

Week 3: 포인트 + 결제
- 포인트 시스템 구현
- 토스페이먼츠 연동
- 충전/사용/환전
```

### 5.3 중기 목표 (1개월)

```
Month 1 완료 목표:
✅ 실제 거래 가능한 MVP
✅ 회원 시스템
✅ 결제 연동
✅ 기본 법적 문서

베타 테스트 시작:
- 지인 50명 초대
- 실제 거래 테스트
- 피드백 수집
```

### 5.4 장기 목표 (3-6개월)

```
Month 3: 정식 런칭
- AI 검증 시스템
- 커뮤니티 기능
- 마케팅 시작
- 목표: 500명 사용자

Month 6: 성장
- 앱 출시 (PWA)
- 프로모션
- 목표: 5,000명 사용자
- 손익분기점 달성
```

---

## 6. 메트릭 & KPI

### 6.1 현재 상태
```
개발 진행률: 30%
코어 기능: 70% (UI/DB 완성)
결제/인증: 0%
법률/운영: 20% (문서 초안)
```

### 6.2 목표 지표

```
Phase 1 (MVP, 1개월):
- 실제 거래 가능
- 베타 사용자 50명
- 일 거래 10건
- 평균 거래액 1,500원

Phase 2 (정식 런칭, 3개월):
- 사용자 500명
- 일 거래 50건
- 월 거래액 100만원
- 수익 10만원/월

Phase 3 (성장, 6개월):
- 사용자 5,000명
- 일 거래 500건
- 월 거래액 1,000만원
- 수익 100만원/월 (손익분기점)
```

---

## 7. 리스크 & 이슈

### 7.1 기술적 리스크
```
⚠️ 이미지 저장 비용
- 대응: Cloudflare R2 (무료 트래픽)
- 백업: Supabase Storage

⚠️ 실시간 동기화 부하
- 대응: Throttling, Debouncing
- 백업: 주기적 Polling

⚠️ 개발 지연
- 대응: MVP 기능 최소화
- 백업: 단계별 출시
```

### 7.2 비즈니스 리스크
```
⚠️ 사용자 확보 실패
- 대응: 무료 포인트 지급 (가입 시)
- 대응: 친구 초대 이벤트
- 대응: 인플루언서 협업

⚠️ 거래 부진
- 대응: 시즈널 프로모션
- 대응: 인기 카테고리 할인
- 대응: 경매 재미 강화 (게임화)

⚠️ 불법 콘텐츠
- 대응: AI 자동 검증
- 대응: 신고 시스템
- 대응: 빠른 대응 프로세스
```

### 7.3 법적 리스크
```
⚠️ 저작권 분쟁
- 대응: 역이미지 검색
- 대응: 에스크로 (7일 보류)
- 대응: 명확한 이용약관

⚠️ 초상권 침해
- 대응: AI 인물 감지
- 대응: 업로드 시 경고
- 대응: 신속한 삭제

⚠️ 불법 촬영물
- 대응: 신고 즉시 차단
- 대응: 경찰 신고 협조
- 대응: 업로더 영구 정지
```

---

## 8. 참고 자료

### 8.1 프로젝트 문서
- [완전 기획서 v1.0](링크)
- [개발 환경 세팅 가이드](링크)
- [UI 프로토타입](현재 구현된 React 컴포넌트)

### 8.2 관련 대화
- [초기 기획 대화](https://claude.ai/chat/e4569b14-7eef-4aba-a004-0f309a77bbce)

### 8.3 외부 리소스
```
Supabase 문서: https://supabase.com/docs
Tailwind CSS: https://tailwindcss.com
React 공식 문서: https://react.dev
토스페이먼츠: https://docs.tosspayments.com
```

---

## 9. 팀 & 연락처

```
개발자: [이름]
역할: Fullstack Developer
진행 상태: MVP 개발 중

프로젝트 시작: 2025년 10월 24일
현재 버전: 0.1 (프로토타입)
다음 마일스톤: 이미지 업로드 + 타이머 (10월 27일 목표)
```

---

## 10. 변경 이력

```
2025-10-25: 초안 작성
- 프로젝트 현황 정리
- 구현된 기능 문서화
- 남은 과제 정리
- 아키텍처 설계
```

---

**END OF DOCUMENT**
