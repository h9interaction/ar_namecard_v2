import { Router } from 'express';
import { body } from 'express-validator';
import { getAllUsers, updateUserPermissions } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Admin - Users
 *   description: 관리자 사용자 관리 API
 */

const router = Router();

const permissionUpdateValidation = [
  body('isAdmin').optional().isBoolean().withMessage('isAdmin must be a boolean'),
  body('isNamecardActive').optional().isBoolean().withMessage('isNamecardActive must be a boolean'),
  body('role').optional().isString().withMessage('role must be a string').trim()
];

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: 전체 사용자 목록 조회 (관리자 전용)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 검색어 (이름, 이메일, arId)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: 역할 필터
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: 활성화 상태 필터
 *     responses:
 *       200:
 *         description: 사용자 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 관리자 권한 필요
 */
router.get('/users', authenticateToken, getAllUsers);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: 사용자 권한 관리 (관리자 전용)
 *     tags: [Admin - Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               isAdmin:
 *                 type: boolean
 *                 description: 관리자 여부
 *               isNamecardActive:
 *                 type: boolean
 *                 description: 명함 활성화 여부
 *               role:
 *                 type: string
 *                 description: 역할
 *     responses:
 *       200:
 *         description: 수정된 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: 잘못된 요청
 *       401:
 *         description: 인증 실패
 *       403:
 *         description: 관리자 권한 필요
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.put('/users/:id', authenticateToken, permissionUpdateValidation, updateUserPermissions);

export default router;