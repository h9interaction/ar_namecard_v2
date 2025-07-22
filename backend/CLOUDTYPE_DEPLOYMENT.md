# 🚀 CloudType 배포 가이드

## 📋 개요
AR 명함 백엔드 애플리케이션을 CloudType.io에 배포하는 단계별 가이드입니다.

## 🔧 1단계: CloudType 프로젝트 생성

1. **CloudType 로그인**
   - https://cloudtype.io 접속
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "새 프로젝트" 클릭
   - 프로젝트명: `ar-namecard-api`
   - 서비스 이름: `ar-namecard-api`

3. **소스코드 연결**
   - Repository: `ar_namecard_v2` 선택
   - Branch: `main`
   - Root Directory: `backend`

## ⚙️ 2단계: 빌드 설정

### Build Configuration
```yaml
Runtime: Node.js
Node Version: v24 (최신 LTS 권장)
Install Command: npm install
Build Command: npm run build  
Start Command: npm start
Port: 3000
```

### Advanced Settings
```yaml
Health Check: /health
Health Check 2: /api/health
```

## 🌐 3단계: 환경변수 설정

CloudType 환경변수 탭에서 다음 변수들을 설정하세요:

### 🔐 기본 서버 설정
```bash
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### 🗄️ MongoDB Atlas 연결
```bash
MONGODB_URI=mongodb+srv://arNamecardUser:YOUR_PASSWORD@ar-namecard-cluster.xxxxx.mongodb.net/ar_namecard?retryWrites=true&w=majority
```
> ⚠️ `YOUR_PASSWORD`를 실제 Atlas 비밀번호로 교체하세요

### 🔑 JWT 설정
```bash
JWT_SECRET=your-super-secure-production-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=24h
```

### 🔥 Firebase 설정
```bash
FIREBASE_PROJECT_ID=hninepeople
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@hninepeople.iam.gserviceaccount.com
```

**Firebase Private Key (별도 설정 필요):**
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDoXiMFkSYTZ2e0
a5iUvFzwFfvEK44eO2a1aU7BLwqVH3CFQ4QpMHwUYFxxdhtLhtY6eDNpGo1ujoC6
2EEmoYUxB1ZI340DlMjV7iEfumfGvEr8DsWnrnEAlduxC70NgiADHIi4fX6F0WlC
uWGNA9/EbVGie4VgeX9GP+HKqJ3Zz4RncFU2ma8yyUwraA00Gy8I47QeZlvFBb2e
WYfofuV8cwJrtdj7uLYyU12YqUJOR57qGMEMpbNeYg2vLKZL/SDLoM/8h8yUKV22
n/Qs1B9YXFu7lcYVU7jjjxqRVPQc/yx+Skeyrm77MM8ADCmKgvSeFSPwgUnEzKbP
mWnEFgX5AgMBAAECggEAHPVqaO2zcJSg/H+yRssIzBT5SPPipMrjXHVwzquVposC
A2GsLVPxCrsNmkhNU4bM2QGU6qLYAHC7A04jJHTZvAf9jVxq3wjiVKL2NtWMzFw3
/hy7LlATni6O8AwV9gKDCdA7C778DyJPe3TN/vx+HSVAmL7LGwBZR8B7W73S2kuB
GflxFXCxKaTmJHku8YTMOW/S3TOZsadSSJQ/Hm9sGuWFqPQzXsu4IDC/FvHebx/C
KTMmkLuCFGM+YlZ8FEfgvAybq0UsBVXUV2JntKhut79Qv3tv/l9TrbEC1UzAjm3v
tSsgIZihtoDPc92WHIBrK5PyT+VEmC7gRRzcl86/gQKBgQD13mMu2dQkeRDYiWYF
yjMvC74i0H0aFX0PS4NCTjzVotZkiWyCXp+tRuIwJ3+caWWzzqmx35spzoeVAa6r
YvawYgnhQDpWDH/up8DOqyPDz5nTZDLanWsb3IOmSnNGKeeD7TECBSJsIYEUj0Fx
xgrpwV0pFSD6jG/FKf4FeDRfmQKBgQDx8VSkomSjtik7sDJJBoX6/3LyI9lWVU97
CF0DLfLO2UtbN2+lWWh+YhkLudGbdPKtqLi9d2rk1pIHCdW6wci9DNkvtwayBSa1
jyNhBsEhXsoiMs1tNMKji+OlmijBhJ8jMiXo9MhypjQgKUOkiQpNd728JJ+/3wCz
clMTSIBVYQKBgGR7ns1m+OxvDhNxE+EJ4iE4C1zvGDGw1ouJsPtIPlSRWE1+XHpr
cZa/gXFssxqZeJcjvvaTDDbp0T90kI46w9cSOjd0qGLCeQZwSLwt9U/xaEychqwR
6dRZKvSrOLFULuob5guNTaQjjT15zqVQ6uTdwdUobXH4MzXBE6/okH8BAoGAcMy+
VN+tojI8uSpl12wmLSbKFaCnJLwziT4V93SFvvDKVGXdNK8hq8LawH/K/PqiZlrC
fvtdKAHuJT/tmNveVl3WKIvhoEAMkxuAOC1o/8Ds5tLeueqeUJfY9A2SsN6/Py6T
RDBUADgDF3eFpQGLfyCzojNFE7TJ4+AKYXQs+SECgYEA9H/SrvHndXycWqDAmESs
Xs8yMaFLn0OMVMWfIQigdNAQfuhmRUaCLmf/xmKlVAaq8PgRE157oSkOcvJ3z/Ua
/9xyTGDLtAtYCMN8V1yBh/eeMmCgnlna89W8lYz8Iow8j0d71nZPqx+mt/O0Yye6
IbpLmCFT+ekwZ/06et9tWtQ=
-----END PRIVATE KEY-----"
```

### 📁 파일 업로드 설정
```bash
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

### 🌐 CORS 설정
```bash
CORS_ALLOW_ALL=false
```

## 🚀 4단계: 배포 실행

1. **환경변수 확인**
   - 모든 환경변수가 올바르게 설정되었는지 확인
   - 특히 MongoDB URI와 Firebase 설정 검증

2. **배포 시작**
   - "배포" 버튼 클릭
   - 빌드 로그 모니터링

3. **빌드 과정 확인**
   ```
   Step 1: Installing dependencies... ✓
   Step 2: Building TypeScript... ✓
   Step 3: Starting application... ✓
   ```

## ✅ 5단계: 배포 검증

배포 완료 후 다음 엔드포인트들을 테스트하세요:

### 📋 기본 엔드포인트
```bash
# Health Check
GET https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/health

# API Health Check
GET https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/health

# Swagger 문서
GET https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api-docs
```

### 🧪 테스트 페이지
```bash
# 캐릭터 옵션 관리 테스트
GET https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/test/avatar

# 사용자 테스트
GET https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/test/user

# 로그인 테스트
GET https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/test/login
```

### 🔍 API 기능 테스트
```bash
# 캐릭터 카테고리 조회
GET https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/characters

# 스티커 조회
GET https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/stickers
```

## 🛠️ 6단계: 문제 해결

### 일반적인 문제들

1. **빌드 실패**
   - Node.js 버전 확인 (v24 LTS 권장)
   - package.json의 scripts 설정 확인

2. **MongoDB 연결 오류**
   - MONGODB_URI 환경변수 확인
   - Atlas IP 허용 목록 확인 (0.0.0.0/0)
   - 네트워크 접근 권한 확인

3. **Firebase 오류**
   - FIREBASE_PRIVATE_KEY 형식 확인
   - 줄바꿈 문자 (\n) 올바르게 이스케이프됨 확인

4. **CORS 오류**
   - CloudType 도메인이 CORS 설정에 포함되어 있는지 확인
   - 필요시 CORS_ALLOW_ALL=true로 임시 설정

### 로그 확인
```bash
# CloudType 콘솔에서
- "로그" 탭 클릭
- 실시간 애플리케이션 로그 모니터링
- 오류 메시지 및 연결 상태 확인
```

## 📊 7단계: 모니터링

### CloudType 대시보드
- CPU/메모리 사용률 모니터링
- 응답시간 확인
- 트래픽 패턴 분석

### MongoDB Atlas
- 연결 수 모니터링
- 쿼리 성능 확인
- 저장공간 사용량 체크

## 🎯 배포 완료 체크리스트

- [ ] MongoDB Atlas 클러스터 생성 및 연결 확인
- [ ] CloudType 환경변수 모든 항목 설정
- [ ] 빌드 및 배포 성공
- [ ] Health Check 엔드포인트 응답 확인
- [ ] Swagger 문서 접근 가능
- [ ] 테스트 페이지 정상 로드
- [ ] API 엔드포인트 기본 동작 확인
- [ ] 파일 업로드 기능 테스트
- [ ] 로그 모니터링 정상 작동

## 🔄 유지보수

### 정기 점검 항목
1. **보안**
   - JWT Secret 주기적 변경
   - Firebase 키 관리
   - Atlas 접근 권한 검토

2. **성능**
   - 응답시간 모니터링
   - 데이터베이스 쿼리 최적화
   - 캐싱 전략 검토

3. **용량**
   - Atlas 저장공간 모니터링
   - 로그 파일 관리
   - 업로드된 파일 정리

## 📞 지원

문제 발생 시:
1. CloudType 공식 문서: https://docs.cloudtype.io
2. MongoDB Atlas 지원: https://support.mongodb.com
3. 프로젝트 GitHub Issues 등록