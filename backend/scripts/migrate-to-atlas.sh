#!/bin/bash

# MongoDB 데이터를 Atlas로 마이그레이션하는 스크립트

echo "🔄 MongoDB 데이터 마이그레이션 시작..."

# 1단계: 로컬 데이터 백업
echo "📦 로컬 데이터베이스 백업 중..."
mongodump --host localhost:27017 --db ar_namecard --out ./backup

# 2단계: 백업 파일 확인
if [ -d "./backup/ar_namecard" ]; then
    echo "✅ 백업 완료: ./backup/ar_namecard"
    ls -la ./backup/ar_namecard/
else
    echo "❌ 백업 실패"
    exit 1
fi

# 3단계: Atlas 연결 테스트
echo "🔗 MongoDB Atlas 연결 테스트..."
ATLAS_URI="mongodb+srv://h9interaction:hnine0426@ar-namecard-cluster.3mnacap.mongodb.net/ar_namecard"

# 4단계: Atlas로 데이터 복원
echo "⬆️  Atlas로 데이터 복원 중..."
mongorestore --uri "$ATLAS_URI" --drop ./backup/ar_namecard

echo "✅ 마이그레이션 완료!"
echo "📊 Atlas 데이터 확인: https://cloud.mongodb.com"