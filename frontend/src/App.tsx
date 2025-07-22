import { useState, useEffect } from 'react'
import './App.css'
import AvatarPreview from './components/AvatarPreview'
import AvatarCustomizer from './components/AvatarCustomizer'
import { generateRandomAvatar } from './utils/avatarGenerator'
import { apiService } from './services/api'
import { generateRandomAvatarFromBackendData, logBackendDataStats } from './utils/avatarDataUtils'
import type { AvatarData, BackendCharacterCategory, BackendStickerCategory } from './types/avatar'

// 아바타 표시 상태
type AvatarDisplayState = 
  | 'hidden'        // 초기 상태 - 아무것도 안보임
  | 'loading'       // 로딩 중 - 여전히 안보임  
  | 'showing'       // 표시 중 - 보임
  | 'fading-out'    // 페이드아웃 중 - 보이지만 사라지는 중
  | 'ready-to-load' // 페이드아웃 완료 - 새 로딩 시작 가능

function App() {
  const [currentAvatar, setCurrentAvatar] = useState<AvatarData | null>(null)
  const [displayState, setDisplayState] = useState<AvatarDisplayState>('hidden')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [characterCategories, setCharacterCategories] = useState<BackendCharacterCategory[]>([])
  const [stickerCategories, setStickerCategories] = useState<BackendStickerCategory[]>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')

  // 앱 시작 시 백엔드 데이터 로드
  useEffect(() => {
    const loadBackendData = async () => {
      try {
        console.log('[App] 백엔드 데이터 로드 시작')
        
        const isHealthy = await apiService.healthCheck()
        if (!isHealthy) {
          console.log('[App] 백엔드 연결 실패')
          setConnectionStatus('failed')
          setIsDataLoaded(true)
          return
        }

        console.log('[App] 백엔드 연결 성공')
        setConnectionStatus('connected')

        const [characters, stickers] = await Promise.all([
          apiService.getCharacterCategories(),
          apiService.getStickerCategories()
        ])

        setCharacterCategories(characters)
        setStickerCategories(stickers)
        setIsDataLoaded(true)

        console.log(`[App] 백엔드 데이터 로드 완료: 캐릭터 ${characters.length}개, 스티커 ${stickers.length}개`)

      } catch (error) {
        console.error('[App] 데이터 로드 실패:', error)
        setConnectionStatus('failed')
        setIsDataLoaded(true)
      }
    }

    loadBackendData()
  }, [])

  // 백엔드 데이터 로드 완료 후 첫 아바타 생성
  useEffect(() => {
    if (isDataLoaded && displayState === 'hidden') {
      console.log('[App] 첫 아바타 생성 시작')
      generateAvatar()
    }
  }, [isDataLoaded])

  const handleAvatarChange = (newAvatar: AvatarData) => {
    setCurrentAvatar(newAvatar)
  }

  // 아바타 생성 함수 (백엔드/폴백)
  const generateAvatar = () => {
    console.log('[App] 아바타 생성 시작')
    setDisplayState('loading')
    
    let avatar: AvatarData
    if (isDataLoaded && (characterCategories.length > 0 || stickerCategories.length > 0)) {
      avatar = generateRandomAvatarFromBackendData(characterCategories, stickerCategories)
    } else {
      avatar = generateRandomAvatar()
    }
    
    setCurrentAvatar(avatar)
    console.log('[App] 새 아바타 데이터 준비 완료, 로딩 시작')
  }

  // 주사위 버튼 클릭
  const generateNewAvatar = async () => {
    if (displayState !== 'showing' || isGenerating) return
    
    console.log('[App] 주사위 클릭 - 페이드아웃 시작')
    setIsGenerating(true)
    setDisplayState('fading-out')
    
    // 300ms 후 페이드아웃 완료
    setTimeout(() => {
      setDisplayState('ready-to-load')
      console.log('[App] 페이드아웃 완료 - 새 아바타 생성 시작')
      generateAvatar()
    }, 300)
  }

  // 아바타 로딩 완료 콜백
  const handleAvatarLoadingComplete = () => {
    console.log(`[App] 🎯 로딩 완료 콜백 호출:`);
    console.log(`  - 현재 displayState: ${displayState}`);
    console.log(`  - currentAvatar 존재: ${!!currentAvatar}`);
    console.log(`  - currentAvatar ID: ${currentAvatar?.id}`);
    
    // loading 상태일 때만 처리
    if (displayState === 'loading' && currentAvatar) {
      console.log('[App] 🎉 아바타 로딩 완료 - 페이드인 시작')
      setDisplayState('showing')
      setIsGenerating(false)
    } else {
      console.log(`[App] ⚠️ 로딩 완료 무시 - 상태: ${displayState}, currentAvatar: ${!!currentAvatar}`);
    }
  }

  // 로그인 상태에 따른 조건부 렌더링
  if (isLoggedIn) {
    return (
      <AvatarCustomizer
        currentAvatar={currentAvatar}
        onAvatarChange={handleAvatarChange}
        onBack={() => setIsLoggedIn(false)}
      />
    )
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
          <AvatarPreview 
            avatarData={currentAvatar}
            isVisible={displayState === 'showing'}
            isFading={displayState === 'fading-out'}
            onLoadingComplete={handleAvatarLoadingComplete}
          />
        </div>

        <div className="login-container">
          <button 
            className="google-login-btn"
            onClick={() => setIsLoggedIn(true)}
          >
            구글 계정으로 로그인
          </button>
          <p className="login-notice">
            Hinine Google 계정으로 로그인 시에만 아바타 생성이 가능합니다.
          </p>
        </div>
      </main>

    </div>
  )
}

export default App
