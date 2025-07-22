# 시놀로지 NAS 배포 가이드

## 📋 개요

이 가이드는 AR Namecard API를 시놀로지 NAS 서버 (192.168.1.93)에 Docker를 사용하여 배포하는 방법을 설명합니다.

## 🎯 배포 목표

- **고가용성**: Docker Compose를 통한 서비스 관리
- **데이터 보호**: MongoDB 데이터 영구 저장
- **보안**: HTTPS 지원 및 방화벽 설정
- **모니터링**: 로깅 및 헬스체크
- **백업**: 자동화된 백업 시스템

## 🛠 사전 준비

### 1. 시놀로지 NAS 설정

#### Container Manager 설치
1. Package Center에서 "Container Manager" 설치
2. Docker 서비스 활성화

#### SSH 접근 설정
1. 제어판 > 터미널 및 SNMP > SSH 서비스 활성화
2. SSH 키 설정 (권장)

```bash
# 로컬에서 SSH 키 생성
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# 공개키를 NAS에 복사
ssh-copy-id admin@192.168.1.93
```

### 2. 네트워크 설정

#### 포트 개방 (제어판 > 보안 > 방화벽)
- **3000**: HTTP API
- **3443**: HTTPS API
- **80**: HTTP (Nginx, 선택사항)
- **443**: HTTPS (Nginx, 선택사항)

#### 도메인 설정 (선택사항)
- DNS에 `ar-namecard.local` 추가
- 또는 `/etc/hosts`에 `192.168.1.93 ar-namecard.local` 추가

## 🚀 배포 과정

### 1. 초기 배포

```bash
# 배포 스크립트 실행
./deploy.sh

# 또는 수동 배포
./deploy.sh deploy
```

배포 과정:
1. ✅ 사전 요구사항 확인
2. 🔗 NAS 연결 테스트
3. 📁 디렉토리 구조 생성
4. 🏗️ 애플리케이션 빌드
5. 📤 파일 전송
6. ⚙️ 환경 설정
7. 🔐 SSL 인증서 생성
8. 🐳 Docker 서비스 배포
9. ✅ 배포 검증

### 2. 환경 변수 설정

배포 후 `.env` 파일을 편집하여 실제 환경에 맞게 설정:

```bash
ssh admin@192.168.1.93
cd /volume1/docker/ar-namecard/app
nano .env
```

**필수 변경 사항:**
- `JWT_SECRET`: 강력한 비밀키로 변경
- `MONGO_ROOT_PASSWORD`: MongoDB 관리자 비밀번호
- `FIREBASE_*`: Firebase 프로젝트 설정
- `FRONTEND_URL`: 프론트엔드 도메인

### 3. Firebase 설정

Firebase 서비스 계정 키 파일을 NAS에 업로드:

```bash
# 로컬에서 Firebase 키 파일 복사
scp firebase-service-account.json admin@192.168.1.93:/volume1/docker/ar-namecard/app/
```

## 📊 서비스 관리

### 상태 확인

```bash
# 서비스 상태 확인
./deploy.sh status

# 로그 확인
./deploy.sh logs

# SSH로 직접 확인
ssh admin@192.168.1.93 'cd /volume1/docker/ar-namecard/app && docker-compose ps'
```

### 서비스 제어

```bash
# 서비스 재시작
./deploy.sh restart

# 서비스 중지
./deploy.sh stop

# 애플리케이션만 업데이트
./deploy.sh update
```

### 직접 관리 (SSH)

```bash
ssh admin@192.168.1.93
cd /volume1/docker/ar-namecard/app

# 서비스 상태 확인
docker-compose ps

# 로그 보기 (실시간)
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f api
docker-compose logs -f mongodb

# 서비스 재시작
docker-compose restart

# 설정 변경 후 재배포
docker-compose up -d --build
```

## 💾 백업 및 복구

### 백업 생성

```bash
# 전체 백업
./backup.sh backup

# 백업 목록 확인
./backup.sh list
```

### 백업 복구

```bash
# MongoDB 복구
./backup.sh restore-db 20250121_143000

# 업로드 파일 복구
./backup.sh restore-uploads 20250121_143000

# 백업 무결성 확인
./backup.sh verify 20250121_143000
```

### 자동 백업 설정

crontab에 자동 백업 스케줄 추가:

```bash
ssh admin@192.168.1.93
crontab -e

# 매일 새벽 2시 백업
0 2 * * * /volume1/docker/ar-namecard/backup.sh backup

# 매주 일요일 오래된 백업 정리 (30일 이상)
0 3 * * 0 /volume1/docker/ar-namecard/backup.sh cleanup 30
```

## 🔧 문제 해결

### 일반적인 문제

#### 1. 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker-compose logs

# 포트 충돌 확인
netstat -tlnp | grep :3000

# 디스크 공간 확인
df -h
```

#### 2. MongoDB 연결 실패

```bash
# MongoDB 컨테이너 상태 확인
docker-compose logs mongodb

# MongoDB 접속 테스트
docker-compose exec mongodb mongosh -u admin -p
```

#### 3. SSL 인증서 문제

```bash
# 인증서 재생성
cd /volume1/docker/ar-namecard
openssl req -x509 -newkey rsa:4096 -keyout ssl/server.key -out ssl/server.crt -days 365 -nodes \
    -subj '/C=KR/ST=Seoul/L=Seoul/O=AR-Namecard/CN=192.168.1.93'
```

#### 4. 파일 권한 문제

```bash
# 권한 수정
sudo chown -R admin:administrators /volume1/docker/ar-namecard
sudo chmod -R 755 /volume1/docker/ar-namecard
```

### 성능 최적화

#### MongoDB 최적화

```bash
# MongoDB 메모리 사용량 제한 (docker-compose.yml)
services:
  mongodb:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

#### 로그 로테이션

```bash
# Docker 로그 제한 설정
services:
  api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 📈 모니터링

### 시스템 리소스 모니터링

```bash
# CPU 및 메모리 사용량
docker stats

# 디스크 사용량
df -h /volume1/docker/ar-namecard

# 네트워크 연결
netstat -tlnp | grep :3000
```

### 애플리케이션 모니터링

```bash
# API 헬스체크
curl http://192.168.1.93:3000/api/health

# API 응답 시간 테스트
curl -w "@curl-format.txt" -o /dev/null -s http://192.168.1.93:3000/api/health
```

### 로그 분석

```bash
# 오류 로그 검색
docker-compose logs | grep -i error

# 특정 시간대 로그
docker-compose logs --since="2024-01-21T10:00:00"

# 로그 통계
docker-compose logs | grep "GET /api" | wc -l
```

## 🔒 보안 고려사항

### 네트워크 보안

1. **방화벽 설정**: 필요한 포트만 개방
2. **VPN 접근**: 외부 접근 시 VPN 사용 권장
3. **SSL/TLS**: HTTPS 강제 사용

### 데이터 보안

1. **데이터베이스 암호화**: MongoDB 암호화 활성화
2. **백업 암호화**: 중요 데이터 백업 시 암호화
3. **접근 제어**: 최소 권한 원칙 적용

### 애플리케이션 보안

1. **환경변수**: 중요 정보는 환경변수로 관리
2. **JWT 보안**: 강력한 JWT 시크릿 사용
3. **CORS 설정**: 허용된 도메인만 접근 허용

## 📚 추가 자료

### 유용한 명령어

```bash
# 전체 시스템 상태 확인
./deploy.sh status && ./backup.sh list

# 완전한 재배포
./deploy.sh stop && ./deploy.sh deploy

# 개발 모드로 로컬 테스트
npm run dev

# 프로덕션 빌드 테스트
npm run build && npm start
```

### 디렉토리 구조

```
/volume1/docker/ar-namecard/
├── app/                        # 애플리케이션 코드
│   ├── dist/                   # 컴파일된 TypeScript
│   ├── node_modules/           # Node.js 의존성
│   ├── .env                    # 환경 변수
│   ├── docker-compose.yml      # Docker 구성
│   └── firebase-service-account.json
├── data/                       # 데이터베이스 파일
│   ├── mongodb/                # MongoDB 데이터
│   └── mongodb-config/         # MongoDB 설정
├── uploads/                    # 업로드된 파일
├── ssl/                        # SSL 인증서
├── public/                     # 정적 파일
├── backups/                    # 백업 파일
│   ├── mongodb/                # DB 백업
│   ├── uploads/                # 파일 백업
│   ├── config/                 # 설정 백업
│   └── ssl/                    # SSL 백업
└── logs/                       # 로그 파일
```

### 연락처 및 지원

문제 발생 시:
1. 로그 확인 후 문제 분석
2. 공식 문서 참조
3. 개발팀 문의

---

**배포 완료 후 확인사항:**
- ✅ API 엔드포인트 정상 작동: `http://192.168.1.93:3000/api/health`
- ✅ HTTPS 접근 가능: `https://192.168.1.93:3443/api/health`
- ✅ Swagger 문서 접근: `http://192.168.1.93:3000/api-docs`
- ✅ MongoDB 연결 정상
- ✅ 파일 업로드 기능 정상
- ✅ 백업 시스템 동작