#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// SSL 디렉토리 생성
const sslDir = path.join(__dirname, '../ssl');
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
}

// 로컬 IP 주소 찾기
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      const { address, family, internal } = interface;
      if (family === 'IPv4' && !internal) {
        return address;
      }
    }
  }
  return '127.0.0.1';
}

const localIp = getLocalIpAddress();
console.log(`🔍 로컬 IP 주소: ${localIp}`);

// mkcert 설치 확인
function checkMkcert() {
  try {
    execSync('mkcert -version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// mkcert 설치 안내
function installMkcert() {
  console.log('📦 mkcert 설치가 필요합니다.');
  console.log('다음 명령어로 설치하세요:');
  
  const platform = os.platform();
  switch (platform) {
    case 'darwin':
      console.log('🍎 macOS:');
      console.log('  brew install mkcert');
      console.log('  brew install nss  # Firefox 지원용');
      break;
    case 'linux':
      console.log('🐧 Linux:');
      console.log('  # Ubuntu/Debian:');
      console.log('  sudo apt install libnss3-tools');
      console.log('  curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"');
      console.log('  chmod +x mkcert-v*-linux-amd64');
      console.log('  sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert');
      break;
    case 'win32':
      console.log('🪟 Windows:');
      console.log('  choco install mkcert');
      console.log('  # 또는 수동 다운로드: https://github.com/FiloSottile/mkcert/releases');
      break;
    default:
      console.log('💻 기타 플랫폼: https://github.com/FiloSottile/mkcert#installation');
  }
  
  console.log('\n설치 후 다시 실행하세요: node scripts/setup-mkcert.js');
  process.exit(1);
}

try {
  // mkcert 설치 확인
  if (!checkMkcert()) {
    installMkcert();
  }
  
  console.log('✅ mkcert가 설치되어 있습니다.');
  
  // 로컬 CA 설치 (처음 실행 시에만)
  console.log('🔐 로컬 CA 설치 중...');
  try {
    execSync('mkcert -install', { stdio: 'inherit' });
    console.log('✅ 로컬 CA 설치 완료');
  } catch (error) {
    console.log('ℹ️  로컬 CA가 이미 설치되어 있습니다.');
  }
  
  // 기존 인증서 백업
  const keyPath = path.join(sslDir, 'server.key');
  const certPath = path.join(sslDir, 'server.crt');
  
  if (fs.existsSync(keyPath)) {
    fs.renameSync(keyPath, keyPath + '.backup');
    console.log('📦 기존 개인키 백업 완료');
  }
  
  if (fs.existsSync(certPath)) {
    fs.renameSync(certPath, certPath + '.backup');
    console.log('📦 기존 인증서 백업 완료');
  }
  
  // mkcert로 신뢰할 수 있는 인증서 생성
  console.log('📜 신뢰할 수 있는 SSL 인증서 생성 중...');
  const certCommand = `mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 ::1 ${localIp}`;
  
  execSync(certCommand, { stdio: 'inherit', cwd: sslDir });
  
  console.log('✅ SSL 인증서 생성 완료!');
  console.log(`📁 인증서 위치: ${sslDir}`);
  console.log(`🔑 개인키: ${keyPath}`);
  console.log(`📜 인증서: ${certPath}`);
  
  console.log('\n🚀 HTTPS 서버 설정:');
  console.log('1. .env 파일에 ENABLE_HTTPS=true 설정');
  console.log('2. npm run dev 또는 npm start로 서버 실행');
  console.log(`3. https://localhost:3443 또는 https://${localIp}:3443 접속`);
  
  console.log('\n🎉 브라우저 경고 없음!');
  console.log('- mkcert로 생성된 인증서는 브라우저에서 신뢰됩니다.');
  console.log('- 별도의 경고 무시 작업이 필요하지 않습니다.');
  
  console.log('\n🔒 인증서 정보:');
  console.log(`- 유효기간: 약 10년`);
  console.log(`- 지원 도메인: localhost, 127.0.0.1, ${localIp}`);
  console.log(`- 브라우저 신뢰: Chrome, Firefox, Safari 모두 지원`);
  
} catch (error) {
  console.error('❌ SSL 인증서 생성 실패:', error.message);
  
  // 백업 파일 복구
  const keyPath = path.join(sslDir, 'server.key');
  const certPath = path.join(sslDir, 'server.crt');
  
  if (fs.existsSync(keyPath + '.backup')) {
    fs.renameSync(keyPath + '.backup', keyPath);
    console.log('🔄 기존 개인키 복구 완료');
  }
  
  if (fs.existsSync(certPath + '.backup')) {
    fs.renameSync(certPath + '.backup', certPath);
    console.log('🔄 기존 인증서 복구 완료');
  }
  
  process.exit(1);
} 