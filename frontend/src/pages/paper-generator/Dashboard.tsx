import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { qbApi as api } from '../../utils/questionBankApi';
import {
  FileText,
  Database,
  PlusCircle,
  FileSpreadsheet,
  Clock,
  User,
  Calendar,
  LogOut,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';

interface Paper {
  id: number;
  title: string;
  duration: number;
  totalMarks: number;
  examDate?: string | null;
  paperCode?: string | null;
  sectionsJson: string;
  createdAt: string;
  createdBy: { username: string };
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalPapers: 0,
    physicsCount: 0,
    chemistryCount: 0,
    mathsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // Authenticate user & load statistics
  useEffect(() => {
    const initDashboard = async () => {
      try {
        setCurrentUser({ name: "Admin" });

        // Fetch papers
        const papersRes = await api.getPapers();
        setPapers(papersRes.papers);

        // Fetch questions count for stats
        const questionsRes = await api.getQuestions();
        const qs = questionsRes.questions;
        
        const phys = qs.filter((q: any) => q.subject === 'Physics').length;
        const chem = qs.filter((q: any) => q.subject === 'Chemistry').length;
        const math = qs.filter((q: any) => q.subject === 'Mathematics').length;

        setStats({
          totalQuestions: qs.length,
          totalPapers: papersRes.papers.length,
          physicsCount: phys,
          chemistryCount: chem,
          mathsCount: math,
        });
      } catch (err) {
        // Clear tokens if auth fails
        localStorage.removeItem('jee_token');
        localStorage.removeItem('jee_user');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('jee_token');
    localStorage.removeItem('jee_user');
    navigate('/login');
  };

  const handleDeletePaper = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this question paper?')) return;
    try {
      await api.deletePaper(id);
      setPapers((prev) => prev.filter((p) => p.id !== id));
      setStats((prev) => ({ ...prev, totalPapers: prev.totalPapers - 1 }));
    } catch (err) {
      alert('Failed to delete paper');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-indigo-600 border-slate-700 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading JEE Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 bg-gradient-to-tr from-slate-100 via-indigo-50/20 to-purple-50/20 text-white font-sans pb-12 relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-accentPurple/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] bg-teal-500/4 rounded-full blur-[160px] pointer-events-none" />
      {/* Top Navigation */}
      <nav className="border-b border-slate-200 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-accentPurple rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">
              JEE Paper Builder
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
              <User className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-800">
                {currentUser?.username} ({currentUser?.role})
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 border border-transparent hover:border-red-200 rounded-xl transition-all"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 relative z-10">
        {/* Welcome Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {currentUser?.username}!
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Create exam sets, add LaTeX math equations, and generate double-column exam prints.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/questions"
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4 text-teal-500" />
              <span>Question Bank</span>
            </Link>
            <Link
              to="/papers/new"
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-accentPurple hover:brightness-110 text-white rounded-xl text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Build A Paper</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-150 hover:border-indigo-300 rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all hover:-translate-y-1 duration-300">
            <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider">Total Questions</span>
            <div className="flex justify-between items-end mt-2">
              <span className="text-3xl font-black text-indigo-700">{stats.totalQuestions}</span>
              <Database className="w-6 h-6 text-indigo-500 opacity-90" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-white border border-amber-150 hover:border-amber-300 rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all hover:-translate-y-1 duration-300">
            <span className="text-xs text-amber-600 font-bold uppercase tracking-wider">Physics Bank</span>
            <div className="flex justify-between items-end mt-2">
              <span className="text-3xl font-black text-amber-700">{stats.physicsCount}</span>
              <Award className="w-6 h-6 text-amber-600 opacity-90" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-150 hover:border-emerald-300 rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all hover:-translate-y-1 duration-300">
            <span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">Chemistry Bank</span>
            <div className="flex justify-between items-end mt-2">
              <span className="text-3xl font-black text-emerald-700">{stats.chemistryCount}</span>
              <TrendingUp className="w-6 h-6 text-emerald-600 opacity-90" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-150 hover:border-blue-300 rounded-2xl p-4 flex flex-col justify-between shadow-sm transition-all hover:-translate-y-1 duration-300">
            <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Maths Bank</span>
            <div className="flex justify-between items-end mt-2">
              <span className="text-3xl font-black text-blue-700">{stats.mathsCount}</span>
              <FileText className="w-6 h-6 text-blue-600 opacity-90" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-150 hover:border-purple-300 rounded-2xl p-4 col-span-2 lg:col-span-1 flex flex-col justify-between shadow-sm transition-all hover:-translate-y-1 duration-300">
            <span className="text-xs text-purple-600 font-bold uppercase tracking-wider">Compiled Papers</span>
            <div className="flex justify-between items-end mt-2">
              <span className="text-3xl font-black text-purple-700">{stats.totalPapers}</span>
              <FileSpreadsheet className="w-6 h-6 text-purple-600 opacity-90" />
            </div>
          </div>
        </div>

        {/* Papers Section */}
        <div className="bg-white border border-slate-250 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Generated Question Papers
            </h2>
            <span className="text-xs text-slate-400 font-sans font-medium">
              Showing {papers.length} compiled sets
            </span>
          </div>

          {papers.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-slate-800 font-bold text-base">No question papers created yet</h3>
              <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                You can assemble questions manually or auto-generate a JEE paper in seconds using custom blue-print structures.
              </p>
              <Link
                to="/papers/new"
                className="mt-5 inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Build your first Paper</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {papers.map((paper) => {
                const sections = JSON.parse(paper.sectionsJson || '[]');
                const qCount = sections.reduce((acc: number, sec: any) => acc + (sec.questionIds?.length || 0), 0);

                return (
                  <Link
                    key={paper.id}
                    to={`/papers/${paper.id}`}
                    className="group bg-slate-50/50 hover:bg-slate-50 border border-slate-200 hover:border-indigo-600/30 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Glowing highlight decoration on hover */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-xl group-hover:bg-indigo-600/10 transition-colors" />

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="bg-slate-200 group-hover:bg-indigo-50 border border-slate-250 text-slate-650 group-hover:text-indigo-600 text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase transition-colors">
                          {paper.paperCode || 'SET A'}
                        </span>
                        <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          {paper.duration} min
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-indigo-600 line-clamp-1 pr-4 transition-colors">
                        {paper.title}
                      </h3>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-550 mt-4 border-t border-slate-200/60 pt-3">
                        <div className="flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-teal-500" />
                          <span>{qCount} Questions</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-accentPurple" />
                          <span>{paper.totalMarks} Marks</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-5 border-t border-slate-200/60 pt-3">
                      <div className="flex items-center gap-1 text-[10px] text-slate-550 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => handleDeletePaper(paper.id, e)}
                          className="px-2.5 py-1 text-slate-500 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded-lg text-[11px] font-bold transition-all"
                        >
                          Delete
                        </button>
                        <span className="text-indigo-600 group-hover:translate-x-1.5 transition-transform">
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};




