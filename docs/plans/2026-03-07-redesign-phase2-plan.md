# DWMM Phase 2 실행 계획 (2026-03-07)

## 목적
- Suggest 로딩 경험 현황 조사 후 감성적/고급형 단계 피드백으로 재설계
- Works/Blog(Notion 단일 소스) 응답 성능 최적화(목표: 체감 <1s)
- 라우팅 정책 A 적용(`/` 허브 + `/bookmarks` 명시화)
- 문서 업데이트(허브 정의/검색 UX 강도/콘셉트 반영)

## 확정된 요구사항(사용자 지시 반영)
1. Suggest 로딩은 이미 단계형이지만 디자인/설계를 재구성
2. Notion API 응답 속도 재설계(리스트/슬러그 모두 빠르게)
3. 라우팅 정책 A 적용 + 허브 정의를 문서에 반영
4. Blog/Works는 같은 소스/같은 페이지, 카테고리만 다름
5. 지니 효과 강도 70%
6. 톤: 감성적
7. 신규 의존성 추가 가능

## 구현 범위
### A. 라우팅/네비
- `/bookmarks` 페이지 신설(기존 북마크 경험 유지)
- `/` 허브 페이지 추가(북마크·Works/Blog 진입 허브)
- 헤더에 명시적 네비(허브, Bookmarks, Works/Blog)

### B. Suggest 경험 재설계
- `components/bookmark/LoadingOverlay.js` 재설계
  - 감성적 카피 + 단계형 진행 바 + 글래스/그라데이션 비주얼
  - 접근성(aria-live), 단계 완료 체크, 제출 중 중복 방지
- `components/bookmark/WebsiteRequestForm.js` 상태/카피 정비
- 관련 SCSS 업데이트

### C. Notion 성능 최적화
- `lib/notion.js`: in-memory TTL 캐시 + in-flight dedupe + 병렬 hydration
- `pages/api/works/*.js`: 캐시 헤더(s-maxage, stale-while-revalidate)
- `pages/works/index.js`, `pages/works/[slug].js`:
  - API 호출에 timeout/abort + 즉시 렌더 가능한 최소 데이터 우선
  - 블록 chunk 로딩 선행/지연 분리

### D. 리서치/설계 문서
- `docs/research/2026-03-07-suggest-loading-audit.md`
- `reference/command-palette-solution-research.md`
- `docs/redesign-whitepaper.md` 허브/works-blog 단일소스/검색 UX 강도 업데이트

## 테스트 시나리오
1. 라우팅: `/` `/bookmarks` `/works` 이동 및 active 상태
2. Suggest: 단계 노출, 성공/실패, 중복 제출 방지, 재시도
3. Notion 리스트 API: 초기 응답 캐시 히트/미스 확인
4. Works 상세: 메타 즉시/콘텐츠 점진 로딩 정상
5. 회귀: 북마크 필터/검색/무한스크롤 동작 유지
6. 린트/테스트 스크립트 실행(없으면 실패 로그 리포팅)

## 리스크 및 보완
- 실제 Notion 원격 지연은 완전 제거 불가 → 캐시/중복요청 억제로 체감속도 개선
- Genie 70% 모션은 과하면 멀미 가능 → prefers-reduced-motion 대응

## 더 나은 대안(계획 수정 제안)
- 중장기적으로는 Notion 콘텐츠를 빌드/백그라운드 동기화해 Supabase 캐시 테이블로 제공하면 <1s 안정 달성 가능.
- 이번 단계는 무중단 적용 가능한 애플리케이션 레벨 캐시/요청 병합 중심으로 수행.
