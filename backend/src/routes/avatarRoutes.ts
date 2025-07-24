import { Router } from 'express';
import { body } from 'express-validator';
import { getAvatarByUserId, updateAvatar, uploadAvatarImage } from '../controllers/avatarController';
// import { getAvatarCategories } from '../controllers/avatarController'; // Hidden endpoint
import { authenticateToken } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

/**
 * @swagger
 * tags:
 *   name: Avatars
 *   description: 아바타 관리 API
 */

const router = Router();

// Hidden endpoint - 아바타 카테고리 목록 조회는 Characters API에서 처리
// /**
//  * @swagger
//  * /api/avatars/categories:
//  *   get:
//  *     summary: 아바타 카테고리 목록 조회 (일반 사용자용)
//  *     tags: [Avatars]
//  *     parameters:
//  *       - in: query
//  *         name: type
//  *         schema:
//  *           type: string
//  *         description: 카테고리 타입 필터
//  *     responses:
//  *       200:
//  *         description: 아바타 카테고리 목록
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 categories:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/AvatarCategory'
//  *                 total:
//  *                   type: integer
//  */
// router.get('/categories', getAvatarCategories);

const avatarValidation = [
  body('avatarSelections').optional().isObject().withMessage('Avatar selections must be an object'),
  body('role').optional().trim(),
  body('item1').optional().trim(),
  body('item2').optional().trim(),
  body('item3').optional().trim(),
  // avatarImgUrl 검증 완전 제거 (Firebase Storage URL 호환을 위해)
  body('message').optional().isLength({ max: 100 }).withMessage('Message must be 100 characters or less').trim()
];

/**
 * @swagger
 * /api/avatars/{userId}:
 *   get:
 *     summary: 아바타 정보 조회 (사용자 정보 포함 8thwall 용)
 *     tags: [Avatars]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID 또는 arId
 *     responses:
 *       200:
 *         description: 사용자 정보와 아바타 정보가 합쳐진 응답
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvatarWithUser'
 *       404:
 *         description: 아바타를 찾을 수 없음
 */
router.get('/:userId', getAvatarByUserId);

/**
 * @swagger
 * /api/avatars/{userId}:
 *   put:
 *     summary: 아바타 정보 수정
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatarSelections:
 *                 type: object
 *                 description: 아바타 선택 옵션
 *                 additionalProperties:
 *                   type: string
 *               role:
 *                 type: string
 *                 description: 역할
 *               item1:
 *                 type: string
 *                 description: 아이템 1
 *               item2:
 *                 type: string
 *                 description: 아이템 2
 *               item3:
 *                 type: string
 *                 description: 아이템 3
 *               avatarImgUrl:
 *                 type: string
 *                 description: 아바타 이미지 URL
 *     responses:
 *       200:
 *         description: 수정된 아바타 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCustomization'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 검증 없는 임시 라우트 (Firebase Storage URL 문제 해결용)
router.put('/:userId/no-validation', authenticateToken, updateAvatar);

router.put('/:userId', authenticateToken, avatarValidation, updateAvatar);

/**
 * @swagger
 * /api/avatars/upload:
 *   post:
 *     summary: 아바타 이미지 업로드
 *     tags: [Avatars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: 아바타 이미지 파일
 *               userId:
 *                 type: string
 *                 description: 사용자 ID
 *             required:
 *               - avatar
 *               - userId
 *     responses:
 *       200:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: 성공 메시지
 *                 avatarImgUrl:
 *                   type: string
 *                   description: 업로드된 이미지 URL
 *                 avatar:
 *                   $ref: '#/components/schemas/UserCustomization'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 */
// 디버깅용 환경 변수 확인 엔드포인트
router.get('/debug/env', (_req, res) => {
  res.json({
    hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
    hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    hasFirebaseStorageBucket: !!process.env.FIREBASE_STORAGE_BUCKET,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    nodeEnv: process.env.NODE_ENV
  });
});

router.post('/upload', authenticateToken, uploadSingle('avatar'), uploadAvatarImage);

export default router;