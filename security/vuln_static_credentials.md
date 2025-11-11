# 고정된 인증정보 이용 점검 결과

## 점검 항목
- 고정된 인증정보 이용

## 진단 결과
- 양호

## 점검 목적
- APK 내부에 하드코딩된 계정, 마스터 키, API Key 등이 존재하지 않는지 확인함

## 보안 위협
- 리버스 엔지니어링으로 누구나 동일 자격증명을 확보해 서버·외부 서비스에 무단 접근할 수 있음

## 판단 기준
- **양호**: 인증정보가 실행 중 서버에서 동적으로 발급되거나 보안 저장소에 암호화되어 저장됨
- **취약**: 소스·리소스 파일에 고정된 계정, 키, 토큰이 평문으로 포함되어 있음

## 조치 방법
- 하드코딩을 제거하고 Android Keystore/EncryptedSharedPreferences 등 보안 저장소를 활용할 것  
- 필요한 정보는 서버에서 발급·주기적으로 갱신할 것

## 진단 세부 사항
- APK 디컴파일 후 자바·리소스·환경 파일을 전수 검사했으나 고정된 계정, API Key, 마스터 토큰이 발견되지 않음
- 민감 문자열은 모두 런타임 시 서버에서 수신하거나 로컬에 저장되지 않는 패턴으로 확인됨

### 재현 절차 (검증 과정)
Step 1) `apktool d baro-baedal.apk` 명령으로 APK를 디컴파일함  
![Step1](./evidence/static_credentials_step1_decompile.png "apktool로 디컴파일한 결과 디렉터리")

Step 2) `grep -R "api_key" -n ./baro-baedal` 등 키워드 검색을 수행하고 민감 문자열 리스트를 점검함  
![Step2](./evidence/static_credentials_step2_grep.png "grep을 이용해 키워드 검색")

Step 3) `smali/com/barobaedal/...` 및 `res/values/strings.xml` 파일을 검토했으나 계정·토큰이 평문으로 포함되지 않았음을 확인함  
![Step3](./evidence/static_credentials_step3_review.png "smali 및 strings 리소스 검토 결과")

## 영향
- 현재 APK에는 고정된 인증정보가 없어 리버스 엔지니어링 시 자격 증명이 노출될 위험이 낮음

## 개선 권고
- 향후 민감 토큰이 필요할 경우 하드코딩을 금지하고 서버 발급·주기적 로테이션 정책을 유지할 것  
- 로컬 저장이 필요한 경우 Android Keystore 또는 EncryptedSharedPreferences를 사용해 암호화 저장할 것  
- 배포 전 정적 분석 스크립트를 통해 하드코딩 여부를 자동 점검하고 발견 시 빌드를 차단할 것
