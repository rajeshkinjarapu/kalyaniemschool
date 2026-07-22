export const generateRollNo = (count: number): string => {
  const year = new Date().getFullYear().toString().slice(-2);
  return `JY${year}-${String(count).padStart(4, '0')}`;
};

export const generateEmployeeId = (count?: number): string => {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `SVJY-${random}`;
};

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const calculateGrade = (obtained: number, max: number): string => {
  const percentage = (obtained / max) * 100;
  if (percentage >= 95) return 'A+';
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C+';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
};

export const calculateGPA = (percentage: number): number => {
  if (percentage >= 95) return 4.0;
  if (percentage >= 90) return 3.7;
  if (percentage >= 80) return 3.3;
  if (percentage >= 70) return 3.0;
  if (percentage >= 60) return 2.7;
  if (percentage >= 50) return 2.3;
  if (percentage >= 40) return 2.0;
  return 0.0;
};

export const getDateRange = (range: string): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (range) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week': {
      const dayOfWeek = now.getDay();
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};
