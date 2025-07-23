const fs = require('fs');
const path = require('path');

// Create a simple test image file
const testImagePath = path.join(__dirname, 'test-image.txt');
const testContent = 'This is a test file for Firebase Storage upload';

fs.writeFileSync(testImagePath, testContent);

console.log('Test file created:', testImagePath);
console.log('File content:', fs.readFileSync(testImagePath, 'utf8'));

// Test if all required environment variables are available
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_STORAGE_BUCKET'
];

console.log('\n📋 Environment Variables Check:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName === 'FIREBASE_PRIVATE_KEY' ? '[REDACTED]' : value}`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

console.log('\n🔗 Testing MongoDB connection and Firebase configuration...');
console.log('Server should be running on: http://localhost:3002');
console.log('MongoDB URI:', process.env.MONGODB_URI || 'NOT SET');