import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { corsOptions } from './config/cors';
import { setupSwagger } from './config/swagger';
import path from 'path';
import https from 'https';
import fs from 'fs';
import os from 'os';

import userRoutes from './routes/userRoutes';
import avatarRoutes from './routes/avatarRoutes';
import itemRoutes from './routes/itemRoutes';
import charactersRoutes from './routes/charactersRoutes';
import adminRoutes from './routes/adminRoutes';
import adminAvatarRoutes from './routes/adminAvatarRoutes';
import adminItemRoutes from './routes/adminItemRoutes';
import authRoutes from './routes/authRoutes';
import firebaseAuthRoutes from './routes/firebaseAuthRoutes';

// 환경에 따라 다른 env 파일 로딩
if (process.env.NODE_ENV === 'production') {
  dotenv.config(); // 배포 환경에서는 기본 .env 사용
} else {
  dotenv.config({ path: '.env.local' }); // 개발 환경에서는 .env.local 사용
}

const app = express();
const PORT = parseInt(process.env['PORT'] || '3000', 10);
const HTTPS_PORT = parseInt(process.env['HTTPS_PORT'] || '3443', 10);
const HOST = process.env['HOST'] || '0.0.0.0';
const ENABLE_HTTPS = process.env['ENABLE_HTTPS'] === 'true' && process.env.NODE_ENV !== 'production';

// 로컬 IP 주소 찾기
function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const networkInterface of interfaces[name]!) {
      const { address, family, internal } = networkInterface;
      if (family === 'IPv4' && !internal) {
        return address;
      }
    }
  }
  return '127.0.0.1';
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use('/uploads/thumbnails', express.static('uploads/thumbnails'));
app.use('/uploads/palettes', express.static('uploads/palettes'));

// 정적 파일 서빙 (테스트 페이지용)
app.use('/public', express.static('public'));

// 테스트 페이지 직접 접근 라우트
app.get('/test/avatar', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/test/avatar_new.html'));
});


app.get('/test/item', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/test/item.html'));
});

app.get('/test/user', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/test/user.html'));
});

app.get('/test/login', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/test/login.html'));
});

app.get('/test/customize', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/test/customize.html'));
});

app.get('/test/cors-test', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/test/cors-test.html'));
});

app.get('/test/customize/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/test/customize.html'));
});

connectDB();

setupSwagger(app);

// 단순 이미지 업로드 엔드포인트 (Firebase Storage 사용)
import { upload, uploadToFirebaseStorage } from './middleware/upload';
app.post('/api/upload', upload.single('file'), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No file uploaded' });
    return;
  }
  
  try {
    const result = await uploadToFirebaseStorage(req.file, 'uploads/');
    res.json({ 
      url: result.url,
      filename: result.path 
    });
  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({ message: 'Upload failed', error: (error as Error).message });
  }
});

// Health 체크 엔드포인트 (CloudType용)
app.get(['/health', '/api/health', '/health2'], (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: 'AR Namecard API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled',
    origin: req.headers.origin || 'no-origin',
    mongodb: 'connected',
    firebase: 'configured'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/auth/firebase', firebaseAuthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/avatars', avatarRoutes);
app.use('/api/stickers', itemRoutes);
app.use('/api/characters', charactersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/characters', adminAvatarRoutes);
app.use('/api/admin/stickers', adminItemRoutes);

// 루트 경로 접근 시 API 정보 제공
app.get('/', (_req, res) => {
  res.json({
    message: 'AR Namecard API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      api: {
        auth: '/api/auth',
        users: '/api/users',
        avatars: '/api/avatars',
        stickers: '/api/stickers',
        characters: '/api/characters',
        admin: '/api/admin'
      },
      test: {
        avatar: '/test/avatar',
        item: '/test/item',
        user: '/test/user',
        login: '/test/login',
        customize: '/test/customize'
      },
      docs: '/api-docs'
    }
  });
});

app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// HTTP 서버 시작
app.listen(PORT, HOST, () => {
  const localIp = getLocalIpAddress();
  console.log(`🚀 HTTP Server is running on:`);
  console.log(`   - Local:    http://localhost:${PORT}`);
  console.log(`   - Network:  http://${localIp}:${PORT}`);
  
  if (ENABLE_HTTPS) {
    console.log(`   - HTTPS:    https://localhost:${HTTPS_PORT}`);
    console.log(`   - Network:  https://${localIp}:${HTTPS_PORT}`);
  }
});

// HTTPS 서버 시작 (활성화된 경우)
if (ENABLE_HTTPS) {
  const keyPath = process.env['SSL_KEY_PATH'] || './ssl/server.key';
  const certPath = process.env['SSL_CERT_PATH'] || './ssl/server.crt';
  
  try {
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    const certificate = fs.readFileSync(certPath, 'utf8');
    
    const httpsServer = https.createServer({
      key: privateKey,
      cert: certificate
    }, app);
    
    httpsServer.listen(HTTPS_PORT, HOST, () => {
      console.log(`🔐 HTTPS Server is running on port ${HTTPS_PORT}`);
      console.log(`📱 8th Wall 접근 가능!`);
    });
  } catch (error) {
    console.error('❌ HTTPS 서버 시작 실패:', error);
    console.log('💡 SSL 인증서 생성: node scripts/generate-ssl-cert.js');
  }
}