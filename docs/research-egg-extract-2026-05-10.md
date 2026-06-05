# EGG 분할압축 해제 리서치 (2026-05-10)

## 관찰
- 대상 파일 확인:
  - `/Users/jsh/Downloads/260426 인천대공원.vol1.egg`
  - `/Users/jsh/Downloads/260426 인천대공원.vol2.egg`
  - `/Users/jsh/Downloads/260426 인천대공원.vol3.egg`
  - `/Users/jsh/Downloads/260426 인천대공원.vol4.egg`
- 기존 1차 확인에서 `7z`, `unar`, `alz` 명령은 PATH에서 미검출.

## 가설
- 환경에 EGG 해제 도구가 없으면 CLI 해제는 실패한다.
- 도구가 있으면 `vol1.egg`만 지정해도 나머지 분할본을 자동 참조한다.

## 다음 액션
- `7zz`, `bsdtar`, `unar`, `7z` 등 추가 후보 재확인 후 해제 시도.
