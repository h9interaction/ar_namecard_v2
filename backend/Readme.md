# AR Namecard Backend API

AR 명함 서비스를 위한 Node.js + TypeScript + MongoDB 백엔드 API

## 🚀 빠른 시작

### 필요 환경
- Node.js 18+
- MongoDB 실행 중
- npm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## ⚙️ 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 서버 설정
PORT=3000
HTTPS_PORT=3443
HOST=0.0.0.0
NODE_ENV=development
ENABLE_HTTPS=false

# 데이터베이스 설정
MONGODB_URI=mongodb://localhost:27017/ar_namecard

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# 파일 업로드 설정
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# CORS 설정
FRONTEND_URL=http://localhost:3000

# SSL 설정 (HTTPS용)
SSL_KEY_PATH=./ssl/server.key
SSL_CERT_PATH=./ssl/server.crt

# Firebase 설정 (선택사항)
# FIREBASE_PROJECT_ID=your-firebase-project-id
# FIREBASE_PRIVATE_KEY=your-firebase-private-key
```

## 🌐 네트워크 및 HTTPS 설정

### HTTP 전용 모드 (기본)
```bash
npm run dev
```

### HTTPS 모드 (8th Wall 호환)

#### 1. SSL 인증서 생성
```bash
# 기본 SSL 인증서 생성
npm run ssl:generate

# 개선된 SSL 인증서 생성 (권장)
npm run ssl:fix

# mkcert 사용 (브라우저 경고 없음, 최고 권장)
npm run ssl:mkcert
```

#### 2. HTTPS 서버 실행
```bash
# 환경 변수로 실행
npm run https

# 또는 .env에 ENABLE_HTTPS=true 설정 후
npm run dev
```

### 로컬 네트워크 접근

#### 접근 URL
- **로컬**: `http://localhost:3000` / `https://localhost:3443`
- **네트워크**: `http://[IP]:3000` / `https://[IP]:3443`

#### 브라우저 보안 경고 해결
- **Chrome**: "고급" → "localhost(안전하지 않음)로 이동"
- **Firefox**: "고급" → "위험을 감수하고 계속"
- **Safari**: "자세히" → "웹사이트 방문"

## 📚 API 문서 및 테스트

### Swagger UI
서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:
- **로컬**: `http://localhost:3000/api-docs`
- **네트워크**: `http://[IP]:3000/api-docs`

### 테스트 페이지
다음 테스트 페이지들이 제공됩니다:

| 페이지 | URL | 설명 |
|--------|-----|------|
| 로그인 테스트 | `/test/login` | Firebase 인증 테스트 |
| 사용자 관리 | `/test/user` | 사용자 CRUD 테스트 |
| 아바타 관리 | `/test/avatar` | 아바타 카테고리 및 옵션 관리 |
| 아이템 관리 | `/test/item` | 아이템 카테고리 및 스프라이트 관리 |
| CORS 테스트 | `/test/cors-test` | 네트워크 접근 및 CORS 테스트 |

### CORS 테스트
다른 PC에서 접근 테스트:
```
http://[서버IP]:3000/test/cors-test
```

## 🛠 사용 가능한 스크립트

```bash
# 개발 및 빌드
npm run dev          # 개발 서버 (nodemon)
npm run build        # TypeScript 컴파일
npm start            # 프로덕션 서버

# HTTPS 관련
npm run https        # HTTPS 개발 서버
npm run http-only    # HTTP 전용 서버
npm run ssl:generate # 기본 SSL 인증서 생성
npm run ssl:fix      # 개선된 SSL 인증서 생성
npm run ssl:mkcert   # mkcert 기반 신뢰 인증서 생성

# 데이터베이스 관리
npm run migrate:firebase    # Firebase 데이터 마이그레이션
npm run create:admin       # 관리자 계정 생성
npm run update:admin       # 관리자 권한 업데이트
```

## 🔐 인증 시스템

### JWT 토큰 인증
대부분의 API는 JWT 토큰이 필요합니다:
```http
Authorization: Bearer <your-jwt-token>
```

### Firebase 인증
Google OAuth를 통한 Firebase 인증도 지원합니다:
- Firebase Console에서 승인된 도메인에 서버 IP 추가 필요
- 로컬 네트워크 접근 시 `http://[IP]:3000` 도메인 추가

## 🛠 API 엔드포인트

### 사용자 관리 (Users)
```http
GET    /api/users/:id        # 사용자 정보 조회
PUT    /api/users/:id        # 사용자 정보 수정
POST   /api/users            # 사용자 생성
GET    /api/users            # 사용자 목록 (관리자)
```

### 아바타 관리 (Avatars)
```http
GET    /api/avatars/:id                    # 아바타 정보 조회 (상세)
PUT    /api/avatars/:id                    # 아바타 정보 수정
GET    /api/avatars/categories             # 아바타 카테고리 목록
GET    /api/avatars/categories/:id/options # 카테고리별 옵션 목록

# 관리자 전용
POST   /api/admin/avatars/categories       # 카테고리 생성
PUT    /api/admin/avatars/categories/:id   # 카테고리 수정
DELETE /api/admin/avatars/categories/:id   # 카테고리 삭제
POST   /api/admin/avatars/options          # 옵션 생성 (다중 업로드 지원)
```

### 아이템 관리 (Items)
```http
GET    /api/items                     # 아이템 목록 조회
GET    /api/items/categories          # 아이템 카테고리 목록
GET    /api/items/categories/:id      # 카테고리별 아이템 목록

# 관리자 전용
POST   /api/admin/items/categories    # 카테고리 생성
POST   /api/admin/items              # 아이템 생성 (스프라이트 지원)
```

### 관리자 기능 (Admin)
```http
GET    /api/admin/users          # 전체 사용자 목록
PUT    /api/admin/users/:id      # 사용자 권한 관리
```

### 헬스 체크
```http
GET    /api/health               # 서버 상태 확인
```

## 📊 데이터 모델

### User (사용자)
```typescript
{
  id: string;           // 사용자 ID
  nameEn?: string;      // 영문 이름
  email: string;        // 이메일 (필수, 고유)
  nameKr: string;       // 한글 이름 (필수)
  role?: string;        // 역할 (기본값: 'User')
  part?: string;        // 소속 부서
  phone: string;        // 전화번호 (필수)
  isNamecardActive: boolean; // 명함 활성화 여부
  arId: string;         // AR 명함 ID (3자리, 고유)
  isAdmin: boolean;     // 관리자 여부
}
```

### AvatarWithUser (아바타 + 사용자 통합)
```typescript
{
  // 사용자 정보
  id: string;
  nameKr?: string;
  email?: string;
  arId?: string;
  
  // 아바타 선택 정보 (상세)
  avatarSelections: {
    [category]: {
      id: string;
      name: string;
      imageUrl: string;
      thumbnailUrl: string;
    }
  };
  
  // 역할 및 아이템 (상세)
  role?: { id, name, imageUrl, thumbnailUrl };
  item1?: { id, name, imageUrl, thumbnailUrl, category };
  item2?: { id, name, imageUrl, thumbnailUrl, category };
  item3?: { id, name, imageUrl, thumbnailUrl, category };
  
  avatarImgUrl?: string;
  message: string;
}
```

### AvatarCategory (아바타 카테고리)
```typescript
{
  name: string;         // 카테고리 이름
  type: string;         // 카테고리 타입 (고유)
  options: [{           // 아바타 옵션 배열
    name: string;
    imageUrl: string;
    thumbnailUrl: string;
    thumbnailSource: 'user' | 'auto';
    color?: string;
    order: number;
  }];
  order: number;        // 순서
}
```

### ItemCategory (아이템 카테고리)
```typescript
{
  name: string;         // 카테고리 이름
  type: string;         // 카테고리 타입 (고유)
  items: [{             // 아이템 배열
    name: string;
    imageUrl: string;
    thumbnailUrl: string;
    thumbnailSource: 'user' | 'auto';
    animation?: {       // 스프라이트 애니메이션
      frames: number;   // 프레임 수
      columns: number;  // 열 수
      duration: number; // 지속 시간
      type: string;     // 애니메이션 타입
    };
    order: number;
  }];
  order: number;        // 순서
}
```

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts         # MongoDB 연결
│   │   ├── cors.ts            # CORS 설정 (8th Wall 지원)
│   │   └── swagger.ts         # Swagger 설정
│   ├── controllers/
│   │   ├── userController.ts
│   │   ├── avatarController.ts
│   │   ├── itemController.ts
│   │   ├── adminController.ts
│   │   └── firebaseAuthController.ts
│   ├── middleware/
│   │   ├── auth.ts            # JWT 인증
│   │   └── upload.ts          # 파일 업로드
│   ├── models/
│   │   ├── User.ts
│   │   ├── UserCustomization.ts
│   │   ├── AvatarCategory.ts
│   │   └── ItemCategory.ts
│   ├── routes/                # API 라우트
│   ├── scripts/               # 유틸리티 스크립트
│   ├── utils/
│   │   └── thumbnailGenerator.ts # 썸네일 생성 (Sharp)
│   └── index.ts               # 서버 엔트리포인트
├── public/test/               # 테스트 페이지들
├── uploads/                   # 업로드 파일
├── ssl/                       # SSL 인증서
├── scripts/                   # SSL 생성 스크립트
├── dist/                      # 빌드 결과
├── .env                       # 환경 변수
├── package.json
├── tsconfig.json
├── HTTPS_SETUP.md            # HTTPS 설정 가이드
└── README.md
```

## 🎯 특별 기능

### 썸네일 자동 생성
- **Sharp 라이브러리** 사용으로 300px 썸네일 자동 생성
- **스프라이트 애니메이션** 첫 번째 프레임 추출
- 사용자 업로드 썸네일과 자동 생성 썸네일 모두 지원

### 다중 파일 업로드
- 아바타/아이템 옵션 **여러 개 동시 업로드**
- **개별 설정**: 이름, 색상, 순서 개별 지정
- **일괄 설정**: 공통 속성 자동 적용
- **드래그 앤 드롭** 지원

### 파일 관리 시스템
- 수정/삭제 시 **관련 파일 자동 삭제**
- 썸네일 재생성 기능
- 파일 경로 유틸리티 제공

### 8th Wall 호환
- **HTTPS 필수** 지원
- **Mixed Content** 정책 준수
- 모든 8th Wall 도메인 CORS 허용

## 🧪 테스트 방법

### 1. 기본 연결 테스트
```bash
curl http://localhost:3000/api/health
```

### 2. Swagger UI 테스트
1. 브라우저에서 `http://localhost:3000/api-docs` 접속
2. **Avatars** 섹션이 기본으로 확장됨
3. 각 API의 "Try it out" 버튼으로 테스트

### 3. 네트워크 접근 테스트
1. 다른 PC에서 `http://[서버IP]:3000/test/cors-test` 접속
2. 모든 API 테스트 실행
3. CORS 허용/차단 상태 실시간 확인

### 4. 관리자 페이지 테스트
- **사용자 관리**: `/test/user`
- **아바타 관리**: `/test/avatar` (다중 업로드, 썸네일 생성)
- **아이템 관리**: `/test/item` (스프라이트 애니메이션)

## 🔧 개발 도구

- **TypeScript**: 정적 타입 검사
- **Express**: 웹 프레임워크  
- **MongoDB + Mongoose**: 데이터베이스
- **JWT**: 인증
- **Firebase Admin**: Firebase 인증
- **Multer**: 파일 업로드
- **Sharp**: 이미지 처리 및 썸네일 생성
- **Swagger**: API 문서화
- **Express-validator**: 데이터 유효성 검사
- **CORS**: 크로스 오리진 설정

## 🚨 문제 해결

### SSL 인증서 오류 (ERR_SSL_KEY_USAGE_INCOMPATIBLE)
```bash
# 개선된 인증서 생성
npm run ssl:fix

# 또는 mkcert 사용 (권장)
brew install mkcert
npm run ssl:mkcert
```

### CORS 오류
```bash
# 개발 모드에서 모든 도메인 허용
echo "CORS_ALLOW_ALL=true" >> .env
```

### 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :3000

# 프로세스 종료
kill -9 [PID]
```

### MongoDB 연결 오류
```bash
# MongoDB 실행 확인
brew services start mongodb/brew/mongodb-community
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. MongoDB 실행 상태
2. 환경 변수 설정 (.env 파일)
3. 포트 사용 상태
4. 네트워크 방화벽 설정
5. SSL 인증서 유효성

---

**AR Namecard Backend API v1.0.0**  
Node.js + TypeScript + MongoDB 기반의 완전한 AR 명함 백엔드 솔루션