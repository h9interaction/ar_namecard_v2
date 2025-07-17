import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AR Namecard API',
      version: '1.0.0',
      description: 'AR 명함 서비스 API 문서',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
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
    ],
  },
  apis: ['./src/routes/*.ts'], // API 파일 경로
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};