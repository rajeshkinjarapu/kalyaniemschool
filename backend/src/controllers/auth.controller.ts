import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middlewares/auth';
import { createError } from '../middlewares/errorHandler';
import { prisma } from '../utils/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendOtpEmail, sendWelcomeEmail } from '../utils/email';
import { successResponse } from '../utils/response';
import { generateRollNo, generateEmployeeId, generateOtp } from '../utils/helpers';
import { Role } from '../types/enums';

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { name, email, password, role, phone, photoUrl, ...profileData } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return next(createError('Email already registered', 409));

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role, phone, photoUrl },
  });

  if (role === Role.STUDENT) {
    const count = await prisma.student.count();
    const rollNo = generateRollNo(count + 1);
    await prisma.student.create({
      data: {
        userId: user.id,
        rollNo,
        classId: profileData.classId || null,
        dob: profileData.dob ? new Date(profileData.dob) : null,
        gender: profileData.gender || null,
        address: profileData.address || null,
        bloodGroup: profileData.bloodGroup || null,
      },
    });
  } else if (role === Role.TEACHER) {
    const count = await prisma.teacher.count();
    const employeeId = generateEmployeeId(count + 1);
    await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeId,
        qualification: profileData.qualification || null,
        specialization: profileData.specialization || null,
      },
    });
  }

  const tokenPayload = { id: user.id, email: user.email, role: user.role as Role, name: user.name };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  try {
    await sendWelcomeEmail(email, name, role, password);
  } catch (e) {
    console.error('Welcome email failed:', e);
  }

  const { password: _p, refreshToken: _rt, resetOtp: _o, resetOtpExp: _e, ...safeUser } = user as any;
  successResponse(res, { accessToken, refreshToken, user: safeUser }, 'User registered successfully', 201);
};
export const login = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const emailOrId = req.body.email?.trim();
  const password = req.body.password?.trim();
  console.log('Login attempt:', { emailOrId, passwordLength: password ? password.length : 0 });

  if (!emailOrId || !password) return next(createError('Email / mobile / Student ID and password are required', 400));

  const searchTerm = emailOrId;
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: searchTerm },
        { phone: searchTerm },
        { student: { rollNo: searchTerm } },
        { teacher: { employeeId: searchTerm } },
      ],
    },
    include: {
      student: {
        include: {
          class: true,
        },
      },
      teacher: { include: { homeRoomClass: true } },
    },
  });

  if (!user || !user.isActive) return next(createError('Invalid credentials', 401));

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return next(createError('Invalid credentials', 401));

  const tokenPayload = { id: user.id, email: user.email, role: user.role as Role, name: user.name };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  const { password: _p, refreshToken: _rt, resetOtp: _o, resetOtpExp: _e, ...safeUser } = user as any;
  successResponse(res, { accessToken, refreshToken, user: safeUser }, 'Login successful');
};

export const refreshToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { refreshToken: token } = req.body;
  if (!token) return next(createError('Refresh token required', 400));

  let decoded: { id: string; email: string; role: Role; name: string };
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    return next(createError('Invalid refresh token', 401));
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.id } });
  if (!user || user.refreshToken !== token) return next(createError('Invalid refresh token', 401));

  const accessToken = generateAccessToken({ id: user.id, email: user.email, role: user.role as Role, name: user.name });
  successResponse(res, { accessToken }, 'Token refreshed');
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user?.id) {
    await prisma.user.update({ where: { id: req.user.id }, data: { refreshToken: null } });
  }
  successResponse(res, null, 'Logged out successfully');
};

export const forgotPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return next(createError('No user found with this email', 404));

  const otp = generateOtp();
  const resetOtpExp = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({ where: { id: user.id }, data: { resetOtp: otp, resetOtpExp } });

  try {
    await sendOtpEmail(email, otp, user.name);
  } catch (e) {
    console.error('OTP email failed:', e);
  }

  successResponse(res, null, 'OTP sent to your email');
};

export const resetPassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { email, otp, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.resetOtp || !user.resetOtpExp) return next(createError('Invalid OTP request', 400));

  if (user.resetOtp !== otp) return next(createError('Invalid OTP', 400));
  if (user.resetOtpExp < new Date()) return next(createError('OTP has expired', 400));

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetOtp: null, resetOtpExp: null },
  });

  successResponse(res, null, 'Password reset successful');
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      student: { include: { class: true } },
      teacher: { include: { homeRoomClass: true } },
    },
  });
  if (!user) return next(createError('User not found', 404));

  const { password: _p, refreshToken: _rt, resetOtp: _o, resetOtpExp: _e, ...safeUser } = user as any;
  successResponse(res, safeUser, 'Profile fetched');
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { oldPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return next(createError('User not found', 404));

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) return next(createError('Old password is incorrect', 400));

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });

  successResponse(res, null, 'Password changed successfully');
};
