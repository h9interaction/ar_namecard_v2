import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAllItemCategories,
  getItemCategoryById,
  createItemCategory,
  updateItemCategory,
  deleteItemCategory,
  addItem,
  updateItem,
  deleteItem,
  regenerateItemThumbnail
} from '../controllers/adminItemController';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';

/**
 * @swagger
 * tags:
 *   name: Admin - Stickers
 *   description: 관리자 스티커 관리 API
 */

const router = Router();

// 카테고리 관리
const categoryValidation = [
  body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('type').isString().isLength({ min: 1, max: 50 }).withMessage('Type must be 1-50 characters'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer')
];

// 스티커 관리
const itemValidation = [
  body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
  body('frames').optional().isInt({ min: 1 }).withMessage('Frames must be a positive integer'),
  body('columns').optional().isInt({ min: 1, max: 64 }).withMessage('Columns must be 1-64'),
  body('duration').optional().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('animationType').optional().isString().withMessage('Animation type must be a string')
];

/**
 * @swagger
 * /api/admin/stickers/categories:
 *   get:
 *     summary: 스티커 카테고리 목록 조회 (관리자 전용)
 *     tags: [Admin - Stickers]
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
 *         description: 스티커 카테고리 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ItemCategory'
 *                 total:
 *                   type: integer
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 관리자 권한 필요
 */
router.get('/categories', authenticateToken, getAllItemCategories);

/**
 * @swagger
 * /api/admin/stickers/categories/{id}:
 *   get:
 *     summary: 스티커 카테고리 상세 조회 (관리자 전용)
 *     tags: [Admin - Stickers]
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
 *         description: 스티커 카테고리 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ItemCategory'
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */
router.get('/categories/:id', authenticateToken, getItemCategoryById);

/**
 * @swagger
 * /api/admin/stickers/categories:
 *   post:
 *     summary: 새 스티커 카테고리 생성 (관리자 전용)
 *     tags: [Admin - Stickers]
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
 *                 example: "운동"
 *               type:
 *                 type: string
 *                 description: 카테고리 타입 (고유값)
 *                 example: "exercise"
 *               order:
 *                 type: integer
 *                 description: 표시 순서
 *                 example: 1
 *     responses:
 *       201:
 *         description: 스티커 카테고리 생성 성공
 *       400:
 *         description: 잘못된 요청 또는 중복된 타입
 *       403:
 *         description: 관리자 권한 필요
 */
router.post('/categories', authenticateToken, categoryValidation, createItemCategory);

/**
 * @swagger
 * /api/admin/stickers/categories/{id}:
 *   put:
 *     summary: 스티커 카테고리 수정 (관리자 전용)
 *     tags: [Admin - Stickers]
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
 *         description: 스티커 카테고리 수정 성공
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */
router.put('/categories/:id', authenticateToken, categoryValidation, updateItemCategory);

/**
 * @swagger
 * /api/admin/stickers/categories/{id}:
 *   delete:
 *     summary: 스티커 카테고리 삭제 (관리자 전용)
 *     tags: [Admin - Stickers]
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
 *         description: 스티커 카테고리 삭제 성공
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */
router.delete('/categories/:id', authenticateToken, deleteItemCategory);

/**
 * @swagger
 * /api/admin/stickers/categories/{id}/items:
 *   post:
 *     summary: 스티커 추가 (관리자 전용)
 *     tags: [Admin - Stickers]
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
 *                 description: 스티커 이름
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 원본 이미지 또는 스프라이트 시퀀스 이미지
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: 썸네일 이미지 파일 (100x100px, 선택사항)
 *               frames:
 *                 type: integer
 *                 description: 총 프레임 수 (애니메이션인 경우)
 *               columns:
 *                 type: integer
 *                 description: 스프라이트시트 컬럼 수 (기본값 16)
 *                 default: 16
 *               duration:
 *                 type: integer
 *                 description: 애니메이션 지속 시간 (ms)
 *               animationType:
 *                 type: string
 *                 description: 애니메이션 타입 (loop, once, etc.)
 *               order:
 *                 type: integer
 *                 description: 표시 순서
 *     responses:
 *       201:
 *         description: 스티커 추가 성공
 *       400:
 *         description: 잘못된 요청
 *       404:
 *         description: 카테고리를 찾을 수 없음
 */
router.post('/categories/:id/items', 
  authenticateToken, 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), 
  itemValidation, 
  addItem
);

/**
 * @swagger
 * /api/admin/stickers/categories/{categoryId}/items/{itemId}:
 *   put:
 *     summary: 스티커 수정 (관리자 전용)
 *     tags: [Admin - Stickers]
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
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: 스티커 ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 스티커 이름
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: 새 원본 이미지 (선택사항)
 *               thumbnail:
 *                 type: string
 *                 format: binary
 *                 description: 새 썸네일 이미지 (선택사항)
 *               frames:
 *                 type: integer
 *                 description: 총 프레임 수
 *               columns:
 *                 type: integer
 *                 description: 스프라이트시트 컬럼 수
 *               duration:
 *                 type: integer
 *                 description: 애니메이션 지속 시간 (ms)
 *               animationType:
 *                 type: string
 *                 description: 애니메이션 타입
 *               order:
 *                 type: integer
 *                 description: 표시 순서
 *     responses:
 *       200:
 *         description: 스티커 수정 성공
 *       404:
 *         description: 카테고리 또는 스티커을 찾을 수 없음
 */
router.put('/categories/:categoryId/items/:itemId', 
  authenticateToken, 
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]), 
  updateItem
);

/**
 * @swagger
 * /api/admin/stickers/categories/{categoryId}/items/{itemId}:
 *   delete:
 *     summary: 스티커 삭제 (관리자 전용)
 *     tags: [Admin - Stickers]
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
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: 스티커 ID
 *     responses:
 *       200:
 *         description: 스티커 삭제 성공
 *       404:
 *         description: 카테고리 또는 스티커을 찾을 수 없음
 */
router.delete('/categories/:categoryId/items/:itemId', authenticateToken, deleteItem);

/**
 * @swagger
 * /api/admin/stickers/categories/{categoryId}/items/{itemId}/regenerate-thumbnail:
 *   post:
 *     summary: 스티커 썸네일 재생성 (관리자 전용)
 *     tags: [Admin - Stickers]
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
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: 스티커 ID
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
 *         description: 카테고리 또는 스티커을 찾을 수 없음
 */
router.post('/categories/:categoryId/items/:itemId/regenerate-thumbnail', authenticateToken, regenerateItemThumbnail);

export default router;