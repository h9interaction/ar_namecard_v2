const mongoose = require('mongoose');
const dotenv = require('dotenv');

// .env 파일 로드
dotenv.config();

// MongoDB 연결
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ar_namecard');
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
};

// AvatarCategory 스키마 정의
const avatarOptionSchema = new mongoose.Schema({
  name: String,
  imageUrl: String,
  modelUrl: String,
  thumbnailUrl: String,
  thumbnailSource: String,
  color: mongoose.Schema.Types.Mixed, // 다양한 타입 허용
  order: Number
}, { timestamps: true });

const avatarCategorySchema = new mongoose.Schema({
  name: String,
  type: String,
  options: [avatarOptionSchema],
  order: Number
}, { timestamps: true });

const AvatarCategory = mongoose.model('AvatarCategory', avatarCategorySchema);

// 마이그레이션 함수
async function migrateAvatarColors() {
  try {
    console.log('🔄 아바타 컬러 데이터 마이그레이션 시작...');
    
    const categories = await AvatarCategory.find({});
    let totalUpdated = 0;
    
    for (const category of categories) {
      let categoryUpdated = false;
      
      for (const option of category.options) {
        // 잘못된 형태의 color 데이터 감지
        if (option.color && typeof option.color === 'object' && !Array.isArray(option.color)) {
          // 객체 형태로 저장된 경우 (예: {"0": "#", "1": "0", ...})
          if (option.color.hasOwnProperty('0') && option.color.hasOwnProperty('1')) {
            console.log(`🔧 잘못된 컬러 데이터 발견: ${category.name} - ${option.name}`);
            
            // 원본 색상 문자열 복원
            let colorString = '';
            for (let i = 0; option.color.hasOwnProperty(i.toString()); i++) {
              colorString += option.color[i.toString()];
            }
            
            console.log(`   복원된 컬러: ${colorString}`);
            
            // 새로운 형태로 변환
            if (colorString && option.imageUrl) {
              const colorName = colorString === '#000000' ? 'Black' : 
                              colorString === '#ffffff' ? 'White' : 
                              colorString.startsWith('#') ? colorString : 'Default';
              
              option.color = [{
                colorName: colorName,
                imageUrl: option.imageUrl
              }];
              
              categoryUpdated = true;
              totalUpdated++;
              console.log(`   ✅ 변환 완료: ${colorName}`);
            }
          }
        }
        // 문자열 형태의 color 데이터 변환
        else if (typeof option.color === 'string' && option.imageUrl) {
          console.log(`🔧 문자열 컬러 데이터 변환: ${category.name} - ${option.name} (${option.color})`);
          
          const colorName = option.color === '#000000' ? 'Black' : 
                          option.color === '#ffffff' ? 'White' : 
                          option.color;
          
          option.color = [{
            colorName: colorName,
            imageUrl: option.imageUrl
          }];
          
          categoryUpdated = true;
          totalUpdated++;
          console.log(`   ✅ 변환 완료: ${colorName}`);
        }
        // color가 없고 imageUrl만 있는 경우
        else if (!option.color && option.imageUrl) {
          console.log(`🔧 컬러 없는 옵션 처리: ${category.name} - ${option.name}`);
          
          option.color = [{
            colorName: 'Default',
            imageUrl: option.imageUrl
          }];
          
          categoryUpdated = true;
          totalUpdated++;
          console.log(`   ✅ 기본 컬러 옵션 생성`);
        }
      }
      
      if (categoryUpdated) {
        await category.save();
        console.log(`💾 카테고리 저장 완료: ${category.name}`);
      }
    }
    
    console.log(`\n🎉 마이그레이션 완료!`);
    console.log(`   - 총 ${totalUpdated}개의 옵션이 업데이트되었습니다.`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류:', error);
  }
}

// 실행
async function main() {
  await connectDB();
  await migrateAvatarColors();
  
  console.log('\n🔍 마이그레이션 결과 확인...');
  
  // 결과 확인
  const categories = await AvatarCategory.find({}).limit(2);
  for (const category of categories) {
    console.log(`\n📂 ${category.name}:`);
    for (const option of category.options.slice(0, 2)) {
      console.log(`   - ${option.name}: ${JSON.stringify(option.color, null, 2)}`);
    }
  }
  
  console.log('\n✨ 작업 완료! MongoDB 연결을 종료합니다.');
  await mongoose.connection.close();
}

main().catch(console.error);