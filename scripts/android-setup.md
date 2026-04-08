# Android 빌드 환경 설정 가이드

## 1. Android Studio 설치 (필수)

1. https://developer.android.com/studio 접속
2. "Download Android Studio" 클릭 → 설치 실행
3. 설치 완료 후 Android Studio 최초 실행
4. "SDK Manager" → 다음 항목 설치:
   - Android SDK Platform 35 (Android 15)
   - Android SDK Build-Tools
   - Android Emulator

## 2. 환경 변수 설정

설치 후 `android/local.properties` 파일에 SDK 경로를 작성:

```
sdk.dir=C:\\Users\\USER\\AppData\\Local\\Android\\Sdk
```

또는 시스템 환경 변수:
```
ANDROID_HOME = C:\Users\USER\AppData\Local\Android\Sdk
```

## 3. 갤럭시 S26 테스트 방법

### 방법 A: 실기기 (권장)
1. 갤럭시 S26 → 설정 → 개발자 옵션 → USB 디버깅 ON
2. USB 연결
3. `npm run android` 실행

### 방법 B: 에뮬레이터
1. Android Studio → Device Manager → Create Device
2. Phone → Pixel 9 Pro (S26과 유사한 해상도)
3. API 35 (Android 15) 선택
4. `npm run android` 실행

## 4. APK 빌드 명령어

```bash
# 디버그 APK (테스트용)
npm run android:sync
cd android
./gradlew assembleDebug
# 결과: android/app/build/outputs/apk/debug/app-debug.apk

# 릴리즈 APK (Play Store 제출용)
./gradlew bundleRelease
# 결과: android/app/build/outputs/bundle/release/app-release.aab
```

## 5. 앱 서명 (릴리즈 빌드 필수)

### 키스토어 생성 (최초 1회)
```bash
keytool -genkey -v -keystore card-survival.keystore \
  -alias card-survival -keyalg RSA -keysize 2048 -validity 10000
```

### android/app/build.gradle에 서명 설정 추가
```groovy
android {
    signingConfigs {
        release {
            storeFile file('../../card-survival.keystore')
            storePassword 'YOUR_STORE_PASSWORD'
            keyAlias 'card-survival'
            keyPassword 'YOUR_KEY_PASSWORD'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

> ⚠️ keystore 파일은 절대 git에 커밋하지 마세요!
> .gitignore에 `*.keystore` 추가 필요.

## 6. Phase 4 - Google Play Billing (IAP)

Android Studio 설정 완료 후:

```bash
npm install @revenuecat/purchases-capacitor
npx cap sync android
```

RevenueCat 계정 생성: https://app.revenuecat.com
- 앱 등록: com.cardsurvival.ruinedcity
- Google Play API 연동
- 상품 ID 등록 (char_doctor, char_soldier 등)
