# 진행 상태

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
