import { Router } from 'express';
import { body } from 'express-validator';
import { verifyFirebaseToken } from '../controllers/firebaseAuthController';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: 사용자 인증 API
 */

const router = Router();

const firebaseTokenValidation = [
  body('idToken')
    .notEmpty()
    .withMessage('Firebase ID token is required')
    .isString()
    .withMessage('ID token must be a string')
];

/**
 * @swagger
 * /api/auth/firebase/verify:
 *   post:
 *     summary: Firebase ID 토큰 검증 및 로그인
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase Authentication에서 발급된 ID 토큰
 *             example:
 *               idToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2N..."
 *     responses:
 *       200:
 *         description: Firebase 인증 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Firebase authentication successful"
 *                 token:
 *                   type: string
 *                   description: AR 명함 시스템 JWT 토큰
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 firebase:
 *                   type: object
 *                   properties:
 *                     uid:
 *                       type: string
 *                       description: Firebase 사용자 UID
 *                     email:
 *                       type: string
 *                       description: Firebase 사용자 이메일
 *       400:
 *         description: 잘못된 요청 (ID 토큰 누락 등)
 *       401:
 *         description: 유효하지 않은 Firebase ID 토큰
 *       404:
 *         description: Firebase 사용자는 존재하지만 AR 명함 시스템에 등록되지 않음
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "User not found in system"
 *                 message:
 *                   type: string
 *                   example: "Firebase user exists but not registered in AR namecard system"
 *                 firebaseEmail:
 *                   type: string
 *                   description: Firebase에서 확인된 이메일
 *       500:
 *         description: 서버 내부 오류
 */
router.post('/verify', firebaseTokenValidation, verifyFirebaseToken);

export default router;