import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { User } from '../models';

// 환경 변수 로드
dotenv.config();

interface AdminUpdate {
  email: string;
  isAdmin: boolean;
  action: 'remove' | 'add';
}

const updateAdminPermissions = async (): Promise<void> => {
  try {
    console.log('🔧 Starting admin permission updates...');
    
    // MongoDB 연결
    await connectDB();
    console.log('✅ MongoDB connected');

    // 업데이트할 사용자 목록 정의
    const adminUpdates: AdminUpdate[] = [
      {
        email: 'hyeonseo.ahn@hnine.com',
        isAdmin: false,
        action: 'remove'
      },
      {
        email: 'beomseok.jang@hnine.com',
        isAdmin: true,
        action: 'add'
      },
      {
        email: 'kyungmin.woo@hnine.com',
        isAdmin: true,
        action: 'add'
      },
      {
        email: 'daekyo.jeong@hnine.com',
        isAdmin: true,
        action: 'add'
      }
    ];

    console.log(`📝 Processing ${adminUpdates.length} user permission updates...\n`);

    let successCount = 0;
    let failCount = 0;

    // 각 사용자에 대해 권한 업데이트 수행
    for (const update of adminUpdates) {
      try {
        console.log(`🔄 ${update.action === 'add' ? 'Adding' : 'Removing'} admin permission for: ${update.email}`);
        
        const result = await User.findOneAndUpdate(
          { email: update.email },
          { isAdmin: update.isAdmin },
          { new: true }
        );

        if (result) {
          successCount++;
          const actionText = update.action === 'add' ? 'granted' : 'removed';
          console.log(`✅ Admin permission ${actionText} for ${result.email}`);
          console.log(`   📧 Email: ${result.email}`);
          console.log(`   👤 Name: ${result.nameKr}${result.nameEn ? ` (${result.nameEn})` : ''}`);
          console.log(`   🏢 Part: ${result.part}`);
          console.log(`   👑 Admin: ${result.isAdmin}`);
          console.log(`   🆔 AR ID: ${result.arId}\n`);
        } else {
          failCount++;
          console.log(`❌ User not found: ${update.email}\n`);
        }
      } catch (error) {
        failCount++;
        console.error(`💥 Error updating ${update.email}:`, error);
        console.log('');
      }
    }

    // 결과 요약
    console.log('📊 Update Summary:');
    console.log(`✅ Successfully updated: ${successCount} users`);
    console.log(`❌ Failed updates: ${failCount} users`);
    
    if (failCount === 0) {
      console.log('\n🎉 All admin permission updates completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some updates failed. Please check the logs above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Error during admin permission updates:', error);
    process.exit(1);
  }
};

// 스크립트 실행
if (require.main === module) {
  updateAdminPermissions();
}

export { updateAdminPermissions };