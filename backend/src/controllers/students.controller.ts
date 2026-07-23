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
import { clearDashboardCache } from './dashboard.controller';

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
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { rollNo: { contains: search, mode: 'insensitive' } },
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
      marks: { include: { exam: true, subject: true }, orderBy: { createdAt: 'desc' } },
      feePayments: { include: { feeStructure: true }, orderBy: { createdAt: 'desc' } },
      feeDiscounts: true,
    },
  });
  if (!student) return next(createError('Student not found', 404));
  successResponse(res, student, 'Student fetched');
};

export const create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, password, phone, photoUrl, classId, dob, gender, address, bloodGroup, studentId, fatherName, motherName, aadharNo, penNumber } = req.body;

  const count = await prisma.student.count();
  const rollNo = studentId?.trim() || generateRollNo(count + 1);

  const existing = await prisma.student.findUnique({ where: { rollNo } });
  if (existing) return next(createError('Student ID already exists', 409));

  // The login ID is exactly the Student ID
  const email = rollNo;

  const defaultPassword = phone || rollNo;
  const hashedPassword = await bcrypt.hash(password || defaultPassword, 10);

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

  clearDashboardCache();
  successResponse(res, student, 'Student created', 201);
};

export const update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { name, phone, photoUrl, classId, dob, gender, address, bloodGroup, studentId, fatherName, motherName, aadharNo, penNumber } = req.body;

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

export const changeClass = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { classId } = req.body;

  if (!classId) {
    return next(createError('classId is required', 400));
  }

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) return next(createError('Student not found', 404));

  const updated = await prisma.student.update({
    where: { id },
    data: { classId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, photoUrl: true } },
      class: true,
    },
  });

  successResponse(res, updated, 'Student section/class updated');
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
      prisma.student.deleteMany({ where: { id } }),
      prisma.user.deleteMany({ where: { id: student.userId } }),
    ]);
    clearDashboardCache();
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
    const rawResults = XLSX.utils.sheet_to_json<any>(sheet);
    
    // Normalize keys to support case-insensitive headers like "STUDENT NAME"
    const results = rawResults.map(r => {
      const normalizedRow: any = {};
      for (const key in r) {
        // Keep original key, but also add a lowercase version with spaces removed for easier access
        normalizedRow[key] = r[key];
        const simpleKey = key.toLowerCase().replace(/\s+/g, '');
        normalizedRow[simpleKey] = r[key];
      }
      return normalizedRow;
    }).filter(r => r.name || r.studentname || r.firstname);

    if (results.length > 5000) {
      return next(createError('Please upload maximum 5000 students at a time', 400));
    }

    let success = 0;
    const failed: any[] = [];
    
    // Fetch initial count once to save DB roundtrips
    let currentStudentCount = await prisma.student.count();

    for (const row of results) {
      try {
        const name = row.name || row.studentname || row.firstname;
        const phone = row.phone || row.mobileno || row.mobile;
        
        let classId = row.classid || null;
        const className = row.classname || row.class || null;
        const section = row.section || row.sectionname;

        if (!classId && className) {
          const clsName = String(className).trim();
          const clsSec = section ? String(section).trim() : 'A';
          let cls = await prisma.class.findFirst({
            where: { 
              name: clsName, 
              section: clsSec 
            }
          });
          
          if (!cls) {
            cls = await prisma.class.create({
              data: {
                name: clsName,
                section: clsSec,
                academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
                capacity: 40
              }
            });
          }
          classId = cls.id;
        }

        const gender = row.gender || null;
        const address = row.address || null;
        const bloodGroup = row.bloodgroup || null;
        const photoUrl = row.photourl || row.photo || null;
        const fatherName = row.fathername || null;
        const motherName = row.mothername || null;
        const aadharNo = row.aadharno || row.aadhar || row.aadharnumber || null;
        const penNumber = row.pennumber || row.pen || null;

        const rollNo = row.studentid || row.rollno || generateRollNo(currentStudentCount + 1);
        const email = rollNo; // UserID is always Student ID
        
        // Password is explicitly provided, or defaults to Phone number, or RollNo if no phone
        const password = row.password || phone || rollNo;

        if (!name) {
          failed.push({ row, reason: 'Name is required' });
          continue;
        }

        const existing = await prisma.user.findUnique({ where: { email: String(email) } });
        if (existing) {
          failed.push({ row, reason: 'Email/RollNo already exists' });
          continue;
        }

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

        const newStudent = await prisma.student.create({
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
        
        // Fee details creation
        const admissionFee = row['Admission fee'] || row['Admission Fee'] || null;
        const tuitionFee = row['Tution fee'] || row['Tution Fee'] || row['Tuition fee'] || row['Tuition Fee'] || null;
        const booksFee = row['Books fee'] || row['Books Fee'] || null;
        
        const feeStructuresToCreate = [];
        const dueDate = new Date(); // Default due date to today
        
        if (admissionFee && !isNaN(parseFloat(admissionFee))) {
          feeStructuresToCreate.push({
            studentId: newStudent.id,
            term: 'Term 1',
            name: 'Admission Fee',
            amount: parseFloat(admissionFee),
            dueDate
          });
        }
        
        if (tuitionFee && !isNaN(parseFloat(tuitionFee))) {
          feeStructuresToCreate.push({
            studentId: newStudent.id,
            term: 'Term 1',
            name: 'Tuition Fee',
            amount: parseFloat(tuitionFee),
            dueDate
          });
        }
        
        if (booksFee && !isNaN(parseFloat(booksFee))) {
          feeStructuresToCreate.push({
            studentId: newStudent.id,
            term: 'Term 1',
            name: 'Books Fee',
            amount: parseFloat(booksFee),
            dueDate
          });
        }
        
        if (feeStructuresToCreate.length > 0) {
          await prisma.feeStructure.createMany({
            data: feeStructuresToCreate
          });
        }
        
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

    clearDashboardCache();
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
      
      // Extract Roll No using regex (e.g. JY26-0047) to allow names like "JY26-0047 Charan.jpg"
      const rollMatch = fileName.match(/(JY\d{2}-\d+)/i);
      const rollNo = rollMatch ? rollMatch[1].toUpperCase() : path.basename(fileName, ext).trim();
      
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

export const getTemplate = async (_req: AuthRequest, res: Response): Promise<void> => {
  const headers = ['Student ID', 'Student Name', 'Mobile No', 'Class Name', 'Section Name', 'Gender', 'Blood Group', 'Father Name', 'Mother Name', 'Aadhar No', 'PEN Number', 'Address', 'Admission fee', 'Tution fee', 'Books fee'];
  const sampleRow = ['JY26-0004', 'John Doe', '9876543210', 'Grade 10', 'A', 'MALE', 'O+', 'Richard Doe', 'Jane Doe', '123456789012', 'PEN123', '123 Main St', '5000', '25000', '2000'];
  
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
  XLSX.utils.book_append_sheet(wb, ws, 'Template');
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', 'attachment; filename=Student_Import_Template.xlsx');
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buffer);
};
