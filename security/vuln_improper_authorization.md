# 부적절한 이용자 인가 여부 점검 결과

## 점검 항목
- 부적절한 이용자 인가 여부

## 진단 결과
- 취약

## 점검 목적
- 로그인 후 각 기능·API 호출 시 사용자의 역할(Role)과 권한이 서버에서 재검증되는지, 클라이언트에서 UI 숨김만으로 인가를 대체하지 않았는지 점검함

## 보안 위협
- 공격자가 일반 사용자 토큰으로 관리자·점주 전용 API를 호출해 주문 상태 변경, 정산 조회, 계정 관리 등 민감 기능을 실행할 수 있음  
- 이는 데이터 위·변조와 서비스 운영 교란으로 이어질 수 있음

## 판단 기준
- **양호**: 권한이 없는 토큰으로 요청 시 403 또는 권한 부족 오류가 발생하며, 클라이언트 UI 숨김만으로는 기능이 실행되지 않음  
- **취약**: 권한이 없는 계정으로 관리자 API 호출이 성공하거나, 숨겨진 버튼의 URL만 알면 기능 실행이 가능함

## 조치 방법
- 서버 측에서 RBAC(Role-Based Access Control) 또는 ABAC(Attribute-Based Access Control) 기반 인가 검증을 구현할 것  
- 모든 민감 API에서 토큰의 역할을 확인하고 권한이 없으면 즉시 차단할 것

## 진단 세부 사항
- 주문 관리용 백엔드 API 일부가 인증·인가 검증 없이 호출 가능함  
- 모바일 앱 UI에는 해당 기능이 노출되지 않지만, 서버에서 `/api/order/delete/{id}`, `/api/order/update` 엔드포인트를 그대로 제공하며 Authorization 헤더 검증이 누락되어 있어 누구나 호출 가능함

### 재현 절차
1. `GET /api/order/list` 요청으로 실제 주문 ID 목록을 확인함  
   ![Step1](./evidence/improper_auth_step1_list.png "주문 목록 조회 응답")
2. 확인된 주문 ID에 대해 `POST /api/order/update` 또는 `GET /api/order/delete/{id}` 요청을 생성함  
   ![Step2](./evidence/improper_auth_step2_request.png "인가 없이 주문 수정 요청")
3. Authorization 헤더를 제거하거나 임의 문자열로 설정한 상태에서도 `{"responseType":"SUCCESS"}` 응답을 수신함  
   ![Step3](./evidence/improper_auth_step3_success.png "권한 없이도 성공 응답을 받은 화면")

## 영향
- 권한이 없는 사용자가 주문 삭제·수정, 정산 정보 변경, 계정 관리 등 민감 기능을 실행할 수 있음  
- 데이터 변조, 재무 정보 노출, 서비스 운영 중단 등의 심각한 피해로 이어질 수 있음

## 개선 권고
- 모든 주문·정산·계정 관련 API에서 JWT 토큰의 역할(Role)을 검증하고, 권한이 부족하면 403을 반환할 것  
- 서버 코드에서 `OrderController.delete`, `OrderController.update` 등 인가 누락 메서드를 검토하여 RBAC 검증을 추가할 것  
- 보안 로그에 권한 실패 이벤트를 기록하고 이상 접근을 모니터링할 것
