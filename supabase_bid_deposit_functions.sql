-- ============================================
-- 입찰 보증금 시스템 Supabase RPC 함수들
-- ============================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. 입찰하기 (보증금 차감)
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
  SELECT current_price, status INTO v_current_price, v_photo_status
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

  -- 6. 이전 최고가 입찰자들 상태 변경 및 보증금 환불
  PERFORM refund_outbid_users(p_photo_id, v_bid_id);

  RETURN json_build_object(
    'success', true,
    'message', '입찰 성공! ' || p_amount || 'P (보증금 차감)',
    'bid_id', v_bid_id
  );
END;
$$;

-- 2. 입찰 취소 (보증금 환불)
CREATE OR REPLACE FUNCTION cancel_bid(
  p_bid_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_bid_amount INTEGER;
  v_bid_status TEXT;
  v_bid_user_id UUID;
  v_photo_id UUID;
  v_is_highest BOOLEAN;
BEGIN
  -- 1. 입찰 정보 확인
  SELECT amount, status, user_id, photo_id
  INTO v_bid_amount, v_bid_status, v_bid_user_id, v_photo_id
  FROM bids
  WHERE id = p_bid_id;

  IF v_bid_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '입찰 정보를 찾을 수 없습니다.'
    );
  END IF;

  IF v_bid_user_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', '본인의 입찰만 취소할 수 있습니다.'
    );
  END IF;

  IF v_bid_status != 'active' THEN
    RETURN json_build_object(
      'success', false,
      'message', '이미 처리된 입찰입니다.'
    );
  END IF;

  -- 2. 최고가 입찰인지 확인
  SELECT EXISTS(
    SELECT 1 FROM bids
    WHERE photo_id = v_photo_id
    AND amount > v_bid_amount
    AND status = 'active'
  ) INTO v_is_highest;

  -- 최고가 입찰은 취소 불가
  IF NOT v_is_highest THEN
    -- 현재 최고가 확인
    IF EXISTS(
      SELECT 1 FROM bids
      WHERE photo_id = v_photo_id
      AND id = p_bid_id
      AND amount = (SELECT MAX(amount) FROM bids WHERE photo_id = v_photo_id AND status = 'active')
    ) THEN
      RETURN json_build_object(
        'success', false,
        'message', '최고가 입찰은 취소할 수 없습니다.'
      );
    END IF;
  END IF;

  -- 3. 보증금 환불
  UPDATE profiles
  SET points = points + v_bid_amount
  WHERE id = p_user_id;

  -- 4. 입찰 상태 변경
  UPDATE bids
  SET status = 'cancelled'
  WHERE id = p_bid_id;

  RETURN json_build_object(
    'success', true,
    'message', '입찰이 취소되었습니다. ' || v_bid_amount || 'P 환불 완료'
  );
END;
$$;

-- 3. 밀린 입찰자들 보증금 환불
CREATE OR REPLACE FUNCTION refund_outbid_users(
  p_photo_id UUID,
  p_new_highest_bid_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 이전 active 상태의 입찰들을 outbid로 변경하고 보증금 환불
  UPDATE profiles p
  SET points = points + b.amount
  FROM bids b
  WHERE b.photo_id = p_photo_id
    AND b.id != p_new_highest_bid_id
    AND b.status = 'active'
    AND p.id = b.user_id;

  -- 입찰 상태를 outbid로 변경
  UPDATE bids
  SET status = 'outbid'
  WHERE photo_id = p_photo_id
    AND id != p_new_highest_bid_id
    AND status = 'active';
END;
$$;

-- 4. 판매자가 수동으로 낙찰 처리 (24시간 후부터 가능)
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
  v_photo_seller_id UUID;
  v_photo_created_at TIMESTAMPTZ;
  v_hours_elapsed NUMERIC;
BEGIN
  -- 1. 사진 정보 확인
  SELECT user_id, created_at INTO v_photo_seller_id, v_photo_created_at
  FROM photos
  WHERE id = p_photo_id;

  IF v_photo_seller_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '사진을 찾을 수 없습니다.'
    );
  END IF;

  -- 2. 판매자 본인 확인
  IF v_photo_seller_id != p_seller_id THEN
    RETURN json_build_object(
      'success', false,
      'message', '판매자만 낙찰할 수 있습니다.'
    );
  END IF;

  -- 3. 24시간 경과 확인
  v_hours_elapsed := EXTRACT(EPOCH FROM (NOW() - v_photo_created_at)) / 3600;

  IF v_hours_elapsed < 24 THEN
    RETURN json_build_object(
      'success', false,
      'message', '경매 등록 후 24시간이 지나야 낙찰할 수 있습니다. (경과: ' || ROUND(v_hours_elapsed::numeric, 1) || '시간)'
    );
  END IF;

  -- 4. 최고가 입찰 찾기
  SELECT * INTO v_highest_bid
  FROM bids
  WHERE photo_id = p_photo_id
    AND status = 'active'
  ORDER BY amount DESC
  LIMIT 1;

  IF v_highest_bid IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '입찰 내역이 없습니다.'
    );
  END IF;

  -- 5. 낙찰 처리
  UPDATE bids
  SET status = 'won'
  WHERE id = v_highest_bid.id;

  -- 6. 사진 상태 변경
  UPDATE photos
  SET status = 'sold',
      current_price = v_highest_bid.amount
  WHERE id = p_photo_id;

  -- 7. 낙찰자 제외 나머지 입찰자 보증금 환불
  UPDATE profiles p
  SET points = points + b.amount
  FROM bids b
  WHERE b.photo_id = p_photo_id
    AND b.id != v_highest_bid.id
    AND b.status = 'active'
    AND p.id = b.user_id;

  -- 8. 낙찰 실패한 입찰들 상태 변경
  UPDATE bids
  SET status = 'outbid'
  WHERE photo_id = p_photo_id
    AND id != v_highest_bid.id
    AND status = 'active';

  RETURN json_build_object(
    'success', true,
    'message', '낙찰 완료! 최고가: ' || v_highest_bid.amount || 'P',
    'winner_id', v_highest_bid.user_id,
    'amount', v_highest_bid.amount
  );
END;
$$;

-- 5. 자동 낙찰 처리 (7일 경과 시)
CREATE OR REPLACE FUNCTION auto_finalize_auction(p_photo_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_highest_bid RECORD;
  v_photo_created_at TIMESTAMPTZ;
  v_days_elapsed NUMERIC;
BEGIN
  -- 1. 사진 생성 시간 확인
  SELECT created_at INTO v_photo_created_at
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
    -- 낙찰 처리
    UPDATE bids
    SET status = 'won'
    WHERE id = v_highest_bid.id;

    -- 사진 상태 변경
    UPDATE photos
    SET status = 'sold',
        current_price = v_highest_bid.amount
    WHERE id = p_photo_id;

    -- 낙찰자 제외 나머지 입찰자 보증금 환불
    UPDATE profiles p
    SET points = points + b.amount
    FROM bids b
    WHERE b.photo_id = p_photo_id
      AND b.id != v_highest_bid.id
      AND b.status = 'active'
      AND p.id = b.user_id;

    -- 낙찰 실패한 입찰들 상태 변경
    UPDATE bids
    SET status = 'outbid'
    WHERE photo_id = p_photo_id
      AND id != v_highest_bid.id
      AND status = 'active';

    RETURN json_build_object(
      'success', true,
      'message', '자동 낙찰 완료! (7일 경과)',
      'winner_id', v_highest_bid.user_id,
      'amount', v_highest_bid.amount
    );
  ELSE
    -- 입찰이 없으면 경매 만료
    UPDATE photos
    SET status = 'expired'
    WHERE id = p_photo_id;

    RETURN json_build_object(
      'success', true,
      'message', '입찰이 없어 경매가 만료되었습니다.'
    );
  END IF;
END;
$$;

-- 6. 경매 상태 확인 (24시간 경과 여부, 7일 경과 여부)
CREATE OR REPLACE FUNCTION check_auction_status(p_photo_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_created_at TIMESTAMPTZ;
  v_hours_elapsed NUMERIC;
  v_days_elapsed NUMERIC;
  v_can_finalize BOOLEAN;
  v_should_auto_finalize BOOLEAN;
BEGIN
  SELECT created_at INTO v_created_at
  FROM photos
  WHERE id = p_photo_id;

  IF v_created_at IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '사진을 찾을 수 없습니다.'
    );
  END IF;

  v_hours_elapsed := EXTRACT(EPOCH FROM (NOW() - v_created_at)) / 3600;
  v_days_elapsed := v_hours_elapsed / 24;
  v_can_finalize := v_hours_elapsed >= 24;
  v_should_auto_finalize := v_days_elapsed >= 7;

  RETURN json_build_object(
    'success', true,
    'hours_elapsed', ROUND(v_hours_elapsed::numeric, 1),
    'days_elapsed', ROUND(v_days_elapsed::numeric, 1),
    'can_finalize', v_can_finalize,
    'should_auto_finalize', v_should_auto_finalize
  );
END;
$$;

-- 5. 즉시 구매 시 보증금 차감 및 환불
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
  SELECT buy_now_price, status INTO v_buy_now_price, v_photo_status
  FROM photos
  WHERE id = p_photo_id;

  IF v_photo_status != 'active' THEN
    RETURN json_build_object(
      'success', false,
      'message', '구매할 수 없는 상태입니다.'
    );
  END IF;

  IF v_user_points < v_buy_now_price THEN
    RETURN json_build_object(
      'success', false,
      'message', '보유 포인트가 부족합니다. (보유: ' || v_user_points || 'P)'
    );
  END IF;

  -- 3. 포인트 차감
  UPDATE profiles
  SET points = points - v_buy_now_price
  WHERE id = p_user_id;

  -- 4. 낙찰 입찰 생성
  INSERT INTO bids (photo_id, user_id, amount, status)
  VALUES (p_photo_id, p_user_id, v_buy_now_price, 'won');

  -- 5. 사진 상태 변경
  UPDATE photos
  SET status = 'sold',
      current_price = v_buy_now_price
  WHERE id = p_photo_id;

  -- 6. 기존 입찰자들 보증금 환불
  UPDATE profiles p
  SET points = points + b.amount
  FROM bids b
  WHERE b.photo_id = p_photo_id
    AND b.status = 'active'
    AND p.id = b.user_id;

  -- 7. 기존 입찰들 상태 변경
  UPDATE bids
  SET status = 'outbid'
  WHERE photo_id = p_photo_id
    AND status = 'active';

  RETURN json_build_object(
    'success', true,
    'message', '구매 완료! 🎉'
  );
END;
$$;
