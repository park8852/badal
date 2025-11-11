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
Step 0) Burp Suite 실행 → `User Options > Display > Language`에서 **한국어**를 선택 후 Burp Suite를 재시작한다. 이렇게 설정하면 한글 문자열이 깨지지 않으므로 패킷 분석이 정확해진다.  
![공통-Step0](./evidence/common_step0_burp_language.png "Burp Suite 언어를 한국어로 변경한 화면")

이후 모든 취약점은 Burp 프록시를 통해 Chrome 트래픽을 가로채는 방식으로 재현하였다.

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
- 모든 취약점 재현 시 Burp Suite의 Intercept를 활성화하여 요청/응답을 저장하였다.
- 모든 API 호출은 기본적으로 `Authorization: Bearer <JWT>` 헤더를 요구하지만, 코드 분석 결과 일부 엔드포인트는 실제로 토큰 검증을 수행하지 않았다.

### V-01. 주문 삭제 API 인증 우회 (Critical)
**취약점 분류**: OWASP Top 10 2021 A01 – Broken Access Control  
**취약점 발생 위치**: `GET http://localhost:8080/api/order/delete/{id}`  
**관련 화면**: 관리자 대시보드 → `주문 관리` → 주문 상세 → 삭제 버튼  
**취약점 발생 파라미터**: Path Parameter `id`  
**변조한 파라미터 값**: `3` (다른 사용자의 주문 번호)  
**상태**: 취약

**요약**  
`OrderController.delete()` 메서드는 `jwtUtil.auth()`를 호출하지 않아 토큰 없이도 접근 가능하다. 임의의 주문 번호를 전달하면 인증 없이 데이터베이스에서 해당 주문이 삭제된다.

**재현 절차**  
Step 1) 관리자 계정(`admin01 / adminpw`)으로 `http://localhost:3000/login`에 접속 후 로그인 버튼을 클릭한다.  
![V01-Step1](./evidence/v01_step1_login.png "관리자 계정으로 로그인하는 화면")

Step 2) 사이드바에서 `주문 관리` 메뉴를 클릭한 뒤, 최근 주문 목록에서 주문 번호 `#3`을 확인한다.  
![V01-Step2](./evidence/v01_step2_dashboard.png "주문 관리 화면에서 주문 번호를 확인하는 모습")

Step 3) Burp Suite에서 Intercept를 활성화한 상태로 브라우저 주소창에 `http://localhost:8080/api/order/delete/3`을 직접 입력한다. 토큰 헤더 없이도 HTTP 200 응답과 함께 “주문 정보 삭제 완료” 메시지가 반환된다.  
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
- 인증 없는 공격자가 모든 주문을 삭제할 수 있으며, 이는 매출/정산 데이터의 영구 손실로 이어짐.
- 로그 상으로는 정상적인 관리자 작업처럼 보이므로 사후 추적이 어려움.

**개선 권고**  
- `OrderController.delete()`에서 `jwtUtil.auth(authHeader)` 호출 및 역할 검증(ADMIN 또는 해당 가맹점 OWNER) 추가.
- 삭제 요청을 `DELETE` 메서드로 변경하고 CSRF 차단 정책 적용.
- 삭제 이력을 감사 로그에 저장하여 추적 가능하도록 조치.

---

### V-02. 주문 금액·주문자 조작 (High)
**취약점 분류**: OWASP Top 10 2021 A05 – Security Misconfiguration / A04 – Insecure Design  
**취약점 발생 위치**: `POST http://localhost:8080/api/order/update`  
**관련 화면**: 관리자 대시보드 → `주문 관리` → 주문 상세 → (수정 기능은 UI에 없으나 API 직접 호출 가능)  
**취약점 발생 파라미터**: JSON Body (`id`, `memberId`, `storeId`, `menuId`, `quantity`, `totalPrice`)  
**변조한 파라미터 값**: `totalPrice = 100`, `memberId = 999`  
**상태**: 취약

**요약**  
`OrderController.update()`는 토큰 검증과 입력 필터링 없이 요청 본문을 그대로 `orderService.updateOrder()`에 전달한다. 공격자는 타인의 주문 번호를 지정한 뒤 총 금액과 주문자 식별자를 원하는 값으로 덮어쓸 수 있다.

**재현 절차**  
Step 1) 가맹점 계정(`owner01`)으로 `http://localhost:3000/login` 로그인 후 `주문 관리` 페이지에서 주문 번호 `#5`의 정상 금액(8,000원)을 확인한다.  
![V02-Step1](./evidence/v02_step1_order_view.png "주문 상세 화면에서 기존 금액을 확인하는 장면")

Step 2) Burp Suite Repeater에 아래 요청을 구성하고, `Authorization` 헤더 없이 전송한다.  
![V02-Step2](./evidence/v02_step2_repeater.png "Burp Repeater에서 조작된 파라미터를 전송하는 모습")

Step 3) 다시 대시보드 화면을 새로고침하면 주문 `#5`의 총 금액이 8,000원에서 100원으로 변경되고, 주문자 정보 또한 임의 값으로 바뀐 것을 확인할 수 있다.  
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
- 공격자는 가맹점 매출을 의도적으로 줄이거나, 특정 고객의 주문을 다른 사람에게 전가 가능.
- 정산 데이터가 왜곡되어 회계 및 세무 리스크 발생.

**개선 권고**  
- `jwtUtil.auth()` 호출 후 토큰의 사용자/역할 정보를 이용해 주문 소유자 검증 수행.
- `memberId`, `totalPrice` 등 서버에서 재계산 가능한 필드는 무시하고 DB에서 가져온 값으로 대체.
- 요청 Body에 대한 Bean Validation (`@Valid`) 적용 및 허용되지 않은 필드 제거.

---

### V-03. 포인트 무제한 적립 (High)
**취약점 분류**: OWASP Top 10 2021 A04 – Insecure Design  
**취약점 발생 위치**: `POST http://localhost:8080/api/member/point/add`  
**관련 화면**: 관리자 대시보드 → `마이페이지` → 포인트 충전 (API 직접 호출)  
**취약점 발생 파라미터**: JSON Body `point`  
**변조한 파라미터 값**: `point = 999999999`  
**상태**: 취약

**요약**  
`addPoint()`는 현재 포인트에 요청값을 단순 더한 뒤 저장한다. 한도 검증, 음수/과대 입력 제한, 중복 요청 방지가 없다.

**재현 절차**  
Step 1) Burp Suite Intercept ON 상태에서 `owner01` 계정으로 `http://localhost:3000/myinfo` 접속 후 “포인트 충전” 버튼을 클릭한다.  
![V03-Step1](./evidence/v03_step1_myinfo.png "마이페이지에서 포인트 충전 API를 호출하는 화면")

Step 2) Burp에서 요청 Body의 `point` 값을 `999999999`로 수정하여 Forward한다.  
![V03-Step2](./evidence/v03_step2_modify.png "Burp Intercept에서 포인트 값을 조작하는 모습")

Step 3) 응답으로 “포인트 충전 완료”가 반환되며, 대시보드 상단의 포인트 표시가 999,999,999포인트로 증가한다.  
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
- 별도의 결제 없이 포인트를 무제한으로 적립해 가맹점 매출과 정산 체계를 붕괴시킴.
- 음수를 입력하면 포인트 차감도 가능하여 타인 포인트 탈취 시나리오 연결 가능.

**개선 권고**  
- 포인트 증감은 서버에서 비즈니스 규칙(최대 적립 한도, 일일 제한, 관리자 승인 등)을 검증하도록 변경.
- 동시요청에 대비해 `SELECT ... FOR UPDATE` 또는 DB 락, Redis 기반 분산 락 적용.
- 감사 로그에 적립 요청자와 값, IP를 저장하여 사후 추적 가능하게 구성.

---

### V-04. 추측 가능한 관리자 인증 정보 (Medium)
**취약점 분류**: OWASP Top 10 2021 A07 – Identification and Authentication Failures  
**취약점 발생 위치**: `POST http://localhost:8080/api/member/login`  
**관련 화면**: `http://localhost:3000/login`  
**취약점 발생 파라미터**: `userid`, `userpw`  
**변조한 파라미터 값**: `userid = admin01`, `userpw = adminpw`  
**상태**: 취약

**요약**  
초기 관리자 계정이 `admin01/adminpw`와 같이 쉽게 추측 가능한 패턴으로 생성되어 있으며, 추가적인 계정 잠금/2FA가 없어 무차별 대입 시 바로 접속이 가능하다.

**재현 절차**  
Step 1) 로그인 페이지(`http://localhost:3000/login`)에 접근한다.  
![V04-Step1](./evidence/v04_step1_login_page.png "관리자 로그인 페이지 모습")

Step 2) Burp Intercept OFF 상태에서 아이디 `admin01`, 비밀번호 `adminpw`를 입력하고 로그인 버튼을 클릭한다.  
![V04-Step2](./evidence/v04_step2_input.png "쉬운 패턴의 자격 증명을 입력하는 장면")

Step 3) 로그인 성공 후 대시보드로 이동하면서 응답 본문에 JWT 토큰이 포함된 것을 확인한다.  
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
- 외부인이 관리자 권한을 확보하여 데이터 삭제, 포인트 조작 등 모든 치명적 취약점을 연쇄적으로 악용할 수 있음.
- 기본 비밀번호가 그대로 배포될 경우 규제 준수(Personal Information Protection Act) 위반 가능.

**개선 권고**  
- 운영 배포 전 모든 기본 계정 강제 초기화 및 복잡도 정책(대문자/특수문자 포함)을 적용.
- 관리자 로그인 시 2단계 인증(OTP) 도입.
- 5회 이상 로그인 실패 시 계정 잠금 및 관리자 알림.

---

### V-05. 대시보드 화면 내 개인정보 평문 노출 (주의)
**취약점 분류**: 개인정보보호법 제29조 기술적 보호조치 — 단말기 화면 내 중요정보 노출  
**취약점 발생 위치**: `http://localhost:3000/dashboard` (API `GET /api/order/{id}`)  
**노출 항목**: 고객명, 전화번호, 주소, 결제 방법  
**상태**: 주의 (보완 필요)

**요약**  
주문 상세 화면에 고객 이름·전화번호·주소가 그대로 노출된다. 가맹점 운영에는 필요하지만, 화면 캡처나 어깨너머 공격에 취약하며, 점주 계정 탈취 시 대량 개인정보 유출이 즉시 발생한다.

**재현 절차**  
Step 1) `owner01` 계정으로 로그인 후 `주문 관리` 페이지에서 주문을 선택한다.  
![V05-Step1](./evidence/v05_step1_dashboard.png "주문 목록에서 특정 주문을 선택하는 장면")

Step 2) 주문 상세 패널에서 고객 이름, 전화번호, 주소, 결제 방법이 모두 평문으로 표시되는 것을 확인한다.  
![V05-Step2](./evidence/v05_step2_detail.png "주문 상세 정보에 개인정보가 평문으로 노출된 화면")

**영향 및 권고**  
- 오프라인 단말기에서 화면 노출 시 개인정보 오남용 가능.
- 최소화 원칙에 따라 필요 정보만 표시하고, 전화번호·주소는 부분 마스킹 또는 클릭 시 팝업으로 노출하도록 개선.
- 화면 캡처 방지 정책(워터마크, 관리자 경고 문구) 및 접근 로그 강화.

---

## 5. 양호 항목 상세 증적

### G-01. 로그인 실패 시 상세 시스템 정보 미노출
Step 1) `http://localhost:3000/login` 화면에서 존재하지 않는 계정(`testuser`)과 잘못된 비밀번호를 입력한다.  
![G01-Step1](./evidence/g01_step1_input.png "존재하지 않는 계정 정보를 입력하는 화면")

Step 2) Burp Suite로 응답을 확인하면 HTTP 200과 함께 사용자 메시지 “로그인 실패”만 노출되며, 내부 예외나 스택 트레이스가 반환되지 않는다.  
![G01-Step2](./evidence/g01_step2_response.png "Burp Suite에서 확인한 로그인 실패 응답")

**판정 근거**  
- OWASP ASVS V2 “이상 징후 노출 금지” 요구사항을 충족한다.
- 다만 반복 실패 시 계정 잠금 정책이 없으므로 V-04 조치와 함께 보완 필요.

### G-02. SQL Injection 상세 점검 결과
- **점검항목**: SQL Injection  
- **진단결과**: 양호  
- **취약점 개요**: (준비된 취약점 없음)  
- **점검목적**: 앱에서 받아들인 입력값이 서버 전송 과정에서 SQL 구문을 임의로 변경하지 못하도록 방어가 구현되어 있는지 확인한다.  
- **보안위협**: 공격자가 쿼리 조작 문자열을 삽입하면 인증 우회, 회원·주문 데이터 조회 및 삭제, 시스템 명령 실행 등으로 이어질 수 있다.  
- **판단기준**  
  - 양호: 비정상 입력을 전달해도 서버가 에러 처리 또는 차단하고, 데이터가 노출·변조되지 않는다.  
  - 취약: `' OR '1'='1`, `UNION SELECT` 등 페이로드로 인증 성공, 데이터 노출, 쿼리 구조 변경이 발생한다.  
- **조치방법**: 서버는 PreparedStatement/ORM 바인딩을 사용하고 입력값을 화이트리스트·길이 제한으로 검증한다. 앱은 쿼리 문자열 직접 조합을 지양하고, 에러 응답에 SQL 정보를 포함하지 않도록 한다.  
- **진단 세부 사항(취약점 발생 시)**: N/A

---

## 6. 판정 용어 및 권장 대응 요약
- **취약**: 즉시 조치 필요. 개발팀은 2주 이내 수정 배포 계획 수립 후 보안팀에 공유.
- **주의**: 운영 절차 또는 정책 보완 필요. 개선 로드맵에 포함.
- **양호**: 현재 구현이 보안 요구사항을 충족. 주기적 모니터링 지속.
- **N/A**: 서비스 기능 부재로 점검 제외. 기능 추가 시 재점검.
- **내용 없음**: 기능 존재하나 데이터 미수집. 운영 전 실제 데이터로 재검증 필요.

---

## 7. 참고 자료
- KISA 「웹 취약점 분석·평가 기준」 2024
- OWASP Top 10 (2021) – A01 Broken Access Control, A04 Insecure Design, A07 Identification and Authentication Failures
- OWASP Cheat Sheet Series – REST Security, Authentication
- 개인정보보호법 제29조 및 행정안전부 「개인정보의 안전성 확보조치 기준」

---

## 8. 차후 일정 제안
1. 개발팀: V-01, V-02, V-03 취약점 수정 코드를 2025-11-18까지 제출.
2. 보안팀: 수정 배포 후 재검증 및 증적 업데이트.
3. 교육: 관리자 계정 관리 정책 및 Burp Suite 활용 재교육(2025-11-25 예정).

---

**문의**  
보안팀 이메일: security@barobaedal.com  
담당자: 보안 담당자 A / 내선 1234
