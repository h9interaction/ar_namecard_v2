import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';
import os from 'os';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AR Namecard API',
      version: '1.0.0',
      description: `AR 명함 서비스 API 문서입니다.

### 테스트 페이지:
* [로그인 테스트](/test/login/)
* [사용자 정보 테스트](/test/user/)
* [캐릭터 옵션 등록 테스트](/test/avatar/)
* [스티커 옵션 등록 테스트](/test/item/)
* [커스터마이징 테스트](/test/customize/)
`,
    },
    servers: [], // 동적으로 생성됨
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'AR 명함 시스템 JWT 토큰',
        },
        firebaseAuth: {
          type: 'oauth2',
          description: 'Firebase Authentication (Google OAuth)',
          flows: {
            implicit: {
              authorizationUrl: 'https://accounts.google.com/o/oauth2/auth',
              scopes: {
                'openid': 'OpenID Connect',
                'email': 'Email address',
                'profile': 'User profile'
              }
            }
          }
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '사용자 ID',
            },
            nameEn: {
              type: 'string',
              description: '영문 이름',
            },
            email: {
              type: 'string',
              description: '이메일',
            },
            nameKr: {
              type: 'string',
              description: '한글 이름',
            },
            role: {
              type: 'string',
              description: '역할',
              default: 'User',
            },
            part: {
              type: 'string',
              description: '소속 부서',
              default: '',
            },
            phone: {
              type: 'string',
              description: '전화번호',
            },
            isNamecardActive: {
              type: 'boolean',
              description: '명함 활성화 여부',
              default: false,
            },
            arId: {
              type: 'string',
              description: 'AR 명함 ID (3자리)',
              minLength: 3,
              maxLength: 3,
            },
            isAdmin: {
              type: 'boolean',
              description: '관리자 여부',
              default: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '수정일시',
            },
          },
          required: ['email', 'nameKr', 'phone', 'arId'],
        },
        UserCustomization: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '사용자 ID 참조',
            },
            avatarSelections: {
              type: 'object',
              description: '아바타 선택 옵션',
              additionalProperties: {
                type: 'string',
              },
            },
            role: {
              type: 'string',
              description: '역할',
            },
            item1: {
              type: 'string',
              description: '아이템 1',
            },
            item2: {
              type: 'string',
              description: '아이템 2',
            },
            item3: {
              type: 'string',
              description: '아이템 3',
            },
            avatarImgUrl: {
              type: 'string',
              description: '아바타 이미지 URL',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '수정일시',
            },
          },
          required: ['id'],
        },
        AvatarWithUser: {
          type: 'object',
          description: '사용자 정보와 아바타 정보가 합쳐진 응답',
          properties: {
            id: {
              type: 'string',
              description: '사용자 ID',
            },
            nameEn: {
              type: 'string',
              description: '영문 이름',
              nullable: true,
            },
            email: {
              type: 'string',
              description: '이메일',
              nullable: true,
            },
            nameKr: {
              type: 'string',
              description: '한글 이름',
              nullable: true,
            },
            part: {
              type: 'string',
              description: '소속 부서',
              default: '',
            },
            phone: {
              type: 'string',
              description: '전화번호',
              nullable: true,
            },
            isNamecardActive: {
              type: 'boolean',
              description: '명함 활성화 여부',
              default: false,
            },
            arId: {
              type: 'string',
              description: 'AR 명함 ID (3자리)',
              nullable: true,
            },
            isAdmin: {
              type: 'boolean',
              description: '관리자 여부',
              default: false,
            },
            avatarSelections: {
              type: 'object',
              description: '아바타 선택 옵션 (상세 정보 포함)',
              additionalProperties: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  imageUrl: { type: 'string' },
                  thumbnailUrl: { type: 'string' },
                },
              },
            },
            role: {
              type: 'object',
              description: '역할 상세 정보',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                imageUrl: { type: 'string' },
                thumbnailUrl: { type: 'string' },
              },
            },
            item1: {
              type: 'object',
              description: '아이템 1 상세 정보',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                imageUrl: { type: 'string' },
                thumbnailUrl: { type: 'string' },
                category: { type: 'string' },
              },
            },
            item2: {
              type: 'object',
              description: '아이템 2 상세 정보',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                imageUrl: { type: 'string' },
                thumbnailUrl: { type: 'string' },
                category: { type: 'string' },
              },
            },
            item3: {
              type: 'object',
              description: '아이템 3 상세 정보',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                imageUrl: { type: 'string' },
                thumbnailUrl: { type: 'string' },
                category: { type: 'string' },
              },
            },
            avatarImgUrl: {
              type: 'string',
              description: '아바타 이미지 URL',
              nullable: true,
            },
            message: {
              type: 'string',
              description: '사용자 메시지',
              default: '',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '수정일시',
            },
          },
          required: ['id'],
        },
        AvatarCategory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '카테고리 ID',
            },
            name: {
              type: 'string',
              description: '카테고리 이름',
            },
            type: {
              type: 'string',
              description: '카테고리 타입',
            },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: '옵션 이름',
                  },
                  imageUrl: {
                    type: 'string',
                    description: '이미지 URL',
                  },
                  thumbnailUrl: {
                    type: 'string',
                    description: '썸네일 이미지 URL',
                  },
                  thumbnailSource: {
                    type: 'string',
                    enum: ['user', 'auto'],
                    description: '썸네일 생성 방식',
                  },
                  modelUrl: {
                    type: 'string',
                    description: '모델 URL',
                  },
                  color: {
                    type: 'string',
                    description: '색상',
                  },
                  order: {
                    type: 'number',
                    description: '순서',
                    default: 0,
                  },
                },
                required: ['name', 'imageUrl'],
              },
            },
            order: {
              type: 'number',
              description: '순서',
              default: 0,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '수정일시',
            },
          },
          required: ['name', 'type'],
        },
        ItemCategory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: '카테고리 ID',
            },
            name: {
              type: 'string',
              description: '카테고리 이름',
            },
            type: {
              type: 'string',
              description: '카테고리 타입',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: '아이템 이름',
                  },
                  imageUrl: {
                    type: 'string',
                    description: '이미지 URL',
                  },
                  thumbnailUrl: {
                    type: 'string',
                    description: '썸네일 이미지 URL',
                  },
                  thumbnailSource: {
                    type: 'string',
                    enum: ['user', 'auto'],
                    description: '썸네일 생성 방식',
                  },
                  modelUrl: {
                    type: 'string',
                    description: '모델 URL',
                  },
                  animationUrl: {
                    type: 'string',
                    description: '애니메이션 URL',
                  },
                  animation: {
                    type: 'object',
                    properties: {
                      frames: {
                        type: 'number',
                        description: '프레임 수',
                      },
                      columns: {
                        type: 'number',
                        description: '열 수',
                      },
                      duration: {
                        type: 'number',
                        description: '지속 시간',
                      },
                      type: {
                        type: 'string',
                        description: '애니메이션 타입',
                      },
                    },
                    required: ['frames', 'columns', 'duration', 'type'],
                  },
                  order: {
                    type: 'number',
                    description: '순서',
                    default: 0,
                  },
                },
                required: ['name', 'imageUrl'],
              },
            },
            order: {
              type: 'number',
              description: '순서',
              default: 0,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '생성일시',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '수정일시',
            },
          },
          required: ['name', 'type'],
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: '에러 메시지',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: '필드명',
                  },
                  message: {
                    type: 'string',
                    description: '에러 메시지',
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        firebaseAuth: ['openid', 'email', 'profile'],
      },
    ],
  },
  apis: ['./src/routes/*.ts'], // API 파일 경로
};

// 로컬 IP 주소 찾기
function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const networkInterface of interfaces[name]!) {
      const { address, family, internal } = networkInterface;
      if (family === 'IPv4' && !internal) {
        return address;
      }
    }
  }
  return '127.0.0.1';
}

function generateServerUrls() {
  const port = process.env.PORT || '3000';
  const httpsPort = process.env.HTTPS_PORT || '3443';

  console.log('Swagger: PUBLIC_API_URL from env:', process.env.PUBLIC_API_URL);

  const localIp = getLocalIpAddress();
  const servers = [
    {
      url: `http://localhost:${port}`,
      description: 'Local development server (HTTP)',
    },
    {
      url: `http://${localIp}:${port}`,
      description: 'Network development server (HTTP)',
    },
    {
      url: `https://localhost:${httpsPort}`,
      description: 'Local development server (HTTPS)',
    },
    {
      url: `https://${localIp}:${httpsPort}`,
      description: 'Network development server (HTTPS)',
    },
  ];

  if (process.env.PUBLIC_API_URL) {
    servers.push({
      url: process.env.PUBLIC_API_URL,
      description: 'Cloudtype Production API server',
    });
  }

  return servers;
}

// 동적 옵션 생성
const getDynamicOptions = () => ({
  ...options,
  definition: {
    ...options.definition,
    servers: generateServerUrls(),
  },
});

export const setupSwagger = (app: Express): void => {
  const dynamicSpecs = swaggerJSDoc(getDynamicOptions());
  
  // Swagger UI 옵션 설정
  const swaggerUiOptions = {
    explorer: true,
    swaggerOptions: {
      docExpansion: 'none', // 기본적으로 모든 태그를 접음
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      displayOperationId: false,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
    }
  };
  
  // 커스텀 CSS와 JavaScript로 Avatars 태그만 확장
  const customCss = `
    .opblock-tag-section[data-tag="Avatars"] .opblock-tag {
      background-color: #e8f5e8 !important;
      border-left: 4px solid #4caf50 !important;
    }
    .opblock-tag-section[data-tag="Avatars"] .opblock-tag:after {
      content: " ⭐ 기본 확장" !important;
      font-size: 12px !important;
      color: #4caf50 !important;
      font-weight: bold !important;
    }
    
    /* 자동 확장 스크립트 */
    <script>
      window.addEventListener('DOMContentLoaded', function() {
        function expandAvatarsTag() {
          const avatarsSection = document.querySelector('[data-tag="Avatars"]');
          if (avatarsSection) {
            const avatarsTag = avatarsSection.querySelector('.opblock-tag');
            if (avatarsTag && !avatarsSection.classList.contains('is-open')) {
              avatarsTag.click();
              console.log('✅ Avatars 태그 자동 확장 완료');
            }
          } else {
            // DOM이 아직 로드되지 않았다면 재시도
            setTimeout(expandAvatarsTag, 500);
          }
        }
        
        // 페이지 로드 후 잠시 대기한 다음 실행
        setTimeout(expandAvatarsTag, 1000);
      });
    </script>
  `;
  
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(dynamicSpecs, swaggerUiOptions, {}, customCss, undefined, undefined, 'AR Namecard API Documentation'));
};