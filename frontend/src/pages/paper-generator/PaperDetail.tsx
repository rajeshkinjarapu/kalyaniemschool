import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { qbApi as api } from '../../utils/questionBankApi';
import { PrintablePaper } from '../../components/QuestionBank/PrintablePaper';
import { downloadTexFile } from '../../utils/latexExporter';
import {
  ArrowLeft,
  Download,
  FileCode,
  FileText,
  Printer,
  Sparkles,
  Eye,
  CheckSquare,
  BookOpen,
  Layout,
  RefreshCw,
} from 'lucide-react';

interface Question {
  id: number;
  subject: string;
  chapter: string;
  topic: string;
  type: string;
  difficulty: string;
  questionText: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctAnswer: string;
  solution: string;
  marks: number;
  negativeMarks: number;
  imageUrl?: string | null;
}

interface Section {
  id: string;
  name: string;
  type: string;
  questions: Question[];
}

interface Paper {
  id: number;
  title: string;
  duration: number;
  totalMarks: number;
  instructions: string;
  examDate?: string | null;
  watermark?: string | null;
  paperCode?: string | null;
  sections: Section[];
}

export const PaperDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Print States
  const [activeSet, setActiveSet] = useState('A');
  const [showWatermark, setShowWatermark] = useState(true);
  const [showOmr, setShowOmr] = useState(true);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showSolutions, setShowSolutions] = useState(false);
  const [isDoubleColumn, setIsDoubleColumn] = useState(false);
  const [optionLabelType, setOptionLabelType] = useState<'ALPHA' | 'NUMERIC'>('NUMERIC');

  // PDF generation loader
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Fetch paper details
  const fetchPaperDetails = async (setVal = activeSet) => {
    if (!id) return;
    setLoading(true);
    try {
      let res;
      if (setVal === 'A') {
        res = await api.getPaper(parseInt(id));
      } else {
        res = await api.getPaperScrambled(parseInt(id), setVal);
      }
      setPaper(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load paper details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaperDetails(activeSet);
  }, [id, activeSet]);

  const handleSetChange = (setCode: string) => {
    setActiveSet(setCode);
  };

  // Triggers browser print dialog
  const handleClientPrint = () => {
    window.print();
  };

  // Calls the Puppeteer backend to render PDF
  const handleServerPdfExport = async () => {
    if (!printAreaRef.current || !paper) return;
    setGeneratingPdf(true);
    try {
      // Fetch the print element's inner HTML (contains pre-rendered KaTeX symbols as pure SVG/HTML!)
      const printHtml = printAreaRef.current.innerHTML;

      const blob = await api.exportPdf(printHtml);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${paper.title.replace(/\s+/g, '_').toLowerCase()}_set_${activeSet}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF via backend. Attempting local client print fallback.');
      window.print();
    } finally {
      setGeneratingPdf(false);
    }
  };

  // LaTeX Source Code Download (.tex)
  const handleLatexExport = () => {
    if (!paper) return;
    downloadTexFile(paper);
  };

  if (loading && !paper) {
    return (
      <div className="min-h-screen bg-slate-50 text-indigo-950 font-medium flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-t-indigo-600 border-slate-300 rounded-full animate-spin" />
          <p className="text-indigo-700 font-medium text-sm">Compiling LaTeX elements...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-slate-50 text-indigo-950 font-medium flex items-center justify-center font-sans">
        <div className="text-center">
          <h2 className="text-xl font-bold">Paper Not Found</h2>
          <Link to="/question-bank" className="text-indigo-600 hover:underline mt-2 inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-indigo-950 font-medium font-sans pb-16 print:bg-white print:pb-0">
      {/* Interactive Controls Nav (Hidden in print) */}
      <header className="border-b border-slate-200 bg-gradient-to-r from-indigo-100/90 via-purple-100/90 to-pink-100/90 backdrop-blur-md sticky top-0 z-30 print:hidden">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/question-bank" className="p-2 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl transition-colors text-slate-600">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-extrabold text-sm text-slate-700 line-clamp-1 max-w-xs md:max-w-md">
              Preview: {paper.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLatexExport}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all"
              title="Download LaTeX Source"
            >
              <FileCode className="w-4 h-4 text-orange-500" />
              <span className="hidden sm:inline">LaTeX Source</span>
            </button>

            <button
              onClick={handleClientPrint}
              className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition-all"
              title="Print Booklet"
            >
              <Printer className="w-4 h-4 text-teal-500" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={handleServerPdfExport}
              disabled={generatingPdf}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-accentPurple hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {generatingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF Booklet</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Control Panel Grid (Hidden in print) */}
      <div className="max-w-7xl mx-auto px-4 pt-6 grid grid-cols-1 lg:grid-cols-4 gap-6 print:hidden">
        
        {/* Toggle options bar */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-5 space-y-5 h-fit shadow-sm">
          <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-700 font-medium border-b border-slate-100 pb-2">
            Configure View
          </h3>

          {/* Randomizer Set Swapper */}
          <div>
            <label className="block text-xs font-semibold text-indigo-700 font-medium uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-500 animate-pulse" />
              Anti-Cheating Set (Randomized)
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {['A', 'B', 'C', 'D'].map((setCode) => (
                <button
                  key={setCode}
                  type="button"
                  onClick={() => handleSetChange(setCode)}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeSet === setCode
                      ? 'bg-indigo-600 text-white'
                      : 'text-indigo-700 font-medium hover:text-slate-700'
                  }`}
                >
                  Set {setCode}
                </button>
              ))}
            </div>
            <p className="text-[9px] text-indigo-700 font-medium font-sans mt-1">
              Automatically scrambles question index ordering and MCQ option sets dynamically.
            </p>
          </div>

          {/* Document Mode selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-indigo-700 font-medium uppercase tracking-wider">
              Document Layout Mode
            </label>

            <button
              onClick={() => {
                setShowAnswerKey(false);
                setShowSolutions(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                !showAnswerKey && !showSolutions
                  ? 'bg-indigo-600/10 text-indigo-600 border-indigo-600/30'
                  : 'bg-slate-50 border-transparent text-indigo-700 font-medium hover:bg-slate-100'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>Full Question Booklet</span>
            </button>

            <button
              onClick={() => {
                setShowAnswerKey(true);
                setShowSolutions(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                showAnswerKey
                  ? 'bg-teal-500/10 text-teal-500 border-teal-500/30'
                  : 'bg-slate-50 border-transparent text-indigo-700 font-medium hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Answer Key Matrix</span>
            </button>

            <button
              onClick={() => {
                setShowSolutions(true);
                setShowAnswerKey(false);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-2 ${
                showSolutions
                  ? 'bg-accentPurple/10 text-accentPurple border-accentPurple/30'
                  : 'bg-slate-50 border-transparent text-indigo-700 font-medium hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Detailed Solutions PDF</span>
            </button>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <label className="block text-xs font-semibold text-indigo-700 font-medium uppercase tracking-wider">
              Exam Properties
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showWatermark}
                onChange={(e) => setShowWatermark(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded border-slate-300 focus:ring-0"
              />
              <span>Render Watermarking</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-700">
              <input
                type="checkbox"
                checked={showOmr}
                onChange={(e) => setShowOmr(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded border-slate-300 focus:ring-0"
              />
              <span>Include OMR Response Sheet</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-700">
              <input
                type="checkbox"
                checked={isDoubleColumn}
                onChange={(e) => setIsDoubleColumn(e.target.checked)}
                className="w-4 h-4 accent-indigo-600 rounded border-slate-300 focus:ring-0"
              />
              <span>Double-Column booklet layout</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-700">
              <input
                type="checkbox"
                checked={optionLabelType === 'NUMERIC'}
                onChange={(e) => setOptionLabelType(e.target.checked ? 'NUMERIC' : 'ALPHA')}
                className="w-4 h-4 accent-indigo-600 rounded border-slate-300 focus:ring-0"
              />
              <span>Numeric option labels (1, 2, 3, 4)</span>
            </label>
          </div>
        </div>

        {/* Paper Sheet Preview Area (Right 3 Columns) */}
        <div className="lg:col-span-3 overflow-x-auto p-4 bg-white border border-slate-200 rounded-3xl min-h-[600px] flex justify-center items-start shadow-sm">
          <div ref={printAreaRef} className="print:block">
            <PrintablePaper
              paper={paper}
              showWatermark={showWatermark}
              showOmr={showOmr}
              showAnswerKey={showAnswerKey}
              showSolutions={showSolutions}
              isDoubleColumn={isDoubleColumn}
              optionLabelType={optionLabelType}
            />
          </div>
        </div>
      </div>

      {/* Print only CSS wrapper block */}
      <div className="hidden print:block">
        <PrintablePaper
          paper={paper}
          showWatermark={showWatermark}
          showOmr={showOmr}
          showAnswerKey={showAnswerKey}
          showSolutions={showSolutions}
          isDoubleColumn={isDoubleColumn}
          optionLabelType={optionLabelType}
        />
      </div>
    </div>
  );
};





