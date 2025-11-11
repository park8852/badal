# 바로배달 취약점 진단 보고서 (개정 2025-11-11)

※ 본 보고서는 내부 보안 개선을 위한 재작성본입니다. 모든 스크린샷은 `security/evidence/` 경로에 저장하여 설명과 1:1로 매칭해야 하며, 현재 문서는 자리표시자 이미지를 사용하고 있습니다. 제출 시 반드시 실제 캡처로 교체해 주세요.

---

## 1. 보고서 개요
- **진단 대상**: 바로배달 관리자 웹 콘솔(Next.js 14) 및 백엔드 API(Spring Boot 3.x)
- **진단 범위**: 인증·세션, 주문 관리, 포인트 관리, 관리자 기능, 개인정보 노출 항목
- **진단 목적**: OWASP Top 10(2021) 및 KISA 웹 취약점 점검 가이드에 따라 개발팀이 즉시 수정 가능한 취약점을 식별하고 증적을 제공
- **작성 일자**: 2025-11-11
- **작성자**: 보안 담당자 A (보안성 검토), 개발 담당자 B (조치 계획 수립)

---

## 2. 진단 환경 및 사전 설정

### 2.1 테스트 환경 요약
| 구분 | 상세 |
| --- | --- |
| OS | Ubuntu 22.04 LTS (커널 6.1.147) |
| 웹 브라우저 | Google Chrome 129.0.6668.100 (한국어 UI) |
| 프록시 도구 | Burp Suite Community Edition 2024.2 — **User Options > Display > Language = 한국어** |
| 프런트 URL | `http://localhost:3000` (사장님/관리자 대시보드) |
| API URL | `http://localhost:8080` (Spring Boot Backend) |
| 테스트 계정 | `admin01 / adminpw` (관리자), `owner01 / ownerpw` (가맹점), `user001 / pw001` (일반 사용자) |

### 2.2 공통 재현 준비 단계
Step 0) Burp Suite를 실행한 뒤 `User Options > Display > Language`에서 **한국어**를 선택하고 Burp Suite를 재시작합니다. 이렇게 설정하면 한글 문자열이 깨지지 않으므로 패킷 분석이 정확해집니다.  
![공통-Step0](./evidence/common_step0_burp_language.png "Burp Suite 언어를 한국어로 변경한 화면")

이후 모든 취약점은 Burp 프록시를 통해 Chrome 트래픽을 가로채는 방식으로 재현했습니다.

---

## 3. 점검 요약

### 3.1 취약 항목 요약표
| ID | 점검 항목 | 위험도 | 취약점 발생 위치 | 파라미터 / 변조 값 | 판정 |
| --- | --- | --- | --- | --- | --- |
| V-01 | 주문 삭제 API 인증 우회 | 🔴 Critical | `GET http://localhost:8080/api/order/delete/{id}` | `id = 3` (다른 사용자의 주문 번호) | 취약 |
| V-02 | 주문 금액·주문자 조작 (Price Manipulation) | 🟠 High | `POST http://localhost:8080/api/order/update` | `totalPrice = 100`, `memberId = 999` | 취약 |
| V-03 | 포인트 무제한 적립 (입력 검증 부재) | 🟠 High | `POST http://localhost:8080/api/member/point/add` | `point = 999999999` | 취약 |
| V-04 | 추측 가능한 관리자 인증 정보 | 🟡 Medium | `POST http://localhost:8080/api/member/login` | `userid = admin01`, `userpw = adminpw` | 취약 |
| V-05 | 대시보드 화면 내 개인정보 평문 노출 | ⚪ 주의 | `GET http://localhost:8080/api/order/{id}` (대시보드 `/dashboard`) | 문의·주소·전화번호 전체 표시 | 주의 |

### 3.2 양호 및 재현 증적 확보 항목
| ID | 점검 항목 | 판정 | 근거 요약 |
| --- | --- | --- | --- |
| G-01 | 로그인 실패 시 상세 시스템 정보 미노출 | 양호 | 잘못된 비밀번호 입력 시 일반화된 메시지 “로그인 실패”만 노출되며 스택 트레이스/SQL 에러가 표시되지 않음. (증적: `./evidence/g01_login_fail.png`) |

### 3.3 평가 제외 및 데이터 부재 항목 정리
- **N/A**: 서비스 구조상 해당 기능이 존재하지 않아 점검 대상에서 제외된 경우 (예: GraphQL 미사용).
- **내용 없음**: 기능은 존재하지만 현재 테스트 데이터가 없어 재현 불가한 경우. 추후 운영 데이터 확보 후 재점검 필요.

---

## 4. 상세 진단 결과

### 공통 테스트 메모
- 모든 취약점 재현 시 Burp Suite의 Intercept를 활성화하여 요청과 응답을 저장했습니다.
- 모든 API 호출은 기본적으로 `Authorization: Bearer <JWT>` 헤더를 요구하지만, 코드 분석 결과 일부 엔드포인트는 실제로 토큰 검증을 수행하지 않았습니다.

### V-01. 주문 삭제 API 인증 우회 (Critical)
- **취약점 분류**: OWASP Top 10 2021 A01 – Broken Access Control  
- **취약점 발생 위치**: `GET http://localhost:8080/api/order/delete/3`  
- **취약점 발생 파라미터**: Path Parameter `id`  
- **변조한 파라미터 값**: `3` (타 사용자 주문 번호)  
- **재현 화면 경로**: 관리자 대시보드 → `주문 관리` → 주문 상세 → 우측 상단 `삭제` 버튼  
- **Burp 요청 캡처 위치**: Proxy > Intercept (한국어 UI)  
- **상태**: 취약

**요약**  
`OrderController.delete()` 메서드는 `jwtUtil.auth()`를 호출하지 않아 토큰 없이도 접근 가능합니다. 임의의 주문 번호를 전달하면 인증 없이 데이터베이스에서 해당 주문이 삭제됩니다.

**재현 절차**  
Step 1) 관리자 계정(`admin01 / adminpw`)으로 `http://localhost:3000/login`에 접속 후 로그인 버튼을 클릭합니다.  
![V01-Step1](./evidence/v01_step1_login.png "관리자 계정으로 로그인하는 화면")

Step 2) 사이드바에서 `주문 관리` 메뉴를 클릭한 뒤, 최근 주문 목록에서 주문 번호 `#3`을 확인합니다.  
![V01-Step2](./evidence/v01_step2_dashboard.png "주문 관리 화면에서 주문 번호를 확인하는 모습")

Step 3) Burp Suite에서 Intercept를 활성화한 상태로 브라우저 주소창에 `http://localhost:8080/api/order/delete/3`을 직접 입력합니다. 토큰 헤더 없이도 HTTP 200 응답과 함께 “주문 정보 삭제 완료” 메시지가 반환됩니다.  
![V01-Step3](./evidence/v01_step3_burp.png "Burp Suite에서 인증 없이 200 OK를 수신한 패킷")

**요청/응답 예시 (Burp Raw)**  
```http
GET /api/order/delete/3 HTTP/1.1
Host: localhost:8080
User-Agent: Mozilla/5.0
Accept: */*

HTTP/1.1 200
Content-Type: application/json

{"responseType":"SUCCESS","message":"주문 정보 삭제 완료","data":null}
```

**영향**  
- 인증 없는 공격자가 모든 주문을 삭제할 수 있으며, 이는 매출·정산 데이터의 영구 손실로 이어집니다.
- 로그 상으로는 정상적인 관리자 작업처럼 보이므로 사후 추적이 어렵습니다.

**개선 권고**  
- `OrderController.delete()`에서 `jwtUtil.auth(authHeader)` 호출 및 역할 검증(ADMIN 또는 해당 가맹점 OWNER)을 추가합니다.
- 삭제 요청을 `DELETE` 메서드로 변경하고 CSRF 차단 정책을 적용합니다.
- 삭제 이력을 감사 로그에 저장하여 추적 가능하도록 조치합니다.

---

### V-02. 주문 금액·주문자 조작 (High)
- **취약점 분류**: OWASP Top 10 2021 A05 – Security Misconfiguration / A04 – Insecure Design  
- **취약점 발생 위치**: `POST http://localhost:8080/api/order/update`  
- **취약점 발생 파라미터**: JSON Body `totalPrice`, `memberId`, `id`  
- **변조한 파라미터 값**: `totalPrice = 100`, `memberId = 999`, `id = 5`  
- **재현 화면 경로**: 관리자 대시보드 → `주문 관리` → 주문 카드 선택 → 상세 패널  
- **Burp 요청 캡처 위치**: Proxy > HTTP history에서 `POST /api/order/update` 전송  
- **상태**: 취약

**요약**  
`OrderController.update()`는 토큰 검증과 입력 필터링 없이 요청 본문을 그대로 `orderService.updateOrder()`에 전달합니다. 공격자는 타인의 주문 번호를 지정한 뒤 총 금액과 주문자 식별자를 원하는 값으로 덮어쓸 수 있습니다.

**재현 절차**  
Step 1) 가맹점 계정(`owner01`)으로 `http://localhost:3000/login` 로그인 후 `주문 관리` 페이지에서 주문 번호 `#5`의 정상 금액(8,000원)을 확인합니다.  
![V02-Step1](./evidence/v02_step1_order_view.png "주문 상세 화면에서 기존 금액을 확인하는 장면")

Step 2) Burp Suite Repeater에 아래 요청을 구성하고, `Authorization` 헤더 없이 전송합니다.  
![V02-Step2](./evidence/v02_step2_repeater.png "Burp Repeater에서 조작된 파라미터를 전송하는 모습")

Step 3) 다시 대시보드 화면을 새로고침하면 주문 `#5`의 총 금액이 8,000원에서 100원으로 변경되고, 주문자 정보 또한 임의 값으로 바뀐 것을 확인할 수 있습니다.  
![V02-Step3](./evidence/v02_step3_result.png "조작 이후 주문 금액이 100원으로 변경된 화면")

**조작 요청 샘플**  
```http
POST /api/order/update HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "id": 5,
  "memberId": 999,
  "storeId": 1,
  "menuId": 1,
  "quantity": 1,
  "totalPrice": 100
}
```

**영향**  
- 공격자는 가맹점 매출을 의도적으로 줄이거나, 특정 고객의 주문을 다른 사람에게 전가할 수 있습니다.
- 정산 데이터가 왜곡되어 회계 및 세무 리스크가 발생합니다.

**개선 권고**  
- `jwtUtil.auth()` 호출 후 토큰의 사용자·역할 정보를 이용해 주문 소유자 검증을 수행합니다.
- `memberId`, `totalPrice` 등 서버에서 재계산 가능한 필드는 무시하고 DB에서 가져온 값으로 대체합니다.
- 요청 Body에 대한 Bean Validation(`@Valid`)을 적용하고 허용되지 않은 필드를 제거합니다.

---

### V-03. 포인트 무제한 적립 (High)
- **취약점 분류**: OWASP Top 10 2021 A04 – Insecure Design  
- **취약점 발생 위치**: `POST http://localhost:8080/api/member/point/add`  
- **취약점 발생 파라미터**: JSON Body `point`  
- **변조한 파라미터 값**: `point = 999999999`  
- **재현 화면 경로**: 관리자 대시보드 → `마이페이지` → 하단 `포인트 충전` 버튼  
- **Burp 요청 캡처 위치**: Proxy > Intercept에서 `POST /api/member/point/add` 조작  
- **상태**: 취약

**요약**  
`addPoint()`는 현재 포인트에 요청값을 단순 더한 뒤 저장합니다. 한도 검증, 음수/과대 입력 제한, 중복 요청 방지가 없습니다.

**재현 절차**  
Step 1) Burp Suite Intercept ON 상태에서 `owner01` 계정으로 `http://localhost:3000/myinfo` 접속 후 “포인트 충전” 버튼을 클릭합니다.  
![V03-Step1](./evidence/v03_step1_myinfo.png "마이페이지에서 포인트 충전 API를 호출하는 화면")

Step 2) Burp에서 요청 Body의 `point` 값을 `999999999`로 수정하여 Forward합니다.  
![V03-Step2](./evidence/v03_step2_modify.png "Burp Intercept에서 포인트 값을 조작하는 모습")

Step 3) 응답으로 “포인트 충전 완료”가 반환되며, 대시보드 상단의 포인트 표시가 999,999,999포인트로 증가합니다.  
![V03-Step3](./evidence/v03_step3_result.png "조작 후 포인트가 비정상적으로 증가한 화면")

**조작 요청 샘플**  
```http
POST /api/member/point/add HTTP/1.1
Host: localhost:8080
Authorization: Bearer <정상 사용자 토큰>
Content-Type: application/json

{ "point": 999999999 }
```

**영향**  
- 별도의 결제 없이 포인트를 무제한으로 적립해 가맹점 매출과 정산 체계를 붕괴시킬 수 있습니다.
- 음수를 입력하면 포인트 차감도 가능하여 타인 포인트 탈취 시나리오로 이어질 수 있습니다.

**개선 권고**  
- 포인트 증감은 서버에서 비즈니스 규칙(최대 적립 한도, 일일 제한, 관리자 승인 등)을 검증하도록 변경합니다.
- 동시 요청에 대비해 `SELECT ... FOR UPDATE` 또는 DB 락, Redis 기반 분산 락을 적용합니다.
- 감사 로그에 적립 요청자와 값, IP를 저장하여 사후 추적이 가능하도록 구성합니다.

---

### V-04. 추측 가능한 관리자 자격 증명 (Medium)
- **취약점 분류**: OWASP Top 10 2021 A07 – Identification and Authentication Failures  
- **취약점 발생 위치**: `POST http://localhost:8080/api/member/login`  
- **취약점 발생 파라미터**: JSON Body `userid`, `userpw`  
- **변조한 파라미터 값**: `userid = admin01`, `userpw = adminpw` (사전 추측 가능 패턴)  
- **재현 화면 경로**: `http://localhost:3000/login` → ID/비밀번호 입력 후 `로그인` 버튼  
- **Burp 요청 캡처 위치**: Proxy > HTTP history에서 `POST /api/member/login` 확인  
- **상태**: 취약

**요약**  
초기 관리자 계정이 `admin01/adminpw`와 같이 쉽게 추측 가능한 패턴으로 생성되어 있으며, 추가적인 계정 잠금/2FA가 없어 무차별 대입 시 바로 접속이 가능합니다.

**재현 절차**  
Step 1) 로그인 페이지(`http://localhost:3000/login`)에 접근합니다.  
![V04-Step1](./evidence/v04_step1_login_page.png "관리자 로그인 페이지 모습")

Step 2) Burp Intercept OFF 상태에서 아이디 `admin01`, 비밀번호 `adminpw`를 입력하고 로그인 버튼을 클릭합니다.  
![V04-Step2](./evidence/v04_step2_input.png "쉬운 패턴의 자격 증명을 입력하는 장면")

Step 3) 로그인 성공 후 대시보드로 이동하면서 응답 본문에 JWT 토큰이 포함된 것을 확인합니다.  
![V04-Step3](./evidence/v04_step3_dashboard.png "관리자 대시보드에 성공적으로 진입한 화면")

**요청/응답 요약**  
```http
POST /api/member/login HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{"userid":"admin01","userpw":"adminpw"}

HTTP/1.1 200
{"responseType":"SUCCESS","data":{"token":"<JWT>","role":"ADMIN",...}}
```

**영향**  
- 외부인이 관리자 권한을 확보하여 데이터 삭제, 포인트 조작 등 모든 치명적 취약점을 연쇄적으로 악용할 수 있습니다.
- 기본 비밀번호가 그대로 배포될 경우 규제 준수(Personal Information Protection Act) 위반으로 이어질 수 있습니다.

**개선 권고**  
- 운영 배포 전 모든 기본 계정을 강제 초기화하고 복잡도 정책(대문자·특수문자 포함)을 적용합니다.
- 관리자 로그인 시 2단계 인증(OTP)을 도입합니다.
- 5회 이상 로그인 실패 시 계정을 잠그고 관리자에게 알림을 발송합니다.

---

### V-05. 대시보드 화면 내 개인정보 평문 노출 (주의)
- **점검 기준**: 개인정보보호법 제29조 기술적 보호조치 — 단말기 화면 내 중요정보 노출  
- **노출 화면 위치**: `http://localhost:3000/dashboard` → 주문 카드 선택 시 우측 상세 패널  
- **데이터 제공 API**: `GET http://localhost:8080/api/order/{id}`  
- **노출 항목**: 고객명, 전화번호, 주소, 결제 방법  
- **상태**: 주의 (보완 필요)

**요약**  
주문 상세 화면에 고객 이름·전화번호·주소가 그대로 노출됩니다. 가맹점 운영에는 필요하지만, 화면 캡처나 어깨너머 공격에 취약하며, 점주 계정 탈취 시 대량 개인정보 유출이 즉시 발생합니다.

**재현 절차**  
Step 1) `owner01` 계정으로 로그인 후 `주문 관리` 페이지에서 주문을 선택합니다.  
![V05-Step1](./evidence/v05_step1_dashboard.png "주문 목록에서 특정 주문을 선택하는 장면")

Step 2) 주문 상세 패널에서 고객 이름, 전화번호, 주소, 결제 방법이 모두 평문으로 표시되는 것을 확인합니다.  
![V05-Step2](./evidence/v05_step2_detail.png "주문 상세 정보에 개인정보가 평문으로 노출된 화면")

**영향 및 권고**  
- 오프라인 단말기에서 화면 노출 시 개인정보 오남용이 발생할 수 있습니다.
- 최소화 원칙에 따라 필요 정보만 표시하고, 전화번호·주소는 부분 마스킹 또는 클릭 시 팝업으로 노출하도록 개선합니다.
- 화면 캡처 방지 정책(워터마크, 관리자 경고 문구)과 접근 로그를 강화합니다.

---

## 5. 양호 항목 상세 증적

### G-01. 로그인 실패 시 상세 시스템 정보 미노출
Step 1) `http://localhost:3000/login` 화면에서 존재하지 않는 계정(`testuser`)과 잘못된 비밀번호를 입력합니다.  
![G01-Step1](./evidence/g01_step1_input.png "존재하지 않는 계정 정보를 입력하는 화면")

Step 2) Burp Suite로 응답을 확인하면 HTTP 200과 함께 사용자 메시지 “로그인 실패”만 노출되며, 내부 예외나 스택 트레이스가 반환되지 않습니다.  
![G01-Step2](./evidence/g01_step2_response.png "Burp Suite에서 확인한 로그인 실패 응답")

**판정 근거**  
- OWASP ASVS V2 “이상 징후 노출 금지” 요구사항을 충족합니다.
- 다만 반복 실패 시 계정 잠금 정책이 없으므로 V-04 조치와 함께 보완이 필요합니다.

### G-02. SQL Injection 상세 점검 결과
- **점검항목**: SQL Injection  
- **진단결과**: 양호  
- **취약점 개요**: (준비된 취약점 없음)  
- **점검목적**: 앱에서 받아들인 입력값이 서버 전송 과정에서 SQL 구문을 임의로 변경하지 못하도록 방어가 구현되어 있는지 확인합니다.  
- **보안위협**: 공격자가 쿼리 조작 문자열을 삽입하면 인증 우회, 회원·주문 데이터 조회 및 삭제, 시스템 명령 실행 등으로 이어질 수 있습니다.  
- **판단기준**  
  - 양호: 비정상 입력을 전달해도 서버가 에러 처리 또는 차단하고, 데이터가 노출·변조되지 않습니다.  
  - 취약: `' OR '1'='1`, `UNION SELECT` 등 페이로드로 인증 성공, 데이터 노출, 쿼리 구조 변경이 발생합니다.  
- **조치방법**: 서버는 PreparedStatement/ORM 바인딩을 사용하고 입력값을 화이트리스트·길이 제한으로 검증합니다. 앱은 쿼리 문자열 직접 조합을 지양하고, 에러 응답에 SQL 정보를 포함하지 않도록 합니다.  

**재현 절차 (방어 동작 확인)**  
Step 1) Burp Suite(언어: 한국어) Proxy를 활성화한 상태로 로그인 화면(`http://localhost:3000/login`)에서 임의 사용자 ID/비밀번호를 입력하고 `로그인` 버튼을 클릭합니다.  
![G02-Step1](./evidence/g02_step1_login.png "로그인 화면에서 잘못된 자격 증명을 입력하는 모습")

Step 2) Intercept된 요청의 `userid` 값을 `' OR '1'='1`로 바꾸고, `userpw`도 임의 값으로 유지한 채 Forward합니다. 서버는 HTTP 200과 함께 `responseType":"ERROR"` 및 메시지 “로그인 실패”를 반환하며 인증을 차단합니다. SQL 오류 메시지는 노출되지 않습니다.  
![G02-Step2](./evidence/g02_step2_burp.png "Burp Suite에서 SQL Injection 페이로드를 적용한 요청과 차단 응답")

Step 3) 동일한 페이로드를 주문 목록 API(`GET http://localhost:8080/api/order/list?id=' UNION SELECT ...`)에 적용했을 때 서버는 HTTP 400과 메시지 “잘못된 요청입니다.”를 반환하여 쿼리 구조가 변경되지 않았음을 확인합니다.  
![G02-Step3](./evidence/g02_step3_response.png "주문 API가 비정상 쿼리를 차단한 응답 화면")

**판정 근거 및 비고**  
- `MemberRepository`와 주요 DAO에서 `JdbcTemplate` 파라미터 바인딩을 사용하여 입력값이 문자열로 직접 연결되지 않음을 로그로 확인했습니다.  
- Burp Proxy 기록과 서버 로그 모두에서 SQL 스택 트레이스나 데이터 노출이 발생하지 않았습니다.  
- 공격 시도가 차단되었으므로 **양호** 판정(‘내용 없음’이 아닌 ‘공격 차단 확인’)으로 기록합니다.

---

## 6. 판정 용어 및 권장 대응 요약
- **취약**: 즉시 조치가 필요합니다. 개발팀은 2주 이내 수정 배포 계획을 수립한 뒤 보안팀에 공유합니다.
- **주의**: 운영 절차 또는 정책 보완이 필요합니다. 개선 로드맵에 포함합니다.
- **양호**: 현재 구현이 보안 요구사항을 충족합니다. 주기적으로 모니터링을 지속합니다.
- **N/A**: 서비스 기능이 부재하여 점검을 제외합니다. 기능 추가 시 재점검합니다.
- **내용 없음**: 기능이 존재하지만 데이터가 미수집 상태입니다. 운영 전 실제 데이터로 재검증합니다.

---

## 7. 참고 자료
- KISA 「웹 취약점 분석·평가 기준」 2024
- OWASP Top 10 (2021) – A01 Broken Access Control, A04 Insecure Design, A07 Identification and Authentication Failures
- OWASP Cheat Sheet Series – REST Security, Authentication
- 개인정보보호법 제29조 및 행정안전부 「개인정보의 안전성 확보조치 기준」

---

## 8. 차후 일정 제안
1. 개발팀: V-01, V-02, V-03 취약점 수정 코드를 2025-11-18까지 제출합니다.
2. 보안팀: 수정 배포 후 재검증을 수행하고 증적을 업데이트합니다.
3. 교육: 관리자 계정 관리 정책 및 Burp Suite 활용 재교육을 2025-11-25에 진행합니다.

---

**문의**  
보안팀 이메일: security@barobaedal.com  
담당자: 보안 담당자 A / 내선 1234
