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

// 개선된 OpenSSL 설정 파일 생성
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
OU = Development
CN = localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = 127.0.0.1
DNS.4 = ${localIp}
IP.1 = 127.0.0.1
IP.2 = ::1
IP.3 = ${localIp}
IP.4 = 192.168.1.1
IP.5 = 10.0.0.1
`;

const configPath = path.join(sslDir, 'openssl.conf');
fs.writeFileSync(configPath, opensslConfig);

try {
  console.log('🔐 개선된 SSL 인증서 생성 중...');
  
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
  
  // 개인키 생성 (RSA 2048비트)
  console.log('🔑 개인키 생성 중...');
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
  
  // 인증서 생성 (365일 유효)
  console.log('📜 인증서 생성 중...');
  execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}"`, { stdio: 'inherit' });
  
  // 인증서 검증
  console.log('🔍 인증서 검증 중...');
  const certInfo = execSync(`openssl x509 -in "${certPath}" -text -noout`, { encoding: 'utf8' });
  
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
  console.log('- Safari: "고급" → "웹사이트 방문" 클릭');
  
  console.log('\n🔒 인증서 정보:');
  console.log(`- 유효기간: 365일`);
  console.log(`- 지원 도메인: localhost, ${localIp}`);
  console.log(`- 키 사용: digitalSignature, keyEncipherment`);
  console.log(`- 확장 키 사용: serverAuth, clientAuth`);
  
} catch (error) {
  console.error('❌ SSL 인증서 생성 실패:', error.message);
  console.log('\n💡 OpenSSL이 설치되지 않은 경우:');
  console.log('- macOS: brew install openssl');
  console.log('- Ubuntu: sudo apt-get install openssl');
  console.log('- Windows: https://slproweb.com/products/Win32OpenSSL.html');
  
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