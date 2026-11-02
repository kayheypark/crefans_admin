# 크레팬스 운영 콘솔

서비스 프론트 `crefans_front`와 별개인 `crefans_admin` 저장소입니다. 현재 런타임은 Next.js 15.5 / React 18 / TypeScript이며, 신규 자체 인증과 `/api/v1/admin`만 사용합니다. 기존 Cognito/비버전 관련 파일은 참고용으로 남아 있고 신규 layout/page에서 import하지 않습니다. 기존 dashboard/users/posts/media/reports/board URL은 새 콘솔로 연결합니다.

## 실행

```sh
npm ci
cp .env.example .env.local
npm run dev
```

주소: http://127.0.0.1:3002/console (비로그인 시 /login). API는 별도 crefans_server의 신규 런타임(기본127.0.0.1:3001)이 필요합니다. `CREFANS_API_ORIGIN`은 고정 서버 주소이며 Next rewrites 생성 시 적용하므로 바꾸면 재시작/재빌드합니다. 백엔드 `FRONTEND_ORIGINS`에 콘솔의 정확한 출처를 등록해야 합니다. 운영은 HTTPS·호스트 전용 쿠키를 권장하고 관리자 도메인을 임의로 공개 배포하지 않습니다. 서비스 프론트·목업 링크는 변경하지 않습니다.

관리자 계정은 서버의 `scripts/platform-admin.cjs`로 **기존 확인된 회원**에게 명시적으로 부여합니다. 기본 계정·기본 비밀번호·브라우저 토큰 저장은 없습니다. SUPER_ADMIN/ADMIN만 매출을 보고, MODERATOR는 재무 화면/API에 접근할 수 없습니다. 금융 정책 수정은 SUPER_ADMIN만 가능합니다.

## 최소 메뉴

| 화면 | 제공 기능 |
| --- | --- |
| 대시보드 | 신규 구독·구독 결제 건수·총액·환불 차감액 전일 비교, 7/30/90일 추이, 현재 잔여 구독, 회원/크리에이터/게시물 수, 미처리 신고·문의, 실패 결제·대기 출금, 미발송 알림, 배치 마지막 확인 |
| 회원·크리에이터 | 검색·페이지 조회·상태 확인 |
| 예약 핸들 관리 | 후보·예약 목록 검색·상태 필터·추가·수정·예약/해제·삭제/복구·변경 이력 |
| 콘텐츠·신고 | 게시물 조회·신고 처리 및 메모. 신고 처리는 콘텐츠를 자동 숨기지 않음 |
| 매출·정산 | 기간 합계·일별·크리에이터별 원장, 결제 상태·출금 신청 조회 |
| 고객지원 | 최근100개 문의/답변, 공지·FAQ 작성·게시 |
| 운영 설정 | 활동 분야 목록·추가, 수수료/정산 보류 기간·변경 이력 (약관·개인정보·운영정책 관리 제외) |

회원 정지·콘텐츠 숨김/복구·구독 강제 조작·임의 환불/직접 송금 버튼은 없습니다. 콩 출금 승인은 아래 별도 서버 검증·은행 대사 경로만 사용합니다. 초기에 안전하게 조회와 기존 관리 API를 연결한 범위이며, 운영 강제 조치는 별도 요구사항/권한·감사 설계 후 추가합니다. 문의/신고/문서 저장은 행 변경과 관리자/대상ID outbox를 같은 트랜잭션에 기록하고, 금융 정책은 기존 변경 이력/버전 충돌 방지를 사용합니다. 원문 문의/답변/문서는 운영 알림에 넣지 않습니다.

## 매출 기준

- 원(KRW), 한국 시간(Asia/Seoul), 양 끝 날짜 포함, 최대366일.
- 결제 `paid_at`과 승인 원장 `RevenueEntry`를 사용한 원결제 기간 집계. 미승인·실패·처리 중 주문은 매출에서 제외합니다. 동일 승인 건은 원장의 고유 order_id로 중복되지 않습니다.
- 이후 환불도 원결제 기간에 반영하므로 과거 집계는 달라질 수 있습니다. 환불 발생일별 현금 흐름/회계상 매출이 아닙니다. 환불 완료 시 수수료·크리에이터 귀속액 차감, 환불 확인 중에는 기존 원장 유지.
- 승인 금액, 완료 환불액, 환불 차감 금액, 플랫폼 수수료, 크리에이터 귀속액을 구분합니다. 수수료는 PG 비용·세금 차감 전이며 순이익이 아닙니다.
- 현재 원장에는 PG 테스트/운영 환경 식별 필드가 없으므로 테스트 결제가 포함될 수 있습니다. 실매출 확정/PG 대사를 대신하지 않습니다.
- 일별/합계/크리에이터별 값은 동일 RepeatableRead 트랜잭션에서 조회합니다. 크리에이터는20명씩 페이지 이동하되 전체 합계는 바뀌지 않습니다.
- 결제 내역은 주문 생성일 기준, 출금 내역은 전체 신청 기준으로 화면에서 별도 안내합니다. 승인일 집계와 기간 기준을 혼동하지 않습니다.

## 대시보드 기준

- 기준일은 한국 시간. 오늘은 어제 같은 시각까지, 과거 날짜는 전일 전체와 비교합니다. 전일 0일 때 비율을 만들지 않고 증감 건수/금액을 표시합니다.
- 신규 구독은 구독 ID별 첫 승인. 결제 건수·금액에는 갱신 및 이후 환불된 승인도 포함합니다. 환불 차감액은 원승인일의 현재 원장 기준입니다.
- 최근 7/30/90일은 선택한 기준일에 끝나며 빈 날짜는 0입니다. 구독/결제액 그래프와 펼칠 수 있는 일별 표를 제공합니다.
- 현재 기간이 남은 구독은 조회 시점의 별도 스냅샷으로, 해지 예약 후 잔여 기간도 포함합니다. 고유 인원수나 과거 시점 구독 수가 아닙니다.
- ADMIN/SUPER_ADMIN만 재무 대시보드를 사용합니다. MODERATOR는 기존 운영 현황만 확인합니다. API 실패는 오류로 표시하며 0원으로 대체하지 않습니다.

## 검증

```sh
npm run check
npm run build:verify
npm run test:e2e
```

E2E는 인접 crefans_server의 build 결과와 loopback3307 dev 설정을 사전 확인하고 전용 `crefans_platform_e2e` DB에만 migration/합성 계정을 만듭니다. CREFANS_E2E=true, 무작위 테스트 비밀번호, API3013/콘솔3003/.next-e2e를 사용합니다. 실제 main의 Origin·보안·세션·관리자 guard를 통과하며 종료 시 생성한 계정/주문/문의/신고/이벤트만 정리합니다. 운영DB·실PG·실메일·Telegram 발송은 테스트하지 않습니다. 서버 코드를 바꿨다면 먼저 서버 `npm run build`를 수행합니다. 개발3010/3002와 빌드캐시를 공유하지 않습니다. 브라우저 의존성은 `npx playwright install chromium`으로 준비합니다.

검증 기록은 [docs/verification-20261022.json](docs/verification-20261022.json), 재개 정보는 [PROGRESS.md](PROGRESS.md)를 참고하세요. 2026-10-22 운영 관리자 배포/요청 계정 지정·실로그인 완료. 실PG 대사는 미실행입니다.

## 근거와 보안 의존성 (2026-10-22 확인)

- [OWASP Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html): 서버 매 요청 권한 확인·기본 거부. 클라이언트 메뉴 숨김만을 권한 통제로 쓰지 않습니다.
- [Toss 결제와 거래](https://docs.tosspayments.com/blog/transaction-flow), [코어 API](https://docs.tosspayments.com/reference): 승인과 취소 거래를 구분. 본 콘솔은 기존 로컬 승인/환불 원장에 근거하며 실PG 대사와 구별합니다.
- [Next15.5.28 공급사 보안 릴리스](https://github.com/vercel/next.js/releases/tag/v15.5.28): 기존14.2.32 대신 수정 버전 사용. [PostCSS 보안 권고](https://github.com/postcss/postcss/security/advisories/GHSA-fxqj-rqcc-2cmp)에 따라 동일 메이저8.5.31을 Next 전이 의존성에도 override하고 빌드/E2E 재검증합니다.
- npm audit 결과는 검증 기록을 따릅니다. 개발도구의 전이 의존성 잔여 경고가 있으면 공개하며 audit 통과를 무결함 보장으로 표현하지 않습니다.

## 운영 배포 (2026-10-22)

https://admin.crefans.com/console. 별도소스/standalone이미지/비루트readonly컨테이너이며Next에DB/PG/SMTP/Telegram설정을전달하지않습니다. 관리API는Caddy→API직접전달로실제IP/Origin/세션권한을유지하고host-onlySecure쿠키를사용합니다. 배포는서버 infra/platform/compose.admin.yml을기본/beta Compose와함께사용합니다. .dockerignore로환경·로컬설정·Git·캐시제외,레거시타입검사참조lib/utils도Docker COPY필요. [실배포 검증](docs/deployment-20261022.json)을참고하세요.

## UBA Console UI (2026-10-22)

실제 UBA Console의 토큰·240px/56px 접이식 메뉴·촘촘한 표/폼·다크 모드·작은 화면 내비게이션을 적용했습니다. 크레팬스 브랜드와 인증/API는 유지합니다. IBM Plex KR은 public/fonts에 로컬 제공하며 원본 OFL.txt 라이선스를 동봉합니다. [IBM 공식 라이선스](https://github.com/IBM/plex/blob/master/LICENSE.txt)(2026-10-22 확인). 모바일 메뉴 보완 이미지까지 포함한 최신 운영 상태는 PROGRESS.md를 따릅니다. [UI·배포 검증](docs/uba-ui-deployment-20261022.json)을 참고하세요.

운영자 로고는 기존 심벌과 소문자 `console`로 표시하며 로그인·메뉴가 `Brand`를 공유합니다. 내장 이미지 생성으로 제작한 투명 PNG를 사용합니다. [생성 프롬프트](docs/console-logo-prompts-20261022.json), [표시·배포 검증](docs/console-logo-20261022.json).


## 운영 로그 (2026-10-22, 로컬 구현)

`/console/logs`에서 기간·분류·수준·IP·요청/행위자/대상/배치 ID·이벤트명을 검색하고 상세/관련 타임라인/Telegram 접수를 확인한다. 서버에서 ADMIN/SUPER_ADMIN만 허용하고 MODERATOR는 거부한다. 브라우저 오류는 민감 원문 없이 자체 API로 보고하며 페이지당5건/중복 억제한다. [구현·검증 증거](docs/logging-implementation-20261022.json), [백엔드 수집 범위](../crefans_server/docs/operational-logging.md)를 따른다. 이 기능은 아직 운영 배포하지 않았다.


## 콩 운영 (2026-10-25, 운영 테스트 배포)

서버 admin/me.beanSupport가 true일 때 `/console/beans`를 노출한다. ADMIN/SUPER_ADMIN만 재무 개요를 보며 SUPER_ADMIN만 프로모션 지급, live 원주문 실제입금 증빙 기록, 출금 승인·사유 반려 및 개인 지갑 출처 추적을 수행한다. MODERATOR/일반 회원은 서버에서 거부한다. 프로모션 지급은 동일 요청키 재시도에서 한 번만 반영한다.

회사재고, 환경별 충전/후원, 지급상태별 총액·예상 수수료·실지급액, 출금 완료 확정수수료, 지갑/출처 lot/배분을 구분한다. 대시보드의 기존 구독 지표는 그대로 멤버십 기준이고 콩 지표를 나란히 표시한다. 테스트/프로모션 금액을 실제 수수료 수익으로 합산하지 않는다.

승인 클릭 자체는 지급 성공이 아니다. 서버 beta/은행 gate, 수요일, 실제 입금·후원 후 7일 보류·출처 결제 재조회·동결·계좌 버전·은행 멱등ID 검사를 통과해야 한다. 결과 미확정 processing은 임의 반려하지 않는다. 잔액은 수정 폼으로 고치지 않으며 지급/반려 사유와 감사 이력을 남긴다. 실제 PG/은행 계약 및 운영 스모크는 미실행이다.

로컬 검사: npm run check, npm run build:verify, npm run test:e2e -- e2e/beans.spec.ts. 합성회원·실제 격리 MySQL/HTTP/브라우저와 공급사 대역이며 실제 지급/운영 검증과 구분한다. 원본 증거는 형제 프론트 docs/audit/bean-product-20261025.json과 각 리포 .local/bean-product-20261025/이다.

beans-20261025 운영 적용. 서버 beanSupport=true, 실제 판매·출금 gate off. 운영 콘솔 로그인 보호/401과 이미지 RootFS를 확인했으며 금융 역할별 기능은 격리 DB의11브라우저검사에 근거한다. 이번 운영검사에서 사용자 지갑/실입금/출금 승인을 실행하지 않았다. 프론트 docs/audit/bean-deployment-20261025.json에 백업·이미지/DB 적용·정상배치·기존설정 보존을 기록했다.


## 예약 핸들 관리 (2026-11-03)

`/console/reserved-handles` → 상태/핸들·사유 검색 → 추가 또는 수정. **후보**는 사용 차단 없음, **예약 중**은 신규 취득 차단, 삭제는 예약 해제 후 이력을 보존한다. 기존 사용자는 핸들을 유지하며 이전 핸들 보호도 별도로 유지한다. 예약할 이름의 소문자 변환은 저장 시 서버가 수행하며 정확 일치만 적용한다.

최고관리자는 전체 기능을 사용한다. 부운영자는 운영자·권한의 **예약 핸들 관리**에 입장/생성/수정/삭제 권한을 각각 부여해야 한다. 기존 다른 메뉴 권한으로 자동 접근하지 않는다. 삭제는 사유와 해당 핸들 직접 입력, 수정은 조회 당시 버전을 서버에 전달한다. 충돌 메시지가 나오면 모달을 닫고 새로고침 후 최신 값을 확인한다. 성공은 기존 하단 스낵바, 빈 목록·조회 실패·지연 로딩은 공용 콘솔 형태로 표시한다.

백엔드 짝은 `src/platform/reserved-handles.ts`, 마이그레이션 `20261103010000_reserved_handles`. 사용자 승인 초기 예약 목록은103개(기본62개+유효 밑줄 제거 변형)이며 실제 적용 여부는 PROGRESS.md에 기록한다. 서버 마이그레이션/API와 콘솔을 함께 배포해야 한다.

검증: `CREFANS_SERVER_DIR=/절대/서버작업트리 npx playwright test --config=playwright.reserved-handles.config.ts`. PC Chromium·모바일 WebKit, 실제 격리 API·DB 및 권한 UI 대역을 구분한다. 테스트 런타임은 로컬3307 전용 DB만 사용하며 실제 계정/운영 DB/SMTP를 사용하지 않는다.
