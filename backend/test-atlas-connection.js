const mongoose = require('mongoose');

async function testAtlasConnection() {
  const uri = "mongodb+srv://h9interaction:hnine0426@ar-namecard-cluster.3mnacap.mongodb.net/ar_namecard";
  
  try {
    await mongoose.connect(uri);
    console.log('✅ Atlas 연결 성공!');
    
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📊 현재 컬렉션들:');
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count}개 문서`);
    }
    
  } catch (error) {
    console.error('❌ Atlas 연결 실패:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

testAtlasConnection();