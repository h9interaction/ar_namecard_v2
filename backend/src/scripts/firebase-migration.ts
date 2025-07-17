import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import { initializeFirebase, getFirestore } from './config/firebase-admin';
import { ArIdGenerator } from './utils/arId-generator';
import { DataMapper } from './utils/data-mapper';
import { User, UserCustomization } from '../models';
import { FirebaseUser, MigrationResult, MigrationReport } from './types/firebase-user';

// 환경 변수 로드
dotenv.config();

class FirebaseMigration {
  private arIdGenerator: ArIdGenerator;
  private firestore!: FirebaseFirestore.Firestore;

  constructor() {
    this.arIdGenerator = ArIdGenerator.getInstance();
  }

  public async run(): Promise<void> {
    console.log('🔥 Firebase to MongoDB Migration Started');
    console.log('==========================================');

    const startTime = new Date();
    const report: MigrationReport = {
      total: 0,
      success: 0,
      failed: 0,
      results: [],
      startTime,
      endTime: new Date()
    };

    try {
      // 1. 연결 초기화
      await this.initializeConnections();

      // 2. Firebase에서 사용자 데이터 가져오기
      const firebaseUsers = await this.fetchFirebaseUsers();
      report.total = firebaseUsers.length;

      console.log(`📊 Found ${firebaseUsers.length} users in Firebase`);

      // 3. 각 사용자 마이그레이션
      for (const firebaseUser of firebaseUsers) {
        const result = await this.migrateUser(firebaseUser);
        report.results.push(result);
        
        if (result.success) {
          report.success++;
          console.log(`✅ ${result.email} → User ID: ${result.userId}, arId: ${result.arId}`);
        } else {
          report.failed++;
          console.log(`❌ ${result.email} → Error: ${result.error}`);
        }
      }

      report.endTime = new Date();
      this.printReport(report);

    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  }

  private async initializeConnections(): Promise<void> {
    console.log('🔌 Initializing connections...');
    
    // MongoDB 연결
    await connectDB();
    console.log('✅ MongoDB connected');

    // Firebase 초기화
    initializeFirebase();
    this.firestore = getFirestore();
    console.log('✅ Firebase initialized');

    // ArId Generator 초기화
    await this.arIdGenerator.initialize();
    console.log('✅ ArId Generator initialized');
  }

  private async fetchFirebaseUsers(): Promise<FirebaseUser[]> {
    console.log('📥 Fetching users from Firebase...');
    
    const snapshot = await this.firestore.collection('people').get();
    const users: FirebaseUser[] = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      const user = DataMapper.validateFirebaseUser(data);
      
      if (user) {
        users.push(user);
      } else {
        console.warn(`⚠️ Invalid user data for document: ${doc.id}`);
      }
    });

    return users;
  }

  private async migrateUser(firebaseUser: FirebaseUser): Promise<MigrationResult> {
    try {
      // 1. 이메일 중복 검사
      const existingUser = await User.findOne({ email: firebaseUser.email });
      if (existingUser) {
        return {
          success: false,
          email: firebaseUser.email,
          error: 'Email already exists'
        };
      }

      // 2. arId 생성
      const arId = await this.arIdGenerator.generateNextArId();

      // 3. User 생성
      const userData = DataMapper.mapFirebaseUserToUser(firebaseUser, arId);
      const user = new User(userData);
      await user.save();

      // 4. UserCustomization 생성
      const customizationData = DataMapper.mapFirebaseUserToCustomization(firebaseUser, (user._id as any).toString());
      const customization = new UserCustomization(customizationData);
      await customization.save();

      return {
        success: true,
        userId: (user._id as any).toString(),
        email: firebaseUser.email,
        arId: arId
      };

    } catch (error) {
      return {
        success: false,
        email: firebaseUser.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private printReport(report: MigrationReport): void {
    const duration = report.endTime.getTime() - report.startTime.getTime();
    
    console.log('\n🎯 Migration Report');
    console.log('==================');
    console.log(`📊 Total: ${report.total}`);
    console.log(`✅ Success: ${report.success}`);
    console.log(`❌ Failed: ${report.failed}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log(`🚀 Success Rate: ${((report.success / report.total) * 100).toFixed(1)}%`);
    
    if (report.failed > 0) {
      console.log('\n❌ Failed Users:');
      report.results.filter(r => !r.success).forEach(result => {
        console.log(`  - ${result.email}: ${result.error}`);
      });
    }
    
    console.log('\n🎉 Migration completed!');
  }
}

// 스크립트 실행
if (require.main === module) {
  const migration = new FirebaseMigration();
  migration.run().catch(error => {
    console.error('💥 Migration script error:', error);
    process.exit(1);
  });
}