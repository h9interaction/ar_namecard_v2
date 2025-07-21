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

// OpenSSL 설정 파일 생성
const opensslConfig = `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = KR
ST = Seoul
L = Seoul
O = AR Namecard Dev
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
IP.3 = ${localIp}
`;

const configPath = path.join(sslDir, 'openssl.conf');
fs.writeFileSync(configPath, opensslConfig);

try {
  console.log('🔐 SSL 인증서 생성 중...');
  
  // 개인키 생성
  const keyPath = path.join(sslDir, 'server.key');
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
  
  // 인증서 생성
  const certPath = path.join(sslDir, 'server.crt');
  execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}"`, { stdio: 'inherit' });
  
  console.log('✅ SSL 인증서 생성 완료!');
  console.log(`📁 인증서 위치: ${sslDir}`);
  console.log(`🔑 개인키: ${keyPath}`);
  console.log(`📜 인증서: ${certPath}`);
  
  // 설정 파일 삭제
  fs.unlinkSync(configPath);
  
  console.log('\n🚀 HTTPS 서버 설정:');
  console.log('1. .env 파일에 ENABLE_HTTPS=true 설정');
  console.log('2. npm run dev 또는 npm start로 서버 실행');
  console.log(`3. https://localhost:3443 또는 https://${localIp}:3443 접속`);
  
  console.log('\n⚠️  브라우저 경고 해결 방법:');
  console.log('- Chrome: "고급" → "localhost(안전하지 않음)로 이동" 클릭');
  console.log('- Firefox: "고급" → "위험을 감수하고 계속" 클릭');
  console.log('- 또는 로컬 CA 설정으로 신뢰할 수 있는 인증서 만들기');
  
} catch (error) {
  console.error('❌ SSL 인증서 생성 실패:', error.message);
  console.log('\n💡 OpenSSL이 설치되지 않은 경우:');
  console.log('- macOS: brew install openssl');
  console.log('- Ubuntu: sudo apt-get install openssl');
  console.log('- Windows: https://slproweb.com/products/Win32OpenSSL.html');
  process.exit(1);
}