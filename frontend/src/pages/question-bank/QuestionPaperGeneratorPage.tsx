import React, { useState } from 'react';
import { ChevronLeft, Sparkles, Upload, Save, Printer, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LiveLatexPreview } from '../../components/QuestionBank/LiveLatexPreview';
import api from '../../api/axios';

export const QuestionPaperGeneratorPage = () => {
  const navigate = useNavigate();
  
  // Paper Settings State
  const [schoolName, setSchoolName] = useState('SRI JYOTHI HIGH SCHOOL');
  const [examName, setExamName] = useState('FINAL EXAMINATION');
  const [maxMarks, setMaxMarks] = useState('100');
  const [time, setTime] = useState('3 Hours');
  
  // Editor State
  const [content, setContent] = useState(
    'Type your questions here...\n\nExample Math:\nSolve for x: $2x + 5 = 15$\n\nOr quadratic formula:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$'
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    toast.loading("AI is generating questions...", { id: 'ai-gen' });
    
    // Simulate AI generation delay
    setTimeout(() => {
      setContent(content + '\n\n**New AI Generated Question:**\nCalculate the integral of $\\int x^2 dx$.');
      setIsGenerating(false);
      toast.success("Questions generated!", { id: 'ai-gen' });
    }, 2000);
  };

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        toast.loading(`Analyzing ${file.name}...`, { id: 'upload' });
        // Simulate OCR parsing delay
        setTimeout(() => {
          setContent(content + '\n\n**Parsed from Document:**\nWhat is the value of $\\pi$ to 2 decimal places?');
          toast.success("Document parsed successfully!", { id: 'upload' });
        }, 3000);
      }
    };
    input.click();
  };

  const handleSave = async () => {
    toast.loading("Saving to Database...", { id: 'save' });
    try {
      // Future integration for POST /api/question-papers
      // await api.post('/api/question-papers', { schoolName, examName, content });
      setTimeout(() => {
        toast.success("Saved successfully!", { id: 'save' });
      }, 1000);
    } catch (err) {
      toast.error("Failed to save.", { id: 'save' });
    }
  };

  return (
    <div className="h-full flex flex-col print:block bg-slate-50">
      
      {/* Top Header (Hidden on Print) */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              AI Paper Generator
            </h1>
            <p className="text-sm text-slate-500">Dual-layout editor with Live LaTeX preview</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          <button
            onClick={handleAiGenerate}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 font-medium transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'AI Generate'}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Paper
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-900 font-medium transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print A4
          </button>
        </div>
      </div>

      {/* Main Dual Layout Content */}
      <div className="flex-1 flex overflow-hidden print:overflow-visible h-[calc(100vh-80px)] print:h-auto">
        
        {/* Left Side: Editor (Hidden on Print) */}
        <div className="w-1/2 p-6 overflow-y-auto border-r border-slate-200 bg-white print:hidden custom-scrollbar">
          
          <div className="mb-6 space-y-4">
            <h3 className="font-semibold text-slate-700 border-b pb-2">Paper Headings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">School Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-slate-50 border p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Exam Name</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-slate-50 border p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Max Marks</label>
                <input
                  type="text"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-slate-50 border p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Time</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-slate-50 border p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="h-full flex flex-col">
            <h3 className="font-semibold text-slate-700 border-b pb-2 mb-4 flex justify-between">
              <span>Question Content (LaTeX Support)</span>
              <span className="text-xs text-slate-400 font-normal">Use $ for inline, $$ for block math</span>
            </h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full rounded-xl border-slate-200 bg-slate-50 border p-4 font-mono text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none min-h-[400px]"
              placeholder="Type your questions here..."
            />
          </div>
        </div>

        {/* Right Side: Live Preview (Full Width on Print) */}
        <div className="w-1/2 p-8 overflow-y-auto bg-slate-100 print:w-full print:p-0 print:bg-white custom-scrollbar">
          <LiveLatexPreview 
            content={content}
            schoolName={schoolName}
            examName={examName}
            maxMarks={maxMarks}
            time={time}
          />
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        @media print {
          @page { margin: 0; size: A4; }
          body { -webkit-print-color-adjust: exact; background: white; }
          #root { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default QuestionPaperGeneratorPage;
