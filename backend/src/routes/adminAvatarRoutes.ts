import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllAvatarCategories,
  getAvatarCategoryById,
  createAvatarCategory,
  updateAvatarCategory,
  deleteAvatarCategory,
  addAvatarOption,
  updateAvatarOption,
  deleteAvatarOption,
  regenerateThumbnail
} from '../controllers/adminAvatarController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

/**
 * @swagger
 * tags:
 *   name: Admin - Avatars
 *   description: 관리자 아바타 관리 API
 */

const router = Router();

// 카테고리 관리
const categoryValidation = [
  body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('type').isString().isLength({ min: 1, max: 50 }).withMessage('Type must be 1-50 characters'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
];

// 옵션 관리
const optionValidation = [
  body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('color').optional().isString().withMessage('Color must be a string'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
];

/**
 * @swagger
 * /api/admin/avatars/categories:
 *   get:
 *     summary: 아바타 카테고리 목록 조회 (관리자 전용)
 *     tags: [Admin - Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 카테고리 타입 필터
 *     responses:
 *       200:
 *         description: 아바타 카테고리 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AvatarCategory'
 *                 total:
 *                   type: integer
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 관리자 권한 필요
 */
router.get('/categories', authenticateToken, getAllAvatarCategories);

/**
 * @swagger
 * /api/admin/avatars/categories/{id}:
 *   get:
 *     summary: 아바타 카테고리 상세 조회 (관리자 전용)
 *     tags: [Admin - Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 ID
 *     responses:
 *       200:
 *         description: 아바타 카테고리 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvatarCategory'
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */
router.get('/categories/:id', authenticateToken, getAvatarCategoryById);

/**
 * @swagger
 * /api/admin/avatars/categories:
 *   post:
 *     summary: 새 아바타 카테고리 생성 (관리자 전용)
 *     tags: [Admin - Avatars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 description: 카테고리 이름
 *                 example: "헤어스타일"
 *               type:
 *                 type: string
 *                 description: 카테고리 타입 (고유값)
 *                 example: "hair"
 *               order:
 *                 type: integer
 *                 description: 표시 순서
 *                 example: 1
 *     responses:
 *       201:
 *         description: 아바타 카테고리 생성 성공
 *       400:
 *         description: 잘못된 요청 또는 중복된 타입
 *       403:
 *         description: 관리자 권한 필요
 */
router.post('/categories', authenticateToken, categoryValidation, createAvatarCategory);

/**
 * @swagger
 * /api/admin/avatars/categories/{id}:
 *   put:
 *     summary: 아바타 카테고리 수정 (관리자 전용)
 *     tags: [Admin - Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 카테고리 이름
 *               type:
 *                 type: string
 *                 description: 카테고리 타입
 *               order:
 *                 type: integer
 *                 description: 표시 순서
 *     responses:
 *       200:
 *         description: 아바타 카테고리 수정 성공
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */
router.put('/categories/:id', authenticateToken, categoryValidation, updateAvatarCategory);

/**
 * @swagger
 * /api/admin/avatars/categories/{id}:
 *   delete:
 *     summary: 아바타 카테고리 삭제 (관리자 전용)
 *     tags: [Admin - Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 ID
 *     responses:
 *       200:
 *         description: 아바타 카테고리 삭제 성공
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */
router.delete('/categories/:id', authenticateToken, deleteAvatarCategory);

/**
 * @swagger
 * /api/admin/avatars/categories/{id}/options:
 *   post:
 *     summary: 아바타 옵션 추가 (관리자 전용)
 *     tags: [Admin - Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: 옵션 이름
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 원본 이미지 파일 (512x512px 권장)
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: 썸네일 이미지 파일 (100x100px, 선택사항)
 *               color:
 *                 type: string
 *                 description: 색상 정보
 *                 example: "#000000"
 *               order:
 *                 type: integer
 *                 description: 표시 순서
 *     responses:
 *       201:
 *         description: 아바타 옵션 추가 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */
router.post('/categories/:id/options', 
  authenticateToken, 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), 
  optionValidation, 
  addAvatarOption
);

/**
 * @swagger
 * /api/admin/avatars/categories/{categoryId}/options/{optionId}:
 *   put:
 *     summary: 아바타 옵션 수정 (관리자 전용)
 *     tags: [Admin - Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 ID
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 옵션 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 옵션 이름
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 새 원본 이미지 파일 (선택사항)
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: 새 썸네일 이미지 파일 (선택사항)
 *               color:
 *                 type: string
 *                 description: 색상 정보
 *               order:
 *                 type: integer
 *                 description: 표시 순서
 *     responses:
 *       200:
 *         description: 아바타 옵션 수정 성공
 *       404:
 *         description: 카테고리 또는 옵션을 찾을 수 없음
 */
router.put('/categories/:categoryId/options/:optionId', 
  authenticateToken, 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), 
  updateAvatarOption
);

/**
 * @swagger
 * /api/admin/avatars/categories/{categoryId}/options/{optionId}:
 *   delete:
 *     summary: 아바타 옵션 삭제 (관리자 전용)
 *     tags: [Admin - Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 ID
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 옵션 ID
 *     responses:
 *       200:
 *         description: 아바타 옵션 삭제 성공
 *       404:
 *         description: 카테고리 또는 옵션을 찾을 수 없음
 */
router.delete('/categories/:categoryId/options/:optionId', authenticateToken, deleteAvatarOption);

/**
 * @swagger
 * /api/admin/avatars/categories/{categoryId}/options/{optionId}/thumbnail/regenerate:
 *   post:
 *     summary: 아바타 옵션 썸네일 재생성
 *     tags: [Admin - Avatars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: 카테고리 ID
 *       - in: path
 *         name: optionId
 *         required: true
 *         schema:
 *           type: string
 *         description: 옵션 ID
 *     responses:
 *       200:
 *         description: 썸네일 재생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 thumbnailUrl:
 *                   type: string
 *       404:
 *         description: 카테고리 또는 옵션을 찾을 수 없음
 */
router.post('/categories/:categoryId/options/:optionId/thumbnail/regenerate', authenticateToken, regenerateThumbnail);

export default router;