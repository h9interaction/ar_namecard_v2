import { Router } from 'express';
import { getItems, getItemById, getAvatarCategories, getAvatarCategoryById } from '../controllers/itemController';
import { authenticateToken } from '../middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Characters And Stickers
 *   description: 캐릭터 요소 및 스티커 관리 API
 */

const router = Router();

/**
 * @swagger
 * /api/stickers:
 *   get:
 *     summary: 스티커 전체 목록 조회
 *     tags: [Characters And Stickers]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 스티커 타입 필터
 *     responses:
 *       200:
 *         description: 스티커 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ItemCategory'
 */
router.get('/', getItems);

/**
 * @swagger
 * /api/stickers/{id}:
 *   get:
 *     summary: 스티커 상세 조회
 *     tags: [Characters And Stickers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 스티커 ID
 *     responses:
 *       200:
 *         description: 스티커 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ItemCategory'
 *       404:
 *         description: 스티커를 찾을 수 없음
 */
router.get('/:id', getItemById);

export default router;