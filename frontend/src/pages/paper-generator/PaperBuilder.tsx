import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { qbApi as api } from '../../utils/questionBankApi';
import { LaTeXPreview } from '../../components/QuestionBank/LaTeXPreview';
import {
  ArrowLeft,
  Settings,
  Plus,
  Trash2,
  PlusCircle,
  HelpCircle,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ListOrdered,
  Search,
} from 'lucide-react';

interface Question {
  id: number;
  subject: string;
  chapter: string;
  topic: string;
  type: string;
  difficulty: string;
  questionText: string;
  correctAnswer: string;
  solution: string;
}

interface Section {
  id: string;
  name: string;
  type: string;
  questions: Question[];
}

export const PaperBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('180'); // minutes
  const [totalMarks, setTotalMarks] = useState('300');
  const [instructions, setInstructions] = useState(
    'The paper consists of Physics, Chemistry, and Mathematics.\nSection A contains MCQ Single Correct questions (+4, -1).\nSection B contains Numerical Value questions (+4, 0).'
  );
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [watermark, setWatermark] = useState('');
  const [paperCode, setPaperCode] = useState('SET A');
  const [className, setClassName] = useState('6th A');
  const [instituteName, setInstituteName] = useState('SRI VENKATESWARA JY SCHOOL');
  const [subHeader1, setSubHeader1] = useState('(IIT-JEE/NEET Foundation - Olympiads)');
  const [subHeader2, setSubHeader2] = useState('Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta');
  const [logoUrl, setLogoUrl] = useState('');

  // Auto vs Manual Toggles
  const [mode, setMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');

  // AUTO Mode Blueprint Configurations
  const [physicsCount, setPhysicsCount] = useState(25);
  const [chemistryCount, setChemistryCount] = useState(25);
  const [mathCount, setMathCount] = useState(25);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // MANUAL Mode Configurations
  const [sections, setSections] = useState<Section[]>([
    { id: 'phy_a', name: 'Physics - Section A', type: 'MCQ_SINGLE', questions: [] },
    { id: 'chem_a', name: 'Chemistry - Section A', type: 'MCQ_SINGLE', questions: [] },
    { id: 'math_a', name: 'Mathematics - Section A', type: 'MCQ_SINGLE', questions: [] },
  ]);
  const [activeSectionId, setActiveSectionId] = useState('phy_a');

  // Search/Filter for left pane (manual question selector)
  const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
  const [bankSearch, setBankSearch] = useState('');
  const [bankSubject, setBankSubject] = useState('Physics');
  const [bankType, setBankType] = useState('');
  const [bankLoading, setBankLoading] = useState(false);

  // Fetch Templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.getTemplates();
        setTemplates(res.templates);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  // Fetch bank questions for manual addition
  const fetchBankQuestions = async () => {
    setBankLoading(true);
    try {
      const res = await api.getQuestions({
        subject: bankSubject,
        type: bankType,
        search: bankSearch,
      });
      setBankQuestions(res.questions);
    } catch (err) {
      console.error(err);
    } finally {
      setBankLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'MANUAL') {
      fetchBankQuestions();
    }
  }, [bankSubject, bankType, mode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBankQuestions();
  };

  // Template change triggers preset mapping
  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedTemplateId(id);
    if (!id) return;

    const t = templates.find((x) => x.id === parseInt(id));
    if (t) {
      try {
        const struct = JSON.parse(t.structureJson);
        if (struct.physics) setPhysicsCount(struct.physics);
        if (struct.chemistry) setChemistryCount(struct.chemistry);
        if (struct.math) setMathCount(struct.math);
        if (t.description) setInstructions(t.description);
      } catch (err) {
        console.error('Failed parsing template structure:', err);
      }
    }
  };

  // Manual: Create empty section
  const handleAddSection = () => {
    const name = window.prompt('Enter Section Name (e.g. Physics - Section B):');
    if (!name) return;
    const type = window.confirm('Is this section Numerical Value type? (Cancel = MCQ)') ? 'NUMERICAL' : 'MCQ_SINGLE';
    const newSec: Section = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      questions: [],
    };
    setSections((prev) => [...prev, newSec]);
    setActiveSectionId(newSec.id);
  };

  const handleDeleteSection = (secId: string) => {
    if (!window.confirm('Delete section? Selected questions in this section will be unassigned.')) return;
    setSections((prev) => prev.filter((s) => s.id !== secId));
    if (activeSectionId === secId) {
      setActiveSectionId(sections[0]?.id || '');
    }
  };

  // Question Manual Assign
  const handleAddQuestionToSection = (q: Question) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== activeSectionId) return sec;
        // Check if question already exists in this section
        if (sec.questions.some((x) => x.id === q.id)) return sec;
        return {
          ...sec,
          questions: [...sec.questions, q],
        };
      })
    );
  };

  const handleRemoveQuestionFromSection = (secId: string, qId: number) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== secId) return sec;
        return {
          ...sec,
          questions: sec.questions.filter((x) => x.id !== qId),
        };
      })
    );
  };

  // Up & Down manual vertical sorting
  const handleMoveQuestion = (secId: string, idx: number, direction: 'UP' | 'DOWN') => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== secId) return sec;
        const list = [...sec.questions];
        if (direction === 'UP' && idx > 0) {
          const temp = list[idx];
          list[idx] = list[idx - 1];
          list[idx - 1] = temp;
        } else if (direction === 'DOWN' && idx < list.length - 1) {
          const temp = list[idx];
          list[idx] = list[idx + 1];
          list[idx + 1] = temp;
        }
        return { ...sec, questions: list };
      })
    );
  };

  // Submit Paper Build Request
  const handleSavePaper = async () => {
    setError(null);
    if (!title) {
      setError('Paper Title is required');
      return;
    }

    setLoading(true);

    const payload: any = {
      title,
      duration,
      totalMarks,
      instructions,
      examDate,
      watermark,
      paperCode,
      className,
      instituteName,
      subHeader1,
      subHeader2,
      logoUrl,
    };

    if (mode === 'AUTO') {
      payload.autoGenerate = {
        subjects: {
          Physics: physicsCount,
          Chemistry: chemistryCount,
          Mathematics: mathCount,
        },
      };
    } else {
      payload.sections = sections;
      const totalSelectedQuestions = sections.reduce((acc, s) => acc + s.questions.length, 0);
      if (totalSelectedQuestions === 0) {
        setError('Manual papers require at least 1 selected question');
        setLoading(false);
        return;
      }
    }

    try {
      const res = await api.createPaper(payload);
      navigate(`/papers/${res.paper.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save paper configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-indigo-950 font-medium font-sans pb-16">
      {/* Top navbar */}
      <nav className="border-b border-slate-200 bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white shadow-md text-white">
        <div className="w-full mx-auto px-2 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/question-bank" className="p-2 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 rounded-xl transition-colors text-indigo-800 font-medium">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">
              Assemble JEE Mains Paper
            </span>
          </div>

          <button
            onClick={handleSavePaper}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-accentPurple hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50"
          >
            {loading ? 'Compiling Exam Booklet...' : 'Save & Compile Paper'}
          </button>
        </div>
      </nav>

      {/* Builder Layout */}
      <main className="w-full mx-auto px-2 lg:px-6 pt-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-sm font-semibold">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Metadata Settings Card (Left Column) */}
          <div className="bg-white/90 backdrop-blur-xl border-2 border-indigo-100 rounded-3xl p-6 shadow-xl shadow-indigo-200/50 h-fit space-y-4 shadow-sm">
            <h3 className="font-bold text-sm flex items-center gap-1.5 border-b border-slate-100 pb-3 text-slate-800">
              <Settings className="w-4 h-4 text-indigo-600" />
              Paper Information
            </h3>

            <div>
              <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Paper Title / Header</label>
              <input
                type="text"
                placeholder="e.g. JEE Mains Test Series - Test 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Duration (Min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Total Marks</label>
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium text-center font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium font-sans"
                />
              </div>
              <div>
                <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Paper Set Code</label>
                <input
                  type="text"
                  placeholder="SET A"
                  value={paperCode}
                  onChange={(e) => setPaperCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium text-center uppercase font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Watermark (Text)</label>
              <input
                type="text"
                placeholder="e.g. CONFIDENTIAL / INSTITUTE NAME"
                value={watermark}
                onChange={(e) => setWatermark(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium uppercase font-sans font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Class / Grade Designation</label>
              <input
                type="text"
                placeholder="e.g. 6th A"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium font-sans"
              />
            </div>

            <div>
              <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Institute / School Name</label>
              <input
                type="text"
                placeholder="e.g. SRI VENKATESWARA JY SCHOOL"
                value={instituteName}
                onChange={(e) => setInstituteName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium font-sans uppercase font-bold"
              />
            </div>

            <div>
              <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Header Subtitle 1</label>
              <input
                type="text"
                placeholder="e.g. (IIT-JEE/NEET Foundation - Olympiads)"
                value={subHeader1}
                onChange={(e) => setSubHeader1(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium font-sans"
              />
            </div>

            <div>
              <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Header Subtitle 2</label>
              <input
                type="text"
                placeholder="e.g. SVL Paradise Campus, Narasannapeta"
                value={subHeader2}
                onChange={(e) => setSubHeader2(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium font-sans"
              />
            </div>

            <div>
              <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Custom Logo (URL Image)</label>
              <input
                type="text"
                placeholder="e.g. /uploads/logo.png"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium font-sans"
              />
            </div>

            <div>
              <label className="block text-xs text-indigo-700 font-medium font-semibold mb-1">Instructions (supports $math$)</label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Type paper instructions here..."
                className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs focus:outline-none focus:border-indigo-600 text-indigo-950 font-medium font-sans"
              />
            </div>

            {/* Creation Mode Switcher */}
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-xs text-indigo-700 font-medium font-semibold mb-2">Compilation Mode</label>
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMode('MANUAL')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === 'MANUAL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-indigo-700 font-medium hover:text-slate-800'
                  }`}
                >
                  Manual Selection
                </button>
                <button
                  type="button"
                  onClick={() => setMode('AUTO')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    mode === 'AUTO'
                      ? 'bg-teal-500 text-white shadow-sm'
                      : 'text-indigo-700 font-medium hover:text-slate-800'
                  }`}
                >
                  Auto-Blueprint
                </button>
              </div>
            </div>
          </div>

          {/* Builder Workspace Pane (Right 2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            {mode === 'AUTO' ? (
              /* AUTO BLUEPRINT COMPILATION PANEL */
              <div className="bg-white shadow-md border border-slate-200 rounded-3xl p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-base text-teal-500 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                    Auto-Generate JEE Paper
                  </h3>
                  <span className="text-xs text-indigo-700 font-medium font-sans">Rule-based compilation</span>
                </div>

                {/* Templates Selector */}
                <div>
                  <label className="block text-xs text-indigo-800 font-medium font-semibold mb-1">
                    Load Existing Blueprint Template (Optional)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTemplateId}
                      onChange={handleTemplateChange}
                      className="w-full bg-white border border-indigo-200 shadow-sm rounded-xl p-3 text-xs focus:outline-none focus:border-teal-500 text-indigo-950 font-medium font-sans"
                    >
                      <option value="">-- Select A Saved Blueprint Blueprint --</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Blueprint Parameters */}
                <div className="p-4 bg-white border border-indigo-200 shadow-sm rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-indigo-950 font-medium uppercase tracking-wider">Number of Questions per Subject</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-xs text-indigo-800 font-medium">Physics</span>
                      <input
                        type="number"
                        value={physicsCount}
                        onChange={(e) => setPhysicsCount(parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent text-center font-bold text-lg text-indigo-950 font-medium mt-1 border-b border-slate-300 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-xs text-indigo-800 font-medium">Chemistry</span>
                      <input
                        type="number"
                        value={chemistryCount}
                        onChange={(e) => setChemistryCount(parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent text-center font-bold text-lg text-indigo-950 font-medium mt-1 border-b border-slate-300 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-3 rounded-xl border border-slate-200 text-center">
                      <span className="text-xs text-indigo-800 font-medium">Mathematics</span>
                      <input
                        type="number"
                        value={mathCount}
                        onChange={(e) => setMathCount(parseInt(e.target.value) || 0)}
                        className="w-full bg-transparent text-center font-bold text-lg text-indigo-950 font-medium mt-1 border-b border-slate-300 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-700 font-medium font-sans italic leading-relaxed text-center">
                    Note: Generates double-section layouts for each subject (80% MCQ Single Correct + 20% Numerical questions) randomly selected from your question database bank.
                  </p>
                </div>
              </div>
            ) : (
              /* MANUAL WORKSPACE PANES Split */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Question Bank Left Pane */}
                <div className="bg-white/90 backdrop-blur-xl border-2 border-indigo-100 rounded-3xl p-5 shadow-xl shadow-indigo-200/50 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                    <h4 className="font-bold text-xs text-indigo-950 font-medium uppercase tracking-wider flex items-center gap-1">
                      <FolderOpen className="w-4 h-4 text-indigo-600" />
                      Browse Bank
                    </h4>
                    <select
                      value={bankSubject}
                      onChange={(e) => setBankSubject(e.target.value)}
                      className="bg-white border border-indigo-200 shadow-sm rounded px-2 py-0.5 text-[10px] text-indigo-700 focus:outline-none font-bold bg-indigo-50"
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                    </select>
                  </div>

                  <form onSubmit={handleSearchSubmit} className="relative flex gap-2">
                    <input
                      type="text"
                      placeholder="Filter questions..."
                      value={bankSearch}
                      onChange={(e) => setBankSearch(e.target.value)}
                      className="w-full bg-white border border-indigo-200 shadow-sm rounded-lg p-2 text-[11px] text-indigo-950 font-medium focus:outline-none focus:border-indigo-600 font-sans"
                    />
                    <button type="submit" className="p-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700 shadow-md transition-colors">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </form>

                  <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3 font-sans">
                    {bankLoading ? (
                      <div className="text-center py-10 text-xs text-indigo-700 font-medium">Loading bank questions...</div>
                    ) : bankQuestions.length === 0 ? (
                      <div className="text-center py-10 text-xs text-indigo-600 bg-indigo-50 border-2 border-dashed border-indigo-200 shadow-sm font-semibold rounded-xl">
                        No unused questions found in subject.
                      </div>
                    ) : (
                      bankQuestions.map((q) => (
                        <div
                          key={q.id}
                          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:bg-indigo-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between"
                        >
                          <div className="font-serif text-[11.5px] line-clamp-3 text-indigo-950 font-medium">
                            <LaTeXPreview text={q.questionText} />
                          </div>
                          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-200/50">
                            <span className="text-[9px] text-indigo-700 font-medium uppercase font-mono font-bold">
                              ID: {q.id} | {q.chapter} ({q.type})
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddQuestionToSection(q)}
                              className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-600 rounded text-[10px] font-bold text-white transition-all flex items-center gap-0.5"
                            >
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Paper Sections Right Pane */}
                <div className="bg-white/90 backdrop-blur-xl border-2 border-indigo-100 rounded-3xl p-5 shadow-xl shadow-indigo-200/50 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                    <h4 className="font-bold text-xs text-indigo-950 font-medium uppercase tracking-wider flex items-center gap-1">
                      <ListOrdered className="w-4 h-4 text-teal-500" />
                      Paper Layout
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="px-2.5 py-0.5 bg-slate-800 hover:bg-slate-700 border border-slate-300 hover:border-slate-600 text-indigo-950 font-medium rounded text-[10px] font-bold transition-all"
                    >
                      + Add Section
                    </button>
                  </div>

                  {/* Section Tabs */}
                  <div className="flex flex-wrap gap-1.5">
                    {sections.map((sec) => (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => setActiveSectionId(sec.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 border ${
                          activeSectionId === sec.id
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-indigo-200 shadow-sm hover:border-indigo-400 text-indigo-700 font-semibold'
                        }`}
                      >
                        <span>{sec.name}</span>
                        <span className="bg-black/20 text-white rounded-full px-1.5 font-bold">
                          {sec.questions.length}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Active Section Questions List */}
                  {(() => {
                    const activeSec = sections.find((s) => s.id === activeSectionId);
                    if (!activeSec) return null;

                    return (
                      <div className="space-y-3 font-sans">
                        <div className="flex justify-between items-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                          <div>
                            Section: <span className="font-bold text-indigo-950 font-medium">{activeSec.name}</span>
                            <span className="ml-1 text-[9px] text-indigo-700 font-medium font-mono">({activeSec.type})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSection(activeSec.id)}
                            className="text-red-500 hover:text-red-400 text-[10px] font-bold"
                          >
                            Delete Section
                          </button>
                        </div>

                        {activeSec.questions.length === 0 ? (
                          <div className="text-center py-10 text-xs text-indigo-600 bg-indigo-50 border-2 border-dashed border-indigo-200 shadow-sm font-semibold rounded-xl">
                            No questions added to this section. Click "Add" in left bank pane to assign questions here.
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                            {activeSec.questions.map((q, idx) => (
                              <div
                                key={q.id}
                                className="bg-white border border-slate-200 p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs"
                              >
                                <div className="flex-1 font-serif text-[11px] truncate text-slate-800 pr-2">
                                  <span className="font-sans font-bold text-[10px] mr-1.5 text-indigo-700 font-medium">Q.{idx+1}</span>
                                  <LaTeXPreview text={q.questionText} className="inline" />
                                </div>

                                {/* Reordering and Deleting tools */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveQuestion(activeSec.id, idx, 'UP')}
                                    disabled={idx === 0}
                                    className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-indigo-800 font-medium"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveQuestion(activeSec.id, idx, 'DOWN')}
                                    disabled={idx === activeSec.questions.length - 1}
                                    className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-indigo-800 font-medium"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveQuestionFromSection(activeSec.id, q.id)}
                                    className="p-1 hover:bg-red-950/20 text-indigo-700 font-medium hover:text-red-400 rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};







