import { Router } from 'express';
import { body } from 'express-validator';
import { getUserById, updateUser, createUser } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: 사용자 관리 API
 */

const router = Router();

const userValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('nameKr').notEmpty().withMessage('Korean name is required').trim(),
  body('phone').notEmpty().withMessage('Phone number is required').trim(),
  body('arId').isLength({ min: 3, max: 3 }).withMessage('arId must be exactly 3 characters'),
  body('nameEn').optional().trim(),
  body('role').optional().trim(),
  body('part').optional().trim(),
  body('isNamecardActive').optional().isBoolean(),
  body('isAdmin').optional().isBoolean()
];

const userUpdateValidation = [
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('nameKr').optional().notEmpty().withMessage('Korean name cannot be empty').trim(),
  body('phone').optional().notEmpty().withMessage('Phone number cannot be empty').trim(),
  body('arId').optional().isLength({ min: 3, max: 3 }).withMessage('arId must be exactly 3 characters'),
  body('nameEn').optional().trim(),
  body('role').optional().trim(),
  body('part').optional().trim(),
  body('isNamecardActive').optional().isBoolean(),
  body('isAdmin').optional().isBoolean()
];

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: 사용자 정보 조회
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 사용자 ID
 *     responses:
 *       200:
 *         description: 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.get('/:id', authenticateToken, getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: 사용자 정보 수정
 *     tags: [Users]
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
 *               nameEn:
 *                 type: string
 *                 description: 영문 이름
 *               email:
 *                 type: string
 *                 description: 이메일
 *               nameKr:
 *                 type: string
 *                 description: 한글 이름
 *               role:
 *                 type: string
 *                 description: 역할
 *               part:
 *                 type: string
 *                 description: 소속 부서
 *               phone:
 *                 type: string
 *                 description: 전화번호
 *               isNamecardActive:
 *                 type: boolean
 *                 description: 명함 활성화 여부
 *               arId:
 *                 type: string
 *                 description: AR 명함 ID (3자리)
 *               isAdmin:
 *                 type: boolean
 *                 description: 관리자 여부
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
 *       404:
 *         description: 사용자를 찾을 수 없음
 */
router.put('/:id', authenticateToken, userUpdateValidation, updateUser);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: 사용자 생성
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - nameKr
 *               - phone
 *               - arId
 *             properties:
 *               nameEn:
 *                 type: string
 *                 description: 영문 이름
 *               email:
 *                 type: string
 *                 description: 이메일
 *               nameKr:
 *                 type: string
 *                 description: 한글 이름
 *               role:
 *                 type: string
 *                 description: 역할
 *                 default: User
 *               part:
 *                 type: string
 *                 description: 소속 부서
 *                 default: ""
 *               phone:
 *                 type: string
 *                 description: 전화번호
 *               isNamecardActive:
 *                 type: boolean
 *                 description: 명함 활성화 여부
 *                 default: false
 *               arId:
 *                 type: string
 *                 description: AR 명함 ID (3자리)
 *                 minLength: 3
 *                 maxLength: 3
 *               isAdmin:
 *                 type: boolean
 *                 description: 관리자 여부
 *                 default: false
 *     responses:
 *       201:
 *         description: 생성된 사용자 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: 잘못된 요청
 *       409:
 *         description: 이미 존재하는 사용자
 */
router.post('/', userValidation, createUser);

export default router;