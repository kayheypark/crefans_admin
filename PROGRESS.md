## 2026-11-14 횟수권 상점 운영 배포 완료
- 기능 소스 front 26b7aa6, server db9f91e, admin 4618585를 dev→prod 통합. 운영 API/worker/admin ai-shop-20261114, frontend front-ai-shop-routes-20261114. 새 테이블3개 적용, 기존 DB/proxy·결제 설정 보존.
- 운영 health/feed/admin/login/console/shop 정상, 새 API 비로그인401, 4컨테이너 실행·재시작0·OOM없음. 운영 상품/주문/사용0건. 판매가·횟수·유효기간 미정으로 상품을 임의 등록하지 않음.
- 첫 운영 점검에서 shop/pay·preview/shop 허용 경로 누락 발견→회귀 검사(정상3·거절3) 추가 후 재배포. 최종 WebKit390px 프리뷰 상점 표시·넘침/JS오류없음, 실제 상점/결제 경로 로그인 안내 확인. 실제 인증 구매/PG승인/환불은 실행하지 않음.
- 서버53·프론트58+경로1·콘솔18 및 브라우저2, 타입/계층·문서 계약 통과. 문서 snapshot은 제품 전체 테스트 증거가 아님. PG웹훅 콘솔 등록 미실행, 기존 실결제/베타 제한 유지.
- 복구 /Users/ethan/crefans-recovery/20261114/ai-shop: 이전API/콘솔 이미지94blob·태그/ID·SHA256, DBgzip완료·서버해시 일치, 설정tar검증 후 서버 이전이미지·덤프·설정·업로드tmp만 정리. 프론트는 ship-helper 별도복구검증. 외부보관본은 삭제하지 않음. 상세 front docs/audit/ai-ticket-shop-20261114.json.

## 2026-11-14 횟수권 상점 최종 로컬 검증
- 서버53/53, 프론트58/58 및 계층462파일·타입, 운영콘솔18/18 및 브라우저2/2 통과. 모바일 WebKit 390px 0회 구매 진입·구매동의·실패 안내·편집 초안 유지 확인. 운영 결제는 실행하지 않음.
- 서버 공식 Toss/OWASP 근거와 사용자 잔여 비례 환불 결정을 구현에 대조. 계약 생성/누락 문서 보완 완료. 문서 evidence 갱신은 snapshot-only-not-test-proof로 기록하며 제품 테스트 증거와 구분.
- 검증 상세: 프론트 docs/audit/ai-ticket-shop-20261114.json. 가격·수량·유효기간 미결정으로 초기 상품 없음. 운영 기존 결제 제한 보존.

## 2026-11-14 횟수권 상점 구현·검증 (배포 준비)
- 사용자 결정: 리셋권이 아닌 1회 생성권, 미사용 잔여 횟수 비례 환불. 가격·묶음·유효기간은 아직 미지정: 운영콘솔에서 설정, 운영 상품 임의 등록/판매 개시 안 함. 1회 단가 정수 원(총액÷횟수)으로 환불 반올림 모호성 방지.
- 0회 만들기→상점 모달, 새 결제 탭으로 편집 상태 유지, 복귀 focus 시 quota 재조회. 상점/구매내역·결제확인·동의·잔여환불. 무료 우선, 유료 1회 예약→성공차감/실패복구, 예약 ID=AI 요청ID. 기존 무료 안전검사·총비용한도·리셋권 유지.
- 서버 주문별 스냅샷·클라이언트금액 무시·버전/소유권·동일 요청/PG 멱등·조회복구·동시사용/환불 잠금·감사. 새 테이블 ai_shop_products/orders/uses(20261114140000). worker 불명결제/환불 대사, 외부취소는 review로 차단, 1시간지난 생성예약 복구. 상품 아카이브·shop 독립권한. 운영콘솔 상품/주문/사용이력.
- 검증: 서버 53/53(격리 MySQL+PG/AI 대역), 프론트58/58·타입, WebKit390px 구매동의/대역실패/0회진입·초안유지, 콘솔 타입18/18·PC/모바일2/2. 실제 PG 승인/실AI/운영자 로그인 조작 미실행. 문서 검사는 별도 결과 확인. 서버 .local/ai-shop, 프론트 .local/ai-shop*, 콘솔 .local/ai-shop 및 /tmp/crefans-shop-admin-*.
- 배포 계획: 현재API optional-region-20261114와 콘솔 admin-ai-attempt-tracing-20261114를 외부 /Users/ethan/crefans-recovery/20261114/ai-shop 에 백업(이미지545MB), 같은 API 위 변경 파일만 오버레이. DB덤프→추가마이그레이션→API/worker/admin→프론트. 기능 플래그·실결제/베타 설정 변경 안 함. 가격 미정이라 판매 상품 없음.

## 2026-11-14 AI 이용권 상점 진행 (미배포)
- 요청: AI 잔여0에서 만들기→이용권 구매, 상점·운영콘솔 구현 및 운영 배포. 기존 광고상품은 카탈로그/사용만 존재하고 신규 결제 미구현. 기존 토스 PaymentProvider 및 카드 전용·베타 제한·Origin/권한·감사를 재사용할 계획.
- 사용자 결정 대기: 유료 이용권이 리셋권(10회 초기화)인지 1회 생성권인지, VAT 포함 가격·수량·유효기간. 무료 관리자 지급 리셋권의 30일 정책을 유료 판매에 임의 적용하지 않는다. 환불 조건·PG 판매 범위도 확인 후 확정. 질문 발송 완료, 답변 전 의존하는 판매/지급 로직은 확정하지 않음.
- 합격 조건: 잔여0 구매 진입/편집 초안 보존, 서버 가격·소유권 검증, 승인 후 단1회 지급, 불명 승인 재청구 금지, 환불-사용 경합 및 재시도, 콘솔 권한/동시편집/감사, 모바일·오류·빈 상태, 대역 결제 검증과 실제 PG 검증 구분.
- 작업 공간: crefans_front-preset-expansion, crefans_server-ai-shop, crefans_admin-ai-shop, 모두 feat/ai-ticket-shop. 서버base be4af6a, 관리자20702fa, 프론트77af869. 기존 작업 공간/미커밋 변경 보존. 다음: 독립 상품관리·UI부터 준비, 결정 후 결제/지급/사용과 검증·배포.

## 2026-11-14 AI 모델 시도 추적 운영 완료
- 소스89961e8 dev/prod, 운영 crefans-admin:admin-ai-attempt-tracing-20261114. AI생성이력목록·선택/요청/응답모델·단계별호출/시간/오류·미완료unknown표시. 기존실패질문30일조회유지.
- 타입18단위·브라우저2통과, 운영로그인/로그화면200·비로그인AI목록401·실배포번들확인. .local/attempt-{check,e2e,build,deploy}.log 및 test-results/ai-attempt-mobile.png. 실회원데이터조회없음,브라우저데이터는대역.
- 이전이미지·설정 외부 /Users/ethan/crefans-recovery/20261114/admin-ai-attempt-tracing-20261114 SHA/OCI15blobs/태그검증후서버사본정리. 서버76c1921 API/worker동시반영. 추가요구대기.

## 2026-11-14 AI 시도 추적 화면 검증 완료
- npm run check 종료0(타입18단위), CREFANS_SERVER_DIR=../crefans_server-ai-failure npx playwright test e2e/ai-failure.spec.ts 종료0(기존실패/신규추적2/2). 실제Next·Chromium390px,로그응답대역. 선택/요청/응답모델분리·미제공·unknown·기존질문만료확인. test-results/ai-attempt-mobile.png 열람완료.
- 증거 .local/attempt-check.log,attempt-e2e.log. src/app/globals.css는추적타임라인줄바꿈만추가. base87dc13a,2026-11-14,운영반영전.

## 2026-11-14 AI 생성 시도 추적 진행
- origin/prod87dc13a 기준 feat/ai-attempt-tracing. 운영로그 AI생성이력 빠른필터,요청당상태·선택모델,상세모든검사/생성/저장의호출ID·모델·공급사ID·소요·오류·결과사진ID. 선택모델과실제호출모델분리,응답모델없으면미제공,10분미완료는확정실패아닌완료기록없음.
- 성공질문을추가수집하지않고기존실패질문30일권한/암호화유지. 합격:타입18기존테스트·모바일상세·기존실패조회회귀.현재타입18통과,브라우저예정.

## 2026-11-14 AI 실패 질문 조회 운영 완료
- 소스89bb2cb dev/prod, 운영 crefans-admin:ai-failure-details-20261114. 운영로그 AI 생성 실패 필터/상세상단 원인·질문·옵션·공급사ID/30일만료 안내. 타입18단위·브라우저1통과, 운영login/console/logs200·비로그인상세401·번들반영 확인. 실제회원실패데이터 열람은 미실행.
- 증거 .local/{admin-build.log,admin-deploy-retry.log,ship-ai-failure-details-20261114/deploy.log}, test-results/ai-failure-mobile.png. 첫교체시API복구경로중복으로변경전중단, admin별도경로재실행성공. 이전이미지·설정 외부 /Users/ethan/crefans-recovery/20261114/admin-ai-failure-details-20261114 SHA/OCI15blobs/태그검증후서버사본정리.
- 서버9590338 API/worker와신규진단테이블동시반영. 질문조회권한은logs.view+members.view,암호화/만료/조회감사는서버담당. 추가요구대기.

## 2026-11-14 AI 실패 질문 조회 검증
- npm run check 종료0(타입+18단위), CREFANS_SERVER_DIR=../crefans_server-ai-failure npx playwright test e2e/ai-failure.spec.ts 종료0(1/1). 실제Next/브라우저+로그API대역, 모바일390px·스크립트문자 안전표시·만료 비노출 확인. 증거 /tmp/crefans-admin-ai-failure-{check,e2e}.log, test-results/ai-failure-mobile.png. 실운영 조회 미검증.
- 실패원인/질문 상세를 모달상단에 배치. 요청ID는 기존속성, 제공사ID와구분. 일반목록 질문미포함. base9d00610, feat/ai-failure-details. 운영 미반영.

## 2026-11-14 AI 실패 질문 조회 진행
- 최신 origin/prod 9d00610에서 feat/ai-failure-details 분기. 운영 로그에 AI 생성 실패 빠른 필터, 상세에 질문/옵션/실패단계/공급사 코드·ID·만료일 추가. 사용자 30일 보관 결정, 서버 권한·암호화·조회감사에 맞춤.
- 합격조건: 타입검사/기존18검사, 실제 화면에서 실패 상세와 만료/권한제한 표시. 서버도착 전 실패 질문은 수신불가, 기존로그 소급없음.
- npm run check 종료0(타입/18개 통과). 서버 연계·화면 확인 및 운영 배포 미실행.

## 2026-11-13 AI 사진 보관형 리셋권 콘솔 — 운영 배포 완료(2026-11-13 16:4x KST)
- `/console/ai-photo` 표에 '리셋권 n장' 칸, 행별 '리셋권' 창(사용 가능 합계·가장 빠른 만료, 지급분 목록 남음/지급·상태·만료·사유, 지급 수량 1~100+사유, 사용 가능 지급분 회수+사유). 이력 라벨 리셋권 지급·회수·사용(사용은 처리자 '크리에이터').
- 검증: typecheck 0, npm test 18/18, e2e/ai-photo.spec.ts 3/3(실서버, 지급→3/3장→회수→0장→이력, 모바일 390 가로 넘침 없음).
- 배포: crefans_server PROGRESS 2026-11-13 리셋권 항목 참조(맥북 빌드 이미지, 운영 반영 확인). 미확인: 운영 로그인 후 실제 조작.

## 2026-11-13 AI 사진 오늘 사용 횟수 초기화(인원별·전체) — 운영 배포 완료(2026-11-13 16:3x KST)
- `/console/ai-photo` 표에 '오늘 사용 n/한도회 · 남음', 행별 '횟수 초기화'(사유 필수, 미사용이면 비활성), 상단 '오늘 횟수 전체 초기화'(사유 + `TypedConfirmDialog` 문구 '전체 초기화'). 이력 라벨에 횟수 초기화·전체 횟수 초기화 추가. 서버는 crefans_server feat/ai-photo-quota-reset.
- 검증: typecheck 0, npm test 18/18, `e2e/ai-photo.spec.ts` 2/2(실서버 e2e, 데스크톱·모바일 390 스크린샷). 사용량이 있는 상태의 실제 초기화는 서버 e2e 테스트로 확인.
- 배포: 맥북에서 linux/amd64로 빌드해 이미지 전송(운영 서버 빌드 없음) → crefans-admin:ai-photo-quota-reset-20261113, 산출물에 '오늘 횟수 전체 초기화' 포함·login/revenue 200 확인. 이전 이미지 partner-20261113은 복구 저장소로 이동.
- 미확인: 운영 콘솔 로그인 후 실제 화면 조작.

## 2026-11-13 00:1x~00:35 KST 인증 배지=파트너 계약, 배지 있어야 출금 + 사진 업로드 50MB 운영 배포 완료
- 사용자 결정(/ask-me 2026-11-12): 배지(creators.is_verified)=크레팬스 파트너 계약. 출금 신청·이체 기록 모두 서버에서 차단(403 PARTNER_CONTRACT_REQUIRED), 계좌·PIN은 계약 전 허용, 배지 해제 시 미지급 신청은 보류(자동 반려 아님, 잔액 유지), 약관 6조 배포일 시행(2026-11-13.partner.1), 배지 문구 "크레팬스와 파트너 계약을 맺은 크리에이터예요", 출금 화면 안내+계약 문의 버튼, 계약 없는 기존 배지 보유자는 사용자가 콘솔에서 직접 해제.
- 서버 prod 4929ca4: partner-policy.ts, finance/beans verifyPin·requestWithdrawal·authorize·requestPayout 게이트, payout() quiet/strict/off(worker는 보류, 수동 paid·콘솔 approve 거부, rejected 허용), 지급 목록 holdReason partner-unverified, studio 응답 payoutPartner, 회원가입 게이트 시행일 비교 UTC→KST 버그 수정(KST 자정 시행 약관이 09시까지 가입을 막던 문제), 사진 상한 5MB→50MB(IMAGE_UPLOAD_MAX_BYTES).
- 프론트 prod ff8446d: PartnerPayoutNotice(멤버십·콩 출금 화면), 배지 설명, 정산 기준·FAQ 문구, 사진 브라우저 최적화(lib/design/image-optimize.ts 긴 변 4096px·WebP 0.9, 실패 시 원본) + 한 장 50MB. 관리자 prod fa937a6: 보류 사유 "계약 미확인 (인증 배지 없음)", 배지 부여·해제 확인창 출금 영향 안내. 가이드 feat/partner-payout-gate 766d88d(운영 릴리스 117ec9c 위 문서 커밋 1개): 출금 자격 절, 배지 의미, 50MB.
- 검증: 서버 테스트 직렬 실행 기준선(prod 9fd2de9) 대비 새 실패 0(기준선 실패 34건은 환경 의존 동일 목록), 새 테스트(멤버십·콩 배지 없음, KST 가입 게이트, 50MB HTTP 업로드) 및 대조 검사(게이트·보류 사유·KST·상한 되돌리면 실패) 확인. 프론트 기준선 대비 새 실패 0(16건 동일), 관리자 18/18(타입 오류 14건은 공유 node_modules의 @dnd-kit 부재, 기존).
- 배포: API 오버레이 privacy-rrn→partner-payout-20261113→photo-limit-20261113(겹친 파일이 prod 빌드와 SHA 일치 확인), 프론트 front-partner-photo-20261113(ship-image.sh), 관리자 partner-20261113, 가이드 정적 107파일. 운영 확인: 약관 페이지 2026.11.13 시행·6조 문구, 가이드 2쪽, 프론트·관리자 산출물 문구, 미인증 요청 401. 실제 배지 없는 계정으로 운영 출금 시도는 하지 않음(테스트로 대체).
- 복구본 /Users/ethan/crefans-recovery/20261113/: partner-payout-api(privacy-rrn 이미지), photo-limit-api(partner-payout 이미지), front-partner-photo, partner-admin(payout-scope), guide-partner-photo(previous.tgz) — 모두 blob/인덱스 또는 파일 해시 검증 후 서버 사본 정리. 서버 docker 빌드 캐시 19.5GB도 정리함(요청 외, 재생성 가능).
- 남은 일: 복구 저장소 API·프론트·관리자 묶음이 구성요소별 3개를 넘음 → 삭제 후보 승인 필요. 배지 없는 기존 크리에이터 배지 해제(사용자). 실물 휴대폰에서 큰 사진 업로드 확인(첫 크리에이터에게 재시도 요청). 맥 디스크 95%.

## 2026-11-11 이번 주 지급 목록 범위 (feat/payout-list-scope, 커밋·미배포)
- 사용자 결정(11-11): 수동 지급 켜기 전 지급 목록 범위 수정. 서버 feat/payout-hardening(c57fbb1)의 `due`·`holdReason`·`batchCutoff`·`heldCount/heldAmount`를 사용.
- 화면: 총액·크리에이터별 합계·출금별 상세는 이번 수요일 묶음의 확인된 계좌 건만. 나머지(다음 주 지급·예금주 확인 전·계좌 변경·계좌 없음·테스트)는 '이번 주 이체 대상이 아닌 건' 표에 사유와 함께, 계좌번호·복사 버튼 없이 표시. 서버가 due를 주지 않으면 이전처럼 테스트 아닌 건을 대상으로 본다.
- 검증: check(typecheck+단위 18/18), e2e payout-list 2·withdrawal 관련 4 통과(API 대역). 서버 배포 전에는 화면 변화 없음(due 미제공).
## 2026-11-11 모달 하단 버튼 공통 컴포넌트 DialogActions (feat/dialog-actions, 미커밋·미배포)
- 계기: 사용자 운영 캡처 — AI 사진 편집 허용 모달의 취소·허용 버튼이 왼쪽에 붙어 있음(`dialog-actions`만 쓰고 `actions` 누락 → flex·간격 없음). 지시: 디자인 일관성을 위해 컴포넌트 사용.
- 변경: `TypedConfirm.tsx`에 `DialogActions` 추가, 다이얼로그 버튼 줄 26곳을 교체(AiPhotoGrants 3·Advertising 2·Beans 1·Categories 1·Console 2·Invites 3·Memberships 1·Moderation 6·Referrals 2·ReservedHandles 2·Totp 1·TypedConfirm 2). Categories 편집·Referrals 2개 모달도 왼쪽 정렬이던 것이 함께 정리됨. AGENTS.md 규칙 추가.
- 검증: typecheck 0, 단위 18/18(신규 tests/dialog-actions 2건 — 옛 AiPhotoGrants/Referrals로 되돌리면 각각 FAIL), e2e ai-photo(모바일 버튼 간격·정렬 측정 추가, 옛 코드면 간격 0으로 FAIL), withdrawal-reject 10/10, payout-list 4/4, referrals·reserved-handles·modal-layer·invites 통과. moderation 2건 실패는 변경 전 기준(46a2299)에서도 동일하게 실패(기존 문제).
- 함께 고침: 어제 지급 목록 추가 후 withdrawal-reject e2e 대역이 /admin/payouts/due에 응답하지 않아 수동 지급 테스트 1건이 깨졌던 것(대역에 빈 목록 추가).

## 2026-11-10 이번 주 지급 목록 (feat/payout-list, 미커밋·미배포)
- 요청: 수동 이체용으로 '크리에이터에게 얼마를 이체해야 하는지' 계산된 목록. 기존 수동 지급 패널은 크리에이터 ID·끝 4자리만 보여 실제 이체 불가였음.
- 구현: `src/components/console/PayoutList.tsx`(매출·정산, 수동 지급 모드에서 기존 패널 위). 총액·크리에이터 수·건수, 크리에이터별 합계, 출금별 상세(멤버십/콩, 이체 금액, 은행·예금주·끝 4자리, 미확인·계좌 변경 경고). '계좌번호 보기'는 revenue.create만, 테스트 콩 출금 제외, 누를 때만 서버 조회(감사 기록), 2분 뒤 자동 숨김, 번호·금액 복사(스낵바). 이체 완료 기록은 기존 패널/콩 화면 그대로.
- 서버: crefans_server feat/payout-list의 GET /admin/payouts/due, POST /admin/settlement-accounts/:id/reveal.
- 검증: typecheck 0, 단위 16/16, e2e `playwright.payout-list.config.ts` PC·모바일 4/4(API 대역, 실서버·실이체 아님). 캡처 test-results/payout-list/.
- 남은 것: 커밋·dev/prod 통합·운영 배포(사용자 승인 필요), MANUAL_PAYOUTS_ENABLED는 운영에서 꺼져 있어 켜기 전엔 화면이 보이지 않음.

## 2026-11-10 목록 화면 상단(안내·검색·등록) 디자인 통일 (배포 진행 중)
- 사용자 지적: 안내 텍스트, 검색만 있을 때, 검색+등록 버튼일 때 화면마다 디자인이 다름. 작업트리 `/Users/ethan/repository/crefans_admin-toolbar`, 브랜치 feat/console-toolbar-consistency (origin/prod 7c41f55 기준).
- 규칙: ① 목록은 흰 카드(section) 안 ② 화면 안내는 카드 맨 위 `.notice` 박스, 카드 제목(h2) 아래 설명은 `.muted.section-desc` ③ 툴바는 필터·검색(보조 버튼) 왼쪽, 등록 계열 주 버튼은 `.toolbar-end`로 오른쪽 끝(카드 제목이 있으면 `section-head` 오른쪽) ④ 페이지 표기 '현재 / 전체'.
- 적용: 초대 회원·광고상품(안내 회색 글 → 박스, 등록 오른쪽), 예약 핸들(목록 아래 보충 설명을 상단 안내에 합침, 추가 오른쪽), AI 사진 허용(허용 오른쪽), 회원·운영 로그(카드 밖 → 카드 안, 로그 안내를 필터 위로, 조회 버튼을 다른 화면 검색 버튼과 같은 보조 버튼), 게시물 검수(툴바 옆 설명 → 제목 아래), 공지·FAQ(목록 아래 '새 문서' → 제목 오른쪽 주 버튼), 멤버십 상품(설명을 툴바 위로), 초대·광고 페이지 '1페이지' → '1 / N'.
- 제외: 콩 후원·출금(여러 집계·폼이 한 화면, h2가 카드 없이 배경 위) — 구조 개편 규모라 별도 결정 필요. 대시보드·매출·레퍼럴은 대역 데이터로 화면이 안 떠서 미확인.
- 검증: tsc 0, npm test 16/16, next build 0(.next-build). API 대역 Playwright 캡처 15메뉴×(1280·390) 전후 비교 `.local/toolbar-20261110/before|after/`(스크립트 survey.spec.ts·pw.config.ts). 실서버 E2E·운영 화면 미실행.
- 후속(사용자 '크리에이터 허용 같은 액션버튼은 PC에서 오른쪽 끝'): PC 1080·1280·1920에서 초대 등록·광고상품 등록·예약 핸들 추가·크리에이터 허용 버튼과 툴바 오른쪽 끝 간격 0px, 검색과 같은 줄 확인(`.local/toolbar-20261110/measure.log`). 입력값을 바로 제출하는 '분야 추가'·'프로모션콩 지급'은 입력칸 옆 유지. 운영에는 아직 미배포라 운영 화면은 그대로.

## 2026-11-08 AI 사진 편집 허용 크리에이터 관리 (feat/ai-photo-grants, 미병합·미배포)
- 사용자 요청: 스튜디오 AI 사진 편집을 쓸 수 있는 크리에이터 테이블과 콘솔 관리. 서버 crefans_server feat/ai-photo-grants(ai_photo_grants·ai_photo_grant_changes, /admin/ai-photo-grants)와 짝.
- 화면: `/console/ai-photo`(운영 관리 > AI 사진 편집 허용). 목록(핸들·활동명·허용 사유·허용 운영자·허용일, 검색), 크리에이터 허용(핸들+사유), 이력, 해제(사유). 권한은 members.view/update(새 권한 메뉴 없음), 운영자 권한표 설명에 반영.
- 검증: typecheck 0, npm test 16/16, e2e/ai-photo.spec.ts 1/1(격리 서버·e2e DB: 사유 1자 비활성, 허용→목록, 중복 409 안내, 해제 사유 필수→해제, 재허용 후 이력 3건, 390px 가로 넘침 없음, pageerror 0). 캡처 test-results/ai-photo-*.png.
- 다음: 서버 마이그레이션 포함 운영 배포(승인 필요), 스튜디오 서버 연결 시 aiPhotoAllowed 검사.

## 2026-11-07 11:10 KST 배포 묶음 통합 release/bundle-20261107 (로컬 커밋만, push·배포 없음)
- origin/prod 69efec7 에서 fix/withdrawal-reject 70d1a9a → feat/post-unpublish b658cc7 --no-ff merge. 충돌은 PROGRESS.md 뿐(양쪽 유지). Console.tsx 는 자동 병합(출금 반려 Revenue 와 게시물 '공개 상태' 열이 다른 줄), 결과에 PostVisibility·WithdrawalReject 모두 존재.
- 검증(10:58~11:02 KST, node_modules=crefans_admin-refund 링크): typecheck 0, lint 오류 0(경고 3, 기존 img), unit 16/16. e2e withdrawal-reject 설정(PC·iPhone13 WebKit, CREFANS_SERVER_DIR=통합 서버 작업트리) 10/10. post-visibility 설정(moderation.spec, API 대역) 8/12 — 실패 4건(회원 이용 제한·미검수 필터 × PC/모바일)은 브랜치 보고의 origin/prod 기준선 실패와 같은 이름.
- 남은 일: dev/prod 통합·push, 운영 배포(서버 계획 `crefans_server/.local/bundle-deploy-20261107/plan.md`).

## 2026-11-07 10:00 KST 차지백 경고가 뜬 처리 중 콩 출금 '반려 기록' 버튼 (fix/withdrawal-reject, 배포 보류)
- 사용자 결정(2026-11-07). 콩 후원·출금 › 콩 출금 신청에서 SUPER_ADMIN·수동 지급 모드·processing·`chargebackHold`인 행에만 '반려 기록'. 공통 usePrompt(사유 489자 = 서버 note 500자−접두어, 빈 값 비활성, 취소 시 미전송, 네이티브 창 없음) → 기존 POST /admin/beans/withdrawals/:id/manual-result {result:'rejected',reason}. 실제로 이체하지 않은 경우에만 기록하라는 안내 포함. '이체 완료 기록'은 이미 이체한 경우를 위해 그대로 둠. 서버 짝 crefans_server fix/payout-refund-gaps 4322ffd(사유 489자).
- 검증(09:54 KST, API 대역): typecheck 0, lint 오류 0, unit 16/16, e2e withdrawal-reject 설정 10/10(pc·mobile), bean-payout-prompts 1/1. 대조: 경고 조건을 빼고 처리 중 전체에 노출 → 1 실패. 화면 `.local/withdrawal-reject-20261107/*-bean-reject-dialog.png`.

## 2026-11-07 09:40 KST 멤버십 출금 반려 버튼·콩 출금 차지백 경고 — 브랜치 fix/withdrawal-reject (커밋만, push·배포 없음)
- 사용자 결정(2026-11-07): 서버 배포 보류, 콘솔 반려 버튼 지금 추가, 콩 출금 차지백 경고 표시. 서버 짝 브랜치 crefans_server fix/payout-refund-gaps(011efbd rejectable, cf097d6 chargebackHold).
- 매출·정산 › 출금 내역: 서버 `rejectable`(requested+출금 가능액 음수)인 행에만, 매출·정산 생성 권한일 때 '반려' 표시 → 공통 usePrompt 다이얼로그(사유 150자, 빈 값 비활성, 네이티브 confirm 없음) → POST /admin/withdrawals/:id/reject. 실패는 그 행에 오류(role=alert), 성공은 상태 문구+목록 재조회. 수동 지급 패널: rejectable 행은 '환불로 잔액 부족'+새 반려만(이체 완료 기록·manual-result 반려 숨김), 수동 반려 사유 입력 500→180자(서버 note 191자).
- 콩 후원·출금 › 콩 출금 신청: 서버 `chargebackHold`가 true인 행 상태 칸에 '차지백 발생 · 이체 전 확인'(role=note, 빨간 글씨).
- 검증(로컬, API 대역 — 실제 서버 동작은 서버 테스트로 별도 확인): node_modules는 같은 lockfile의 crefans_admin-refund 것을 심볼릭 링크(메인 체크아웃 node_modules에 @dnd-kit 없음). typecheck 0(origin/prod 기준선도 0), lint 오류 0·경고 3(기존 Brand/Categories img), unit 16/16, e2e `playwright.withdrawal-reject.config.ts` 10/10(pc·mobile), 기존 bean-payout-prompts 1/1.
- 대조: 버튼을 requested 전체로 넓히면 1 실패, 오류 표시 제거하면 1 실패, 경고를 paid 외 전체로 넓히면 1 실패. 화면 PNG `.local/withdrawal-reject-20261107/`(12장).
- 미결: 콩 처리 중 출금을 수동 지급에서 '반려'로 기록하는 콘솔 버튼은 없음(API manual-result rejected는 있음).

## 2026-11-07 게시물 공개 상태 전환·처리 이력 — feat/post-unpublish (미배포)
- 콘텐츠·신고 > 게시물 표에 '공개 상태' 열(PostVisibility): content.update면 미공개/공개 전환(공통 ConfirmDialog, 사유 필수, 크리에이터 알림 없음 안내), 조회 권한이면 '공개 이력'. 처리 이력 표에 크리에이터 처리(`크리에이터 · 활동명`, 사유 '—')와 운영자 처리를 함께, 조치에 '미공개 전환 (공개→미공개)'/'다시 공개 (미공개→공개)'. 콘솔에 별도 게시물 상세 화면은 없어서 이력은 이 대화상자에서 본다. 운영 숨김(PostModeration)은 그대로.
- 검증(2026-11-07, node_modules=crefans_admin-refund 링크): typecheck 0, lint 오류 0(기존 img 경고만), unit 16/16. e2e `playwright.post-visibility.config.ts`(moderation.spec, API 대역, 3046) 8/12 — 실패 4건(회원 이용 제한·미검수 필터 × PC/모바일)은 origin/prod(69efec7) 기준선에서도 같은 4건 실패. 신규 2건×2 통과. 화면 .local/post-unpublish-20261107/*.png.

## 2026-11-06 23:27 KST 구독 현황 '환불 후 종료' 운영 배포 (refund-notices-20261106)
- 사용자 결정(/pilot-work): 콘솔 운영자 환불 도구, 전액 환불만+구독 즉시 종료, 검사 통과 시 배포.
- prod 69c4711(feat/console-subscription-refund a7233ce): 최근 paid 결제가 있는 구독에 SUPER_ADMIN 전용 '환불 후 종료' 버튼. TypedConfirmDialog 로 금액(예 12,000원)·사유 입력 → POST /admin/subscriptions/:id/refund {reason,confirmation}, 서버도 같은 금액 표기 검사. AGENTS.md '조회만' 규칙에 이 예외 명시.
- 검증: tsc·lint 0, unit 16/16, e2e memberships+support-modals 8/8(API 대역, 서버 CREFANS_SERVER_DIR=refund 워크트리), build. 운영 이미지 crefans-admin:refund-notices-20261106 에 '환불 후 종료' 포함, admin 로그인 200. 로그인한 운영 콘솔에서 버튼 동작은 미확인(운영 실환불 미실행).
- 기록: server .local/refund-notices-deploy-20261106/deployment.md, 복구본 /Users/ethan/crefans-recovery/20261106/refund-notices.

## 2026-11-06 콘솔 구독 즉시 해지 UI — 운영 배포 완료 (cancel-now-20261106)
- 사용자 결정(/ask-me): 즉시 종료·환불 없음·전체 구독 상시 기능·SUPER_ADMIN 전용, 사유 필수.
- 브랜치 feat/admin-cancel-now(origin/prod 0b2a648 기준). Memberships.tsx 구독 현황 표에 '해지 사유' 열과 최고관리자 전용 '관리' 열 추가. 이용 기간이 남은 구독에만 '즉시 해지' 버튼(live(): status!=='EXPIRED' && endedAt>now), 서버와 같은 조건.
- 확인 모달은 기존 ConfirmDialog 재사용: 남은 기간 소멸·접근 즉시 차단, 환불 없음, 되돌릴 수 없음을 적고 사유(필수, 500자)를 받는다. 공백만 입력하면 버튼이 꺼진 상태 유지. 성공은 기존 Snackbar, 실패는 모달 안 오류로 남기고 목록을 건드리지 않는다. Console.tsx가 superAdmin 여부를 Beans와 같은 방식으로 전달.
- 검증: npm run check(typecheck 0, 16/16), playwright memberships PC Chromium·iPhone13 WebKit 10/10. 대조: superAdmin 게이트를 제거하면 '부운영자 비노출' 테스트가 실패하고 원복 후 재통과. 증거는 서버 작업트리 .local/cancel-now-20261106/verification.json.
- 승격·배포: feat e70652d → dev 0b2f6b7 → prod 458197b(tree 동일). 이미지 `crefans-admin:cancel-now-20261106`을 운영 서버에서 네이티브 amd64로 전체 빌드. 새 문구("구독 즉시 해지", "되돌릴 수 없습니다", "cancel-now")가 빌드 청크 2개에서 검출되고 이전 이미지에서는 0건임을 대조 확인.
- 운영 확인: admin 컨테이너 restart 0·OOM false, https://admin.crefans.com/login 200. 서버 측 세부는 crefans_server PROGRESS.md 같은 날짜 항목.
- 미수행: 운영 콘솔에서 실제 즉시 해지 실행은 하지 않음(운영 구독 1건 그대로). 화면 검증은 API 대역 기준이며 운영 계정 육안 확인은 아직.

## 2026-11-06 멤버십·구독 조회 화면 (운영 배포 완료)
- 사용자 "다되면 배포" 지시로 배포. feat fa2826d → dev 646b5b6 → prod 3c35a70(tree 동일). 운영 crefans-admin:admin-memberships-20261106(서버 빌드, 라벨 commit 3c35a70), 콘솔만 교체, 다른 컨테이너 불변, login 200·restart0. 이미지 번들에 '구독자 보기' 포함 확인.
- 운영 URL https://admin.crefans.com 에서 memberships.spec PC Chromium·iPhone WebKit 4/4(API 대역, 실제 계정 미접속). 실제 운영자 로그인 화면 확인은 사용자 몫(미검증).
- 직전 콘솔 이미지·설정은 /Users/ethan/crefans-recovery/20261106/admin-memberships(blob SHA·설정 해시 검증). 서버의 직전 이미지·임시 소스 정리. 스크립트·로그 .local/admin-memberships-release/.
- 사용자 요청("추가진행"). 브랜치 feat/admin-memberships(origin/prod c714b5f 기준, 작업트리 crefans_admin-memberships). 서버 짝: crefans_server feat/admin-memberships의 GET /admin/memberships·/admin/subscriptions.
- /console/memberships 새 메뉴 "멤버십·구독"(현황 그룹, 매출·정산 다음). 별도 권한 없이 매출 조회(revenue.view)가 있으면 보임(canViewSection 매핑). 탭 2개: 멤버십 상품(상태·검색, 가격·주기·체험·상태·이용 중/자동 갱신/해지 예약/만료 수, 구독자 보기) / 구독 현황(상태·검색·상품 조건, 집계 카드, 구독자·상품·크리에이터·상태·금액·시작일·이용 종료일·다음 결제일·결제 실패). 조회 전용, 수정·해지·환불 버튼 없음. 로딩/빈 상태는 기존 useData·State·TableContent 사용.
- 검증(2026-11-06 로컬): typecheck exit0, npm test 16/16, build:verify exit0, playwright.memberships.config.ts PC Chromium+iPhone WebKit 4/4(API 대역: 메뉴 href, 필터·검색·구독자 보기의 요청 query, 상태 표기, 탈퇴 회원 표기, GET 외 호출 0건, 권한 없으면 메뉴·요청 없음). 대조: 권한 매핑을 빼면 PC 실패, 원복 후 4/4.
- 기존 e2e/console.spec.ts(실서버) 12개 중 2개 실패(빈 표 문구 '표시할 데이터가 없습니다.', 문의 답변 행 탐색). 같은 실패가 origin/prod c714b5f에서도 재현되어 이번 변경과 무관한 기존 실패로 판단, 수정하지 않음.
- 남은 일: 커밋·dev 통합·prod 승격·운영 배포는 사용자 승인 대기. 실서버+실데이터 화면 확인은 배포 후.

## 2026-11-04 Google Authenticator 실행 시도 운영 배포 완료
- 사용자 배포 지시. feature acf939c → dev8da1b5c → prodd664a6c, 운영 crefans-admin:authenticator-20261104. 콘솔만 교체, API/worker/front/DB/proxy 컨테이너 ID 유지. 로그인 HTTP200, 콘솔 running/restarts0/OOMfalse. DB 변경 없음.
- 운영 이미지 내 googleauthenticator:// 포함·소스 커밋 라벨 확인. 운영 URL에 PC Chromium/iPhone WebKit 2회귀 통과(인증 API 대역, 실제 계정 미접속): 모바일 링크/PC 제외·6자리 자동제출·오류/복구 전환/입력 보존. 기존 로컬 타입·단위16/화면2 통과. 운영 Next빌드12페이지 성공, 기존 img 경고3개.
- 실제 iPhone Google Authenticator 실행 성공은 미검증. 현재 스킴 공식 호환성 보장 없이 1회 best-effort 시도, OS 차단/미설치 시 직접열기 안내 유지. Android 자동실행 미적용. 자동실행 성공으로 과장하지 않는다.
- 이전 콘솔 이미지와 설정은 /Users/ethan/crefans-recovery/20261104/authenticator에 비공개 보관, OCI blob/ID·SHA/설정해시 검증. 완료후 정확한 직전콘솔 이미지1개 및 이번 임시소스만 서버에서 제거. 여유10821349376bytes. 활성 이미지/DB/업로드 보존.
- 증거 .local/authenticator-release/{deployment.json,browser-results.json,build.log,cleanup.log}, docs/authenticator-release-20261104.json. 아래 미배포 기록은 이전 이력. 텔레그램 알림 설치는 별도 승인 대기이며 이번 배포에 포함하지 않음.

## 2026-11-04 Google Authenticator 자동 열기 시도 구현 (미배포)
- 사용자 Google 앱 확인 및 가능한 자동실행 시도 요청. iPhone/iPad만 googleauthenticator:// 데이터 없는 URL로 2차 인증 최초 진입 1회 시도. ref를 effect 전에 설정하여 재렌더/복구코드 복귀 시 반복하지 않음. 다른 계정 로그인 시작시 재설정. 수동 열기 링크·실패시 직접 앱 열기 안내·OTP 자동제출/복구코드 유지.
- 현재 Google 공식 자료에서 단순 실행 스킴의 최신 호환성 보장은 확인하지 못함. 이 구현은 best-effort 실험이며 실제 앱 실행 성공 주장 불가. 실물 iPhone Chrome/Safari와 설치된 앱에서 확인 필요. 미설치면 OS 오류/확인창이 나타날 수 있음. Android는 공개 manifest가 otpauth 등록용만 노출하므로 잘못된 등록 URI 대신 기존 수동입력 유지.
- 공식 확인 2026-11-04: https://developer.chrome.com/docs/android/intents (사용자 제스처/BROWSABLE 제한), https://raw.githubusercontent.com/google/google-authenticator/master/mobile/ios/OTPAuth-Info.plist 및 https://raw.githubusercontent.com/google/google-authenticator-android/master/java/com/google/android/apps/authenticator/AndroidManifest.xml (구형 소스, 현재 앱 지원 보장 아님).
- npm run check 타입/단위16 통과. npx playwright test -c playwright.authenticator.config.ts PC Chromium/iPhone WebKit 2통과(API 대역): 모바일 링크·PC 제외·6자리 자동제출·실패 후 복구 전환/입력 보존. 최초 타입검사 선언순서 오류 수정, 샌드박스 bind 제한 후 승인된 로컬 실행, 최초 E2E Next route announcer 중복선택 수정 후 통과. 실제 앱 실행·실계정·운영 배포 미검증.
- feat/mobile-authenticator-launch, prod2b9ac2c 기준. dev/prod 통합·운영배포 미실행. 다음: 실기기 실행 확인 후 필요시 스킴 조정 또는 수동안내 유지. 텔레그램 설치는 별도 승인 대기.

## 2026-11-04 모바일 2차 인증 앱 실행 요청 — 앱 종류 확인 대기
- 사용자 요청: 모바일에서 2차 인증 진입 시 Authenticator 실행. 최신 origin/prod 2b9ac2cf3318544895e97ca4b76a5724475c4a99에서 feat/mobile-authenticator-launch 분기. src/app/login/page.tsx의 TOTP_REQUIRED 전환과 입력완성 자동제출·복구코드 경로 확인. 제품 코드 변경·배포 없음.
- Google/Microsoft/기타 인증 앱 중 어느 앱인지 질문 중. 앱마다 실행 주소가 다르며 현재 설치 앱을 웹에서 확정할 수 없다. 답변 후 해당 앱의 실제 지원 링크 확인 필요.
- 공식 조사: https://developer.chrome.com/docs/android/intents 에서 Android Chrome은 사용자 동작 없이 JavaScript가 시작하는 외부 앱 실행을 제한함. 비동기 로그인 응답 후 자동실행 보장 불가. 지원 링크 확인 후 모바일 인증 앱 열기 버튼과 기존 수동입력·복구코드 보존 방향.
- https://github.com/google/google-authenticator/wiki/Key-Uri-Format 의 otpauth는 비밀키 신규등록용. 기존 인증 앱을 열기 위해 로그인 화면에 OTP 비밀키를 재노출하거나 빈 등록 URI를 쓰지 않는다. 구형 공개 iOS 소스는 현재 앱의 단순실행 지원 증거가 아님.
- https://learn.microsoft.com/en-us/azure/active-directory/develop/scenario-mobile-overview 의 msauthv2/v3는 MSAL 브로커 문맥이며 현재 서비스 TOTP 단순 앱 실행 지원과 동일시하지 않음.
- 확인일 2026-11-04. 검사: 로그인 소스/AGENTS/현재 Git 상태 읽기, 공식문서 조회. 앱 설치·실기기 이동·회귀 테스트는 미실행. 다음: 앱 종류 답변→실행 지원 확인→필요한 최소 UI/회귀검증. 이전 백업 텔레그램 설치는 별도 서버 작업이며 추가 승인 대기 유지.

## 2026-11-04 미배포 광고상품·미니멀 워터마크 운영 배포 완료
- dev→prod front615ee06/serveraf99bc3/admin0011cca. 운영 front/api/worker/admin minimal-bundle-20261104. 기본상품 특가제외·제목18px, 콘솔/프론트 상품명 동일 형식, 미니멀 워터마크40%/2%/3%/외곽선없음 반영. DB migration 없음·DB/proxy 유지·기존미디어 재변환 없음.
- front운영빌드·admin운영빌드 통과, 소스해시/운영키·배포6서비스 running/restarts0/OOMfalse. 배포공용preview PC Chromium/iPhone WebKit 기본4+특가4·중복없음·제목18px·상품명·안내열기닫기·팬이동 통과. API운영이미지 격리컨테이너 실사진 렌더링565변경픽셀(119~183), 영상미니멀인자 확인. 이전로컬 영상/사진4·프론트9·콘솔14 통과. 실계정콘솔/실업로드/실PG 미검증.
- 최초배포스크립트 로컬문법검사 줄바꿈오류로 SSH전중단, 수정후 배포성공. 복구이미지3개1.14GB·설정6파일 로컬전용보관 및 OCI/tag/blob·파일SHA검증. 완료후 이전3이미지·이번임시3폴더만 제거. 운영 여유12816658432bytes. 복구 /Users/ethan/crefans-recovery/20261104/minimal-bundle.
- 증거 front docs/audit/minimal-bundle-20261104.json 및 .local/minimal-bundle-release/. 운영 runtime은 위 소스커밋이며 이후 문서커밋은 런타임 변경 아님. 아래 미배포 기록은 해결된 이력.

## 2026-11-04 광고상품명 프론트 표기 통일 (미배포)
- 최신 origin/prod에서 feat/advertising-product-names. 목록·수정폼 초기값·저장 payload·삭제 확인에 advertisingTitle 사용. 기간2배 기존 이름은 총기간을 반씩 나눈 주목할 크리에이터 (n일+n일), 기존 괄호 이름은 앞 공백 통일. 일반/사용자 지정 이름 유지. 가격·기간·이력 변경 없음. 운영 DB 일괄 수정 없음, 폼 저장 시 이름 반영.
- npm run check 종료0: 타입검사+단위14 통과. 총2/4/6/14/60일, 일반 이름/홀수기간 보존 검증. 콘솔 실운영 브라우저 미검증·미배포. 프론트 짝 crefans_front-kakao-identity에도 괄호 앞 공백 반영.

## 2026-11-03 기간 2배 광고 이벤트 상품 — 운영 배포·4종 등록 완료
- 사용자 확정: 일반1/3/7/30일 유지, 이벤트2/6/14/60일=3,900/11,700/27,300/117,000원(VAT 포함). 같은 기간 기준가7,800/23,400/54,600/234,000원 대비50%. 기간은 이미 혜택을 포함한 총기간이며 재차2배/기존 구매 소급 적용하지 않는다.
- feat/advertising-event-products→dev 통합·검증→prod. 기능 승격 server01bec50/front532796c/admin803d8fc. 운영은 API·worker·front·admin advertising-event-20261103. DB 백업 후 추가형 migration20261103180000_ad_product_comparison_price 적용(운영 총51개). 프론트 파일해시·API/worker 소스/Prisma·공개4경로200·기존상품 불변·설정 보존·DB/proxy 컨테이너 불변 검증.
- 첫 배포는 이벤트 HTML에 존재하지 않는 정확 문구를 찾던 검증기 조건 오류로 앱 자동 복구. 추가 스키마는 호환 상태로 보존했고 기존 이미지 복구를 확인했다. 실제 메타 제목 검사와 브라우저 본문 검사로 구분해 수정한 뒤 별도 백업으로 재배포 성공. 기능 오류나 무조건 성공 처리로 덮지 않았다.
- 운영 콘솔의 정상 로그인/2차 인증 후 4개 등록 폼으로 저장. 기존4개+신규4개=총8개, 신규 정렬-40/-30/-20/-10. 서버 DB와 실제 DTO로 모든 상품의 이름·가격·기간·비교근거·50%·노출·버전·정렬을 대조하고 기존4개 전체 필드 불변 확인. 비밀번호·인증코드는 저장/증거에 포함하지 않는다.
- 검증: server build/단위3/격리DB·HTTP19, front check533/PC Chromium+iPhone13WebKit+320px E2E9, admin check13/E2E6 및 실제 운영 기준 소스 E2E6. 기준가=판매가 허용 대조 검사 실패→복원 통과. 운영 Chrome 콘솔8종/이벤트상세 문구 확인·실제화면 저장. 실물iPhone/실PG/운영 크리에이터 로그인 스튜디오 브라우징/실메일은 미실행.
- 이번 운영 서버는 기존 이메일 릴리스 기반 광고 관련 파일만, 콘솔은 기존5a290a4 기반 Advertising만 반영했다. prod의 별도 콩 만료 알림/기타 콘솔 미배포 변경은 이번 범위에 섞지 않았다. 해당 미배포 항목은 따로 배포해야 한다.
- 실구매·광고 실제 노출은 기존대로 준비 중(purchaseReady=false). 기간/가격 상품 등록과 목록·안내 공개까지 완료이며, 실결제 출시 완료가 아니다. 구매 개시/종료일·시작/취소 정책은 구매 기능 개시 전 결정해야 한다.
- 운영 확인 중 새 비교가격 small들이 붙어 보이는 부분은 광고 비교정보 두 줄만 block+4px 간격 수정. feat/advertising-price-linebreaks f7fccd5→dev6482bda→prod8408d0e, 타입+13검사 통과. 콘솔 단독 advertising-event-lines-20261103 배포 및 실제 Chrome8종 줄바꿈 확인 완료. API/worker/front/DB/proxy는 그대로 유지.
- 이미지 정리: 구형 API open-events-20261103·admin referral-20261102 삭제는 자동 승인 검토가 별도 사용자 승인 필요로 거부하여 실행하지 않음. 최신/직전 운영 이미지 포함 모두 보관. 사용자에게 보관/삭제 선택을 요청했으나 배포·상품 기능에는 영향 없음.
- 증거: server `docs/advertising-event-products-20261103.json`, 각 작업트리 `.local/advertising-event/`의 명령 로그·브랜치/이미지/운영 검증 JSON·화면. 문서 해시 갱신은 제품 동작 검증과 구분한다. 기존 작업트리/미커밋 작업은 보존했다.

## 2026-11-03 광고상품 콘솔 가격 행 줄바꿈
- 기간2배 4종을 운영 정상 콘솔 폼으로 등록해 총8종. 기준가·판매가·비교 설명이 inline small 때문에 붙어 보여, 추가 비교정보 두 곳에만 block·4px 간격을 적용한다. 기존 상품 이름·전역 스타일은 유지한다.
- origin/prod에서 feat/advertising-price-linebreaks 분기. 콘솔 검증 후 dev→prod 승격, 같은 운영 기준 소스에 해당 표시 수정만 반영한다.

## 2026-11-03 기간 2배 광고 이벤트 상품 — 구현·검증, 운영 반영 준비
- 사용자 확정: 일반 1/3/7/30일 상품은 유지. 별도 2/6/14/60일 이벤트 상품은 각각 3,900/11,700/27,300/117,000원(VAT 포함). 일반 상품 2회 이용 기준가 7,800/23,400/54,600/234,000원 대비50% 할인. “원가” 대신 “동일 기간 기준가”와 실제 비교 설명 표시. 표시 기간은 혜택 포함 총기간이며 재차2배 적용하지 않는다.
- feat/advertising-event-products, 최신origin/prod에서 분기. 세 작업트리 `/Users/ethan/repository/crefans_{front,server,admin}-ad-event`. 기존 작업트리 변경 보존.
- 서버 comparison_amount(선택)·comparison_basis(200자) 추가형 migration, 입력검증·할인율 내림·감사·버전충돌 유지. 기존 클라이언트가 두 필드를 생략하면 저장값 유지. 콘솔은 비교 기준가/설명을 함께 편집. 팬/스튜디오 공용 목록/모달·목업/디자인 시스템·이벤트 안내 동기화.
- 검증: 서버 빌드·단위3·실DB/API19, 프론트 타입·이벤트8·PC/모바일WebKit/320px E2E9, 콘솔 타입·PC/모바일E2E6 통과. 비교금액=판매가 허용하는 잘못된 구현은 단위검사 실패, 복원 후 통과. 최초 sandbox loopback 거부·프론트 포트충돌·콘솔 구형의존성 문제는 검증환경 수정 후 재실행. 실제 PG 결제·광고 노출 검증 아님. 프론트 전체 check533·콘솔 check13·문서check PASS. 운영 기존 소스에 광고 수정만 적용한 콘솔 별도 배포본도 E2E6통과.
- 실구매 기능은 기존처럼 준비 중. 이번 작업은 상품 등록·비교가격·안내까지이며 결제수단/시작·취소 정책을 임의로 확정하거나 판매 결제 가드를 열지 않는다. 구매개시/종료일 미정 안내 유지.
- 운영 콘솔 읽기 확인: 일반4상품 존재, 승인 가격과 동일. 운영 이미지와origin/prod 차이에 광고와 무관한 미배포 수정이 있어 운영 변경 범위 대조 중. 상품등록 JSON과 실행 로그·스크린샷은 각 작업트리 `.local/advertising-event/`. 운영 상품 추가/배포 완료 전에는 완료라고 보고하지 않는다.

## 2026-11-03 예약 핸들 관리 — 로컬 완료·미배포
- origin/prod602cecf → feat/reserved-handles, 서버 짝 crefans_server-reserved-handles(d4238d9). /console/reserved-handles 메뉴·운영자 권한표 연결. 기존 콘솔 필터·표/모바일 가로 스크롤·portal 모달·스낵바 재사용.
- 승인된 초기103개는 서버 migration에서 예약 중으로 저장. 후보/예약 중/삭제됨, 검색·20개 페이지·사용 여부 표시, 추가·편집·예약/해제·삭제·복구·처리자 이름/시각/사유/버전 이력. 삭제는 사유+핸들 직접 입력이 필요하며 입력 미완성 상태에도 취소 가능. 공유 TypedConfirmDialog에 confirmDisabled 옵션 추가(기본false).
- 합격 조건을 실제 확인: npm run check 타입+11단위 PASS, npm run build:verify 12페이지 PASS(기존 Brand/Categories img 경고3개 유지). PC Chromium2·iPhone13 WebKit2 총4 E2E PASS. 생애주기2건은 격리 실제 API/DB, 읽기/무권한2건은 명시적 API 대역. 페이지·등록·새로고침 보존·예약/삭제/복구·서버 충돌·이력·권한·빈 결과·문서 가로 넘침 없음 확인.
- 최초4건 실패: 상태 select의 접근성 이름이 옵션까지 합쳐져 aria-label을 명시하고 권한 오류 검사는 Next route announcer를 제외한 main alert로 좁혔다. 수정 후4/4 통과. PC·모바일 목록/편집/삭제/이력/빈 결과 캡처 검토. 모바일 실기기 검증은 미실행.
- 증거: [검증 기록](docs/reserved-handles-20261103.json), 상세 .local/reserved-handles-20261103/, test-results/reserved-handles/. 서버 빌드·예약/기존 핸들/OpenAPI24건 통과 및 예약 차단 무효화 대조6실패→복원24통과.
- 다음: 요청 시 서버 DB migration·API/worker와 함께 dev→prod 검증 후 배포. 현재 feature 커밋 준비, 미푸시·미통합·미배포이며 기존 작업 보존.

# 진행 상태

## 2026-11-02 콩 후원·출금 표 9개 no-data 안내 (로컬 완료·미배포)
- 요청/합격 기준: `/console/beans`에 포함된 모든 표에서 성공한 빈 응답을 기존 가운데 정렬 `.empty` 디자인으로 표시한다. 로딩·오류·집계 미제공을 빈 내역과 구분하고 PC·모바일에서 확인한다.
- 범위: 충전 집계, 후원 유형별 사용량, 출금 집계, 출금 재원별 집계, 충전 주문·입금 대사, 후원 이동, 콩 출금 신청, 미수금, 회원 지갑 이동 이력 등 9개. 다른 매출·정산 페이지의 ManualPayouts와 비표 형태 지표는 제외한다.
- 구현: `TableContent`로 빈 상태를 통일하고 모든 표에 접근 가능한 이름을 추가했다. 기존 데이터가 있으면 갱신 중에도 행을 유지한다. 2페이지 이후 빈 내역은 ‘현재 페이지’로 명시하며, 선택적 집계 필드 미제공은 ‘확인할 수 없습니다’로 구분한다. 금액·지급·환불·권한·API는 변경하지 않았다.
- 검증: `npm run check` TypeScript·13/13 단위 통과, PC Chromium/모바일 WebKit(iPhone 13 화면) 대역 API 브라우저 10/10 통과, 최종 캡처 재검사 4/4 통과, `npm run build:verify` 12페이지 빌드 통과. 기존 Brand/Categories img 경고 3건 유지. 원본 Beans 사본은 표 누락 검사에서 실패하는 대조 확인. 실제 운영 데이터 조작 0건이며 물리 iPhone·운영 인증 금융 검증은 하지 않았다.
- 초기 브라우저 실패 4건은 StrictMode 중복 조회 대역과 높이 0 스피너 부모 선택 오류를 보정 후 통과. 실패 로그를 보존했다. PC·모바일 no-data 캡처 육안 확인 완료.
- 증거: `docs/beans-empty-20261102.json`, `.local/beans-empty-20261102/`의 로그·캡처·대조 결과·커밋 후 상태. 기준 origin/prod `602cecfa7daba567756d2a3a1146877f9616a0fe`, 작업 `feat/beans-empty-states`, 작업트리 `/Users/ethan/repository/crefans_admin-beans-empty`. 주 체크아웃의 기존 미커밋 PROGRESS는 보존했다.
- 남은 작업: 사용자 운영 반영 요청 시 dev 통합 검증 → prod 승격 → 배포. 이번 요청은 개선이며 배포는 실행하지 않았다.


## 2026-11-01 저녁 /pilot-work 결정 동기화 (커밋 완료·배포 대기)
- 결정(클릭 답): 보상 출금 불가·남은 만큼 회수·일부 환불 전체 회수(약관 명시 예정)·비활성 소멸·상한 초과 종결·내역 고지·부정 문구 완화, 원천징수는 회사가 플랫폼 수수료 안에서 부담, 가이드 틀린3+누락5, SEO 새 주소+301·www→apex, 로딩 일괄 정리, 업로드 상한+감시, 재시도+안내, 오프사이트 백업 나중에, 관리자 수수료 그대로.
- 커밋: 서버 ebb3406(레퍼럴 출금 불가)·46fe73e(관리자 소멸 상태)·b65f083(API 설명 7건·설계 문서)·384f5ea(Caddy www 301), 프론트 d2af2a6(초대 카드·내역)·0c1d481(이벤트 주소 301), 관리자 93f4c28, 가이드 ee0aed7·053ac97. 미커밋 유지: 계약 폴더(docs/contracts 전체가 미추적), 프론트 docs/audit manifest·evidence(다른 세션 변경과 섞임).
- 검증: 서버 referrals+beans+openapi 57 pass(보상 로트 되돌리면 3 fail), 프론트 초대 테스트 5 pass(HEAD 카드면 1 fail), 이벤트 301 테스트(302면 1 fail)·개발 서버 curl 301, Caddy validate(APP_DOMAIN=www면 실패), 가이드 사본 check-guides 링크·앵커 1345(앵커 훼손 대조 검출), 계약 PDF v2.36 7쪽 자동 PASS·전 쪽 육안, check:docs PASS.
- 배포 대기: video-harden-20261101(API·워커·프론트, 이미지 운영 서버 적재·진단 기동 성공, deploy.sh 실행은 승인 필요로 미실행), 레퍼럴·이벤트 주소·Caddy·가이드는 아직 빌드 전.
- 미해결: ① 약관 개정(11-30 시행본은 10-30 공지 완료 — 레퍼럴 조항·원천징수 문구를 여기에 넣을지 별도 개정으로 할지) ② 운영 APP_DOMAIN이 www가 아닌지 배포 전 확인(같으면 Caddy 기동 실패) ③ 가이드 check:guides 소스 잠금 52건 차이(전체 재검토 필요), beans/referral 가이드 매핑 없음 ④ 배포·미커밋 67개(night-work/drift-20261101.md) ⑤ 로딩 규칙 12곳 진행 중.
- 사고: 18:33 서버 docs/platform-api.md를 스크립트 실수로 0바이트로 만듦 → 10/31 사본+codex 기록 1건 재적용으로 복원, 기록 해시 f27e3b36 일치 확인 후 행 추가.
- 19:10 추가: 사용자 결정 '기능 묶음별 커밋'으로 배포·미커밋 67개 정리 → 재측정 결과 세 저장소 모두 0개(남은 운영≠HEAD는 커밋 후 배포 대기분). 서버 2c3e5ae·e6472c9·fd999f0·910bf63·3b56003, 프론트 f81a056~fca06d0(9개)·5f95e58, 관리자 514e53c·4de157b·be481cc. 각 커밋은 배포 사본 SHA-256 일치 확인, 스냅숏 검사: 서버 tsc·build·openapi 11 pass, 프론트 tsc·전체 455 pass, 관리자 tsc·11 pass. 다른 세션의 미배포 테스트(서버 tests/*, platform-categories·new-creators 테스트)는 아직 미커밋.
- 로딩 규칙 12곳(서브에이전트): 프론트 fd3fba7, 관리자 b04aaf7. 스냅숏 474 pass, ApiState 되돌리면 2 fail. 프론트 e2e/advertising 문구는 미실행.
- 약관: 사용자 결정 '별도 개정으로 새로 공지' — 레퍼럴 조항·원천징수 회사 부담 문구를 담은 새 개정본(30일 전 공지)을 준비할 차례. 공지 게시·시행일은 사용자 확인 필요.
- video-harden 배포: 사용자가 의미를 질문함(미승인) → 설명 후 재확인 필요.


## 2026-11-01 레퍼럴 디자인 폴리싱·복사 하단 스낵바 (로컬 완료·미배포)
- 요청/합격 기준: 팬 친구 초대와 콘솔 레퍼럴 관리가 각 서비스의 기존 톤앤매너를 따르며, 복사 성공은 본문 이동 없이 하단 스낵바로 표시한다. PC·모바일 레이아웃과 실패·반복 복사를 검증하고 기존 정책·권한·API를 유지한다.
- 구현: 기존 콘솔 토큰으로 운영 상태/정책 안내,5개 요약 지표, 상태 배지와 필터 간격을 정리. 모바일 표는 가로 스크롤하여 이메일 줄바꿈을 방지한다. 회원 링크 생성/복사 영역을 분리하고 기존 Snackbar로 복사 성공·설정 저장 성공을 표시. 중지/비활성 안내를 복사 성공 문구로 덮어쓰지 않음.
- 검증: npm run check 통과(TypeScript·단위11/11). 별도 loopback 개발 서버에서 Playwright PC Chromium/iPhone13 WebKit 8/8 PASS. 클립보드 성공/거부 대역, 재복사·자동/수동 닫기, 링크 내용·가로 넘침 ·관리 조회/변경 권한·확인 모달·필터·비활성 안내 보존 확인. 화면 캡처 육안 점검. 물리 iPhone·OS 클립보드 및 실운영/실공급사 검증 아님.
- 최초 실패/보완: 관리자 기존 테스트가 모바일 메뉴를 열지 않았고 Next route-announcer까지 alert로 선택해 실패. 검증 selector를 보정 후 재통과. 캡처 전 스낵바 opacity=1 대기 추가, 모바일 표 이메일 줄바꿈 보완 후 최종 재검증. 제품의 결제/보상/계정 정책 변경 없음.
- 증거: `.local/referral-polish-20261101/verification.json`에 HEAD·미커밋 상태·변경 파일 SHA256·명령/시각/종료코드·캡처 위치. before/원본, ui-first 및 results-first 실패 증거, check-final/ui-final 최종 로그 보존. AGENTS의 공통 스낵바 규약 유지. 기존 타 작업 변경을 보존했고 커밋/푸시/운영 배포 없음.
- 다음: 운영 반영 요청 시 최신 운영 소스·이미지 기준을 확인해 해당 변경만 배포. 미결정 정책 없음. 프론트 docs:record/check:docs는 기존 server/docs/referral-design-20261101.md 미분류, 레퍼럴4개·프로필 사진1개 API 설명 누락 및 생성 계약 만료로 실패했다. UI 수정 범위 밖의 기존 계약 문서를 임의 갱신하지 않았으며 문서 현행화 작업이 남았다. 상세는 같은 증거 폴더 docs-checks.json.


## 2026-10-31 18:25 KST 사용자 이름 단일화·스튜디오 깜빡임·대시보드 문구 — handle-sync-20261031 운영 배포, 프로필 사진 수정 시안
- 요청: ①공식 계정(khpark@gmail.com) 전환 후 핸들이 예전 회원 핸들로 고정되고 프로필 주소는 따로 받음 → 하나로, 프로필 수정에서 변경, 전환 시 별도 설정 없음 ②'로그인이 필요해요' 깜빡임 ③대시보드 '반가워요' 아래 설명 삭제 ④프로필 페이지에서 배경·프로필 사진 수정(시안 먼저).
- 원인: members.preferred_username(가입 시 임의, 수정 불가)과 creators.handle(전환·스튜디오에서 입력)이 별도. 깜빡임은 StudioRouter가 회원 정보 로딩 전에 signedIn(빈 기본값 false)을 먼저 검사.
- 변경: server ba8df97(PUT /me/profile handle, 크리에이터 주소 동기화, HANDLE_TAKEN/INVALID_HANDLE, 스튜디오 저장은 사용자 이름 사용, 마이그레이션 20261031180000_unify_handles: 직접 정한 크리에이터 주소를 사용자 이름으로(중복 제외) 후 모든 크리에이터 주소 일치), front 553540e(설정 > 프로필 수정의 사용자 이름 편집, 전환·스튜디오 '프로필 주소' 읽기 전용, StudioRouter 로딩 우선, 대시보드 설명 삭제, e2e/handle-studio, qa-journey 갱신).
- 검증: server platform-handle-unify 3/3(주소 동기화 제거 대조 FAIL), openapi 11/11, legal 11/11, 스테이징 스냅숏 tsc 0. front tsc 0, unit 423/423, e2e handle-studio 2/2(로딩 순서 되돌리면 깜빡임 검사 FAIL), 관련 E2E 38 통과.
- 배포(`crefans_front/.local/handle-sync-deploy-20261031/`): 폴더 생성 전 운영 확인 결과 다른 세션 배포로 API/front=new-creators-20261031, admin=financial-tooltip-20261031 → 이를 기준으로 사용. new-creators가 service.ts·openapi-contract.ts를 바꿨으므로 운영본에 제 수정분만 patch(충돌 없음), 나머지 front 5파일은 운영본=수정 전 커밋 대조 후 교체. ship 직전 운영 태그=기준 확인(BASELINE OK). 마이그레이션 적용(deploy.sh가 직전 DB 백업). 18:22 KST 완료. 운영 확인: 크리에이터 목록 '관악구 실시간 @crefans' 주소로 프로필 조회 성공, newCreators 필드 유지, health·스튜디오·콘솔 200. 이미지 정리 keep 3+new-creators·financial-tooltip 보호.
- 미검증: 공식 계정으로 로그인한 상태의 설정 화면·스튜디오(운영 계정 필요).
- 시안(미구현·미배포): `crefans_front/.local/profile-photo-mock-20261031/` 4장. 내 프로필 배경 오른쪽 아래 '배경 사진 변경', 프로필 사진 카메라 배지, '프로필 사진 변경' 창(PC 가운데·모바일 하단 시트, 프로필 원형·배경 3:1 미리보기, 사진 선택·삭제, JPG·PNG·WEBP 5MB(서버 이미지 제한과 동일), 저장 시 크리에이터 프로필에도 같은 사진). 현재 서버·스튜디오 모두 프로필·배경 업로드 API 없음 → 구현 시 서버 저장 API·스튜디오 반영 필요.

## 2026-10-31 17:51 KST 금융 정책 툴팁 운영 배포 완료
- 사용자 지시 `배포`에 따라 `crefans-admin:financial-tooltip-20261031`을 운영 콘솔에 반영했다. 최신 운영 `policy-sync2-20261031`의 image label·source manifest와 작업 전 Console.tsx 일치를 확인하고, `src/components/console/Console.tsx` 한 파일만 교체한 격리 소스로 빌드했다. 준비·배포 직전 모든 서비스 ID/image 기준을 확인해 병행 배포 덮어쓰기를 방지했다.
- 검증: amd64 운영 build 성공(기존 Brand/Categories img 최적화 권고 3건). 빌드 단계 79개 소스 및 최종 runtime 132개 파일 SHA 일치. 운영 이미지 자체를 loopback3006에서 실행해 PC Chromium/모바일 WebKit × 수정/조회 권한 4조합 툴팁 검증 통과(관리자 API 대역, 요청 변경·브라우저 오류 0). 모바일 캡처 육안 확인, 테스트 컨테이너 종료.
- 운영: 17:51 KST admin만 재생성. 로그인·운영 설정 셸·API health·서비스 feed HTTP200, 비로그인 관리자 API401. 실제 제공 JS `/_next/static/chunks/669-d0ce94fad9f3c300.js`가 검증한 이미지와 SHA 일치하며 수수료·보류 설명 포함. 기존 분야 관리/공통 portal 모달 JS·모바일 sticky CSS 확인. 나머지 5개 컨테이너 ID/image 유지, 전체 running/restart0/OOM없음. `.env`의 ADMIN_IMAGE만 변경, 금융 정책값·DB·API·worker·프론트·집 IP SSH 규칙은 변경하지 않았다.
- 복구/정리: `/opt/crefans-backup-financial-tooltip-20261031/.env`와 직전 운영 image 보존, 전송 archive 삭제. 로컬/원격 이미지 keep3+직전 운영 보호 계획 확인 후 적용(modal-layer 이전 이미지 1개씩 삭제, 오류0). Docker Desktop 유지. 로컬 생성 `.next-policy-tooltip` 산출물은 비공개 `.local`로 이동.
- 증거: `.local/financial-tooltip-deploy-20261031/`의 prepare/source manifests/build-result/ui-results/image/deployment-command/after/retention/verification JSON과 로그·화면. 기준 HEAD 6e349498, 기존 미커밋 변경 보존·커밋/푸시 없음. 인증된 운영 금융 정책 화면 직접 조작과 실제 iPhone은 미실행이며, 운영 산출물 검증과 로컬 운영 이미지 UI 검증을 구분한다.

## 2026-10-31 금융 정책 항목 설명 툴팁 (로컬, 미배포)
- 요청/합격 기준: 운영 설정의 플랫폼 수수료율·정산 보류 기간 제목 오른쪽에 ⓘ를 표시하고 실제 계산과 적용 대상을 설명한다. PC hover·키보드 및 모바일 탭으로 읽을 수 있고, 조회 전용 권한에서도 안내는 사용 가능하며, 열람이 정책 변경 요청을 보내지 않아야 한다.
- `Console.tsx`는 기존 `InfoTip below`와 field-label 스타일을 재사용한다. 수수료는 멤버십 최초·갱신 결제 공제, 원 미만 버림, 10,000원/20% 예시, 단건 멤버십 적용, 콩 수수료 분리를 명시했다. 보류는 서버 결제 완료 처리 시점부터 주말 포함 24시간 단위, 7일=168시간, PG 실제 입금 확인 등 별도 출금 조건, 자동 송금일/구독기간/콩 후원과 구분했다. 상단 설명과 변경 확인 문구에 개별 크리에이터 조건 우선·기존 구독의 저장 조건 유지·이미 처리 중인 결제 보존을 반영했다. 금액·정책값·서버 로직은 변경하지 않았다.
- 근거 코드: 형제 서버 `src/platform/financial-policy.ts` paymentPolicy(개별 조건 우선), `finance.service.ts` pay/finalize/renewals(최초 결제 처리 시작 시 snapshot, 수수료 floor, 완료 now+hold×86,400,000, 갱신 기존 snapshot), `settlement-receipts.ts` settlementHoldReasons(PG 입금 확인 및 충분한 입금액). 현재 HEAD 20563e4를 읽어 검토했다.
- 공식 자료 확인(2026-10-31): [토스페이먼츠 정산](https://docs.tosspayments.com/resources/glossary/settlement)은 PG→상점 지급이 결제 승인과 별도 과정이며 계약된 정산 주기에 따른다고 설명한다. 콘솔 보류기간은 크레팬스 내부 24시간 단위 정책이므로 PG 영업일 정산 주기나 송금일과 동일하다고 안내하지 않았다. 실제 PG 계약 주기 확인이나 새로운 금융 정책 결정은 본 작업 범위가 아니다.
- 검증: `npm run check` TypeScript 성공·단위 11/11, 프론트 `npm run check:docs` 통과. 비공개 Playwright 확인 스크립트로 PC Chromium/모바일 WebKit(iPhone 13, 390×844) × 수정 가능/조회 전용 4조합 PASS. 툴팁 문구·hover/focus/tap·외부 클릭 닫힘·뷰포트 안 표시·기존 입력값/권한·미확인 저장 비활성·정책 변경 요청 0건·브라우저 오류 0건을 확인했다. PC/모바일 최종 캡처 육안 확인. 기존 console E2E의 단일 툴팁 locator는 변경 버튼 범위로 한정했으며, 해당 전체 DB E2E는 이번에 재실행하지 않았다.
- 검증 보완 기록: 첫 UI 검사는 disabled input에서 키보드 탐색을 시작한 검사 스크립트 오류로 실패했다. focus 가능한 안내 버튼을 기준으로 수정 후 통과했다. 초기 캡처가 opacity 전환 중 찍혀 최종 opacity=1까지 기다리는 조건을 추가하고 4조합을 다시 실행했다. 실제 iPhone·인증된 운영 화면·운영 배포는 미실행이다.
- 증거: `.local/financial-policy-tooltip-20261031/{before.json,verification.json,check.log,ui-results.json,verify.cjs,*.png}`. 기준 admin HEAD 6e349498, 기존 미커밋 변경을 보존했고 본 작업 커밋·푸시 없음. 검증용 개발 서버 종료·자동 tsconfig 변경 복원.

## 2026-10-31 17:37 KST /pilot-work 확정 정책 동기화 + 운영 배포 policy-sync2-20261031·가이드 (사용자 결정)
- 결정(/pilot-work 질문): ①실결제 문구는 약관 '시행 예정본+공지' 방식, ②시행일은 토스 승인 후 확정, ③원천징수 회사 부담·출금 화요일 마감은 안내·가이드에 지금 반영하고 약관 제6조는 실결제 개정본에, ④beta.crefans.com 링크는 crefans.com으로 지금 교체. 추가 지시: 초대제 안내 '베타기간(~26년 11월)'→'현재 기간(~26년 11월)'.
- 변경·커밋(푸시 없음): server 20563e4(마케팅 메일 기본 주소·설정 예시 crefans.com, 초대 안내 문구, live-payment-launch 원천징수 조사·결정·약관 제6조 개정 초안), front c0b8c6c(payoutTaxNote: 스튜디오 정산 안내·FAQ·서비스 가이드, 명함 소개 링크 crefans.com, 테스트 기대 문구), guide 9259cf6(수익과 출금·출금 설정·서비스 소개·소개서 PDF·가입 안내·문제 해결, beta 링크 22파일→crefans.com, 링크 검사기, 원본 잠금).
- 약관(`legal-documents.ts`)은 미변경: 개정 초안은 server docs/live-payment-launch-20261031.md 4절 표(4조·6조 세금·일정·실결제). 시행일·공지는 토스 승인 후.
- 검증: server build, platform-beta-policy 11/11·platform-legal 11/11(처음 실행은 다른 세션의 테스트 DB 점유로 실패→재실행 통과), front tsc 0·check 422/422, guide check:guides 통과(서비스 링크 44)·빌드 28쪽·소개서 PDF 13쪽 넘침 검사 통과·10쪽 육안 확인.
- **사고와 교정**: 첫 배포 policy-sync-20261031(17:2x KST)이 payout-cutoff/beta-closed 기준 소스로 빌드됨. 그사이 다른 세션이 category-management-20261031(분야 관리, 마이그레이션 없음)을 배포해 두었고, capture_before가 배포 직전 상태를 새 기준으로 기록해 guard가 막지 못함 → 분야 관리 변경이 약 10분간 운영에서 빠짐. 즉시 category-management 소스를 기준으로 제 6파일만 얹은 policy-sync2-20261031을 17:33 KST에 재배포(운영본=수정 전 커밋 대조, 분야 관리 콘솔 API 4개 경로 존재 확인(비로그인 400, 404 아님)). DB 변경 없음. 재발 방지: 배포 폴더 생성 직전과 ship 직전에 release-before의 이미지 태그가 기준 릴리스와 같은지 확인할 것.
- 운영 확인(policy-sync2): API health 200, crefans.com 탐색 200, 콘솔 로그인 200, FAQ 원천징수·화요일 마감 문구, 명함→crefans.com/service/landing 이동, API·worker MARKETING_PUBLIC_ORIGIN=https://crefans.com(deploy.sh 검사). 이미지 정리 keep 3+category-management 보호. 가이드(`crefans_guide/.local/deploy-policy-sync-20261031/`): 운영 44파일 해시 일치, 컨테이너·Caddy 불변, 가입 안내에 전체 동의·로그인하러 가기.
- 남은 것: 프론트 docs:record는 다른 세션의 분야 아이콘 API 설명 누락으로 실패(그 세션 몫), guide check:guides는 다른 세션의 미배포 '새 크리에이터' 변경(CreatorPages·service.ts)으로 잠금 불일치(그 세션 몫). 원천징수 gross-up·지급명세서 운영·주민번호 수집은 세무사 확인 후.

## 2026-10-31 17:23 KST 활동 분야 순서·아이콘 편집 및 운영 배포
- 요청/합격 기준: 목업 순서를 참고해 운영 활동 분야 순서를 저장하고 아이콘 업로드·교체·기본 복원, 이름·사용 상태를 편집한다. PC·모바일에서 저장 결과/오류/권한을 구분하고 서비스 표시까지 연결한다.
- `Categories.tsx`에 위·아래 이동, 목업 순서로 정렬, 순서 저장/되돌리기를 추가했다. 목업에 없는 등록 분야는 뒤에 기존 순서로 유지한다. 편집은 기존 body portal 모달을 재사용하며 PNG/JPG/WebP 2MB 이하 이미지의 선택 즉시 저장 여부를 명시한다. 생성은 content.create, 수정·정렬·아이콘은 content.update, 조회는 content.view. 아이콘은 콘솔의 인증된 `/admin/categories/:id/icon/:version` 경로를 사용한다.
- 검증: `npm run check`(TypeScript·단위11), PC/Pixel7 `categories.spec.ts`·`category-management.spec.ts` 8/8 통과. 로컬 실제 서버·격리 MySQL로 순서/업로드/교체/기본 복원/이름/사용 상태/서비스 응답 확인. 목업 순서·동시 변경409·읽기 전용·오류 표시는 API 대역 검사. 모바일 편집 모달 캡처 육안 확인. 최초 실행의 계정별 분야명 충돌·모바일 메뉴 locator 및 아이콘 프록시 경로를 수정한 후 재검증했다.
- 운영: `crefans-admin:category-management-20261031` 17:23 KST 반영. API·worker·서비스 프론트도 같은 릴리스. 기존 modal-layer 운영 소스에 본 작업 14파일만 덮어쓴 격리 빌드의 소스/산출물 해시를 검증했다. HTTPS200·신규 관리자 API 비로그인401·콘솔 번들 새 기능·기본 아이콘200, DB/proxy 유지, 마이그레이션/운영 분야 데이터 변경 없음. 실제 운영 로그인 상태 편집 및 신규 S3 업로드는 미실행이며 로컬 실제 HTTP·S3 대역 검증과 구분한다.
- 증거: `.local/category-management-20261031/verification.json`, `e2e-final-all.log`, `check-final.log`, `results.json`, `screenshots/`. 배포 증거는 형제 프론트 `.local/category-management-deploy-20261031/`(before/after, source-delta, source manifests, builds, deployment-command). 기준 HEAD 6e349498; 기존 미커밋 변경 보존, 본 작업 커밋·푸시 없음.

## 2026-10-31 17:03 KST 표 내부 모달 레이어 수정 및 운영 배포
- 사용자 요청: 모바일 sticky 작업 후 모달이 표 영역에 귀속되는 문제 수정·배포. 합격 기준은 모달이 표·상단 메뉴 위에서 뷰포트 전체를 덮고, 내부 스크롤/닫기/배경 스크롤 복원 및 기존 sticky 동작을 유지하는 것이다.
- 원인: 공통 `ConfirmDialog`가 표 셀 안에 렌더링되어 `.table-wrap`의 overflow/격리된 쌓임 순서에 묶였다. `src/components/console/TypedConfirm.tsx`에서 마운트 후 React portal로 `document.body`에 렌더링하도록 변경. 일반·문구 확인 모달 모두 적용, 기존 확인/취소 핸들러·스크롤 잠금 유지. 근거: [React createPortal](https://react.dev/reference/react-dom/createPortal), 2026-10-31 확인; 프로젝트 React 18에서 제공하는 기존 API 사용.
- 로컬: `e2e/modal-layer.spec.ts` 추가. 수정 전 모바일에서 모달 배경이 상단 메뉴보다 아래에 그려지는 실패 재현(exit1). 수정 후 Chromium 모바일/가로/PC·WebKit 모바일, 회원 이용 제한·삭제 및 기존 모더레이션 관련 UI 총24 PASS(exit0), TypeScript·단위11 PASS, diff 검사 PASS. 실제 모달 DOM 위치·화면 모서리 hit-test·배경 잠금·내부 스크롤·닫기·sticky 유지 확인; 운영 데이터 변경 없이 API 대역으로 실행. WebKit 삭제 모달 화면도 육안 확인.
- 범위/한계: 첫 전체 실행의 신규 테스트 3건은 portal 마운트/닫힘 완료 대기 부족으로 실패하여 대기 보완. 별도 기존 `moderation.spec.ts`의 미검수 필터 WebKit 검사 1건은 중복 empty-state locator로 실패하여 최종 관련 검사에서 그 테스트를 제외(4개 프로젝트). 실제 iPhone 및 운영 로그인 상태 모달 조작은 재검증하지 않았다.
- 배포: 최신 콘솔 `payout-cutoff-20261031`의 source manifest·image label 일치를 확인해 공통 모달 1파일만 덮어쓴 격리 소스에서 amd64 build 성공. `crefans-admin:modal-layer-20261031` 운영 반영(17:03 KST). 빌드 소스와 runtime 산출물 SHA 일치, 전송 archive SHA·원격 layer 확인. 운영 JS `/_next/static/chunks/669-d4af5160d3813e8e.js`가 검증된 이미지와 SHA 일치하며 createPortal/document.body 포함 확인. 운영 sticky CSS 유지.
- HTTPS: 콘솔 로그인·회원 셸/API health/서비스 feed 200, 비로그인 admin/me401. ADMIN_IMAGE만 변경, 다른 5개 컨테이너 ID·이미지 유지(프론트 beta-closed 보존), 전체 running/restart0/OOM없음. 마이그레이션·운영 데이터 변경 없음. 롤백 `.env`와 직전 이미지 보존(`/opt/crefans-backup-modal-layer-20261031`). 전송 archive 삭제, 자동 생성 tsconfig 항목 복원, 테스트 출력은 비공개 폴더 이동.
- 증거: `.local/modal-layer-20261031/verification.json`, before/after 결과·스크린샷·check 로그, `.local/modal-layer-deploy-20261031/` 소스 manifest/build/deploy/after/verification. 기준 HEAD 6e349498, 관련 파일 SHA 및 기존/현재 dirty 기록. 타 작업 미커밋 변경 보존, 커밋·푸시 없음.

## 2026-10-31 16:40 KST payout-cutoff-20261031 운영 배포 (사용자 지시 '커밋과 배포')
- 커밋: server 569ea97(출금 화요일 23:59 KST 마감), front 4769848(출금 안내 문구), admin 6e34949(수동 지급 패널 안내). 다른 세션 미커밋 변경 제외(서버는 수정 전 사본 대비 패치·API 문서는 해당 문단만), 서버 스테이징 스냅숏 tsc 0. 푸시 없음.
- 배포(`crefans_front/.local/payout-cutoff-deploy-20261031/`): 기준 API payout-switch, 프론트 signup-page, 콘솔 mobile-table-sticky(다른 세션 배포본) 소스에 server 4·front 3·admin 1 파일만 덮어씀(나머지 manifest 일치, 각 파일의 운영본=수정 전 커밋본 확인). 마이그레이션 없음. deploy.sh 자체 검사 통과(신규 콘솔 API 비로그인 401/403, 결제 스위치 꺼짐, DB·proxy 유지). 배포 후 .env/runtime 세 이미지·APP_RELEASE=payout-cutoff-20261031. 운영 확인: 고객센터 FAQ·크리에이터 가이드에 '화요일 23:59' 문구. 이미지 정리 keep 3+직전 3개 보호, signup-success·qa-categories 삭제, 오류 0.
- 미검증: 실제 수요일 처리(다음 수요일 11-04), 로그인한 스튜디오 출금 안내 화면.
- 세무(원천징수) 조사 결과는 server `docs/live-payment-launch-20261031.md` 5절에 출처·확인일과 함께 기록. 결론 미확정(세무사·서면질의 필요).

## 2026-10-31 16:31 KST 출금 신청 마감·공휴일 지급일 확정 및 반영 (사용자 결정)
- 결정(사용자, 16:31 KST): 출금 신청 마감 화요일 23:59(KST), 매주 수요일 지급, 수요일 공휴일이면 다음 영업일(추천안). 참고 사례: 포스타입 매월 1일 마감·10일 지급·휴일이면 이전 영업일(help.postype.com '수익 입금 날짜', 2026-10-31 확인) — 수동 이체 운영이라 다음 영업일 선택.
- server: `beta-policy.ts` payoutCutoff/inPayoutBatch/payoutQueue/PAYOUT_SCHEDULE_MESSAGE, `finance.service.ts`·`beans.service.ts` payout 검사와 작업자 큐, `jobs.service.ts` 큐가 수요일 0시 이전 접수분만 처리. 테스트 `tests/payout-cutoff.test.cjs`(경계 2건), `platform-manual-payouts` +1(수요일 접수분 거부). 검증: cutoff 2/2, manual-payouts 5/5, beans 32/32, provider-lifecycle 17/17. 대조: 마감 조건 제거 시 cutoff 1건·manual 1건 FAIL, 복원 후 PASS. 문서: platform-api.md 출금 마감 절, live-payment-launch 약관 제6조 행.
- front: `lib/crefans/creator-payout-policy.ts` payoutScheduleNote(스튜디오 멤버십·콩 출금 안내), `support.ts` FAQ, `ServiceGuidePage.tsx` 가이드 문장. 같은 문장 속 '베타에서는 실제 송금하지 않습니다'는 실결제 문구 개정 때 별도. 검증 tsc 0, unit 422/422.
- admin: `ManualPayouts.tsx` 안내문에 마감·공휴일. tsc 0.
- 계약서 v2.34 별지 A 확정 문구, PDF sha256 40f63f95ceda80e5ba5021c40b636f7666dfa549812ebedbd5000da1ec55794d, 6쪽 확대 확인.
- 미완: 커밋·배포 안 함. 약관 본문(제6조)은 개정 시행 때. 공휴일 판정은 코드에 없음(운영자 처리).

## 2026-10-31 15:08 KST 모바일 표 헤더 운영 배포 완료
- 사용자 배포 지시로 `crefans-admin:mobile-table-sticky-20261031`을 https://admin.crefans.com 에 반영. 직전 운영 `payout-switch-20261031`의 소스 manifest/이미지 label을 확인하고 CSS·Beans.tsx 두 파일만 덧씌웠다. 다른 작업의 미커밋 변경을 추가로 배포하지 않았다.
- amd64 production build 성공(기존 Brand img 권고 1건). 빌드 단계의 소스 SHA와 최종 standalone server/static/public 산출물 일치 검증 후 전송 archive SHA·원격 image layer를 재확인. runtime image `sha256:2400c0a0f076cbb4a3084a78b78174205bcabde77f188b6269d1f3a7ad7e1cd2`.
- admin만 `--no-deps --no-build`로 교체. 나머지 5개 컨테이너 ID·이미지 유지, 전체 running/OOM 없음/restart 0. `.env`는 ADMIN_IMAGE만 변경, DB migration·운영 데이터·금융 스위치 변경 없음. 기존 집 IP SSH 규칙 유지.
- 운영 HTTPS 확인: 콘솔 로그인·회원 화면 셸, API health·서비스 feed 각200, 비로그인 admin/me401. 실제 제공 CSS `/_next/static/css/a756f4ad056d8251.css`에서 모바일 70dvh 스크롤·thead sticky·PC contents/mobile block 확인. 앞선 로컬 Chromium/WebKit UI 11 PASS·타입/단위11 PASS 근거 유지. 운영 로그인 후 스크롤 및 실제 iOS 기기는 이번 배포에서 재검증하지 않았다.
- 증거 `.local/mobile-table-deploy-20261031/`: prepare/source/image/build-result/deployment-command/after/verification JSON 및 build/load/deploy 로그. 배포 명령 exit0, 원격 전송 archive 삭제 완료. 롤백은 `/opt/crefans-backup-mobile-table-sticky-20261031/.env` 및 직전 이미지 보존. 코드 커밋·푸시 없음.

## 2026-10-31 15:00 KST 모바일 표 헤더 고정 (로컬, 미배포)
- 사용자 요청: 운영 콘솔 모바일 테이블 헤더 sticky. 합격 기준은 긴 표 세로 스크롤 중 헤더 유지, 가로 스크롤 열 정렬, 메뉴 가림 방지, 짧은 표 자연 높이, PC 기존 표시 유지다.
- `src/app/globals.css`: 기존 모바일 메뉴 분기(1079px 이하)에서 공통 `.table-wrap` 높이 최대 70dvh·양방향 스크롤, `thead` sticky/top 0, 불투명 헤더 배경·경계선과 격리된 쌓임 순서. 모바일 표의 border-collapse를 separate로 지정해 고정 경계선을 유지한다. 페이지 전체 대신 표 내부 스크롤 기준으로 고정한다.
- `Beans.tsx`: 공통 래퍼가 없던 충전 집계·출금 집계·회원 지갑 이력 3개에도 적용. PC는 `display:contents`로 기존 박스 표시 유지. 콘솔 소스 AST 조사 결과 표 21개 모두 공통 래퍼 적용, 누락 0개. API·원장·권한·운영 데이터 변경 없음.
- 검증: 별도 loopback 3004/격리 Next 출력·API 대역에서 Chromium 390×844/844×390/1280×900 및 WebKit 390×844 UI 검사 11 PASS, 모바일 전용 PC 조합 1 skip. 회원·문의·공지·분야·콩 표, 가로/세로 스크롤 좌표, 마지막 행 도달, 다크 스크린샷, 메뉴가 헤더 위에 표시됨을 확인. sticky 해제 대조에서 헤더 200px 이상 이탈하고 복원 시 2px 이내 유지. 첫 실행 실패 3건은 메뉴 열림 애니메이션 완료 전 즉시 판정한 검증 코드로, 상태 polling 후 통과. 실제 iOS 기기·운영 화면은 미검증.
- 원시 증거/소스 SHA/기준 HEAD·기존 dirty·명령·결과: `.local/mobile-table-sticky-20261031/` 및 `verification.json`. 타입·단위 검사는 `check-final.log`, 화면은 `screenshots/`. 테스트 서버가 자동 추가한 tsconfig 경로는 원복하고 임시 빌드 출력은 비공개 증거 폴더로 이동. 기존 타 작업 변경은 보존했으며 커밋·운영 배포는 하지 않았다.
- 근거(2026-10-31 확인): [MDN position](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position)의 sticky는 가장 가까운 overflow 스크롤 조상 기준. 기존 overflow-x:auto만으로는 페이지 스크롤에 헤더가 고정되지 않아 같은 래퍼에서 두 축을 처리했다. 다음은 운영 배포 요청 시 검증한 콘솔 변경분 반영.

## 2026-10-31 14:45 KST 커밋 정리·탈퇴 회원 재초대 수정·payout-switch-20261031 운영 배포
- /ask-me 결정(14:05 KST): 이 세션 변경만 기능별 커밋(푸시 없음), 스위치 끈 채 운영 배포, 이메일 실제 SMTP QA는 나중에, QA 보고서 v1.2는 이메일 QA 후 한 번에.
- 사용자 요청(작업 중): 운영콘솔 초대→가입→본인/콘솔 탈퇴 후 같은 이메일 재초대 불가 → 수정. 원인: 본인 탈퇴는 30일 파기 전까지 회원 행이 이메일·본인확인값(둘 다 unique)을 보유해 MEMBER_EXISTS, 콘솔 삭제는 사용 완료 초대가 남아 INVITE_USED. 수정: 탈퇴 회원 이메일 재초대 시 사용 완료 초대 재발급(admin.signup_invite_reissued), 30일 전이면 탈퇴 회원의 이메일·identity_hash만 즉시 해제(member.email_released), 나머지 개인정보는 기존 30일 파기 유지. 약관·처리방침에 재가입 제한 약속 없음 확인.
- 커밋: server 8f686f2(실결제·수동 지급 스위치·대기 사유)·71ae325(재초대), admin 50833e5(수동 지급 패널), front 7d27533(settledShot·QA-F01·이메일 QA 규약)·6fd7109(대기 사유 표시·통신판매업 번호 자리). 다른 세션의 미커밋 변경(분야 관리 categories, 콩 sourceType 필터, 코호트·통합 테스트, 갤러리·공유 스펙, 가입 완료 화면 등)은 hunk 단위로 제외, 스테이징 스냅숏 tsc 0(server·admin·front). 계약서 폴더(docs/contracts, 미추적)와 PROGRESS·manifest(혼합)는 커밋 안 함.
- 결함 수정: OpenAPI 테스트와 콘솔 manual-payouts 스펙에서 주석이 같은 줄 코드(경로 목록 비교, 마지막 스크린샷)를 삼키던 것.
- 검증(로컬 13:55~14:30 KST): signup-invites 8/8(신규 테스트는 수정 전 MEMBER_EXISTS로 FAIL→수정 후 PASS), openapi 11/11, manual-payouts 4/4, hold-reasons 1/1, beans 32/32(CREFANS_E2E=true), provider-lifecycle 17/17, admin-console 14/14, pilot-followups 4/4, server tsc 0, 콘솔 manual-payouts E2E 1/1, admin tsc 0.
- 운영 배포 payout-switch-20261031(14:41 KST 완료, 프론트 `.local/payout-switch-deploy-20261031/`): 기준 API invite-fix, 콘솔 qa-categories, 프론트 signup-success(다른 세션 14:17 배포본)에 이 세션 파일만 얹음(server 12·admin 3·front 4 파일, 나머지 manifest 일치). 마이그레이션 없음. deploy.sh 자체 검사 통과: 신규 콘솔 API 비로그인 401/403, API·worker의 LIVE_PAYMENTS_ENABLED·MANUAL_PAYOUTS_ENABLED 꺼짐, DB·proxy 미재생성. 배포 후 .env/runtime: 세 이미지·APP_RELEASE=payout-switch-20261031. 공개 화면 12개(PC·Pixel 7) 배포 전후 픽셀 비교 11개 동일, 모바일 소개 1개는 같은 배포본 두 번 촬영에서도 같은 영역이 달라 움직이는 요소로 판단. 이미지 정리 keep 3 + 직전 릴리스 보호, 로컬·원격 guide-sync·signup-open 3개 삭제, 오류 0.
- 미검증: 운영에서 실제 탈퇴→재초대→재가입(운영 계정 필요), 로그인 화면의 대기 사유 표시(운영 크리에이터 정산 필요). 스위치는 꺼져 있어 실결제·수동 지급은 동작하지 않음.

## 2026-10-31 베타 실결제·수동 지급 준비 구현 (로컬, 미커밋·미배포)
- 결정(/ask-me): 토스 일반결제·자동결제·지급대행 신청(심사 중), 송금은 운영자 수동 이체+콘솔 기록, 통신판매업은 토스 등록 시 신고, 문구 개정·공지 후 개시(토스 승인·신고번호 확인 후), BETA_MODE 유지+스위치, 원천징수 없이 지급(세무 확인 필요 위험 기록).
- server: `beta-policy.ts` livePayments/manualPayouts — LIVE_PAYMENTS_ENABLED면 베타에서 live_ck/live_sk만(섞인 키 LIVE_KEYS_REQUIRED), 아니면 기존 test 키만. `bank-provider.ts` 수동 모드: 계좌 확인 MANUAL_ACCOUNT_REVIEW 안내, 이체는 pending 반환(동기 오류 동작 유지). `finance.service.ts` manualResult/manualVerifyAccount, payout 베타 차단은 수동 모드면 허용. `beans.service.ts` manualResult(기존 payout 클레임+finishPayout 원장 경로 재사용). `jobs.service.ts`·콩 작업자 수동 모드에서 수요일 처리 중 전환. admin API 4개(withdrawals/:id/manual-result, settlement-accounts 목록·verify, beans withdrawals/:id/manual-result), /admin/me livePayments·manualPayouts, /admin/withdrawals?status=open(+note·account_label). 권한 revenue.create·beans.update. openapi(171 operations)·platform-api.md 갱신.
- admin: `ManualPayouts.tsx`(매출·정산 아래 수동 지급 패널: 확인 대기 계좌, 이체할 멤버십 출금, 이체 완료 기록·반려 양식, table-wrap), Beans "이체 완료 기록", Console Admin 타입·연결. `e2e/manual-payouts.spec.ts`(ADMIN_E2E_MANUAL_PAYOUTS=1일 때만, tests/admin-console-server.cjs가 그때만 시드).
- front: `lib/content/business.ts` mailOrderNumber(null) — 값이 있으면 BusinessInfo 하단에 통신판매업 신고번호 표시.
- 문서: `crefans_server/docs/live-payment-launch-20261031.md`(결정·스위치·운영 절차·문구 개정 초안·남은 위험), manifest 등록.
- 검증: tests/platform-manual-payouts 4/4(대조: 수동 허용 제거 시 FAIL→복원 PASS), platform-beans 32/32(수동 콩 지급 추가), provider-lifecycle 17/17(transfer async 회귀 발견·수정), openapi 11/11, 서버 전체 416 PASS·0 FAIL(레거시 DB·실 AWS 2파일 제외), 콘솔 manual-payouts PC·Mobile PASS(최초 권한 이름·모바일 표 넘침 결함 발견·수정), front check 422/422, admin tsc, check:docs PASS. 콘솔 전체 E2E(PC) 38 PASS·1 FAIL(기존 QA-P03 대시보드 축소 넘침)·1 skip(수동 지급 스펙은 전용 환경에서만).
- 미적용: 약관·가이드·화면·계약서 문구 개정(초안만), 운영 배포, 운영 키 교체(사용자 직접), 통신판매업 번호 입력.

## 2026-10-31 /ask-me 결정 반영·운영 배포 qa-categories-20261031
- 사용자 결정(클릭): ① QA 수정분 커밋 먼저 ② 분야 관리 서버·콘솔 배포 ③ QA-P01·P02는 다음 배포에 포함 ④ 운영 금융 정책 20%·7일 맞음(사용자 확인, QA-E01 해소 기록).
- 커밋(푸시 없음): front 0b24a4e fix(메시지 대화방 유지·KST 시각), 5dcf63c test(qa-journey·qa-cohort·QA 설정·모바일 현행화) / server 1734563 test(e2e-server QA 동작) / admin 197a780 test(QA 설정). 다른 세션 변경(post-*/preview 스펙, AccountPages, PROGRESS·docs/audit, beans.spec 등)은 제외.
- 배포: 기준선 guide-sync-20261031(배포 직전 운영 확인) 위에 승인 파일만 덧씌움 — server admin.controller·openapi-contract(분야 GET/POST)·finance·beans.service(미수금 알림 원거래·이의 안내), admin Categories·Console·Operators·globals.css, front useServiceModel·SocialPages·studio 3·display-time. 미배포 제외: front AccountPages.tsx(다른 세션 가입 화면 수정). 이미지 내부 소스 해시 대조·amd64 확인, 배포 스크립트 확인(새 API, 비로그인 /admin/categories 401, 설정 변경 범위, DB·프록시 유지) 통과. 배포 후 실제 베타 비로그인 11화면 PC·Mobile 200, /admin/categories 404→401. 공개 분야는 0건 → 운영자 콘솔에서 분야 추가 필요.
- 이미지 보관: 로컬·원격 keep 3 적용(원격은 직전 콘솔 guide-sync를 --protect). 증거 `crefans_front/.local/qa-categories-deploy-20261031/`.
- QA-P03 원인: 콘솔 대시보드 recharts 숨은 툴팁이 넓은 화면 위치(right 460)에 남아 축소 시 가로 넘침. 분야 변경과 무관, 미수정(후속).
- QA 보고서 v1.1로 결정·배포 결과 반영, PDF 전 쪽 재검사(빈 쪽·영역 밖 글자 0, 케이스 ID 누락 0). /ask-me 스킬 신설(~/.claude/skills/ask-me).

## 2026-10-31 콘솔 PC·Mobile E2E QA (qa-pcmo-20261031-0743, 미커밋·미배포)
- `playwright.qa.config.ts`(pc 1440×900 / mobile Pixel7 390×844, 화면·trace 전체 기록) 추가. 전체 PC 38/39, Mobile은 연속 실행 시 로그인 429(제한 정상 동작, QA-T03) → Mobile 단독 재실행 31/39.
- Mobile 8건은 PC 사이드 메뉴 링크를 직접 누르는 테스트라 휴대폰 접힌 메뉴에서 실패(로그인 201 확인) → N/A 분류(원시 FAIL 보존, QA-T04). 휴대폰 메뉴 이동 케이스는 PASS. 후속: 휴대폰 메뉴 열기 공통 도우미.
- QA-P03: 대시보드를 1440px로 연 뒤 390px로 줄이면 body scrollWidth 460(기대 390). 1280 시작 기록은 통과. 넘치는 요소 미특정, 미수정.
- 원시 증거 `crefans_front/.local/qa-pcmo-20261031-0743/`(명령·시각·종료 코드·로그 SHA-256: logs/*.json, 소스 상태 source-state.json), 보고서 `crefans_front/output/pdf/crefans-qa-pcmo-20261031-0743/`(PC·Mobile·통합 HTML/PDF, traceability CSV/JSON, README, SHA256SUMS).

## 2026-10-31 운영 설정 활동 분야 목록·추가 (QA 후속, 미커밋·미배포)
- 합격 기준: PC·모바일에서 신규 분야 저장→목록 갱신/재진입 유지, 중복·실패 입력 보존, 서버 권한·감사 이력, 크리에이터 등록 선택지 연동. 기존 QA 작업 브랜치에서 후속 처리하며 타 세션 변경을 보존했다.
- `src/components/console/Categories.tsx`: 운영 설정 `/console/settings#categories`에 이름(40자)·추가·상태 목록·새로고침. 공통 폼/테이블/스낵바·오류 UI 재사용. 등록 UI는 생성 권한 보유자에게만 표시한다. 목록 조회 실패를 빈 목록으로 가장하지 않는다.
- `Console.tsx`: 콘텐츠 조회 권한이 있는 운영자도 운영 설정에서 분야를 조회할 수 있다. 금융 정책은 기존 settings.view/update 권한에 따라 별도로 노출하며 서버 권한을 확대하지 않았다. `Operators.tsx` 권한 설명도 활동 분야로 통일했다. 상태 변경·삭제 UI는 이번 범위 밖.
- 검증(07:24~07:29 KST): 서버 빌드·관련32/32, 콘솔 타입·단위11/11, 최종 격리 빌드·전체 Playwright39/39(실API+대역 혼합) 통과. 새 분야 PC/390px 모바일 저장·긴 이름 줄바꿈·가로 넘침 없음, 부운영자 실제 세션으로 분야 조회200/추가403·금융 조회403 확인. screenshots/categories-desktop.png·categories-mobile.png 육안 확인. 기존 Brand img lint 경고1건.
- 최초 E2E37/39: 회원용 bootstrap을 콘솔 프록시에 요청한 테스트 경로404와 새 메뉴가 추가된 권한표 기대값 불일치. 회원 API를 격리 서버3013에서 검사하고 실제 부운영자 권한 검증을 보강해39/39. 최초 실패 원본도 증거에 보존. API 문서 response 키 오타의 최초 빌드 실패를 수정 후 빌드 통과.
- 원시 증거: `.local/creator-categories-20261031/`(명령·시각·exit·로그 SHA, baseline.json, verification.json). 서버 `tests/platform-admin-console.test.cjs` 추가2건 및 본 리포 `e2e/categories.spec.ts` 추가2건, `e2e/console.spec.ts` 권한 연동 근거.
- 배포/실베타 분야 추가/실베타 크리에이터 등록 미실행. TOTP 우회·재설정 없음. 운영 적용에는 서버·콘솔 동시 배포 후 정상 로그인으로 분야를 추가해야 한다.

## 2026-10-31 콘솔 QA 전체 재검증·운영 인증 차단 (qa-20261031-final, 미커밋·미배포)
- e2e/control-heights.spec.ts가 데스크톱 admin3/모바일 admin4 전용 시드 계정을 사용하도록 변경. 서버 tests/admin-console-server.cjs의 시드/정리와 짝. 기존 같은 이메일 로그인 제한 간섭을 제품 제한 완화 없이 제거.
- npm run check 타입·단위11/11, 전체 Playwright37/37 통과. 최초 공유E2EDB 충돌 실행을 보존·제외하고 서버 전체→콘솔 전체 순차 재실행. 운영 제품 코드 변경/배포 없음.
- 실제 콘솔 비밀번호 확인 뒤 TOTP 코드2회 거부, 반복 중지. 사용자 모바일 경로 https://admin.crefans.com/login → 로그인/2차 인증, 로그인 후 마이페이지 /console/me#totp 안내. 인증앱 표시명은 코드상 'crefans 콘솔:계정' 기준. 원인 미확정, 우회·해제·권한 확대 없음.
- 승인된 테스트 활동 분야 추가는 인증 미완료로 미실행. 서버 categories API/권한은 존재하나 현재 콘솔 소스에서 추가 UI를 확인하지 못했음. 실베타 크리에이터 등록 후속 QA 차단. npm audit --omit=dev 콘솔0건.
- front output/pdf/crefans-qa-20261031/에 시나리오별 PDF/HTML·추적표. 원시 증거 front .local/qa-20261031-final/ 에 시각/명령/종료코드/로그 SHA. 기존 변경 보존, commit/push 없음.

## 2026-10-31 오픈베타 역할별 QA 실행 (runId qa-20261030-2351, 코드 변경 없음)
- 보고서: `crefans_front/.local/qa-20261030-2351/report.html`. 콘솔 단위 11/11, E2E 36/37. 실패 1건 `e2e/control-heights.spec.ts` 1280px는 다른 스펙과 같은 관리자 이메일로 로그인해 주소별 로그인 제한에 걸림(단독 2/2 PASS, QA-D05) — 전용 시드 관리자 필요.

## 2026-10-30 회원 즉시 삭제 화면 (운영 배포 member-erase-20261030, 커밋 완료·푸시 안 함)
- 회원·크리에이터 표에 SUPER_ADMIN에게만 '삭제' 열. `Moderation.tsx MemberErase`: TypedConfirmDialog로 회원 이메일을 그대로 입력해야 버튼이 켜지고, 삭제 사유(내부) 필수. 파기된 회원은 '삭제됨', 탈퇴 후 대기 중이면 '탈퇴 · 파기 대기'. 이력 라벨 member.erased='회원 삭제'.
- 서버 규칙(남은 거래 거부·즉시 파기)은 server PROGRESS 같은 날짜 항목.
- 검증: `npx playwright test e2e/member-erase.spec.ts e2e/moderation.spec.ts` 6/6 (API 대역), tsc·lint 통과(기존 img 경고 1건).

- 배포(2026-10-30 KST): `crefans_front/.local/member-erase-deploy-20261030/` build→capture_before→ship 모두 exit 0, 마이그레이션 없음, 프론트 소스는 totp-pilot과 동일. 배포 후 health·admin login·feed 200, 비로그인 POST /admin/members/x/erase 401. 이미지 정리 로컬·운영 각각 보존9·삭제4·오류0.
## 2026-10-30 /pilot-work K2~K14 합의·반영 (운영 배포 totp-pilot-20261030 + 가이드, 커밋 완료·푸시 안 함)
- 결정: 운영자 TOTP 즉시(미등록 7일 유예) / 세금 문구 중립("세금 처리 방식(원천징수 여부 포함)은 정식 정산 전에 안내합니다.") / 콩 10% 공제·만료 소멸은 현행 유지 / 처리방침 개정은 약관 초안에 묶음 / 탈퇴자 문의 3년 보존·DM 상대방 쪽 보존 / 콩 미수금만 콩 출금 차단 / 백업 최대 7일 / 탈퇴 시 충전콩은 지갑 환불 안내(프로모션콩 소멸) / 멤버십은 중개 구조 유지+고지 보강 / 다음: 요청량 제한 → 옛 경로 리다이렉트 → 덤프 정리 자동화·배포 전 테스트.
- 반영: server TOTP(`admin-totp-core.ts`·`admin-totp.ts`, 마이그레이션 `20261030230000_admin_totp`, 로그인 2단계·복구코드·재사용 거부·5분 5회 제한·유예 후 self 경로만), 콩 미수금만 콩 출금 차단, 탈퇴 시 콩 버킷별 안내, 파기(DM 보존·문의 3년 후 삭제·CI 해시 삭제). admin TOTP 화면(로그인 2단계·등록·복구코드·유예 배너·403 이동). front 탈퇴 창(크리에이터 조건은 크리에이터에게만, 충전 내역 환불 링크), 콩 미수금 시 출금 버튼 비활성, 세금 문구. guide 콩 환불·유효기간, 미수금·탈퇴 전 출금, 저작권 수령인(전화·주소)·임시조치 안내, 세금 문구, 소개서 PDF 재생성. 덤프 정리 스크립트 `crefans_front/infra/platform/backup-retention.py`(운영 계획 실행: 21개 142MB 모두 7일 이내 → 삭제 0). 런북 백업 리전 서울. 약관 초안 13~18번·법령 원문 확인 절.
- 법령 원문(첨부 다운로드·추출, 2026-10-30): 표준약관 제3조제4항 7일/불리 30일, 소분기준 별표Ⅱ에 충전 캐시 환급 공제 근거 없음(10%는 구독 해지), 신유형 상품권 표준약관 제5·7·8조(90/95%·5년), 시행령 별표(유료 판매 주목적 제외 가능), 통신판매업 면제 50회 미만·간이과세자.
- 검증(2026-10-30 KST): server 관련 10파일 전부 통과(admin-totp 3·beans 30·pilot-followups 4·openapi 11·admin-operators 7·admin-console 12·auth-hardening 4·moderation 7·finance 9·beta-policy 11·jobs 2), 대조 TOTP 3종·미수금/탈퇴/파기 3종 실패 확인. front check 419/419(탈퇴 창 대조), e2e 15/15. admin npm test 11/11, e2e 25/25(에이전트 대조 8종). 문서검사 PASS, 가이드 격리 빌드·check 통과.
- 배포: API/worker/admin/front(마이그레이션 admin_totp 적용, DB·proxy 보존), 가이드 정적(44파일 SHA 일치). 운영 확인: health 200, 콘솔 로그인 200, 비로그인 TOTP 등록 401. 이미지 정리 각 3개.
- 커밋: front 8·server 8·admin 3 커밋(파일 단위 목적별), 가이드 `git init`(main) 첫 커밋. 현재 브랜치 이름(feat/iphone-input-zoom 등)은 내용과 다름 — 정리 미결. 푸시 안 함. 커밋 제외: front 루트 스크린샷·prod.json·output/pdf(QA 산출물).
- 미확인·남은 일: 실제 인증 앱으로 운영 콘솔 TOTP 등록(사용자 직접, 7일 유예), 실제 토스 부분취소·메일 발송, 덤프 정리의 정기 실행(다음 묶음), 원천징수 세무 확정.

## 2026-10-30 운영자 2차 인증(TOTP) 콘솔 화면 (미커밋·미배포, 서버는 기존 구현 사용)
- 로그인(`src/app/login/page.tsx`): 401 TOTP_REQUIRED면 이메일·비밀번호를 유지한 채 6자리 코드 단계(inputmode numeric·one-time-code·maxLength 6), "복구 코드 사용" 전환 시 recoveryCode로 재전송. TOTP_INVALID는 서버 문구, 429는 "인증 시도가 너무 많습니다…".
- 마이페이지 `#totp`(`src/components/console/Totp.tsx`, `Operators.tsx` MyPage): 미등록이면 안내+"등록 시작"→설정 키 4자 묶음+otpauth 주소 텍스트(외부 QR 서비스·QR 라이브러리 없음, node_modules에 QR 패키지 없음)→6자리 입력→복구 코드 8개 대화상자(복사·"보관했습니다" 체크 전 닫기 불가). 등록 후 "사용 중 · 남은 복구 코드 N개".
- 셸(`Console.tsx`): me.totp.enabled=false면 배너 "N일 안에 2차 인증을 등록해야 합니다"(KST 달력 일수, `src/lib/totp.ts`), 유예 경과 시 차단 문구. `api()`가 403 TOTP_ENROLLMENT_REQUIRED를 이벤트로 알리면 /console/me#totp로 이동+스낵바. 버그 수정: 401 TOTP_INVALID는 세션 갱신 후 재전송하지 않음(이전엔 틀린 코드가 2번 전송돼 시도 횟수 2배 소모).
- 검증(16:22 KST): tsc 0, next lint 0(기존 Brand.tsx img 경고 1), npm test 11/11(신규 totp 2·console-api 1), e2e totp 5/5(API 대역). 대조 8종(2단계 미표시·복구코드를 code로·닫기 체크 미강제·키 묶음 제거·배너 제거·KST 대신 경과시간·403 이벤트 제거·TOTP_INVALID 재시도) 모두 실패 확인 후 cmp·SHA-256 일치 복원. 전체 e2e 34/35: control-heights 데스크톱 1건이 같은 실행 안 console.spec 로그인 누적으로 서버 로그인 제한(admin-signin:이메일) 429 — 단독 재실행 2/2 통과, console.spec 12/12 통과(배너로 깨지는 기대 없음, 수정 안 함).
- 미검증: 실제 서버·실제 인증 앱과 연결한 등록/로그인(격리 서버 e2e 운영자는 미등록 상태), 운영 배포.

## 2026-10-30 콩 환불 동결 핫픽스 (운영 배포: refund-hotfix-20261030, 미커밋)
- 원인(오후 night-work 1순위, 격리 DB 재현): 우리 부분취소로 토스 상태가 PARTIAL_CANCELED/CANCELED가 되면 `beans.service.ts` applyProvider가 무조건 freezeCharge → 충전 disputed·후원받은 lot 동결·미수금.
- 수정(server `src/platform/beans.service.ts`): 취소액(totalAmount−balanceAmount) ≤ refunded_amount+처리 중 환불액이면 정상, 넘을 때만 동결. 결과 불명 환불 대사(tick `beans-refund`, `reconcileRefund`: PG 기록에 취소가 있으면 완료, 없으면 같은 멱등키 `bean-refund-${id}`로 재요청). 완료·복원은 bean_refunds 행 FOR UPDATE 후 processing 재확인(동시 처리 1회). 같은 requestId 재요청이 failed면 409 BEAN_REFUND_FAILED. 환불은 판매 승인과 분리(`keyEnvironment`). front: `beanRefundOutcome`(lib/crefans/bean-refund.ts)으로 done만 "환불했어요", processing은 "확인하고 있어요", 확정 거절 시 새 requestId. admin Beans.tsx: 처리 중 표시·확정 거절 시 새 requestId.
- 검증(14:52 KST): server platform-beans 28/28(2회), 신규 3테스트(모니터 정상 유지·외부 취소는 동결 / 대사 완료·재요청·동시 2회 1회 반영·거절 후 409 / 판매 승인 off에도 환불). 대조 4종(옛 판정·재확인 제거·판매 승인 의존·failed 재요청) 모두 실패 확인 후 원복. front check 418/418(대조 1종), e2e 14/14. admin npm test 8/8, e2e 21/21(신규 1, 대조 2종).
- 배포(14:5x KST): API/worker/admin/front, 마이그레이션 없음, DB·proxy 보존. 운영 확인: health 200, 비로그인 refund-quote 401, 베타 목업 환불 흐름 정상·오류 0. 이미지 정리 로컬·운영 각 3개.
- 미확인: 실제 토스 부분취소. 이미 동결된 충전 여부는 사용자 결정(2026-10-30 "안해도됨")으로 운영 DB를 조회하지 않음 — 베타 테스트 결제라 환불 사용자가 없다고 판단. 동결 문의가 오면 수동 복구.

## 2026-10-30 오후 night-work 조사 문서 (문서만, 코드 변경 없음)
- 위치: `crefans_front/.local/night-work/2026-10-30-1414.md` (14:14~14:32, 결정 질문 K1~K14).
- 상위: ① 정상 콩 환불 뒤 PG 감시가 충전을 차지백으로 동결(pilot-followups 회귀, 재현) ② 안전성 확보조치 유예 조항 10/31 시행 — 운영자 2차 인증 없음 ③ 콩 환불 processing 대사 없음·프론트/콘솔이 실패를 완료로 안내 ④ 운영 코드 미커밋·가이드 git 없음 ⑤ 운영 IP 요청량 제한 없음 ⑥ 원천징수 의무 가능성 vs 세금 문구.

## 2026-10-30 당사자 공개 사유·콩 운영자 환불·미수금 콘솔 (운영 배포 pilot-followups-20261030, 미커밋)
- 배포(2026-10-30 KST 사용자 "배포"): API/worker/admin/front `pilot-followups-20261030`, 마이그레이션 `20261030200000_pilot_followups` 운영 적용(배포 스크립트가 직전 mysqldump 백업), DB·proxy 컨테이너 보존. 폴더 `crefans_front/.local/pilot-followups-deploy-20261030/`(server 15·admin 4·front 18 파일). 운영 확인: 비로그인 refund-quote·admin receivables 401, health 200, 베타 목업 충전 내역 환불 신청 버튼 10·대화상자, 충전 화면 10%·5년 안내, 콘솔 로그인 안내 문구 없음, 페이지 오류 0. 이미지 정리 로컬·운영 완료. 미확인: 운영 worker의 새 작업(member-notices·bean-expiry·receivables) 실행 결과(운영 DB/로그 읽기는 권한 정책상 하지 않음), 실제 토스 부분취소·메일 발송.
- 로그인 화면의 "운영자 전용 계정으로 로그인합니다. 크레팬스 팬·크리에이터 계정으로는 로그인할 수 없습니다." 문구 제거(사용자 요청 2026-10-30, `src/app/login/page.tsx`). tsc 통과, console e2e 12/12.
- 조치 공개 사유(D11): 게시물 숨김/해제·회원 제한/해제 대화상자에 필수 "당사자에게 보일 사유"(≤500, 앱 알림·이메일 전달) 추가, "조치 사유"는 내부 기록용. 이력 표에 내부 사유/당사자 안내 사유 분리. 신고 행 "댓글 숨기고 처리 완료"는 행의 당사자 사유 입력이 있어야 켜지고 {hidden,reason:처리 메모,publicReason} 전송. 근거: `src/components/console/Moderation.tsx`, `Console.tsx`(ReportAction), 서버 `src/platform/moderation.ts`.
- 콩 환불: 충전 표 결제 완료 행 "환불"(beans.update만) → 사유(≤200)·"회사 귀책(7일 이후 10% 공제 면제)" 체크 → 확인 → POST admin/beans/charges/:id/refund {requestId(대화상자당 1개, 재시도 시 재사용),waived,reason} → 스낵바에 수량·환불액·공제·면제 표시 후 재조회. PAYMENT_UNCERTAIN은 같은 창 재시도 안내. 미수금: GET admin/beans/receivables 표(크리에이터 ID·종류·출처 ID·금액·발생일), 콩 미수금만 정산 메모+"정산 완료"(beans.update), 멤버십은 "자동 차감". 근거: `src/components/console/Beans.tsx`, 서버 `beans.service.ts`(refundCharge·receivables·settleReceivable).
- 검증(2026-10-30 12:49 KST, 서버 대역/격리 서버): tsc 0, next lint 0(기존 Brand.tsx img 경고 1), npm test 8/8, Playwright moderation 4·comment-reports 1·bean-refunds 3(신규)·console 12 = 20/20. 대조 12종(공개 사유 누락 본문·버튼 활성·이력 열, 댓글 본문·버튼, 환불 waived 누락·전체 행 버튼·권한 무시·재조회 누락, 멤버십 정산 버튼·정산 메모 누락) 모두 실패 확인 후 원본과 cmp 일치로 복원.
- 미검증: 실제 서버와 연결한 환불·정산(토스 부분취소 포함), 운영 배포.

## 2026-10-30 /pilot-work 정책 동기화 (운영 배포: pilot-sync-20261030 + 가이드 pilot-sync-20261030, 미커밋)
- 조사: 읽기 전용 3갈래(콩·정산/세무/약관·댓글/알림). 주의: 조사 지시 오류로 나온 "후원받은 프로모션콩 출금 불가"는 오탐 — 10/26 승인대로 후원받은 프로모션콩은 출금 가능(회사 부담), 운영자 직접 지급분만 불가. 상호 '좋아하는일해야지'도 정상.
- 합의(사용자 클릭): ① 약관·운영정책·처리방침은 한 번에 새 버전 초안만(`crefans_server/docs/terms-draft-20261030.md`, 운영 미반영, 시행 전 개발 표시) ② 세금 문구 = "크레팬스는 정산 금액에서 세금을 떼지 않으며, 소득 신고·납부는 크리에이터 본인이 합니다." ③ 후원받은 콩(일반·프로모션) 보류 = 후원 시점+7일 ④ 댓글·알림 안내 전부 ⑤ 권리침해·불법촬영물·저작권 신고 접수 = 대표 박경호·khpark@crefans.com ⑥ 서버·프론트·콘솔 배포+가이드 반영.
- 반영: server `beanPolicy.tipHoldDays=7`, `beans.service.ts` tip lot release_at=후원+7일(이전엔 충전 lot 상속, 후원 프로모션콩 즉시 출금 가능했음). 세금 문구: front support.ts·creator-payout-policy.ts·ServiceGuidePage.tsx, guide payouts·payout-setup·income-scenarios·service-introduction.mdx, 소개서 HTML+PDF 재생성(13쪽 경계검사). 보류 문구: 스튜디오 출금 안내·가이드·소개서·콘솔 초대 툴팁·platform-api.md·admin README. 댓글·알림: 알림 탭 고정 목록 멤버십·댓글·메시지·새 게시물, 알림 설정 안내, FAQ 4문항, 서비스 안내, 가이드 4문서(게시물·메시지/알림·커뮤니티·고객센터), types·preview-pages 태그 10명.
- 검증(2026-10-30 KST): server platform-beans 22/22(신규 "후원 후 7일" 테스트; 기존 지급 테스트는 7일 경과 헬퍼), 대조(옛 상속 규칙으로 되돌리면 신규 테스트 실패) 확인. front check 406/406, e2e comment-social·comment-edit-delete·beans·promotion-payout 21/21, 알림 탭 대조 실패 확인. admin tsc·invites e2e 3/3. 문서검사 PASS(초안 manifest 등록). 가이드 격리 빌드(Node 22.23.4)·check:guides 0, 결과물에 '원천징수' 없음.
- 배포: API/worker/admin/front pilot-sync-20261030(마이그레이션 없음, DB·proxy 보존), 가이드 정적 102파일(8페이지·PDF·검색색인 변경, 44파일 SHA 일치, 6컨테이너·Caddy 불변, 원복 guide-before-pilot-sync-20261030). 운영 확인: 알림 탭 4종, FAQ 댓글·차단·세금 새 문구(원천징수 없음), 스튜디오 "후원 후 7일 보류", 가이드 payouts 새 문구, health 200. 가이드 capture_before의 이전 릴리스 경로를 bean-wording으로 고친 뒤 실행(첫 시도는 사전검사에서 중단, 변경 없음).
- 미결(약관 초안 시행 전 개발): 콩 환불·유효기간·만료 안내, 지급 후 미수금, 조치 알림·공개 사유, 크리에이터 탈퇴 조건, 메시지·문의·CI 해시 파기, 등급 변경, 통신판매업 신고 후 번호 표시. 지급자 원천징수 의무는 세무사 확인 전 미확정. 댓글 요청량 제한(분당5·시간당60)은 미구현. service-hierarchy.md(사용자 원문 계층도)의 알림 분류는 손대지 않음.

## 2026-10-30 D9 댓글 묶음 + 답글의 답글 — 운영 배포 완료 comment-social-20261030 (미커밋)
- 배포(2026-10-30 10:42 KST): API/worker/admin/front `comment-social-20261030`, 마이그레이션 없음("No pending migrations"), DB·proxy 보존. 폴더 `crefans_front/.local/comment-social-deploy-20261030/`(source-delta: server 6·admin 1·front 10 파일, next-env.d.ts는 e2e 생성물이라 제외). 운영 확인: 비로그인 mention-candidates·reports·admin 댓글 숨김 401, health 200, 베타 /preview/post/morning 태그 링크 21·댓글 신고 버튼 8·답글의 답글 버튼 3·"@하" 태그 후보 4·페이지 오류 0(live-preview.png). 이미지 정리 로컬·운영 각 3개 삭제·오류 0. 실회원 계정 실사용은 미확인.
- 차단: 게시물 작성자가 차단한 회원은 새 댓글·답글 403 COMMENT_BLOCKED, 기존 댓글은 유지.
- 알림(type comment, 목록 분류 '댓글'): 댓글→게시물 작성자, 답글→원 댓글 작성자(스튜디오 답글 포함), 태그→태그된 사람. 1인 1건, 작성자 본인·차단 관계 제외. bootstrap 알림 type은 한글 분류명으로 변환(subscription→멤버십, message→메시지, content→새 게시물, comment→댓글) — 이전엔 영어 값이 칩으로 보였음.
- 멘션: 서버가 본문 "@이름"에서 판별(게시물 작성자 페이지 이름·닉네임 + 보이는 댓글 작성자, 같은 이름 2명 이상·본인 제외, 최대 10). 수정 시 재판별. GET /posts/:id/mention-candidates({name,image}, 열람 기록 없음). 프론트: "@" 입력 시 목록(↑↓·Enter/Tab·Esc, 모바일은 입력창 위), 본문 안 파란 링크(/creator/:id). 팬 화면 칩 목록 대신 본문 표시(스튜디오 칩은 그대로).
- 댓글 신고: POST /reports kind=COMMENT, 댓글 행 "신고" + 사유 대화상자. 콘솔 신고 목록에 댓글 내용, "댓글 숨기고 처리 완료". POST/GET /admin/comments/:id/moderation(숨김 시 목록 제외·댓글 수 감소).
- 결정(D9): 해지 회원 자기 댓글 삭제는 선택 안 됨(현행 유지).
- 검증(2026-10-30 10:25 KST): server tests/platform-comment-social 6/6, moderation 7/7, studio-replies 5/5, beta-policy 11/11, openapi 11/11(158 경로). 대조 5종(차단·작성자 제외·동명 태그·숨김 신고·스튜디오 알림) 모두 실패 확인 후 원복. front check 406/406, e2e comment-social 4 + comment-edit-delete 4, 대조 4종(링크·신고 버튼·모바일 위치·Enter 선택) 실패 확인. admin e2e 7/7(신고 숨김 대조 1종 실패 확인), typecheck·lint·npm test 8/8. docs check PASS.
- 미검증: 실제 iPhone 한글 IME에서의 "@" 목록 동작(Playwright는 IME 조합 미재현), 운영 DB 반영.
- 근거: server `src/platform/service.ts`(addComment·resolveMentions·mentionCandidates·report), `moderation.ts`(moderateComment), `studio.service.ts`(createReply 알림); front `components/crefans/CommentMention.tsx`, `SocialPages.tsx`, `CommentComposer.tsx`; admin `src/components/console/Console.tsx`.

## 2026-10-30 night-work 조사 문서 (문서만, 코드 변경 없음)
- 위치: `crefans_front/.local/night-work/2026-10-30-0714.md` (07:14~07:48, 주제 39, 결정 질문 D1~D11).
- 상위: 서버 밖 DB 백업 없음 / 멤버십 PG 입금 대사 화면 없음(공개 후 수익이 출금 가능으로 안 넘어감) / 불법촬영물·권리침해·저작권 수령인 절차 없음 / 지급 후 환불 회수 장치 없음·후원 콩이 충전일 보류 승계 / 원천징수·통신판매업 미비 / 콩 실판매 전 약관·고지·환불·잔액 집계 필요 / 운영자 2차 인증·내부 관리계획 없음 / 크리에이터 탈퇴·파기 범위 / 댓글 차단·신고·열람기록·알림 / 옛 화면 경로 노출.

## 2026-10-30 이용 제한·해제·게시물 숨김 알림을 서비스 앱 스낵바로 (운영 배포: comment-edit-20261030, 미커밋)
- 운영 배포(2026-10-30 06:55 KST, comment-edit-20261030): API·worker·콘솔·프론트 교체, 마이그레이션 20261030140000_comment_edited 적용(로그 확인), DB 백업 /opt/crefans-backup-comment-edit-20261030. 확인: 로그인 없는 댓글 DELETE 401, beta /preview/post/morning에서 이탤릭 삭제 표시·수정됨·수정/삭제 버튼, 콘솔 CSS에 새 스낵바. 이미지 정리 로컬·운영 각 3개 삭제·오류 0. 근거 front `.local/comment-edit-deploy-20261030/`. 실회원 계정으로 댓글 수정·삭제는 아직 직접 확인하지 않았다. 폰트 되돌리기 스크립트(rollback-font.sh)는 이전 콘솔(스낵바·로딩 규칙 이전)로 돌아간다.
- 사용자 지시: 이용 제한 및 해제 시 기존 스낵바(유저쪽 저장소 컴포넌트) 사용.
- `components/console/Snackbar.tsx`를 crefans_front `components/ui/Toast.tsx`와 같은 모양·동작으로 옮김(하단 가운데 어두운 바, ×, 4초 카운트다운 막대, popover 최상위 레이어, 등장/퇴장 애니메이션, 감소 모션). props가 같아 초대·광고상품 화면도 함께 바뀜. 메시지가 없으면 아무것도 그리지 않는다.
- `SnackbarProvider`(console/layout.tsx)와 `useSnackbar()` 추가. 이용 제한·해제와 게시물 숨김/해제는 콘솔 공용 스낵바로 띄워 목록 재조회로 행이 다시 그려져도 알림이 남는다.
- 함께 고침: e2e console.spec이 예전 PlexKR 폰트를 기대하던 것을 현재 Apple SD Gothic Neo로 갱신(10-29 폰트 전환 때 남은 것).
- 검증: typecheck·lint(에러 0)·npm test 8/8, e2e 전체 25 중 23 통과(실패 2: 폰트 기대값·control-heights) → 폰트 기대값 갱신 후 console.spec 단독 12/12, control-heights 단독 2/2(전체 실행 때만 1건 시간 초과, 이전부터 같음). moderation e2e에 제한 → 스낵바·카운트다운 확인 → 닫기 → 해제 → 스낵바 확인 추가. 대조: 제한 시 알림 호출 제거·카운트다운 막대 제거 각각 실패 확인.
- 같은 작업 트리에 /ux-spinner 변경(ConsoleData 로딩 규칙)도 미커밋으로 있다.

## 2026-10-30 가입 전 개발 2~4(미검수 목록·신고 사유·탈퇴 후 파기) + 멤버십 콩 환산 철회 (운영 배포)

- 배포 완료(사용자 "배포", 2026-10-30): `signup-prep-20261030` API·worker·admin·front. DB 백업 후 migration 4개(report_privacy_reason, post_review, member_purge, backfill_withdrawn) 적용. 운영 확인: 6컨테이너, 처리방침 2026-10-30.1·30일 파기 문구(beta·crefans.com), 프론트 빌드 '콩 상당' 0건·'개인정보 노출' 포함, 검수 API 비인증 차단. 폰트만 되돌리기 `sudo bash /opt/crefans-backup-signup-prep-20261030/rollback-font.sh`(대기 crefans-admin:signup-prep-plex-20261030). 기존 탈퇴자 30일 파기 기산일 = 이번 배포 시각. 증거 front `.local/signup-prep-deploy-20261030/`.

- 미검수 목록(사용자 선택: 바로 공개+사후 숨김): migration `20261030090000_post_review` postings.reviewed_at/reviewed_by·인덱스. `POST /admin/posts/:id/review`(content.update), `GET /admin/posts?review=pending`(공개·미삭제·미숨김·미검수). 작성자 저장 시 reviewed_at 초기화(`studio.service.ts`), 숨김도 검수로 기록. 콘솔 콘텐츠 '검수 상태' 필터·'검수 완료' 버튼. 기존 게시물은 모두 미검수로 시작.
- 신고 사유(사용자 선택: 기본 6개): migration `20261029190000_report_privacy_reason`(enum PRIVACY 추가). `POST /reports` reason 검증(INAPPROPRIATE·COPYRIGHT·SPAM·HARASSMENT·PRIVACY·OTHER, 생략 시 OTHER, 잘못된 값 400). 프론트 신고 창 라디오 6개(선택 전 신고 버튼 비활성, `lib/crefans/report-reasons.ts`), 콘솔 신고 목록 한글 사유.
- 탈퇴 후 파기(사용자 선택: 게시물 삭제·댓글 익명화·30일 유예): migration `20261030100000_member_purge` members.withdrawn_at/purged_at. 탈퇴 시 withdrawn_at 기록·결제 카드 빌링키 즉시 해지 대상(기존 retryBilling). 잡 `member-purge`(`member-purge.ts`, 50건씩): 30일 경과 시 게시물 삭제, 회원 이메일·실명·닉네임('탈퇴한 사용자')·전화·사진·비밀번호·본인확인 해시·로그인 ID 제거, 크리에이터 프로필·핸들, 사용자 소개, 정산 계좌번호·예금주, 출금 PIN, 본인확인 실명, 가입 인증 기록 정리, 감사 로그. 댓글은 원문 유지·표시 익명화(기존). 주문·구독·출금·동의 기록은 회원 ID로 보존. 미디어 원본 삭제는 기존 MEDIA_DELETE 설정 따름(미연결). 이 기능 이전 탈퇴자(withdrawn_at 없음)는 자동 파기 대상 아님 — 처리 방법 결정 필요.
- 처리방침 7조를 실제 파기 절차로 갱신(30일 유예·파기 항목·게시물 삭제·댓글 익명 표시·첨부 원본 삭제 시점 별도), 문서 버전 2026-10-30.1. blocker '탈퇴·보유기간·실제 파기 절차 보완'은 사업자 확인 전까지 유지.
- 사용자 지시로 '미구독 게시물 콩 참고 환산'(bean-notice-20261029로 운영 배포됨) 철회: PostMembershipNotice·membership-plans·bean-pricing·테스트를 커밋 상태(환산 이전)로 복원, CSS lockedMembershipPrice 제거, 전 저장소 '콩 상당/참고 환산' 0건. 대신 게시물 머리 둘째 줄에 `시각 · 멤버십 전용 · 월 ₩가격`(볼 수 있는 판매 중 최저가, 여러 개면 '부터'). AGENTS에 콩 환산 금지 규칙 추가.
- 검증: server `platform-moderation` 6/6(검수 큐·작성자 수정 복귀·숨김=검수, 신고 사유, 30일 유예·파기 항목·댓글 익명 표시·1회 실행), 대조(수정 시 미검수 복귀 제거·유예 0일 각각 실패), legal 9/9, openapi 11/11(153경로), auth·admin-console·beans·security·signup-invites·studio-replies·finance·billing·payment-lifecycle 통과. admin typecheck·lint 오류 0·e2e moderation 4/4+control-heights 2/2. front check 399+social 29(머리줄 가격 신규).

## 2026-10-29 관리자 게시물 숨김·회원 이용 제한 (가입 전 개발 1/4, 운영 배포)

- 배포 완료(사용자 "지금 배포"): `moderation-20261029` API·worker·admin·front, DB 백업 후 migration `20261029180000_moderation` 적용. 첫 빌드에서 콘솔 린트(no-explicit-any) 실패 → 타입 지정 후 콘솔만 재빌드. 서버는 빌드 시점 사본 기준(이후 작업본의 신고 사유 변경은 제외). 운영 확인: 6컨테이너 정상, 조치 API 비로그인 401, 콘솔 번들에 운영 조치·이용 제한·조치 사유·애플 고딕 포함, 피드 200. 폰트만 되돌리기: `sudo bash /opt/crefans-backup-moderation-20261029/rollback-font.sh`(대기 이미지 crefans-admin:moderation-plex-20261029 보존). 증거 front `.local/moderation-deploy-20261029/`.

- 약관 8조가 약속한 "게시물 비공개·계정 제한"이 없던 문제(가입 미시행 점검) 해결. migration `20261029180000_moderation`: postings.hidden_at/hidden_reason/hidden_by, members.suspended_at/suspended_until/suspension_reason, append-only `moderation_actions`(대상·조치·사유·기간·처리자·일시).
- 서버 `src/platform/moderation.ts`(API 4개, content.update / members.update, 사유 필수, 감사 로그), `suspension.ts`. 숨김: `service.access()`에서 작성자 외 차단 + 피드·프로필·상세·저장목록 쿼리 `hidden_at:null`, 미디어 제한 대상, 게시물 후원 차단, 스튜디오 목록 `hiddenByOperator`. 제한: 세션 즉시 삭제, 로그인은 비밀번호 일치 후 403 ACCOUNT_SUSPENDED("이용이 제한된 계정입니다(…까지). 문의: khpark@crefans.com"), 토큰 검증·갱신 거부, 기간 지나면 자동 해제. 게시물은 회원 제한과 별개로 숨김.
- 콘솔 `Moderation.tsx`: 콘텐츠 표 '운영 조치'(숨기기/해제·사유·이력), 회원 표 '이용 제한'(7일·30일·무기한·사유·이력). 조회 권한만 있으면 이력만. 권한표 설명 갱신. 프론트 스튜디오 게시물 목록에 '운영 정책에 따라 숨김'.
- 검증: server 신규 `tests/platform-moderation.test.cjs` 3/3, 대조(숨김 검사 제거·제한 검사 제거 각각 1건 실패, 복구 후 통과), 관련 auth 3·auth-hardening 4·admin-console 12·admin-operators 7·beans 21·signup-invites 6·legal 8·openapi 11(152경로)·security 18 통과. `platform.integration`·`platform-access.integration`(별도 서버 필요 fetch failed)·`local-members`(전용 _test DB 필요)는 이 환경에서 실행 불가로 미검증. admin typecheck, e2e moderation 3/3+control-heights 2/2(스크린샷 확인). front check 401/401(신규 숨김 표시 테스트).
- 미결: 신고 처리 화면에서 바로 숨기기 연결(현재 콘텐츠 표에서 별도), 이의제기 접수 경로, 정지 회원의 공개 프로필·게시물 노출 정책(현재 유지).

## 2026-10-29 콘솔 폰트 Apple SD Gothic Neo 임시 전환 (운영 배포, 즉시 되돌리기 가능)

- 사용자 요청: 운영 콘솔 폰트를 잠시 애플 고딕으로, 원하면 바로 이전 버전으로 돌릴 수 있게. `globals.css`에서 `--font-plex`(기존 IBM Plex Sans KR 스택)·`--font-apple`('Apple SD Gothic Neo','AppleGothic',…,'Malgun Gothic') 토큰을 두고 `--font:var(--font-apple)`. 코드로 되돌릴 때는 이 한 줄을 `var(--font-plex)`로.
- 배포 `crefans-admin:console-font-20261029`: 운영 중이던 terms-history 콘솔 소스에 폰트 토큰 한 곳만 바꿔 빌드(아래 미배포 툴팁 변경은 제외). .env ADMIN_IMAGE만 변경, API·front·DB 유지. 운영 CSS `--font:var(--font-apple)` 확인.
- 즉시 되돌리기: 툴팁 배포 이후에는 `/opt/crefans-backup-console-tooltips-20261029/rollback.sh`를 사용(아래 절). 이 배포 당시의 console-font rollback.sh는 툴팁 없는 terms-history 콘솔로 돌아감.
- 한계: Apple SD Gothic Neo는 macOS·iOS에만 있어 Windows는 맑은 고딕, Android는 시스템 글꼴로 표시. 로그인 후 화면 육안 확인은 미실시.

## 2026-10-29 초대 등록 입력란 정보 툴팁 (운영 배포)

- 배포 완료(사용자 "배포"): `crefans-admin:console-tooltips-20261029`(애플 고딕 유지). 운영 콘솔 console-font 소스에 툴팁 4파일만 덮음. 운영 번들에 툴팁 문구·필드 스타일·`--font:var(--font-apple)` 확인. 대기 이미지 `crefans-admin:console-tooltips-plex-20261029`(같은 소스, 이전 IBM Plex 폰트)를 운영 서버에 적재·보존.
- 폰트만 되돌리기(툴팁 유지, 이후 moderation 배포 전까지 유효): 운영 서버 `sudo bash /opt/crefans-backup-console-tooltips-20261029/rollback.sh` → ADMIN_IMAGE를 plex 대기 이미지로 바꾸고 콘솔만 재기동. 이전 console-font 배포의 rollback.sh는 툴팁 없는 콘솔로 돌아가므로 더 이상 쓰지 않음.

- 사용자 요청: 초대 등록 모달의 각 입력란 라벨 오른쪽에 정보 툴팁과 정확한 설명. 공용 `components/console/InfoTip.tsx`(useId로 고유 id, PC 마우스 올림·키보드 포커스·터치 탭으로 열림, 바깥 탭/Esc로 닫힘)로 교체하고 기존 금융 정책 안내도 같은 컴포넌트 사용. 툴팁 버튼이 `<label>` 안에 들어가 입력란 라벨을 빼앗지 않도록 `Field`(라벨+툴팁 행, htmlFor로 연결) 사용.
- 내용은 서버 규칙 기준: 이메일(초대 이메일만 인증 코드, 대소문자 무시, 등록 후 변경 불가, 가입 회원은 초대 불가), 메모(운영자 전용 100자, 검색), 멤버십 판매 수수료율(결제액×비율 원 미만 버림, 0~100% 소수 2자리, 비우면 금융 정책 값(현재 N), 신규 구독부터·갱신은 최초 조건), 정산 보류 기간(0~365일, 콩 후원 충전 7일 보류와 별개), 콩 출금 수수료율(콩 1개=100원, 원 미만 버림, 신청 시점), 최소 출금 금액(수수료 차감 전, 멤버십·콩 공통, 100원 단위 100원~1억 원). 수수료 설명 small 문구는 툴팁으로 이동.
- 권한 없을 때 fieldset 전체가 비활성화돼 툴팁도 못 열리던 문제 → 입력란만 개별 비활성화. 모바일 긴 라벨에서 툴팁이 창 밖으로 나가던 문제 → 필드 폭에 맞춰 아래로 표시.
- 검증: typecheck, e2e invites+control-heights 5/5(툴팁 6개, 각 내용·창 안 위치·다시 눌러 닫힘, 키보드 Tab 포커스로 열림), iPhone 13 에뮬레이션 탭 열림·창 안 표시 스크린샷 확인.

## 2026-10-29 크리에이터별 수수료·출금 조건 변경 이력 (운영 배포)

- 배포 완료(사용자 "배포", 2026-10-29): `terms-history-20261029` API·worker·admin. 기준 API invites-terms·admin control-height 소스에 server 4·admin 2파일만 덮음. DB 백업 후 migration `20261029150000_creator_term_changes` 적용(기존 개별 조건은 backfill 1행). front·DB·proxy 컨테이너 유지, .env API_IMAGE·ADMIN_IMAGE·runtime APP_RELEASE만 변경. 운영 확인: 6컨테이너 정상, 초대·회원 조건 API 비로그인 401, 콘솔 번들에 변경 이력·변경 사유·시스템 기본값·멤버십 판매 수수료율·터치 44px 포함. 로그인 후 실제 저장·이력 표시는 미확인(운영자 비밀번호 필요). 백업 `/opt/crefans-backup-terms-history-20261029`, 증거 front `.local/terms-history-deploy-20261029/`.

- 사용자 요청: 개인별 수수료 변경 이력을 쌓을 것. 운영 로그(감사)와 별도로 append-only 테이블 `creator_financial_term_changes`(member_id+version unique, 조건 4개, source admin/invite/backfill, changed_by 운영자 ID, reason, created_at) 추가. migration `20261029150000_creator_term_changes`가 이미 저장된 조건을 backfill 1행으로 옮김.
- 기록: 콘솔 변경(`saveMemberTerms`)마다 같은 트랜잭션에서 1행, 변경 사유 필수(최대 500자). 초대 조건으로 가입하면 source invite·사유 "초대 조건 적용". 값이 같으면 저장·이력 없음. 조회 `GET /admin/members/:id/terms`의 `history`(최신 100건, 운영자 이름 포함).
- 콘솔: 회원 조건 창에 변경 사유 입력(없으면 '조건 확인' 비활성), 확인 창에 사유 표시, 아래 '변경 이력' 표(일시·버전, 조건, 변경자·출처, 사유).
- 검증: server invites 6/6(사유 필수 400, 이력 2행 순서·출처·변경자 이름·이전 값, 무변경 저장 시 이력 미추가), openapi 11/11. backfill SQL을 e2e DB 합성 1행에 실행해 값·출처 확인 후 삭제. 대조: 이력 기록 제거 시 1건 실패, 복구 후 통과. admin typecheck·check 8/8, e2e invites+control-heights 5/5(조건 창 실제 서버 응답 포함). 로컬 개발 DB에 migration 적용.

## 2026-10-29 초대 등록·확인 창에 시스템 기본값 표시, 수수료 명칭 정리 (운영 배포)

- 운영 배포: 위 terms-history-20261029 릴리스에 포함.

- 사용자 요청(iPhone 화면 2장): 초대 등록·조건 확인 창에 현재 시스템 기본값이 보이지 않음. 서버 `/admin/invites` 응답에 `defaults`(플랫폼 수수료·보류일은 DB 금융 정책, 콩 수수료·최소 출금은 코드 기본값)를 추가하고, 콘솔 조건 영역에 "현재 시스템 기본값: …" 한 줄, 입력 안내 "비우면 기본 N", 확인 창 "기본 20% → 15.5%"로 표시. 기본값이 미설정이면 "기본값(미설정)".
- 용어: "멤버십 플랫폼 수수료율"이 크리에이터가 다른 멤버십을 살 때로 오해될 수 있어 "멤버십 판매 수수료율"로 바꾸고 "팬이 이 크리에이터의 멤버십을 결제할 때 플랫폼이 가져가는 비율" 설명 추가(회원 조건 창도 공통).
- 검증: server invites 6/6(defaults 포함)·openapi 11/11, admin typecheck, e2e invites+control-heights 5/5, iPhone 13 에뮬레이션 스크린샷 확인. 운영 기본값 실제 수치는 운영 DB 조회 권한이 막혀 확인하지 못함(화면은 서버 값을 그대로 표시).

## 2026-10-29 모바일(터치) 입력란·버튼 높이 불일치 수정 (운영 배포)

- 운영 배포: 위 terms-history-20261029 릴리스에 포함.

- 사용자 제보: 회원·크리에이터, 초대 회원, 광고상품 상단 입력줄 버튼 높이가 다름(모바일). 원인: 터치 기기에서 입력 글자를 16px로 올리는 규칙(iPhone 자동 확대 방지) 때문에 입력란이 44px, 같은 줄 버튼은 표준 40px. 이전 측정은 데스크톱 Chromium(터치 아님)만 해서 놓침.
- 수정: `globals.css`의 `@media (hover: none) and (pointer: coarse)`에서 `--control-h:44px`(Apple 최소 터치 크기와 같음). PC는 40px 그대로.
- 검증: iPhone 13 WebKit 에뮬레이션에서 회원 입력 44↔검색 44, 광고 선택 44↔등록 44, 초대 선택·검색·버튼 모두 44 확인(스크린샷). `e2e/control-heights.spec.ts` 390px 실행을 터치 기기(isMobile·hasTouch)로 바꿔 상시 검사, 1280·390 모두 통과. 대조: 터치 규칙 제거 시 390px 실패(회원 44↔40, 광고 44↔40), 복구 후 통과. `npm run check` 8/8.

## 2026-10-29 같은 행 입력란·버튼 높이 표준화 (운영 배포)

- 배포 완료(사용자 "배포"): 콘솔만 `crefans-admin:control-height-20261029`, 기준 invites-terms 소스에 globals.css 1파일만 덮음. .env ADMIN_IMAGE만 변경, API·worker·front·DB·proxy 유지. 운영 CSS에 `--control-h:40px`·필터 버튼 규칙 포함 확인, 6컨테이너 정상. 이미지 보존 3개 정리. 증거 front `.local/control-height-deploy-20261029/`.
- 재발 방지: 배포 후 `osascript quit app "Docker"`가 두 번 연속 Docker를 반쯤 멈춘 상태로 남겨 다음 빌드가 걸림(운영 영향 없음). Docker 프로세스를 강제 종료 후 재시작해 해결. 이후 배포 끝에 Docker를 종료하지 말고 실행 상태로 둘 것.

- 사용자 요청: 대시보드·운영 관리 모든 메뉴에서 입력란과 같은 행 버튼의 세로 크기를 같게. `globals.css`에 `--control-h:40px` 토큰 추가, 입력/select/날짜 입력과 `.filters button`·`.actions:has(>input,>select) button`이 같은 높이를 사용. 표 안의 단독 버튼·페이지 이동·탭·기간 버튼은 그대로.
- 변경 전 측정(로컬 실서버+e2e DB): 대시보드 기준일↔조회/새로고침, 회원 검색↔검색, 초대 상태/검색↔검색/초대 등록, 광고 상품 상태↔광고상품 등록에서 입력 40px·버튼 37.5px 불일치.
- 검증: 신규 `e2e/control-heights.spec.ts`(대시보드·회원·초대·콘텐츠(신고 메모 행은 신고 1건 대역)·광고·초대/조건 창, 1280px·390px) 2/2. 대조: 새 규칙 제거 시 2/2 실패, 복구 후 통과. invites·advertising e2e 포함 7/7, `npm run check` 8/8. 같은 `.filters` 규칙이라 매출·운영 로그·설정 필터 행 버튼도 40px로 함께 맞춰짐(측정 대상 밖).

## 2026-10-29 초대 회원 메뉴 + 회원별 수수료·출금 조건 (운영 배포)

- 배포 완료(사용자 "배포해", 2026-10-29): `invites-terms-20261029` API·worker·admin·front 한 릴리스. 기준 소스 API/front invite-notice, admin advertising에 변경 파일만 덮음(server 14·admin 5·front 5). DB 백업 후 migration `20261029120000_signup_invites` 적용(운영 29개, 두 테이블 0행). DB·proxy 유지, .env 이미지 3키·runtime APP_RELEASE만 변경. 운영 확인: beta·crefans.com 비초대 가입 코드 403, `/admin/invites` 비로그인 401, 콘솔 /console/invites 200·번들에 초대 화면 포함. 운영 로그인 후 실제 초대 등록·조건 저장은 미확인(운영자 비밀번호 필요). 첫 빌드 시 로컬 Docker 멈춤 → 강제 재시작 후 빌드, 운영 영향 없음. 이미지 보존 3개(로컬·운영 각 3개 삭제). 백업 `/opt/crefans-backup-invites-terms-20261029`, 증거 front `.local/invites-terms-deploy-20261029/`.

- `/console/invites`(운영 관리 > 초대 회원): 상태(초대 중·가입 완료·취소됨)·검색, 초대 등록·메모/조건 수정·초대 취소. 개별 조건 4개(멤버십 수수료 %, 정산 보류일, 콩 출금 수수료 %, 최소 출금 금액 100원 단위), 비우면 플랫폼 기본값. 조건이 바뀌면 `TypedConfirmDialog`로 '정책 변경' 입력 후 저장(서버도 검사). 운영 설정 변경 권한이 없으면 조건 입력 잠금.
- 회원·크리에이터 표에 '수수료·출금 조건' 열(조건 보기 → 기본값 안내·변경). 편집은 members.update + settings.update.
- 권한표에 invites(조회·등록·수정·취소) 추가, members 설명 갱신. 컴포넌트 `src/components/console/Invites.tsx`.
- 검증: `npm run check`(typecheck + 8/8), Playwright `e2e/invites.spec.ts` 3/3(API 대역: 등록→확인문구→저장→취소, 권한 없을 때 잠금·확인문구 생략, 회원 조건 변경). 스크린샷 확인. 운영 DB·실서버 미사용.
- 미검증·남은 것: 실제 가입 완료까지의 E2E는 약관 미시행(POLICY_NOT_PUBLISHED)이라 불가 — 초대 소진은 함수 단위로 검증. 멤버십 상품 만들기 화면의 가격 안내(`membershipPriceHint`)는 아직 기본 20% 기준. 개별 조건은 크리에이터 약관 6조(기본 20%·7일·10만 원)와 다를 수 있어 별도 개별 합의서가 필요한지 사업자 결정 필요. 커밋·푸시 없음.

## 2026-10-29 보안·장애 대응 점검 (광고상품 배포 후, 개선 미적용)

- 인증/권한·금융/미디어·장애복구 AI 검토 3개를 통합하고 운영/AWS 읽기와 격리 검증을 수행. 보고서: `crefans_front/docs/security-review-20261029.md`, 증거: `crefans_front/docs/audit/security-review-20261029.json` 및 프론트 `.local/security-review-20261029/`. 실제 외부 감사/공인 인증 아님.
- P1: 지원 종료 Next14/패치 지연, 이메일 재인증 누락, 비밀번호 회수-로그인 경쟁, PG 조회 제한 오분류/외부 멤버십 취소 대사, 동일EBS 백업 의존, watchdog off/독립 감시 부재. 기타 PIN 콩승인 회수·배치 격리·Origin/비밀번호/세션·로그/미디어복원 보완을 기록. 실제 침해·이중 청구가 발생했다고 단정하지 않음.
- 검증: 서버 빌드0·격리 E2E/대역100통과·1skip·0실패, 신규 메모리 재현/실패 대조 주 담당 재실행0, 관리자43업무경로 권한 및 누락 대조. 운영 GET9/9, 실행소스/28migration 대조, AWS/호스트 설정 읽기. front audit7/server25 package 경고(exit1), admin/guide0(exit0); 도달 가능한 공격 수와 구분. 문서검사 명령·최종 결과는 위 증거 JSON의 documentationValidation 참조.
- 한계: 제품 보안 수정/운영 설정 변경·실제 로그인/외부 발송/금융/운영 공격·부하·복원은 미실행. Toss test, 베타·실은행/광고메일off 유지. 기존 미커밋 변경 보존, 커밋/푸시 없음. 다음: 보고서 P1 수정과 실패경로 회귀, 외부백업/복원·감시, RPO/RTO/보유정책 결정. Docker Desktop 종료 및 backend 없음 확인.

## 2026-10-29 광고상품·공통 UI 운영 배포 (advertising-20261029)

- 사용자 “운영배포후 보안 및 장애 대응 점검” 승인으로 front41·server8·admin7 파일만 직전 운영 소스에 반영. 새 DB 테이블 ad_products 1개, 총28 migration 해시 일치. 광고상품 등록/수정/노출·판매 개별 설정/소프트삭제 API·콘솔, 스튜디오 목록·목업 적용. 공통 하단 스낵바·모바일 갤러리 이미지 탭·포스팅 후원 플랫 동전도 함께 반영. 무관한 PSD/Finder 파일 제외.
- 이전 로컬 검증 소스 해시 일치 확인, amd64 API/콘솔/프론트 순차 빌드 통과. 내부 소스·콘솔 실행 산출물 대조 후 약799MB 직접 스트리밍. 설정/DB 백업→migrate deploy→API/worker→admin→front. DB/proxy 컨테이너와 나머지 환경설정 보존. 백업 /opt/crefans-backup-advertising-20261029.
- 운영검증: 6컨테이너 정상·재시작0, frontend669/API211/worker211 소스 해시 일치, HTTP10건(광고목록 비로그인401 포함). PC Chromium·iPhone WebKit 프론트18/18, 콘솔4/4 통과. 콘솔 및 서비스 쓰기는 브라우저 API대역으로 운영 DB에 저장하지 않음. 최초 콘솔 테스트 도구 중복 로드 실패는 콘솔 저장소 도구로 분리해 해결, 제품 코드 변경 없음.
- 이미지 계획 보고 후 로컬·운영 각각 최신9개 보존, 이전 faq-payout(front)/operators(api/admin)3개씩 일반 삭제. DB/볼륨/강제삭제 없음. Mac Docker Desktop 종료 확인. 기존 dirty 변경 보존, 커밋·푸시 없음.
- **실제 광고 구매·PG·자동 노출·매출 미구현이며 서비스 구매 비활성**. 결제수단·시작/연장 방식 사용자 선택 대기. 운영 비밀번호 로그인·실PG/송금/발송·실기기 미검증. guide 소개서 프레임 별도 미배포 변경은 이번에 포함하지 않음.
- 근거: front docs/audit/advertising-deployment-20261029.json 및 .local/advertising-deploy-20261029/. 후속 보안 점검 결과는 별도 최신 절과 보고서에 기록.

## 2026-10-29 광고상품 관리 콘솔 (상품 관리 완료·운영 미배포)

- `/console/advertising` 추가: 등록·수정, VAT 포함 금액/노출일수/순서/구매취소 안내, 스튜디오 노출과 판매 허용 각각 설정, 삭제 확인과 삭제 상품 조회. `advertising` 메뉴 권한을 운영자 편집과 내비게이션에 연결하고 서버에서도 강제. 삭제는 soft delete API이며 본문 저장 문구 대신 재사용 `Snackbar`로4초 하단 안내.
- 검증: `npm run check` typecheck+8/8. Chrome PC1280/WebKit iPhone390에서 등록→수정→판매만 끄기→삭제→삭제 목록 확인, 조회 전용 변경 버튼 미노출 4/4(API 대역). 실제 서버 권한/소프트 삭제/경쟁 처리 등은 server23/23 검사로 별도 검증. 모바일 가로 넘침 없음, 신규 폼 스크린샷 확인 후 기존 actions 규격으로 버튼 간격 보완. 검증용 .next-advertising과 자동 tsconfig 경로를 정리하고 기존 설정/미커밋 보존.
- 실제 광고 결제·구매 이력/매출·광고 자동 노출은 사용자 결제수단·시작 방식 선택을 기다리는 미구현 범위. 운영 계정 로그인/실PG/운영 DB 변경/배포·커밋·푸시 없음. `.local/advertising-20261029/` 및 front `docs/audit/advertising-20261029.json`에 증거.

## 미배포 개선 3건 운영 반영 (2026-10-29, 완료: studio-input-console-20261029)

- 사용자 “배포해” 승인에 따라 스튜디오 답글 작성자·수정·삭제, 터치 입력 최소16px·수동 확대 허용, 콘솔 마이페이지 맨 아래 로그아웃을 반영. 운영 기준 front faq-payout / API·admin admin-accounts 사본에 front11·server3·admin2 파일만 덮었고 그 외 제품 소스 변경 없음. 이전 절의 미배포 상태는 이번 배포로 해소.
- 검증: front check379/379, server build+답글·OpenAPI·운영자권한23/23, admin check8/8. amd64 3이미지 빌드·소스/레이어/라벨 대조, 콘솔 build-stage 소스59개와 실행 산출물122개 대조. 운영 front658·API/worker각208 소스 해시 일치. HTTP11건(9개200+신규답글 PUT/DELETE 비로그인401), 6컨테이너 정상·재시작0·DB/proxy ID 유지.
- 운영 브라우저: 목업 답글3조건(모카/하늘·모바일/PC) 작성자 사진·이름·인증·등록→수정→삭제·취소·팬 버튼 미노출 확인. 입력13화면×4조건=52조합, 모바일106개16px 이상·가로넘침 없음·PC 글자 유지. 실서비스 로그인/가입4조건도 정상(모바일16px/PC13px). 콘솔 PC/모바일 로그아웃 마지막 요소·24px 간격·1회 요청·로그인 이동 확인(API는 브라우저 대역).
- 운영 절차: capture→변경 파일만 사본 반영→preflight(약49.6GiB)→순차 빌드→소스 검증 후 약798MB 직접 스트리밍→DB/설정 백업→migrate deploy(27개·추가없음)→API/worker→admin→front→운영 검증. 백업 `/opt/crefans-backup-studio-input-console-20261029`. 베타/콩/실판매·송금·광고메일 플래그와 기존 migration 체크섬 유지, 배치 failures={}.
- 정리: 로컬·운영 계획을 먼저 보고하고 최신3개씩(총9개) 보존, messages-back(front)/payout-policy(api)/console-drawer(admin) 3개씩 일반 삭제. 로컬에서 목록에 있지만 태그로 조회하지 못하는 현상을 확인(이미지가 삭제된 것은 아니었음, 원인은 미확정)해 보존 도구에 정확한 ID·단일 태그·동일 저장소 digest·미사용 조건의 fallback 추가. 정상5조건과 사용중 보호 제거 대조 실패 확인. 강제삭제·볼륨삭제 없음. 최종 운영 여유 약34.2GiB. 정리 후 6컨테이너 동일·정상 재확인, 빌드용 Mac Docker Desktop 종료 완료.
- 최초 검사 실패/수정: Docker index ID와 플랫폼 manifest ID 직접 비교 실패는 빌드의 amd64 manifest·운영 tag ID·레이어·소스해시 일치 검사로 수정. React 자동생성 ID의 dev/prod 차이는 글자 비교에서 제외. 팬 프로필 모달의 옛 폭은 애니메이션 중 측정값이라 폭 동일 주장에서 제외하고 글자·넘침은 검증(다른12화면 폭 동일). 최초 실패 원본 보존. 전송 단계 분리 제안은 자동 승인 검토 거절되어 적용하지 않고 기존 ship→archive 필수 호출 유지. 제품 코드 재수정·재배포는 없었음.
- 경계: 실제 iPhone 키보드/핀치·운영 비밀번호 로그인·운영 회원 답글 쓰기는 미실행. 권한/저장 검증은 로컬 격리MySQL, 운영 콘솔 내부는 API대역이며 운영 실계정 종단 검증으로 간주하지 않음. 커밋/푸시 없음, 기존 변경 보존. 다음: 실기기 검수·별도 승인 시 운영 계정 실사용 확인.
- 증거: front `docs/audit/studio-input-console-deployment-20261029.json`, 상세 front `.local/studio-input-console-deploy-20261029/`. 공통 AGENTS 규약 유지, 보존 도구 fallback 경계만 추가. 문서 기록·검사 결과는 해당 폴더 docs-checks.json에 기록.

## 마이페이지 로그아웃 버튼 하단 이동 (2026-10-28, 운영 미배포)

- 요청: 운영 콘솔 마이페이지 맨 아래에 로그아웃 배치. `src/components/console/Operators.tsx`의 프로필 요약 카드에서 버튼을 제거하고 비밀번호 변경·내 권한 이후 마지막 요소로 이동. 기존 아이콘·문구·onLogout 처리 유지. `src/app/globals.css`에 상단24px 여백만 추가.
- 검증: `npm run typecheck` 종료0. Chromium1280/모바일 WebKit390에서 로그아웃1개·상단 카드 버튼없음·페이지 마지막 요소·위 간격24px·가로 넘침없음·페이지오류0. 클릭시 기존 POST `/api/v1/admin/auth/logout`1회와 `/login` 이동 확인(API는 브라우저 대역, 실제 운영 세션 로그아웃하지 않음).
- 브랜치 `feat/console-mypage-logout`, 기존 미커밋 작업 보존. 커밋·푸시·운영 배포 미실행. 다음: 운영 반영 요청 시 배포. 기준 커밋·파일해시·화면·검증은 `.local/mypage-logout-20261028/evidence.json`과 같은 폴더의 결과 참고.


## 아이폰 입력 자동 확대 대응 (2026-10-28, 운영 미배포)

- 원인: 팬·스튜디오 입력란 14px, 콘솔 입력란 13px. iPhone Safari의 기본 배율에서 16px 미만 입력 글자에 자동 확대가 발생한다. 웹 근거: [Telerik 공식 기술 문서](https://www.telerik.com/products/aspnet-ajax/documentation/knowledge-base/common-disable-autozoom-input-safari-iphone), 확인2026-10-28. 수동 확대 허용 근거: [W3C ACT viewport 규칙](https://www.w3.org/WAI/standards-guidelines/act/rules/b4f0c3/).
- 변경: front `app/globals.css`, admin `src/app/globals.css`에 `(hover:none) and (pointer:coarse)` 입력 최소 `max(16px,1em)` 적용. 컴포넌트 font 재정의보다 우선하게 하여 모달·검색·본문·PIN까지 공통 적용하고, 버튼/체크박스/라디오/파일/범위/색상/숨김 입력 제외. front `app/layout.tsx`의 maximumScale1·userScalablefalse 제거. 팬·목업·서비스·스튜디오·카탈로그는 같은 전역 규칙 사용. 가로 화면도 폭 대신 포인터 조건으로 적용.
- 검증: 변경 전 WebKit 모바일 입력 35개에서 16px 미만 탐지. 변경 후 WebKit390·844가로·1280 PC와 Chromium390에서 13화면/상태×4=52조합, 모바일106개 입력 전부16px 이상·가로 넘침 없음. PC 입력 글자 동일, 너비차1px 미만(모달 모션 측정 오차 최대 약0.2px). 팬 설정/스튜디오 답글/콘솔 정책 확인 모달 포함. 프론트 check379/379, 콘솔 check8/8·타입 검사 통과. 실서비스는 동일 전역 CSS를 사용하나 로그인 화면 별도 동작 검증은 아래 경계로 남김.
- 검증 경계: macOS Playwright의 모바일 WebKit/Chromium 에뮬레이션과 CSS 계산값 검증이다. 실제 iPhone의 네이티브 키보드·핀치 동작은 미검증. 콘솔 정책 화면은 브라우저 안에서만 API 대역을 사용했고 로그인/정책 저장/운영 데이터 변경 없음. 로컬 `/service/login`은 API 대역 주입 후에도 `불러오는 중…` 상태여서 해당 경로의 입력 실측은 미완료(목업 로그인·회원가입의 동일 표시 컴포넌트는 검증). 최종 PC 비교는 모달 애니메이션의 미세한 너비차를 구분하고 글자는 완전 일치·너비1px 미만 기준을 적용했다.
- `feat/iphone-input-zoom` 브랜치, 기존 미커밋 작업 보존. 운영 배포·커밋·푸시 미실행. 다음: 두 프론트 배포 후 실제 iPhone Safari에서 입력·키보드 닫기·가로 화면 확인. 증거 front `docs/audit/iphone-input-zoom-20261028.json`, 상세 측정/스크린샷/재실행 스크립트 front `.local/iphone-input-20261028/`; 콘솔 `.local/iphone-input-20261028/`에는 변경 전 사본과 기준 기록.


## 직접 입력 확인 모달 재사용 구조·을/를 조사 (2026-10-28, 운영 배포 완료: admin-accounts-20261028)

- 요청: "정책 변경를" → "정책 변경을", 직접 입력 확인 로직을 다른 중요 항목에도 재사용 가능하게, 을/를을 올바르게 표시.
- `components/console/TypedConfirm.tsx`: `ConfirmDialog`(배경·Esc·스크롤 잠금)와 `TypedConfirmDialog`(phrase 정확히 일치해야 실행 버튼 활성, 취소 기본 포커스, 자동수정 끔, 입력값을 onConfirm으로 전달)로 분리. 정책 변경은 이를 사용하도록 교체(입력 상태는 모달 내부로 이동).
- `lib/korean.ts`: 마지막 한글 음절 받침으로 을/를(및 이/가 등 쌍) 선택, 끝 공백·괄호 등은 건너뜀, 숫자는 한자어 읽기(일·이·삼…), 판단 불가(영문 등)는 '을(를)'로 둘 다 표시.
- 검증: typecheck, 단위 8/8(새 korean 3건: 받침/무받침 8단어, 숫자 6개, 영문·빈 값, 잘못된 조사 대조), E2E 14/14(모달 라벨 '계속하려면 정책 변경을 그대로 입력하세요' 검사 추가).

## 운영자 계정 분리 로그인 (2026-10-28, 운영 배포 완료)

- 로그인·세션 갱신·로그아웃을 `/api/v1/admin/auth/*`로 변경, 콘솔 API 허용 경로를 `/admin/*`만으로 제한, Next 리라이트에서 회원 `/auth/*` 제거. 로그인 화면 안내 "운영자 전용 계정, 팬·크리에이터 계정 불가".
- E2E 서버 시드: 운영자는 회원 행 없이 `admins`(비밀번호 해시)로만 생성. E2E 14/14(팬 계정 콘솔 로그인 실패·운영자 쿠키 미발급 확인 포함), typecheck·단위5.
- 운영 미배포. 서버 마이그레이션과 함께 배포해야 함.

## 운영자·메뉴 권한, 마이페이지, 정책 변경 확인 모달 (2026-10-28, 운영 배포 완료)

- 요청: 정책 변경 버튼 옆 ⓘ 툴팁("정책 변경 시 변경 확인 문구를 직접 타이핑해야 합니다.")과 실제 확인 문구 입력 모달, 페이지 제목 옆 로그아웃 제거, 드로워 하단 로그인 정보 제거 → 공통 헤더 오른쪽 기본 프사 → 마이페이지, 부운영자 생성과 메뉴별 입장·CRUD 권한 관리, 기존 운영자 정보(박경호·전화·최고관리자) 반영.
- 사용자 결정(2026-10-28): 부운영자는 콘솔에서 새 계정 생성(임시 비밀번호, 첫 로그인 변경), 금융 실행(출금 승인·지급·정책 변경)도 권한표로 위임 허용, 확인 문구 '정책 변경', 운영 배포까지.
- 콘솔: `Operators.tsx`(운영자·권한 화면, 권한표, 임시 비밀번호 1회 표시, 비밀번호 변경, 마이페이지). `Console.tsx` 메뉴·화면·버튼을 권한(`/admin/me` permissions)으로 표시, 운영자·권한 메뉴는 최고관리자만, 임시 비밀번호 상태면 변경 화면만. 헤더 프사(데스크톱 제목 줄·모바일 상단 바) → `/console/me`, 로그아웃은 마이페이지. 정책 변경은 ⓘ 툴팁 + 모달(변경 전후·사유, 취소 기본 포커스, Esc, 문구 정확히 일치해야 버튼 활성). 콩 화면 버튼도 권한 기준.
- 검증: typecheck·단위5, E2E 14/14(정책 모달·툴팁·API 우회 거부, 부운영자 생성→임시 비밀번호→강제 변경→권한 메뉴만 표시→매출·운영자 API 403→비활성화 후 401 포함). 로그인 횟수 제한(이메일당 10분10회)에 걸리지 않게 E2E 서버에 두 번째 최고관리자 시드. 화면 `test-results/operator-*.png`, `policy-confirm-dialog.png`.
- 운영 배포 `crefans-admin:operators-20261028`(API와 함께). 운영 콘솔 번들에 운영자 화면·툴팁 코드 포함 확인. 로그인 후 화면은 운영 계정 입력 금지로 운영에서 미확인(로컬 격리 검증만). 증거 front `.local/operators-deploy-20261028/`. commit/push 없음.
- 잔여: 부운영자 로그인 계정은 회원 테이블을 써서 팬 서비스 로그인도 가능(본인확인 없음, 팬 쪽 차단 미구현). 삭제 동작이 있는 메뉴는 현재 없어 삭제 열은 모두 '해당 없음'.

## 모바일 햄버거 메뉴 drawer (2026-10-28, 운영 배포 완료)

- 요청: 운영 콘솔도 크리에이터 스튜디오처럼 햄버거 메뉴 drawer로. 1079px 이하의 가로 스크롤 메뉴를 대체.
- 구현: `Console.tsx` 셸에 메뉴 열기/닫기 버튼(aria-expanded/controls), `#console-nav` drawer(메뉴 그룹 제목·관리자 정보·로그아웃 포함), 배경(backdrop). 경로 이동·Esc·배경 탭으로 닫고 열린 동안 본문 스크롤 잠금. 가로 메뉴용 활성 항목 스크롤 효과·navRef 제거. `ConsoleIcon`에 menu/close 아이콘. CSS: 데스크톱은 `.nav-drawer{display:contents}`로 기존 사이드바·접힘(rail) 유지, 모바일은 상단 56px 바 + 왼쪽 300px(최대 86vw) 고정 drawer, 슬라이드(감속 모션 설정 시 없음).
- 검증: 로컬 격리 E2E 390에서 drawer가 본문을 덮음·8개 메뉴·그룹 제목·로그아웃 표시, 배경/Esc/이동 시 닫힘·스크롤 잠금 해제, 1280 사이드바 240px·접힘 56px 유지, 접힘 상태에서도 모바일 drawer에 메뉴 이름 표시. 모바일 간격 재점검 신규 인접 0. 기존 E2E 중 가로 메뉴 전제 3건(작은 화면 이동, 다크 화면 로그아웃, 메뉴 스크롤 유지)을 drawer 기준으로 수정. typecheck·단위5, E2E 12/12(전체 실행 10 통과, 나머지 2건은 로그인 횟수 제한·슬라이드 대기 보정 후 재실행 통과). AGENTS 메뉴 셸 규약 갱신.
- 운영 배포 `crefans-admin:console-drawer-20261028`: 직전 운영 `console-spacing` 사본에 3파일(Console.tsx, ConsoleIcon.tsx, globals.css). 관리자 컨테이너만 교체. 운영 CSS·콘솔 JS 번들에 drawer 코드 포함, 로그인 화면 Chromium/WebKit 200·가로넘침 없음. 로그인 후 drawer 동작은 운영 계정 입력 금지로 운영에서 미확인(로컬 격리 검증만). 보존 단계로 로컬·운영 `crefans-admin:tip-attribution-20261026` 삭제(운영 여유 34.3GB). 빌드용 Docker는 종료. 증거 front `.local/console-drawer-deploy-20261028/`, 화면 `.local/console-spacing-20261028/drawer-*.png`. commit/push 없음.

## 콘솔 버튼 크기·간격 점검, 모바일 날짜 입력 (2026-10-28, 운영 배포 완료)

- 요청: 운영자 콘솔 버튼 크기·간격 점검, 특히 모바일에서 시작일/종료일 입력이 붙어 보이는 현상.
- 점검: `.local/console-spacing-20261028/audit.spec.ts`(E2E 격리 서버·합성 관리자로 8개 메뉴+매출 탭4·고객지원 탭2, Chromium 390/1280, WebKit 390/360). 표 셀 인접·세그먼트 버튼(탭 2px, 기간 4px)·접힌 일별 데이터(details)는 의도된 구조로 제외.
- 원인: 모바일 필터가 flex-wrap(gap10, 기본 130px)이라 시작일·종료일·조회가 한 줄에 몰림(Chromium 142px 입력 2개 + 버튼). iOS WebKit은 select가 기본 모양으로 줄어 바로 아래 입력과 붙고, date 입력 높이가 42~44px로 다른 입력(40)과 달랐다. 그 외 빈 목록→새 문서 버튼 0px, 정책 변경 버튼→변경 이력 제목 0px, 페이지 이동 버튼 28px.
- 수정(`src/app/globals.css` 끝에 추가만): 입력·select 높이40, select 공통 화살표(appearance:none), date 높이40·왼쪽 정렬. 600px 이하 날짜 필터는 2열 grid gap12, 조회(primary)·안내문은 한 줄 전체, 대시보드는 기준일+조회+새로고침 한 줄. 페이지 버튼32, `.empty/.table-wrap+button` 위12, `.editor+h3` 위24. 날짜가 없는 회원 검색 필터는 그대로.
- 검증: 수정 후 Chromium/WebKit 모든 화면 입력 높이40, 날짜 입력 간격12px(390: 16–189 / 201–374), 가로넘침 없음, 대상 0px 인접 해소. `npm run check` 타입·단위5 통과, E2E 12중 11 통과 후 실패1건(로그인 횟수 제한으로 로그인 화면 대기)은 단독 재실행 통과. 전후 화면·JSON `.local/console-spacing-20261028/`. 실제 iPhone 기기 확인은 하지 않음. commit/push 없음.
- 운영 배포 `crefans-admin:console-spacing-20261028`: 직전 운영 `promotion-payout-20261026` 소스 사본(빌드용 .dockerignore 포함)에 `src/app/globals.css` 1파일만 반영. amd64 빌드, 이미지 CSS에 새 규칙 포함 확인, 관리자 컨테이너만 교체(나머지5 ID 유지, 재시작0). 운영 admin.crefans.com 로그인 화면 Chromium/WebKit 390·1280에서 새 CSS 적용·입력 높이40·가로넘침 없음. 로그인 후 화면은 운영 계정 입력 금지로 운영에서 미확인(로컬 격리 검증만). 보존 단계로 로컬·운영 `crefans-admin:beans-20261025` 삭제(운영 여유 34.3GB). 빌드용으로 켠 로컬 Docker Desktop은 종료. 증거 front `.local/console-spacing-deploy-20261028/`.

## 미커밋 변경 정리 (2026-10-26)

- 사용자 요청으로 feat/bean-support의 누적 소스·에셋·검증 문서 변경을 보존해 리포별 커밋으로 정리. 로컬 비밀 설정/실행 폴더는 제외하고 .DS_Store/TypeScript 빌드캐시는 파일을 삭제하지 않고 추적만 해제. AGENTS 규약 보존.
- 알려진 실제 비밀번호·개인키·AWS 액세스키·Telegram 토큰·Toss 운영 비밀키 패턴 검사에서 후보 없음(이 패턴 검사는 모든 비밀정보 부재의 보장이 아님). 검증 결과와 커밋 후 clean 확인은 /tmp/crefans-commit-cleanup-20261026에 저장.
- 이번 정리 검증: npm run typecheck 및 npm test: 타입·단위5건 통과. 추가 실금융/E2E 재실행은 하지 않음.
- 이번 작업은 소스 보존/커밋 정리이며 운영 배포·원격 push·브랜치 병합을 수행하지 않음. 현재 기능/배포 상태와 미결정 정책은 아래 로그 유지. 다음: 운영 피드백 및 별도 요청 시 통합/푸시.


## 모든 프로모션 후원 수익 출금 (2026-10-26, 운영 배포 완료)

- 사용자 확정: 이번 이벤트 한정이 아닌 모든 프로모션콩 후원 수익 출금 허용. 과거 수신 lot도 지급·후원 출처가 검증되면 포함. 직접 구매/지급받은 잔액은 출금 불가, 수수료20%·최소1,000콩(총액10만원/실지급8만원)·PIN/본인계좌·수요일·BETA/BANK 가드 유지.
- 일반/프로모션 후원 원본을 보존해 예약·관리자/은행 반려·완료·중복·동시 요청을 처리. 기존 `reserved-paid` 공동 예약 계정과 lot allocation으로 정확히 원종류 복원. 공통 지갑/스튜디오/목업과 별도 콘솔의 회사 부담 출금 재원 표시 일치. 이벤트에 “* 프로모션 콩은 후원받은 사람이 출금할 수 있습니다.” 우측하단 보조 문구 반영.
- 서버 빌드/격리MySQL·PG/은행 대역·Swagger36, front 레이어/타입/단위355, admin 타입/단위5 통과. 프론트 E2E 고유3개(첫2개+실패1개 selector 보정 재시험), admin E2E2개 통과. 순수 프로모션·혼합 출금·출처 누락/동결/보류·직접 출금/자기후원 차단·중복과 잔액 보존 검사. 실제 은행/PG 송금 검증 아님.
- API/worker/front/admin `promotion-payout-20261026` 운영 반영. 기존 운영 대비 runtime server5/front6/admin1 파일 변경. 3 amd64 빌드, 실행소스server203/front646 SHA·3이미지 RootFS/manifest, 16HTTPS·6컨테이너·새worker 정상. DB25 migration·금융건수·잔액해시·수수료정책 불변. DB/proxy 유지, 백업 `/opt/crefans-backup-promotion-payout-20261026`.
- 운영 Chromium390/1280·WebKit390에서 목업지갑3,050콩/프로모션50콩, 목업·실서비스 이벤트 우측 보조문구/넘침없음 확인. PC 목업3,050콩 혼합출금에 일반3,000·프로모션50·실지급244,000 표시. WebKit 최초 강제 페이지 전환 중 미리읽기 중단 오류는 독립 페이지 진단에서 해당 요청200·오류0 확인 후 요청 종료를 기다리는 검사로 전체 재통과; 제품 코드 변경/오류 숨김 없음.
- BETA=true, 실제 판매승인/은행출금=false 및 가입 gate 보존. 운영 콩후원/출금 실이력0건이므로 금융 종단은 격리DB·대역 범위. 실제 지급·메일·회원정보 변경 없음. 관리자 내부 화면은 격리 E2E와 배포이미지 동일성, 운영은 로그인 보호 검사 범위.
- 증거: front `docs/audit/promotion-payout-20261026.json`; 코드/근거는 server `docs/platform-api.md` 최신 절. 과거 이벤트 정책 질문은 이번 승인·배포로 해소. 용량은 로컬 동일 복구본이 있는 미사용 구이미지6개만 정리, 현재/최근복구본·DB볼륨 유지. 세 리포 누적 미커밋·AGENTS 보존, 커밋/푸시 없음. 다음: 운영 피드백, 별도 실판매/은행 개방 검수.

## 후원 유형·출금 출처 운영 배포 (2026-10-26, 완료)

- API/worker/프론트/독립 관리자 콘솔 `tip-attribution-20261026` 배포 완료. 게시물·프로필 후원, 당시 게시물 제목, 유형별 받은후원, 출금에 실제 포함된 후원 출처와 수수료·실지급 표시 반영. 아래 구현 당시 미배포 기록은 이번 배포로 해소됨.
- DB·설정 백업 후 nullable 제목 snapshot migration `20261026120000_tip_attribution` 적용(총25개). 기존24개 checksum·금융건수·정책 유지. 6컨테이너 정상, 재시작/OOM 없음, 새worker failures={} 확인. 운영 실행소스 server203/front620 SHA 및 세 이미지 RootFS·릴리스·소스manifest 일치. DB/proxy 컨테이너 보존.
- 3개 amd64 운영빌드·14HTTPS검사 통과. 운영 Chrome 모바일390 보낸후원 제목검색/이동내역 구분, PC1280 스튜디오 집계/목업출금1,200콩의 게시물1,200·프로필0·수수료24,000·실지급96,000 표시 확인. 실제 금융 실행 없음. 관리자 운영 로그인 보호 확인; 로그인 세션 부재로 내부 화면은 이전 격리 E2E와 배포 이미지 동일성으로 범위를 구분함. 실제 운영 후원·출금은0건이므로 실데이터 종단 검증으로 확대하지 않음.
- 기존 초대가입 gate(signupReady=false)·실판매/은행출금 비활성 유지. 복구 `/opt/crefans-backup-tip-attribution-20261026`(DB/.env/runtime.env). 디스크 사전 확보는 동일 레이어가 로컬 보존된 미사용 이미지5개만 정리; 현재·최근 복구 이미지/DB 볼륨 유지.
- 증거: front `docs/audit/tip-attribution-deployment-20261026.json`; 구현 검증은 `tip-attribution-20261026.json`의 당시 기록 유지. 누적 미커밋 보존, AGENTS 변경 없음. 다음: 운영 피드백 및 별도 실결제/은행출금 개방 검수.

## 후원 유형·게시물·출금 출처 표시 (2026-10-26, 운영 미배포)

- 게시물 후원/프로필 후원을 팬 보낸후원·지갑이동, 공통 스튜디오 받은후원 및 별도 관리자 콘솔에서 구분. 후원 당시 글 제목 저장·연결, 과거 미기록은 현재 제목/정보 없음으로 명시하고 원장 사유 불변. 신규 사유는 유형별 기록.
- 스튜디오 유형별 일반/프로모션 총수·건수, 관리자 live/test/promotion별 사용량. 출금 allocation을 따라 게시물/프로필 포함 수량을 표시하고, 총액·20%수수료·실지급은 기존 저장금액 사용. 충전·후원 중복합산/권한·금융 정책 변경 없음.
- 서버 build·격리 MySQL/결제·은행 대역18개(신규2), Swagger11, front 레이어/타입/단위350, admin 타입/단위5 통과. 대역 1,000일반+50프로모션 게시물후원/500일반 프로필후원→1,200출금에서 게시물1,000/프로필200·수수료24,000·실지급96,000·지급1회·확정수수료1회 확인. 제목 수정·삭제 후 보존/기존 current fallback/프로모션 출금거절도 검사.
- Chromium390/1280·WebKit390 팬 목록/검색·지갑 및PC 스튜디오 목업출금 표시 검증. 관리자 브라우저2개(격리 실API 프로모션/원장 + 응답fixture 후원분류·출금배분·지갑) 및390/1280 화면 확인. 실제 PG/은행·운영회원 금융 실행 없음.
- 초기 검증에서는 콘솔 타입 이름 오기, 브라우저 검색 role 불일치와 모달 닫힘 애니메이션 중 캡처를 수정 후 재검증했다. 테스트 성공을 실공급자/운영 검증으로 취급하지 않는다.
- 증거: front docs/audit/tip-attribution-20261026.json. 다음 운영 배포 시 API/프론트/독립콘솔과 migration20261026120000 필요. 현재 운영 이미지·DB는 변경하지 않음. 누적 미커밋 보존, AGENTS 유지.

## 잔여 미배포 대조·PASS 보류 설정 반영 (2026-10-25)

- 전체 실행 입력801개(server197/front547/admin57)를 이전 배포 문맥과 대조하여 누락·차이0건, 운영 DB21개 migration checksum과 활성 인프라4개 SHA 일치를 확인했다. 베타 정책·광고 동의/철회·안내/FAQ·콩 상품 및 공유 UI/독립 콘솔 코드는 이미 beans-20261025에 반영되어 있었다. 앱 코드·이미지를 불필요하게 재배포하지 않았다.
- 빠져 있던 운영 SIGNUP_IDENTITY_MODE=email-only를 추가하고 API/worker만 재생성했다. 설정 원본을 /opt/crefans-backup-release-completeness-20261025에 비공개 백업하고 다른 runtime 값·이미지 설정 바이트 보존을 검사했다. 첫 시도의 백업 권한·따옴표 사전검사 실패는 변경 전에 중지됐고 수정 후 성공했다. SSH 지속 허용 규칙은 유지했다.
- 운영 HTTP16개, 브라우저8개(기존 콩6개와390/1280 실제 가입 화면 PASS 미노출·연령 확인·약관 차단2개), 서버196/프론트551 실행 파일 SHA·3이미지 전체 RootFS, 6컨테이너 restart0/OOMfalse 및 배치 failures={}를 재검사했다. DB/프록시 ID 유지, 실제 원장 균형·회사1억·정책 version2 수수료20%/보류7일 확인. 캡처 직접 확인.
- 가입은 빈 초대 명단·signupReady=false로 아직 닫혀 있다. 실결제·은행출금·광고메일 비활성화 유지. 이메일 연령 체크를 본인/성인인증으로 간주하지 않는다. 실제 금융·프로모션·메일·별도봇 테스트 발송 없음. 실PG 승인/은행 bridge·실제 개인정보 처리 사실/시행일·초대 명단 및 부하/복원 검수는 남아 있다.
- 증거: front docs/audit/release-completeness-20261025.json, 원본 server .local/release-completeness-20261025. 문서에 남아 있던 PASS 미적용·DB정책/결제migration 미적용 현재 설명을 갱신했다. 과거 실행 기록은 당시 상태로 보존한다. 세 리포 feat/bean-support의 누적 미커밋 보존, 커밋/푸시 없음.


## 콩 기능 운영 테스트 배포 (2026-10-25)

- 사용자 운영배포 지시로 API/worker·팬 프론트·독립 콘솔을 beans-20261025로 반영했다. 콩 지갑/충전·후원·스튜디오·콘솔 진입과 기존 목업 링크 유지. beta.crefans.com/preview/beans, /preview/studio/beans, /service/beans, admin.crefans.com/console/beans. 실제 서비스/콘솔은 기존 로그인·역할 가드를 유지한다.
- 운영 백업 /opt/crefans-backup-beans-20261025에 설정·단일 트랜잭션 MySQL dump/SHA를600/700으로 보존. migration17→21(베타/광고claim/콩원장/콩상품4개), 회사초기1억/발행대조-1억·genesis1회·증감0 확인. 승인 정책 DB version2=20%/보류7일(기존 version1=20%/0일). 기존 주문·출금0건, 테스트 자금을 실제 매출/자본금으로 기록하지 않는다.
- 운영 BETA_MODE=true/BEAN_LEDGER_ENABLED=true, BEAN_LIVE_PAYMENTS_APPROVED=false/BANK_PAYOUTS_ENABLED=false/MARKETING_MAIL_ENABLED=false, test_ck/test_sk와 CREFANS_E2E=false를 확인. 다른 비밀값/설정 보존. 가입 법률/초대 gate는 해제하지 않았고 실제 PG·PASS/은행 연결 완료/가입 개방으로 보고하지 않는다.
- local검증728소스 일치와3개linux/amd64 이미지 빌드, private SSH archive739,548,464바이트/SHA 대조. 운영 서버196/프론트551파일 SHA와3이미지 RootFS/아키텍처/릴리스 일치. HTTP16개(정상200/인증필수401), 실제 운영 브라우저6개(390/1280 목업충전·프로필후원·최소1000콩/20%견적·실지갑/콘솔로그인보호) 통과. 변경 전 새 지갑 미존재 대조 검사 통과. 실제 DB 원장재계산·21migration·배치heartbeat failures={}·6컨테이너 restart0/OOM false, DB/proxy ID 유지.
- 준비 중 Mac 디스크 부족으로 압축 실패·로컬 Docker 응답 중단 발생: 불완전 압축본/명시한 오래된 생성물·비활성 테스트 캐시만 정리하고 볼륨 초기화 없이 복구, 직접 SSH 스트리밍으로 전환했다. 운영 디스크97%→70%(15GB여유), 현재/직전복구이미지·소스/증거·DB/미디어볼륨 보존. 임시 패키징의 middleware 누락도 최종 rebuild 전 수정·이미지/실행파일 해시로 검증했다.
- 배포 초기에 sudo가 이미지 환경 덮어쓰기를 제거해 migration이 구버전으로 실행됨을 발견했다. bash stdin/compose interactive 소비 문제도 확인해 명시적 sudo env·--interactive=false로21migration이미지를 실행,4개실적용/재시작/원장·배치정상까지 재검사했다. 초기 오류 이력을 삭제하지 않는다. HTTP200만으로 DB완료를 선언하지 않는다. OCI index와runtime ID 차이는 전체RootFS레이어로 확인한다. 로그인 안내는 heading이 아닌 기존텍스트여서 브라우저locator를 수정하고 재검사했다.
- 복구: API/worker post-views-20261025, frontend gallery-close-soft-20261025, admin creator-verification-20261024와 백업설정으로 앱4개만 복구한다. 추가 DB테이블·원장·정책감사이력은 보존한다. down/볼륨삭제/seed/DB reset 금지. 집IP SSH 지속규칙 유지. 커밋/푸시 없음, 누적미커밋보존.
- 증거 front docs/audit/bean-deployment-20261025.json, 원본 server .local/bean-deploy-20261025. 다음은 사용자 실제화면 확인·버그수정이며 실PG 업종승인·법정환급/충전동의·은행연동/실입금·실출금 및 운영 부하/복원 검수는 별도다. 이번 배포검사에서 실제 사용자 충전/후원/프로모션/출금·메일·별도봇테스트 발송은 수행하지 않았다.


## 콩 상품 전체 연결·배포 준비 (2026-10-25, 운영 미배포)

- 팬 지갑/충전·결과/보낸 후원, 프로필·게시물·갤러리의 후원 레이어, 스튜디오 받은 후원·출금/PIN·내역, 독립 관리자 콩 지표·프로모션 지급·원주문 실입금 대사·출금 승인/사유 반려·개인지갑 출처 추적을 연결했다. BeanContext/BeanPages는 preview/service 공유, 기존 목업 URL 유지. 새 카탈로그 /preview/beans와 /preview/studio/beans, 실제 /service/beans 및 /service/studio/beans.
- 원장4+상품8모델/추가 migration2개·123 API(콩19개, Swagger 유저66/스튜디오42/콘솔34·공통 중복)·45화면. 기존 멤버십 원화 매출과 콩 충전/후원/확정 출금수수료를 합산하지 않으며 test/live/promotion을 구분한다. 회사초기1억·일반/프로모션 출처·프로모션 우선·구매잔액/프로모션 출금불가·받은일반콩1000콩 총액10만원부터/출금시20%를 적용했다.
- 회사 지갑 선행 잠금·원장/lot/예약·outbox 원자 저장, 요청키/내용 충돌·자기후원/타인주문·금액 검증, PG 승인 응답 유실/DB 실패 재조회, 신뢰하지 않는 웹훅 재조회 신호, 입금/7일 보류·PIN6자리/5회30초·2분 수량/계좌버전 인증, 은행 불확실 예약 유지·확정 반려 반환, 지급시 콩전량 회사복귀·수수료1회, 출처 취소 동결·미지급 보류·잔액/미완료건 탈퇴 차단을 구현했다. 신규 실제 출금 직전 PG 원결제 재조회 실패도 거부한다.
- 서버 build 및 실제 격리 MySQL/공급사 대역·금융/정기결제/베타/원장/Swagger86개, 프론트 레이어/타입321개, 콘솔 타입5개와 두 프론트의 배포용 빌드 통과. 새 콩4개+가입1개 및 기존 구독/환불/카드복구/유료미디어/베타18개 브라우저 검사 통과. 콘솔 브라우저11개도 통과하여 고유 브라우저 총34개를 확인했다. 캡처는 각 리포 .local/bean-product-20261025/screens에 보관한다.
- 초기 실패와 수정: 공유 AccountPages/BeanPages 순환 import 분리, 회사지갑 선행 잠금으로 동시 지갑생성 충돌 제거, 대역 결제검증 필드/제어 주입 수정, 목업 링크 이동으로 상태 보존, 동결잔액을 제외한 경합 테스트 준비, 관리자 strict locator 범위·nullable/DTO 타입 보완. 오래된 결제 수명주기 검사가 개발 DB의 미적용 열에서 실패하여 해당 테스트도 격리 E2E DB·정책 백업/복원으로 전환했다. 신규7일 환불 snapshot과 과거 계약 보존, 미입금 환불예약·수요일 검사 기대를 현행 계약으로 수정하고 재검사했다. 운영/개발 DB migration·환경 수정·실결제/송금/메일/봇 발송은 하지 않았다.
- feature BEAN_LEDGER_ENABLED/live 판매 BEAN_LIVE_PAYMENTS_APPROVED 기본false, actual 환경 미활성화. beta 은행송금 차단과 테스트콩 실제출금 금지를 유지한다. 실제 PG 충전/후원/환금성 업종 승인·판매약관/충전동의·법정 환급/유효기간·일한도, 은행/계좌검증 bridge·실입금 대사/실송금, 운영 migration/배포·부하/장애복구 검수는 남아 있다. 이 조건 없이 실금융 개방 완료/출시 무결함을 주장하지 않는다.
- 증거: 프론트 docs/audit/bean-product-20261025.json, 의미/근거/배포 순서는 서버 docs/platform-api.md·docs/platform-implementation.md·infra/platform/README.md 및 별도 콘솔 README. 세 리포 feat/bean-support의 기존 누적 미커밋 보존, 커밋/푸시·운영배포 없음. 과거 아래의 상품 미연결/정책 답변대기 기록은 이 로그와 정책 확정 기록으로 대체한다.


## 콩 정책 확정·최소 출금10만원 (2026-10-25)

- 사용자가 권장3안을 수락: 프로모션콩 우선 사용, 프로모션콩 후원 가능/현금출금 불가, 본인 구매콩 출금 불가·후원받은 일반콩만 수익출금. 콩 최소 출금은 수수료 차감 전 신청액100,000원=1,000콩으로 해석·안내했다. 수수료20% 20,000원/실지급80,000원. 기존 멤버십 원화 출금 정책은 이번 콩 정책 변경에 자동 합치지 않는다.
- `server/src/platform/bean-policy.ts`에 정책을 모으고 `beanWithdrawalQuote`가 받은일반콩 계정/최소1,000콩을 검사한다. 999콩 거부,1,000콩/1,001콩 견적, 구매·프로모션·프로모션수익·예약/회사지갑 거부를 검사했다. 일반 가치계산 beanCashQuote는 최소 출금액과 분리한다.
- 상세 설계의 답변대기/최소액 미정 부분을 확정값으로 갱신했다. 상품 충전/후원/은행 API·UI·집계는 여전히 후속 구현이며 운영 배포/DB/외부 금융 변경은 없다. 다음: 확정 정책에 따라 충전주문/재고예약/출처lot→후원/프로모션 우선 소비→출금/은행→공용UI·스튜디오/콘솔·대사 순서. PG/법정환급 조건과 실금융 검증은 별도다.
- 증거: front `docs/audit/bean-policy-confirmed-20261025.json`. 이전 로그의 답변대기는 이 기록으로 해소한다. 기존 미커밋과 feat/bean-support 유지.


## 콩 후원 설계·원장 기반 (2026-10-25, 상품 기능 미연결)

- 사용자 요청:1콩100원·출금시20%·회사초기1억·일반/프로모션 구분·이동/사유이력·가입지갑. 세 리포 feat/bean-support로 기존 누적 미커밋을 보존하고 분기했다. 신규 기능을 dev로 초기화하지 않았다.
- 구형Wallet/Transfer는 신규platform 미연결·Cognito/Decimal 구조여서 신규 BeanWallet/Account/Movement/Entry로 격리했다. 내부 균형원장·멱등키/내용해시·지갑순 잠금/ReadCommitted·잔액부족/동결/발행대조 보호·회사1억 초기이력을 구현했다. 출금 원화20% 정수 견적 함수와 BEAN_LEDGER_ENABLED 기본false의 가입 지갑/5계정 생성을 연결했다.
- 상세 DB·화면·API·매출 중복방지·충전lot/출금예약·실패복구·작업순서/합격조건·공식근거는 server docs/platform-implementation.md의 콩 후원 확장 설계. 팬 지갑/충전/후원레이어, 스튜디오 후원/출금, 독립콘솔 지갑/수불/대사/매출 변경을 계획했다. 실제 화면/충전/후원/출금 API와 집계는 아직 미연결이다.
- **답변 대기:** 프로모션콩 현금화/회사부담, 구매자 자기충전잔액 출금 범위, 사용순서. 권장 묶음을 질문했으며 임의 채택하지 않는다. 후원 취소 UI 미제공과 법정 충전금 환급·오결제·차지백을 분리해야 한다. PG 충전/후원/환금성 계약 및 법적 분류 미확인. 출금 최소액 총액/실지급액 기준 등도 결정 필요.
- 새 migration은 격리 E2E DB만 적용, 운영/개발 DB·환경·배포·외부 발송/결제/지급 없음. 원장 코드에는 공개 API/기존 수익원 연결이 없어 기존 매출을 늘리지 않는다. 검증: 서버 build·Prisma validate, 원장4+OpenAPI11개와 실제 격리API/DB 가입 Chromium1개(지갑1/계정5) 통과. 증거 front docs/audit/bean-support-20261025.json. 다음: 답변 확정 후 충전주문/회사재고예약/출처lot→후원→출금예약/은행→공용UI/콘솔/3Swagger→기존구독회귀 순서.


## 이메일 검토 후 인증 적용 방식 확인 (2026-10-24)

- 사용자 확정: 심사는 운영자가 이메일로 직접 하고 콘솔에서는 간단히 인증을 적용·해제하면 된다. 별도 신청서/심사 대기함을 추가하지 않는다. 불변 운영 규약을 AGENTS.md에 기록했다.
- 이미 배포된 회원·크리에이터 목록에 이메일/활동명/회원ID 검색, 인증 부여·해제 버튼과 확인창이 있다. 운영 로그에서 이벤트 `admin.creator_verification_changed`와 대상 ID로 이력을 조회할 수 있다. 처리자·역할·시각·대상·IP·요청ID·변경 전후를 남기며 상태와 감사 원장은 같은 트랜잭션이다. 동일 상태 재요청은 변경 이력을 중복 저장하지 않는다.
- 운영 재확인: 관리자/API 이미지가 직전 검증·배포본과 동일, 두 컨테이너 running/restart0/OOM없음, 관리자 로그인 HTTPS200. 직전 격리DB E2E의 취소·실패·적용·해제·재조회·이력2건과 API의 감사 필드 검증을 재검토했다. 제품 변경이 없어 같은 이미지를 재배포하거나 전체 검사를 반복하지 않았다. 운영 크리에이터0명으로 실제 계정 변경은 미실행이다.
- 증거 `docs/verification-console-confirm-20261024.json`; 전체 배포 증거는 형제 front `docs/audit/creator-verification-deployment-20261024.json`. 별도 미해결 구현은 없으며 이메일 검토 후 실제 크리에이터에 적용하면 된다. 커밋·푸시 없음.

## 인증 크리에이터 배지 운영 배포 (2026-10-24)

- 사용자 요청으로 `creator-verification-20261024` API·worker·독립 관리자·프론트를 운영 반영했다. 목업 모카·지우·북부대공(시온), 기존 하늘의 닉네임 오른쪽 배지가 프로필·피드·탐색·랜딩 등 공용 UI에 표시된다. 운영 콘솔에서 활성 ADMIN/SUPER_ADMIN이 부여·해제할 수 있으며 PASS와 별개다.
- 직전 운영 front493/server183파일을 대조한 뒤 배지 범위만 선택했다. 프론트12변경/3추가, 서버6변경/1migration추가, 관리자 Console.tsx를 반영했다. 운영에 `20261024120000_creator_verification` 하나만 적용했으며 기본false·NOT NULL 확인. 실제 크리에이터0명이라 계정 부여/해제는 수행하지 않았다. 별도 모바일 댓글 입력바·PASS 보류 가입 작업은 배포에 포함하지 않았다.
- 선택 소스 검사: front299, API/권한·감사·Swagger23, admin5와 격리DB 실제API 관리자 E2E1 통과. 세 amd64 이미지 빌드 및 이미지 브라우저6 통과. 운영 PC/모바일 Chromium·WebKit 브라우저6과 TLS HTTP18 통과. 서비스 화면의 인증/해제 브라우저 검사는 API 대역이며 운영 실계정 검증과 구분한다. 운영 front496/server184소스해시·이미지 일치, DB/proxy ID 유지·교체4서비스 running/restart0/OOM 없음, 집 SSH 지속 규칙 보존.
- 첫 운영 WebKit 검사에서 빠른 페이지 전환의 Next 사전 로딩 취소가 검출되어 로딩 완료 후 이동하도록 검사를 보완하고6개를 재검증했다. 실패 로그/trace를 보존했고 제품 사전 로딩 오류 자체를 수정했다는 주장은 하지 않는다. 검증 스크립트의 compiled 경로 오기와 증거 파일명 충돌도 교정해 재실행했다. PC·모바일 화면 육안 확인.
- 배포 증거: `crefans_front/docs/audit/creator-verification-deployment-20261024.json`, 원본 `crefans_front/.local/creator-verification-deploy-20261024/`. 복구 설정 `/opt/crefans-backup-creator-verification-20261024`. 이전 관리자 standalone에는 원본소스가 없어서 과거감사17파일+이미지로 비교했다는 한계를 기록했다. 커밋·병합·푸시 없음. 아래 배지 구현/목업의 미배포 기록은 이번 배포로 해소됐다. 물리기기·실계정 인증 판정 정책·기타 출시 검수는 별도다.

## 인증 크리에이터 배지 (2026-10-24, 로컬 구현)

- 사용자 결정: 운영자가 직접 부여·해제하며 PASS 본인인증과 분리한다. 생성형 이미지로 파란 체크 배지를 만들고 공통 CreatorName에 적용했다. 목업 하늘·모카·지우 예시와 미인증 비교 예시, 프로필·피드·탐색·멤버십·메시지·댓글·팔로잉/팔로워 및 디자인 카탈로그를 공유한다.
- 서버 Creator.is_verified 기본 false + migration, 활성 ADMIN/SUPER_ADMIN 전용 PUT /api/v1/admin/creators/:id/verification, 수정 필드 허용목록, 트랜잭션/행 잠금/변경 이력과 공개 isVerified 응답을 연결했다. 별도 관리자 콘솔에서 부여/해제 확인, 저장 실패 표시와 재조회. 일반 회원/PASS/광고 상태로 자동 부여되지 않는다.
- 검증 범위: 프론트300검사, API/권한/감사/Swagger23검사, 관리자5검사, 실제 API·격리 DB 관리자 E2E1 및 프론트 PC/모바일 Chromium·WebKit 6개. 화면·긴 이름·미인증·해제·실패/취소·권한 거부·중복 해제 감사 이력 대조. 문서 계약은 API100개(유저56/스튜디오37/콘솔26), migration17개. 증거는 front/docs/audit/creator-verification-20261024.json.
- 로컬 개발 DB와 격리 테스트 DB에 새 migration을 적용했다. 운영 DB/앱 미배포, 커밋·푸시 없음. 기존 모바일 댓글 입력바 등 미커밋 작업 보존. 운영 배포는 migration → API·콘솔·프론트 순서이며 기존 화면 인증 상태는 다음 조회 시 갱신된다. 실제 기기 검수·인증 판정 정책 자체는 검증 범위 밖이다.


## 현재 상태
- 2026-10-22 사용자 승인: 독립 운영 콘솔 + 매출 조회. 서비스 프론트 저장소에는 추가하지 않는다.
- 기존 main HEAD 7928cb6에서 feat/operator-console 생성. 기존 dev 브랜치가 없어 현재 유일한 기준 main을 사용했다. 사용자 변경 없음.
- 신규 /console 자체 회원 인증 및 /api/v1/admin 연결 완료. 로컬3002 및 https://admin.crefans.com/console 운영 배포 완료. 기존 Cognito/비버전 코드는 런타임에서 분리했다.

## 핵심 결정
- 6메뉴: 운영 현황, 회원·크리에이터, 콘텐츠·신고, 매출·정산, 고객지원, 운영 설정.
- 최초 구성은 조회와 기존 문의/신고/문서/금융정책 관리. 임의 환불·송금·일괄 삭제를 추가하지 않는다.
- 매출은 승인 원결제 기간의 원장(cohort). 후속 환불은 원결제 기간을 재집계한다. 실제 환불 발생일 기준 현금 흐름/회계 매출/순이익으로 표시하지 않는다.
- 금액은 원(KRW), 날짜는 Asia/Seoul. 플랫폼 수수료는 PG 비용·세금·서버비 차감 전. 테스트 결제 분리 데이터가 없으므로 실매출로 단정하지 않는다.

## 검증 계획
- 서버: KST 기간 경계, 환불/중복/실패 제외·집계 일치, 익명401·일반회원/비활성관리자403·역할 제한, 민감 필드 미노출.
- 콘솔: 타입 검사/빌드, API 오류와 빈 값 구분, 브라우저 로그인 및 매출/기간/페이지 이동, 서비스 프론트 런타임 미변경.
- 제품 코드·격리 검증 완료(서버16/단위3/E2E4/build). 운영 배포·요청 운영 계정 생성·실로그인 완료. 실PG 대사는 미실행이다.

## 다음 작업
- 운영 배포/요청 계정 지정 완료. 회원정지·게시물숨김/복구·보호미디어확인은별도설계/구현필요. 실제PG테스트/운영분리와대사도남아있다.

## 미해결
- 거래 환경 식별(테스트/운영), 실PG 대사, 회원정지/콘텐츠숨김·보호미디어관리.

## 2026-10-22 독립 운영 콘솔·매출 조회 구현

- 사용자 지시: 매출 조회 포함, 프론트 프로젝트에 넣지 않고 소스·리포 분리. 별도 crefans_admin(feat/operator-console) 신규 /console 런타임을 구현, 서비스프론트 app/components/features/lib/types diff 없음. 기존레거시관리자URL은새콘솔로redirect, Cognito/비버전API/AuthProvider 런타임제거(미사용파일참고보존). 클라이언트토큰저장/기본계정 없음.
- 메뉴6개: 운영현황, 회원·크리에이터조회, 콘텐츠메타/신고처리, 매출·정산조회, 문의답변/공지FAQ, 금융정책/약관. 매출은KST최대366일/승인일원장/환불원기간귀속/전체·일별·크리에이터20명페이지. 수수료비용차감전·테스트결제포함가능·현금흐름/회계매출/순이익/PG대사아님을표시. 결제내역생성일/출금전체기준명시. 실패/미승인제외,민감PG/회원필드select제외,동일RepeatableRead스냅샷.
- 신규7개 /api/v1/admin 조회API: me/overview/members/posts/revenue/payments/withdrawals. 활성Admin서버guard유지, 금융조회ADMIN/SUPER_ADMIN, 정책SUPER_ADMIN. 문의/문서/신고변경은관리자·대상ID outbox와원자저장, 원문미포함. 신고PENDING경합201/409, 자동숨김아님. 기존금융정책버전/사유/감사유지. local3002 Origin기본값추가, 운영명시목록은수동설정필요.
- **초기버전제외**: 회원강제정지/콘텐츠숨김복구·관리자보호미디어상세/환불·송금버튼/PG테스트운영분리/발생일기준환불현금흐름. 운영콘솔전체완성/출시가능을주장하지않는다. 다음은운영배포·실관리자계정지정과필요시강제조치권한/감사설계.
- 검증: 서버Nest build exit0, 격리MySQL 관리자8+기존금융정책8=16 PASS, 콘솔타입+단위3 PASS, real-main/실DB Chromium E2E4 PASS(실로그인/조회/답변저장/신고/잘못된Origin403/API503대조/모바일). production build exit0. 초기E2E alert locator2건실패는Next announcer중복선택으로수정후전체4재검증. 이전162검사를이번에다시돌렸다고확대하지않는다.
- 관리자기존Next14.2.32취약점조사후15.5.28 + PostCSS8.5.31 동일메이저override. 공급사보안릴리스/OWASP/Toss공식문서확인. 최종 npm audit --omit=dev 취약점0/exit0, 개발도구포함moderate2/high8/critical0(미해결10건). 강제메이저일괄업데이트없음. 빌드/E2E재실행으로override호환확인.
- 로컬기존billing-test API/worker를동일설정으로재시작해새관리자API반영(운영DB아님), 콘솔loopback3002기동. /login200·익명/admin/me401·서비스3010/feed200. 기본관리자생성/권한부여/운영배포/실결제·외부발송없음. E2E3013/3003/.next-e2e와운영개발DB/3010/3002캐시격리,합성데이터정리.
- 증거: /Users/ethan/repository/crefans_admin/docs/verification-20261022.json에HEAD/dirty/소스SHA/명령/시각/exit/대조검사/미실행범위. docs/screenshots에합성매출PC/모바일화면. 과거admin-console-inventory는구현전시점기록으로유지하며현재상태는본로그와새증거가우선한다.

## 2026-10-22 독립 관리자 운영 배포·Telegram 실연결 완료

- 사용자 명시 요청으로 https://admin.crefans.com/console 배포. 동일EC2에별도crefans_admin소스/이미지/standalone·비루트·readonly컨테이너384MiB를추가. ADMIN_IMAGE=crefans-admin:console-20261022, API/worker=crefans-api:admin-20261022, 서비스프론트beta-20261021/목업유지. Caddy는관리자admin/auth3종만직접API전달하고다른API404,실제IP헤더덮어쓰기유지. 정확한admin Origin추가,host-onlySecure쿠키확인. 새EC2/IAM/DB백업없고apex/메일DNS변경없음.
- 요청 이메일은 기존 사용자 이메일의 한영전환 입력으로 해석. 운영DB미존재를확인후운영자1명만명시bootstrap(SUPER_ADMIN활성). 기존회원있으면덮어쓰기거부,비밀번호는salted scrypt해시로만전달저장·로그미출력. email_verified는수동운영자확인이지SMTP챌린지/PASS성공이아님. Chrome실로그인·운영매출0조회PASS,실제회원1/주문0. 금융정책값을임의설정하지않음.
- 별도실행승인후공식BotFather에서crefans_operations_bot(CREFANS Operations)생성, [crefans] operations에게시만허용. 정보변경·메시지수정삭제·스토리·초대·관리자추가·차단·방송권한해제,getMe/getChatMember검증. 토큰/채널ID는.local/platform.env600및운영runtime.env600비공개저장. 로컬과beta각자기합성이벤트발송후Telegram앱의동일ID/action실수신확인(접수만으로완료주장안함). 운영미발송0. 실제1시간요약경과수신은아직아님.
- 검증: amd64 Nest/Next Dockerbuild exit0,readonly standalone로그인200/정적asset7개200,공개정상TLS검사12 PASS(관리자로그인·매출셸/익명401/민감파일404/타API404/악성Origin403/기존beta서비스·목업·health200). 관리컴파일JS2개원격SHA로컬일치,6컨테이너running. DB/미디어/Caddy볼륨보존,14migration기존상태조회만·seed/reset/추가migration없음. 임시현재IP/32 TCP22규칙은완료후해당ID삭제,원래3ingress복원. 원격임시암호해시/봇전달JSON/이미지archive제거,실행설정/이미지보존. 롤백 /opt/crefans-backup-admin-20261022(700).
- 초기실패: Docker타입검사참조lib/utils COPY누락2회보완후build성공,bot가입update미수신은승인된채널연결메시지로chat확인, Caddy재기동/TLS발급중일시연결오류는제한재시도후정상공인TLS로재검증(보안경고우회없음). 이전162전체테스트를다시돌렸다고확대하지않는다. 상세HEAD/dirty/sourceSHA/image/명령결과/미검증경계는crefans_admin/docs/deployment-20261022.json. 실운영매출화면docs/screenshots/admin-live-revenue.png,로컬합성알림수신telegram-connected.png. 민감값/실제접속IP는공개증거에포함하지않음.
- 다음: 필요시회원정지/콘텐츠숨김·보호미디어관리, PASS/은행/실PG·실가입,실1시간요약수신,외부장애감시. 운영콘솔/Telegram접속완료를상용출시완료로단정하지않는다.

## 2026-10-22 UBA Console UI 적용·재배포 진행

- 사용자 요청: UBA console UI를 따르고 개선 후 배포. 제품명 UBA Console인 uba_front의 현재 app/app.css/AppNav.vue/UiStats/UiTable/UiPageHead를 읽기 전용 참고. 미적용design-system/essential 시안이나별도uba_admin보라관리자셸은참고기준에서제외. UBA repo 변경 없음.
- 동일토큰/IBM Plex KR/240px·56px접이식사이드바/그룹메뉴·20px제목·14/16px카드·작은표·오른쪽금액정렬/선택탭면/OS다크/1080px이하스크롤내비반영. 크레팬스로고고정SVG라이트/다크를독립repo에복사,서체5개와공식IBM OFL원문동봉. 새로운UI라이브러리·백엔드/API/금융/권한변경없음. UBA와달리모바일로그아웃은헤더아이콘으로보존.
- 검증: 타입+단위3 PASS, 실DB/real-main Chromium E2E6 PASS(기존4+넓은화면/접기지속/짧은창로그아웃/다크·폰트자산/390px넘침0/모바일로그아웃). PC/다크/모바일/합성매출표화면직접열어시각확인. Docker public COPY추가로브랜드/폰트를standalone런타임에포함. 현재amd64이미지빌드중, 운영은아직기존UI. 배포완료근거는후속로그참고.
- 다음: 이미지smoke/원격SHA대조→ADMIN_IMAGE만교체(--no-deps)→API/DB/worker/서비스/프록시컨테이너ID유지검증→운영Chrome/자산/공개체크→임시SSH회수→증거갱신.

## 2026-10-22 UBA Console UI 운영 반영 완료

- 관리자 이미지 crefans-admin:uba-ui-20261022(amd64, sha256:4134d32623c844265d1ae8e7657bfa7d25d90ce68ffa7a9720684e2ae74165f2) 배포. 로컬/원격 archive SHA-256 일치, readonly·비루트 standalone smoke 및 브랜드/폰트/라이선스 자산200. 위 진행 로그의 빌드/배포 대기 상태는 본 완료 기록으로 갱신한다.
- 타입+단위3, real-main/격리MySQL E2E6, production Docker build PASS. 운영 HTTPS 공개검사14 PASS(익명401·비허용Origin403 대조 포함), 로그인된 Chrome에서 새 그룹메뉴/매출화면/사이드바접기·펼치기 확인. 화면 docs/screenshots/uba-console-live.png. 운영 0원은 실제 조회이며 가짜 매출을 넣지 않았다.
- admin만 --no-deps --no-build로 교체하고 API/worker/DB/frontend/proxy 컨테이너ID 모두 보존. migration/회원/금융정책 변경 없음. 시작 직후 일시502는 제한 readiness 재시도 후 정상화, 최종14개 공개검사 통과. 임시SSH 규칙 삭제·기존3 ingress 복원, 원격업로드 archive 삭제. 롤백 /opt/crefans-backup-admin-uba-20261022.
- 증거: crefans_admin/docs/uba-ui-deployment-20261022.json. 이전 서버16건/보안전체검사를 이번 UI변경에서 다시 실행했다고 확대하지 않는다. 실PG대사/기존 미구현 강제운영조치 범위는 유지.

## 2026-10-22 모바일 메뉴 이동 시 스크롤 유지 수정

- 원인: catch-all page 안에 인증/메뉴 셸이 있어 경로 변경 시 재생성. 수정 전 실제 브라우저 대조에서 메뉴 scrollLeft 358→0 재현. /console/layout.tsx에 ConsoleShell을 유지하고 페이지 내용만 교체, 현재 경로로 aria-current 갱신. 잘린 현재 메뉴만 최소한 가로 스크롤하고 폰트/메뉴폭·뷰포트 변경을 관찰한다.
- 근거: Next15 공식 layout 문서(https://nextjs.org/docs/15/app/api-reference/file-conventions/layout, 2026-10-22 확인)의 공유 레이아웃과 Client usePathname. 기존 서버 권한 검증은 그대로다.
- 테스트: 모바일 메뉴 위치/활성링크/뒤로·앞으로/문서 reload 없는 이동/지연폰트·새로고침/빠른 화면크기변경 회귀 시나리오 추가. 반복 테스트에서 고정 합성 이메일의 10분 로그인 제한이 누적되어 ADMIN_E2E_EMAIL을 실행별 무작위 .invalid 주소로 격리했다. 제한 로직은 변경하지 않았다. 새 layout 추가 후 구형 생성 route 타입 충돌은 Next typegen 재생성으로 해결.
- 첫 이미지 nav-scroll-20261022 배포에서 이동 전후 357.5px 유지 확인. 실운영 새로고침 후 폰트폭 변화로 끝부분 잘림을 발견하여 링크 ResizeObserver 보완, 지연폰트 테스트로 검증. 빠른 desktop/mobile 왕복에서 observer 크기가 같아 이벤트가 생략되는 사례도 잡아 window resize 보완. 최종 검증/배포 결과는 아래 후속 기록 참조.

- 최종 완료: nav-scroll-20261022-2(sha256:d398e218f46d91e6bc8247b26b08885b16a9f07a1305ab74a55858d6aeb942fd) 운영 배포. 타입/단위3·E2E7·Dockerbuild·공개TLS14 PASS. Chrome390px에서 새로고침 후 운영설정 활성메뉴 fullyVisible=true/357.5px, 고객지원 이동 후357.5px 유지·fullyVisible=true. 뷰포트 원복, 실제 iOS Safari는 미실행.
- 두 번의 배포 모두 admin만교체, 다른5개컨테이너ID유지. 임시SSH 각각삭제·기존3ingress복원,원격archive삭제. 최종롤백 /opt/crefans-backup-admin-nav2-20261022. 상세sourceSHA/회귀대조/시각/실패원인/범위는 docs/mobile-nav-20261022.json. 증거화면 docs/screenshots/mobile-nav-live.png. 기존 미해결 운영기능 범위 유지.

## 2026-10-22 관리자 이용약관 편집 제거

- 사용자 요청에 따라 운영설정의 문서 종류에서 terms/이용약관을 제거하고 새 문서·목록·편집에서 접근되지 않게 했다. 문서 영역 제목은 개인정보·운영정책. 공지·FAQ/개인정보/운영정책·금융정책은 기존 범위를 유지, 서비스 공개 약관/API/DB 문서는 삭제하지 않는다.
- 타입+단위3 PASS, 기존 실DB 관리자 주요경로 E2E1 PASS(정책 선택지 정확히 개인정보처리방침/운영정책 확인). 이번 단순 UI 제거에는 전체7/백엔드전체검사를 반복하지 않았다. 배포 이미지 no-terms-20261022 준비 중이며 최종 기록은 후속 항목 참고.

- 2026-10-22 관리자 이용약관 편집 제거 배포 완료: crefans-admin:no-terms-20261022, sha256:44a056da5e011906ebb89c57f5b0698a14cd35a12a229d4dc8360f8bb448b909. 타입/단위3·주요경로E2E1·Dockerbuild·운영TLS14 PASS. Chrome운영설정에서 개인정보·운영정책 두종류만확인, 이용약관없음. 서비스약관/API/DB삭제없음. 관리자만교체·다른5컨테이너ID유지. 원격archive제거·임시SSH삭제·기존3ingress복원,롤백 /opt/crefans-backup-admin-terms-20261022. 근거 crefans_admin/docs/no-terms-20261022.json.

## 2026-10-22 구독 대시보드 구현·검증

- 신규 /api/v1/admin/dashboard를 별도 운영 콘솔 /console에 연결. 신규 구독·갱신 포함 결제 건수·총 구독 결제액·환불 차감액과 전일 증감, 7/30/90일 두 그래프·일별 표. 날짜는 KST, 오늘은 전일 같은 시각까지, 과거일은 하루 전체. 전일0 비율 미표시. 현재 잔여 구독은 별도 현재 스냅샷이며 해지예약 포함. 운영 현황 카운터 유지, 이용약관 편집은 계속 제외.
- 구독별 최초 승인 식별, 원장 현재 환불은 원승인일 귀속, 실패/미승인 제외·누락일0, 금액 safe integer·서버 financial role guard·동일 RepeatableRead. 실제 PG대사·회계매출·MRR·고유 구독자 수로 해석하지 않는다. 테스트 결제 환경 분리 미구현은 유지.
- 검증 합격: Nest build, 관리자 타입+단위3, 격리MySQL/HTTP11 (권한·한국시간 경계·갱신/환불·잘못된 입력·빈기간·현재유효/해지예약/만료/미래구독), real-main Chromium E2E8 (DB숫자·전일0·그래프·기간변경·모바일·API503대조·기존관리기능). 초기 TS Map추론오류1건을 명시타입으로 수정 후 통과. 합성 데이터 정리, 실결제/실외부발송 없음. PC/390px/다크화면 확인. 새DB스키마/마이그레이션 없음.
- 공식 근거 확인2026-10-22: Toss API/거래 정의, Stripe active subscribers의 고객/구독 단위 차이. 집계 정의와 출처는 서버 docs/platform-api.md, 관리자 README에 기록. 진행 중인 운영배포 결과는 후속 기록과 admin docs/dashboard-20261022.json 참조.

- 운영 반영 완료: admin/API/worker dashboard-20261022. 관리자 image ed547f75e0918c59536d5b960dad76e0f4759fd075fb027c02d47f696fef2f90, API image22c788335cc8a21e3c14c84c48fda7f14f33659f409fe5c9a31902a8dbd27fdf. 로컬/원격 archive SHA 및 테스트된 backend JS 일치. database/frontend/proxy 컨테이너ID 유지, schema/migration/회원/결제/정책 변경 없음. 초기 readiness502 두 번 뒤 제한 재시도 성공, 최종 TLS 공개16 검사PASS. 원격 archive 제거·임시 SSH 회수·기존3 ingress복원. 롤백 /opt/crefans-backup-dashboard-20261022.
- Chrome 실운영 로그인 상태에서 당일 같은시각·과거일 전체비교/7일선택/그래프4선/390px 가로넘침0 확인. 날짜 fill 자동화가 React 상태에 반영되지 않아 실제 달력 키보드 선택으로 검증했다. 제품 날짜입력은 격리Chromium E2E 및 운영 native 달력에서 정상. 뷰포트 원복, 운영 데이터는 실제0건/0원이며 채워진 매출·환불·갱신은 격리DB검증. 실PG금융·대사를 실행했다고 확대하지 않는다.
- 검증증거 crefans_admin/docs/dashboard-20261022.json, PC/모바일운영 및 합성데이터화면 docs/screenshots/dashboard*.png. front check:docs 56문서/92라우트 PASS는 계약·snapshot검증이며 runtime테스트와 구분. 기존 PASS/은행/정책확정/미구현 강제운영조치 등 출시 잔여 범위 유지.

## 2026-10-22 사고 추적용 로그 현황 조사 (구현 전 보고)

- 사용자 요청은 현재 기록 현황을 먼저 보고. 제품/운영설정 변경·실발송·SSH접근 추가 없이 신규 platform/admin/infra/Prisma/공유인증 소스 읽기조사. 최근 배포 dashboard-20261022 API이미지의 주요소스7개SHA가현재파일과일치함을network-none Docker실행+hashlib비교 exit0로확인. 운영DB/원시로그를이번에전수조회한것은아님. 이전테스트를재실행했다고주장하지않는다.
- 존재: 5xx/배치/치명오류·보안탐지/차단/해제·회원가입/구독/갱신/해지/콘텐츠/프로필·관리자문의답변/신고처리/문서저장 DB outbox. IP/peer/request_id/시각/종류/허용ID,전송재시도·최종코드보존. 매분배치개별실행+실처리/실패즉시·무작업1시간요약. 금융정책별도version/변경자/사유/값/시각이력,주문상태/원장은존재.
- 주요부족: 콘솔통합로그조회API/UI 없음(미발송수·배치마지막시각·정책이력·결제상태만). Caddy access log 미설정/API전요청완료로그없음. 일반오류stack/코드위치/release/인증된actor 없음,request_id는내부저장하나응답/Telegram연결없음. 로그인성공·실패/로그아웃/권한거부/관리자조회감사부족,문서/프로필before-after 없음. 금융시도별불변이력/PG상세안전원인보존부족;SMTP메시지ID/접수결과저장없음.
- 보관: 전송완료 운영이벤트(관리자행위포함)·worker-run30일정리,미발송유지. Docker서비스별10m×3용량순환으로기간보장아님. 외부중앙수집/불변보관·장애독립감시미구성. 애플리케이션/DB동일호스트이므로호스트장애시증거손실위험. 로그보존기간법적요구/금융기록TTL은이번에정책확정하지않음.
- 권장 다음순서(아직구현지시없음): 안전한요청/오류상관관계와금융/관리자감사누락보완→알림큐와감사보존분리/외부수집→콘솔검색/필터/상세타임라인. OWASP Logging,Docker json-file,Caddy log 공식문서확인2026-10-22. 상세25개파일SHA/범위/미검증/출처: crefans_admin/docs/logging-inventory-20261022.json. 사용자보고후추가구현지시를따른다.

## 2026-10-22 개인정보·운영정책 콘솔 섹션 전체 제거

- 사용자 정정: 개인정보·운영정책 섹션도 사용하지 않으며 정책 문서는 자체 하드코딩으로 관리할 예정. 운영설정에서 해당 섹션·문서등록/수정/조항 UI 전체를 제거하고 공지·FAQ 편집만 남겼다. 더 이상 쓰이지 않는 조항 state·조건·CSS 정리. 금융 수수료/보류기간·변경이력은 유지. 서비스 공개문서/API/DB 이관이나 약관문안 작성은 이번 범위 아님.
- 검증 조건: 운영설정에 금융정책은 존재하고 문서 종류/새문서/개인정보·운영정책은 없어야 함, 고객지원 공지·FAQ는 유지. 타입+단위3 및 해당 실DB 브라우저 주요경로 E2E 검사. 배포 결과는 후속 기록에 추가한다.

- 배포 완료: crefans-admin:no-policy-20261022, sha256:aa18880856214d2cc7578a837db5b333f932b44ae0a4315dc1c56cd4c4a9896f. 타입/단위3·실DB주요경로E2E1·Docker build·공개TLS16 PASS, Chrome운영설정에서금융정책/이력만표시확인. 초기readiness502한번뒤정상. admin만교체·다른5컨테이너ID보존,원격archive제거·임시SSH회수/기존규칙복원. 롤백 /opt/crefans-backup-admin-no-policy-20261022. 근거 docs/no-policy-20261022.json 및 docs/screenshots/no-policy-live.png. 코드하드코딩정책문안/서비스DB독립전환은이번구현으로완료된것이아님.

## 2026-10-22 console 로고 이미지 생성·공통 적용

- 사용자 요청: 기존 ChatGPT 로고 제작 이력을 참고하여 crefans 글자 자리를 console로 변경. “로고 시안 질문” 대화의 프리미엄·친근함/심벌+소문자 워드마크 방향과 현재 채택 SVG를 참조. imagegen 스킬의 내장 image_gen으로 생성·테두리 정리 2회, 최종 투명 PNG를 public/brand/console-logo.png에 원본 그대로 복사. prompt/이력/참조는 docs/console-logo-prompts-20261022.json. 이전 대화의 생성 결과 이미지 자체는 반환되지 않아 현재 채택 자산을 직접 참조했다.
- Brand 공통 컴포넌트의 중복 Console 텍스트/구분선 제거. 원본 alpha 유지·CSS 프레임으로 세로 투명 여백 정리, 다크는 동일 이미지 흰색 실루엣. 로그인/PC/모바일 동일 자산. 일반 서비스 프론트 로고는 변경 없음.
- 합격 조건: console 단일 워드마크, 로그인/내비게이션 공유, 다크 대비/390px 가로 넘침 없음/메뉴 스크롤 보존. 타입+단위3, 격리DB Chromium 기존 셸/다크/모바일 메뉴 E2E3 PASS. 4개 스크린샷 직접 시각 확인. 운영 배포 결과는 후속 기록 참조.

- 운영 반영 완료: crefans-admin:console-logo-20261022, image sha256:413a6c9058605131ac3387cc9eb25af1249b90de35a9937d1777a353f2f845a7. 로컬/원격 archive SHA와 운영 PNG 바이트 일치. readonly·network-none standalone 로그인/asset 검사 및 정상 TLS 공개16 검사 PASS. Chrome 로그인된 운영 화면에서 console 이미지 naturalWidth2173, PC120×24/모바일100×20 프레임, 390px 가로 넘침0 확인. 모바일 뷰포트 원복. 다크/로그인은 격리 Chromium E2E 시각검증이며 실운영 OS 다크 변경은 하지 않음.
- admin만 교체·다른5컨테이너ID 보존, 원격 임시 archive/script 제거·임시SSH회수/기존규칙복원. 첫 readiness502 한 번 후 정상. 빌드의 기존 img 최적화 권고 warning은 남음. 금융/DB/백엔드 로직 변경 없음. 롤백 /opt/crefans-backup-admin-console-logo-20261022. 증거 docs/console-logo-20261022.json 및 docs/screenshots/console-logo-*.png. front check:docs 56문서/92라우트 PASS는 기존 front/server 문서 snapshot 범위이며 콘솔 UI 테스트를 대신하지 않음.


## 2026-10-22 운영 로그 콘솔 구현 (운영 미배포)

- /console/logs: KST기간·분류·수준·IP·요청/행위자/대상/배치ID·이벤트명 필터, 20건 페이지, 상세 안전한 메타데이터·관련100건 타임라인·Telegram 접수 표시. ADMIN/SUPER_ADMIN만 메뉴/서버 접근. UBA 공통 셸/모바일 스크롤/다크 유지.
- 브라우저 전역 오류/rejection/React boundary 수집은 정적JS위치/오류종류만. 페이지5건/중복제거, 서버 IP10회/분. 요청 ID를 오류 안내에 표시.
- TS+단위5, 실제main/격리MySQL Chromium9 PASS. 실제 로그 조회/조건없음·503대조·상세타임라인·관리자 GET actorRole/requestId·실브라우저 오류 접수와 원문 제외까지 검증. Desktop/390px/dark 캡처 직접 확인. 앞선 logo 배포 상태와 구분하며 이번 로그 기능은 운영에 적용하지 않았다.
- docs/logging-implementation-20261022.json과 docs/screenshots/logs-*.png. 전체 수집/보관/외부연결 한계는 형제 서버 docs/operational-logging.md. 같은 E2E DB를 사용하는 서버 테스트와 동시 실행하지 않는다.


## 2026-10-22 감사 로그 콘솔 운영 반영

- 카드 불능 대응 배포와 함께 기존 미배포 운영 로그 UI/API·브라우저 수집기를 반영. admin billing-recovery-20261022, 별도 리포 유지. TS/단위5·격리DB Chromium9·amd64 build·운영 HTTPS 공개20 및 로그인된 Chrome 로그 조회/분류·배치 기록 확인. source/image SHA와 런타임16 migrations/worker 정상, 원격 업로드 제거 및 임시SSH회수 증거는 서버 docs/billing-recovery-20261022.json. 화면 docs/screenshots/billing-recovery-logs-live.png(실제 접속IP가 없는 배치 필터).
- 콘솔 금융정책은 운영 버전0 미설정으로 확인했으며 임의 변경하지 않았다. 로그/복구 기능 배포가 실제 PG실승인/정산 또는 상용출시 완료를 뜻하지 않는다.

## 2026-11-01 레퍼럴 관리 메뉴 (커밋 b818e08, 배포 진행 중)
- 사용자 요청: 콘솔에 레퍼럴 관리(스위치·목록), 회원·크리에이터 목록에 회원 구분 필터, 구분 없이 모든 회원에 레퍼럴 링크 생성 버튼.
- /console/referrals: 친구 초대 보상 켜기·끄기(확인 창, 서버 platform_settings·감사), 상태별 집계·목록. 회원 목록: 회원 구분(팬/크리에이터), '레퍼럴 링크 생성'(복사). 권한 메뉴 referrals(view/create/update).
- 검증: e2e/referrals.spec.ts 3건 + console·invites 포함 18건(API 대역), npm test 11건, 커밋 스냅샷 tsc. 실제 서버 연동 화면은 배포 후 확인 필요.
- 2026-11-01 운영 배포 `referral-20261101`(API·worker·front·admin). 기준 API profile-photo·front nobeta·admin handle-sync. 1차 시도는 배포 스크립트 내 파이썬 문법 오류(빈 for)로 자동 롤백(이전 이미지 복구, 마이그레이션 3개는 추가 테이블만이라 유지), 수정·내장 파이썬 블록 컴파일 검사 후 2차 성공. DB 백업 후 마이그레이션 referrals·referral_hold·platform_settings, platform_settings 0행(스위치 꺼짐) 확인. 운영: /me/referral·/admin/referrals 비로그인 401, /service/beans/withdraw·/console/referrals 200, 목업 초대 카드·출금 화면 확인, 이미지 보존 정리. 미확인: 운영자 로그인 상태 콘솔 레퍼럴 화면, 실제 보상 계정 출금. 증거 crefans_front/.local/referral-deploy-20261101/.

## 2026-11-01 레퍼럴 디자인 운영 배포 완료
- 릴리스 `referral-polish-20261101`: 운영 기준 `referral-20261101`의 불변 소스에 프론트 3개·콘솔 2개 파일만 반영. 초대 카드/관리 표 디자인과 복사 성공 하단 스낵바 적용. API·worker·DB·proxy 컨테이너 ID 유지, 정책 활성화/마이그레이션 없음.
- 09:40 KST 배포 명령 exit 0. 실제 운영 이미지 PC Chromium·모바일 WebKit 10건 PASS(API/clipboard 대역); 운영 `/preview/beans` 2건 PASS(clipboard 대역). 운영 프론트·콘솔 정적 파일 SHA-256과 배포 이미지 파일 일치. 실제 로그인한 콘솔/보상 지급 검증은 이번 범위 아님.
- 빌드 2건 exit 0. 로컬/운영 최신 3개 이미지 및 직전 롤백 보존 정리 완료. 테스트 도구 중복 로드·자산 URL 인코딩 경로·검사 중 임시컨테이너 삭제에 따른 초기 검증 실패는 실행 방식 수정 후 재검증, 제품 수정 없음.
- 증거: `/Users/ethan/repository/crefans_front/.local/referral-polish-deploy-20261101/verification.json`, `deployment-command.json`, `image-ui-checks.json`, `production-front.log`, `served-assets.json`, `runtime-after.json`, `retention-*-apply.json`. 소스 manifest와 hash는 같은 폴더.
- 기존 미커밋 변경 보존. 앞선 문서 검사에서 확인된 referral/profile API 설명 및 문서 계약 미갱신 문제는 남아 있으며 문서 검사 통과로 보고하지 않음.

## 2026-11-01 운영 콘솔 2차 인증 디자인 5안
- 요청: 운영 콘솔 2차 로그인 디자인 시안 5종. 현재 login/page.tsx·Brand·CSS 토큰 확인 후 기존 로고/애플고딕/파랑·회색으로 기본 카드형, 단계 표시형, 모바일 중심형, 안내 강조형, 미니멀형 제작.
- 산출물 `.local/totp-design-20261101/comparison.html`, comparison.png, option-01~05.png. HTML을 Chromium에서 1.5배로 캡처; 5개 시안 가로넘침·깨진이미지 0, 육안 확인. 실행/HEAD/미커밋/SHA256은 evidence.json. 실제 인증 연결·제품 소스 수정·배포 없음.
- 다음: 사용자 선택안을 실제 로그인·복구 코드 화면에 적용하고 PC/모바일 및 인증 흐름 검증. 기존 AGENTS 규약 유지.

## 2026-11-01 2차 인증 03안 적용·붙여넣기 자동 제출 (로컬 완료)
- 선택된 모바일 중심 디자인을 login/page.tsx 및 globals.css에 적용. 로고·방패·6칸 표현(실제 input 1개)·복구 코드/다른 계정 버튼. 데스크톱은 중앙 정렬, 모바일 좌우24px. 서버 인증 계약 유지.
- 붙여넣기 이벤트에서 공백을 제거한 숫자6자리만 즉시 1회 요청; ref로 동일 tick 중복·요청 중 제출 방지. 형식 오류는 요청하지 않음. 서버 오류/429 안내 후 수동 재시도. 타이핑 및 복구 코드에는 자동 제출하지 않음. MDN paste 문서(https://developer.mozilla.org/en-US/docs/Web/API/Element/paste_event, 2026-11-01 확인)대로 clipboardData·preventDefault 사용, 상시 클립보드 읽기 없음.
- 검증: npm run check exit0(TypeScript·단위11건), PC Chromium·iPhone13 WebKit E2E6건 PASS. 빈/5자리/7자리/문자혼합은 요청0, 연속 붙여넣기1요청, 실패 후 재시도·429·복구 코드 흐름 확인. 캡처 육안 및 가로넘침 확인. API/ClipboardEvent 대역이며 물리 iOS·실운영 인증 검증 아님.
- 증거 `.local/totp-polish-20261101/evidence.json`, check.log, ui.log, results의 스크린샷. dev가 추가한 tsconfig include만 사전 파일과 비교 복원. 기존 미커밋 변경 보존. 운영 미배포, 다음은 배포 요청 시 현재 운영 기준 위에 로그인 TSX·해당 CSS만 반영.

## 2026-11-01 2차 인증 03안·붙여넣기 자동 제출 운영 배포
- 릴리스 `crefans-admin:totp-polish-20261101`. 운영 기준 referral-polish-20261101의 불변 소스 위에 login/page.tsx와 해당 CSS만 반영, 이전 검증 SHA 일치 확인. admin만 교체했고 frontend/API/worker/database/proxy ID·이미지 유지. 정책·DB 변경 없음.
- 빌드 exit0. 실제 운영용 이미지 PC Chromium·iPhone13 WebKit 6건, 운영 admin.crefans.com 화면 같은 6건 PASS. 인증 API 응답·붙여넣기는 대역이며 실제 운영 계정 로그인/물리 iOS 클립보드 검증은 아님. 빈/5자리/7자리/문자혼합 요청 차단, 연속 붙여넣기 중복 방지, 오류 후 재시도·복구 코드·429 검증. 운영 스크린샷 육안 확인, 정적 파일 SHA256 배포 이미지와 일치.
- 서버 health 및 로그인 HTTP200, admin restart0/OOM없음. 직전 롤백 포함 최신3개 이미지 로컬·운영 보존 정리. 기존 미커밋 변경 보존.
- 증거 `/Users/ethan/repository/crefans_front/.local/totp-polish-deploy-20261101/verification.json` 및 builds/source-delta/deployment-command/runtime-after/served-assets/retention JSON. UI 명령·시각·로그·캡처는 admin `.local/totp-polish-20261101/`의 image-ui-check.json, production-ui-check.json과 *results. 다음: 실제 운영자 사용 피드백 확인.

## 2026-11-01 2차 인증 화면 간소화 (미배포)
- 사용자 요청으로 방패 SVG/영역 36→52px 확대, 하단 CREFANS 푸터와 전용 CSS 삭제, 붙여넣기 자동확인 설명 한 줄 삭제. 실제 paste 자동제출 함수·연결은 유지.
- 검증: npm run typecheck exit0, 크기/문구/푸터 제거 및 paste handler 유지 정적 단언 통과. 증거 `.local/totp-polish-20261101/minor-evidence.json`, minor-typecheck.log. 이번 변경은 운영 미배포. 기존 AGENTS 규약 유지. 다음: 배포 요청 시 이 두 파일 변경만 운영 기준에 반영.

## 2026-11-01 2차 인증 간소화 운영 배포 완료
- `crefans-admin:totp-clean-20261101`: 방패52px, 푸터/붙여넣기 설명 제거. 자동제출 함수 유지. admin만 재생성, 다른5컨테이너 보존.
- 최초 운영 이미지 검사에서 SVG 공통20px 규칙이 속성을 덮어쓰는 문제 검출(PC/모바일 실패). `.login-security-icon svg`에52px 명시 후 재빌드 및 같은 검사2건 PASS. 초기 실패로그 보존. 빌드 exit0, 운영 정적자산 SHA256 일치, 실제 운영 화면 PC/모바일2건 PASS 및 캡처 확인(인증응답 대역, 실계정 인증 아님).
- 증거 front `.local/totp-clean-deploy-20261101/` source-delta/builds/deployment-command/runtime-after/served-assets/verification.json, admin `.local/totp-clean-20261101/` image-ui-first.log/image-ui.log/production.log 및 스크린샷. 로컬·운영 최신3이미지/직전롤백 보존 정리. 기존 AGENTS 유지·미커밋 변경 보존. 요청 변경 운영반영 완료.

## 2026-11-01 iPhone OTP 기본 입력·6자리 자동제출 운영 배포
- `crefans-admin:totp-native-20261101`, 운영 기준 totp-clean 위 login/page.tsx·전용 CSS만 반영. 기존 opacity0 입력+가상6칸을 제거하고 숫자가 직접 보이는 단일 native text input으로 교체. user-select:text/touch-callout:default, numeric 키보드·one-time-code 유지. 시스템 메뉴 노출을 JS로 강제하거나 클립보드를 상시 읽지 않음.
- 타이핑/자동완성/붙여넣기 6자리 완료 시 자동1회 요청. pending ref와 마지막 자동전송값으로 중복·오류 후 자동반복 방지. 명시적 다시 붙여넣기/제출은 재시도 가능, 6자리 미만으로 수정 시 자동값 초기화. 복구코드는 수동. AGENTS 규칙 갱신.
- 검증: check 타입·단위11 PASS, 로컬·운영용 이미지·운영 URL PC Chromium/iPhone13 WebKit 각8건 PASS(인증API·paste 대역). 5자리 무요청/6번째 입력1회, 재붙여넣기, 기본 input opacity1/선택 범위, 오류·429·복구, 가로넘침 검사. 운영 정적자산 SHA256 일치. 물리 iPhone의 OS 붙여넣기 메뉴는 미검증이며 탭1회에 메뉴가 열림을 보장하지 않음.
- Apple one-time-code 문서 및 WebKit invisible-input 이슈302876 조사(2026-11-01), 적용 판단은 admin `.local/totp-native-20261101/evidence.json`. 로컬 테스트의 프리패치가 미실행 API 3001에 ECONNREFUSED를 남겼지만 대역 시나리오는 통과, 운영 실제인증 검증으로 확대하지 않음.
- 배포 증거 front `.local/totp-native-deploy-20261101/verification.json`, source-delta/builds/deployment-command/runtime-after/served-assets. admin `.local/totp-native-20261101/` check-final.log/ui-final.log/image-ui.log/production.log 및 캡처. admin만 교체·나머지5컨테이너 유지, 최신3 이미지/롤백 보존 정리. 기존 변경 보존·tsconfig 개발서버 부수변경만 복원. 다음은 사용자 실기기 메뉴 확인.

## 2026-11-01 광고 상품 폼 광고 지면·판매 개시 문구 (미배포)
- Advertising.tsx 등록/수정 공통 폼에 광고 지면 select 추가. 옵션은 주목할 크리에이터(featured_creator) 하나, 기존 placement 값과 저장 요청 연동. 스튜디오에 노출 → 스튜디오에 광고상품으로 판매 개시.
- visible/onSale 기존 별도 동작 유지. 문구만으로 실제 구매 허용으로 오해하지 않도록 목록 게시 설정이며 실제 신규 구매에는 판매 허용도 필요하다는 상단 설명 보완.
- 검증: npm run typecheck exit0, select/value/옵션/기존 문구 삭제 정적검사 통과. `.local/advertising-form-20261101/evidence.json`에 HEAD·미커밋·SHA256·명령 기록. 운영 미배포, 다음 배포 요청 시 해당 파일만 반영. 기존 AGENTS 준수.

## 2026-11-01 광고상품 폼 운영 배포 완료
- 릴리스 `crefans-admin:ad-form-20261101`, 운영 totp-native 기준에서 Advertising.tsx 한 파일만 반영. 광고 지면 select(주목할 크리에이터) 및 스튜디오에 광고상품으로 판매 개시 문구·설명. visible/onSale 별도 계약 유지.
- 빌드 exit0, 운영 이미지 PC/모바일4건 및 운영 URL4건 PASS(API 대역). 지면 옵션1개·저장 featured_creator·등록/수정/삭제·조회권한 검증, 운영 캡처 점검. 실제 운영 상품 생성/수정 없음. 정적자산 SHA256 이미지 일치, admin 재시작0/OOM없음, 다른5컨테이너 유지. 최신3이미지/직전롤백 보존 정리.
- 증거 front `.local/ad-form-deploy-20261101/verification.json`, source-delta/builds/deployment-command/runtime-after/served-assets/retention JSON. admin `.local/advertising-form-20261101/` image-ui-check.json·image-ui.log·production.log·캡처. 기존 AGENTS 규약·미커밋 변경 유지, e2e/advertising.spec.ts는 새 문구·지면검증으로 갱신. 요청 배포 완료.

## 2026-11-01 prod 기준 작업·dev 통합·prod 승격 전환
- 사용자 명시 요청에 따라 새 작업 기준을 dev에서 prod로 변경. docs/branch-workflow.md와 AGENTS.md 동기화. 기존 변경은 먼저 보존 커밋, backup/branch-workflow-20261101 태그·로컬 패치 저장 후 prod에서 feat/prod-dev-workflow를 생성하여 기존 개발 이력을 병합.
- 관리자 콘솔은 origin/main을 보존 기준으로 prod/dev 초기 생성. 생성 캐시/개인 QA 파일은 삭제 없이 Git 제외. 이번 작업은 Git 통합이며 운영 배포 아님. 다음: 통합 검사 후 dev→prod 및 원격 동기화.

### 통합 검증 및 승격 절차
- 기존 이력 병합에 충돌 없음. 관리자 타입검사+11단위 통과, 서버 Nest 빌드 통과. 프론트 기존488검사 중 빈 출금의 최근50건 표시를 기대하던1건은 최신 빈 상태 요구사항에 맞춰 수정 후 재검사. 제품 코드 변경 없이 테스트 기대값 정정. 문서 계약의 이벤트 slug 4개를 현재 카탈로그와 동기화, Git 제외 QA 출력 README는 문서 인벤토리에서 제거(파일 보존).
- 과거 별도 프론트 signup-success 모달은 최신 SignupCompletePage로 대체됨, video-first-frame은 현행 MediaVideo에 반영되어 개선 유지. 이 과거 브랜치/작업트리는 삭제·역병합하지 않고 보존.
- 이번 검증은 Git 이력·소스 보존/타입·단위·빌드·문서 검사 범위. 전체 E2E/실결제/운영 재배포는 수행하지 않음. dev에 통합 후 동일 트리를 prod에 일반 병합하고 원격 push, dev를 prod로 fast-forward 동기화한다. 최종 SHA/원격 일치/clean 증거는 `.local/branch-workflow-20261101/after.json`에 기록한다.

### 원격 통합 완료 확인
- dev→prod 승격 및 dev fast-forward 동기화 완료. 최초 검증 SHA `3468ab65a3317abca51cc8582c93a8be9b122ce6`: 로컬 dev/prod와 origin/dev/origin/prod 동일, 미커밋 없음 확인. 본 완료 기록도 같은 작업 브랜치→dev→prod 순서로 통합한다.
- 최종 검사: 프론트488/관리자11 단위와 타입·백엔드빌드 통과, 문서75개 계약/링크 검사 및 검사기 대조검사 통과. 문서 증거는 snapshot-only로 전체 제품 QA 증명이 아님. 다음 새 작업은 최신 origin/prod에서 새 feat 브랜치를 만든다. 이전 작업트리는 보존했으며 그 위치에서 후속 작업할 때도 이 지침을 적용한다.

## 2026-11-03 미배포 콘솔 통합·검증
- origin/dev602cecf에 예약핸들 관리91bc8cb와 콩 후원·출금 빈 상태2448f72를 통합. 기존 미커밋 작업이 있는 주 작업트리는 보존. AGENTS 규약 유지.
- npm run check: TypeScript 및 단위13건 통과. 과거 실제 격리API 예약핸들 E2E와 빈 표 E2E 증거는 각 커밋의 docs JSON 참조. 운영은 기존referral-20261102이며 API 예약 핸들 migration과 함께 배포 예정.

## 2026-11-03 예약핸들·빈 콩 테이블 운영 배포
- dev통합b43619d→prod5a290a4 승격 후 crefans-admin:all-pending-20261103 배포. 예약핸들 관리UI·후원/출금/정산 관련 테이블 누락 없는 no-data 표시 포함. 서버 예약핸들103개 및 API migration 동시 반영.
- typecheck/13단위 통과; 이미지 원본 소스 해시 및 운영 컴파일 산출물·컨테이너 imageID 확인. 운영 로그인 경로200, restart0/OOMfalse. 상세 묶음 증거는 프론트 docs/audit/open-event-spacing-20261103.json. 운영관리자 인증 데이터 변경은 수행하지 않았으며 앞선 격리E2E 증거와 구분.

## 2026-11-03 활동 분야 세로 드래그 정렬 (운영 미배포)
- 최신 origin/prod에서 feat/category-vertical-drag 분기. PC 마우스·모바일 터치 손잡이 추가(44×44px 이상), 위아래로만 이동. 작은 수직 이동(8px) 후 시작하고 기존 화살표/되돌리기/명시적 순서 저장과 전체 IDs·expectedIds 계약을 유지한다. 이동 중 저장·편집·새로고침 잠금, 저장 실패 시 미저장 순서 보존. 키보드 Space/Enter·위아래·Esc와 한국어 상태 안내 지원.
- dnd-kit 공식 sortable/sensor/modifier 및 WCAG 2.2 드래그 대안 지침 확인. React18 호환 stable core6.3.1/sortable10/modifiers9/utilities3.2.2 고정(공식 문서상 legacy API). 전용 손잡이만 touch-action:none, 나머지는 기본 스크롤. 최초 가장자리 회귀검사에서 표가 가로로183px 자동 스크롤됨을 검출하여 센서 원좌표까지 수직 고정. 같은 검사에서 가로0px, 세로 자동 스크롤 유지 확인.
- 검증: 타입·단위13건 PASS, PC Chromium/모바일 Chromium·WebKit의 해당 시나리오11건 PASS(기기 비해당 조합7건 제외), production build exit0. 기존 img 최적화 lint 경고 유지. PC·모바일 캡처 육안 확인. API 대역이며 실제 운영 순서나 DB는 변경하지 않음, 물리 iPhone/실스크린리더 미검증.
- 증거: docs/category-vertical-drag-20261103.json에 요구사항·파일SHA256·명령·결과·공식 출처와 실패/수정 경계를 기록. 로그·캡처는 .local/category-vertical-drag-20261103/. dev→prod 소스 통합과 서버 배포는 구분하며, 최종 refs/clean 상태는 같은 폴더 integration.json에 보존. 이번 변경은 운영 미배포.
- 기존 AGENTS 규약 유지 및 세로 센서·스크롤 불변식 추가. 다른 작업트리 미커밋 변경은 보존. Next 개발서버가 추가한 tsconfig include만 작업 전 파일로 복원.

## 2026-11-03 활동 분야 순서 이동 애니메이션 (운영 미배포)
- 최신 origin/prod a234cfd에서 feat/category-sort-motion 분기. Vue TransitionGroup과 같은 목록 위치 전환을 기존 React 구현에 적용했다. 드래그 중 주변 행, 놓기·취소, 위아래 버튼, 목업 순서·되돌리기에 240ms 감속 이동 적용. 현재 보이는 위치에서 시작하는 행별 FLIP/Web Animations API로 빠른 연속 조작도 연결하며 추가 의존성 없음. dnd-kit의 별도 레이아웃 애니메이션은 비활성화해 transform 충돌을 피한다.
- 동작 줄이기 설정에서는 즉시 순서 변경. 애니메이션 중 설정 변경 시 취소하며 재조작·재드래그·목록 갱신·언마운트 시 기존 애니메이션 정리. 기존 수직 센서·손잡이 외 스크롤·키보드/화살표·명시적 저장·전체 IDs/expectedIds·권한 유지.
- 수정 전 프레임 검사에서 화살표 이동이 중간 위치 없이 즉시 바뀌어 실패함을 확인. 수정 후 PC Chromium/모바일 Chromium·WebKit 관련 18건 PASS, 기기 비해당9건 제외. 프레임 좌표로 이동 중간값·가로 고정·드롭16px 안착·취소·연속 이동·동작 줄이기 검증. 타입·단위13건 및 production build 통과. 기존 native img lint 경고만 유지. PC/모바일 최종 캡처 육안 확인.
- 증거 docs/category-sort-motion-20261103.json 및 .local/category-sort-motion-20261103/의 baseline.log, ui-final.log, results.json, 프레임 JSON, check.log, build.log. API는 대역으로 실제 운영 순서/DB 변경 없음. 물리 iPhone과 운영 환경 미검증. dev→prod 소스 통합 후 최종 refs/clean 상태는 같은 폴더 integration.json에 기록한다. 운영 미배포.
- AGENTS에 이동/접근성 불변식을 추가. 다른 작업트리의 변경은 보존하고, 개발서버가 추가한 tsconfig include만 작업 전 내용으로 복원했다.

## 2026-11-03 운영 로그 상세 모달 (운영 미배포)
- 최신 origin/prod a218583에서 feat/log-detail-modal 분기. 하단 상세 section을 기존 ConfirmDialog portal로 전환. PC 최대840px, 모바일 좌우16px·화면 높이 이내, 제목/X 고정·본문만 스크롤. 속성·JSON·발송 상태·타임라인·조회 API는 유지한다.
- 관련 기록은 같은 모달에서 keyed 본문만 교체하여 이전 기록 혼재를 방지하고 스크롤을 상단으로 초기화. 로딩/오류/재시도도 모달 안에 표시하며 닫힌 요청 응답이 다시 열거나 새 선택을 덮지 않음을 확인했다. 공통 모달에 고유 제목 ID·Tab 포커스 순환·닫기 후 포커스 복원을 추가했다. WAI-ARIA APG Dialog 지침 적용, 기존 typed-confirm 취소/삭제 잠금과 portal 레이어 유지.
- 최초 WebKit 검증에서 클릭한 버튼이 activeElement가 되지 않아 포커스 복원이 실패하여 상세 진입 시 preventScroll focus를 명시했다. 조회 실패 대역은 React StrictMode의 초기 중복 요청에 영향을 받지 않도록 명시적 재시도 전까지 오류를 반환하게 수정. 최초 실패 로그 보존. 관련12건(PC Chromium·모바일 Chromium·WebKit) 및 타입·단위13건·production build 통과. 다크 모드 전환 중간색이 캡처되지 않도록 해당 캡처는 finite animation 완료 후 촬영한다.
- 증거 docs/log-detail-modal-20261103.json 및 .local/log-detail-modal-20261103/의 검사 로그·리포트·캡처. API 대역만 사용해 실운영 로그/회원 데이터 변경 없음. 기존 실API console.spec.ts 기대값은 dialog로 갱신했지만 전체 실API suite는 이번에 실행하지 않음. 물리 iPhone/스크린리더 미검증.
- AGENTS 로그 상세 규약 갱신. 개발서버의 tsconfig include 부수변경만 복원하고 다른 작업트리를 보존한다. dev→prod 소스 통합 완료 상태는 같은 폴더 integration.json 참조. 이번 변경과 앞선 활동 분야 정렬/애니메이션은 운영 미배포이며 이후 배포 요청 시 함께 반영할 수 있다.

## 2026-11-03 공통 모달 바깥 놓기로 인한 입력 유실 방지 (운영 미배포)
- 최신 origin/prod 41e03f5에서 feat/modal-backdrop-pointer-guard 분기. 공통 ConfirmDialog에서 같은 주 포인터의 배경 누르기·배경 놓기를 모두 확인한 클릭/탭만 닫기로 처리한다. 내부 시작→외부 놓기, 외부 시작→내부 놓기, 우클릭·취소·다른 포인터의 놓기는 닫지 않는다. 터치 암묵적 캡처로 event.target이 원래 배경에 남을 수 있어 놓인 실제 좌표를 확인한다. 의도한 배경 클릭, X/취소/Esc, 처리 중 닫기 방지와 portal/스크롤/포커스 규칙 유지.
- MDN click/pointerdown 및 MUI Dialog 공식 구현 조사. 현행 콘솔 모달을 쓰는 10개 소비 파일은 모두 공통 컴포넌트 경로다. 별도 레거시 AdminLogoutModal은 이미 maskClosable=false이므로 변경하지 않음. 개별 업무의 저장·삭제 API 및 운영 데이터 변경 없음.
- 수정 전 실제 마우스 inside→outside 동작으로 모달 소멸을 재현(실패 대조). 수정 후 PC Chromium/모바일 Chromium·WebKit 관련21건 통과, 기기 비해당3건 제외. 입력 유지·배경 클릭/탭·CDP 터치 경계 이동·취소·합성 포인터 캡처/다중 포인터·기존 로그 상세/모달 레이어 검증. 타입·단위13건 및 production build 통과, 기존 img 최적화 경고 유지. PC/WebKit 모바일 캡처 확인.
- 최초 회귀 검사 중 WebKit 마우스 버튼의 기존 비포커스 특성으로 회원 모달의 트리거 포커스 기대값만 실패. 입력 보존은 통과했으며, 포커스 검증은 키보드로 모달을 열어 시작 포커스를 명확히 하는 시나리오로 수정했다. 실제 마우스로 여는 회원 모달의 WebKit 트리거 포커스 복원 개선은 이번 범위 밖이며 기존 로그 상세의 명시적 포커스 복원 검사는 통과했다. 최초 로그 보존.
- 증거 docs/modal-backdrop-guard-20261103.json 및 .local/modal-backdrop-guard-20261103/의 baseline/ui/check/build 로그·브라우저 리포트·캡처. API 대역 검증이며 실운영/물리 iPhone/실스크린리더 미검증. dev→prod 통합 결과와 clean 상태는 같은 폴더 integration.json에 기록한다. 운영 미배포.
- AGENTS에 바깥 닫기 규칙을 추가하고 개발서버의 tsconfig include만 복원했다. 다른 작업트리의 변경은 보존한다.

## 2026-11-03 운영 콘솔 No data 디자인 통일 (운영 미배포)
- 최신 origin/prod 2483ff3에서 feat/console-empty-state 분기. 사용자 첨부처럼 우하단이 접힌 회색 문서 SVG(36×44px), 아이콘·문구 간격16px, 영역 최소160px·상하32px 여백과 중앙 정렬로 공통 EmptyState 추가. 빈 상태 자체의 테두리·둥근 박스 제거, 다크 모드 색상 지원, 장식 SVG aria-hidden. 일반 안내는 ‘내역이 없어요’, 광고상품·로그·출금 등의 기존 의미 있는 문구 유지.
- 10개 소비 파일의 기존 빈 표시14곳을 공통 컴포넌트로 전환(공통 TableContent를 통해 콩 테이블9곳에도 적용). 수동 지급의 대기 계좌/출금·배치 기록·변경/조치 이력도 동일 디자인. 데이터/권한/페이징/업무 API와 기존 표 헤더 노출 조건은 유지한다. 별도 레거시 UI 및 원래 빈 상태가 없는 신규 영역 추가는 범위 밖.
- PC Chromium·모바일 WebKit 14건 PASS: 7개 목록 화면, 수동 지급·다크 모드, 콩 테이블9개 빈/정상/0값·지연/오류/재시도·이전행 유지·다음 페이지를 검사. 아이콘36×44/간격16/중앙/화면 이내·테두리0 확인, PC/모바일/다크 캡처 육안 확인. 타입·기존 단위13건·production build 통과. 기존 img 최적화 경고 유지.
- 최초 타입 검사는 개발서버의 .next-e2e 타입 재생성과 동시에 실행되어 임시 파일 경합으로 실패; 서버 종료 후 순차 검사로 해결했다. 기존 TableContent 단위 테스트는 단일 파일만 변환하던 로더라 새 공통 컴포넌트를 찾지 못했으므로 실제 EmptyState도 변환하도록 수정했고, 정확한 과거 p 마크업 대신 안내·장식 아이콘·로딩/정상행 동작을 검사한다. 최초 실패 로그 보존, 제품 동작 실패로 확대하지 않음.
- 증거 docs/console-empty-state-20261103.json 및 .local/console-empty-state-20261103/의 inventory/results·check/build 로그·화면. API 대역 검증이며 실운영 데이터/물리 iPhone/스크린리더 검증 아님. 개발서버 tsconfig 부수변경만 복원하고 다른 작업트리 보존. dev→prod 소스 통합 결과는 같은 폴더 integration.json에 기록. 운영 서버 배포는 하지 않음.

## 2026-11-04 고객지원 등록·수정 모달
- origin/prod a947f47에서 feat/support-editor-modals 분기. 공지·FAQ 등록/편집 및 문의 답변 등록/수정 폼을 공통 ConfirmDialog portal로 전환. 기존 권한·API payload·게시 확인 유지, 저장 중 닫기/중복 제출 방지, 오류 시 입력 유지, 성공 시 snackbar와 목록 갱신.
- npm run check: 타입 및 단위 16건 통과. playwright.support.config.ts의 PC Chromium/iPhone13 WebKit 2건 통과: 초기 inline 폼 없음, body portal, 등록 실패 입력 유지, 수정값/category/pinned 보존, 취소 무변경, 답변 저장. 실 API는 대역이며 실제 문의 답변 발송 없음. 모바일 캡처 확인. 최초 fixture 권한 누락 및 textarea label locator 실패는 테스트 fixture/role locator 수정 후 통과. 물리 기기 검증 제외.
- 운영 배포 및 원격 빌드 검증은 후속 기록. DB 스키마 변경 없음.
- 운영 배포 완료: support-modals-20261104 / 590c0b1. Docker production build 성공(12페이지, 기존 img 권고), 로그인 HTTP200, admin 외 컨테이너 ID 불변·재시작0. 운영 URL의 PC Chromium·iPhone13 WebKit 2건도 API 대역으로 통과; PC/모바일 화면 확인. 실제 고객 데이터 변경/답변 발송 없음.
- 이전 admin 이미지·현재 구성은 /Users/ethan/crefans-recovery/20261104/support-modals 에 비공개 보관하고 SHA-256/OCI blob·image ID/설정 해시 검증 후 서버 이전 이미지와 임시 소스만 정리. 증거 docs/support-modals-20261104.json 및 .local/support-modals-release/ 로그. dev→prod 순서 반영.

## 2026-11-04 인증 앱 열기 위치 변경
- prod f3e0ca3에서 분기. Google Authenticator 열기를 인증하고 로그인 버튼 아래로 이동하고 “열리지 않으면…” 문구 삭제. 기존 모바일 조건·자동 열기·OTP/복구 동작 유지. 운영 빌드 및 기존 인증 UI 검사 후 배포 예정.
- 타입 검사 및 기존 인증 UI PC/iPhone WebKit 2건 통과(API 대역). 삭제한 설명 전용 CSS 제거, 폼 기본 gap으로 버튼 간격 유지.
- 운영 배포 완료: authenticator-position-20261104 / 4085150. production build 12페이지 성공, 로그인 HTTP200·다른 컨테이너 불변. 운영 URL PC/iPhone WebKit 2건 통과(API 대역), 로그인 아래 링크 위치·안내 부재·OTP/복구 전환 검사 및 모바일 캡처 육안 확인. 물리 앱 열기 재검증은 제외.
- 증거 docs/authenticator-position-20261104.json, .local/authenticator-position-release/ 로그·캡처. 이전 이미지/설정은 로컬 복구저장소로 전송해 해시 검증 후 서버 사본·임시 소스 정리. dev→prod 반영.

## 2026-11-06 네이티브 confirm 을 콘솔 자체 확인 다이얼로그로 교체 (feat/console-confirm-dialog)
- 배경: 운영 공지 저장 중 내장 브라우저가 네이티브 `confirm()` 을 막아 **저장이 조용히 취소**됐다(콘솔은 false 를 "취소"로 처리). 사용자 지시: 톤앤매너에 맞게 직접 구현, 재사용 구조 우선.
- 재사용: 기존 `ConfirmDialog`(포털·포커스 트랩·`.dialog` 스타일)와 `SnackbarProvider` 의 provider 패턴을 그대로 따랐다. 새 CSS 없음.
- 추가: `TypedConfirm.tsx` 에 `ConfirmProvider` + `useConfirm()` (→ `Promise<boolean>`). 호출부는 `if(!confirm(text))return` 을 `if(!await confirmAction({title,message,actionLabel,danger}))return` 으로만 바꾸면 된다. `app/console/layout.tsx` 에서 SnackbarProvider 안에 설치. 취소 버튼이 기본 포커스(Enter 로 실수 확정 방지, TypedConfirmDialog 와 같은 원칙). 위험 동작은 `danger` 로 빨간 버튼.
- 교체 6곳(네이티브 confirm 0건): 공지·FAQ 저장, 크리에이터 인증 배지, 신고 처리(3종), 운영자 재발급·비활성·활성, 콩 충전 환불, 은행 지급 처리/결과 확인, 프로모션콩 지급.
- 결함 수정: 확인창이 편집창 위에 겹치면 Esc 가 두 창을 동시에 닫았다. `ConfirmDialog` 에 열린 창 스택을 두어 Esc·포커스 트랩·스크롤 잠금을 최상단 창만 처리한다.
- 검증: typecheck 0 오류, lint 신규 경고 없음(기존 `<img>` 3건), 단위 16/16, `build:verify` 통과. E2E 8파일 34건 중 28 통과·2 건너뜀·4 실패 — **4 실패는 변경 없는 origin/prod 기준선에서도 같은 4건**(console:21, console:31, moderation:14, moderation:21). 수정 전에 새로 깨졌던 4건(bean-refunds 2, comment-reports, console:123)은 모두 해결.
- 회귀 검사: 각 E2E가 네이티브 다이얼로그를 받으면 `native` 배열에 담고 마지막에 빈 배열을 단언한다. 대조 검사: 공지 저장을 네이티브 `confirm` 으로 되돌리면 `support-modals` 가 실패하고, 복구하면 통과함을 확인.
- 미검증: console.spec 33행의 신고 "처리 완료" 확인 경로는 기준선에서 32행(문의 답변)이 먼저 실패해 도달하지 못한다. 같은 컴포넌트의 "숨기고 처리 완료" 경로는 comment-reports 에서 통과.
- (추가, 사용자 결정) `window.prompt()` 3곳도 교체: 같은 provider 에 입력 모드를 붙여 `usePrompt()`(→ 앞뒤 공백 제거한 값 또는 null)를 만들었다. 콩 출금 "이체 완료 기록"(참조번호), "반려"(사유, 빨간 버튼), 수동 지급 "예금주 확인 완료"(확인 내용). 입력란이 자동 포커스되고 빈 값·공백만이면 확정 버튼이 꺼진다. **콘솔 전체 네이티브 confirm/prompt/alert 0건.**
- 추가 E2E `e2e/bean-payout-prompts.spec.ts`: 빈 값 차단, 취소·Esc 시 미전송, 재오픈 시 입력 초기화, Enter 확정, 공백 제거 전송, 반려 버튼 danger, 네이티브 창 0건. `manual-payouts.spec`(ADMIN_E2E_MANUAL_PAYOUTS=1)도 새 입력창으로 갱신해 통과. 공지 저장은 PC·모바일(WebKit) 둘 다 통과.
- 운영 배포는 사용자 승인(2026-11-06).
