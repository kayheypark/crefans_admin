# Crefans Admin MVP 개발 계획

## 🎯 MVP 목표

관리자가 플랫폼을 운영하는데 필요한 최소 핵심 기능만 구현 (3-4주 완성)

## 🛠 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Ant Design
- **Backend**: 기존 crefans_server API 활용
- **Auth**: AWS Cognito

## 📁 간단한 프로젝트 구조

```
crefans_admin/
├── src/
│   ├── app/
│   │   ├── login/          # 로그인
│   │   ├── dashboard/      # 대시보드
│   │   ├── users/          # 사용자 관리
│   │   ├── postings/       # 포스팅 관리
│   │   └── reports/        # 신고 관리
│   ├── components/         # 공통 컴포넌트
│   ├── lib/               # API 클라이언트
│   └── types/             # 타입 정의
└── package.json
```

## ✅ MVP 핵심 기능 (5개만)

### 1. 관리자 로그인

- AWS Cognito 기반 로그인
- JWT 토큰 관리
- 로그아웃

### 2. 대시보드

- 오늘의 주요 지표 (신규 가입, 포스팅 수, 매출)
- 최근 7일 통계 그래프
- 긴급 처리 필요 항목 (신고, 문의)

### 3. 사용자 관리

- 사용자 목록 (검색, 페이지네이션)
- 사용자 상세 정보 조회
- 사용자 정지/활성화

### 4. 포스팅 관리

- 포스팅 목록 (최신순)
- 포스팅 상세 조회
- 포스팅 삭제
- 부적절한 콘텐츠 숨김 처리

### 5. 신고 관리

- 신고 목록 (미처리 우선)
- 신고 상세 및 처리
- 처리 상태 변경 (검토중/처리완료/반려)

## 📅 개발 일정 (3주)

### Week 1: 기초 설정

- Day 1-2: Next.js 설정, 로그인 구현
- Day 3-4: 레이아웃, 라우팅
- Day 5: API 연동 기본 구조

### Week 2: 핵심 기능

- Day 1-2: 대시보드
- Day 3-4: 사용자 관리
- Day 5: 포스팅 관리

### Week 3: 완성

- Day 1-2: 신고 관리
- Day 3: 버그 수정
- Day 4-5: 테스트 및 배포

## 🔌 필요한 API (최소)

### 인증

- `POST /admin/login`
- `GET /admin/me`

### 대시보드

- `GET /admin/stats/today`
- `GET /admin/stats/week`

### 사용자

- `GET /admin/users`
- `GET /admin/users/{id}`
- `PUT /admin/users/{id}/status`

### 포스팅

- `GET /admin/postings`
- `GET /admin/postings/{id}`
- `DELETE /admin/postings/{id}`
- `PUT /admin/postings/{id}/hide`

### 신고

- `GET /admin/reports`
- `GET /admin/reports/{id}`
- `PUT /admin/reports/{id}/status`

## 🚀 즉시 시작

```bash
# 1. Next.js 프로젝트 생성
npx create-next-app@latest crefans_admin --typescript --tailwind --app

# 2. 필수 패키지 설치
npm install antd @tanstack/react-query axios zustand

# 3. 환경 변수 설정 (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_COGNITO_USER_POOL_ID=xxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxx
```

## 📝 MVP 이후 추가 기능

- 크리에이터 관리
- 결제/정산 관리
- 상세 통계 분석
- 공지사항 관리
- 역할 기반 권한 (RBAC)
- 실시간 알림
- 배치 작업
- 감사 로그

## ⚡ 성공 기준

- 관리자가 로그인하여 기본 운영 가능
- 사용자/콘텐츠 관리 가능
- 신고 처리 가능
- 페이지 로드 < 3초
- 모바일 반응형 지원

---

_MVP 완성 목표: 3주_
