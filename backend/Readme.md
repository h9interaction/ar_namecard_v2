# AR Namecard Backend API

AR 명함 서비스를 위한 Node.js + TypeScript + MongoDB + Firebase Storage 백엔드 API

## 🚀 빠른 시작

### 필요 환경
- Node.js 18+
- MongoDB (로컬 또는 Atlas)
- Firebase Storage 설정
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

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 서버 설정
PORT=3000
HTTPS_PORT=3443
HOST=0.0.0.0
NODE_ENV=development
ENABLE_HTTPS=false

# 데이터베이스 설정 (MongoDB Atlas 권장)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ar_namecard

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# 파일 업로드 설정
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# CORS 설정
FRONTEND_URL=http://localhost:3000
CORS_ALLOW_ALL=true

# SSL 설정 (HTTPS용)
SSL_KEY_PATH=./ssl/server.key
SSL_CERT_PATH=./ssl/server.crt

# Firebase Storage 설정 (필수)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
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
| 커스터마이즈 | `/test/customize` | 아바타 커스터마이징 테스트 |
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

# 배포 관련
npm run deploy:cloudtype   # CloudType 배포
npm run deploy:synology    # Synology NAS 배포
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
POST   /api/avatars/upload                 # 아바타 이미지 업로드 (Firebase Storage)
GET    /api/avatars/categories             # 아바타 카테고리 목록
GET    /api/avatars/categories/:id/options # 카테고리별 옵션 목록

# 관리자 전용
POST   /api/admin/characters/categories       # 카테고리 생성
PUT    /api/admin/characters/categories/:id   # 카테고리 수정
DELETE /api/admin/characters/categories/:id   # 카테고리 삭제
POST   /api/admin/characters/categories/:id/options          # 옵션 생성 (다중 업로드 지원)
PUT    /api/admin/characters/categories/:categoryId/options/:optionId   # 옵션 수정
DELETE /api/admin/characters/categories/:categoryId/options/:optionId   # 옵션 삭제
```

### 스티커 관리 (Stickers)
```http
GET    /api/stickers                  # 스티커 목록 조회
GET    /api/stickers/:id              # 스티커 상세 조회

# 관리자 전용
POST   /api/admin/stickers/categories # 카테고리 생성
POST   /api/admin/stickers/categories/:id/items           # 스티커 생성 (스프라이트 지원)
PUT    /api/admin/stickers/categories/:categoryId/items/:itemId   # 스티커 수정
DELETE /api/admin/stickers/categories/:categoryId/items/:itemId   # 스티커 삭제
```

### 캐릭터 관리 (Characters)
```http
GET    /api/characters                # 캐릭터 카테고리 목록
GET    /api/characters/:id            # 캐릭터 카테고리 상세 조회
```

### 관리자 기능 (Admin)
```http
GET    /api/admin/users          # 전체 사용자 목록
PUT    /api/admin/users/:id      # 사용자 권한 관리
```

### 인증 (Auth)
```http
POST   /api/auth/login           # JWT 로그인
POST   /api/auth/firebase/verify # Firebase 토큰 검증
```

### 헬스 체크
```http
GET    /health                   # 서버 상태 확인
GET    /api/health              # API 상태 확인
```

## 📊 데이터 모델

### User (사용자)
```typescript
{
  _id: ObjectId;        // MongoDB ObjectId
  nameEn?: string;      // 영문 이름
  email: string;        // 이메일 (필수, 고유)
  nameKr: string;       // 한글 이름 (필수)
  role?: string;        // 역할 (기본값: 'User')
  part?: string;        // 소속 부서
  phone: string;        // 전화번호 (필수)
  isNamecardActive: boolean; // 명함 활성화 여부
  arId: string;         // AR 명함 ID (3자리, 고유)
  isAdmin: boolean;     // 관리자 여부
  createdAt: Date;      // 생성일
  updatedAt: Date;      // 수정일
}
```

### UserCustomization (사용자 커스터마이징)
```typescript
{
  id: string;           // 사용자 ID (User._id와 연결)
  avatarSelections: {   // 아바타 선택 정보
    [categoryType]: string; // 카테고리별 선택된 옵션 ID
  };
  role?: string;        // 선택된 역할 ID
  item1?: string;       // 선택된 아이템1 ID
  item2?: string;       // 선택된 아이템2 ID
  item3?: string;       // 선택된 아이템3 ID
  avatarImgUrl?: string; // 합성된 아바타 이미지 URL (Firebase Storage)
  message?: string;     // 사용자 메시지
  createdAt: Date;      // 생성일
  updatedAt: Date;      // 수정일
}
```

### AvatarWithUser (아바타 + 사용자 통합 응답)
```typescript
{
  // 사용자 정보
  id: string;
  nameEn?: string;
  email?: string;
  nameKr?: string;
  part?: string;
  phone?: string;
  isNamecardActive?: boolean;
  arId?: string;
  isAdmin?: boolean;
  
  // 아바타 선택 정보 (상세)
  avatarSelections: {
    [categoryType]: {
      id: string;
      name: string;
      imageUrl: string;
      thumbnailUrl: string;
      category: string;
    }
  };
  
  // 역할 및 아이템 (상세)
  role?: { id, name, imageUrl, thumbnailUrl, category };
  item1?: { id, name, imageUrl, thumbnailUrl, category };
  item2?: { id, name, imageUrl, thumbnailUrl, category };
  item3?: { id, name, imageUrl, thumbnailUrl, category };
  
  avatarImgUrl?: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### AvatarCategory (아바타 카테고리)
```typescript
{
  _id: ObjectId;        // MongoDB ObjectId
  name: string;         // 카테고리 이름
  type: string;         // 카테고리 타입 (고유: hair, eyes, nose, mouth, eyebrows)
  options: [{           // 아바타 옵션 배열
    _id: ObjectId;
    name: string;
    imageUrl: string;   // Firebase Storage URL
    thumbnailUrl: string; // Firebase Storage URL
    thumbnailSource: 'user' | 'auto';
    color?: [{          // 색상 옵션 (Hair 카테고리)
      colorName: string;
      imageUrl: string;
      paletteImageUrl?: string; // Firebase Storage URL
      resourceImages?: {        // Hair 전용
        hairMiddleImageUrl: string;
        hairBackImageUrl?: string;
      };
    }];
    order: number;
  }];
  order: number;        // 순서
  createdAt: Date;      // 생성일
  updatedAt: Date;      // 수정일
}
```

### ItemCategory (아이템 카테고리)
```typescript
{
  _id: ObjectId;        // MongoDB ObjectId
  name: string;         // 카테고리 이름
  type: string;         // 카테고리 타입 (고유: role, sticker, etc.)
  items: [{             // 아이템 배열
    _id: ObjectId;
    name: string;
    imageUrl: string;   // Firebase Storage URL
    thumbnailUrl: string; // Firebase Storage URL
    thumbnailSource: 'user' | 'auto';
    animation?: {       // 스프라이트 애니메이션
      frames: number;   // 프레임 수
      columns: number;  // 열 수
      duration: number; // 지속 시간 (ms)
      type: string;     // 애니메이션 타입 (loop, once, etc.)
    };
    animationUrl?: string; // 애니메이션용 이미지 URL
    order: number;
  }];
  order: number;        // 순서
  createdAt: Date;      // 생성일
  updatedAt: Date;      // 수정일
}
```

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts         # MongoDB 연결 (Atlas 지원)
│   │   ├── cors.ts            # CORS 설정 (8th Wall 지원)
│   │   ├── swagger.ts         # Swagger 설정
│   │   └── firebase-storage.ts # Firebase Storage 설정
│   ├── controllers/
│   │   ├── userController.ts
│   │   ├── avatarController.ts
│   │   ├── itemController.ts
│   │   ├── adminController.ts
│   │   ├── adminAvatarController.ts
│   │   ├── adminItemController.ts
│   │   ├── authController.ts
│   │   └── firebaseAuthController.ts
│   ├── middleware/
│   │   ├── auth.ts            # JWT 인증
│   │   └── upload.ts          # 파일 업로드 (Firebase Storage)
│   ├── models/
│   │   ├── User.ts
│   │   ├── UserCustomization.ts
│   │   ├── AvatarCategory.ts
│   │   ├── ItemCategory.ts
│   │   └── index.ts
│   ├── routes/                # API 라우트
│   │   ├── userRoutes.ts
│   │   ├── avatarRoutes.ts
│   │   ├── itemRoutes.ts
│   │   ├── charactersRoutes.ts
│   │   ├── adminRoutes.ts
│   │   ├── adminAvatarRoutes.ts
│   │   ├── adminItemRoutes.ts
│   │   ├── authRoutes.ts
│   │   └── firebaseAuthRoutes.ts
│   ├── scripts/               # 유틸리티 스크립트
│   │   ├── config/
│   │   │   └── firebase-admin.ts
│   │   ├── create-admin.ts
│   │   ├── firebase-migration.ts
│   │   ├── update-admin-permissions.ts
│   │   ├── types/
│   │   │   └── firebase-user.ts
│   │   └── utils/
│   │       ├── arId-generator.ts
│   │       └── data-mapper.ts
│   ├── utils/
│   │   ├── thumbnailGenerator.ts # 썸네일 생성 (Sharp + Firebase Storage)
│   │   └── paletteImageProcessor.ts # 팔레트 이미지 처리
│   └── index.ts               # 서버 엔트리포인트
├── public/test/               # 테스트 페이지들
│   ├── login.html
│   ├── user.html
│   ├── avatar_new.html
│   ├── item.html
│   ├── customize.html
│   └── cors-test.html
├── uploads/                   # 로컬 업로드 파일 (Firebase Storage로 대체)
├── ssl/                       # SSL 인증서
├── scripts/                   # SSL 생성 스크립트
├── dist/                      # 빌드 결과
├── .env.local                 # 개발 환경 변수
├── .env.atlas                 # Atlas 연결 테스트용
├── package.json
├── tsconfig.json
├── docker-compose.yml         # Docker Compose 설정
├── Dockerfile                 # 멀티 스테이지 빌드
├── HTTPS_SETUP.md            # HTTPS 설정 가이드
├── MONGODB_ATLAS_SETUP.md    # MongoDB Atlas 설정 가이드
├── CLOUDTYPE_DEPLOYMENT.md   # CloudType 배포 가이드
├── SYNOLOGY_DEPLOYMENT.md    # Synology NAS 배포 가이드
└── README.md
```

## 🎯 특별 기능

### Firebase Storage 통합
- **모든 파일 업로드**를 Firebase Storage로 처리
- **자동 URL 생성** 및 관리
- **보안 강화**: 로컬 파일 시스템 의존성 제거
- **확장성**: 클라우드 기반 파일 관리

### 썸네일 자동 생성
- **Sharp 라이브러리** 사용으로 300px 썸네일 자동 생성
- **Firebase Storage URL** 지원
- **스프라이트 애니메이션** 첫 번째 프레임 추출
- 사용자 업로드 썸네일과 자동 생성 썸네일 모두 지원

### 다중 파일 업로드
- 아바타/아이템 옵션 **여러 개 동시 업로드**
- **개별 설정**: 이름, 색상, 순서 개별 지정
- **일괄 설정**: 공통 속성 자동 적용
- **드래그 앤 드롭** 지원
- **실시간 진행률** 표시

### Hair 카테고리 특별 지원
- **중간머리/뒷머리** 분리 업로드
- **색상별 팔레트 이미지** 지원
- **리소스 이미지** 자동 관리
- **Hair 전용 검증** 로직

### UI/UX 개선
- **버튼 비활성화**: 장시간 작업 중 중복 클릭 방지
- **로딩 스피너**: 사용자 피드백 개선
- **에러 처리**: 상세한 에러 메시지
- **반응형 디자인**: 다양한 화면 크기 지원

### 파일 관리 시스템
- **Firebase Storage** 기반 파일 관리
- 수정/삭제 시 **관련 파일 자동 삭제**
- 썸네일 재생성 기능
- **URL 파싱** 유틸리티 제공

### 8th Wall 호환
- **HTTPS 필수** 지원
- **Mixed Content** 정책 준수
- 모든 8th Wall 도메인 CORS 허용
- **네트워크 접근** 최적화

## 🧪 테스트 방법

### 1. 기본 연결 테스트
```bash
curl http://localhost:3000/health
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
- **아바타 관리**: `/test/avatar` (다중 업로드, 썸네일 생성, Hair 지원)
- **아이템 관리**: `/test/item` (스프라이트 애니메이션)
- **커스터마이징**: `/test/customize` (아바타 합성, 토큰 관리)

### 5. Firebase Storage 테스트
```bash
# Firebase 연결 테스트
node test-firebase-upload.js

# Atlas 연결 테스트
node test-atlas-connection.js
```

## 🔧 개발 도구

- **TypeScript**: 정적 타입 검사
- **Express**: 웹 프레임워크  
- **MongoDB + Mongoose**: 데이터베이스 (Atlas 지원)
- **Firebase Storage**: 파일 저장소
- **JWT**: 인증
- **Firebase Admin**: Firebase 인증
- **Multer**: 파일 업로드 (메모리 스토리지)
- **Sharp**: 이미지 처리 및 썸네일 생성
- **Swagger**: API 문서화
- **Express-validator**: 데이터 유효성 검사
- **CORS**: 크로스 오리진 설정
- **Docker**: 컨테이너화

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
echo "CORS_ALLOW_ALL=true" >> .env.local
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
# MongoDB Atlas 연결 확인
node test-atlas-connection.js

# 로컬 MongoDB 실행
brew services start mongodb/brew/mongodb-community
```

### Firebase Storage 오류
```bash
# Firebase 설정 확인
node test-firebase-upload.js

# 환경 변수 확인
echo $FIREBASE_PROJECT_ID
```

### 파일 업로드 오류
```bash
# 파일 크기 제한 확인
echo $MAX_FILE_SIZE

# Firebase Storage 권한 확인
# Firebase Console에서 Storage 규칙 확인
```

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. MongoDB Atlas 연결 상태
2. Firebase Storage 설정 및 권한
3. 환경 변수 설정 (.env.local 파일)
4. 포트 사용 상태
5. 네트워크 방화벽 설정
6. SSL 인증서 유효성

## 🔄 배포 가이드

### CloudType 배포
```bash
npm run deploy:cloudtype
```

### Synology NAS 배포
```bash
npm run deploy:synology
```

### Docker 배포
```bash
docker build -t ar-namecard-backend .
docker run -p 3000:3000 ar-namecard-backend
```

---

**AR Namecard Backend API v1.0.0**  
Node.js + TypeScript + MongoDB + Firebase Storage 기반의 완전한 AR 명함 백엔드 솔루션