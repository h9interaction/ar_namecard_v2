import { Request, Response } from 'express';
import { User } from '../models';
import { validationResult } from 'express-validator';
import ExcelJS from 'exceljs';

interface AuthRequest extends Request {
  user?: any;
}

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    
    const { page = 1, limit = 20, search, role, isActive, isAdmin } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    let query: any = {};
    
    if (search) {
      query.$or = [
        { nameKr: { $regex: search, $options: 'i' } },
        { nameEn: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { arId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isNamecardActive = isActive === 'true';
    }

    if (isAdmin !== undefined) {
      query.isAdmin = isAdmin === 'true';
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);
    
    res.json({
      users,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const exportUsersToExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    const users = await User.find({}).sort({ createdAt: -1 }); // 모든 사용자 조회

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Users');

    // 헤더 설정
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: '이메일', key: 'email', width: 30 },
      { header: '한글 이름', key: 'nameKr', width: 15 },
      { header: '영문 이름', key: 'nameEn', width: 15 },
      { header: '역할', key: 'role', width: 10 },
      { header: '부서', key: 'part', width: 15 },
      { header: '전화번호', key: 'phone', width: 20 },
      { header: 'AR ID', key: 'arId', width: 10 },
      { header: '명함 활성화', key: 'isNamecardActive', width: 15 },
      { header: '관리자', key: 'isAdmin', width: 10 },
      { header: '생성일', key: 'createdAt', width: 20 },
      { header: '수정일', key: 'updatedAt', width: 20 },
    ];

    // 데이터 추가
    users.forEach(user => {
      worksheet.addRow({
        id: user._id ? user._id.toString() : '',
        email: user.email,
        nameKr: user.nameKr,
        nameEn: user.nameEn,
        role: user.role,
        part: user.part,
        phone: user.phone,
        arId: user.arId,
        isNamecardActive: user.isNamecardActive ? 'Yes' : 'No',
        isAdmin: user.isAdmin ? 'Yes' : 'No',
        createdAt: user.createdAt ? user.createdAt.toISOString() : '',
        updatedAt: user.updatedAt ? user.updatedAt.toISOString() : '',
      });
    });

    // 응답 헤더 설정
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'users.xlsx'
    );

    // 워크북을 스트림으로 응답
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exporting users to Excel:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUserPermissions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: 'Validation error', errors: errors.array() });
      return;
    }
    
    const { id } = req.params;
    const { isAdmin, isNamecardActive, role, nameKr, nameEn, part, phone } = req.body;
    
    const updateData: any = {};
    
    if (isAdmin !== undefined) {
      updateData.isAdmin = isAdmin;
    }
    
    if (isNamecardActive !== undefined) {
      updateData.isNamecardActive = isNamecardActive;
    }
    
    if (role !== undefined) {
      updateData.role = role;
    }

    if (nameKr !== undefined) {
      updateData.nameKr = nameKr;
    }

    if (nameEn !== undefined) {
      updateData.nameEn = nameEn;
    }

    if (part !== undefined) {
      updateData.part = part;
    }

    if (phone !== undefined) {
      updateData.phone = phone;
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.json({ message: 'User updated successfully', user });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const importUsersFromExcel = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.isAdmin) {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const worksheet = workbook.getWorksheet(1); // 첫 번째 워크시트
    if (!worksheet) {
      res.status(400).json({ message: 'No worksheet found in the Excel file' });
      return;
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: any[] = [];

    // 헤더 매핑 (엑셀 파일의 헤더와 DB 필드명 매핑)
    const headerMap: { [key: string]: string } = {
      '이메일': 'email',
      '한글 이름': 'nameKr',
      '영문 이름': 'nameEn',
      '역할': 'role',
      '부서': 'part',
      '전화번호': 'phone',
      'AR ID': 'arId',
      '명함 활성화': 'isNamecardActive',
      '관리자': 'isAdmin',
    };

    const headers: string[] = [];
    worksheet.getRow(1).eachCell((cell) => {
      headers.push(cell.value ? cell.value.toString() : '');
    });

    for (let i = 2; i <= worksheet.rowCount; i++) { // 2행부터 데이터 시작
      const row = worksheet.getRow(i);
      const userData: any = {};
      let hasEmail = false;
      let hasArId = false;

      row.eachCell((cell, colNumber) => {
        const headerName = headers[colNumber - 1];
        const fieldName = headerMap[headerName];
        if (fieldName) {
          let cellValue: any = cell.value;

          // 불리언 값 처리
          if (fieldName === 'isNamecardActive' || fieldName === 'isAdmin') {
            if (typeof cellValue === 'string') {
              cellValue = cellValue.toLowerCase() === 'yes' || cellValue.toLowerCase() === 'true';
            } else if (typeof cellValue === 'number') {
              cellValue = cellValue === 1;
            }
          }
          userData[fieldName] = cellValue;

          if (fieldName === 'email') hasEmail = true;
          if (fieldName === 'arId') hasArId = true;
        }
      });

      // 필수 필드 검증
      if (!hasEmail || !hasArId || !userData.nameKr || !userData.phone) {
        errors.push({ row: i, message: '필수 필드(이메일, AR ID, 한글 이름, 전화번호)가 누락되었습니다.', data: userData });
        continue;
      }

      try {
        // 이메일 또는 AR ID로 기존 사용자 찾기
        let user = await User.findOne({ $or: [{ email: userData.email }, { arId: userData.arId }] });

        if (user) {
          // 기존 사용자 업데이트
          Object.assign(user, userData);
          await user.save();
          updatedCount++;
        } else {
          // 새 사용자 생성
          user = new User(userData);
          await user.save();
          createdCount++;
        }
      } catch (error) {
        console.error(`Error processing row ${i}:`, error);
        errors.push({ row: i, message: error instanceof Error ? error.message : '알 수 없는 오류', data: userData });
      }
    }

    res.status(200).json({
      message: 'User data imported successfully',
      createdCount,
      updatedCount,
      errors,
    });

  } catch (error) {
    console.error('Error importing users from Excel:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};