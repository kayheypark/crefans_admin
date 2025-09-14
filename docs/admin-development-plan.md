# Crefans Admin 관리자 페이지 개발 계획

## 📋 프로젝트 개요

Crefans 플랫폼의 관리자 대시보드 구축을 위한 개발 계획서입니다. 본 관리자 페이지는 사용자 관리, 콘텐츠 관리, 결제 관리, 시스템 모니터링 등 플랫폼 운영에 필요한 핵심 기능을 제공합니다.

## 🎯 개발 목표

1. **효율적인 플랫폼 운영**: 관리자가 플랫폼을 효과적으로 관리할 수 있는 통합 대시보드 제공
2. **데이터 기반 의사결정**: 실시간 통계 및 분석 도구 제공
3. **보안 강화**: 역할 기반 접근 제어(RBAC) 및 감사 로그 구현
4. **확장 가능한 아키텍처**: 향후 기능 추가를 고려한 모듈식 설계

## 🏗️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Ant Design 5.x
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Charts**: Chart.js / Recharts
- **Form Handling**: React Hook Form
- **Data Fetching**: TanStack Query

### Backend Integration
- **API**: RESTful API (기존 crefans_server 활용)
- **Authentication**: AWS Cognito (관리자 전용 User Pool)
- **Authorization**: JWT + RBAC
- **Real-time Updates**: WebSocket (Socket.io)

## 📁 프로젝트 구조

```
crefans_admin/
├── docs/                      # 문서화
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/           # 인증 관련 페이지
│   │   │   ├── login/
│   │   │   └── forgot-password/
│   │   ├── dashboard/        # 대시보드
│   │   ├── users/            # 사용자 관리
│   │   ├── creators/         # 크리에이터 관리
│   │   ├── content/          # 콘텐츠 관리
│   │   ├── payments/         # 결제 관리
│   │   ├── reports/          # 신고 관리
│   │   ├── analytics/        # 통계 분석
│   │   └── settings/         # 시스템 설정
│   ├── components/           # 공통 컴포넌트
│   │   ├── layout/
│   │   ├── charts/
│   │   ├── tables/
│   │   └── forms/
│   ├── lib/                  # 유틸리티
│   │   ├── api/
│   │   ├── auth/
│   │   └── utils/
│   ├── hooks/                # Custom Hooks
│   ├── store/                # 상태 관리
│   └── types/                # TypeScript 타입 정의
├── public/                   # 정적 파일
├── tests/                    # 테스트 파일
└── package.json
```

## 🔧 핵심 기능

### 1. 인증 및 권한 관리
- [ ] 관리자 전용 로그인 시스템
- [ ] 다단계 인증(MFA) 지원
- [ ] 역할 기반 접근 제어 (Super Admin, Admin, Moderator)
- [ ] 세션 관리 및 자동 로그아웃
- [ ] 감사 로그 (Audit Log)

### 2. 대시보드
- [ ] 실시간 플랫폼 통계 (DAU, MAU, 매출 등)
- [ ] 주요 지표 위젯 (신규 가입, 활성 사용자, 콘텐츠 업로드 등)
- [ ] 알림 센터 (시스템 알림, 긴급 이슈 등)
- [ ] 최근 활동 로그

### 3. 사용자 관리
- [ ] 사용자 목록 조회 (검색, 필터링, 정렬)
- [ ] 사용자 상세 정보 조회
- [ ] 사용자 상태 관리 (활성/비활성/정지)
- [ ] 사용자 권한 수정
- [ ] 멤버십 관리
- [ ] 사용자 활동 이력 조회

### 4. 크리에이터 관리
- [ ] 크리에이터 승인/거부
- [ ] 크리에이터 등급 관리
- [ ] 수익 정산 관리
- [ ] 크리에이터 통계 대시보드
- [ ] 컨텐츠 품질 관리

### 5. 콘텐츠 관리
- [ ] 포스팅 목록 및 상세 조회
- [ ] 콘텐츠 검수 및 승인
- [ ] 부적절한 콘텐츠 관리
- [ ] 미디어 파일 관리 (S3)
- [ ] 콘텐츠 통계 분석
- [ ] 댓글 관리

### 6. 결제 및 정산 관리
- [ ] 결제 내역 조회
- [ ] 환불 처리
- [ ] 정산 관리
- [ ] 결제 통계 및 리포트
- [ ] 이상 거래 탐지

### 7. 신고 및 모니터링
- [ ] 신고 접수 목록
- [ ] 신고 처리 워크플로우
- [ ] 자동 필터링 규칙 설정
- [ ] 제재 이력 관리
- [ ] 이의 신청 처리

### 8. 시스템 설정
- [ ] 플랫폼 설정 관리
- [ ] 약관 및 정책 관리
- [ ] 공지사항 관리
- [ ] 배너 및 팝업 관리
- [ ] 이메일 템플릿 관리
- [ ] 시스템 로그 조회

## 🚀 개발 단계

### Phase 1: 기초 설정 (1주)
1. Next.js 프로젝트 초기화
2. 기본 프로젝트 구조 설정
3. TypeScript, ESLint, Prettier 설정
4. Tailwind CSS 및 Ant Design 설정
5. 환경 변수 및 설정 파일 구성

### Phase 2: 인증 시스템 (1주)
1. AWS Cognito 관리자 User Pool 생성
2. 로그인/로그아웃 구현
3. JWT 토큰 관리
4. 권한 검증 미들웨어 구현
5. Protected Route 구현

### Phase 3: 레이아웃 및 네비게이션 (3일)
1. 관리자 레이아웃 컴포넌트 개발
2. 사이드바 네비게이션 구현
3. 헤더 및 사용자 메뉴 구현
4. 반응형 디자인 적용

### Phase 4: 대시보드 (1주)
1. 통계 API 연동
2. 차트 컴포넌트 개발
3. 실시간 데이터 업데이트 구현
4. 위젯 시스템 구현

### Phase 5: 사용자 관리 (1.5주)
1. 사용자 목록 페이지 개발
2. 사용자 상세 페이지 개발
3. 사용자 관리 기능 구현
4. 검색 및 필터 기능 구현

### Phase 6: 콘텐츠 관리 (1.5주)
1. 포스팅 관리 페이지 개발
2. 미디어 관리 기능 구현
3. 콘텐츠 검수 워크플로우 구현
4. 댓글 관리 기능 구현

### Phase 7: 크리에이터 관리 (1주)
1. 크리에이터 목록 및 상세 페이지
2. 크리에이터 승인 프로세스
3. 정산 관리 기능
4. 크리에이터 통계 대시보드

### Phase 8: 결제 관리 (1주)
1. 결제 내역 조회 페이지
2. 환불 처리 기능
3. 결제 통계 및 리포트
4. 이상 거래 알림 시스템

### Phase 9: 신고 관리 (1주)
1. 신고 목록 및 상세 페이지
2. 신고 처리 워크플로우
3. 제재 관리 기능
4. 이의 신청 처리

### Phase 10: 시스템 설정 (1주)
1. 플랫폼 설정 페이지
2. 공지사항 관리
3. 약관 및 정책 관리
4. 이메일 템플릿 관리

### Phase 11: 테스트 및 최적화 (1주)
1. 단위 테스트 작성
2. 통합 테스트
3. 성능 최적화
4. 보안 점검
5. 접근성 개선

## 📝 API 연동 계획

### 필요한 API 엔드포인트 (crefans_server)

#### 관리자 인증
- `POST /admin/auth/login` - 관리자 로그인
- `POST /admin/auth/logout` - 로그아웃
- `POST /admin/auth/refresh` - 토큰 갱신
- `GET /admin/auth/me` - 현재 관리자 정보

#### 대시보드
- `GET /admin/dashboard/stats` - 대시보드 통계
- `GET /admin/dashboard/activities` - 최근 활동
- `GET /admin/dashboard/charts/{type}` - 차트 데이터

#### 사용자 관리
- `GET /admin/users` - 사용자 목록
- `GET /admin/users/{id}` - 사용자 상세
- `PUT /admin/users/{id}` - 사용자 정보 수정
- `POST /admin/users/{id}/suspend` - 사용자 정지
- `POST /admin/users/{id}/activate` - 사용자 활성화

#### 콘텐츠 관리
- `GET /admin/postings` - 포스팅 목록
- `GET /admin/postings/{id}` - 포스팅 상세
- `PUT /admin/postings/{id}` - 포스팅 수정
- `DELETE /admin/postings/{id}` - 포스팅 삭제
- `POST /admin/postings/{id}/approve` - 포스팅 승인
- `POST /admin/postings/{id}/reject` - 포스팅 거부

#### 신고 관리
- `GET /admin/reports` - 신고 목록
- `GET /admin/reports/{id}` - 신고 상세
- `PUT /admin/reports/{id}` - 신고 처리
- `POST /admin/reports/{id}/action` - 제재 조치

## 🔒 보안 고려사항

1. **접근 제어**
   - IP 화이트리스트
   - 2FA 필수 적용
   - 세션 타임아웃 설정

2. **데이터 보호**
   - 민감 정보 마스킹
   - 암호화된 통신 (HTTPS)
   - SQL Injection 방지

3. **감사 로그**
   - 모든 관리자 활동 기록
   - 변경 이력 추적
   - 정기적인 로그 검토

4. **권한 분리**
   - 최소 권한 원칙
   - 역할별 접근 제한
   - 민감 작업 승인 프로세스

## 📊 성능 목표

- 페이지 로드 시간: < 2초
- API 응답 시간: < 500ms
- 동시 접속자: 50명 이상 지원
- 가용성: 99.9% 이상

## 🧪 테스트 전략

1. **단위 테스트**
   - Jest를 사용한 컴포넌트 테스트
   - API 클라이언트 테스트
   - 유틸리티 함수 테스트

2. **통합 테스트**
   - E2E 테스트 (Playwright)
   - API 통합 테스트
   - 인증 플로우 테스트

3. **성능 테스트**
   - Lighthouse를 통한 성능 측정
   - 부하 테스트
   - 메모리 누수 검사

## 📅 일정

- **전체 개발 기간**: 약 10-12주
- **MVP 완성**: 6주
- **QA 및 안정화**: 2주
- **배포 준비**: 1주

## 🎨 UI/UX 가이드라인

1. **디자인 원칙**
   - 깔끔하고 직관적인 인터페이스
   - 일관된 디자인 시스템
   - 접근성 준수 (WCAG 2.1)

2. **컴포넌트 라이브러리**
   - Ant Design 기반 커스텀 테마
   - 재사용 가능한 컴포넌트
   - 다크 모드 지원

3. **반응형 디자인**
   - Desktop First 접근
   - 태블릿 지원
   - 최소 해상도: 1280x720

## 📦 배포 전략

1. **환경 구성**
   - Development: Vercel Preview
   - Staging: AWS Amplify
   - Production: AWS CloudFront + S3

2. **CI/CD**
   - GitHub Actions
   - 자동화된 테스트
   - 자동 배포 파이프라인

3. **모니터링**
   - Sentry for 에러 트래킹
   - Google Analytics
   - CloudWatch 로그

## 🔄 유지보수 계획

1. **정기 업데이트**
   - 보안 패치 적용
   - 의존성 업데이트
   - 버그 수정

2. **백업 전략**
   - 일일 데이터 백업
   - 설정 파일 백업
   - 재해 복구 계획

3. **문서화**
   - API 문서 자동 생성
   - 사용자 매뉴얼
   - 개발자 가이드

## 🚦 성공 지표

1. **기술적 지표**
   - 시스템 안정성 99.9%
   - 평균 응답 시간 < 500ms
   - 에러율 < 0.1%

2. **운영 지표**
   - 관리 작업 시간 50% 단축
   - 신고 처리 시간 30% 개선
   - 동시 처리 가능 작업 수 증가

3. **사용성 지표**
   - 관리자 만족도 90% 이상
   - 작업 완료율 95% 이상
   - 교육 시간 50% 단축

## 📌 다음 단계

1. **즉시 시작할 작업**
   - [ ] Next.js 프로젝트 초기화
   - [ ] 개발 환경 설정
   - [ ] Git 저장소 구조화
   - [ ] 기본 컴포넌트 구조 설계

2. **준비가 필요한 작업**
   - [ ] AWS Cognito Admin User Pool 생성
   - [ ] API 스펙 문서 작성
   - [ ] UI 디자인 시안 준비
   - [ ] 테스트 데이터 준비

3. **협의가 필요한 사항**
   - [ ] 관리자 권한 체계 확정
   - [ ] 보안 정책 수립
   - [ ] 배포 환경 결정
   - [ ] 모니터링 도구 선정

---

*이 문서는 지속적으로 업데이트되며, 개발 진행 상황에 따라 수정될 수 있습니다.*

*최종 수정일: 2025-01-14*