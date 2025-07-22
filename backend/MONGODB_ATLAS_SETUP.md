# 🗄️ MongoDB Atlas 설정 가이드

## 📋 개요
CloudType 배포를 위한 MongoDB Atlas 클러스터 생성 및 연결 설정 가이드입니다.

## 🚀 1단계: MongoDB Atlas 계정 생성

1. **MongoDB Atlas 접속**
   - https://www.mongodb.com/cloud/atlas 방문
   - "Try Free" 클릭하여 계정 생성

2. **계정 설정**
   - 이메일 주소와 비밀번호 입력
   - 이메일 인증 완료

## 🔧 2단계: 클러스터 생성

1. **새 프로젝트 생성**
   - "New Project" 클릭
   - 프로젝트명: `ar-namecard-project`
   - "Next" → "Create Project"

2. **클러스터 구성**
   - "Build a Database" 클릭
   - **M0 Sandbox (FREE)** 선택
   - Provider: **AWS**
   - Region: **Seoul (ap-northeast-2)** 또는 **Singapore (ap-southeast-1)**
   - Cluster Name: `ar-namecard-cluster`

3. **보안 설정**
   - **Database User 생성:**
     - Username: `arNamecardUser`
     - Password: 강력한 비밀번호 생성 (기록해두기!)
     - Database User Privileges: "Read and write to any database"
   
   - **네트워크 접근 설정:**
     - "Add IP Address" 클릭
     - **0.0.0.0/0** 입력 (모든 IP 허용 - CloudType용)
     - Description: "CloudType Access"

## 🔗 3단계: 연결 문자열 생성

1. **Connect 버튼 클릭**
   - "Connect your application" 선택
   - Driver: **Node.js**
   - Version: **4.1 or later**

2. **연결 문자열 복사**
   ```
   mongodb+srv://arNamecardUser:<password>@ar-namecard-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

3. **데이터베이스명 추가**
   ```
   mongodb+srv://arNamecardUser:<password>@ar-namecard-cluster.xxxxx.mongodb.net/ar_namecard?retryWrites=true&w=majority
   ```

## ⚙️ 4단계: CloudType 환경변수 설정

CloudType 배포 시 다음 환경변수를 설정하세요:

```bash
# MongoDB Atlas 연결
MONGODB_URI=mongodb+srv://arNamecardUser:your_password@ar-namecard-cluster.xxxxx.mongodb.net/ar_namecard?retryWrites=true&w=majority

# 프로덕션 환경
NODE_ENV=production

# JWT 설정
JWT_SECRET=your-production-jwt-secret-key
JWT_EXPIRES_IN=24h

# Firebase 설정
FIREBASE_PROJECT_ID=hninepeople
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@hninepeople.iam.gserviceaccount.com

# CORS 설정
CORS_ALLOW_ALL=false
```

## 🔍 5단계: 연결 테스트

1. **로컬에서 테스트 (선택사항)**
   ```bash
   # 임시로 .env 파일에 Atlas URI 설정하여 테스트
   # MONGODB_URI=mongodb+srv://...
   npm run dev
   ```

2. **Atlas 대시보드에서 확인**
   - "Database" → "Browse Collections"
   - 연결 성공 시 데이터베이스와 컬렉션이 생성됨

## 📊 6단계: 모니터링 설정

1. **Atlas 대시보드에서 모니터링**
   - "Metrics" 탭: 성능 지표 확인
   - "Real Time" 탭: 실시간 활동 모니터링
   - "Profiler" 탭: 쿼리 성능 분석

2. **알림 설정 (선택사항)**
   - "Alerts" → "Create Alert"
   - 연결 수, CPU 사용률 등 알림 설정

## ⚠️ 주의사항

1. **보안**
   - 강력한 비밀번호 사용
   - IP 주소 제한 권장 (가능한 경우)
   - 연결 문자열 보안 유지

2. **용량 제한**
   - M0 Free Tier: 512MB 저장공간
   - 용량 초과 시 유료 플랜 고려

3. **백업**
   - Atlas는 자동 백업 제공
   - 중요한 데이터는 별도 백업 권장

## 🎯 다음 단계

MongoDB Atlas 설정 완료 후:
1. CloudType에 환경변수 설정
2. 애플리케이션 배포
3. 연결 상태 및 기능 테스트