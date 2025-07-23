import * as fs from 'fs/promises';
import * as path from 'path';
import * as dotenv from 'dotenv';
import mongoose from 'mongoose';

// 환경변수 로드 - 필요시 .env.atlas로 변경 가능
dotenv.config({ path: '.env.local' });

interface FileMapping {
  localPath: string;
  firebaseUrl: string;
  firebasePath: string;
  success: boolean;
  error?: string;
}

interface MigrationMappings {
  total: number;
  success: number;
  failed: number;
  mappings: FileMapping[];
}

interface UpdateResult {
  collection: string;
  field: string;
  documentId: string;
  oldValue: string;
  newValue: string;
  success: boolean;
  error?: string;
}

interface DatabaseUpdateResult {
  totalUpdates: number;
  successfulUpdates: number;
  failedUpdates: number;
  updates: UpdateResult[];
  collections: {
    [collectionName: string]: {
      documentsUpdated: number;
      fieldsUpdated: number;
    };
  };
}

// URL 매핑 생성 함수
const createUrlMapping = (mappings: FileMapping[]): Map<string, string> => {
  const urlMap = new Map<string, string>();
  
  mappings.forEach(mapping => {
    if (mapping.success && mapping.localPath && mapping.firebaseUrl) {
      // 절대 경로에서 /uploads/filename 추출
      const filename = path.basename(mapping.localPath);
      const localUrl = `/uploads/${filename}`;
      urlMap.set(localUrl, mapping.firebaseUrl);
      
      // 하위 폴더가 있는 경우도 처리
      const relativePath = mapping.localPath.split('/uploads/')[1];
      if (relativePath && relativePath !== filename) {
        const localUrlWithFolder = `/uploads/${relativePath}`;
        urlMap.set(localUrlWithFolder, mapping.firebaseUrl);
      }
    }
  });
  
  return urlMap;
};

// URL 업데이트 함수
const updateUrlInValue = (value: any, urlMap: Map<string, string>): { updated: boolean; newValue: any; changes: Array<{oldUrl: string; newUrl: string}> } => {
  const changes: Array<{oldUrl: string; newUrl: string}> = [];
  let updated = false;
  let newValue = value;

  if (typeof value === 'string' && value.startsWith('/uploads/')) {
    const firebaseUrl = urlMap.get(value);
    if (firebaseUrl) {
      changes.push({ oldUrl: value, newUrl: firebaseUrl });
      newValue = firebaseUrl;
      updated = true;
    }
  } else if (Array.isArray(value)) {
    const newArray = value.map(item => {
      const result = updateUrlInValue(item, urlMap);
      if (result.updated) {
        updated = true;
        changes.push(...result.changes);
      }
      return result.newValue;
    });
    if (updated) {
      newValue = newArray;
    }
  } else if (value && typeof value === 'object') {
    const newObject = { ...value };
    for (const [key, val] of Object.entries(value)) {
      const result = updateUrlInValue(val, urlMap);
      if (result.updated) {
        updated = true;
        changes.push(...result.changes);
        newObject[key] = result.newValue;
      }
    }
    if (updated) {
      newValue = newObject;
    }
  }

  return { updated, newValue, changes };
};

// avatarcategories 컬렉션 업데이트
const updateAvatarCategories = async (urlMap: Map<string, string>): Promise<UpdateResult[]> => {
  console.log('🔄 avatarcategories 컬렉션 업데이트 중...');
  
  const results: UpdateResult[] = [];
  const AvatarCategory = mongoose.model('AvatarCategory', new mongoose.Schema({}, { strict: false }));
  
  try {
    const categories = await AvatarCategory.find({});
    console.log(`📊 avatarcategories: ${categories.length}개 문서 발견`);
    
    for (const category of categories) {
      const categoryObj = category.toObject() as any;
      let documentUpdated = false;
      const documentUpdates: UpdateResult[] = [];
      
      if (categoryObj.options && Array.isArray(categoryObj.options)) {
        for (let optionIndex = 0; optionIndex < categoryObj.options.length; optionIndex++) {
          const option = categoryObj.options[optionIndex];
          
          // imageUrl 업데이트
          if (option.imageUrl) {
            const result = updateUrlInValue(option.imageUrl, urlMap);
            if (result.updated) {
              option.imageUrl = result.newValue;
              documentUpdated = true;
              documentUpdates.push({
                collection: 'avatarcategories',
                field: `options[${optionIndex}].imageUrl`,
                documentId: (category._id as any).toString(),
                oldValue: result.changes[0].oldUrl,
                newValue: result.changes[0].newUrl,
                success: true
              });
            }
          }
          
          // thumbnailUrl 업데이트
          if (option.thumbnailUrl) {
            const result = updateUrlInValue(option.thumbnailUrl, urlMap);
            if (result.updated) {
              option.thumbnailUrl = result.newValue;
              documentUpdated = true;
              documentUpdates.push({
                collection: 'avatarcategories',
                field: `options[${optionIndex}].thumbnailUrl`,
                documentId: (category._id as any).toString(),
                oldValue: result.changes[0].oldUrl,
                newValue: result.changes[0].newUrl,
                success: true
              });
            }
          }
          
          // color 배열 업데이트
          if (option.color && Array.isArray(option.color)) {
            for (let colorIndex = 0; colorIndex < option.color.length; colorIndex++) {
              const colorOption = option.color[colorIndex];
              
              // imageUrl
              if (colorOption.imageUrl) {
                const result = updateUrlInValue(colorOption.imageUrl, urlMap);
                if (result.updated) {
                  colorOption.imageUrl = result.newValue;
                  documentUpdated = true;
                  documentUpdates.push({
                    collection: 'avatarcategories',
                    field: `options[${optionIndex}].color[${colorIndex}].imageUrl`,
                    documentId: (category._id as any).toString(),
                    oldValue: result.changes[0].oldUrl,
                    newValue: result.changes[0].newUrl,
                    success: true
                  });
                }
              }
              
              // paletteImageUrl
              if (colorOption.paletteImageUrl) {
                const result = updateUrlInValue(colorOption.paletteImageUrl, urlMap);
                if (result.updated) {
                  colorOption.paletteImageUrl = result.newValue;
                  documentUpdated = true;
                  documentUpdates.push({
                    collection: 'avatarcategories',
                    field: `options[${optionIndex}].color[${colorIndex}].paletteImageUrl`,
                    documentId: (category._id as any).toString(),
                    oldValue: result.changes[0].oldUrl,
                    newValue: result.changes[0].newUrl,
                    success: true
                  });
                }
              }
              
              // resourceImages 처리
              if (colorOption.resourceImages) {
                for (const [resourceKey, resourceUrl] of Object.entries(colorOption.resourceImages)) {
                  if (typeof resourceUrl === 'string') {
                    const result = updateUrlInValue(resourceUrl, urlMap);
                    if (result.updated) {
                      colorOption.resourceImages[resourceKey] = result.newValue;
                      documentUpdated = true;
                      documentUpdates.push({
                        collection: 'avatarcategories',
                        field: `options[${optionIndex}].color[${colorIndex}].resourceImages.${resourceKey}`,
                        documentId: (category._id as any).toString(),
                        oldValue: result.changes[0].oldUrl,
                        newValue: result.changes[0].newUrl,
                        success: true
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      // 문서 저장
      if (documentUpdated) {
        try {
          await category.updateOne(categoryObj);
          results.push(...documentUpdates);
          console.log(`✅ avatarcategories - 문서 ${(category._id as any)} 업데이트 완료 (${documentUpdates.length}개 필드)`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ avatarcategories - 문서 ${(category._id as any)} 업데이트 실패:`, errorMessage);
          documentUpdates.forEach(update => {
            update.success = false;
            update.error = errorMessage;
          });
          results.push(...documentUpdates);
        }
      }
    }
  } catch (error) {
    console.error('❌ avatarcategories 컬렉션 업데이트 중 오류:', error);
  }
  
  return results;
};

// itemcategories 컬렉션 업데이트
const updateItemCategories = async (urlMap: Map<string, string>): Promise<UpdateResult[]> => {
  console.log('🔄 itemcategories 컬렉션 업데이트 중...');
  
  const results: UpdateResult[] = [];
  const ItemCategory = mongoose.model('ItemCategory', new mongoose.Schema({}, { strict: false }));
  
  try {
    const categories = await ItemCategory.find({});
    console.log(`📊 itemcategories: ${categories.length}개 문서 발견`);
    
    for (const category of categories) {
      const categoryObj = category.toObject() as any;
      let documentUpdated = false;
      const documentUpdates: UpdateResult[] = [];
      
      if (categoryObj.items && Array.isArray(categoryObj.items)) {
        for (let itemIndex = 0; itemIndex < categoryObj.items.length; itemIndex++) {
          const item = categoryObj.items[itemIndex];
          
          // imageUrl 업데이트
          if (item.imageUrl) {
            const result = updateUrlInValue(item.imageUrl, urlMap);
            if (result.updated) {
              item.imageUrl = result.newValue;
              documentUpdated = true;
              documentUpdates.push({
                collection: 'itemcategories',
                field: `items[${itemIndex}].imageUrl`,
                documentId: (category._id as any).toString(),
                oldValue: result.changes[0].oldUrl,
                newValue: result.changes[0].newUrl,
                success: true
              });
            }
          }
          
          // thumbnailUrl 업데이트
          if (item.thumbnailUrl) {
            const result = updateUrlInValue(item.thumbnailUrl, urlMap);
            if (result.updated) {
              item.thumbnailUrl = result.newValue;
              documentUpdated = true;
              documentUpdates.push({
                collection: 'itemcategories',
                field: `items[${itemIndex}].thumbnailUrl`,
                documentId: (category._id as any).toString(),
                oldValue: result.changes[0].oldUrl,
                newValue: result.changes[0].newUrl,
                success: true
              });
            }
          }
          
          // animationUrl 업데이트
          if (item.animationUrl) {
            const result = updateUrlInValue(item.animationUrl, urlMap);
            if (result.updated) {
              item.animationUrl = result.newValue;
              documentUpdated = true;
              documentUpdates.push({
                collection: 'itemcategories',
                field: `items[${itemIndex}].animationUrl`,
                documentId: (category._id as any).toString(),
                oldValue: result.changes[0].oldUrl,
                newValue: result.changes[0].newUrl,
                success: true
              });
            }
          }
        }
      }
      
      // 문서 저장
      if (documentUpdated) {
        try {
          await category.updateOne(categoryObj);
          results.push(...documentUpdates);
          console.log(`✅ itemcategories - 문서 ${(category._id as any)} 업데이트 완료 (${documentUpdates.length}개 필드)`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`❌ itemcategories - 문서 ${(category._id as any)} 업데이트 실패:`, errorMessage);
          documentUpdates.forEach(update => {
            update.success = false;
            update.error = errorMessage;
          });
          results.push(...documentUpdates);
        }
      }
    }
  } catch (error) {
    console.error('❌ itemcategories 컬렉션 업데이트 중 오류:', error);
  }
  
  return results;
};

// 메인 마이그레이션 함수
const updateDatabaseUrls = async (): Promise<DatabaseUpdateResult> => {
  console.log('🚀 데이터베이스 URL 업데이트 시작...\n');
  
  const result: DatabaseUpdateResult = {
    totalUpdates: 0,
    successfulUpdates: 0,
    failedUpdates: 0,
    updates: [],
    collections: {}
  };

  try {
    // MongoDB 연결
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ar_namecard';
    console.log(`🔗 MongoDB 연결 중: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB 연결 성공\n');

    // 마이그레이션 매핑 파일 로드
    const mappingFile = path.join(process.cwd(), 'migration-mapping.json');
    console.log(`📄 매핑 파일 로드: ${mappingFile}`);
    
    const mappingData = await fs.readFile(mappingFile, 'utf-8');
    const migrations: MigrationMappings = JSON.parse(mappingData);
    
    console.log(`📊 매핑 데이터: 총 ${migrations.total}개 파일, 성공 ${migrations.success}개`);
    
    if (migrations.success === 0) {
      console.log('❌ 성공적으로 마이그레이션된 파일이 없습니다.');
      return result;
    }

    // URL 매핑 생성
    const urlMap = createUrlMapping(migrations.mappings);
    console.log(`🗺️  URL 매핑 생성 완료: ${urlMap.size}개 URL\n`);

    // 각 컬렉션 업데이트
    const avatarResults = await updateAvatarCategories(urlMap);
    const itemResults = await updateItemCategories(urlMap);

    // 결과 집계
    result.updates = [...avatarResults, ...itemResults];
    result.totalUpdates = result.updates.length;
    result.successfulUpdates = result.updates.filter(u => u.success).length;
    result.failedUpdates = result.updates.filter(u => !u.success).length;

    // 컬렉션별 통계
    result.collections = {};
    for (const update of result.updates) {
      if (!result.collections[update.collection]) {
        result.collections[update.collection] = {
          documentsUpdated: 0,
          fieldsUpdated: 0
        };
      }
      result.collections[update.collection].fieldsUpdated++;
    }

    // 컬렉션별 문서 수 계산
    const documentIds = new Set();
    for (const update of result.updates) {
      const key = `${update.collection}-${update.documentId}`;
      if (!documentIds.has(key)) {
        documentIds.add(key);
        result.collections[update.collection].documentsUpdated++;
      }
    }

    // 결과 저장
    const resultFile = path.join(process.cwd(), 'db-url-update-result.json');
    await fs.writeFile(resultFile, JSON.stringify(result, null, 2));
    console.log(`\n📄 결과 파일 저장: ${resultFile}`);

  } catch (error) {
    console.error('❌ 데이터베이스 URL 업데이트 중 오류:', error);
    throw error;
  } finally {
    // MongoDB 연결 종료
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }

  return result;
};

// 스크립트 실행
const main = async () => {
  try {
    const result = await updateDatabaseUrls();
    
    console.log('\n🎉 데이터베이스 URL 업데이트 완료!');
    console.log('='.repeat(50));
    console.log(`총 업데이트: ${result.totalUpdates}`);
    console.log(`성공: ${result.successfulUpdates}`);
    console.log(`실패: ${result.failedUpdates}`);
    console.log(`성공률: ${Math.round(result.successfulUpdates / result.totalUpdates * 100)}%`);
    
    console.log('\n📊 컬렉션별 통계:');
    for (const [collection, stats] of Object.entries(result.collections)) {
      console.log(`  ${collection}: ${stats.documentsUpdated}개 문서, ${stats.fieldsUpdated}개 필드`);
    }
    
    if (result.failedUpdates > 0) {
      console.log('\n❌ 실패한 업데이트들:');
      result.updates
        .filter(u => !u.success)
        .forEach(u => {
          console.log(`  - ${u.collection}.${u.field} (${u.documentId}): ${u.error}`);
        });
    }
    
    console.log('\n✅ 데이터베이스 URL 업데이트가 완료되었습니다!');
    
  } catch (error) {
    console.error('💥 데이터베이스 URL 업데이트 실패:', error);
    process.exit(1);
  }
};

// 스크립트가 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main();
}

export { updateDatabaseUrls, UpdateResult, DatabaseUpdateResult };