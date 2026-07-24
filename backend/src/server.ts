import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

import { initSocket } from './socket';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';

// Routes
import authRoutes from './routes/auth';
import studentRoutes from './routes/students';
import teacherRoutes from './routes/teachers';
import classRoutes from './routes/classes';
import subjectRoutes from './routes/subjects';
import attendanceRoutes from './routes/attendance';
import examRoutes from './routes/exams';
import questionPaperRoutes from './routes/questionPapers';
import slipTestRoutes from './routes/slipTests';
import markRoutes from './routes/marks';
import timetableRoutes from './routes/timetable';
import feeRoutes from './routes/fees';
import announcementRoutes from './routes/announcements';
import messageRoutes from './routes/messages';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import uploadRoutes from './routes/uploads';
import userRoutes from './routes/users';
import eventRoutes from './routes/events';
import examsExtendedRoutes from './routes/examsExtended';
import formRoutes from './routes/forms';
import latexRoutes from './routes/latex';
import gatePassRoutes from './routes/gatePass';
import homeworkRoutes from './routes/homework';
import teacherAttendanceRoutes from './routes/teacherAttendance';
import salaryRoutes from './routes/salary';
import leaveRoutes from './routes/leave';
import questionBankRoutes from './routes/questionBank';
import generatedPapersRoutes from './routes/generatedPapers';

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

// Init Socket.io
initSocket(httpServer);

// Core Middleware
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: function (origin, callback) {
    // Allow all origins
    callback(null, true);
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/question-papers', questionPaperRoutes);
app.use('/api/slip-tests', slipTestRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/exams-extended', examsExtendedRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/latex', latexRoutes);
app.use('/api/gate-pass', gatePassRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/teacher-attendance', teacherAttendanceRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api', questionBankRoutes);
app.use('/api/generated-papers', generatedPapersRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '5000', 10);
httpServer.listen(PORT, () => {
  console.log(`🚀 JY School SMS Backend running on http://localhost:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
});

export default app;
