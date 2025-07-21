import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models';

// 환경 변수 로드
dotenv.config();

const createAdmin = async (): Promise<void> => {
  try {
    console.log('🔧 Creating admin user...');
    
    // MongoDB 연결
    await connectDB();
    console.log('✅ MongoDB connected');

    // arId 001 사용자를 관리자로 변경
    const result = await User.findOneAndUpdate(
      { arId: '001' },
      { isAdmin: true },
      { new: true }
    );

    if (result) {
      console.log(`✅ User ${result.email} (arId: ${result.arId}) is now an admin`);
      console.log(`📧 Email: ${result.email}`);
      console.log(`👤 Name: ${result.nameKr} (${result.nameEn})`);
      console.log(`🏢 Part: ${result.part}`);
      console.log(`👑 Admin: ${result.isAdmin}`);
    } else {
      console.log('❌ User with arId 001 not found');
    }

    console.log('\n🎉 Admin creation completed!');
    process.exit(0);

  } catch (error) {
    console.error('💥 Error creating admin:', error);
    process.exit(1);
  }
};

// 스크립트 실행
if (require.main === module) {
  createAdmin();
}