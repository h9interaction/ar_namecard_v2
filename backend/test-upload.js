const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios').default;
const path = require('path');

// 간단한 테스트 이미지 파일 생성 (1px 투명 PNG)
const createTestImage = () => {
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0B, 0x49, 0x44, 0x41, 0x54, 0x78, 0xDA, 0x63, 0x60, 0x00, 0x02, 0x00,
    0x00, 0x05, 0x00, 0x01, 0xE2, 0x26, 0x05, 0x9B, 0x00, 0x00, 0x00, 0x00,
    0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testImagePath = path.join(__dirname, 'test-image.png');
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
};

async function testUpload() {
  try {
    console.log('🔍 Firebase Storage 업로드 테스트 시작...');
    
    // 테스트 이미지 생성
    const testImagePath = createTestImage();
    console.log('✅ 테스트 이미지 생성 완료:', testImagePath);
    
    // FormData 준비
    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-image.png',
      contentType: 'image/png'
    });
    
    console.log('📤 업로드 요청 전송 중...');
    
    const response = await axios.post('http://localhost:3002/api/upload', form, {
      headers: {
        ...form.getHeaders(),
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000
    });
    
    if (response.status === 200) {
      console.log('🎉 업로드 성공!');
      console.log('📋 응답 데이터:', response.data);
      console.log('🔗 Firebase Storage URL:', response.data.url);
    } else {
      console.log('❌ 업로드 실패:', response.status, response.statusText);
    }
    
    // 테스트 파일 정리
    fs.unlinkSync(testImagePath);
    console.log('🧹 테스트 파일 정리 완료');
    
  } catch (error) {
    console.error('💥 업로드 테스트 오류:', error.response?.data || error.message);
    
    // 상세 에러 정보
    if (error.response) {
      console.error('📊 에러 상태:', error.response.status);
      console.error('📋 에러 데이터:', error.response.data);
    }
  }
}

testUpload();