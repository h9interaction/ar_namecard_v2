import { Router } from 'express';
import { getItems, getItemById, getAvatarCategories, getAvatarCategoryById } from '../controllers/itemController';
import { authenticateToken } from '../middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Items
 *   description: 아이템 관리 API
 */

const router = Router();

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: 아이템 목록 조회
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 아이템 타입 필터
 *     responses:
 *       200:
 *         description: 아이템 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ItemCategory'
 *       401:
 *         description: 인증 실패
 */
router.get('/', authenticateToken, getItems);

/**
 * @swagger
 * /api/items/avatar-categories:
 *   get:
 *     summary: 아바타 카테고리 목록 조회
 *     tags: [Items]
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
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AvatarCategory'
 *       401:
 *         description: 인증 실패
 */
router.get('/avatar-categories', authenticateToken, getAvatarCategories);

/**
 * @swagger
 * /api/items/avatar-categories/{id}:
 *   get:
 *     summary: 아바타 카테고리 상세 조회
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 아바타 카테고리 ID
 *     responses:
 *       200:
 *         description: 아바타 카테고리 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvatarCategory'
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 아바타 카테고리를 찾을 수 없음
 */
router.get('/avatar-categories/:id', authenticateToken, getAvatarCategoryById);

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: 아이템 상세 조회
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 아이템 ID
 *     responses:
 *       200:
 *         description: 아이템 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ItemCategory'
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 아이템을 찾을 수 없음
 */
router.get('/:id', authenticateToken, getItemById);

export default router;