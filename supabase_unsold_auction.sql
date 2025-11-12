-- ============================================
-- 유찰 관리 시스템 Supabase SQL
-- ============================================
-- 이 SQL을 Supabase SQL Editor에서 실행하세요

-- 1. 자동 유찰 처리 함수 수정 (입찰 없을 때)
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

-- 2. 경매 재등록 함수
CREATE OR REPLACE FUNCTION relist_auction(
  p_photo_id UUID,
  p_user_id UUID,
  p_new_start_price INTEGER,
  p_new_buy_now_price INTEGER,
  p_duration_days INTEGER DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_photo_user_id UUID;
  v_photo_status TEXT;
  v_photo_title TEXT;
BEGIN
  -- 1. 사진 정보 확인
  SELECT user_id, status, title INTO v_photo_user_id, v_photo_status, v_photo_title
  FROM photos
  WHERE id = p_photo_id;

  IF v_photo_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '사진을 찾을 수 없습니다.'
    );
  END IF;

  -- 2. 판매자 본인 확인
  IF v_photo_user_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', '본인의 사진만 재등록할 수 있습니다.'
    );
  END IF;

  -- 3. 유찰 상태 확인
  IF v_photo_status != 'expired' THEN
    RETURN json_build_object(
      'success', false,
      'message', '유찰된 사진만 재등록할 수 있습니다.'
    );
  END IF;

  -- 4. 가격 검증
  IF p_new_start_price <= 0 OR p_new_buy_now_price <= 0 THEN
    RETURN json_build_object(
      'success', false,
      'message', '가격은 0보다 커야 합니다.'
    );
  END IF;

  IF p_new_buy_now_price <= p_new_start_price THEN
    RETURN json_build_object(
      'success', false,
      'message', '즉시구매가는 시작가보다 높아야 합니다.'
    );
  END IF;

  -- 5. 사진 재등록 (새로운 가격, 새로운 종료 시간)
  UPDATE photos
  SET
    status = 'active',
    current_price = p_new_start_price,
    buy_now_price = p_new_buy_now_price,
    end_time = NOW() + (p_duration_days || ' days')::INTERVAL,
    bids = 0,
    created_at = NOW()
  WHERE id = p_photo_id;

  -- 6. 재등록 알림
  PERFORM create_notification(
    p_user_id,
    'auction_relisted',
    '✅ 경매가 재등록되었습니다',
    '"' || v_photo_title || '"이(가) 새로운 가격으로 재등록되었습니다. (시작가: ' || p_new_start_price || 'P)',
    p_photo_id,
    NULL,
    p_new_start_price,
    '/detail/' || p_photo_id
  );

  RETURN json_build_object(
    'success', true,
    'message', '재등록 완료! 새로운 경매가 시작되었습니다.',
    'new_start_price', p_new_start_price,
    'new_buy_now_price', p_new_buy_now_price,
    'end_time', NOW() + (p_duration_days || ' days')::INTERVAL
  );
END;
$$;

-- 3. 유찰된 사진 삭제 함수
CREATE OR REPLACE FUNCTION delete_expired_photo(
  p_photo_id UUID,
  p_user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_photo_user_id UUID;
  v_photo_status TEXT;
  v_photo_title TEXT;
BEGIN
  -- 1. 사진 정보 확인
  SELECT user_id, status, title INTO v_photo_user_id, v_photo_status, v_photo_title
  FROM photos
  WHERE id = p_photo_id;

  IF v_photo_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '사진을 찾을 수 없습니다.'
    );
  END IF;

  -- 2. 판매자 본인 확인
  IF v_photo_user_id != p_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', '본인의 사진만 삭제할 수 있습니다.'
    );
  END IF;

  -- 3. 유찰 상태 확인
  IF v_photo_status != 'expired' THEN
    RETURN json_build_object(
      'success', false,
      'message', '유찰된 사진만 삭제할 수 있습니다.'
    );
  END IF;

  -- 4. 사진 삭제 (CASCADE로 관련 데이터도 삭제됨)
  DELETE FROM photos
  WHERE id = p_photo_id;

  RETURN json_build_object(
    'success', true,
    'message', '사진이 삭제되었습니다.'
  );
END;
$$;

-- 4. 유찰 확인 함수
CREATE OR REPLACE FUNCTION check_if_expired(p_photo_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_photo RECORD;
  v_bid_count INTEGER;
BEGIN
  -- 사진 정보 가져오기
  SELECT * INTO v_photo
  FROM photos
  WHERE id = p_photo_id;

  IF v_photo.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', '사진을 찾을 수 없습니다.'
    );
  END IF;

  -- 입찰 수 확인
  SELECT COUNT(*) INTO v_bid_count
  FROM bids
  WHERE photo_id = p_photo_id;

  RETURN json_build_object(
    'success', true,
    'status', v_photo.status,
    'bid_count', v_bid_count,
    'is_expired', v_photo.status = 'expired',
    'has_no_bids', v_bid_count = 0
  );
END;
$$;
