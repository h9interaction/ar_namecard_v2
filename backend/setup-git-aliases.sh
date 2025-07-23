#!/bin/bash

# Git Alias 설정 스크립트
echo "🔧 Git Alias 설정 중..."

# GitLab 푸시만
git config --global alias.push-gitlab 'push origin'

# GitHub 푸시만  
git config --global alias.push-github 'push github'

# 둘 다 푸시
git config --global alias.push-both '!f() { git push origin $1 && git push github $1; }; f'

# 현재 브랜치를 둘 다 푸시
git config --global alias.push-all '!f() { git push origin $(git branch --show-current) && git push github $(git branch --show-current); }; f'

echo "✅ Git Alias 설정 완료!"
echo ""
echo "📝 사용법:"
echo "  git push-gitlab <브랜치명>    # GitLab만 푸시"
echo "  git push-github <브랜치명>    # GitHub만 푸시"
echo "  git push-both <브랜치명>      # 둘 다 푸시"
echo "  git push-all                  # 현재 브랜치를 둘 다 푸시" 