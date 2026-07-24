import React, { useState } from 'react';
import { ChevronLeft, Sparkles, Upload, Save, Printer, FileText, Settings, Maximize, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LiveLatexPreview } from '../../components/QuestionBank/LiveLatexPreview';

export const QuestionPaperGeneratorPage = () => {
  const navigate = useNavigate();
  
  // Paper Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('SRI JYOTHI HIGH SCHOOL');
  const [examName, setExamName] = useState('FINAL EXAMINATION');
  const [maxMarks, setMaxMarks] = useState('100');
  const [time, setTime] = useState('3 Hours');
  const [instructions, setInstructions] = useState('Answer all questions.\nEach question carries equal marks.\nRead questions carefully before answering.');
  
  // Editor State
  const [content, setContent] = useState(
    '1. What is the capital of France?\n(A) London\n(B) Paris\n(C) Berlin\n(D) Madrid\n\n2. Solve for x: $2x + 5 = 15$\n(A) 2\n(B) 4\n(C) 5\n(D) 10\n\n3. Which of the following is the quadratic formula?\n(A) $x = \\frac{b}{2a}$\n(B) $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n(C) $x = mc^2$\n(D) $x = y + c$'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current) {
        containerRef.current.requestFullscreen().catch((err) => {
          toast.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleAiGenerate = async () => {
    setIsGenerating(true);
    toast.loading("AI is generating questions...", { id: 'ai-gen' });
    
    setTimeout(() => {
      setContent(content + '\n\n4. Calculate the integral of $\\int x^2 dx$.\n(A) $x^3 + C$\n(B) $\\frac{x^3}{3} + C$\n(C) $2x$\n(D) $x^2 + C$');
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
        setTimeout(() => {
          setContent(content + '\n\n5. What is the value of $\\pi$ to 2 decimal places?\n(A) 3.14\n(B) 3.15\n(C) 3.12\n(D) 3.16');
          toast.success("Document parsed successfully!", { id: 'upload' });
        }, 3000);
      }
    };
    input.click();
  };

  const handleSave = async () => {
    toast.loading("Saving to Database...", { id: 'save' });
    try {
      setTimeout(() => {
        toast.success("Saved successfully!", { id: 'save' });
      }, 1000);
    } catch (err) {
      toast.error("Failed to save.", { id: 'save' });
    }
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[100] flex flex-col print:block bg-slate-50">
      
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
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
            title="Full Screen"
          >
            <Maximize className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Paper Settings
          </button>
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
          <div className="h-full flex flex-col pb-20">
            <h3 className="font-semibold text-slate-700 border-b pb-2 mb-4 flex justify-between">
              <span>Question Content (LaTeX Support)</span>
              <span className="text-xs text-slate-400 font-normal">Format: 1. Question (A) Opt (B) Opt</span>
            </h3>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full rounded-xl border-slate-200 bg-slate-50 border p-5 font-mono text-base leading-relaxed focus:ring-2 focus:ring-blue-500/20 outline-none resize-none min-h-[400px]"
              placeholder="1. Question text&#10;(A) Option A&#10;(B) Option B&#10;(C) Option C&#10;(D) Option D"
            />
          </div>
        </div>

        {/* Right Side: Live Preview (Full Width on Print) */}
        <div className="w-1/2 p-8 overflow-y-auto bg-slate-100 print:w-full print:p-0 print:bg-white custom-scrollbar flex justify-center">
          <div className="paper-zoom origin-top transition-transform">
            <LiveLatexPreview 
              content={content}
              schoolName={schoolName}
              examName={examName}
              maxMarks={maxMarks}
              time={time}
              instructions={instructions.split('\n').filter(i => i.trim() !== '')}
            />
          </div>
        </div>

      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" /> Paper Settings
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Exam Name</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="text"
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">General Instructions (One per line)</label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none h-24 transition-all"
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .paper-zoom { zoom: 0.8; }
        /* Firefox fallback */
        @-moz-document url-prefix() {
          .paper-zoom { transform: scale(0.8); transform-origin: top center; margin-bottom: -20%; }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        
        @media print {
          .paper-zoom { zoom: 1 !important; transform: none !important; margin: 0 !important; }
          @page { margin: 10mm; size: A4; }
          body { -webkit-print-color-adjust: exact; background: white; }
          #root { display: block !important; }
        }
      `}</style>
    </div>
  );
};

export default QuestionPaperGeneratorPage;
