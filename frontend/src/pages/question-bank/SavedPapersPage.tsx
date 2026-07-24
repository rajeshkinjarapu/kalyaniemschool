import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Edit2, Trash2, Plus, Search, Calendar, BookOpen, Clock, ChevronLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../api/axios';

interface GeneratedPaper {
  id: string;
  examName: string;
  examSubject: string;
  examDate: string;
  time: string;
  instructions: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

const SavedPapersPage = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<GeneratedPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/generated-papers');
      setPapers(response.data);
    } catch (err) {
      toast.error('Failed to load saved papers.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/generated-papers/${deleteId}`);
      toast.success('Paper deleted successfully!');
      setPapers(prev => prev.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete paper.');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = papers.filter(p =>
    p.examName.toLowerCase().includes(search.toLowerCase()) ||
    p.examSubject.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch { return dateStr; }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/question-bank')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-4 text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Question Bank
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Saved AI Papers</h1>
            <p className="text-slate-500 mt-1 text-sm">{papers.length} paper{papers.length !== 1 ? 's' : ''} saved in database</p>
          </div>
          <button
            onClick={() => navigate('/question-bank/generator')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            New Paper
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by exam name or subject..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mb-4" />
          <p className="text-sm">Loading papers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <FileText className="w-16 h-16 mb-4 text-slate-200" />
          <p className="text-lg font-semibold text-slate-500">No papers found</p>
          <p className="text-sm mt-1">Create a paper using AI Paper Generator and save it.</p>
          <button
            onClick={() => navigate('/question-bank/generator')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Create New Paper
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(paper => (
            <div
              key={paper.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-blue-500 px-5 py-4">
                <h3 className="text-white font-bold text-base truncate">{paper.examName}</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-200" />
                  <span className="text-indigo-100 text-xs font-medium truncate">{paper.examSubject}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="px-5 py-4 space-y-2.5">
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Exam: {paper.examDate || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-xs">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Duration: {paper.time || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs border-t border-slate-100 pt-2.5">
                  <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Saved: {formatDate(paper.createdAt)}</span>
                </div>

                {/* Preview snippet */}
                <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500 leading-relaxed max-h-14 overflow-hidden line-clamp-3">
                  {paper.content?.slice(0, 120) || 'No content'}...
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 px-5 pb-4">
                <button
                  onClick={() => navigate(`/question-bank/generator?id=${paper.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => setDeleteId(paper.id)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Delete Paper?</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedPapersPage;
