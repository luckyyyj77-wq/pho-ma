-- ============================================
-- 프로필 확장 기능 (등급, 소개글)
-- ============================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. profiles 테이블에 등급 컬럼 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS grade TEXT DEFAULT '일반 회원';

-- 2. profiles 테이블에 소개글 컬럼 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- 3. 등급 타입 정의 (참고용 주석)
-- '일반 회원' - 기본 등급
-- '우수 판매자' - 판매 10건 이상
-- '프리미엄 판매자' - 판매 50건 이상
-- 'VIP 회원' - 판매 100건 이상
-- '관리자' - 관리자 권한

-- 4. 소개글 길이 제한 (500자)
ALTER TABLE profiles
ADD CONSTRAINT bio_length_check
CHECK (LENGTH(bio) <= 500);

-- 5. 등급별 혜택 안내 (주석)
-- 일반 회원: 기본 기능
-- 우수 판매자: 프로필 뱃지, 검색 상위 노출
-- 프리미엄 판매자: 수수료 할인, 프로필 강조
-- VIP 회원: 수수료 면제, 전용 지원
-- 관리자: 모든 권한

-- 6. 등급 자동 업데이트 함수 (미래 구현용)
CREATE OR REPLACE FUNCTION update_user_grade(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sold_count INTEGER;
  v_new_grade TEXT;
BEGIN
  -- 판매 완료 건수 확인
  SELECT COUNT(*) INTO v_sold_count
  FROM photos
  WHERE user_id = p_user_id
    AND status = 'sold';

  -- 등급 결정
  IF v_sold_count >= 100 THEN
    v_new_grade := 'VIP 회원';
  ELSIF v_sold_count >= 50 THEN
    v_new_grade := '프리미엄 판매자';
  ELSIF v_sold_count >= 10 THEN
    v_new_grade := '우수 판매자';
  ELSE
    v_new_grade := '일반 회원';
  END IF;

  -- 등급 업데이트
  UPDATE profiles
  SET grade = v_new_grade
  WHERE id = p_user_id;

  RETURN v_new_grade;
END;
$$;

-- 7. 소개글 업데이트 함수
CREATE OR REPLACE FUNCTION update_user_bio(
  p_user_id UUID,
  p_bio TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 길이 검증
  IF LENGTH(p_bio) > 500 THEN
    RETURN json_build_object(
      'success', false,
      'message', '소개글은 500자를 초과할 수 없습니다.'
    );
  END IF;

  -- 소개글 업데이트
  UPDATE profiles
  SET bio = p_bio
  WHERE id = p_user_id;

  RETURN json_build_object(
    'success', true,
    'message', '소개글이 업데이트되었습니다.'
  );
END;
$$;

-- 8. 기존 사용자 등급 초기화 (선택사항)
-- UPDATE profiles SET grade = '일반 회원' WHERE grade IS NULL;

-- 9. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_grade ON profiles(grade);

-- 10. 통계 조회 함수
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'username', p.username,
    'grade', p.grade,
    'bio', p.bio,
    'points', p.points,
    'selling_count', (
      SELECT COUNT(*) FROM photos WHERE user_id = p_user_id AND status = 'active'
    ),
    'sold_count', (
      SELECT COUNT(*) FROM photos WHERE user_id = p_user_id AND status = 'sold'
    ),
    'total_sales', (
      SELECT COALESCE(SUM(current_price), 0) FROM photos WHERE user_id = p_user_id AND status = 'sold'
    ),
    'likes_received', (
      SELECT COUNT(*) FROM likes l
      JOIN photos ph ON l.photo_id = ph.id
      WHERE ph.user_id = p_user_id
    )
  ) INTO v_stats
  FROM profiles p
  WHERE p.id = p_user_id;

  RETURN v_stats;
END;
$$;
