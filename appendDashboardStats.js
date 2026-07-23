const fs = require('fs');

const codeToAppend = `
export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total Students
    const totalStudents = await prisma.student.count();

    // Today's attendance records
    const todayRecords = await prisma.attendance.findMany({
      where: { date: { gte: today, lt: tomorrow } },
      include: {
        student: { include: { user: { select: { name: true } } } },
        class: { select: { name: true, section: true } }
      }
    });

    let todayPresent = 0;
    let todayAbsent = 0;
    let todayLeave = 0;

    const classStatsMap = new Map<string, { className: string; present: number; absent: number; total: number }>();
    const studentsOnLeave: any[] = [];

    todayRecords.forEach(record => {
      const clsName = \`\${record.class.name}-\${record.class.section}\`;
      if (!classStatsMap.has(clsName)) {
        classStatsMap.set(clsName, { className: clsName, present: 0, absent: 0, total: 0 });
      }
      const cStat = classStatsMap.get(clsName)!;
      cStat.total++;

      if (record.status === 'PRESENT' || record.status === 'LATE') {
        todayPresent++;
        cStat.present++;
      } else if (record.status === 'ABSENT') {
        todayAbsent++;
        cStat.absent++;
      } else if (record.status === 'EXCUSED') {
        todayLeave++;
        cStat.absent++; // Count leave as absent for class stat %
        studentsOnLeave.push({
          studentName: record.student.user.name,
          className: clsName,
          reason: record.note || 'Leave'
        });
      }
    });

    const classWise = Array.from(classStatsMap.values()).map(c => ({
      className: c.className,
      present: c.present,
      absent: c.absent,
      percentage: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0
    }));

    const attendancePercentage = totalStudents > 0 ? Math.round((todayPresent / totalStudents) * 100) : 0;

    // Weekly trend (last 5 days)
    const weeklyTrend: any[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Get last 5 days data (excluding today maybe, or including today)
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setUTCHours(0,0,0,0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const dRecords = await prisma.attendance.findMany({
        where: { date: { gte: d, lt: nextD } }
      });
      
      let p = 0, a = 0;
      dRecords.forEach(r => {
        if (r.status === 'PRESENT' || r.status === 'LATE') p++;
        else a++;
      });
      
      const total = p + a || 1; // avoid div by 0
      weeklyTrend.push({
        day: dayNames[d.getDay()],
        present: p,
        absent: a,
        percentage: dRecords.length > 0 ? Math.round((p / dRecords.length) * 100) : 0
      });
    }

    // Recent Activities (Mocked from latest marked records)
    // In a real scenario you'd have an activity log. We'll generate from today's attendance grouping by class.
    const recentActivities: string[] = [];
    classWise.forEach(c => {
      recentActivities.push(\`Class \${c.className} Attendance Updated\`);
    });

    successResponse(res, {
      totalStudents,
      todayPresent,
      todayAbsent,
      todayLeave,
      attendancePercentage,
      classWise,
      studentsOnLeave,
      weeklyTrend,
      recentActivities: recentActivities.slice(0, 5) // top 5
    });

  } catch (error) {
    next(error);
  }
};
`;

fs.appendFileSync('backend/src/controllers/attendance.controller.ts', codeToAppend);
