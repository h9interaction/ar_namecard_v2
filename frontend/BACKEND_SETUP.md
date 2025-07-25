# 백엔드 서버 연동 가이드

## 백엔드 서버 주소 설정하기

### 1. 백엔드 서버 주소 확인

백엔드 작업자분께 서버 주소를 문의하거나, 백엔드 서버 실행시 나타나는 Network 주소를 확인하세요.

백엔드 서버 실행시 터미널에 다음과 같이 표시됩니다:
```
🚀 HTTP Server is running on:
   - Local:    http://localhost:3000
   - Network:  http://192.168.1.100:3000
```

여기서 `Network` 부분의 IP 주소를 사용하면 됩니다.

### 2. 프론트엔드 환경 설정

`.env.development` 파일을 수정하여 백엔드 서버 주소를 설정하세요.

```bash
# 예시 1: 로컬 백엔드 서버 (기본값)
VITE_API_BASE_URL=http://localhost:3000/api

# 예시 2: 같은 네트워크의 다른 컴퓨터
VITE_API_BASE_URL=http://192.168.1.100:3000/api

# 예시 3: 도메인 사용하는 경우
VITE_API_BASE_URL=http://backend-server.local:3000/api
```

### 3. 프론트엔드 실행

```bash
npm run dev
```

## 연결 상태 확인하기

### 브라우저에서 확인
1. `http://localhost:5173`에 접속
2. 페이지 상단에 연결 상태가 표시됩니다:
   - 🔄 백엔드 서버 연결 중...
   - ✅ 백엔드 서버 연결됨
   - ⚠️ 백엔드 서버 연결 실패 (로컬 데이터 사용)

### 개발자 도구에서 확인
1. F12를 눌러 개발자 도구 열기
2. Console 탭에서 다음 로그 확인:
   - `🚀 App: 백엔드 데이터 로드 시작`
   - `📡 API 요청: http://[서버주소]/api/health`
   - `✅ 데이터 로드 완료: 캐릭터 X개 카테고리, 스티커 Y개 카테고리`

### 백엔드 서버에서 확인
백엔드 터미널에서 다음 로그가 나타나면 정상 연결:
```
🎭 [PUBLIC API] 캐릭터 카테고리 목록 요청
✅ [캐릭터 데이터] 총 3개 카테고리 로드됨
📂 [캐릭터 카테고리] 얼굴형 (face): 5개 옵션
  └─ [옵션 1] 둥근 얼굴 (ID: 507f1f77bcf86cd799439011)
      이미지: /uploads/face_round.png
      썸네일: /uploads/thumbnails/face_round_thumb.png
```

## 문제 해결

### 연결 실패시
1. **백엔드 서버가 실행 중인지 확인**
   - 백엔드 작업자분께 서버 상태 문의

2. **네트워크 연결 확인**
   - 같은 네트워크에 있는지 확인 (WiFi, 유선랜)
   - 방화벽 설정 확인

3. **주소 및 포트 확인**
   - `.env.development` 파일의 주소가 정확한지 확인
   - 포트 번호 확인 (기본값: 3000)

4. **CORS 설정 확인**
   - 백엔드에서 프론트엔드 주소가 CORS 허용 목록에 있는지 확인

### 데이터가 없는 경우
백엔드 서버에 연결되었지만 데이터가 없다면:
1. 백엔드 작업자분께 관리자 페이지에서 데이터 추가 요청
2. 임시로 기본 아바타가 생성되어 정상 동작합니다

### 환경별 설정

**개발 환경:**
- `.env.development` 사용
- `npm run dev` 실행시 자동 적용

**운영 환경:**
- `.env.production` 파일 생성
- 운영 서버 주소로 설정

## API 엔드포인트

현재 사용중인 백엔드 API:
- `GET /api/health` - 서버 상태 확인
- `GET /api/avatars` - 캐릭터 카테고리 목록
- `GET /api/items` - 스티커 카테고리 목록

## 추가 도움이 필요한 경우

1. 백엔드 작업자분께 문의
2. Network 탭에서 실제 요청 URL 확인
3. 서버 로그와 브라우저 Console 로그 비교