#!/bin/bash

# GitLab과 GitHub 동시 푸시 스크립트
echo "🚀 GitLab과 GitHub 동시 푸시 시작"

# 현재 브랜치 확인
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 현재 브랜치: $CURRENT_BRANCH"

# 커밋 메시지 입력
echo "💬 커밋 메시지를 입력하세요:"
read COMMIT_MESSAGE

# 변경사항 스테이징
echo "📦 변경사항 스테이징..."
git add .

# 커밋
echo "💾 커밋 생성..."
git commit -m "$COMMIT_MESSAGE"

# GitLab 푸시
echo "🔵 GitLab 푸시 중..."
if git push origin $CURRENT_BRANCH; then
    echo "✅ GitLab 푸시 성공"
else
    echo "❌ GitLab 푸시 실패"
    exit 1
fi

# GitHub 푸시
echo "⚫ GitHub 푸시 중..."
if git push github $CURRENT_BRANCH; then
    echo "✅ GitHub 푸시 성공"
else
    echo "❌ GitHub 푸시 실패"
    exit 1
fi

echo "🎉 모든 푸시 완료!" 