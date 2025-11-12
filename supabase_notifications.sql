-- ============================================
-- 인앱 알림 시스템 Supabase SQL
-- ============================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. notifications 테이블 생성
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- bid_outbid, auction_won, auction_lost, auction_sold, point_refund, photo_liked
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  photo_id UUID REFERENCES photos(id) ON DELETE CASCADE,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount INTEGER,
  is_read BOOLEAN DEFAULT false,
  action_url TEXT -- 클릭 시 이동할 URL
);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 2. 알림 생성 함수
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_photo_id UUID DEFAULT NULL,
  p_related_user_id UUID DEFAULT NULL,
  p_amount INTEGER DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    photo_id,
    related_user_id,
    amount,
    action_url
  )
  VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_photo_id,
    p_related_user_id,
    p_amount,
    p_action_url
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- 3. 알림 읽음 처리
CREATE OR REPLACE FUNCTION mark_notification_as_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE id = p_notification_id;
END;
$$;

-- 4. 모든 알림 읽음 처리
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = p_user_id AND is_read = false;
END;
$$;

-- 5. 오래된 알림 삭제 (30일 이상)
CREATE OR REPLACE FUNCTION delete_old_notifications()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- 6. 입찰 보증금 함수에 알림 추가 (기존 함수 수정)
CREATE OR REPLACE FUNCTION place_bid_with_deposit(
  p_photo_id UUID,
  p_user_id UUID,
  p_amount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_points INTEGER;
  v_current_price INTEGER;
  v_photo_status TEXT;
  v_photo_title TEXT;
  v_bid_id UUID;
BEGIN
  -- 1. 사용자 포인트 확인
  SELECT points INTO v_user_points
  FROM profiles
  WHERE id = p_user_id;

  IF v_user_points IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '사용자 정보를 찾을 수 없습니다.'
    );
  END IF;

  IF v_user_points < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'message', '보유 포인트가 부족합니다. (보유: ' || v_user_points || 'P)'
    );
  END IF;

  -- 2. 사진 정보 확인
  SELECT current_price, status, title INTO v_current_price, v_photo_status, v_photo_title
  FROM photos
  WHERE id = p_photo_id;

  IF v_photo_status != 'active' THEN
    RETURN json_build_object(
      'success', false,
      'message', '입찰할 수 없는 상태입니다.'
    );
  END IF;

  IF p_amount <= v_current_price THEN
    RETURN json_build_object(
      'success', false,
      'message', '현재가보다 높은 금액을 입력해주세요.'
    );
  END IF;

  -- 3. 포인트 차감 (보증금)
  UPDATE profiles
  SET points = points - p_amount
  WHERE id = p_user_id;

  -- 4. 입찰 생성
  INSERT INTO bids (photo_id, user_id, amount, status)
  VALUES (p_photo_id, p_user_id, p_amount, 'active')
  RETURNING id INTO v_bid_id;

  -- 5. 사진 현재가 업데이트
  UPDATE photos
  SET current_price = p_amount,
      bids = bids + 1
  WHERE id = p_photo_id;

  -- 6. 이전 최고가 입찰자들 상태 변경 및 보증금 환불 + 알림
  PERFORM refund_outbid_users_with_notification(p_photo_id, v_bid_id, v_photo_title);

  RETURN json_build_object(
    'success', true,
    'message', '입찰 성공! ' || p_amount || 'P (보증금 차감)',
    'bid_id', v_bid_id
  );
END;
$$;

-- 7. 밀린 입찰자 환불 + 알림
CREATE OR REPLACE FUNCTION refund_outbid_users_with_notification(
  p_photo_id UUID,
  p_new_highest_bid_id UUID,
  p_photo_title TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_outbid_user RECORD;
BEGIN
  -- 밀린 입찰자들 찾기
  FOR v_outbid_user IN
    SELECT b.user_id, b.amount, b.id
    FROM bids b
    WHERE b.photo_id = p_photo_id
      AND b.id != p_new_highest_bid_id
      AND b.status = 'active'
  LOOP
    -- 보증금 환불
    UPDATE profiles
    SET points = points + v_outbid_user.amount
    WHERE id = v_outbid_user.user_id;

    -- 입찰 상태 변경
    UPDATE bids
    SET status = 'outbid'
    WHERE id = v_outbid_user.id;

    -- 알림 생성
    PERFORM create_notification(
      v_outbid_user.user_id,
      'bid_outbid',
      '입찰이 경쟁에서 밀렸습니다',
      '"' || p_photo_title || '"에 더 높은 입찰이 들어왔습니다. 보증금 ' || v_outbid_user.amount || 'P가 환불되었습니다.',
      p_photo_id,
      NULL,
      v_outbid_user.amount,
      '/detail/' || p_photo_id
    );
  END LOOP;
END;
$$;

-- 8. 경매 종료 시 낙찰 알림 포함
CREATE OR REPLACE FUNCTION seller_finalize_auction(
  p_photo_id UUID,
  p_seller_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_highest_bid RECORD;
  v_bid RECORD;
  v_photo_seller_id UUID;
  v_photo_created_at TIMESTAMPTZ;
  v_photo_title TEXT;
  v_hours_elapsed NUMERIC;
BEGIN
  -- 1. 사진 정보 확인
  SELECT user_id, created_at, title INTO v_photo_seller_id, v_photo_created_at, v_photo_title
  FROM photos
  WHERE id = p_photo_id;

  IF v_photo_seller_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', '사진을 찾을 수 없습니다.');
  END IF;

  IF v_photo_seller_id != p_seller_id THEN
    RETURN json_build_object('success', false, 'message', '판매자만 낙찰할 수 있습니다.');
  END IF;

  -- 2. 24시간 경과 확인
  v_hours_elapsed := EXTRACT(EPOCH FROM (NOW() - v_photo_created_at)) / 3600;
  IF v_hours_elapsed < 24 THEN
    RETURN json_build_object('success', false, 'message', '경매 등록 후 24시간이 지나야 낙찰할 수 있습니다.');
  END IF;

  -- 3. 최고가 입찰 찾기
  SELECT * INTO v_highest_bid
  FROM bids
  WHERE photo_id = p_photo_id AND status = 'active'
  ORDER BY amount DESC
  LIMIT 1;

  IF v_highest_bid IS NULL THEN
    RETURN json_build_object('success', false, 'message', '입찰 내역이 없습니다.');
  END IF;

  -- 4. 낙찰 처리
  UPDATE bids SET status = 'won' WHERE id = v_highest_bid.id;
  UPDATE photos SET status = 'sold', current_price = v_highest_bid.amount WHERE id = p_photo_id;

  -- 5. 낙찰 성공 알림 (구매자)
  PERFORM create_notification(
    v_highest_bid.user_id,
    'auction_won',
    '🎉 낙찰 축하드립니다!',
    '"' || v_photo_title || '"을(를) ' || v_highest_bid.amount || 'P에 낙찰받았습니다!',
    p_photo_id,
    p_seller_id,
    v_highest_bid.amount,
    '/detail/' || p_photo_id
  );

  -- 6. 판매 완료 알림 (판매자)
  PERFORM create_notification(
    p_seller_id,
    'auction_sold',
    '💰 사진이 판매되었습니다',
    '"' || v_photo_title || '"이(가) ' || v_highest_bid.amount || 'P에 판매되었습니다!',
    p_photo_id,
    v_highest_bid.user_id,
    v_highest_bid.amount,
    '/detail/' || p_photo_id
  );

  -- 7. 나머지 입찰자 환불 + 실패 알림
  FOR v_bid IN
    SELECT user_id, amount, id
    FROM bids
    WHERE photo_id = p_photo_id AND id != v_highest_bid.id AND status = 'active'
  LOOP
    UPDATE profiles SET points = points + v_bid.amount WHERE id = v_bid.user_id;
    UPDATE bids SET status = 'outbid' WHERE id = v_bid.id;

    PERFORM create_notification(
      v_bid.user_id,
      'auction_lost',
      '아쉽게도 낙찰받지 못했습니다',
      '"' || v_photo_title || '" 경매가 종료되었습니다. 보증금 ' || v_bid.amount || 'P가 환불되었습니다.',
      p_photo_id,
      NULL,
      v_bid.amount,
      '/detail/' || p_photo_id
    );
  END LOOP;

  RETURN json_build_object('success', true, 'message', '낙찰 완료!');
END;
$$;

-- RLS (Row Level Security) 정책
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 자기 알림만 볼 수 있음
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- 자기 알림만 업데이트 가능
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- 자기 알림만 삭제 가능
CREATE POLICY "Users can delete own notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);
