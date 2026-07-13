import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import { generateRollNo } from '../utils/helpers';
import bcrypt from 'bcryptjs';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = (req.query.search as string) || '';
  const classId = (req.query.classId as string) || '';
  const gender = (req.query.gender as string) || '';
  const skip = (page - 1) * limit;

  const where: any = {};
  if (classId) where.classId = classId;
  if (gender) where.gender = gender;
  if (search) {
    where.OR = [
      { user: { name: { contains: search } } },
      { rollNo: { contains: search } },
    ];
  }

  const [students, total] = await Promise.all([
    prisma.student.findMany({
      where,
      skip,
      take: limit,
      orderBy: { rollNo: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true } },
        class: { select: { id: true, name: true, section: true } },
        parent: { include: { user: { select: { name: true, phone: true, email: true } } } },
      },
    }),
    prisma.student.count({ where }),
  ]);

  paginatedResponse(res, students, total, page, limit, 'Students fetched');
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true, isActive: true, createdAt: true } },
      class: true,
      parent: { include: { user: { select: { name: true, phone: true, email: true } } } },
      marks: { include: { exam: true, subject: true }, orderBy: { createdAt: 'desc' } },
      feePayments: { include: { feeStructure: true }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!student) return next(createError('Student not found', 404));
  successResponse(res, student, 'Student fetched');
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, password, phone, photoUrl, classId, dob, gender, address, bloodGroup, parentId, studentId, fatherName, motherName, aadharNo, penNumber } = req.body;

  const count = await prisma.student.count();
  const rollNo = studentId?.trim() || generateRollNo(count + 1);

  const existing = await prisma.student.findUnique({ where: { rollNo } });
  if (existing) return next(createError('Student ID already exists', 409));

  // The login ID is exactly the Student ID
  const email = rollNo;

  const hashedPassword = await bcrypt.hash(password || 'Student@123', 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: 'STUDENT', phone, photoUrl },
  });

  const student = await prisma.student.create({
    data: {
      userId: user.id,
      rollNo,
      classId: classId || null,
      dob: dob ? new Date(dob) : null,
      gender: gender || null,
      address: address || null,
      bloodGroup: bloodGroup || null,
      parentId: parentId || null,
      fatherName: fatherName || null,
      motherName: motherName || null,
      aadharNo: aadharNo || null,
      penNumber: penNumber || null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      class: true,
    },
  });

  successResponse(res, student, 'Student created', 201);
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, phone, photoUrl, classId, dob, gender, address, bloodGroup, parentId, studentId, fatherName, motherName, aadharNo, penNumber } = req.body;

  const student = await prisma.student.findUnique({ where: { id }, include: { user: true } });
  if (!student) return next(createError('Student not found', 404));

  let finalRollNo = student.rollNo;
  const newStudentId = studentId?.trim();

  if (newStudentId && newStudentId !== student.rollNo) {
    const existing = await prisma.student.findUnique({ where: { rollNo: newStudentId } });
    if (existing) return next(createError('Student ID already exists', 409));
    
    // Update User email (login ID) to the new Student ID
    await prisma.user.update({
      where: { id: student.userId },
      data: { name, phone, photoUrl, email: newStudentId },
    });
    finalRollNo = newStudentId;
  } else {
    await prisma.user.update({
      where: { id: student.userId },
      data: { name, phone, photoUrl },
    });
  }

  const updated = await prisma.student.update({
    where: { id },
    data: {
      rollNo: finalRollNo,
      classId: classId !== undefined ? classId || null : undefined,
      dob: dob ? new Date(dob) : undefined,
      gender: gender || undefined,
      address: address || undefined,
      bloodGroup: bloodGroup || undefined,
      parentId: parentId !== undefined ? parentId || null : undefined,
      fatherName: fatherName !== undefined ? fatherName || null : undefined,
      motherName: motherName !== undefined ? motherName || null : undefined,
      aadharNo: aadharNo !== undefined ? aadharNo || null : undefined,
      penNumber: penNumber !== undefined ? penNumber || null : undefined,
    },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } },
      class: true,
    },
  });

  successResponse(res, updated, 'Student updated');
};

export const deleteStudent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return next(createError('Student not found', 404));

  try {
    await prisma.$transaction([
      prisma.attendance.deleteMany({ where: { studentId: id } }),
      prisma.mark.deleteMany({ where: { studentId: id } }),
      prisma.feePayment.deleteMany({ where: { studentId: id } }),
      prisma.student.delete({ where: { id } }),
      prisma.user.delete({ where: { id: student.userId } }),
    ]);
    successResponse(res, null, 'Student deleted');
  } catch (err) {
    next(err);
  }
};

export const bulkImport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('Excel or CSV file required', 400));

  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const results = XLSX.utils.sheet_to_json<any>(sheet).filter(r => r.Name || r.name || r['Student Name'] || r['First Name']);

    if (results.length > 500) {
      return next(createError('Please upload maximum 500 students at a time', 400));
    }

    let success = 0;
    const failed: any[] = [];
    
    // Fetch initial count once to save DB roundtrips
    let currentStudentCount = await prisma.student.count();

    for (const row of results) {
      try {
        const name = row.Name || row.name || row['Student Name'] || row['First Name'];
        const password = row.Password || row.password || 'Student@123';
        const phone = row.Phone || row.phone || row['Mobile No'] || row['Mobile'];
        
        let classId = row.ClassId || row.classId || null;
        const className = row.ClassName || row.className || row.Class || row.class || row['Class Name'];
        const section = row.Section || row.section || row['Section Name'];

        if (!classId && className) {
          const cls = await prisma.class.findFirst({
            where: { name: String(className), section: section ? String(section) : undefined }
          });
          if (cls) classId = cls.id;
        }

        const gender = row.Gender || row.gender || row['Gender'] || null;
        const address = row.Address || row.address || row['Address'] || null;
        const bloodGroup = row.BloodGroup || row.bloodGroup || row['Blood Group'] || null;
        const photoUrl = row.PhotoUrl || row.photourl || row.Photo || row.photo || null;
        const fatherName = row.FatherName || row.fatherName || row['Father Name'] || null;
        const motherName = row.MotherName || row.motherName || row['Mother Name'] || null;
        const aadharNo = row.AadharNo || row.aadharNo || row.Aadhar || row.aadhar || row['Aadhar No'] || row['Aadhar Number'] || null;
        const penNumber = row.PenNumber || row.penNumber || row.Pen || row.pen || row['PEN Number'] || null;

        const rollNo = row.StudentId || row.studentId || row.RollNo || row.rollNo || row['Roll No'] || row['Student ID'] || generateRollNo(currentStudentCount + 1);
        const email = row.Email || row.email || rollNo;

        if (!name) {
          failed.push({ row, reason: 'Name is required' });
          continue;
        }

        const existing = await prisma.user.findUnique({ where: { email: String(email) } });
        if (existing) {
          failed.push({ row, reason: 'Email/RollNo already exists' });
          continue;
        }

        // Use 10 rounds instead of 12 for much faster hashing on free tier servers
        const hashedPassword = await bcrypt.hash(String(password), 10);

        const user = await prisma.user.create({
          data: {
            name,
            email: String(email),
            password: hashedPassword,
            role: 'STUDENT',
            phone: phone ? String(phone) : null,
            photoUrl: photoUrl ? String(photoUrl) : null,
          },
        });

        await prisma.student.create({
          data: {
            userId: user.id,
            rollNo,
            classId: classId ? String(classId) : null,
            gender: gender ? String(gender) : null,
            address: address ? String(address) : null,
            bloodGroup: bloodGroup ? String(bloodGroup) : null,
            fatherName: fatherName ? String(fatherName) : null,
            motherName: motherName ? String(motherName) : null,
            aadharNo: aadharNo ? String(aadharNo) : null,
            penNumber: penNumber ? String(penNumber) : null,
          },
        });
        
        currentStudentCount++;
        success++;
      } catch (e: any) {
        failed.push({ row, reason: e.message });
      }
    }

    // Clean up uploaded file
    try {
      require('fs').unlinkSync(filePath);
    } catch (e) {
      console.error('File cleanup failed:', e);
    }

    successResponse(res, { success, failed, total: results.length }, 'Bulk import complete');
  } catch (error) {
    next(error);
  }
};

export const exportCsv = async (_req: AuthRequest, res: Response): Promise<void> => {
  const students = await prisma.student.findMany({
    include: {
      user: { select: { name: true, email: true, phone: true } },
      class: { select: { name: true, section: true } },
    },
    orderBy: { rollNo: 'asc' },
  });

  const rows = students.map((s) => ({
    'Roll No': s.rollNo,
    'Name': s.user.name,
    'Phone': s.user.phone || '',
    'Class': s.class ? s.class.name : '',
    'Section': s.class ? s.class.section : '',
    'Father Name': s.fatherName || '',
    'Mother Name': s.motherName || '',
    'Aadhar No': s.aadharNo || '',
    'PEN Number': s.penNumber || '',
    'Gender': s.gender || '',
    'Blood Group': s.bloodGroup || '',
    'Address': s.address || '',
    'Admission Date': s.admissionDate.toISOString().split('T')[0],
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};

export const getMyProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const student = await prisma.student.findFirst({
    where: { userId: req.user!.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } },
      class: true,
      parent: { include: { user: { select: { name: true, phone: true, email: true } } } },
    },
  });
  if (!student) return next(createError('Student profile not found', 404));
  const { medicalInfo, ...studentWithoutMedical } = student;
  successResponse(res, studentWithoutMedical, 'Profile fetched');
};

export const bulkUploadPhotos = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('ZIP file required', 400));
  
  try {
    const zipPath = req.file.path;
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    
    let success = 0;
    const failed: any[] = [];
    
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    for (const zipEntry of zipEntries) {
      if (zipEntry.isDirectory) continue;
      
      const fileName = zipEntry.entryName.split('/').pop() || zipEntry.entryName;
      if (fileName.startsWith('.') || fileName.startsWith('__MACOSX')) continue; 
      
      const ext = path.extname(fileName).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        failed.push({ file: fileName, reason: 'Invalid image format' });
        continue;
      }
      
      // Extract Roll No assuming format like JY26-0001.jpg
      const rollNo = path.basename(fileName, ext);
      
      const student = await prisma.student.findUnique({
        where: { rollNo },
        include: { user: true }
      });
      
      if (!student) {
        failed.push({ file: fileName, reason: `Student ID ${rollNo} not found` });
        continue;
      }
      
      const finalName = `photo-${rollNo}-${Date.now()}${ext}`;
      const savePath = path.join(uploadDir, finalName);
      
      fs.writeFileSync(savePath, zipEntry.getData());
      
      await prisma.user.update({
        where: { id: student.userId },
        data: { photoUrl: `/uploads/${finalName}` }
      });
      
      success++;
    }
    
    fs.unlinkSync(zipPath);
    
    successResponse(res, { success, failed }, `Bulk photo upload complete. ${success} uploaded.`);
  } catch (error) {
    next(error);
  }
};
