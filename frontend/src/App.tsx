import { useState, useEffect } from 'react'
import './App.css'
import AvatarPreview from './components/AvatarPreview'
import AvatarDebugger from './components/AvatarDebugger'
import { generateRandomAvatar } from './utils/avatarGenerator'
import type { AvatarData } from './types/avatar'

function App() {
  const [currentAvatar, setCurrentAvatar] = useState<AvatarData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 앱 시작 시 랜덤 아바타 생성
  useEffect(() => {
    const avatar = generateRandomAvatar()
    setCurrentAvatar(avatar)
    console.log('🎭 App: 초기 랜덤 아바타 생성됨:', avatar)
  }, [])

  const handleAvatarChange = (newAvatar: AvatarData) => {
    setCurrentAvatar(newAvatar)
    console.log('🔄 App: 아바타 데이터 변경됨:', newAvatar)
  }

  const generateNewAvatar = async () => {
    setIsGenerating(true)
    console.log('🎲 App: 새 랜덤 아바타 생성 시작')

    // 새 아바타 즉시 생성
    const avatar = generateRandomAvatar()
    setCurrentAvatar(avatar)
    console.log('🎲 App: 새 랜덤 아바타 생성됨:', avatar)

    // 버튼 애니메이션만을 위한 짧은 지연
    await new Promise(resolve => setTimeout(resolve, 400))
    setIsGenerating(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <button
          onClick={generateNewAvatar}
          className={`dice-button ${isGenerating ? 'generating' : ''}`}
          title="새로운 아바타 생성"
          disabled={isGenerating}
        >
          {isGenerating ? '🔄' : '🎲'}
        </button>
        <h1>나만의 아바타를 만들어주세요!</h1>
      </header>

      <main className="app-main">
        <div className="preview-container">
          <AvatarPreview avatarData={currentAvatar} />
        </div>

        <div className="login-container">
          <button className="google-login-btn">
            구글 계정으로 로그인
          </button>
          <p className="login-notice">
            Hinine Google 계정으로 로그인 시에만 아바타 생성이 가능합니다.
          </p>
        </div>
      </main>

      {/* 개발용 디버거 */}
      <AvatarDebugger
        currentAvatar={currentAvatar}
        onAvatarChange={handleAvatarChange}
      />
    </div>
  )
}

export default App
