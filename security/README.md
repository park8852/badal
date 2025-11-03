# 바로배달(BaroBaedal) 보안 프로젝트

## 📁 파일 구조

```
security/
├── README.md                           # 이 파일 (프로젝트 개요)
├── vulnerability_assessment_list.md    # 취약점 진단 리스트 (OWASP, KISA 기준)
└── penetration_test_scenarios.md       # 모의해킹 시나리오 5가지
```

## 📋 프로젝트 개요

바로배달 배달 플랫폼 서비스의 보안 취약점을 분석하고, 실제적인 모의해킹 시나리오를 제공합니다.

### 주요 내용
1. **취약점 진단 기준**: OWASP Top 10, KISA 취약점 분석·평가 기준
2. **실제 소스코드에 취약점 삽입**: SQL Injection, XSS, 파일 업로드
3. **비즈니스 관점의 공격 시나리오**: 금전적 피해 중심

---

## 🔓 삽입된 취약점 위치

### 1. SQL Injection
- **파일**: `Backend/src/main/java/com/barobaedal/barobaedal/members/repository/MemberRepository.java`
- **메서드**: `checkLoginVulnerable()`
- **위험도**: 🔴 Critical

```java
public boolean checkLoginVulnerable(String userid, String userpw) {
    // 사용자 입력을 직접 SQL에 연결
    String sql = "SELECT COUNT(*) FROM members WHERE userid = '" + userid + "' AND userpw = '" + userpw + "'";
    Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
    return count != null && count > 0;
}
```

### 2. 파일 업로드 취약점
- **파일**: `Backend/src/main/java/com/barobaedal/barobaedal/common/FileStorageService.java`
- **메서드**: `storeFileVulnerable()`
- **위험도**: 🔴 Critical

```java
public String storeFileVulnerable(MultipartFile file) throws IOException {
    String filename = file.getOriginalFilename();
    Path target = uploadDir.resolve(filename);  // 검증 없음
    Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
    return "/upload/" + filename;
}
```

### 3. 비즈니스 로직 취약점 (기존 존재)
- **파일**: `Backend/src/main/java/com/barobaedal/barobaedal/members/controller/MemberController.java`
- **메서드**: `addPoint()`
- **위험도**: 🔴 Critical

```java
@PostMapping("/point/add")
public CommonResponse<Object> addPoint(@RequestBody PointDto pointDto) {
    Integer userPoint = memberService.getMemberPoint(userid);
    int setPoint = userPoint + pointDto.getPoint();  // 검증 없음
    memberService.updatePoint(userid, setPoint);
}
```

---

## 🎯 모의해킹 시나리오 3가지 (비즈니스 중심)

### 시나리오 1: 포인트 무한 충전 공격 💰
- **목적**: 실제 결제 없이 포인트 무한 충전
- **피해**: 수천만원 상당의 무료 주문
- **취약점**: 음수 입력, 최대 금액 제한 없음
- **상세**: [penetration_test_scenarios.md](./penetration_test_scenarios.md#시나리오-1-포인트-무한-충전-공격-)

### 시나리오 2: 주문 가격 조작 공격 🍗
- **목적**: 저렴하게 메뉴 주문
- **피해**: 가게 매출 손실, 정산 불일치
- **취약점**: 주문 수정 API의 가격 검증 부족
- **상세**: [penetration_test_scenarios.md](./penetration_test_scenarios.md#시나리오-2-주문-가격-조작-공격-)

### 시나리오 3: SQL Injection + 권한 상승 복합 공격 🚨
- **목적**: 관리자 권한 획득
- **피해**: 전체 사용자 개인정보 유출, 시스템 장악
- **취약점**: SQL Injection, 비밀번호 평문 저장 가능성
- **상세**: [penetration_test_scenarios.md](./penetration_test_scenarios.md#시나리오-3-sql-injection--권한-상승-복합-공격-)

---

## 📊 취약점 진단 리스트

### 주요 카테고리

1. **인증 및 세션 관리**
   - JWT 토큰 관리 취약점
   - 비밀번호 정책
   - 계정 잠금 정책

2. **입력 검증 및 출력 인코딩**
   - SQL Injection
   - XSS (Cross-Site Scripting)
   - Command Injection

3. **파일 업로드**
   - 파일 확장자 검증
   - 경로 조작
   - 악성 파일 업로드

4. **권한 관리**
   - 수직 권한 상승
   - 수평 권한 상승
   - IDOR (Insecure Direct Object Reference)

5. **비즈니스 로직**
   - 포인트 시스템
   - 주문 시스템
   - 정산 시스템

**전체 리스트**: [vulnerability_assessment_list.md](./vulnerability_assessment_list.md)

---

## 🛠️ 테스트 방법

### 1. 환경 구성
```bash
# Backend 서버 실행
cd Backend
./gradlew bootRun

# 서버 주소
http://localhost:8080
```

### 2. Burp Suite 설치
- Burp Suite Community Edition 다운로드
- Proxy 설정 (127.0.0.1:8080)
- Intercept 활성화

### 3. SQL Injection 테스트
```bash
# 정상 로그인
curl -X POST http://localhost:8080/api/member/login \
  -H "Content-Type: application/json" \
  -d '{"userid":"user001","userpw":"pw001"}'

# SQL Injection 시도
curl -X POST http://localhost:8080/api/member/login \
  -H "Content-Type: application/json" \
  -d '{"userid":"admin'\'' OR '\''1'\''='\''1","userpw":"anything"}'
```

### 4. 포인트 충전 테스트
```bash
# 포인트 조회
curl http://localhost:8080/api/member/point/info \
  -H "Authorization: Bearer <TOKEN>"

# 음수 포인트 충전 (취약점 테스트)
curl -X POST http://localhost:8080/api/member/point/add \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"point":-999999999}'
```

---

## 📈 우선순위

### 🔴 Critical (즉시 수정 필요)
1. SQL Injection 취약점
2. 포인트 무한 충전
3. 파일 업로드 검증

### 🟡 High (높음)
4. 주문 가격 조작
5. JWT 토큰 관리
6. 권한 상승

### 🟢 Medium (중간)
7. XSS 방어
8. 로깅 정보 노출

---

## 📚 참고 자료

### 국제 표준
- [OWASP Top 10 (2021)](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [ISO/IEC 27001](https://www.iso.org/isoiec-27001-information-security.html)

### 국내 가이드
- [KISA 취약점 분석·평가 기준](https://www.kisa.or.kr)
- 개인정보보호법
- 정보통신망법

### 도구
- [Burp Suite](https://portswigger.net/burp)
- [OWASP ZAP](https://www.zaproxy.org/)
- [SQLMap](http://sqlmap.org/)

---

## ⚠️ 주의사항

1. **이 프로젝트는 교육 목적으로만 사용하세요**
2. **실제 운영 환경에 적용하지 마세요**
3. **취약점 삽입 메서드는 `Vulnerable` 접미사로 표시됨**
4. **실제 서비스에서는 안전한 메서드 사용**

---

## 📞 문의

보안 관련 문의사항이 있으시면 이슈를 등록해주세요.

**"실제 피해를 방지하기 위한 사전 보안 검증 프로젝트"**

