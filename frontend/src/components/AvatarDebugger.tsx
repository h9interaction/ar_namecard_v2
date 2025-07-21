import { useState } from 'react';
import type { AvatarData } from '../types/avatar';
import { generateRandomAvatar, formatAvatarDebugInfo } from '../utils/avatarGenerator';

interface AvatarDebuggerProps {
  currentAvatar: AvatarData | null;
  onAvatarChange: (avatar: AvatarData) => void;
}

const AvatarDebugger = ({ currentAvatar, onAvatarChange }: AvatarDebuggerProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const generateNewAvatar = () => {
    const avatar = generateRandomAvatar();
    onAvatarChange(avatar);
    console.log('🎭 디버거: 새 랜덤 아바타 생성됨:', avatar);
  };

  if (!currentAvatar) return null;

  return (
    <>
      {/* 디버그 토글 버튼 */}
      <button 
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          cursor: 'pointer',
          fontSize: '20px',
          zIndex: 1000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
        title="아바타 디버그 정보"
      >
        🐛
      </button>

      {/* 디버그 패널 */}
      {isVisible && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          width: '400px',
          maxHeight: '70vh',
          backgroundColor: '#1a1a1a',
          color: '#00ff00',
          padding: '20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '12px',
          overflow: 'auto',
          zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          border: '1px solid #333'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#ff6b6b' }}>Avatar Debug</h3>
            <button
              onClick={generateNewAvatar}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              🎲 새 아바타
            </button>
          </div>
          
          <pre style={{ 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            margin: 0,
            lineHeight: '1.4'
          }}>
            {formatAvatarDebugInfo(currentAvatar)}
          </pre>

          <div style={{ 
            marginTop: '15px',
            padding: '10px',
            backgroundColor: '#2a2a2a',
            borderRadius: '4px'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#ffeb3b' }}>📊 통계</h4>
            <div>
              <span style={{ color: '#81C784' }}>
                Face Elements: {Object.values(currentAvatar.face).filter(v => v !== null).length}/9
              </span>
            </div>
            <div>
              <span style={{ color: '#64B5F6' }}>
                Sprites: {currentAvatar.sprites.length}/4
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvatarDebugger;