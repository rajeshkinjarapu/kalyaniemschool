import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { qbApi as api } from '../../utils/questionBankApi';
import { QuestionForm } from '../../components/QuestionBank/QuestionForm';
import { LaTeXPreview } from '../../components/QuestionBank/LaTeXPreview';
import {
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Trash2,
  Edit,
  SlidersHorizontal,
  ChevronDown,
  X,
  Database,
  GraduationCap,
  PlusCircle,
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
  marks: number;
  negativeMarks: number;
  tags: string;
}

export const QuestionBank: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [importPrefill, setImportPrefill] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);

  const handleSmartImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImporting(true);
      try {
        const res = await api.importQuestion(file);
        setImportPrefill(res.question);
        setActiveQuestionId(null);
        setShowForm(true); // Open prefilled editor
        alert(res.message);
      } catch (err: any) {
        alert(err.message || 'Smart import failed. Make sure the server is online.');
      } finally {
        setImporting(false);
        // Reset file input value so same file can be selected again
        e.target.value = '';
      }
    }
  };

  // Filter states
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');
  const [tag, setTag] = useState('');
  const [availableChapters, setAvailableChapters] = useState<string[]>([]);
  const [chapter, setChapter] = useState('');

  // Stats
  const [meta, setMeta] = useState<any>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const filters = {
        subject,
        difficulty,
        type,
        search,
        tag,
        chapter,
      };
      const res = await api.getQuestions(filters);
      setQuestions(res.questions);
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [subject, difficulty, type, tag, chapter]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const metaRes = await api.getQuestionMeta();
        setMeta(metaRes.meta);
        if (subject && metaRes.meta[subject]) {
          setAvailableChapters(metaRes.meta[subject].chapters);
        } else {
          // Flatten all chapters
          const allChapters = Object.values(metaRes.meta).flatMap((m: any) => m.chapters);
          setAvailableChapters(Array.from(new Set(allChapters)));
        }
      } catch (err) {
        console.error('Failed to load metadata:', err);
      }
    };
    fetchMetadata();
  }, [subject, questions.length]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  const handleClearFilters = () => {
    setSearch('');
    setSubject('');
    setDifficulty('');
    setType('');
    setTag('');
    setChapter('');
    // Trigger list fetch
    setTimeout(() => fetchQuestions(), 50);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this question? This cannot be undone.')) return;
    try {
      await api.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete question');
    }
  };

  const handleEdit = (id: number) => {
    setActiveQuestionId(id);
    setShowForm(true);
  };

  const handleCreate = () => {
    setActiveQuestionId(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setActiveQuestionId(null);
    setImportPrefill(null); // Reset prefilled data
    fetchQuestions(); // Refresh lists after saving
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-slate-800 font-sans pb-12">
      {/* Header Banner */}
      <nav className="border-b border-slate-200 bg-gradient-to-r from-indigo-100/90 via-purple-100/90 to-pink-100/90 backdrop-blur-md sticky top-0 z-30">
        <div className="w-full mx-auto px-2 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/question-bank" className="p-2 hover:bg-slate-100 border border-slate-200 hover:border-slate-350 rounded-xl transition-colors text-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-teal-500">
              JEE Master Question Bank
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              id="smart-import-input"
              className="hidden"
              accept=".txt,.docx,.pdf,image/*"
              onChange={handleSmartImport}
              disabled={importing}
            />
            <label
              htmlFor="smart-import-input"
              className={`px-4 py-2 border border-slate-200 bg-white hover:bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer select-none transition-all shadow-sm ${
                importing ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <PlusCircle className="w-4 h-4 text-teal-500" />
              <span>{importing ? 'Scanning...' : 'Smart Import (Photo/Doc)'}</span>
            </label>

            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-teal-500 hover:brightness-110 text-white rounded-xl text-xs font-semibold shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <main className="w-full mx-auto px-2 lg:px-6 pt-4">
        {showForm ? (
          <div className="animate-fadeIn">
            <QuestionForm
              questionId={activeQuestionId}
              initialData={importPrefill}
              onSuccess={handleFormClose}
              onCancel={handleFormClose}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filter Panel (Left) */}
            <div className="bg-white/90 backdrop-blur-xl border-2 border-indigo-100 rounded-3xl p-6 shadow-xl shadow-indigo-200/50 h-fit space-y-5 shadow-sm text-slate-800">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm flex items-center gap-1.5 text-slate-800">
                  <SlidersHorizontal className="w-4 h-4 text-teal-500" />
                  Filter Bank
                </h3>
                <button
                  onClick={handleClearFilters}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-800"
                >
                  Clear All
                </button>
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Subject
                </label>
                <div className="flex flex-col gap-1">
                  {(meta ? Object.keys(meta) : ['Physics', 'Chemistry', 'Mathematics']).map((subj) => (
                    <button
                      key={subj}
                      onClick={() => setSubject(subject === subj ? '' : subj)}
                      className={`text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                        subject === subj
                          ? 'bg-indigo-600 text-white shadow-md border-indigo-600'
                          : 'bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapter Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Chapter
                </label>
                <select
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl p-2 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 font-sans"
                >
                  <option value="">All Chapters</option>
                  {availableChapters.map((ch) => (
                    <option key={ch} value={ch}>
                      {ch}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl p-2 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 font-sans"
                >
                  <option value="">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Question Type Filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Question Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl p-2 text-xs focus:outline-none focus:border-indigo-600 text-slate-700 font-sans"
                >
                  <option value="">All Types</option>
                  <option value="MCQ_SINGLE">MCQ Single Correct</option>
                  <option value="MCQ_MULTI">MCQ Multi Correct</option>
                  <option value="NUMERICAL">Numerical/Integer Type</option>
                </select>
              </div>

              {/* Tag Search */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. pyq-2025"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-white border border-slate-250 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-600 font-sans"
                />
              </div>
            </div>

            {/* Questions Bank List (Right) */}
            <div className="lg:col-span-3 space-y-4">
              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search question text, concepts, equations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-slate-800 focus:outline-none focus:border-indigo-600 transition-colors text-sm font-sans shadow-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-slate-100 border border-slate-200 text-slate-700 rounded-2xl text-sm font-medium hover:bg-slate-200 transition-colors shadow-sm"
                >
                  Search
                </button>
              </form>

              {/* Questions List */}
              {loading ? (
                <div className="text-center py-20 text-slate-400 font-sans">
                  <div className="w-10 h-10 border-4 border-t-indigo-600 border-slate-350 rounded-full animate-spin mx-auto mb-3" />
                  <span>Filtering bank records...</span>
                </div>
              ) : questions.length === 0 ? (
                <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <Database className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-700">No questions found matching criteria</h3>
                  <p className="text-slate-500 text-xs mt-1">
                    Try adjusting your filters, clearing your search query, or add a new question to seed this category.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div
                      key={q.id}
                      className="bg-white border border-slate-200 hover:border-indigo-600/30 rounded-2xl p-5 transition-all shadow-sm flex flex-col justify-between hover:shadow-md"
                    >
                      <div>
                        {/* Meta Line */}
                        <div className="flex justify-between items-start gap-4 mb-3 font-sans text-[10px] text-slate-450 font-semibold">
                          <div className="flex gap-2 items-center flex-wrap">
                            <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                              q.subject === 'Physics' ? 'bg-amber-500/10 text-amber-700 border border-amber-200/20' :
                              q.subject === 'Chemistry' ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-200/20' :
                              'bg-blue-500/10 text-blue-700 border border-blue-200/20'
                            }`}>
                              {q.subject}
                            </span>
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded uppercase">
                              {q.difficulty}
                            </span>
                            <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded uppercase">
                              {q.type.replace('_', ' ')}
                            </span>
                            {q.tags && q.tags.split(',').map((t) => (
                              <span key={t} className="text-teal-500 bg-teal-500/5 border border-teal-500/10 px-2 py-0.5 rounded text-[8px]">
                                #{t.trim()}
                              </span>
                            ))}
                          </div>

                          <div className="text-slate-400 uppercase flex-shrink-0">
                            ID: {q.id} | {q.chapter}
                          </div>
                        </div>

                        {/* Question Preview Box (White Sheet Mockup) */}
                        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50/50 border border-slate-150 rounded-xl p-4 font-serif text-[13px] text-slate-800">
                          <LaTeXPreview text={q.questionText} />
                        </div>
                      </div>

                      {/* Solutions Toggle & Actions */}
                      <div className="flex justify-between items-center mt-4 border-t border-slate-100 pt-3 text-xs font-sans">
                        <div className="text-slate-500 font-semibold">
                          Ans: <span className="font-mono text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">{q.correctAnswer}</span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(q.id)}
                            className="p-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:bg-slate-100 hover:text-indigo-600 border border-slate-200 hover:border-indigo-600/30 rounded-lg text-slate-500 transition-colors"
                            title="Edit Question"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="p-2 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 hover:bg-red-50 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg text-slate-500 transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};






