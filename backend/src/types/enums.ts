export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  ACCOUNTANT: 'ACCOUNTANT'
} as const;
export type Role = typeof Role[keyof typeof Role];

export const AttendanceStatus = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
  LATE: 'LATE',
  EXCUSED: 'EXCUSED'
} as const;
export type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];

export const PaymentMethod = {
  CASH: 'CASH',
  ONLINE: 'ONLINE',
  BANK_TRANSFER: 'BANK_TRANSFER',
  CHEQUE: 'CHEQUE',
  UPI: 'UPI'
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PAID: 'PAID',
  PENDING: 'PENDING',
  OVERDUE: 'OVERDUE',
  PARTIAL: 'PARTIAL'
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const Gender = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER'
} as const;
export type Gender = typeof Gender[keyof typeof Gender];

export const MessageReadStatus = {
  UNREAD: 'UNREAD',
  READ: 'READ'
} as const;
export type MessageReadStatus = typeof MessageReadStatus[keyof typeof MessageReadStatus];
