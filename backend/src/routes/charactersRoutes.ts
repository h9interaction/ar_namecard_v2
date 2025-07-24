import { Router } from 'express';
import { getAvatarCategories, getAvatarCategoryById } from '../controllers/itemController';
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
 * /api/characters:
 *   get:
 *     summary: 캐릭터 요소 전체 목록 조회 (눈, 코, 입, 머리, 눈썹 등)
 *     tags: [Characters And Stickers]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: 카테고리 타입 필터
 *     responses:
 *       200:
 *         description: 캐릭터 카테고리 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AvatarCategory'
 */
router.get('/', getAvatarCategories);

/**
 * @swagger
 * /api/characters/{id}:
 *   get:
 *     summary: 캐릭터 요소 상세 조회
 *     tags: [Characters And Stickers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 캐릭터 카테고리 ID
 *     responses:
 *       200:
 *         description: 캐릭터 카테고리 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AvatarCategory'
 *       404:
 *         description: 캐릭터 카테고리를 찾을 수 없음
 */
router.get('/:id', getAvatarCategoryById);

export default router;