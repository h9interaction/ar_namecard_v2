import { CorsOptions } from 'cors';

// 환경 변수 읽기
const isDevelopment = process.env.NODE_ENV === 'development';
const allowAllOrigins = process.env.CORS_ALLOW_ALL === 'true';

// 개발자 모드에서 모든 origin 허용
if (isDevelopment && allowAllOrigins) {
  console.log('🔓 CORS: 개발자 모드 - 모든 origin 허용');
}

// 개발 환경에서 로컬 네트워크 자동 허용
if (isDevelopment) {
  console.log('🌐 CORS: 개발 모드 - 로컬 네트워크 접근 허용');
}

// 기본 허용 도메인 목록
const allowedOrigins = [
  // 로컬 개발 환경
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:3443',
  'https://localhost:3001',
  
  // 8th Wall 도메인
  'https://8thwall.com',
  'https://www.8thwall.com',
  'https://console.8thwall.com',
  'https://8thwall.app',
  'https://www.8thwall.app',
  
  // 로컬 네트워크 (모든 사설 IP 대역)
  /^https?:\/\/192\.168\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^https?:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}(:\d+)?$/,
  
  // 8th Wall 동적 도메인 패턴
  /^https:\/\/.*\.8thwall\.com$/,
  /^https:\/\/.*\.8thwall\.app$/,
  
  // 테스트 도메인
  'http://test.com',
  'https://test.com',
  'https://192.168.1.20',
  
  // 개발 환경 추가 지원
  ...(isDevelopment ? [
    // 로컬 호스트 변형
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000',
    'https://127.0.0.1:3443',
    'https://0.0.0.0:3443',
    
    // 더 넓은 로컬 네트워크 지원
    /^https?:\/\/.*\.local(:\d+)?$/,
    /^https?:\/\/.*\.lan(:\d+)?$/,
    
    // 개발자 도구 지원
    'null', // file:// 프로토콜용
  ] : []),
  
  // 프로덕션 도메인 추가
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // 개발자 모드에서 모든 origin 허용
    if (isDevelopment && allowAllOrigins) {
      console.log(`✅ CORS: 모든 origin 허용 모드 - ${origin}`);
      return callback(null, true);
    }
    
    // origin이 없는 경우 (같은 도메인 요청) 허용
    if (!origin) {
      return callback(null, true);
    }
    
    // 개발 환경에서 로컬 네트워크 자동 허용
    if (isDevelopment) {
      const isLocalNetwork = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i.test(origin);
      
      if (isLocalNetwork) {
        console.log(`✅ CORS: 로컬 네트워크 허용 - ${origin}`);
        return callback(null, true);
      }
    }
    
    // 허용된 origin 목록 확인
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`✅ CORS: 허용된 origin - ${origin}`);
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: 차단된 origin - ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin'
  ]
};