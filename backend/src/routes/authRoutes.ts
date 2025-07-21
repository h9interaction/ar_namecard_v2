import { Router } from 'express';
import { body } from 'express-validator';
import { loginUser, getTestToken } from '../controllers/authController';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: "사용자 인증 API"
 */

const router = Router();

const loginValidation = [
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('arId').optional().isLength({ min: 3, max: 3 }).withMessage('arId must be exactly 3 characters')
];

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: "사용자 로그인"
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: "이메일 (email 또는 arId 중 하나 필수)"
 *               arId:
 *                 type: string
 *                 description: "AR 명함 ID (email 또는 arId 중 하나 필수)"
 *             example:
 *               email: "hyeonseo.ahn@hnine.com"
 *     responses:
 *       200:
 *         description: "로그인 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: "JWT 토큰"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: "인증 실패"
 *       400:
 *         description: "잘못된 요청"
 */
router.post('/login', loginValidation, loginUser);

/**
 * @swagger
 * /api/auth/test-token/{arId}:
 *   get:
 *     summary: "테스트용 토큰 생성 (개발용)"
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: arId
 *         required: true
 *         schema:
 *           type: string
 *         description: "AR 명함 ID (예: 001)"
 *     responses:
 *       200:
 *         description: "테스트 토큰 생성 성공"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                   description: "JWT 토큰"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     nameKr:
 *                       type: string
 *                     arId:
 *                       type: string
 *                     isAdmin:
 *                       type: boolean
 *       404:
 *         description: "사용자를 찾을 수 없음"
 */
router.get('/test-token/:arId', getTestToken);

export default router;