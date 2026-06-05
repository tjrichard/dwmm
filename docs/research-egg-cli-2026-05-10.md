# EGG 전용 CLI 해제기 리서치 결과 (2026-05-10)

## 결론 요약
- **있음**: EGG 전용/EGG 지원 CLI 해제기는 존재한다.
- 다만 **안정성과 접근성은 크게 다름**: 상용/GUI 기반 툴의 CLI, 비공식 오픈소스, 신규 커뮤니티 구현으로 나뉜다.

## 후보별 정리

1) Bandizip for macOS CLI (`Bandizip` 실행파일)
- 근거: macOS용 Bandizip이 터미널 명령행 파라미터(압축 해제 포함)를 공식 문서로 제공.
- 근거: Bandizip이 ALZ/EGG 포맷(분할 포함)을 지원한다고 공식 문서에 명시.
- 성격: 엄밀히는 "EGG 전용"은 아니지만, EGG 실무 해제용으로 가장 현실적인 CLI.
- 비고: macOS에서는 앱 설치 후 `/Applications/Bandizip.app/Contents/MacOS/Bandizip` 형태로 호출.

2) UnEgg (ESTsoft 관련 배포/소스 링크 존재)
- 근거: Bandisoft 도움말의 관련 링크에 "Download UnEGG source"가 존재.
- 근거: ALTools FAQ에서 EGG 전용 해제 프로그램 `UnEgg.exe` 안내.
- 성격: "EGG 전용" 계열.
- 비고: 공개 링크의 접근성/라이선스/현행 유지 상태가 불안정할 수 있음(직접 다운로드 실패 케이스 존재).

3) unegg-rs (커뮤니티 Rust CLI)
- 근거: docs.rs/crates.io 메타에 `unegg-rs`(2026-02-22 릴리스) 노출.
- 명시 기능: 분할 EGG 자동 탐색, 암호화/압축 알고리즘 지원 표기.
- 성격: 오픈소스 CLI, 비교적 신규.
- 비고: 운영 안정성 검증이 충분치 않을 수 있어 실제 대용량 복원 전 샘플 검증 권장.

## 제외/비권장
- `unar`, `7zip(7zz)`, `bsdtar/libarchive`:
  - 본 환경에서 EGG 인식 실패 확인.
  - EGG 전용 해제기로 보기 어려움.

## 실무 권장 순서
1. macOS: Bandizip 설치 후 CLI 사용
2. 불가 시: UnEgg 계열(출처/무결성 확인 필수)
3. 대안: unegg-rs를 빌드/테스트 후 사용

## 추가 관찰 (실행 단계)
- Homebrew Cask에는 `bandizip` 항목이 현재 없음.
- App Store 또는 밴디소프트 직접 배포 경로 사용 필요.

## 추가 관찰 (설치 차단)
- App Store 재다운로드 권한 문제로 `1596426184` 설치 불가.
- 공식 사이트 `www.bandizip.net` 접근 시 522 오류 발생.
- 대안으로 `unegg-rs` 같은 커뮤니티 CLI 시도 필요.
