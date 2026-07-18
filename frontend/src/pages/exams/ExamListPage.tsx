import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { useAuth } from '../../hooks/useAuth';
import {
  Plus, Edit3, Trash2, ClipboardList, BookOpen, Layers, CheckSquare,
  Clock, Award, FileText, Settings, Play, ShieldAlert, HelpCircle, Save, X, Calendar, ExternalLink,
  MapPin, FileSpreadsheet, Download, Printer, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { SlipTestsTab } from './SlipTestsTab';
import { AdmitCardTab } from './AdmitCardTab';
import { ProgressCardTab } from './ProgressCardTab';

export const ExamListPage: React.FC = () => {
  const { user } = useAuth();
  const isAdminOrTeacher = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  // Search parameters for linking tabs from sidebar
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Tabs
  const [activeTab, setActiveTab] = useState<'examination' | 'exam-plan' | 'question-group' | 'question-bank' | 'question-papers' | 'add-online-exam' | 'online-exams' | 'written-exam' | 'admit-card' | 'results' | 'progress-card' | 'settings' | 'slip-tests' | ''>('');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  // Base Data
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter selections
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');

  // -------------------------------------------------------------
  // EXAMINATION Tab States & Logic
  // -------------------------------------------------------------
  const [showExamModal, setShowExamModal] = useState(false);
  const [editExamId, setEditExamId] = useState<string | null>(null);
  const [examName, setExamName] = useState('');
  const [examClassIds, setExamClassIds] = useState<string[]>([]);
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedExamSubjects, setSelectedExamSubjects] = useState<{id: string, name: string, maxMarks: number}[]>([]);
  
  // Auto calculate total marks
  const totalMarks = selectedExamSubjects.reduce((sum, sub) => sum + (Number(sub.maxMarks) || 0), 0);

  const openCreateModal = () => {
    setEditExamId(null);
    setExamName('');
    setExamClassIds([]);
    setExamDate(new Date().toISOString().split('T')[0]);
    setSelectedExamSubjects([]);
    setShowExamModal(true);
  };

  const openEditModal = (exam: any) => {
    setEditExamId(exam.id);
    setExamName(exam.name);
    setExamClassIds([exam.classId]);
    setExamDate(new Date(exam.examDate).toISOString().split('T')[0]);
    setSelectedExamSubjects(exam.subjects || []);
    setShowExamModal(true);
  };

  // Excel Upload States
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelExamId, setExcelExamId] = useState('');

  const fetchExams = async () => {
    try {
      const res: any = await api.get('/api/exams');
      const list = res.data || res || [];
      setExams(list);
      if (list.length > 0 && !selectedExamId) {
        setSelectedExamId(list[0].id);
      }
    } catch (e) {
      toast.error('Failed to load exams');
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (examClassIds.length === 0) {
      toast.error('Please select at least one class');
      return;
    }
    if (selectedExamSubjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }
    try {
      if (editExamId) {
        await api.put(`/api/exams/${editExamId}`, {
          name: examName,
          examDate: new Date(examDate),
          maxMarks: totalMarks,
          subjects: selectedExamSubjects
        });
        toast.success('Exam updated successfully!');
      } else {
        await api.post('/api/exams', {
          name: examName,
          classIds: examClassIds,
          examDate: new Date(examDate),
          maxMarks: totalMarks,
          subjects: selectedExamSubjects
        });
        toast.success('Exam created successfully!');
      }
      setShowExamModal(false);
      fetchExams();
    } catch (err: any) {
      toast.error(err.message || 'Error saving exam');
    }
  };

  // -------------------------------------------------------------
  // EXCEL UPLOAD Logic
  // -------------------------------------------------------------
  const downloadSampleExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      { "Student ID": "STU123", "Subject Code": "MATH101", "Marks Obtained": 85, "Remarks": "Good" },
      { "Student ID": "STU124", "Subject Code": "MATH101", "Marks Obtained": 90, "Remarks": "Excellent" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marks");
    XLSX.writeFile(wb, "Sample_Marks_Upload.xlsx");
  };

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile || !excelExamId) {
      toast.error('Please select an exam and a file');
      return;
    }
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        
        // Map excel columns to backend payload
        const mappedMarks = sheet.map((row: any) => ({
          studentId: row['Student ID'] || row['studentId'] || row['Student Id'],
          subjectId: row['Subject Code'] || row['subjectId'] || row['Subject Id'], // assuming the backend can resolve by code or id? Wait, backend needs subjectId. The user can enter Subject ID.
          marksObtained: Number(row['Marks Obtained'] || row['marksObtained'] || row['Marks']),
          remarks: row['Remarks'] || row['remarks'] || ''
        }));

        await api.post('/api/marks/bulk', {
          examId: excelExamId,
          marks: mappedMarks
        });
        toast.success('Excel marks uploaded successfully!');
        setShowExcelModal(false);
        setExcelFile(null);
      };
      reader.readAsBinaryString(excelFile);
    } catch (err) {
      toast.error('Error uploading excel file');
    }
  };

  // -------------------------------------------------------------
  // EXAM PLAN Tab States & Logic
  // -------------------------------------------------------------
  const [examPlans, setExamPlans] = useState<any[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planSubjectId, setPlanSubjectId] = useState('');
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [planStartTime, setPlanStartTime] = useState('09:00');
  const [planEndTime, setPlanEndTime] = useState('12:00');
  const [planRoom, setPlanRoom] = useState('');
  const [planMaxMarks, setPlanMaxMarks] = useState(100);
  const [planPassingMarks, setPlanPassingMarks] = useState(40);

  const fetchExamPlans = async () => {
    if (!selectedExamId) return;
    try {
      const res: any = await api.get(`/api/exams-extended/plans?examId=${selectedExamId}`);
      setExamPlans(res.data || []);
    } catch {
      toast.error('Failed to fetch exam plans');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams-extended/plans', {
        examId: selectedExamId,
        subjectId: planSubjectId,
        examDate: planDate,
        startTime: planStartTime,
        endTime: planEndTime,
        room: planRoom,
        maxMarks: Number(planMaxMarks),
        passingMarks: Number(planPassingMarks)
      });
      toast.success('Paper plan scheduled successfully!');
      setShowPlanModal(false);
      fetchExamPlans();
    } catch (err: any) {
      toast.error(err.message || 'Error scheduling paper');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!confirm('Are you sure you want to remove this paper from plan?')) return;
    try {
      await api.delete(`/api/exams-extended/plans/${id}`);
      toast.success('Paper plan deleted');
      fetchExamPlans();
    } catch {
      toast.error('Error deleting exam plan');
    }
  };

  // -------------------------------------------------------------
  // QUESTION GROUP Tab States & Logic
  // -------------------------------------------------------------
  const [questionGroups, setQuestionGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');

  const fetchQuestionGroups = async () => {
    try {
      const res: any = await api.get('/api/exams-extended/question-groups');
      const list = res.data || [];
      setQuestionGroups(list);
      if (list.length > 0 && !selectedGroupId) {
        setSelectedGroupId(list[0].id);
      }
    } catch {
      toast.error('Failed to load question groups');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams-extended/question-groups', {
        name: groupName,
        description: groupDesc
      });
      toast.success('Question group created');
      setShowGroupModal(false);
      setGroupName('');
      setGroupDesc('');
      fetchQuestionGroups();
    } catch (err: any) {
      toast.error(err.message || 'Error creating group');
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question group?')) return;
    try {
      await api.delete(`/api/exams-extended/question-groups/${id}`);
      toast.success('Group deleted');
      fetchQuestionGroups();
    } catch {
      toast.error('Error deleting group');
    }
  };

  // -------------------------------------------------------------
  // QUESTION BANK Tab States & Logic
  // -------------------------------------------------------------
  const [questions, setQuestions] = useState<any[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState('0');
  const [qMarks, setQMarks] = useState(1);

  const fetchQuestions = async () => {
    try {
      const res: any = await api.get(`/api/exams-extended/questions${selectedGroupId ? `?groupId=${selectedGroupId}` : ''}`);
      setQuestions(res.data || []);
    } catch {
      toast.error('Failed to load questions');
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/exams-extended/questions', {
        groupId: selectedGroupId,
        questionText: qText,
        questionType: qType,
        options: qType === 'MCQ' ? qOptions : null,
        correctAnswer: qCorrect,
        marks: Number(qMarks)
      });
      toast.success('Question added to bank');
      setShowQuestionModal(false);
      setQText('');
      setQOptions(['', '', '', '']);
      fetchQuestions();
    } catch (err: any) {
      toast.error(err.message || 'Error adding question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Delete question?')) return;
    try {
      await api.delete(`/api/exams-extended/questions/${id}`);
      toast.success('Question deleted');
      fetchQuestions();
    } catch {
      toast.error('Error deleting question');
    }
  };

  // -------------------------------------------------------------
  // ONLINE EXAM Tab States & Logic
  // -------------------------------------------------------------
  const [onlineExams, setOnlineExams] = useState<any[]>([]);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineTitle, setOnlineTitle] = useState('');
  const [onlineClassId, setOnlineClassId] = useState('');
  const [onlineSubjectId, setOnlineSubjectId] = useState('');
  const [onlineDuration, setOnlineDuration] = useState(60);
  const [onlineStart, setOnlineStart] = useState(new Date().toISOString().slice(0, 16));
  const [onlineEnd, setOnlineEnd] = useState(new Date().toISOString().slice(0, 16));
  const [onlinePassMarks, setOnlinePassMarks] = useState(40);
  const [selectedQIds, setSelectedQIds] = useState<string[]>([]);

  // Taking exam states
  const [takingExam, setTakingExam] = useState<any>(null);
  const [takingAnswers, setTakingAnswers] = useState<Record<string, string>>({});
  const [takingTimeLeft, setTakingTimeLeft] = useState(0);

  // Submissions states
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [viewingSubmissionsId, setViewingSubmissionsId] = useState<string | null>(null);

  const fetchOnlineExams = async () => {
    try {
      const res: any = await api.get('/api/exams-extended/online-exams');
      setOnlineExams(res.data || []);
    } catch {
      toast.error('Failed to load online exams');
    }
  };

  const handleCreateOnlineExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQIds.length === 0) {
      toast.error('Please select at least one question');
      return;
    }
    // Compute total marks
    const total = selectedQIds.reduce((sum, qId) => {
      const q = questions.find(item => item.id === qId);
      return sum + (q ? q.marks : 0);
    }, 0);

    try {
      await api.post('/api/exams-extended/online-exams', {
        title: onlineTitle,
        classId: onlineClassId,
        subjectId: onlineSubjectId,
        duration: Number(onlineDuration),
        startTime: onlineStart,
        endTime: onlineEnd,
        totalMarks: total,
        passMarks: Number(onlinePassMarks),
        questionIds: selectedQIds
      });
      toast.success('Online Exam published successfully!');
      setShowOnlineModal(false);
      setOnlineTitle('');
      setSelectedQIds([]);
      fetchOnlineExams();
    } catch (err: any) {
      toast.error(err.message || 'Error publishing online exam');
    }
  };

  const handleDeleteOnlineExam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this online exam?')) return;
    try {
      await api.delete(`/api/exams-extended/online-exams/${id}`);
      toast.success('Online exam deleted');
      fetchOnlineExams();
    } catch {
      toast.error('Error deleting online exam');
    }
  };

  const handleStartTakeExam = async (examId: string) => {
    try {
      const res: any = await api.get(`/api/exams-extended/online-exams/${examId}`);
      if (res.data.completed) {
        toast.success(`You already took this exam. Score: ${res.data.marksObtained}`);
        return;
      }
      const data = res.data.exam;
      setTakingExam(data);
      setTakingAnswers({});
      setTakingTimeLeft(data.duration * 60);
    } catch {
      toast.error('Failed to load exam details');
    }
  };

  const handleAnswerChange = (qId: string, answer: string) => {
    setTakingAnswers({ ...takingAnswers, [qId]: answer });
  };

  const handleSubmitOnlineExam = async () => {
    if (!takingExam) return;
    try {
      await api.post(`/api/exams-extended/online-exams/${takingExam.id}/submit`, {
        answers: takingAnswers
      });
      toast.success('Exam submitted successfully!');
      setTakingExam(null);
      fetchOnlineExams();
    } catch {
      toast.error('Error submitting exam');
    }
  };

  const handleViewSubmissions = async (examId: string) => {
    try {
      const res: any = await api.get(`/api/exams-extended/online-exams/${examId}/submissions`);
      setSubmissions(res.data || []);
      setViewingSubmissionsId(examId);
    } catch {
      toast.error('Error fetching submissions');
    }
  };

  // Timer effect for online test
  useEffect(() => {
    if (!takingExam || takingTimeLeft <= 0) {
      if (takingExam && takingTimeLeft === 0) {
        toast.error('Time limit reached! Submitting test automatically.');
        handleSubmitOnlineExam();
      }
      return;
    }
    const timer = setInterval(() => {
      setTakingTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [takingExam, takingTimeLeft]);

  // -------------------------------------------------------------
  // BOOTSTRAPPING
  // -------------------------------------------------------------
  const fetchBaseFilters = async () => {
    try {
      const classRes: any = await api.get('/api/classes');
      const classList = classRes.data || classRes || [];
      setClasses(classList);

      if (classList.length > 0) {
        setOnlineClassId(classList[0].id);
        setSelectedClassId(classList[0].id);
      }

      if (isAdmin) {
        try {
          const teachRes: any = await api.get('/api/teachers');
          const teacherList = teachRes.data?.data || teachRes.data || [];
          setTeachers(teacherList);
        } catch (e) {
          console.warn('Could not fetch teachers', e);
        }
      }
    } catch {
      toast.error('Failed to bootstrap filters');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // QUESTION PAPERS Tab States & Logic (Upload/Download)
  // -------------------------------------------------------------
  const [questionPapers, setQuestionPapers] = useState<any[]>([]);
  const [showQpModal, setShowQpModal] = useState(false);
  const [qpTitle, setQpTitle] = useState('');
  const [qpClassId, setQpClassId] = useState('');
  const [qpSubjectId, setQpSubjectId] = useState('');
  const [qpFileUrl, setQpFileUrl] = useState('');

  const fetchQuestionPapers = async () => {
    try {
      const res: any = await api.get('/api/question-papers');
      // axios interceptor returns response.data directly, so res is already the array
      setQuestionPapers(Array.isArray(res) ? res : (res?.data || []));
    } catch {
      // Silently fail - question papers are optional, don't block the page with a toast
      setQuestionPapers([]);
    }
  };

  const handleCreateQp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/api/question-papers', {
        title: qpTitle,
        classId: qpClassId,
        subjectId: qpSubjectId,
        fileUrl: qpFileUrl
      });
      toast.success('Question paper uploaded successfully');
      setShowQpModal(false);
      setQpTitle('');
      setQpFileUrl('');
      fetchQuestionPapers();
    } catch {
      toast.error('Error uploading question paper');
    }
  };

  const handleDeleteQp = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question paper?')) return;
    try {
      await api.delete(`/api/question-papers/${id}`);
      toast.success('Question paper deleted');
      fetchQuestionPapers();
    } catch {
      toast.error('Error deleting question paper');
    }
  };

  useEffect(() => {
    fetchBaseFilters();
    fetchExams();
    fetchQuestionGroups();
    fetchOnlineExams();
    fetchQuestionPapers();
  }, []);

  // Fetch plans when selected exam changes
  useEffect(() => {
    if (selectedExamId) {
      fetchExamPlans();
    }
  }, [selectedExamId]);

  // Fetch questions when group changes
  useEffect(() => {
    fetchQuestions();
  }, [selectedGroupId]);

  // Load subjects for exam plan form
  useEffect(() => {
    const activeExam = exams.find(e => e.id === selectedExamId);
    if (activeExam?.classId) {
      api.get(`/api/classes/${activeExam.classId}/subjects`)
        .then((res: any) => {
          setSubjects(res.data || []);
          if (res.data?.length > 0) {
            setPlanSubjectId(res.data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [selectedExamId, exams]);

  // Load subjects for online exam form
  useEffect(() => {
    if (onlineClassId) {
      api.get(`/api/classes/${onlineClassId}/subjects`)
        .then((res: any) => {
          setSubjects(res.data || []);
          if (res.data?.length > 0) {
            setOnlineSubjectId(res.data[0].id);
          }
        })
        .catch(() => {});
    }
  }, [onlineClassId]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;

  // -------------------------------------------------------------
  // EXAM TAKING MODAL SCREEN
  // -------------------------------------------------------------
  if (takingExam) {
    const mins = Math.floor(takingTimeLeft / 60);
    const secs = takingTimeLeft % 60;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-red-500 text-white p-5 rounded-2xl shadow">
          <div>
            <h3 className="text-xl font-bold">{takingExam.title}</h3>
            <p className="text-xs opacity-90">Subject: {takingExam.subject?.name}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-extrabold uppercase block tracking-wider opacity-75">Time Remaining</span>
            <span className="text-2xl font-black">{mins}:{secs < 10 ? '0' : ''}{secs}</span>
          </div>
        </div>

        <div className="space-y-6">
          {takingExam.questions.map((eq: any, index: number) => {
            const q = eq.question;
            const opts = q.options ? JSON.parse(q.options) : [];
            return (
              <div key={q.id} className="card p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                    Q{index + 1}. {q.questionText}
                  </h4>
                  <Badge variant="info">Marks: {q.marks}</Badge>
                </div>

                {q.questionType === 'MCQ' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {opts.map((opt: string, optIdx: number) => (
                      <label
                        key={optIdx}
                        className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer select-none transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          takingAnswers[q.id] === String(optIdx)
                            ? 'bg-primary-50 border-primary-500 dark:bg-primary-950/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q_${q.id}`}
                          value={optIdx}
                          checked={takingAnswers[q.id] === String(optIdx)}
                          onChange={() => handleAnswerChange(q.id, String(optIdx))}
                          className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea
                    rows={4}
                    placeholder="Type your answer here..."
                    value={takingAnswers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    className="input"
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={() => {
              if (confirm('Cancel exam? Your answers will not be saved.')) {
                setTakingExam(null);
              }
            }}
            className="btn-secondary"
          >
            Cancel / Give Up
          </button>
          <button onClick={handleSubmitOnlineExam} className="btn-primary">
            Submit Exam
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // EXAM SUBMISSIONS VIEW
  // -------------------------------------------------------------
  if (viewingSubmissionsId) {
    const activeExam = onlineExams.find(e => e.id === viewingSubmissionsId);
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
          <div>
            <h3 className="font-bold">Submissions: {activeExam?.title}</h3>
            <p className="text-xs text-gray-400">Total Marks: {activeExam?.totalMarks} · Passing Marks: {activeExam?.passMarks}</p>
          </div>
          <button onClick={() => setViewingSubmissionsId(null)} className="btn-secondary">
            Back to Exams
          </button>
        </div>

        <div className="card p-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Student Name</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Roll No</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Submitted At</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Marks Obtained</th>
                  <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                {submissions.map((sub) => {
                  const pass = sub.marksObtained >= (activeExam?.passMarks || 40);
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                      <td className="py-4 font-bold text-gray-900 dark:text-white">{sub.student?.user?.name}</td>
                      <td className="py-4 text-xs text-gray-400">{sub.student?.rollNo}</td>
                      <td className="py-4 text-xs text-gray-500">{new Date(sub.submittedAt).toLocaleString()}</td>
                      <td className="py-4 font-bold">{sub.marksObtained} / {activeExam?.totalMarks}</td>
                      <td className="py-4 text-right">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          pass ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-red-50 text-red-700 dark:bg-red-950/20'
                        }`}>
                          {pass ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No submissions recorded yet for this exam.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 p-0 sm:p-4 md:p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen overflow-x-hidden">
      <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {/* ══ TOP NAVIGATION HEADER ══ */}
        <div className="rounded-none sm:rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-5 sm:p-6 md:p-8 shadow-xl text-white transform transition-all sm:hover:scale-[1.01]">
          <div className="flex items-center gap-4">
            <div className="hidden sm:block rounded-2xl bg-white/20 p-3 backdrop-blur-md">
              <ClipboardList className="h-8 w-8 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                <ClipboardList className="h-6 w-6 sm:hidden shrink-0" />
                Examinations Suite
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 md:space-y-8">
        {!activeTab && (
          <div className="rounded-none sm:rounded-[2rem] border-y sm:border border-white/50 bg-white/80 backdrop-blur-xl p-5 sm:p-8 md:p-10 shadow-2xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Examinations List - Visible to all, but Create Exam is only for Admin */}
              <button onClick={() => setActiveTab('examination')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-indigo-500 to-indigo-600 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList className="w-7 h-7" />
                </div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Examinations List</span>
              </button>

              {isAdmin && (
                <>
                  <button onClick={() => setActiveTab('exam-plan')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-purple-500 to-purple-600 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-purple-500/30 hover:-translate-y-1 shadow-md">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Calendar className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Exam Plan</span>
                  </button>

                  <button onClick={() => setActiveTab('admit-card')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-amber-500 to-orange-500 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 shadow-md">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Admit Card</span>
                  </button>

                  <button onClick={() => setActiveTab('add-online-exam')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-violet-500/30 hover:-translate-y-1 shadow-md">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Plus className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Add Online Exam</span>
                  </button>
                </>
              )}

              {/* Common: Marks Upload, Results, Progress Card, Question Papers */}
              <button onClick={() => setActiveTab('written-exam')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-emerald-500 to-teal-500 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-1 shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Edit3 className="w-7 h-7" />
                </div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Marks Upload</span>
              </button>

              <button onClick={() => setActiveTab('results')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-blue-500 to-cyan-500 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-7 h-7" />
                </div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Results</span>
              </button>

              <button onClick={() => setActiveTab('progress-card')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-rose-500 to-pink-500 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-rose-500/30 hover:-translate-y-1 shadow-md">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-7 h-7" />
                </div>
                <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Progress Card</span>
              </button>

              {isAdminOrTeacher && (
                <>
                  <button onClick={() => setActiveTab('question-bank')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-slate-600 to-slate-700 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-slate-500/30 hover:-translate-y-1 shadow-md">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Layers className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Question Papers</span>
                  </button>
              </>
            )}

              {isAdmin && (
                <>
                  <button onClick={() => setActiveTab('slip-tests')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-cyan-500 to-blue-500 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-cyan-500/30 hover:-translate-y-1 shadow-md">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Clock className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Slip Tests</span>
                  </button>

                  <button onClick={() => setActiveTab('settings')} className="group flex flex-col items-center justify-center p-6 rounded-[1.5rem] bg-gradient-to-br from-gray-600 to-gray-700 text-white transition-all gap-3 sm:gap-4 hover:shadow-xl hover:shadow-gray-500/30 hover:-translate-y-1 shadow-md">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Settings className="w-7 h-7" />
                    </div>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-white text-center leading-tight">Settings</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      {/* Create Exam Modal */}
      {showExamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="card w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Configure Exam</h3>
              <button onClick={() => setShowExamModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="label">Exam Name / Title</label>
                <input type="text" required placeholder="e.g. Mid-Term 1" value={examName} onChange={e => setExamName(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Select Classes</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {classes.map(c => {
                    const isSelected = examClassIds.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExamClassIds([...examClassIds, c.id]);
                            } else {
                              setExamClassIds(examClassIds.filter(id => id !== c.id));
                            }
                          }}
                        />
                        {c.name}-{c.section}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Exam Date</label>
                  <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label">Total Marks (Auto)</label>
                  <input type="number" readOnly value={totalMarks} className="input bg-gray-50 dark:bg-gray-800" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="label !mb-0">Subjects & Max Marks</label>
                  <button 
                    type="button" 
                    onClick={() => setSelectedExamSubjects([...selectedExamSubjects, { id: Date.now().toString() + Math.random(), name: '', maxMarks: 100 }])}
                    className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
                  >
                    + Add Subject
                  </button>
                </div>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/20">
                  {selectedExamSubjects.map((sub, index) => (
                    <div key={sub.id} className="flex items-center gap-3 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Subject Name (e.g. Maths)"
                          value={sub.name}
                          required
                          onChange={(e) => {
                            const newName = e.target.value;
                            setSelectedExamSubjects(selectedExamSubjects.map(s => 
                              s.id === sub.id ? { ...s, name: newName } : s
                            ));
                          }}
                          className="input !py-1.5 !px-3 w-full text-sm font-semibold"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-bold uppercase">Max:</span>
                        <input
                          type="number"
                          min={1}
                          required
                          value={sub.maxMarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newMax = val ? Number(val) : 0;
                            setSelectedExamSubjects(selectedExamSubjects.map(s => 
                              s.id === sub.id ? { ...s, maxMarks: newMax } : s
                            ));
                          }}
                          className="input !py-1.5 !px-2 w-20 text-sm font-bold text-center"
                        />
                        <button
                          type="button"
                          onClick={() => setSelectedExamSubjects(selectedExamSubjects.filter(s => s.id !== sub.id))}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                          title="Remove subject"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedExamSubjects.length === 0 && (
                    <div className="py-6 text-center text-gray-400 text-sm">
                      No subjects added yet. Click "+ Add Subject" to start.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowExamModal(false)} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" className="btn-primary text-sm">{editExamId ? 'Update Exam' : 'Create Exam'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ TAB 2: EXAM PLAN ══ */}
      {activeTab === 'exam-plan' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold uppercase text-gray-400">Exam Batch:</span>
              <select value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold">
                {exams.map(e => <option key={e.id} value={e.id}>{e.name} ({e.class?.name})</option>)}
              </select>
            </div>
            {isAdmin && selectedExamId && (
              <button onClick={() => setShowPlanModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Schedule Paper
              </button>
            )}
          </div>

          <div className="card p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Subject</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Exam Date</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Timing</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Room</th>
                    <th className="pb-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Marks Info</th>
                    {isAdmin && <th className="pb-3.5 text-right font-extrabold text-gray-400 text-xs uppercase tracking-wider">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {examPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                      <td className="py-4">
                        <div className="font-bold text-gray-900 dark:text-white">{plan.subject?.name}</div>
                        <span className="text-[10px] text-gray-400 font-bold">{plan.subject?.code}</span>
                      </td>
                      <td className="py-4 text-xs font-semibold text-gray-700 dark:text-gray-200">{new Date(plan.examDate).toLocaleDateString()}</td>
                      <td className="py-4 text-xs text-gray-500 font-bold">{plan.startTime} – {plan.endTime}</td>
                      <td className="py-4 text-xs text-gray-500 font-bold">{plan.room || 'N/A'}</td>
                      <td className="py-4 text-xs font-semibold text-gray-500">Max: {plan.maxMarks} · Pass: {plan.passingMarks}</td>
                      {isAdmin && (
                        <td className="py-4 text-right">
                          <button onClick={() => handleDeletePlan(plan.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {examPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        No subject papers scheduled in plan yet for this exam batch.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {showPlanModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Schedule Exam Paper</h3>
                  <button onClick={() => setShowPlanModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreatePlan} className="space-y-4">
                  <div>
                    <label className="label">Select Subject</label>
                    <select required value={planSubjectId} onChange={e => setPlanSubjectId(e.target.value)} className="input">
                      {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Exam Date</label>
                    <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Start Time</label>
                      <input type="text" placeholder="09:00" value={planStartTime} onChange={e => setPlanStartTime(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label">End Time</label>
                      <input type="text" placeholder="12:00" value={planEndTime} onChange={e => setPlanEndTime(e.target.value)} className="input" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="label">Room</label>
                      <input type="text" placeholder="102" value={planRoom} onChange={e => setPlanRoom(e.target.value)} className="input" />
                    </div>
                    <div className="col-span-1">
                      <label className="label">Max Marks</label>
                      <input type="number" value={planMaxMarks} onChange={e => setPlanMaxMarks(Number(e.target.value))} className="input" />
                    </div>
                    <div className="col-span-1">
                      <label className="label">Pass Marks</label>
                      <input type="number" value={planPassingMarks} onChange={e => setPlanPassingMarks(Number(e.target.value))} className="input" />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowPlanModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm">Save Paper</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 3: MARKS UPLOAD (written-exam) ══ */}
      {activeTab === 'written-exam' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-5 rounded-3xl shadow-lg border border-pink-400/50">
            <span className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
              <span>📝</span> Marks Upload / Results Entry
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => (
              <div key={exam.id} className="relative rounded-[2rem] p-6 overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-xl shadow-indigo-500/5 border-2 border-pink-100 dark:border-pink-900/30 hover:border-pink-400 dark:hover:border-pink-600 transition-all duration-300 flex flex-col group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xl drop-shadow-sm">{exam.name}</h4>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1.5">Select a class to enter marks:</p>
                </div>
                
                <div className="flex flex-col gap-3 flex-1 mt-5 relative z-10">
                  {(exam.classes || []).map((c: any) => (
                    <div key={c.id} className="flex gap-2 items-center bg-slate-50/80 dark:bg-slate-900/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                      <div className="flex-1 text-sm font-black text-slate-700 dark:text-slate-300 px-3 truncate">
                        {c.name}-{c.section}
                      </div>
                      <Link to={`/exams/${exam.id}/entry?classId=${c.id}`} className="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 text-center shrink-0">
                        Enter Marks
                      </Link>
                    </div>
                  ))}
                  {(!exam.classes || exam.classes.length === 0) && (
                    <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">No classes assigned to this exam</p>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700 relative z-10">
                    <button onClick={() => { setExcelExamId(exam.id); setShowExcelModal(true); }} className="w-full px-4 py-3 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5">
                      Excel Bulk Upload
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showExcelModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Upload Marks Excel</h3>
                  <button onClick={() => setShowExcelModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">Instructions:</p>
                  <ul className="text-xs text-blue-600/80 dark:text-blue-400/80 list-disc pl-4 space-y-1">
                    <li>Download the sample Excel file.</li>
                    <li>Fill in the 'Student ID', 'Subject ID', 'Marks Obtained' columns.</li>
                    <li>Upload the filled file back here.</li>
                  </ul>
                  <button onClick={downloadSampleExcel} className="mt-3 text-xs font-bold bg-white dark:bg-gray-800 px-3 py-1.5 rounded-md shadow-sm border border-blue-100 dark:border-blue-800 text-blue-600 hover:bg-blue-50 w-full text-center">
                    Download Sample Excel
                  </button>
                </div>

                <form onSubmit={handleExcelUpload} className="space-y-4">
                  <div>
                    <label className="label">Select Excel File</label>
                    <input type="file" accept=".xlsx, .xls" required onChange={e => setExcelFile(e.target.files?.[0] || null)} className="input p-2" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowExcelModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm bg-green-500 hover:bg-green-600">Upload Data</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 4: ADMIT CARD ══ */}
      {activeTab === 'admit-card' && (
        <div className="card p-2 h-[80vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 mb-2">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Admit Card Generator</h3>
              <p className="text-xs text-gray-500">Standalone tool using Admit Cards.html</p>
            </div>
            <a href="/Admit Cards.html" target="_blank" className="btn-primary text-xs flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Open Full Screen
            </a>
          </div>
          <iframe src="/Admit Cards.html" className="w-full h-full border-0 rounded-b-lg"></iframe>
        </div>
      )}

      {/* ══ TAB 5: PROGRESS CARD ══ */}
      {activeTab === 'progress-card' && user?.role !== 'TEACHER' && (
        <div className="card p-2 h-[80vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 mb-2">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Progress Card Generator</h3>
              <p className="text-xs text-gray-500">Standalone tool using JEE Mains Result card with Reports.html</p>
            </div>
            <a href="/JEE Mains Result card with Reports.html" target="_blank" className="btn-primary text-xs flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Open Full Screen
            </a>
          </div>
          <iframe src="/JEE Mains Result card with Reports.html" className="w-full h-full border-0 rounded-b-lg"></iframe>
        </div>
      )}

      {/* ══ TAB 6: SLIP TESTS ══ */}
      {activeTab === 'online-exams' && (
        <div className="card p-2 h-[80vh] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 mb-2">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Slip Test Result Card</h3>
              <p className="text-xs text-gray-500">Standalone tool using Slip Test Result Card.html</p>
            </div>
            <a href="/Slip Test Result Card.html" target="_blank" className="btn-primary text-xs flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Open Full Screen
            </a>
          </div>
          <iframe src="/Slip Test Result Card.html" className="w-full h-full border-0 rounded-b-lg"></iframe>
        </div>
      )}

      {/* ══ TAB 7: QUESTION GROUP ══ */}
      {activeTab === 'question-group' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <span className="text-xs font-extrabold uppercase text-gray-400">Manage Question Categories & Chapters</span>
            <button onClick={() => setShowGroupModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
              <Plus className="w-4 h-4" /> Add Question Group
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionGroups.map(group => (
              <div key={group.id} className="card p-6 space-y-4 hover:shadow-md transition-shadow relative group border-l-4 border-indigo-500">
                <div>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white">{group.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">{group.description || 'No description provided'}</p>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-3">
                  <span>Questions in group: {group._count?.questions || 0}</span>
                  <button onClick={() => handleDeleteGroup(group.id)} className="p-1 text-gray-400 hover:text-red-500 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showGroupModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">New Question Group</h3>
                  <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="label">Group Name</label>
                    <input type="text" required placeholder="e.g. Physics Chapter 1" value={groupName} onChange={e => setGroupName(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea rows={3} placeholder="Describe the topics covered..." value={groupDesc} onChange={e => setGroupDesc(e.target.value)} className="input" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowGroupModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm">Create Group</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 4: QUESTION BANK ══ */}
      {activeTab === 'question-bank' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-xs font-extrabold uppercase text-gray-400">Select Group:</span>
              <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold">
                {questionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            {selectedGroupId && (
              <button onClick={() => setShowQuestionModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Create Question
              </button>
            )}
          </div>

          <div className="space-y-4">
            {questions.map((q, index) => {
              const opts = q.options ? JSON.parse(q.options) : [];
              return (
                <div key={q.id} className="card p-6 space-y-4 relative group border-l-4 border-indigo-500">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-gray-950 dark:text-white">Q{index + 1}. {q.questionText}</h4>
                      <div className="flex items-center gap-2.5 mt-2">
                        <span className="text-[10px] font-extrabold uppercase bg-gray-100 dark:bg-gray-800 text-gray-600 px-2 py-0.5 rounded-md">{q.questionType}</span>
                        <span className="text-[10px] font-semibold text-gray-400">Marks: {q.marks}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-405 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {q.questionType === 'MCQ' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1.5">
                      {opts.map((opt: string, optIdx: number) => {
                        const correct = q.correctAnswer === String(optIdx);
                        return (
                          <div key={optIdx} className={`p-3 rounded-xl border font-semibold ${correct ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-gray-150 dark:border-gray-800 text-gray-600'}`}>
                            {optIdx + 1}. {opt} {correct && ' (Correct Answer)'}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.questionType === 'SUBJECTIVE' && (
                    <div className="text-xs bg-gray-50 dark:bg-gray-800/40 p-3.5 rounded-xl border border-gray-150 dark:border-gray-800">
                      <span className="text-[10px] font-bold text-gray-405 block uppercase tracking-wider mb-1">Expected Key Phrases/Answers:</span>
                      <p className="font-semibold text-gray-700 dark:text-gray-300">{q.correctAnswer}</p>
                    </div>
                  )}
                </div>
              );
            })}
            {questions.length === 0 && (
              <div className="card p-12 text-center text-gray-400">
                No questions defined inside this group. Add question elements to populate the exam staged database bank.
              </div>
            )}
          </div>

          {showQuestionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Add Question to Bank</h3>
                  <button onClick={() => setShowQuestionModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateQuestion} className="space-y-4">
                  <div>
                    <label className="label">Question Type</label>
                    <select value={qType} onChange={e => setQType(e.target.value)} className="input">
                      <option value="MCQ">Multiple Choice Question (MCQ)</option>
                      <option value="SUBJECTIVE">Subjective Answer</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Question Text</label>
                    <textarea rows={3} required placeholder="e.g. What is the value of gravitational constant G?" value={qText} onChange={e => setQText(e.target.value)} className="input" />
                  </div>

                  {qType === 'MCQ' ? (
                    <div className="space-y-3">
                      <span className="text-xs font-bold text-gray-500">Provide 4 Answer Options:</span>
                      <div className="grid grid-cols-2 gap-3">
                        {qOptions.map((opt, optIdx) => (
                          <input key={optIdx} type="text" required placeholder={`Option ${optIdx + 1}`} value={opt} onChange={e => {
                            const updated = [...qOptions];
                            updated[optIdx] = e.target.value;
                            setQOptions(updated);
                          }} className="input" />
                        ))}
                      </div>
                      <div>
                        <label className="label">Select Correct Option Number</label>
                        <select value={qCorrect} onChange={e => setQCorrect(e.target.value)} className="input">
                          <option value="0">Option 1</option>
                          <option value="1">Option 2</option>
                          <option value="2">Option 3</option>
                          <option value="3">Option 4</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="label">Correct Answer Key Description</label>
                      <input type="text" required placeholder="Describe key answers phrases..." value={qCorrect} onChange={e => setQCorrect(e.target.value)} className="input" />
                    </div>
                  )}

                  <div>
                    <label className="label">Marks weightage</label>
                    <input type="number" min={1} value={qMarks} onChange={e => setQMarks(Number(e.target.value))} className="input" />
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowQuestionModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm">Save Question</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 5: ADD ONLINE EXAM ══ */}
      {activeTab === 'add-online-exam' && isAdminOrTeacher && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-150 dark:border-gray-800 space-y-6">
          <div>
            <h3 className="text-lg font-bold">Configure Advanced Online Exam</h3>
            <p className="text-xs text-gray-400 mt-1">Configure timed, automated grading online tests from the bank.</p>
          </div>

          <form onSubmit={handleCreateOnlineExam} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Exam Title</label>
                <input type="text" required placeholder="e.g. Physics Chapter 1 MCQ Test" value={onlineTitle} onChange={e => setOnlineTitle(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Target Class</label>
                <select required value={onlineClassId} onChange={e => setOnlineClassId(e.target.value)} className="input">
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Subject</label>
                <select required value={onlineSubjectId} onChange={e => setOnlineSubjectId(e.target.value)} className="input">
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Duration (minutes)</label>
                <input type="number" required value={onlineDuration} onChange={e => setOnlineDuration(Number(e.target.value))} className="input" />
              </div>
              <div>
                <label className="label">Passing Marks</label>
                <input type="number" required value={onlinePassMarks} onChange={e => setOnlinePassMarks(Number(e.target.value))} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Start Schedule Time</label>
                <input type="datetime-local" value={onlineStart} onChange={e => setOnlineStart(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">End Schedule Time</label>
                <input type="datetime-local" value={onlineEnd} onChange={e => setOnlineEnd(e.target.value)} className="input" />
              </div>
            </div>

            {/* Select questions */}
            <div className="space-y-3 pt-3 border-t border-gray-150 dark:border-gray-800">
              <span className="text-xs font-bold text-gray-500">Pick Staged Questions to Include in Exam:</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Filter Question Group:</span>
                <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-xs font-bold">
                  {questionGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>

              <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
                {questions.map(q => {
                  const checked = selectedQIds.includes(q.id);
                  return (
                    <label key={q.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer select-none">
                      <input type="checkbox" checked={checked} onChange={() => {
                        if (checked) {
                          setSelectedQIds(selectedQIds.filter(id => id !== q.id));
                        } else {
                          setSelectedQIds([...selectedQIds, q.id]);
                        }
                      }} className="mt-1" />
                      <div className="text-xs">
                        <p className="font-bold text-gray-800 dark:text-gray-200">{q.questionText}</p>
                        <span className="text-[10px] text-gray-400 font-semibold">{q.questionType} · Marks: {q.marks}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Publish Online Exam
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══ TAB 8: QUESTION PAPERS (UPLOAD/DOWNLOAD) ══ */}
      {activeTab === 'question-papers' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <span className="text-xs font-extrabold uppercase text-gray-400">Manage Question Papers</span>
            {(isAdmin || isTeacher) && (
              <button onClick={() => setShowQpModal(true)} className="btn-primary flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Upload Paper
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {questionPapers.map(qp => (
              <div key={qp.id} className="card p-6 space-y-4 hover:shadow-md relative group border-t-4 border-emerald-500">
                <div>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white">{qp.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1">Class: {qp.class?.name}-{qp.class?.section} | Subject: {qp.subject?.name}</p>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <a href={qp.fileUrl} target="_blank" rel="noreferrer" className="btn-primary flex-1 text-center text-xs flex items-center justify-center gap-2">
                    <ExternalLink className="w-4 h-4" /> View/Download
                  </a>
                  {(isAdmin || isTeacher) && (
                    <button onClick={() => handleDeleteQp(qp.id)} className="p-2 border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {questionPapers.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                No question papers uploaded yet.
              </div>
            )}
          </div>

          {showQpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
              <div className="card w-full max-w-md p-6 space-y-5">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold">Upload Question Paper</h3>
                  <button onClick={() => setShowQpModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleCreateQp} className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input type="text" required placeholder="e.g. Mid Term Physics Paper" value={qpTitle} onChange={e => setQpTitle(e.target.value)} className="input" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Class</label>
                      <select required value={qpClassId} onChange={e => setQpClassId(e.target.value)} className="input">
                        <option value="">Select...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}-{c.section}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Subject</label>
                      <select required value={qpSubjectId} onChange={e => setQpSubjectId(e.target.value)} className="input">
                        <option value="">Select...</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">File URL (PDF/Word)</label>
                    <input type="url" required placeholder="https://link-to-file.pdf" value={qpFileUrl} onChange={e => setQpFileUrl(e.target.value)} className="input" />
                  </div>
                  <div className="flex gap-3 justify-end pt-2">
                    <button type="button" onClick={() => setShowQpModal(false)} className="btn-secondary text-sm">Cancel</button>
                    <button type="submit" className="btn-primary text-sm">Upload Paper</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB 10: SLIP TESTS ══ */}
      {activeTab === 'slip-tests' && (
        <SlipTestsTab />
      )}

      {/* ══ TAB 9: ONLINE EXAMS LIST ══ */}
      {activeTab === 'online-exams' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {onlineExams.map(exam => (
              <div key={exam.id} className="card p-6 space-y-4 hover:shadow-md border-t-4 border-indigo-500">
                <div>
                  <Badge variant="success">{exam.subject?.name}</Badge>
                  <h4 className="font-bold text-base text-gray-900 dark:text-white mt-1.5">{exam.title}</h4>
                  <p className="text-[11px] text-gray-400 mt-1">Class: {exam.class?.name}-{exam.class?.section}</p>
                </div>

                <div className="text-xs space-y-2 text-gray-500 font-semibold border-y border-gray-100 dark:border-gray-800 py-3">
                  <p className="flex justify-between"><span>Duration:</span> <span>{exam.duration} mins</span></p>
                  <p className="flex justify-between"><span>Total Marks:</span> <span>{exam.totalMarks}</span></p>
                  <p className="flex justify-between"><span>Passing Marks:</span> <span>{exam.passMarks}</span></p>
                  <p className="flex justify-between"><span>Questions:</span> <span>{exam.questions?.length || 0} items</span></p>
                </div>

                {isStudent ? (
                  <button onClick={() => handleStartTakeExam(exam.id)} className="btn-primary w-full flex items-center justify-center gap-2">
                    <Play className="w-4 h-4" /> Start Exam
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => handleViewSubmissions(exam.id)} className="btn-secondary flex-1 text-xs font-bold">
                      Submissions ({exam.submissions?.length || 0})
                    </button>
                    <button onClick={() => handleDeleteOnlineExam(exam.id)} className="p-2 border border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {onlineExams.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400">
                No active online exams scheduled or published.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB 7: EXAMINATIONS LIST ══ */}
      {activeTab === 'examination' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-150 dark:border-gray-800">
            <span className="text-xs font-extrabold uppercase text-gray-400">Examinations List</span>
            {isAdmin && (
              <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" /> Create Exam
              </button>
            )}
          </div>

          <div className="card p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Exam Title</th>
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Target Classes</th>
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Term</th>
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider">Date</th>
                    <th className="p-3.5 font-extrabold text-gray-400 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                  {exams.map(e => (
                    <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                      <td className="p-3.5 font-bold text-gray-900 dark:text-white">{e.name}</td>
                      <td className="p-3.5 text-xs font-semibold text-gray-600">
                        <div className="flex flex-wrap gap-1">
                          {(e.classes || []).map((c: any) => (
                            <span key={c.id} className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">
                              {c.name}-{c.section}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-xs text-gray-450 font-bold">{e.term}</td>
                      <td className="p-3.5 text-xs text-gray-500 font-semibold">{new Date(e.examDate).toLocaleDateString()}</td>
                      <td className="p-3.5 text-right flex justify-end gap-2">
                        {isAdmin && (
                          <button onClick={() => openEditModal(e)} className="btn-secondary text-[11px] font-bold px-3 py-1.5 flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> Edit
                          </button>
                        )}
                        <button onClick={() => setActiveTab('written-exam')} className="btn-secondary text-[11px] font-bold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800 dark:hover:bg-indigo-900/50 dark:text-indigo-400">
                          Enter Grades
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══ TAB 8: SETTINGS ══ */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-150 dark:border-gray-800 space-y-6">
          <div>
            <h3 className="text-lg font-bold">General Examinations & Grading Setup</h3>
            <p className="text-xs text-gray-400 mt-1">Configure conversion scales, grade keys, and CCE settings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Grading Standards</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Evaluation Mode</label>
                  <select className="input" defaultValue="PERCENTAGE">
                    <option value="CCE">CCE Grading System</option>
                    <option value="GPA">GPA Conversion Scale</option>
                    <option value="PERCENTAGE">Direct Percentage</option>
                  </select>
                </div>
                <div>
                  <label className="label">Default Pass Percentage</label>
                  <input type="number" defaultValue="40" className="input" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <span className="text-xs font-extrabold uppercase text-gray-400 tracking-wider">Audit Security Log</span>
              <p className="text-xs text-gray-500 font-semibold leading-relaxed">
                Security logging is active. Grade entries, online test attempts, and exam schedules are tracked for student auditing automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══ NEW TABS ══ */}
      {activeTab === 'admit-card' && (
        <AdmitCardTab exams={exams} />
      )}
      
      {activeTab === 'results' && (
        <div className="bg-white dark:bg-gray-900 p-12 text-center rounded-xl border border-gray-150 dark:border-gray-800 space-y-4">
          <Award className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Results Publishing</h3>
          <p className="text-sm text-gray-500">Publish verified results and rank lists (Coming Soon).</p>
        </div>
      )}

      {activeTab === 'progress-card' && (
        <ProgressCardTab exams={exams} />
      )}
      </div>
    </div>
    </div>
  );
};

export default ExamListPage;
