import { PrismaClient } from '@prisma/client';
import { Role, Gender, AttendanceStatus, PaymentMethod, PaymentStatus } from '../src/types/enums';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data in correct order
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.message.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.mark.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.feePayment.deleteMany(),
    prisma.feeStructure.deleteMany(),
    prisma.timetable.deleteMany(),
    prisma.exam.deleteMany(),
    prisma.classSubjectTeacher.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.student.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.class.deleteMany(),
    prisma.schoolSettings.deleteMany(),
    prisma.event.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('🗑️  Cleared existing data');

  // 1. School Settings
  await prisma.schoolSettings.create({
    data: {
      schoolName: 'JY School',
      address: '123 Education Street, Knowledge City, State 400001',
      phone: '+91-9876543210',
      email: 'info@rajacademy.com',
      website: 'https://rajacademy.com',
      currentYear: '2024-2025',
    },
  });
  console.log('✅ School settings created');

  // 2. Super Admin
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const adminUser = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@rajacademy.com',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      phone: '+91-9000000001',
      isActive: true,
    },
  });
  console.log('✅ Super Admin created:', adminUser.email);

  // 3. Teacher User + Teacher Record
  const teacherPassword = await bcrypt.hash('Teacher@123', 12);
  const teacherUser = await prisma.user.create({
    data: {
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@rajacademy.com',
      password: teacherPassword,
      role: Role.TEACHER,
      phone: '+91-9000000002',
      isActive: true,
    },
  });

  const teacher = await prisma.teacher.create({
    data: {
      userId: teacherUser.id,
      employeeId: 'EMP240001',
      qualification: 'M.Sc Mathematics',
      specialization: 'Mathematics & Physics',
      joiningDate: new Date('2020-06-01'),
    },
  });
  console.log('✅ Teacher created:', teacherUser.email);

  // 4. Second Teacher
  const teacher2Password = await bcrypt.hash('Teacher@123', 12);
  const teacher2User = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya.sharma@rajacademy.com',
      password: teacher2Password,
      role: Role.TEACHER,
      phone: '+91-9000000003',
      isActive: true,
    },
  });

  const teacher2 = await prisma.teacher.create({
    data: {
      userId: teacher2User.id,
      employeeId: 'EMP240002',
      qualification: 'M.A English Literature',
      specialization: 'English & History',
      joiningDate: new Date('2021-06-01'),
    },
  });
  console.log('✅ Teacher 2 created:', teacher2User.email);

  // 4b. Accountant User
  const accountantPassword = await bcrypt.hash('Accountant@123', 12);
  const accountantUser = await prisma.user.create({
    data: {
      name: 'Accountant Jane',
      email: 'accountant@rajacademy.com',
      password: accountantPassword,
      role: 'ACCOUNTANT',
      phone: '+91-9000000004',
      isActive: true,
    },
  });
  console.log('✅ Accountant created:', accountantUser.email);

  // 5. Create Class Grade 10-A (2024-2025)
  const grade10A = await prisma.class.create({
    data: {
      name: 'Grade 10',
      section: 'A',
      academicYear: '2024-2025',
      capacity: 40,
      classTeacherId: teacher.id,
    },
  });
  console.log('✅ Class created: Grade 10-A');

  // 6. Create Class Grade 9-B
  const grade9B = await prisma.class.create({
    data: {
      name: 'Grade 9',
      section: 'B',
      academicYear: '2024-2025',
      capacity: 40,
      classTeacherId: teacher2.id,
    },
  });
  console.log('✅ Class created: Grade 9-B');

  // 7. Create Subjects for Grade 10-A
  const subjectMath = await prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH10', classId: grade10A.id } });
  const subjectSci = await prisma.subject.create({ data: { name: 'Science', code: 'SCI10', classId: grade10A.id } });
  const subjectEng = await prisma.subject.create({ data: { name: 'English', code: 'ENG10', classId: grade10A.id } });
  const subjectHist = await prisma.subject.create({ data: { name: 'History', code: 'HIST10', classId: grade10A.id } });
  const subjectCS = await prisma.subject.create({ data: { name: 'Computer Science', code: 'CS10', classId: grade10A.id } });
  console.log('✅ Subjects created for Grade 10-A');

  // 8. Subjects for Grade 9-B
  const subjectMath9 = await prisma.subject.create({ data: { name: 'Mathematics', code: 'MATH09', classId: grade9B.id } });
  const subjectEng9 = await prisma.subject.create({ data: { name: 'English', code: 'ENG09', classId: grade9B.id } });

  // 9. Assign Teachers to Subjects
  await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectMath.id, teacherId: teacher.id } });
  await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectSci.id, teacherId: teacher.id } });
  await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectEng.id, teacherId: teacher2.id } });
  await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectHist.id, teacherId: teacher2.id } });
  await prisma.classSubjectTeacher.create({ data: { classId: grade10A.id, subjectId: subjectCS.id, teacherId: teacher.id } });
  await prisma.classSubjectTeacher.create({ data: { classId: grade9B.id, subjectId: subjectMath9.id, teacherId: teacher.id } });
  await prisma.classSubjectTeacher.create({ data: { classId: grade9B.id, subjectId: subjectEng9.id, teacherId: teacher2.id } });
  console.log('✅ Teacher assignments created');
  // 11. Create Student User + Student Record (Alice)
  const studentPassword = await bcrypt.hash('Student@123', 12);
  const studentUser = await prisma.user.create({
    data: {
      name: 'Alice Verma',
      email: 'alice.verma@student.rajacademy.com',
      password: studentPassword,
      role: Role.STUDENT,
      phone: '+91-9000000005',
      isActive: true,
    },
  });

  const student = await prisma.student.create({
    data: {
      userId: studentUser.id,
      rollNo: 'JY26-0001',
      classId: grade10A.id,
      dob: new Date('2009-03-15'),
      gender: Gender.FEMALE,
      admissionDate: new Date('2024-06-01'),
      address: '45 Rose Street, Knowledge City',
      bloodGroup: 'B+',
    },
  });
  console.log('✅ Student (Alice) created:', studentUser.email);

  // 12. Create Student 2 (Bob)
  const student2User = await prisma.user.create({
    data: {
      name: 'Bob Singh',
      email: 'bob.singh@student.rajacademy.com',
      password: await bcrypt.hash('Student@123', 12),
      role: Role.STUDENT,
      phone: '+91-9000000006',
      isActive: true,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      userId: student2User.id,
      rollNo: 'JY26-0002',
      classId: grade10A.id,
      dob: new Date('2009-07-22'),
      gender: Gender.MALE,
      admissionDate: new Date('2024-06-01'),
      address: '78 Blue Avenue, Knowledge City',
      bloodGroup: 'O+',
    },
  });
  console.log('✅ Student (Bob) created');

  // 13. Create Student 3 (Carol)
  const student3User = await prisma.user.create({
    data: {
      name: 'Carol Patel',
      email: 'carol.patel@student.rajacademy.com',
      password: await bcrypt.hash('Student@123', 12),
      role: Role.STUDENT,
      phone: '+91-9000000007',
      isActive: true,
    },
  });

  const student3 = await prisma.student.create({
    data: {
      userId: student3User.id,
      rollNo: 'JY26-0003',
      classId: grade9B.id,
      dob: new Date('2010-11-05'),
      gender: Gender.FEMALE,
      admissionDate: new Date('2024-06-01'),
      address: '12 Green Park, Knowledge City',
      bloodGroup: 'A+',
    },
  });
  console.log('✅ Student (Carol) created');

  // 14. Fee Structure
  const feeStructure1 = await prisma.feeStructure.create({
    data: {
      classId: grade10A.id,
      term: 'Term 1',
      name: 'Tuition Fee - Term 1',
      amount: 15000,
      dueDate: new Date('2024-07-31'),
    },
  });

  const feeStructure2 = await prisma.feeStructure.create({
    data: {
      classId: grade10A.id,
      term: 'Term 2',
      name: 'Tuition Fee - Term 2',
      amount: 15000,
      dueDate: new Date('2024-11-30'),
    },
  });

  const feeStructure9 = await prisma.feeStructure.create({
    data: {
      classId: grade9B.id,
      term: 'Term 1',
      name: 'Tuition Fee - Term 1',
      amount: 12000,
      dueDate: new Date('2024-07-31'),
    },
  });
  console.log('✅ Fee structures created');

  // 15. Fee Payments (Alice - PAID, Bob - PARTIAL)
  await prisma.feePayment.create({
    data: {
      studentId: student.id,
      feeStructureId: feeStructure1.id,
      amountPaid: 15000,
      paymentDate: new Date('2024-07-15'),
      method: PaymentMethod.ONLINE,
      status: PaymentStatus.PAID,
      remarks: 'Full payment via UPI',
    },
  });

  await prisma.feePayment.create({
    data: {
      studentId: student2.id,
      feeStructureId: feeStructure1.id,
      amountPaid: 8000,
      paymentDate: new Date('2024-07-20'),
      method: PaymentMethod.CASH,
      status: PaymentStatus.PARTIAL,
      remarks: 'Partial payment - remaining due',
    },
  });
  console.log('✅ Fee payments created');

  // 16. Timetable for Grade 10-A (Mon-Fri, 5 periods each)
  const timetableEntries = [
    // Monday
    { day: 'Monday', periodNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
    { day: 'Monday', periodNumber: 2, startTime: '10:00', endTime: '11:00', subjectId: subjectSci.id, teacherId: teacher.id, room: 'Lab 1' },
    { day: 'Monday', periodNumber: 3, startTime: '11:15', endTime: '12:15', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
    { day: 'Monday', periodNumber: 4, startTime: '12:15', endTime: '13:15', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
    { day: 'Monday', periodNumber: 5, startTime: '14:00', endTime: '15:00', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
    // Tuesday
    { day: 'Tuesday', periodNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: subjectSci.id, teacherId: teacher.id, room: 'Lab 1' },
    { day: 'Tuesday', periodNumber: 2, startTime: '10:00', endTime: '11:00', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
    { day: 'Tuesday', periodNumber: 3, startTime: '11:15', endTime: '12:15', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
    { day: 'Tuesday', periodNumber: 4, startTime: '12:15', endTime: '13:15', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
    { day: 'Tuesday', periodNumber: 5, startTime: '14:00', endTime: '15:00', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
    // Wednesday
    { day: 'Wednesday', periodNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
    { day: 'Wednesday', periodNumber: 2, startTime: '10:00', endTime: '11:00', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
    { day: 'Wednesday', periodNumber: 3, startTime: '11:15', endTime: '12:15', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
    { day: 'Wednesday', periodNumber: 4, startTime: '12:15', endTime: '13:15', subjectId: subjectSci.id, teacherId: teacher.id, room: 'Lab 1' },
    { day: 'Wednesday', periodNumber: 5, startTime: '14:00', endTime: '15:00', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
    // Thursday
    { day: 'Thursday', periodNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: subjectSci.id, teacherId: teacher.id, room: 'Lab 1' },
    { day: 'Thursday', periodNumber: 2, startTime: '10:00', endTime: '11:00', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
    { day: 'Thursday', periodNumber: 3, startTime: '11:15', endTime: '12:15', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
    { day: 'Thursday', periodNumber: 4, startTime: '12:15', endTime: '13:15', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
    { day: 'Thursday', periodNumber: 5, startTime: '14:00', endTime: '15:00', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
    // Friday
    { day: 'Friday', periodNumber: 1, startTime: '09:00', endTime: '10:00', subjectId: subjectEng.id, teacherId: teacher2.id, room: 'Room 101' },
    { day: 'Friday', periodNumber: 2, startTime: '10:00', endTime: '11:00', subjectId: subjectHist.id, teacherId: teacher2.id, room: 'Room 102' },
    { day: 'Friday', periodNumber: 3, startTime: '11:15', endTime: '12:15', subjectId: subjectSci.id, teacherId: teacher.id, room: 'Lab 1' },
    { day: 'Friday', periodNumber: 4, startTime: '12:15', endTime: '13:15', subjectId: subjectCS.id, teacherId: teacher.id, room: 'Computer Lab' },
    { day: 'Friday', periodNumber: 5, startTime: '14:00', endTime: '15:00', subjectId: subjectMath.id, teacherId: teacher.id, room: 'Room 101' },
  ];

  for (const entry of timetableEntries) {
    await prisma.timetable.create({
      data: { classId: grade10A.id, ...entry },
    });
  }
  console.log('✅ Timetable created (25 slots)');

  // 17. Exam + Marks
  const exam = await prisma.exam.create({
    data: {
      name: 'Mid-Term Examination',
      classId: grade10A.id,
      term: 'Term 1',
      examDate: new Date('2024-09-15'),
      maxMarks: 100,
      passingMarks: 40,
    },
  });

  // Marks for Alice (student)
  const aliceMarks = [
    { subjectId: subjectMath.id, marksObtained: 92, grade: 'A' },
    { subjectId: subjectSci.id, marksObtained: 88, grade: 'B+' },
    { subjectId: subjectEng.id, marksObtained: 85, grade: 'B+' },
    { subjectId: subjectHist.id, marksObtained: 78, grade: 'B' },
    { subjectId: subjectCS.id, marksObtained: 95, grade: 'A+' },
  ];

  for (const m of aliceMarks) {
    await prisma.mark.create({
      data: {
        studentId: student.id,
        examId: exam.id,
        subjectId: m.subjectId,
        marksObtained: m.marksObtained,
        maxMarks: 100,
        grade: m.grade,
      },
    });
  }

  // Marks for Bob (student2)
  const bobMarks = [
    { subjectId: subjectMath.id, marksObtained: 72, grade: 'B' },
    { subjectId: subjectSci.id, marksObtained: 65, grade: 'C+' },
    { subjectId: subjectEng.id, marksObtained: 70, grade: 'B' },
    { subjectId: subjectHist.id, marksObtained: 58, grade: 'C' },
    { subjectId: subjectCS.id, marksObtained: 80, grade: 'B+' },
  ];

  for (const m of bobMarks) {
    await prisma.mark.create({
      data: {
        studentId: student2.id,
        examId: exam.id,
        subjectId: m.subjectId,
        marksObtained: m.marksObtained,
        maxMarks: 100,
        grade: m.grade,
      },
    });
  }
  console.log('✅ Exam & marks created');

  // 18. Attendance Records (last 10 school days)
  const today = new Date();
  const attendanceDays = [];
  let dayCount = 0;
  let checkDate = new Date(today);
  while (dayCount < 10) {
    checkDate = new Date(checkDate.getTime() - 86400000);
    const dow = checkDate.getDay();
    if (dow !== 0 && dow !== 6) {
      attendanceDays.push(new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate()));
      dayCount++;
    }
  }

  for (const date of attendanceDays) {
    // Alice attendance
    await prisma.attendance.create({
      data: {
        studentId: student.id,
        classId: grade10A.id,
        date,
        status: Math.random() > 0.1 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
        markedById: teacherUser.id,
        teacherId: teacher.id,
      },
    });
    // Bob attendance
    await prisma.attendance.create({
      data: {
        studentId: student2.id,
        classId: grade10A.id,
        date,
        status: Math.random() > 0.2 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
        markedById: teacherUser.id,
        teacherId: teacher.id,
      },
    });
    // Carol attendance
    await prisma.attendance.create({
      data: {
        studentId: student3.id,
        classId: grade9B.id,
        date,
        status: Math.random() > 0.15 ? AttendanceStatus.PRESENT : AttendanceStatus.LATE,
        markedById: teacher2User.id,
        teacherId: teacher2.id,
      },
    });
  }
  console.log('✅ Attendance records created (10 days x 3 students)');

  // 19. Announcements
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Academic Year 2024-2025',
      content: 'We are excited to welcome all students and teachers to the new academic year. Please check the timetable and fee schedule for your class.',
      targetRoles: 'STUDENT,TEACHER',
      createdById: adminUser.id,
      isActive: true,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Mid-Term Examination Schedule Released',
      content: 'The Mid-Term Examination for Term 1 will be held from September 15 to September 22, 2024. Please check the detailed schedule on the notice board.',
      targetRoles: 'STUDENT',
      createdById: adminUser.id,
      isActive: true,
      expiresAt: new Date('2024-09-30'),
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Staff Meeting - August 20th',
      content: 'All teaching staff are required to attend the monthly staff meeting on August 20, 2024 at 4:00 PM in the conference room.',
      targetRoles: 'TEACHER',
      createdById: adminUser.id,
      isActive: true,
    },
  });  console.log('✅ Announcements created');

  // 20. Messages between users
  await prisma.message.create({
    data: {
      senderId: adminUser.id,
      receiverId: teacherUser.id,
      content: 'Rajesh, please submit the Term 1 marks by end of this week.',
      readStatus: 'READ',
      sentAt: new Date(Date.now() - 3 * 86400000),
    },
  });
  console.log('✅ Messages created');

  await prisma.event.create({
    data: {
      title: 'Annual Sports Day',
      description: 'Annual Sports Day celebration with various athletic events and competitions.',
      startDate: new Date('2024-10-15T08:00:00Z'),
      endDate: new Date('2024-10-15T17:00:00Z'),
      allDay: true,
      targetRoles: 'STUDENT,TEACHER',
    },
  });

  await prisma.event.create({
    data: {
      title: 'Staff Planning Meeting',
      description: 'Monthly planning meeting to discuss school affairs.',
      startDate: new Date('2024-08-30T10:00:00Z'),
      endDate: new Date('2024-08-30T13:00:00Z'),
      allDay: false,
      targetRoles: 'TEACHER',
    },
  });

  await prisma.event.create({
    data: {
      title: 'Independence Day Celebration',
      description: 'Independence Day flag hoisting and cultural programs.',
      startDate: new Date('2024-08-15T08:00:00Z'),
      allDay: true,
      targetRoles: '',
    },
  });
  console.log('✅ Events created');

  // 22. Audit Log entry
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: 'SEED',
      entity: 'System',
      entityId: null,
      newValues: JSON.stringify({ message: 'Database seeded successfully' }),
      ipAddress: '127.0.0.1',
    },
  });

  console.log('\n🎉 ===== SEED COMPLETE =====');
  console.log('📧 Login credentials:');
  console.log('   Admin:   admin@rajacademy.com    / Admin@123    (SUPER_ADMIN)');
  console.log('   Teacher: rajesh.kumar@rajacademy.com / Teacher@123  (TEACHER)');
  console.log('   Teacher: priya.sharma@rajacademy.com / Teacher@123  (TEACHER)');
  console.log('   Student: alice.verma@student.rajacademy.com / Student@123 (STUDENT)');
  console.log('   Student: bob.singh@student.rajacademy.com   / Student@123 (STUDENT)');
  console.log('   Student: carol.patel@student.rajacademy.com / Student@123 (STUDENT)');
  console.log('===========================');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
