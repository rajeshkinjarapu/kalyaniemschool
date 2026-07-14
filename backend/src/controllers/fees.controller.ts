import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { successResponse, paginatedResponse } from '../utils/response';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { clearDashboardCache } from './dashboard.controller';

export const bulkImportFees = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) return next(createError('No file uploaded', 400));
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const results = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);

    let successCount = 0;
    let errorCount = 0;

    for (const row of results) {
      const studentId = row['Student ID'] || row.studentId;
      const term = row.Term || row.term || 'Term 1';
      const name = row.Name || row['Fee Name'] || row.name || 'General Fee';
      const amount = parseFloat(row.Amount || row.amount);
      const dueDate = row['Due Date'] || row.dueDate ? new Date(row['Due Date'] || row.dueDate) : new Date();

      if (!amount || isNaN(amount)) {
        errorCount++;
        continue;
      }

      if (studentId) {
        // Assign fee to a specific student
        const student = await prisma.student.findUnique({ where: { rollNo: studentId.toString() } });
        if (student) {
          await prisma.feeStructure.create({
            data: { studentId: student.id, term, name, amount, dueDate, classId: null },
          });
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        errorCount++; // We are skipping class-level bulk import for now to keep it simple, expecting Student ID
      }
    }

    successResponse(res, { success: successCount, failed: errorCount }, 'Bulk import completed');
  } catch (error) {
    next(createError('Error processing excel file', 500));
  }
};

export const getStructures = async (req: AuthRequest, res: Response): Promise<void> => {
  const classId = (req.query.classId as string) || '';
  const term = (req.query.term as string) || '';
  const where: any = {};
  if (classId) where.classId = classId;
  if (term) where.term = term;

  const structures = await prisma.feeStructure.findMany({
    where,
    include: { class: { select: { name: true, section: true } }, _count: { select: { payments: true } } },
    orderBy: { dueDate: 'asc' },
  });
  successResponse(res, structures, 'Fee structures fetched');
};

export const createStructure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { classId, term, name, amount, dueDate } = req.body;
  const cls = await prisma.class.findUnique({ where: { id: classId } });
  if (!cls) return next(createError('Class not found', 404));

  const structure = await prisma.feeStructure.create({
    data: { classId, term, name, amount, dueDate: new Date(dueDate) },
  });
  successResponse(res, structure, 'Fee structure created', 201);
};

export const updateStructure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const { term, name, amount, dueDate } = req.body;
  const existing = await prisma.feeStructure.findUnique({ where: { id } });
  if (!existing) return next(createError('Fee structure not found', 404));

  const structure = await prisma.feeStructure.update({
    where: { id },
    data: { term, name, amount, dueDate: dueDate ? new Date(dueDate) : undefined },
  });
  successResponse(res, structure, 'Fee structure updated');
};

export const deleteStructure = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const existing = await prisma.feeStructure.findUnique({ where: { id } });
  if (!existing) return next(createError('Fee structure not found', 404));
  await prisma.feeStructure.delete({ where: { id } });
  successResponse(res, null, 'Fee structure deleted');
};

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const studentId = (req.query.studentId as string) || '';
  const status = (req.query.status as string) || '';
  const classId = (req.query.classId as string) || '';
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (studentId) where.studentId = studentId;
  if (status) where.status = status;
  if (classId) where.feeStructure = { classId };
  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate);
    if (endDate) where.paymentDate.lte = new Date(endDate);
  }

  const [payments, total] = await Promise.all([
    prisma.feePayment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { name: true } } } },
        feeStructure: { select: { name: true, term: true, amount: true } },
      },
    }),
    prisma.feePayment.count({ where }),
  ]);

  paginatedResponse(res, payments, total, page, limit, 'Payments fetched');
};

export const createPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { studentId, feeStructureId, amountPaid, method, remarks, utrNumber, receiptUrl, payments } = req.body;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return next(createError('Student not found', 404));

  const baseReceiptNo = 'JY' + Math.floor(10000000 + Math.random() * 90000000).toString();

  const paymentList = payments && Array.isArray(payments) && payments.length > 0 
    ? payments 
    : [{ feeStructureId, amountPaid }];

  if (paymentList.length === 0 || !paymentList[0].feeStructureId) {
    return next(createError('No fee structures selected', 400));
  }

  const createdPayments = await prisma.$transaction(async (tx) => {
    const results = [];
    let idx = 1;
    for (const p of paymentList) {
      const structure = await tx.feeStructure.findUnique({ where: { id: p.feeStructureId } });
      if (!structure) continue;
      
      const previousPayments = await tx.feePayment.aggregate({
        where: { studentId, feeStructureId: p.feeStructureId },
        _sum: { amountPaid: true },
      });
      const totalPaid = (previousPayments._sum.amountPaid || 0) + Number(p.amountPaid);
      const status = totalPaid >= structure.amount ? 'PAID' : 'PARTIAL';
      
      const payment = await tx.feePayment.create({
        data: { 
          studentId, 
          feeStructureId: p.feeStructureId, 
          amountPaid: Number(p.amountPaid), 
          method: method || 'CASH', 
          status: status as any, 
          remarks,
          utrNumber: utrNumber || null,
          receiptUrl: receiptUrl || null,
          receiptNo: paymentList.length > 1 ? `${baseReceiptNo}-${idx}` : baseReceiptNo
        },
        include: {
          student: { include: { user: { select: { name: true } } } },
          feeStructure: { select: { name: true, term: true } },
        },
      });
      results.push(payment);
      idx++;
    }
    return results;
  });

  clearDashboardCache();
  successResponse(res, createdPayments.length === 1 ? createdPayments[0] : createdPayments, 'Payment(s) recorded', 201);
};

export const deleteFeePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const id = req.params.id as string;
  const payment = await prisma.feePayment.findUnique({ where: { id } });
  if (!payment) return next(createError('Fee payment not found', 404));

  await prisma.feePayment.delete({ where: { id } });
  clearDashboardCache();
  successResponse(res, null, 'Fee payment deleted successfully');
};

export const updateFeePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { amountPaid, method, remarks } = req.body;
    
    const payment = await prisma.feePayment.findUnique({ where: { id } });
    if (!payment) return next(createError('Fee payment not found', 404));

    const updatedPayment = await prisma.feePayment.update({
      where: { id },
      data: {
        amountPaid: amountPaid ? Number(amountPaid) : payment.amountPaid,
        method: method || payment.method,
        remarks: remarks !== undefined ? remarks : payment.remarks
      }
    });

    clearDashboardCache();
    successResponse(res, updatedPayment, 'Fee payment updated successfully');
  } catch (error) {
    next(error);
  }
};

export const getStudentFeeStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const studentId = req.params.studentId as string;
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return next(createError('Student not found', 404));

  const structures = await prisma.feeStructure.findMany({
    where: { 
      OR: [
        { classId: student.classId || '' },
        { studentId: student.id }
      ]
    },
    orderBy: { dueDate: 'asc' },
  });

  const result = await Promise.all(
    structures.map(async (structure) => {
      const payments = await prisma.feePayment.findMany({
        where: { studentId, feeStructureId: structure.id },
        orderBy: { paymentDate: 'desc' },
      });
      
      const discountRecord = await prisma.feeDiscount.findUnique({
        where: { studentId_feeStructureId: { studentId, feeStructureId: structure.id } }
      });
      const discount = discountRecord ? discountRecord.amount : 0;
      
      const amountPaid = payments.reduce((s, p) => s + p.amountPaid, 0);
      const effectiveAmount = structure.amount - discount;
      const amountDue = effectiveAmount - amountPaid;
      const latestPayment = payments[0];
      let status = 'PENDING';
      if (amountPaid >= effectiveAmount) status = 'PAID';
      else if (amountPaid > 0) status = 'PARTIAL';
      else if (structure.dueDate < new Date()) status = 'OVERDUE';

      return {
        feeStructure: structure,
        originalAmount: structure.amount,
        discount,
        effectiveAmount,
        amountDue: Math.max(0, amountDue),
        amountPaid,
        status,
        paymentDate: latestPayment?.paymentDate || null,
      };
    })
  );

  successResponse(res, result, 'Fee status fetched');
};

export const applyFeeDiscount = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, feeStructureId, discountAmount, remarks } = req.body;
    
    if (discountAmount === undefined || discountAmount === null) {
      return next(createError('Discount amount is required', 400));
    }

    const discount = await prisma.feeDiscount.upsert({
      where: {
        studentId_feeStructureId: { studentId, feeStructureId }
      },
      update: {
        amount: Number(discountAmount),
        remarks
      },
      create: {
        studentId,
        feeStructureId,
        amount: Number(discountAmount),
        remarks
      }
    });

    clearDashboardCache();
    successResponse(res, discount, 'Fee discount applied successfully');
  } catch (error) {
    next(error);
  }
};

export const getOverdue = async (_req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const structures = await prisma.feeStructure.findMany({
    where: { dueDate: { lt: now } },
    include: { class: { select: { name: true, section: true } } },
  });

  const result = [];
  for (const structure of structures) {
    let students = [];
    if (structure.studentId) {
      const student = await prisma.student.findUnique({ where: { id: structure.studentId } });
      if (student) students.push(student);
    } else if (structure.classId) {
      students = await prisma.student.findMany({ where: { classId: structure.classId } });
    }

    for (const student of students) {
      const payments = await prisma.feePayment.aggregate({
        where: { studentId: student.id, feeStructureId: structure.id },
        _sum: { amountPaid: true },
      });
      const paid = payments._sum.amountPaid || 0;
      if (paid < structure.amount) {
        const user = await prisma.user.findUnique({ where: { id: student.userId }, select: { name: true, email: true } });
        result.push({
          student: { id: student.id, rollNo: student.rollNo, name: user?.name, email: user?.email },
          feeStructure: structure,
          amountPaid: paid,
          amountDue: structure.amount - paid,
          status: paid > 0 ? 'PARTIAL' : 'OVERDUE',
        });
      }
    }
  }
  successResponse(res, result, 'Overdue fees fetched');
};

export const downloadInvoice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const paymentId = req.params.paymentId as string;
  const payment = await prisma.feePayment.findUnique({
    where: { id: paymentId },
    include: {
      student: { include: { user: { select: { name: true, email: true } }, class: true } },
      feeStructure: true,
    },
  }) as any;
  if (!payment) return next(createError('Payment not found', 404));

  const settings = await prisma.schoolSettings.findFirst();
  const schoolName = settings?.schoolName || 'JY School';
  const schoolAddress = settings?.address || '123 Education Street, Knowledge City';
  const schoolPhone = settings?.phone || '+91-9876543210';
  const schoolEmail = settings?.email || 'info@school.com';
  const schoolWebsite = settings?.website || 'https://school.com';

  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${payment.receiptNo}.pdf`);
  doc.pipe(res);

  // Background accent block at the very top header
  doc.rect(50, 45, 500, 85).fill('#1e1b4b');

  // School Header overlay
  doc.fillColor('#ffffff');
  doc.fontSize(20).font('Helvetica-Bold').text(schoolName.toUpperCase(), 70, 65);
  doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text(schoolWebsite, 70, 90);
  
  doc.fillColor('#ffffff');
  doc.fontSize(14).font('Helvetica-Bold').text('PAYMENT RECEIPT', 380, 65, { align: 'right', width: 150 });
  doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text(`Receipt No: ${payment.receiptNo}`, 380, 90, { align: 'right', width: 150 });

  // Reset text color for billing details
  doc.fillColor('#1e293b');
  
  // Left Column - Issued To Info
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text('ISSUED TO:', 50, 155);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text(payment.student.user.name, 50, 170);
  doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`Student ID: ${payment.student.rollNo}`, 50, 185);
  doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`Class: ${payment.student.class ? `${payment.student.class.name}-${payment.student.class.section}` : 'N/A'}`, 50, 200);

  // Right Column - Payment metadata
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b').text('TRANSACTION DETAILS:', 350, 155);
  doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`Payment Date: ${payment.paymentDate.toLocaleDateString()}`, 350, 170);
  doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`Payment Method: ${payment.method.toUpperCase()}`, 350, 185);
  doc.fontSize(9).font('Helvetica').fillColor('#334155').text(`Status: ${payment.status}`, 350, 200);

  // Table Headers
  const tableY = 240;
  doc.rect(50, tableY, 500, 24).fill('#f1f5f9');
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#475569');
  doc.text('FEE DESCRIPTION', 65, tableY + 8);
  doc.text('AMOUNT DUE', 370, tableY + 8, { align: 'right', width: 80 });
  doc.text('AMOUNT PAID', 460, tableY + 8, { align: 'right', width: 80 });

  // Table Row Content
  const rowY = tableY + 32;
  doc.fontSize(10).font('Helvetica').fillColor('#1e293b');
  doc.text(payment.feeStructure.name, 65, rowY);
  doc.text(`Rs. ${payment.feeStructure.amount.toLocaleString()}`, 370, rowY, { align: 'right', width: 80 });
  doc.font('Helvetica-Bold').text(`Rs. ${payment.amountPaid.toLocaleString()}`, 460, rowY, { align: 'right', width: 80 });

  // Divider Line
  doc.moveTo(50, rowY + 20).lineTo(550, rowY + 20).stroke('#e2e8f0');

  // Bottom Summary Cards / Notes
  const cardY = rowY + 40;
  
  // Muted Note box
  doc.rect(50, cardY, 260, 75).fill('#f8fafc');
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text(payment.method === 'UPI' ? 'UPI TRANSACTION DETAILS' : 'PAYMENT NOTE / REMARKS', 60, cardY + 10);
  
  if (payment.method === 'UPI' && payment.utrNumber) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e293b').text(`UTR Number: ${payment.utrNumber}`, 60, cardY + 25);
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(payment.remarks || 'No additional transaction remarks recorded.', 60, cardY + 38, { width: 240, lineGap: 3 });
  } else {
    doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(payment.remarks || 'No additional transaction remarks recorded.', 60, cardY + 25, { width: 240, lineGap: 3 });
  }

  // Green Success Total box
  doc.rect(330, cardY, 220, 75).fill('#ecfdf5');
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#047857').text('PAYMENT STATUS', 345, cardY + 12);
  doc.fontSize(16).font('Helvetica-Bold').fillColor('#065f46').text('SUCCESS / PAID', 345, cardY + 26);
  doc.fontSize(9).font('Helvetica-Bold').fillColor('#047857').text(`Total Paid: Rs. ${payment.amountPaid.toLocaleString()}`, 345, cardY + 52);

  // Footer section
  doc.moveTo(50, 710).lineTo(550, 710).stroke('#f1f5f9');
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('This is a secure, computer-generated transaction document. No physical signature is required.', 50, 725, { align: 'center', width: 500 });
  doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(`${schoolAddress} | Telephone: ${schoolPhone} | Email: ${schoolEmail}`, 50, 740, { align: 'center', width: 500 });

  doc.end();
};
