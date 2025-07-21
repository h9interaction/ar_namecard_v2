# CORS 설정 가이드

## 개발자 모드에서 다중 디바이스 접근 설정

### 🎯 목적
- 다른 PC/모바일에서 HTTP로 접근 시 CORS 오류 해결
- 개발 환경에서 모든 네트워크 접근 허용
- 8th Wall 및 다양한 개발 도구 지원

### 🚀 빠른 설정

#### 1. 모든 Origin 허용 (개발 모드)
`.env` 파일에 추가:
```bash
CORS_ALLOW_ALL=true
```

#### 2. 서버 재시작
기존 서버 종료 후:
```bash
npm run dev
```

서버 시작 시 다음 메시지 확인:
```
🔓 CORS: 개발자 모드 - 모든 origin 허용
```

### 🌐 지원되는 접근 환경

#### 자동 허용되는 도메인들:

**로컬 개발 환경**
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `http://0.0.0.0:3000`
- `https://localhost:3443`

**로컬 네트워크**
- `http://192.168.x.x:3000`
- `http://10.x.x.x:3000`
- `http://172.16-31.x.x:3000`
- `http://xxx.local:3000`
- `http://xxx.lan:3000`

**8th Wall 플랫폼**
- `https://*.8thwall.com`
- `https://*.8thwall.app`

**개발자 도구**
- `null` origin (file:// 프로토콜)
- Chrome DevTools
- Postman 등

### ⚙️ 설정 옵션

#### 1. 완전 개방 모드 (권장)
```bash
CORS_ALLOW_ALL=true
```
- 모든 origin에서 접근 가능
- 개발 환경에서만 작동
- 가장 편리한 설정

#### 2. 제한적 모드
```bash
CORS_ALLOW_ALL=false
```
- 사전 정의된 도메인만 허용
- 더 안전한 개발 환경
- 일부 네트워크에서 제한 가능

### 🔧 환경별 설정

#### 개발 환경 (NODE_ENV=development)
- 추가 로컬 호스트 변형 지원
- 더 넓은 네트워크 패턴 허용
- 개발자 도구 친화적

#### 프로덕션 환경 (NODE_ENV=production)
- `CORS_ALLOW_ALL` 무시
- 사전 정의된 도메인만 허용
- 보안 강화

### 🐛 문제 해결

#### 1. 여전히 CORS 오류가 발생하는 경우
```bash
# 서버 로그 확인
🚫 CORS: 차단된 origin - http://192.168.x.x:3000
```

**해결 방법:**
1. `.env` 파일에 `CORS_ALLOW_ALL=true` 확인
2. 서버 재시작
3. 브라우저 캐시 클리어

#### 2. 개발자 도구에서 접근 불가
- Chrome: 개발자 도구 → Network → Disable cache
- 시크릿 모드로 테스트
- 다른 브라우저로 테스트

#### 3. 모바일에서 접근 불가
- 방화벽 설정 확인
- 같은 WiFi 네트워크 연결 확인
- IP 주소 정확성 확인

### 🔒 보안 고려사항

#### 개발 환경에서만 사용
- `CORS_ALLOW_ALL=true`는 개발용
- 프로덕션에서는 자동 무시
- 민감한 데이터 노출 주의

#### 프로덕션 배포 시
```bash
NODE_ENV=production
CORS_ALLOW_ALL=false  # 또는 제거
```

### 📱 테스트 방법

#### 1. 로컬에서 테스트
```bash
curl -H "Origin: http://test.com" http://localhost:3000/api/health
```

#### 2. 다른 PC에서 테스트
브라우저에서 `http://192.168.x.x:3000/api/health` 접속

#### 3. 모바일에서 테스트
모바일 브라우저에서 `http://192.168.x.x:3000/test/customize` 접속

### 🎉 성공 확인

서버 로그에서 다음 메시지 확인:
```
🔓 CORS: 개발자 모드 - 모든 origin 허용
🚀 HTTP Server is running on:
   - Local:    http://localhost:3000
   - Network:  http://192.168.x.x:3000
```

브라우저에서 CORS 오류 없이 API 호출 성공!