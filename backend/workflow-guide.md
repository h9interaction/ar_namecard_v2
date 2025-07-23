# GitLab + GitHub 이중 관리 워크플로우

## 🎯 **시나리오별 관리 방법**

### **1. 개발 단계 (GitLab 우선)**
```bash
# GitLab에서 개발
git checkout -b feature/new-feature
# 개발 작업...
git add .
git commit -m "feat: 새 기능 추가"
git push origin feature/new-feature

# GitLab에서 MR 생성 및 머지
# 머지 완료 후 GitHub 동기화
git checkout main
git pull origin main
git push github main
```

### **2. 배포 단계 (GitHub 우선)**
```bash
# GitHub에서 배포용 브랜치
git checkout -b release/v1.0.0
# 배포 준비...
git add .
git commit -m "release: v1.0.0 배포 준비"
git push github release/v1.0.0

# GitHub에서 머지 후 GitLab 동기화
git checkout main
git pull github main
git push origin main
```

### **3. 동시 개발 (브랜치 분리)**
```bash
# GitLab용 브랜치
git checkout -b gitlab/feature-a
git push origin gitlab/feature-a

# GitHub용 브랜치
git checkout -b github/feature-b  
git push github github/feature-b
```

## 🔧 **자동화 스크립트**

### **GitLab → GitHub 동기화**
```bash
#!/bin/bash
git checkout main
git pull origin main
git push github main
```

### **GitHub → GitLab 동기화**
```bash
#!/bin/bash
git checkout main
git pull github main
git push origin main
```

## 📝 **베스트 프랙티스**

1. **한 번에 하나의 저장소만 주요 저장소로 사용**
2. **정기적인 동기화 스케줄 설정**
3. **브랜치 네이밍 규칙 통일**
4. **커밋 메시지 형식 통일** 