-- ============================================
-- 오래된 게시물 일괄 정리 스크립트
-- ============================================
-- 유찰 시스템 구현 전 올렸던 오래된 게시물들을 정리합니다.

-- 1. 현재 상태 확인 (실행 전 확인용)
SELECT
  '정리 대상 게시물' AS 구분,
  COUNT(*) AS 개수,
  STRING_AGG(title, ', ') AS 제목들
FROM photos
WHERE status = 'active'
  AND created_at < NOW() - INTERVAL '7 days'
GROUP BY status;

-- 2. 7일 이상 지난 active 게시물 유찰 처리
-- ⚠️ 실행하기 전에 위의 SELECT로 먼저 확인하세요!
UPDATE photos
SET status = 'expired',
    updated_at = NOW()
WHERE status = 'active'
  AND created_at < NOW() - INTERVAL '7 days';

-- 3. 처리 결과 확인
SELECT
  status,
  COUNT(*) AS 개수
FROM photos
GROUP BY status;

-- 4. 유찰 처리된 게시물 목록
SELECT
  id,
  title,
  status,
  bids,
  created_at,
  updated_at
FROM photos
WHERE status = 'expired'
ORDER BY updated_at DESC
LIMIT 10;
