-- ============================================
-- 판매자 포인트 지급 수정 (CRITICAL BUG FIX)
-- ============================================
-- 낙찰 시 판매자에게 포인트를 지급하는 로직이 누락되어 있었습니다.
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. seller_finalize_auction() 함수 수정 (판매자 수동 낙찰)
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

  -- ⭐ 5. 판매자에게 포인트 지급 (FIX: 이 부분이 빠져있었음!)
  UPDATE profiles
  SET points = points + v_highest_bid.amount
  WHERE id = p_seller_id;

  -- 6. 낙찰 성공 알림 (구매자)
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

  -- 7. 판매 완료 알림 (판매자)
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

  -- 8. 나머지 입찰자 환불 + 실패 알림
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

-- 2. auto_finalize_auction() 함수 수정 (7일 자동 낙찰)
CREATE OR REPLACE FUNCTION auto_finalize_auction(p_photo_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_highest_bid RECORD;
  v_photo_created_at TIMESTAMPTZ;
  v_photo_user_id UUID;
  v_photo_title TEXT;
  v_days_elapsed NUMERIC;
BEGIN
  -- 1. 사진 생성 시간 및 정보 확인
  SELECT created_at, user_id, title INTO v_photo_created_at, v_photo_user_id, v_photo_title
  FROM photos
  WHERE id = p_photo_id AND status = 'active';

  IF v_photo_created_at IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '진행 중인 경매가 아닙니다.'
    );
  END IF;

  -- 2. 7일 경과 확인
  v_days_elapsed := EXTRACT(EPOCH FROM (NOW() - v_photo_created_at)) / 86400;

  IF v_days_elapsed < 7 THEN
    RETURN json_build_object(
      'success', false,
      'message', '아직 자동 낙찰 시간이 아닙니다. (경과: ' || ROUND(v_days_elapsed::numeric, 1) || '일)'
    );
  END IF;

  -- 3. 최고가 입찰 찾기
  SELECT * INTO v_highest_bid
  FROM bids
  WHERE photo_id = p_photo_id
    AND status = 'active'
  ORDER BY amount DESC
  LIMIT 1;

  IF v_highest_bid IS NOT NULL THEN
    -- 입찰이 있는 경우: 낙찰 처리
    UPDATE bids
    SET status = 'won'
    WHERE id = v_highest_bid.id;

    UPDATE photos
    SET status = 'sold',
        current_price = v_highest_bid.amount
    WHERE id = p_photo_id;

    -- ⭐ 판매자에게 포인트 지급 (FIX: 이 부분이 빠져있었음!)
    UPDATE profiles
    SET points = points + v_highest_bid.amount
    WHERE id = v_photo_user_id;

    -- 낙찰자 제외 나머지 입찰자 보증금 환불
    UPDATE profiles p
    SET points = points + b.amount
    FROM bids b
    WHERE b.photo_id = p_photo_id
      AND b.id != v_highest_bid.id
      AND b.status = 'active'
      AND p.id = b.user_id;

    UPDATE bids
    SET status = 'outbid'
    WHERE photo_id = p_photo_id
      AND id != v_highest_bid.id
      AND status = 'active';

    -- 낙찰 알림 (기존 로직)
    PERFORM create_notification(
      v_highest_bid.user_id,
      'auction_won',
      '🎉 낙찰 축하드립니다!',
      '"' || v_photo_title || '"을(를) ' || v_highest_bid.amount || 'P에 낙찰받았습니다!',
      p_photo_id,
      v_photo_user_id,
      v_highest_bid.amount,
      '/detail/' || p_photo_id
    );

    PERFORM create_notification(
      v_photo_user_id,
      'auction_sold',
      '💰 사진이 판매되었습니다',
      '"' || v_photo_title || '"이(가) ' || v_highest_bid.amount || 'P에 판매되었습니다!',
      p_photo_id,
      v_highest_bid.user_id,
      v_highest_bid.amount,
      '/detail/' || p_photo_id
    );

    RETURN json_build_object(
      'success', true,
      'message', '자동 낙찰 완료! (7일 경과)',
      'winner_id', v_highest_bid.user_id,
      'amount', v_highest_bid.amount
    );
  ELSE
    -- 입찰이 없는 경우: 유찰 처리
    UPDATE photos
    SET status = 'expired'
    WHERE id = p_photo_id;

    -- 판매자에게 유찰 알림
    PERFORM create_notification(
      v_photo_user_id,
      'auction_expired',
      '⏰ 경매가 유찰되었습니다',
      '"' || v_photo_title || '"에 입찰이 없어 경매가 종료되었습니다. 가격을 조정하여 재등록하거나 삭제할 수 있습니다.',
      p_photo_id,
      NULL,
      NULL,
      '/detail/' || p_photo_id
    );

    RETURN json_build_object(
      'success', true,
      'message', '유찰 처리 완료 (입찰 없음)'
    );
  END IF;
END;
$$;

-- 3. 즉시구매 함수도 확인 (buy_now_with_deposit)
CREATE OR REPLACE FUNCTION buy_now_with_deposit(
  p_photo_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_points INTEGER;
  v_buy_now_price INTEGER;
  v_photo_status TEXT;
  v_photo_title TEXT;
  v_seller_id UUID;
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

  -- 2. 사진 정보 확인
  SELECT buy_now_price, status, title, user_id
  INTO v_buy_now_price, v_photo_status, v_photo_title, v_seller_id
  FROM photos
  WHERE id = p_photo_id;

  IF v_photo_status != 'active' THEN
    RETURN json_build_object(
      'success', false,
      'message', '즉시구매할 수 없는 상태입니다.'
    );
  END IF;

  -- 3. 포인트 충분한지 확인
  IF v_user_points < v_buy_now_price THEN
    RETURN json_build_object(
      'success', false,
      'message', '보유 포인트가 부족합니다. (필요: ' || v_buy_now_price || 'P, 보유: ' || v_user_points || 'P)'
    );
  END IF;

  -- 4. 구매자 포인트 차감
  UPDATE profiles
  SET points = points - v_buy_now_price
  WHERE id = p_user_id;

  -- ⭐ 5. 판매자에게 포인트 지급 (FIX: 이 부분 확인)
  UPDATE profiles
  SET points = points + v_buy_now_price
  WHERE id = v_seller_id;

  -- 6. 사진 상태 변경
  UPDATE photos
  SET status = 'sold',
      current_price = v_buy_now_price
  WHERE id = p_photo_id;

  -- 7. 다른 입찰자 환불
  UPDATE profiles p
  SET points = points + b.amount
  FROM bids b
  WHERE b.photo_id = p_photo_id
    AND b.status = 'active'
    AND p.id = b.user_id;

  UPDATE bids
  SET status = 'outbid'
  WHERE photo_id = p_photo_id
    AND status = 'active';

  -- 8. 낙찰 입찰 생성 (즉시구매)
  INSERT INTO bids (photo_id, user_id, amount, status)
  VALUES (p_photo_id, p_user_id, v_buy_now_price, 'won');

  -- 9. 알림 생성
  PERFORM create_notification(
    p_user_id,
    'auction_won',
    '🎉 즉시구매 성공!',
    '"' || v_photo_title || '"을(를) ' || v_buy_now_price || 'P에 즉시구매했습니다!',
    p_photo_id,
    v_seller_id,
    v_buy_now_price,
    '/detail/' || p_photo_id
  );

  PERFORM create_notification(
    v_seller_id,
    'auction_sold',
    '💰 사진이 즉시구매되었습니다',
    '"' || v_photo_title || '"이(가) ' || v_buy_now_price || 'P에 즉시 판매되었습니다!',
    p_photo_id,
    p_user_id,
    v_buy_now_price,
    '/detail/' || p_photo_id
  );

  RETURN json_build_object(
    'success', true,
    'message', '즉시구매 완료!'
  );
END;
$$;
