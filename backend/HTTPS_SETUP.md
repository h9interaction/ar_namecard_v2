# HTTPS 설정 가이드

## 8th Wall 및 다중 디바이스 접근을 위한 HTTPS 설정

### 🎯 목적
- 8th Wall WebAR 플랫폼에서 백엔드 API 접근
- 로컬 네트워크의 다른 PC/모바일에서 접근
- Firebase 인증을 포함한 전체 시스템 테스트

### 🚀 빠른 시작

#### 1. SSL 인증서 생성
```bash
npm run ssl:generate
```

#### 2. 환경 변수 설정
`.env` 파일에 다음 추가:
```bash
ENABLE_HTTPS=true
HOST=0.0.0.0
```

#### 3. HTTPS 서버 실행
```bash
npm run https
```

### 🌐 접근 URL

#### 로컬 접근
- HTTP: `http://localhost:3000`
- HTTPS: `https://localhost:3443`

#### 네트워크 접근 (예: 192.168.2.20)
- HTTP: `http://192.168.2.20:3000`
- HTTPS: `https://192.168.2.20:3443`

### 🔐 브라우저 보안 경고 해결

#### Chrome
1. 브라우저에서 "고급" 클릭
2. "localhost(안전하지 않음)로 이동" 클릭

#### Firefox
1. 브라우저에서 "고급" 클릭
2. "위험을 감수하고 계속" 클릭

#### Safari
1. "자세히" 클릭
2. "웹 사이트 방문" 클릭

### 📱 Firebase 설정

#### 1. Firebase Console 설정
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. 프로젝트 → Authentication → 설정 → 승인된 도메인
3. 다음 도메인 추가:
   - `localhost`
   - `192.168.2.20` (실제 IP 주소)
   - 필요시 다른 로컬 IP 주소

#### 2. 8th Wall 프로젝트 설정
8th Wall 프로젝트에서 API 호출 시:
```javascript
// 동적 API 엔드포인트 설정
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'https://localhost:3443'
  : 'https://192.168.2.20:3443';

// API 호출 예시
fetch(`${API_BASE_URL}/api/avatars/026`)
  .then(response => response.json())
  .then(data => console.log(data));
```

### 🛡️ 보안 및 CORS 설정

현재 허용된 도메인:
- `localhost` (HTTP/HTTPS)
- 로컬 네트워크 IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- `*.8thwall.com`
- `*.8thwall.app`

### 🔧 고급 설정

#### 커스텀 인증서 경로
`.env` 파일에서 인증서 경로 변경:
```bash
SSL_KEY_PATH=./custom/path/server.key
SSL_CERT_PATH=./custom/path/server.crt
```

#### 포트 변경
```bash
PORT=3000
HTTPS_PORT=3443
```

### 🐛 문제 해결

#### 1. "ERR_CERT_AUTHORITY_INVALID" 오류
- 브라우저에서 "고급" → "계속" 클릭
- 또는 로컬 CA 설정으로 신뢰할 수 있는 인증서 생성

#### 2. 방화벽 문제
macOS:
```bash
sudo pfctl -f /etc/pf.conf
```

Windows:
- Windows Defender 방화벽에서 포트 3443 허용

#### 3. 8th Wall에서 접근 불가
- Mixed Content 정책 확인
- HTTPS 사용 여부 확인
- Firebase 승인된 도메인 확인

### 📚 참고 자료

- [8th Wall Documentation](https://www.8thwall.com/docs)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Node.js HTTPS](https://nodejs.org/api/https.html)

### 🎉 테스트 페이지

- **커스터마이징**: `https://localhost:3443/test/customize`
- **Firebase 로그인**: `https://localhost:3443/test/login`
- **API 문서**: `https://localhost:3443/api-docs`