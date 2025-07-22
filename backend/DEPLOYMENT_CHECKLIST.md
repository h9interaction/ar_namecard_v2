# ✅ CloudType 배포 후 검증 체크리스트

## 🎯 배포 URL
배포 완료 후 CloudType에서 제공하는 URL을 기록하세요:
```
Base URL: https://port-3000-ar-namecard-api-xxxxx.cloudtype.app
```

## 🔍 Phase 1: 기본 서비스 확인

### 1.1 Health Check 엔드포인트
- [ ] **GET** `/health`
  ```bash
  curl https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/health
  ```
  **Expected Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2024-01-XX...",
    "server": "AR Namecard API",
    "version": "1.0.0",
    "environment": "production",
    "cors": "enabled",
    "mongodb": "connected",
    "firebase": "configured"
  }
  ```

- [ ] **GET** `/api/health`
  ```bash
  curl https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/health
  ```

### 1.2 Swagger 문서 접근
- [ ] **GET** `/api-docs`
  - 브라우저에서 접근 가능
  - Swagger UI 정상 로드
  - 모든 API 엔드포인트 표시

## 📋 Phase 2: 테스트 페이지 확인

### 2.1 캐릭터 옵션 관리 테스트
- [ ] **GET** `/test/avatar`
  - 페이지 정상 로드
  - 관리자 토큰 생성 버튼 작동
  - 카테고리 목록 로드 가능
  - 옵션 추가/수정/삭제 UI 표시

### 2.2 사용자 관리 테스트
- [ ] **GET** `/test/user`
  - 사용자 목록 표시
  - 검색 기능 작동
  - 사용자 상세 정보 확인

### 2.3 로그인 테스트
- [ ] **GET** `/test/login`
  - 로그인 폼 표시
  - Firebase 인증 설정 확인
  - 로그인 프로세스 테스트

### 2.4 아이템 관리 테스트
- [ ] **GET** `/test/item`
  - 스티커 목록 표시
  - 검색/필터 기능 작동

### 2.5 커스터마이제이션 테스트
- [ ] **GET** `/test/customize`
  - 캐릭터 커스터마이제이션 UI 로드
  - 옵션 선택 기능 작동

## 🔌 Phase 3: API 엔드포인트 검증

### 3.1 Authentication API
- [ ] **GET** `/api/auth/test-token/001`
  ```bash
  curl https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/auth/test-token/001
  ```
  **Expected:** 관리자 토큰 생성

### 3.2 Characters API
- [ ] **GET** `/api/characters`
  ```bash
  curl https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/characters
  ```
  **Expected:** 캐릭터 카테고리 목록

### 3.3 Stickers API
- [ ] **GET** `/api/stickers`
  ```bash
  curl https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/stickers
  ```
  **Expected:** 스티커 목록

### 3.4 Admin API (토큰 필요)
- [ ] **GET** `/api/admin/characters/categories`
  ```bash
  curl -H "Authorization: Bearer [TOKEN]" \
       https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/admin/characters/categories
  ```
  **Expected:** 관리자 전용 카테고리 목록

## 🗄️ Phase 4: MongoDB Atlas 연결 검증

### 4.1 데이터베이스 연결 상태
- [ ] Atlas 대시보드에서 연결 확인
- [ ] Real-time 탭에서 활성 연결 확인
- [ ] Metrics에서 연결 성능 확인

### 4.2 컬렉션 생성 확인
- [ ] `users` 컬렉션 존재
- [ ] `avatarcategories` 컬렉션 존재
- [ ] `usercustomizations` 컬렉션 존재
- [ ] `items` 컬렉션 존재

### 4.3 데이터 CRUD 테스트
- [ ] 사용자 생성 테스트 (회원가입)
- [ ] 데이터 조회 테스트
- [ ] 데이터 수정 테스트
- [ ] 데이터 삭제 테스트

## 🔥 Phase 5: Firebase 연동 검증

### 5.1 Firebase Authentication
- [ ] **POST** `/api/auth/firebase/verify`
  ```bash
  curl -X POST \
       -H "Content-Type: application/json" \
       -d '{"idToken": "TEST_TOKEN"}' \
       https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/auth/firebase/verify
  ```

### 5.2 Firebase 설정 확인
- [ ] 환경변수 FIREBASE_PROJECT_ID 확인
- [ ] FIREBASE_PRIVATE_KEY 정상 설정 확인
- [ ] FIREBASE_CLIENT_EMAIL 정상 설정 확인

## 📁 Phase 6: 파일 업로드 기능 검증

### 6.1 기본 파일 업로드
- [ ] **POST** `/api/upload`
  ```bash
  curl -X POST \
       -F "file=@test-image.jpg" \
       https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/api/upload
  ```
  **Expected:** 파일 업로드 성공 및 URL 반환

### 6.2 정적 파일 서빙
- [ ] `/uploads/` 경로 접근 가능
- [ ] `/uploads/thumbnails/` 경로 접근 가능
- [ ] `/uploads/palettes/` 경로 접근 가능

### 6.3 관리자 옵션 업로드
- [ ] 캐릭터 옵션 이미지 업로드
- [ ] 썸네일 자동 생성
- [ ] 팔레트 이미지 처리
- [ ] Hair 카테고리 특수 처리 (중간머리/뒷머리)

## 🌐 Phase 7: CORS 및 네트워크 검증

### 7.1 CORS 헤더 확인
- [ ] 프리플라이트 요청 처리
- [ ] Access-Control-Allow-Origin 헤더
- [ ] Access-Control-Allow-Methods 헤더
- [ ] Access-Control-Allow-Headers 헤더

### 7.2 다양한 도메인에서 접근 테스트
- [ ] 브라우저에서 직접 접근
- [ ] 다른 도메인에서 AJAX 요청
- [ ] 모바일 브라우저에서 접근

## 🚨 Phase 8: 오류 처리 검증

### 8.1 404 에러 처리
- [ ] **GET** `/nonexistent-endpoint`
  ```bash
  curl https://port-3000-ar-namecard-api-xxxxx.cloudtype.app/nonexistent-endpoint
  ```
  **Expected:** `{"error": "Route not found"}`

### 8.2 인증 오류 처리
- [ ] 토큰 없이 관리자 API 호출
- [ ] 잘못된 토큰으로 API 호출
- [ ] 만료된 토큰으로 API 호출

### 8.3 유효성 검사 오류
- [ ] 잘못된 데이터로 POST 요청
- [ ] 필수 필드 누락으로 요청
- [ ] 잘못된 파일 형식으로 업로드

## 📊 Phase 9: 성능 및 모니터링

### 9.1 응답 시간 확인
- [ ] Health Check 응답 시간 < 500ms
- [ ] API 엔드포인트 평균 응답 시간 < 2초
- [ ] 파일 업로드 처리 시간 확인

### 9.2 CloudType 리소스 사용량
- [ ] CPU 사용률 모니터링
- [ ] 메모리 사용량 확인
- [ ] 네트워크 트래픽 확인

### 9.3 로그 모니터링
- [ ] 애플리케이션 로그 정상 출력
- [ ] 오류 로그 수집 확인
- [ ] 접근 로그 기록 확인

## 🔄 Phase 10: 지속적 모니터링

### 10.1 일일 체크
- [ ] 서비스 가용성 확인
- [ ] 오류 로그 검토
- [ ] 성능 지표 확인

### 10.2 주간 체크
- [ ] MongoDB Atlas 용량 확인
- [ ] 보안 업데이트 검토
- [ ] 백업 상태 확인

### 10.3 월간 체크
- [ ] SSL 인증서 만료일 확인
- [ ] 의존성 패키지 업데이트
- [ ] 성능 최적화 검토

## ❌ 문제 해결 가이드

### 연결 문제
1. **MongoDB 연결 실패**
   - Atlas IP 허용 목록 확인
   - 연결 문자열 검증
   - 네트워크 설정 재확인

2. **Firebase 연결 오류**
   - 환경변수 형식 확인
   - Private Key 줄바꿈 문자 확인
   - 프로젝트 ID 일치 여부 확인

3. **CORS 오류**
   - CloudType 도메인 CORS 허용 목록 확인
   - preflight 요청 처리 확인

### 성능 문제
1. **느린 응답**
   - 데이터베이스 인덱스 확인
   - 쿼리 최적화 필요
   - 캐싱 전략 검토

2. **메모리 부족**
   - 이미지 처리 최적화
   - 메모리 누수 검사
   - CloudType 플랜 업그레이드 고려

## ✅ 배포 완료 확인

모든 항목이 체크되면 배포가 성공적으로 완료된 것입니다!

- [ ] **Phase 1-10 모든 항목 완료**
- [ ] **문서화 업데이트 완료**
- [ ] **모니터링 설정 완료**
- [ ] **팀 공유 완료**

---

**배포 완료일**: ___________  
**배포 담당자**: ___________  
**CloudType URL**: ___________  
**MongoDB Atlas Cluster**: ___________