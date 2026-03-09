# Command Palette 레퍼런스 솔루션 리서치

## 목표
- Mobbin / Raycast / Linear 수준의 통합 검색 UX를 DWMM에 맞게 구현
- 헤더/하단 트리거 + 단축키 + 감성적 Genie 모션(강도 70%)

## 벤치마크 패턴 요약

### Mobbin
- 이미지/콘텐츠 중심 카드 결과
- 필터가 검색 흐름을 방해하지 않고 결과와 함께 노출

### Raycast
- 키보드 퍼스트
- 빠른 인덱스 조회 + 액션 중심
- 결과 그룹화와 즉시 실행 경험이 우수

### Linear
- 검색/이동/명령이 하나의 인터페이스에서 결합
- 섹션 헤더와 score 기반 정렬이 명확

## DWMM 적용 아키텍처 제안

### 데이터 소스 통합
- Source A: Supabase 북마크
- Source B: Notion Works/Blog(동일 소스)
- Source C: Career timeline
- Source D: 카테고리/태그

### 검색 레이어
1. 서버 API: `GET /api/search?q=`
2. 캐시 레이어: in-memory + CDN cache
3. 클라이언트: 디바운스 + 섹션별 렌더

## 후보 라이브러리 비교

### 1) `cmdk`
- 장점: 접근성/키보드 UX 성숙, React 친화적
- 단점: 애니메이션은 별도 구현 필요
- 평가: **채택 추천**

### 2) `framer-motion`
- 장점: 고급 트랜지션/스프링, Genie 느낌 구현 용이
- 단점: 번들 증가
- 평가: **채택 추천**

### 3) `fuse.js`
- 장점: 로컬 퍼지 검색 품질 우수
- 단점: 데이터 증가 시 초기 인덱싱 부담
- 평가: 중소형 데이터셋에 추천

### 4) `@tanstack/react-query`
- 장점: 캐싱/재시도/stale 관리 체계적
- 단점: 도입 비용
- 평가: 검색/목록 API 많아질 경우 추천

## 권장 기술 스택(최고 품질 우선)
- UI: `cmdk`
- 모션: `framer-motion`
- 검색 정확도: `fuse.js`(클라이언트) + 서버 prefilter
- 데이터 캐시: API 캐시 헤더 + 메모리 캐시

## Genie 모션 구현 가이드 (70%)
- 등장 위치: 트리거 버튼 위치에서 시작
- 방식: transform-origin + scaleY/scaleX + clip-path + spring
- 강도 기준:
  - scale overshoot: 1.08
  - spring stiffness: 중상
  - duration 체감: 280~420ms
- 접근성:
  - `prefers-reduced-motion`에서는 fade + slight scale로 대체

## UX 카피 톤
- 감성적/큐레이션 중심 문장 사용
- 예: “좋은 작업을 찾고 있어요…”, “태그의 결을 맞추는 중…”

## 단계별 구현 제안
1. 1차: 통합 검색 API + cmdk 기본 UI + 키보드 이동
2. 2차: 섹션별 결과/필터 칩 + 빠른 액션
3. 3차: Genie 모션(70%) + 모바일 하단 트리거
4. 4차: 랭킹/개인화/최근 검색
