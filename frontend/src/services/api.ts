import type { 
  BackendCharacterCategory,
  BackendStickerCategory,
  UserAvatarData,
  ApiResponse
} from '../types/avatar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
const DEV_AUTH_TOKEN = import.meta.env.VITE_DEV_AUTH_TOKEN;

export class ApiService {
  private static instance: ApiService;
  
  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[Backend] API 요청: ${endpoint} -> ${url}`);
    
    // 헤더 설정 (인증 토큰 포함)
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    // 개발용 토큰이 있으면 Authorization 헤더 추가
    if (DEV_AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${DEV_AUTH_TOKEN}`;
      console.log(`[Backend] 인증 토큰 사용: ${DEV_AUTH_TOKEN.substring(0, 20)}...`);
    }
    
    try {
      const response = await fetch(url, {
        headers,
        ...options,
      });

      if (!response.ok) {
        const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        console.error(`[Backend] API 에러: ${endpoint} - ${errorMessage}`);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`[Backend] API 성공: ${endpoint}`, data);
      if (endpoint === '/stickers') {
        console.log(`[Backend] 스티커 카테고리 타입 확인:`, data.map(cat => ({ name: cat.name, type: cat.type, itemCount: cat.items.length })));
      }
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        console.error(`[Backend] 연결 실패: ${API_BASE_URL}`);
        throw new Error(`백엔드 서버에 연결할 수 없습니다: ${API_BASE_URL}`);
      }
      console.error(`[Backend] 요청 실패: ${endpoint}`, error);
      throw error;
    }
  }

  // 캐릭터 카테고리 목록 조회 (얼굴 파츠)
  public async getCharacterCategories(): Promise<BackendCharacterCategory[]> {
    // 새로운 엔드포인트: /api/characters
    const response = await this.request<BackendCharacterCategory[] | ApiResponse<BackendCharacterCategory[]>>('/characters');
    
    // response가 배열이면 직접 반환, 객체면 data 프로퍼티에서 추출
    if (Array.isArray(response)) {
      return response;
    }
    return (response as ApiResponse<BackendCharacterCategory[]>).data || [];
  }

  // 스티커 카테고리 목록 조회 (role + sticker)
  public async getStickerCategories(): Promise<BackendStickerCategory[]> {
    // 새로운 엔드포인트: /api/stickers
    const response = await this.request<BackendStickerCategory[] | ApiResponse<BackendStickerCategory[]>>('/stickers');
    
    // response가 배열이면 직접 반환, 객체면 data 프로퍼티에서 추출
    if (Array.isArray(response)) {
      return response;
    }
    return (response as ApiResponse<BackendStickerCategory[]>).data || [];
  }

  // 사용자 아바타 조회
  public async getUserAvatar(userId: string): Promise<UserAvatarData | null> {
    try {
      // 새로운 엔드포인트: /api/avatars/{userId}
      const response = await this.request<ApiResponse<UserAvatarData>>(`/avatars/${userId}`);
      return response.data || null;
    } catch (error) {
      console.log(`[Backend] 사용자 아바타 없음: ${userId}`);
      return null;
    }
  }

  // 사용자 아바타 저장
  public async saveUserAvatar(userId: string, avatarData: Partial<UserAvatarData>): Promise<UserAvatarData> {
    // 새로운 엔드포인트: /api/avatars/{userId}
    const response = await this.request<ApiResponse<UserAvatarData>>(`/avatars/${userId}`, {
      method: 'POST',
      body: JSON.stringify(avatarData),
    });
    return response.data!;
  }

  // 헬스체크
  public async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch {
      return false;
    }
  }
}

export const apiService = ApiService.getInstance();