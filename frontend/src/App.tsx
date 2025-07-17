import './App.css'
import AvatarPreview from './components/AvatarPreview'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>나만의 아바타를 만들어주세요!</h1>
      </header>
      
      <main className="app-main">
        <div className="preview-container">
          <AvatarPreview />
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
    </div>
  )
}

export default App
