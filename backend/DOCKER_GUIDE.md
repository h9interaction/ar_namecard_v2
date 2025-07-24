# 🐳 AR Namecard 백엔드 Docker 배포 가이드

## 📋 목차 (Table of Contents)

- [개요](#-개요)
- [빠른 시작](#-빠른-시작)
- [단계별 Docker 빌드 방법](#-단계별-docker-빌드-방법)
- [추가 관리 명령어](#-추가-관리-명령어)
- [개발 모드 vs 프로덕션 모드](#-개발-모드-vs-프로덕션-모드)
- [서비스 확인 URL](#-서비스-확인-url)
- [주의사항](#️-주의사항)

---

## 🎯 개요

이 가이드는 AR Namecard 백엔드를 Docker 컨테이너로 실행하는 방법을 설명합니다.

### 📦 포함된 구성요소
- **Node.js 18 Alpine** 기반 컨테이너
- **Multi-stage build** for production optimization
- **MongoDB Atlas** 연결 설정
- **Firebase Storage** 통합
- **자동 헬스체크** 및 모니터링

---

## ⚡ 빠른 시작

> 💡 **TIP**: 처음 사용하시는 경우 아래 3단계만 실행하면 됩니다.

```bash
# 1. Docker 이미지 빌드
npm run docker:build

# 2. 컨테이너 실행
npm run docker:run

# 3. 상태 확인
curl http://localhost:3000/health
```

---

## 🚀 단계별 Docker 빌드 방법

### 1️⃣ **1단계: 환경 설정 확인**

```bash
# 현재 디렉토리 확인
pwd
# 출력: /Users/jangbeomseok/Documents/Project/2025/ar_namecard_v2/backend

# Docker 설치 확인
docker --version
docker-compose --version
```

**예상 출력:**
```
Docker version 24.0.0, build 1234567
Docker Compose version v2.20.0
```

### 2️⃣ **2단계: 환경변수 파일 확인**

```bash
# 환경변수 파일 존재 확인
ls -la .env.*

# Docker용 환경변수 내용 확인 (현재 MongoDB Atlas 사용 중)
cat .env.docker
```

> ⚠️ **주의**: `.env.docker` 파일이 존재하는지 반드시 확인하세요.

### 3️⃣ **3단계: Docker 이미지 빌드**

다음 중 하나의 방법을 선택하여 실행하세요:

```bash
# 방법 1: Docker Compose로 빌드 (권장)
docker-compose build

# 방법 2: 캐시 없이 완전 재빌드
docker-compose build --no-cache

# 방법 3: npm 스크립트 사용 (권장)
npm run docker:build
```

### 4️⃣ **4단계: 컨테이너 실행**

```bash
# 백그라운드에서 실행 (권장)
docker-compose up -d

# 또는 npm 스크립트 사용
npm run docker:run

# 포어그라운드에서 실행 (로그 실시간 확인)
docker-compose up
```

### 5️⃣ **5단계: 상태 확인**

```bash
# 실행 중인 컨테이너 확인
docker ps

# 헬스체크 확인
curl http://localhost:3000/health

# 컨테이너 로그 확인
docker logs ar-namecard-backend

# 또는 npm 스크립트 사용
npm run docker:logs
```

**정상 응답 예시:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-24T15:30:00.000Z",
  "server": "AR Namecard API",
  "environment": "production"
}
```

---

## 🔧 추가 관리 명령어

### 🔄 **컨테이너 관리**

```bash
# 컨테이너 중지
docker-compose down
# 또는
npm run docker:stop

# 컨테이너 재시작
docker-compose restart ar-namecard-backend

# 컨테이너 내부 접속
docker exec -it ar-namecard-backend sh
```

### 🖼️ **이미지 관리**

```bash
# 현재 이미지 확인
docker images | grep ar-namecard

# 사용하지 않는 이미지 정리
docker image prune

# 전체 시스템 정리
npm run docker:clean
```

### 🔄 **완전 재빌드 (코드 변경 시)**

```bash
# 컨테이너 중지 → 이미지 재빌드 → 실행
npm run docker:rebuild
```

> 💡 **TIP**: 코드를 수정한 후에는 항상 `npm run docker:rebuild`를 실행하세요.

---

## 🌐 개발 모드 vs 프로덕션 모드

### 🛠️ **개발 모드 (포트 3001)**

```bash
# 개발용 컨테이너 실행
npm run docker:dev

# 개발용 로그 확인
npm run docker:dev:logs

# 개발용 컨테이너 중지
npm run docker:dev:stop
```

### 🏭 **프로덕션 모드 (포트 3000)**

```bash
# 프로덕션 컨테이너 실행
npm run docker:run

# 프로덕션 로그 확인
npm run docker:logs
```

| 모드 | 포트 | 환경변수 | 용도 |
|------|------|----------|------|
| 개발 | 3001 | 로컬 설정 | 개발 및 테스트 |
| 프로덕션 | 3000 | `.env.docker` | 실제 배포 |

---

## 📊 서비스 확인 URL

### 🌐 **로컬 접속**

| 서비스 | URL | 설명 |
|--------|-----|------|
| **API 서버** | http://localhost:3000 | 메인 API 엔드포인트 |
| **헬스체크** | http://localhost:3000/health | 서버 상태 확인 |
| **Swagger 문서** | http://localhost:3000/api-docs | API 문서 |
| **개발 모드** | http://localhost:3001 | 개발용 컨테이너 |

### 🧪 **테스트 페이지**

| 테스트 | URL | 설명 |
|--------|-----|------|
| **로그인 테스트** | http://localhost:3000/test/login/ | 사용자 인증 테스트 |
| **사용자 정보 테스트** | http://localhost:3000/test/user/ | 사용자 CRUD 테스트 |
| **캐릭터 옵션 테스트** | http://localhost:3000/test/avatar/ | 아바타 커스터마이징 테스트 |

---

## ⚠️ 주의사항

> 📌 **중요한 설정 사항들을 확인하세요**

### 🔧 **환경 설정**
1. **환경변수**: 현재 `.env.docker`가 **MongoDB Atlas**를 사용하도록 설정됨
2. **포트 충돌**: 기본 개발 서버와 포트 충돌 방지를 위해 개발용은 **3001** 포트 사용
3. **볼륨 마운트**: 로그 파일과 SSL 인증서는 호스트와 연결됨

### ⏰ **타이밍**
4. **헬스체크**: 컨테이너 시작 후 **30-40초** 대기 후 healthy 상태 확인

### 🔐 **보안**
5. **Firebase 키**: Private Key 형식이 올바른지 확인 필요
6. **CORS 설정**: 프로덕션에서는 특정 도메인만 허용

---

## 🆘 트러블슈팅

### ❌ **컨테이너가 시작되지 않는 경우**

```bash
# 로그 확인
npm run docker:logs

# 컨테이너 상태 확인
docker ps -a
```

### ❌ **포트 충돌 문제**

```bash
# 포트 사용 확인
lsof -i :3000

# 기존 프로세스 종료 후 재시작
npm run docker:stop && npm run docker:run
```

### ❌ **환경변수 문제**

```bash
# 환경변수 파일 확인
cat .env.docker

# Firebase 설정 디버그
curl http://localhost:3000/api/avatars/debug/env
```

---

## 📞 지원

문제가 발생하면 다음 정보와 함께 문의하세요:
- 실행한 명령어
- 오류 메시지
- `npm run docker:logs` 출력 결과
- 헬스체크 응답 (`curl http://localhost:3000/health`)

---

**✅ 현재 상태**: Docker 컨테이너가 정상적으로 실행 중이며, 개발 환경과 동일한 기능을 제공합니다!

---

*마지막 업데이트: 2025-01-24*