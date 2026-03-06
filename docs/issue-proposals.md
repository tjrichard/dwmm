# 이슈 탐색 기반 작업 제안 (4건)

코드베이스를 빠르게 점검한 뒤, 요청하신 4가지 카테고리(오탈자/버그/코멘트·문서 불일치/테스트 개선)로 바로 실행 가능한 작업을 정리했습니다.

## 1) 오탈자(메타 태그 속성명) 수정
- **유형**: 오탈자 수정
- **발견 이슈**: `public/index.html`의 메타 태그에서 `name` 속성값이 설명 키워드가 아닌 `DWMM(Design What Matters Most)`로 들어가 있어, 의도했던 `description` 메타가 동작하지 않습니다.
- **제안 작업**:
  - `<meta name="DWMM(Design What Matters Most)" ...>`를 `<meta name="description" ...>`로 수정
  - Next.js 메타 설정(`components/meta.js`)과 문구를 일치시키도록 정리
- **기대 효과**: 기본 SEO/미리보기 메타 인식 정확도 개선

## 2) 버그 수정 (실시간 커서 상태 갱신 로직)
- **유형**: 버그 수정
- **발견 이슈**: `hooks/use-realtime-cursor.ts`에서 `setCursors` 내부가 이전 상태 객체를 직접 변경(`delete prev[userId]`)하고, 삭제 대상 키도 현재 사용자 키(`userId`)를 사용해 의도와 다른 엔트리를 제거할 수 있습니다.
- **제안 작업**:
  - 상태를 불변 방식으로 복사한 뒤 정리
  - 삭제 대상 키를 `user.id` 기준으로 맞추고, stale cursor 정리 정책(예: timestamp TTL) 명확화
- **기대 효과**: 예기치 않은 커서 소실/잔상 감소, React 상태 일관성 확보

## 3) 코드 코멘트/문서 불일치 정리
- **유형**: 코멘트 또는 문서 불일치 수정
- **발견 이슈**: 루트 `README.md`는 `Under Construction`만 표기되어 있어 실제 코드 구조/실행 방법/환경변수 요구사항과 불일치합니다.
- **제안 작업**:
  - README에 최소 실행 가이드 추가(`pnpm|npm install`, `dev`, `build`, `start`)
  - 핵심 환경변수(`NOTION_API_KEY`, Supabase 키)와 기능 범위(북마크/워크 페이지) 기술
  - CRA 유산 파일(`public/index.html`)의 역할 여부를 문서로 명확화
- **기대 효과**: 온보딩 시간 단축, 운영·배포 실수 감소

## 4) 테스트 개선 (최소 회귀 방지 세트 구축)
- **유형**: 테스트 개선
- **발견 이슈**: Testing Library 의존성은 있으나 `package.json`에 테스트 스크립트가 없어 자동 검증 경로가 비어 있습니다.
- **제안 작업**:
  - `test` 스크립트(Jest 또는 Vitest) 추가
  - 우선순위 테스트 2건부터 작성
    1. `use-realtime-cursor`의 throttle 및 cursor 병합/정리 동작
    2. `WebsiteRequestForm` 제출 성공/실패 분기(UI 메시지) 검증
- **기대 효과**: 버그 재발 방지, 리팩터링 안전성 향상

---

### 점검에 사용한 주요 파일
- `public/index.html`
- `components/meta.js`
- `hooks/use-realtime-cursor.ts`
- `README.md`
- `package.json`
- `components/bookmark/WebsiteRequestForm.js`
