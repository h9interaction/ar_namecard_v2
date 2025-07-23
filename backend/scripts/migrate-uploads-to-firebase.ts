import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { uploadToFirebase } from '../src/config/firebase-storage';

// 환경변수 로드
dotenv.config({ path: '.env.local' });

interface FileMapping {
  localPath: string;
  firebaseUrl: string;
  firebasePath: string;
  success: boolean;
  error?: string;
}

interface MigrationResult {
  total: number;
  success: number;
  failed: number;
  mappings: FileMapping[];
}

// 지원되는 파일 확장자
const SUPPORTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.doc', '.docx'];

// Firebase에 업로드할 파일인지 확인
const isUploadableFile = (filename: string): boolean => {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_EXTENSIONS.includes(ext) && !filename.startsWith('.');
};

// 로컬 파일을 Firebase Storage로 업로드
const uploadFileToFirebase = async (
  localFilePath: string, 
  relativePath: string
): Promise<FileMapping> => {
  const mapping: FileMapping = {
    localPath: localFilePath,
    firebaseUrl: '',
    firebasePath: '',
    success: false
  };

  try {
    // 파일 읽기
    const fileBuffer = await fs.readFile(localFilePath);
    const stats = await fs.stat(localFilePath);
    
    // MIME 타입 추정
    const ext = path.extname(localFilePath).toLowerCase();
    let mimetype = 'application/octet-stream';
    if (ext === '.png') mimetype = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimetype = 'image/jpeg';
    else if (ext === '.gif') mimetype = 'image/gif';
    else if (ext === '.pdf') mimetype = 'application/pdf';

    // Express.Multer.File 형태로 변환
    const file: Express.Multer.File = {
      fieldname: 'file',
      originalname: path.basename(localFilePath),
      encoding: '7bit',
      mimetype: mimetype,
      buffer: fileBuffer,
      size: stats.size,
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    // Firebase Storage에 업로드
    const result = await uploadToFirebase(file, relativePath);
    
    mapping.firebaseUrl = result.url;
    mapping.firebasePath = result.path;
    mapping.success = true;
    
    console.log(`✅ ${localFilePath} → ${result.url}`);
    
  } catch (error) {
    mapping.error = error instanceof Error ? error.message : String(error);
    mapping.success = false;
    console.error(`❌ ${localFilePath}: ${mapping.error}`);
  }

  return mapping;
};

// 디렉토리 재귀 스캔
const scanDirectory = async (dirPath: string, baseDir: string): Promise<string[]> => {
  const files: string[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // 하위 디렉토리 재귀 스캔
        const subFiles = await scanDirectory(fullPath, baseDir);
        files.push(...subFiles);
      } else if (entry.isFile() && isUploadableFile(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.error(`디렉토리 스캔 오류 (${dirPath}):`, error);
  }
  
  return files;
};

// 메인 마이그레이션 함수
const migrateUploadToFirebase = async (): Promise<MigrationResult> => {
  console.log('🚀 Firebase Storage 마이그레이션 시작...\n');
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const result: MigrationResult = {
    total: 0,
    success: 0,
    failed: 0,
    mappings: []
  };

  try {
    // uploads 디렉토리 존재 확인
    await fs.access(uploadsDir);
    
    // 모든 파일 스캔
    console.log('📁 파일 스캔 중...');
    const allFiles = await scanDirectory(uploadsDir, uploadsDir);
    result.total = allFiles.length;
    
    console.log(`📊 총 ${result.total}개 파일 발견\n`);
    
    if (result.total === 0) {
      console.log('업로드할 파일이 없습니다.');
      return result;
    }

    // 파일별 업로드 진행
    for (let i = 0; i < allFiles.length; i++) {
      const filePath = allFiles[i];
      const relativePath = path.relative(uploadsDir, filePath).replace(/\\/g, '/');
      const folderPath = path.dirname(relativePath) === '.' ? 'uploads/' : `uploads/${path.dirname(relativePath)}/`;
      
      console.log(`[${i + 1}/${result.total}] ${relativePath}`);
      
      const mapping = await uploadFileToFirebase(filePath, folderPath);
      result.mappings.push(mapping);
      
      if (mapping.success) {
        result.success++;
      } else {
        result.failed++;
      }
      
      // 진행률 표시
      const progress = Math.round((i + 1) / result.total * 100);
      console.log(`진행률: ${progress}%\n`);
    }

    // 결과 저장
    const mappingFile = path.join(process.cwd(), 'migration-mapping.json');
    await fs.writeFile(mappingFile, JSON.stringify(result, null, 2));
    console.log(`📄 매핑 파일 저장: ${mappingFile}`);

  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    throw error;
  }

  return result;
};

// 스크립트 실행
const main = async () => {
  try {
    const result = await migrateUploadToFirebase();
    
    console.log('\n🎉 마이그레이션 완료!');
    console.log('='.repeat(50));
    console.log(`총 파일: ${result.total}`);
    console.log(`성공: ${result.success}`);
    console.log(`실패: ${result.failed}`);
    console.log(`성공률: ${Math.round(result.success / result.total * 100)}%`);
    
    if (result.failed > 0) {
      console.log('\n❌ 실패한 파일들:');
      result.mappings
        .filter(m => !m.success)
        .forEach(m => {
          console.log(`  - ${m.localPath}: ${m.error}`);
        });
    }
    
    console.log('\n✅ Firebase Storage 마이그레이션이 완료되었습니다!');
    
  } catch (error) {
    console.error('💥 마이그레이션 실패:', error);
    process.exit(1);
  }
};

// 스크립트가 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main();
}

export { migrateUploadToFirebase, FileMapping, MigrationResult };