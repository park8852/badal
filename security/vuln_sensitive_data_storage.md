# 단말기 내 중요정보 저장 여부 점검 결과

## 점검 항목
- 단말기 내 중요정보 저장 여부

## 진단 결과
- 취약

## 점검 목적
- 인증 토큰, 계좌 정보 등 민감 데이터가 단말에 평문으로 저장되지 않는지 확인함

## 보안 위협
- 분실·루팅 시 파일 탐색만으로 토큰과 개인정보가 유출될 수 있음

## 판단 기준
- **양호**: 민감 정보는 저장하지 않거나 Keystore/EncryptedSharedPreferences 등으로 암호화함
- **취약**: SharedPreferences, 내부/외부 저장소에 평문으로 토큰·주민번호 등을 보관함

## 조치 방법
- 저장을 최소화하고 반드시 암호화 저장소를 사용할 것  
- 외부 저장소에는 민감 정보를 저장하지 않으며, 사용 후 즉시 삭제할 것

## 진단 세부 사항
- 모바일 앱은 로그인 후 JWT 토큰을 Jetpack DataStore(Preferences)에 그대로 저장함  
- DataStore는 내부 저장소를 사용하지만 암호화를 제공하지 않아 루팅·백업·디버그 환경에서 토큰이 평문으로 노출됨

### 재현 절차
1. 앱에서 로그인하여 JWT 토큰이 발급되도록 함  
   ![Step1](./evidence/sensitive_storage_step1_login.png "로그인 후 토큰 발급 화면")
2. 루팅된 환경에서 앱 데이터 디렉터리 접근  
   ```bash
   adb shell
   su
   cd /data/data/com.baro.baro_baedal/files/datastore
   ```
   ![Step2](./evidence/sensitive_storage_step2_shell.png "앱 데이터 디렉터리 접근")
3. `app_prefs.preferences_pb` 파일을 확인  
   ```bash
   cat app_prefs.preferences_pb
   ```
   ![Step3](./evidence/sensitive_storage_step3_cat.png "preferences_pb 파일 확인")
4. 평문 문자열로 JWT 토큰 값이 포함되어 있음을 확인함  
   ![Step4](./evidence/sensitive_storage_step4_token.png "평문으로 저장된 토큰")

## 영향
- 단말 분실·루팅·백업본 노출 시 토큰을 쉽게 추출할 수 있어 계정 도용, 주문·포인트 조작 등이 발생할 수 있음  
- 앱 자체 디버그, 악성 앱 등 내부 저장소 접근이 가능한 상황에서 인증 정보가 그대로 노출됨

## 개선 권고
- JWT 등 인증 정보는 저장을 최소화하거나 EncryptedSharedPreferences·Android Keystore로 암호화 저장할 것  
- 필요 시 토큰을 메모리에만 유지하고, 만료 시 즉시 무효화하도록 서버와 연동할 것  
- 백업 기능이 활성화된 경우 민감 데이터가 백업되지 않도록 `allowBackup="false"` 설정을 검토할 것
