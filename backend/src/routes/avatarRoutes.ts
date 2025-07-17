import { Router } from 'express';
import { body } from 'express-validator';
import { getAvatarByUserId, updateAvatar, uploadAvatarImage } from '../controllers/avatarController';
import { authenticateToken } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

/**
 * @swagger
 * tags:
 *   name: Avatars
 *   description: 아바타 관리 API
 */

const router = Router();

const avatarValidation = [
  body('avatarSelections').optional().isObject().withMessage('Avatar selections must be an object'),
  body('role').optional().trim(),
  body('item1').optional().trim(),
  body('item2').optional().trim(),
  body('item3').optional().trim(),
  body('avatarImgUrl').optional().isURL().withMessage('Avatar image URL must be valid').trim()
];

/**
 * @swagger
 * /api/avatars/{userId}:
 *   get:
 *     summary: 아바타 정보 조회
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
 *     responses:
 *       200:
 *         description: 아바타 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserCustomization'
 *       401:
 *         description: 인증 실패
 *       404:
 *         description: 아바타를 찾을 수 없음
 */
router.get('/:userId', authenticateToken, getAvatarByUserId);

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
router.post('/upload', authenticateToken, uploadSingle('avatar'), uploadAvatarImage);

export default router;