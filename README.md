# DWMM (Design What Matters Most)

🚜 Under Construction…

## 🚀 Sanity CMS 설정

이 프로젝트는 Sanity CMS를 사용하여 콘텐츠를 관리합니다.

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# Sanity Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-01-01

# Sanity API Read Token (for live preview and draft mode)
SANITY_API_READ_TOKEN=your_read_token_here

# Sanity Studio URL (optional)
NEXT_PUBLIC_SANITY_STUDIO_URL=/cms
```

### 개발 서버 실행

```bash
npm run dev
```

개발 서버 실행 시 자동으로 Sanity 스키마에서 TypeScript 타입이 생성됩니다.

### Sanity Studio 접근

CMS 관리자 페이지: `/cms`

### 빌드

```bash
npm run build
```

빌드 시에도 자동으로 타입이 생성됩니다.