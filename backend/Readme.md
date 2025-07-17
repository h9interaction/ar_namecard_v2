# AR Namecard Backend API

AR 명함 서비스를 위한 Node.js + TypeScript + MongoDB 백엔드 API

## 🚀 시작하기

### 필요 환경
- Node.js 18+
- MongoDB
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

### 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/ar_namecard

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

## 📚 API 문서

서버 실행 후 Swagger UI를 통해 API를 테스트할 수 있습니다:

**Swagger UI: http://localhost:3000/api-docs**

## 🛠 API 엔드포인트

### 사용자 관리 (Users)
- `GET /api/users/:id` - 사용자 정보 조회
- `PUT /api/users/:id` - 사용자 정보 수정
- `POST /api/users` - 사용자 생성

### 아바타 관리 (Avatars)
- `GET /api/avatars/:userId` - 아바타 정보 조회
- `PUT /api/avatars/:userId` - 아바타 정보 수정
- `POST /api/avatars/upload` - 아바타 이미지 업로드

### 아이템 관리 (Items)
- `GET /api/items` - 아이템 목록 조회
- `GET /api/items/:id` - 아이템 상세 조회
- `GET /api/items/avatar-categories` - 아바타 카테고리 목록 조회
- `GET /api/items/avatar-categories/:id` - 아바타 카테고리 상세 조회

### 관리자 기능 (Admin)
- `GET /api/admin/users` - 전체 사용자 목록 조회
- `PUT /api/admin/users/:id` - 사용자 권한 관리

## 🔐 인증

대부분의 API 엔드포인트는 JWT 토큰을 통한 인증이 필요합니다.

**Header:**
```
Authorization: Bearer <your-jwt-token>
```

## 📊 데이터 모델

### User (사용자)
- `id`: 사용자 ID
- `nameEn`: 영문 이름
- `email`: 이메일 (필수, 고유)
- `nameKr`: 한글 이름 (필수)
- `role`: 역할 (기본값: 'User')
- `part`: 소속 부서
- `phone`: 전화번호 (필수)
- `isNamecardActive`: 명함 활성화 여부
- `arId`: AR 명함 ID (3자리, 고유)
- `isAdmin`: 관리자 여부

### UserCustomization (사용자 커스터마이징)
- `id`: 사용자 ID 참조
- `avatarSelections`: 아바타 선택 옵션
- `role`: 역할
- `item1`, `item2`, `item3`: 아이템 설정
- `avatarImgUrl`: 아바타 이미지 URL

### AvatarCategory (아바타 카테고리)
- `name`: 카테고리 이름
- `type`: 카테고리 타입 (고유)
- `options`: 아바타 옵션 배열
- `order`: 순서

### ItemCategory (아이템 카테고리)
- `name`: 카테고리 이름
- `type`: 카테고리 타입 (고유)
- `items`: 아이템 배열
- `order`: 순서

## 📁 프로젝트 구조

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts     # MongoDB 연결
│   │   ├── cors.ts         # CORS 설정
│   │   └── swagger.ts      # Swagger 설정
│   ├── controllers/        # 컨트롤러
│   ├── middleware/         # 미들웨어
│   ├── models/             # MongoDB 모델
│   ├── routes/             # API 라우트
│   └── index.ts            # 서버 엔트리포인트
├── uploads/                # 업로드 파일
├── dist/                   # 빌드 결과
├── .env                    # 환경 변수
├── .env.example           # 환경 변수 예시
├── package.json
├── tsconfig.json
└── README.md
```

## 🧪 테스트 방법

1. **개발 서버 실행**
   ```bash
   npm run dev
   ```

2. **Swagger UI 접속**
   - 브라우저에서 `http://localhost:3000/api-docs` 접속

3. **API 테스트**
   - 각 엔드포인트의 "Try it out" 버튼을 클릭하여 직접 테스트 가능
   - 인증이 필요한 API는 상단의 "Authorize" 버튼으로 JWT 토큰 설정

## 🔧 개발 도구

- **TypeScript**: 정적 타입 검사
- **Express**: 웹 프레임워크
- **MongoDB + Mongoose**: 데이터베이스
- **JWT**: 인증
- **Multer**: 파일 업로드
- **Swagger**: API 문서화
- **Express-validator**: 데이터 유효성 검사
- **CORS**: 크로스 오리진 설정