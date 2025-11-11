# SQL Injection 상세 점검 결과

## 점검 항목
- SQL Injection

## 진단 결과
- 양호

## 점검 목적
앱에서 받아들인 입력값이 서버 전송 과정에서 SQL 구문을 임의로 변경하지 못하도록 방어가 구현되어 있는지 확인합니다.

## 보안 위협
공격자가 쿼리 조작 문자열을 삽입하면 인증 우회, 회원·주문 데이터 조회 및 삭제, 시스템 명령 실행 등으로 이어질 수 있습니다.

## 판단 기준
- **양호**: 비정상 입력을 전달해도 서버가 에러 처리 또는 차단하고, 데이터가 노출·변조되지 않습니다.
- **취약**: `' OR '1'='1`, `UNION SELECT` 등 페이로드로 인증 성공, 데이터 노출, 쿼리 구조 변경이 발생합니다.

## 조치 방법
서버는 PreparedStatement/ORM 바인딩을 사용하고 입력값을 화이트리스트·길이 제한으로 검증합니다. 앱은 쿼리 문자열 직접 조합을 지양하고, 에러 응답에 SQL 정보를 포함하지 않도록 합니다.

## 상세 점검 결과
- **테스트 URL**: `POST http://localhost:8080/api/member/login`  
- **테스트 파라미터**: JSON Body `userid`, `userpw`
- **사용 페이로드**: `' OR '1'='1`
- **Burp 설정**: Proxy > Options > Display Language = 한국어

### 재현 절차 (방어 동작 확인)
Step 1) 프런트 화면 `http://localhost:3000/login`에서 임의 계정을 입력한 뒤, Burp Suite Intercept ON 상태로 `로그인` 버튼을 클릭합니다.  
![G02-Step1](./evidence/g02_step1_login.png "로그인 화면에서 잘못된 자격을 입력한 모습")

Step 2) Intercept 패널에서 `userid` 값을 `' OR '1'='1`로 변경하고 요청을 전송합니다. 응답은 HTTP 200이며 `responseType":"ERROR"`와 “로그인 실패” 메시지가 반환되어 인증이 차단됩니다.  
![G02-Step2](./evidence/g02_step2_burp.png "Burp Suite에서 SQL Injection 페이로드를 적용한 요청과 차단 응답")

Step 3) 동일 페이로드를 주문 목록 API(`GET http://localhost:8080/api/order/list?id=' UNION SELECT ...`)에 적용해도 HTTP 400과 “잘못된 요청입니다.” 메시지가 반환되어 데이터 노출이 발생하지 않습니다.  
![G02-Step3](./evidence/g02_step3_response.png "주문 API가 비정상 쿼리를 차단한 응답 화면")

### 판정 근거
- 주요 Repository가 PreparedStatement/ORM 바인딩을 사용하고 있으며, 공격 시도 시 SQL 스택 트레이스가 노출되지 않습니다.
- Burp Proxy와 서버 로그 모두에서 데이터 조회·변조가 발생하지 않아 **양호**로 판정합니다.
