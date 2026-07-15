import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import * as XLSX from 'xlsx';
import { AttendanceStatus } from '../types/enums';
import PDFDocument from 'pdfkit';

export const getAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: {
        user: { select: { name: true } },
        class: true,
        attendance: {
          where: { date: { gte: start, lte: end } }
        }
      }
    });

    const reportData = students.map(s => {
      const total = s.attendance.length;
      const present = s.attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
      const absent = s.attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
      const late = s.attendance.filter(a => a.status === AttendanceStatus.LATE).length;
      const excused = s.attendance.filter(a => a.status === AttendanceStatus.EXCUSED).length;
      const presentRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      return {
        'Roll No': s.rollNo,
        'Student Name': s.user.name,
        'Class': s.class ? s.class.name : 'N/A',
        'Section': s.class ? s.class.section : 'N/A',
        'Total Records': total,
        'Present': present,
        'Absent': absent,
        'Late': late,
        'Excused': excused,
        'Attendance %': `${presentRate}%`
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Attendance_Report.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getMarksReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, examId } = req.query;
    if (!classId || !examId) {
      res.status(400).json({ success: false, message: 'classId and examId are required' });
      return;
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId as string },
      include: { class: true }
    });

    if (!exam) {
      res.status(404).json({ success: false, message: 'Exam not found' });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { classId: classId as string }
    });

    const marks = await prisma.mark.findMany({
      where: { examId: examId as string },
      include: {
        student: {
          include: { user: { select: { name: true } } }
        },
        subject: true
      }
    });

    const studentMap: { [studentId: string]: any } = {};

    marks.forEach(m => {
      if (!studentMap[m.studentId]) {
        studentMap[m.studentId] = {
          'Roll No': m.student.rollNo,
          'Student Name': m.student.user.name,
          totalObtained: 0,
          totalMax: 0,
        };
        subjects.forEach(sub => {
          studentMap[m.studentId][sub.name] = 'N/A';
        });
      }
      studentMap[m.studentId][m.subject.name] = m.marksObtained;
      studentMap[m.studentId].totalObtained += m.marksObtained;
      studentMap[m.studentId].totalMax += m.maxMarks;
    });

    const reportData = Object.values(studentMap).map(s => {
      const percentage = s.totalMax > 0 ? Math.round((s.totalObtained / s.totalMax) * 100) : 0;
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C+';
      else if (percentage >= 40) grade = 'C';
      else if (percentage >= 33) grade = 'D';

      const { totalObtained, totalMax, ...cleanStudent } = s;
      return {
        ...cleanStudent,
        'Total Marks': totalObtained,
        'Max Marks': totalMax,
        'Percentage': `${percentage}%`,
        'Grade': grade
      };
    });

    // Sort by Total Marks desc to calculate rank
    reportData.sort((a, b) => b['Total Marks'] - a['Total Marks']);
    reportData.forEach((s, idx) => {
      s['Rank'] = idx + 1;
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Marks Report');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Marks_Report_${exam.name.replace(/\s+/g, '_')}.xlsx`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getFeeReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const payments = await prisma.feePayment.findMany({
      where: {
        paymentDate: { gte: start, lte: end }
      },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            class: true
          }
        },
        feeStructure: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    const reportData = payments.map(p => ({
      'Receipt No': p.receiptNo,
      'Student Name': p.student.user.name,
      'Roll No': p.student.rollNo,
      'Class': p.student.class ? p.student.class.name : 'N/A',
      'Section': p.student.class ? p.student.class.section : 'N/A',
      'Fee Component': p.feeStructure.name,
      'Fee Amount': p.feeStructure.amount,
      'Amount Paid': p.amountPaid,
      'Payment Status': p.status,
      'Payment Method': p.method,
      'Payment Date': p.paymentDate.toISOString().split('T')[0]
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Fee Report');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Fee_Report.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getStudentsReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.query;

    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: {
        user: { select: { name: true, email: true, phone: true } },
        class: true,
      }
    });

    const reportData = students.map(s => ({
      'Roll No': s.rollNo,
      'Student Name': s.user.name,
      'Phone': s.user.phone || 'N/A',
      'Class': s.class ? s.class.name : 'N/A',
      'Section': s.class ? s.class.section : 'N/A',
      'Father Name': s.fatherName || 'N/A',
      'Mother Name': s.motherName || 'N/A',
      'Aadhar No': s.aadharNo || 'N/A',
      'PEN Number': s.penNumber || 'N/A',
      'DOB': s.dob ? s.dob.toISOString().split('T')[0] : 'N/A',
      'Gender': s.gender || 'N/A',
      'Admission Date': s.admissionDate.toISOString().split('T')[0],
      'Guardian Name': s.fatherName || 'N/A',
      'Guardian Phone': s.user.phone || 'N/A',
      'Address': s.address || 'N/A',
      'Medical Info': s.medicalInfo || 'None'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(reportData);
    XLSX.utils.book_append_sheet(wb, ws, 'Student Directory');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Student_Report.xlsx');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const getAttendanceReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const targetClass = classId ? await prisma.class.findUnique({ where: { id: classId as string } }) : null;
    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: {
        user: { select: { name: true } },
        class: true,
        attendance: { where: { date: { gte: start, lte: end } } }
      }
    });

    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '123 Education Street, Knowledge City';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Attendance_Report.pdf');
    doc.pipe(res);

    // Banner
    doc.rect(40, 30, 515, 60).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text('OFFICIAL ACADEMIC SYSTEM REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('ATTENDANCE LEDGER', 320, 48, { align: 'right', width: 220 });

    // Sub-info
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Class: ${targetClass ? `${targetClass.name}-${targetClass.section}` : 'All Classes'}`, 40, 110);
    doc.font('Helvetica').text(`Range: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}  |  Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    // Table Headers
    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
    doc.text('STUDENT ID', 50, tableY + 6, { width: 90 });
    doc.text('STUDENT NAME', 145, tableY + 6, { width: 165 });
    doc.text('CLASS', 315, tableY + 6, { width: 75 });
    doc.text('PRESENT', 395, tableY + 6, { width: 50, align: 'right' });
    doc.text('ABSENT', 450, tableY + 6, { width: 50, align: 'right' });
    doc.text('RATE %', 505, tableY + 6, { width: 45, align: 'right' });

    let currentY = tableY + 20;
    doc.fontSize(9).font('Helvetica').fillColor('#1e293b');

    students.forEach((s) => {
      const total = s.attendance.length;
      const present = s.attendance.filter(a => a.status === AttendanceStatus.PRESENT).length;
      const absent = s.attendance.filter(a => a.status === AttendanceStatus.ABSENT).length;
      const late = s.attendance.filter(a => a.status === AttendanceStatus.LATE).length;
      const presentRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
        // Reprint header on new page
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('STUDENT ID', 50, currentY + 6);
        doc.text('STUDENT NAME', 145, currentY + 6);
        doc.text('CLASS', 315, currentY + 6);
        doc.text('PRESENT', 395, currentY + 6, { align: 'right', width: 50 });
        doc.text('ABSENT', 450, currentY + 6, { align: 'right', width: 50 });
        doc.text('RATE %', 505, currentY + 6, { align: 'right', width: 45 });
        currentY += 20;
      }

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(s.rollNo, 50, currentY + 5, { width: 90 });
      doc.font('Helvetica-Bold').text(s.user.name, 145, currentY + 5, { width: 165 });
      doc.font('Helvetica').text(s.class ? `${s.class.name}-${s.class.section}` : 'N/A', 315, currentY + 5, { width: 75 });
      doc.text(present.toString(), 395, currentY + 5, { width: 50, align: 'right' });
      doc.text(absent.toString(), 450, currentY + 5, { width: 50, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(presentRate < 75 ? '#b91c1c' : '#047857').text(`${presentRate}%`, 505, currentY + 5, { width: 45, align: 'right' });

      doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke('#f1f5f9');
      currentY += 18;
    });

    // Footer
    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(`${schoolAddress}`, 40, 800, { align: 'center', width: 515 });

    doc.end();
  } catch (error) {
    next(error);
  }
};

export const getMarksReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId, examId } = req.query;
    if (!classId || !examId) {
      res.status(400).json({ success: false, message: 'classId and examId are required' });
      return;
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId as string },
      include: { class: true }
    });
    if (!exam) {
      res.status(404).json({ success: false, message: 'Exam not found' });
      return;
    }

    const subjects = await prisma.subject.findMany({ where: { classId: classId as string } });
    const marks = await prisma.mark.findMany({
      where: { examId: examId as string },
      include: {
        student: { include: { user: { select: { name: true } } } },
        subject: true
      }
    });

    const studentMap: { [studentId: string]: any } = {};
    marks.forEach(m => {
      if (!studentMap[m.studentId]) {
        studentMap[m.studentId] = {
          rollNo: m.student.rollNo,
          name: m.student.user.name,
          totalObtained: 0,
          totalMax: 0,
        };
      }
      studentMap[m.studentId].totalObtained += m.marksObtained;
      studentMap[m.studentId].totalMax += m.maxMarks;
    });

    const reportData = Object.values(studentMap).map(s => {
      const percentage = s.totalMax > 0 ? Math.round((s.totalObtained / s.totalMax) * 100) : 0;
      let grade = 'F';
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C+';
      else if (percentage >= 40) grade = 'C';
      else if (percentage >= 33) grade = 'D';

      return {
        ...s,
        percentage,
        grade
      };
    });

    reportData.sort((a, b) => b.totalObtained - a.totalObtained);
    reportData.forEach((s, idx) => {
      s.rank = idx + 1;
    });

    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '123 Education Street, Knowledge City';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Marks_Report_${exam.name.replace(/\s+/g, '_')}.pdf`);
    doc.pipe(res);

    // Banner
    doc.rect(40, 30, 515, 60).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text('OFFICIAL ACADEMIC SYSTEM REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('GRADES REGISTRY', 320, 48, { align: 'right', width: 220 });

    // Sub-info
    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Exam: ${exam.name}  |  Class: ${exam.class ? `${exam.class.name}-${exam.class.section}` : 'N/A'}`, 40, 110);
    doc.font('Helvetica').text(`Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    // Table Headers
    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
    doc.text('RANK', 50, tableY + 6, { width: 40 });
    doc.text('STUDENT NAME', 95, tableY + 6, { width: 165 });
    doc.text('STUDENT ID', 270, tableY + 6, { width: 90 });
    doc.text('OBTAINED', 370, tableY + 6, { width: 55, align: 'right' });
    doc.text('MAX TOTAL', 435, tableY + 6, { width: 55, align: 'right' });
    doc.text('PER %', 500, tableY + 6, { width: 35, align: 'right' });
    doc.text('GRD', 540, tableY + 6, { width: 15, align: 'right' });

    let currentY = tableY + 20;

    reportData.forEach((s) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('RANK', 50, currentY + 6);
        doc.text('STUDENT NAME', 95, currentY + 6);
        doc.text('STUDENT ID', 270, currentY + 6);
        doc.text('OBTAINED', 370, currentY + 6, { align: 'right', width: 55 });
        doc.text('MAX TOTAL', 435, currentY + 6, { align: 'right', width: 55 });
        doc.text('PER %', 500, currentY + 6, { align: 'right', width: 35 });
        doc.text('GRD', 540, currentY + 6, { align: 'right', width: 15 });
        currentY += 20;
      }

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(s.rank.toString(), 50, currentY + 5, { width: 40 });
      doc.font('Helvetica-Bold').text(s.name, 95, currentY + 5, { width: 165 });
      doc.font('Helvetica').text(s.rollNo, 270, currentY + 5, { width: 90 });
      doc.text(s.totalObtained.toString(), 370, currentY + 5, { width: 55, align: 'right' });
      doc.text(s.totalMax.toString(), 435, currentY + 5, { width: 55, align: 'right' });
      doc.text(`${s.percentage}%`, 500, currentY + 5, { width: 35, align: 'right' });
      doc.font('Helvetica-Bold').fillColor(s.grade === 'F' ? '#b91c1c' : '#1e1b4b').text(s.grade, 540, currentY + 5, { width: 15, align: 'right' });

      doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke('#f1f5f9');
      currentY += 18;
    });

    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(`${schoolAddress}`, 40, 800, { align: 'center', width: 515 });
    doc.end();
  } catch (error) {
    next(error);
  }
};

export const getFeeReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const payments = await prisma.feePayment.findMany({
      where: { paymentDate: { gte: start, lte: end } },
      include: {
        student: { include: { user: { select: { name: true } }, class: true } },
        feeStructure: true
      },
      orderBy: { paymentDate: 'desc' }
    });

    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '123 Education Street, Knowledge City';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Fee_Report.pdf');
    doc.pipe(res);

    // Banner
    doc.rect(40, 30, 515, 60).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text('OFFICIAL ACADEMIC SYSTEM REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('FEES REVENUE LEDGER', 320, 48, { align: 'right', width: 220 });

    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Transaction Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`, 40, 110);
    doc.font('Helvetica').text(`Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    // Table Headers
    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
    doc.text('RECEIPT NO', 50, tableY + 6, { width: 90 });
    doc.text('STUDENT NAME', 145, tableY + 6, { width: 110 });
    doc.text('CLASS', 260, tableY + 6, { width: 60 });
    doc.text('FEE COMPONENT', 325, tableY + 6, { width: 100 });
    doc.text('METHOD', 430, tableY + 6, { width: 50 });
    doc.text('AMOUNT', 485, tableY + 6, { width: 60, align: 'right' });

    let currentY = tableY + 20;

    payments.forEach((p) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('RECEIPT NO', 50, currentY + 6);
        doc.text('STUDENT NAME', 145, currentY + 6);
        doc.text('CLASS', 260, currentY + 6);
        doc.text('FEE COMPONENT', 325, currentY + 6);
        doc.text('METHOD', 430, currentY + 6);
        doc.text('AMOUNT', 485, currentY + 6, { align: 'right', width: 60 });
        currentY += 20;
      }

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(p.receiptNo.slice(0, 15) + '...', 50, currentY + 5, { width: 90 });
      doc.font('Helvetica-Bold').text(p.student.user.name, 145, currentY + 5, { width: 110 });
      doc.font('Helvetica').text(p.student.class ? `${p.student.class.name}-${p.student.class.section}` : 'N/A', 260, currentY + 5, { width: 60 });
      doc.text(p.feeStructure.name, 325, currentY + 5, { width: 100 });
      doc.text(p.method, 430, currentY + 5, { width: 50 });
      doc.font('Helvetica-Bold').text(`Rs. ${p.amountPaid.toLocaleString()}`, 485, currentY + 5, { width: 60, align: 'right' });

      doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke('#f1f5f9');
      currentY += 18;
    });

    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(`${schoolAddress}`, 40, 800, { align: 'center', width: 515 });
    doc.end();
  } catch (error) {
    next(error);
  }
};

export const getStudentsReportPdf = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { classId } = req.query;
    const targetClass = classId ? await prisma.class.findUnique({ where: { id: classId as string } }) : null;
    const students = await prisma.student.findMany({
      where: classId ? { classId: classId as string } : {},
      include: {
        user: { select: { name: true, phone: true } },
        class: true,
      }
    });

    const settings = await prisma.schoolSettings.findFirst();
    const schoolName = settings?.schoolName || 'JY School';
    const schoolAddress = settings?.address || '123 Education Street, Knowledge City';

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=Student_Report.pdf');
    doc.pipe(res);

    // Banner
    doc.rect(40, 30, 515, 60).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(16).font('Helvetica-Bold').text(schoolName.toUpperCase(), 55, 45);
    doc.fontSize(9).font('Helvetica').fillColor('#93c5fd').text('OFFICIAL ACADEMIC SYSTEM REPORT', 55, 68);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff').text('STUDENT ROSTER', 320, 48, { align: 'right', width: 220 });

    doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold').text(`Class filter: ${targetClass ? `${targetClass.name}-${targetClass.section}` : 'All Students'}`, 40, 110);
    doc.font('Helvetica').text(`Total Count: ${students.length}  |  Print Date: ${new Date().toLocaleDateString()}`, 40, 125);

    // Table Headers
    const tableY = 150;
    doc.rect(40, tableY, 515, 20).fill('#f1f5f9');
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
    doc.text('STUDENT ID', 50, tableY + 6, { width: 85 });
    doc.text('STUDENT NAME', 140, tableY + 6, { width: 120 });
    doc.text('CLASS', 265, tableY + 6, { width: 55 });
    doc.text('GUARDIAN NAME', 325, tableY + 6, { width: 115 });
    doc.text('GUARDIAN CONTACT', 445, tableY + 6, { width: 100 });

    let currentY = tableY + 20;

    students.forEach((s) => {
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
        doc.rect(40, currentY, 515, 20).fill('#f1f5f9');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569');
        doc.text('STUDENT ID', 50, currentY + 6);
        doc.text('STUDENT NAME', 140, currentY + 6);
        doc.text('CLASS', 265, currentY + 6);
        doc.text('GUARDIAN NAME', 325, currentY + 6);
        doc.text('GUARDIAN CONTACT', 445, currentY + 6);
        currentY += 20;
      }

      doc.fontSize(8).font('Helvetica').fillColor('#334155');
      doc.text(s.rollNo, 50, currentY + 5, { width: 85 });
      doc.font('Helvetica-Bold').text(s.user.name, 140, currentY + 5, { width: 120 });
      doc.font('Helvetica').text(s.class ? `${s.class.name}-${s.class.section}` : 'N/A', 265, currentY + 5, { width: 55 });
      doc.text(s.fatherName || 'N/A', 325, currentY + 5, { width: 115 });
      doc.text(s.user.phone || 'N/A', 445, currentY + 5, { width: 100 });

      doc.moveTo(40, currentY + 18).lineTo(555, currentY + 18).stroke('#f1f5f9');
      currentY += 18;
    });

    doc.fontSize(7).font('Helvetica').fillColor('#cbd5e1').text(`${schoolAddress}`, 40, 800, { align: 'center', width: 515 });
    doc.end();
  } catch (error) {
    next(error);
  }
};
