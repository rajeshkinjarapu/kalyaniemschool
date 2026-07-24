import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Sparkles, Upload, Save, Printer, FileText, Settings, Maximize, X, Wand2, BookOpen, ImagePlus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LiveLatexPreview } from '../../components/QuestionBank/LiveLatexPreview';
import { api } from '../../api/axios';

export const QuestionPaperGeneratorPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paperId = searchParams.get('id');
  const [isSaving, setIsSaving] = useState(false);
  
  // Paper Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [examName, setExamName] = useState('FINAL EXAMINATION');
  const [examSubject, setExamSubject] = useState('GRAND TEST');
  const [examDate, setExamDate] = useState('');
  const [maxMarks, setMaxMarks] = useState('100');
  const [time, setTime] = useState('75');
  const [instructions, setInstructions] = useState('Answer all questions.\nEach question carries equal marks.\nRead questions carefully before answering.');
  const [logoBase64, setLogoBase64] = useState<string>(() => {
    return localStorage.getItem('jy_school_logo') || '';
  });
  
  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiSourceType, setAiSourceType] = useState('text');
  const [aiInput, setAiInput] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [aiImageBase64, setAiImageBase64] = useState<string>('');
  const [aiImageMimeType, setAiImageMimeType] = useState<string>('');
  
  // Settings State
  const [activeAiModel, setActiveAiModel] = useState<string>(() => {
    return localStorage.getItem('jy_active_ai_model') || 'gemini';
  });
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('jy_gemini_api_key') || '';
  });
  const [claudeApiKey, setClaudeApiKey] = useState<string>(() => {
    return localStorage.getItem('jy_claude_api_key') || '';
  });
  const [chatgptApiKey, setChatgptApiKey] = useState<string>(() => {
    return localStorage.getItem('jy_chatgpt_api_key') || '';
  });
  const [deepseekApiKey, setDeepseekApiKey] = useState<string>(() => {
    return localStorage.getItem('jy_deepseek_api_key') || '';
  });
  const [isDoubleColumn, setIsDoubleColumn] = useState(false);
  
  // Editor State
  const [content, setContent] = useState(
    '1. What is the capital of France?\n(A) London\n(B) Paris\n(C) Berlin\n(D) Madrid\n\n2. Solve for x: $2x + 5 = 15$\n(A) 2\n(B) 4\n(C) 5\n(D) 10\n\n3. Which of the following is the quadratic formula?\n(A) $x = \\frac{b}{2a}$\n(B) $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n(C) $x = mc^2$\n(D) $x = y + c$'
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inline Images State: { id: dataURL }
  const [inlineImages, setInlineImages] = useState<Record<string, string>>({});
  const imageInputRef = useRef<HTMLInputElement>(null);

  const generateImageId = () => Math.random().toString(36).substring(2, 8);

  const insertImageAtCursor = (dataUrl: string) => {
    const id = generateImageId();
    setInlineImages(prev => ({ ...prev, [id]: dataUrl }));
    const marker = `[IMG:${id}]`;
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = content.substring(0, start);
      const after = content.substring(end);
      setContent(before + marker + after);
      // Restore cursor after marker
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + marker.length;
        ta.focus();
      }, 0);
    } else {
      setContent(prev => prev + '\n' + marker);
    }
    toast.success('Image inserted!');
  };

  const handleEditorPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            insertImageAtCursor(dataUrl);
          };
          reader.readAsDataURL(blob);
        }
        return;
      }
    }
    // If no image, let normal text paste happen
  };

  const handleImageUploadForEditor = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG/PNG).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large! Max 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      insertImageAtCursor(dataUrl);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  // Serialize images into content for saving, deserialize on load
  const serializeContent = (): string => {
    // Find which image IDs are actually used
    const usedIds = (content.match(/\[IMG:([a-z0-9]+)\]/g) || []).map(m => m.slice(5, -1));
    const usedImages: Record<string, string> = {};
    usedIds.forEach(id => { if (inlineImages[id]) usedImages[id] = inlineImages[id]; });
    if (Object.keys(usedImages).length === 0) return content;
    return content + '\n<!--INLINE_IMAGES:' + JSON.stringify(usedImages) + '-->';
  };

  const deserializeContent = (raw: string): { text: string; images: Record<string, string> } => {
    const imgMatch = raw.match(/\n<!--INLINE_IMAGES:(.*?)-->$/);
    if (imgMatch) {
      try {
        const images = JSON.parse(imgMatch[1]);
        const text = raw.substring(0, raw.indexOf('\n<!--INLINE_IMAGES:'));
        return { text, images };
      } catch { return { text: raw, images: {} }; }
    }
    return { text: raw, images: {} };
  };

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

  const handleAiPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
             const result = event.target?.result as string;
             const [prefix, base64] = result.split(',');
             const mime = prefix.split(':')[1].split(';')[0];
             setAiImageBase64(base64);
             setAiImageMimeType(mime);
             toast.success("Image pasted successfully! You can now generate.");
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleAiFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large! Maximum size is 10MB.');
      return;
    }
    // For text-based files (TEX, TXT, CSV), read as text and put in editor
    const textTypes = ['.tex', '.txt', '.csv', '.md'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (textTypes.includes(ext) || file.type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setAiInput(text);
        setAiSourceType('text');
        toast.success(`${file.name} loaded as text! You can now add instructions and generate.`);
      };
      reader.readAsText(file);
      return;
    }
    // For images, PDFs, and other binary files, read as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const [prefix, base64] = result.split(',');
      const mime = prefix.split(':')[1].split(';')[0];
      setAiImageBase64(base64);
      setAiImageMimeType(mime);
      setAiSourceType('text');
      toast.success(`${file.name} uploaded! You can now add text instructions and generate.`);
    };
    reader.readAsDataURL(file);
  };

  const handleAiGenerate = async () => {
    if (aiSourceType === 'file') {
      toast.error("Please select an image file first.");
      return;
    }

    if (!aiInput.trim() && !aiImageBase64) {
      toast.error("Please enter some text, paste an image, or provide a URL.");
      return;
    }

    setIsGenerating(true);
    toast.loading("AI is analyzing and generating...", { id: 'ai-gen' });
    
    try {
      const finalPrompt = aiInstructions 
        ? `Instructions: ${aiInstructions}\n\nContent:\n${aiInput}` 
        : aiInput;

      let selectedKey = undefined;
      if (activeAiModel === 'gemini') selectedKey = geminiApiKey;
      else if (activeAiModel === 'claude') selectedKey = claudeApiKey;
      else if (activeAiModel === 'chatgpt') selectedKey = chatgptApiKey;
      else if (activeAiModel === 'deepseek') selectedKey = deepseekApiKey;

      const payload: any = {
        text: finalPrompt,
        subject: 'General',
        apiKey: selectedKey || undefined,
        aiModel: activeAiModel
      };
      
      if (aiImageBase64) {
        payload.imageBase64 = aiImageBase64;
        payload.imageMimeType = aiImageMimeType;
      }

      const response = await api.post('/api/questions/import-ai', payload);

      const questions = response.data.questions || [];
      
      if (questions.length === 0) {
        toast.error("No questions could be generated. Try different text.", { id: 'ai-gen' });
        setIsGenerating(false);
        return;
      }

      let generatedText = '\n\n';
      const lines = content.split('\n');
      let maxQ = 0;
      for (const line of lines) {
        const match = line.match(/^(\d+)\.\s/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxQ) maxQ = num;
        }
      }

      questions.forEach((q: any, i: number) => {
        generatedText += `${maxQ + i + 1}. ${q.questionText}\n`;
        if (q.optionA) generatedText += `(A) ${q.optionA}\n`;
        if (q.optionB) generatedText += `(B) ${q.optionB}\n`;
        if (q.optionC) generatedText += `(C) ${q.optionC}\n`;
        if (q.optionD) generatedText += `(D) ${q.optionD}\n`;
        generatedText += '\n';
      });

      setContent(content.trim() + generatedText);
      setIsGenerating(false);
      setAiImageBase64('');
      setAiImageMimeType('');
      toast.success(`${questions.length} questions generated successfully!`, { id: 'ai-gen' });
    } catch (error: any) {
      console.error(error);
      setIsGenerating(false);
      toast.error("AI Generation failed: " + (error.response?.data?.message || error.message), { id: 'ai-gen' });
    }
  };

  const autoFormatText = () => {
    const lines = content.split('\n');
    let formatted = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        formatted.push('');
        continue;
      }
      
      // Handle inline options like "A) 2V B) 200V C) 20V D) 10V"
      const optionRegex = /\b([a-dA-D])[\)\.]\s+/g;
      if (line.match(optionRegex) && (line.match(optionRegex)?.length ?? 0) > 1) {
         line = line.replace(/\b([a-dA-D])[\)\.]\s+/g, (match, letter) => `\n(${letter.toUpperCase()}) `);
         line = line.trim();
      }
      
      // Format standard options "A) " -> "(A) "
      line = line.replace(/^\b([a-dA-D])[\)\.]\s+/i, (match, letter) => `(${letter.toUpperCase()}) `);
      
      // Auto-wrap math expressions with $ if not already wrapped
      if (!line.includes('$')) {
          // Wrap trig functions with angles like tan 90^\circ
          line = line.replace(/\b(sin|cos|tan|sec|csc|cot)\s+([0-9]+[\^\_\\][a-zA-Z0-9{}]+)/gi, '$$$1 $2$$');
          
          // Wrap standalone math symbols like \sqrt{3}/2, \frac{1}{2}, x^2, \theta
          line = line.replace(/(?<!\$)([0-9a-zA-Z]*[\^\_\\][a-zA-Z0-9{}]+(?:\/[0-9a-zA-Z]+)?)(?!\$)/g, '$$$&$$');
          
          // For options that look purely mathematical (e.g. "1/2", "0", "1"), optionally wrap them too
          line = line.replace(/^(\([A-D]\))\s+([\d\.\-\+\*\/]+)$/g, '$1 $$$2$$');
      }

      // Add newline before question numbers if missing
      if (/^\d+[\.\)]\s/.test(line)) {
        if (formatted.length > 0 && formatted[formatted.length - 1] !== '') {
          formatted.push('');
        }
        line = line.replace(/^(\d+)[\.\)]\s/, '$1. ');
      }
      
      formatted.push(line);
    }
    
    // Convert any single newlines within options to correct format if they got squished, but simple join is usually fine
    setContent(formatted.join('\n'));
    toast.success("Auto-formatted text!");
  };

  // Load paper from DB if editing
  useEffect(() => {
    if (!paperId) return;
    const loadPaper = async () => {
      try {
        toast.loading('Loading paper...', { id: 'load' });
        const res = await api.get(`/generated-papers/${paperId}`);
        const p = res.data;
        setExamName(p.examName || '');
        setExamSubject(p.examSubject || '');
        setExamDate(p.examDate || '');
        setTime(p.time || '');
        setInstructions(p.instructions || '');
        const { text, images } = deserializeContent(p.content || '');
        setContent(text);
        setInlineImages(images);
        toast.success('Paper loaded!', { id: 'load' });
      } catch {
        toast.error('Failed to load paper.', { id: 'load' });
      }
    };
    loadPaper();
  }, [paperId]);

  const handleSave = async () => {
    setIsSaving(true);
    toast.loading(paperId ? 'Updating paper...' : 'Saving paper...', { id: 'save' });
    try {
      const serializedContent = serializeContent();
      const payload = { examName, examSubject, examDate, time, instructions, content: serializedContent };
      if (paperId) {
        await api.put(`/generated-papers/${paperId}`, payload);
        toast.success('Paper updated successfully!', { id: 'save' });
      } else {
        const res = await api.post('/generated-papers', payload);
        toast.success('Paper saved! You can now find it in Saved Papers.', { id: 'save' });
        // Redirect to the edit URL so Save button becomes Update
        navigate(`/question-bank/generator?id=${res.data.id}`, { replace: true });
      }
    } catch (err) {
      toast.error('Failed to save paper.', { id: 'save' });
    } finally {
      setIsSaving(false);
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
            onClick={() => navigate('/question-bank/saved-papers')}
            className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2 text-sm font-medium"
            title="Saved Papers"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Saved Papers</span>
          </button>
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
            onClick={() => setIsAiModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 font-medium transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            ✨ AI Generate
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : paperId ? 'Update Paper' : 'Save Paper'}
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
            <h3 className="font-semibold text-slate-700 border-b pb-2 mb-4 flex justify-between items-center">
              <span>Question Content (LaTeX Support)</span>
              <button 
                onClick={autoFormatText}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 border border-blue-200 shadow-sm"
              >
                <Wand2 className="w-3.5 h-3.5" /> Auto-Align Format
              <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={imageInputRef} 
                  accept="image/*" 
                  onChange={handleImageUploadForEditor} 
                  className="hidden" 
                />
                <button 
                  onClick={() => imageInputRef.current?.click()}
                  className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-1.5 border border-purple-200 shadow-sm"
                >
                  <ImagePlus className="w-3.5 h-3.5" /> Insert Image
                </button>
                <button 
                  onClick={autoFormatText}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5 border border-blue-200 shadow-sm"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Auto-Align Format
                </button>
              </div>
            </h3>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={handleEditorPaste}
              className="flex-1 w-full rounded-xl border-slate-200 bg-slate-50 border p-5 font-mono text-base leading-relaxed focus:ring-2 focus:ring-blue-500/20 outline-none resize-none min-h-[400px]"
              placeholder="1. Question text&#10;(A) Option A&#10;(B) Option B&#10;(C) Option C&#10;(D) Option D&#10;&#10;Tip: You can paste images directly (Ctrl+V) or click 'Insert Image'!"
            />
          </div>
        </div>

        {/* Right Side: Live Preview (Full Width on Print) */}
        <div className="w-1/2 overflow-y-auto bg-slate-100 print:w-full print:bg-white custom-scrollbar flex flex-col relative">
          <div className="sticky top-0 z-10 bg-slate-100/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex justify-between items-center print:hidden">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              Live Preview
            </h3>
            <div className="flex bg-slate-200 rounded-lg p-1">
              <button 
                onClick={() => setIsDoubleColumn(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${!isDoubleColumn ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Single View
              </button>
              <button 
                onClick={() => setIsDoubleColumn(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${isDoubleColumn ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Double View
              </button>
            </div>
          </div>
          <div className="flex justify-center p-8 print:p-0">
            <div className="paper-zoom origin-top transition-transform">
            <LiveLatexPreview 
              content={content}
              examName={examName}
              examDate={examDate}
              examSubject={examSubject}
              logoBase64={logoBase64}
              maxMarks={maxMarks}
              time={time}
              instructions={instructions.split('\n').filter(i => i.trim() !== '')}
              isDoubleColumn={isDoubleColumn}
              inlineImages={inlineImages}
            />
          </div>
          </div>
        </div>

      </div>

      {/* AI Generate Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" /> AI Generate & Upload
              </h2>
              <button onClick={() => setIsAiModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Source Tabs */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                <button 
                  onClick={() => setAiSourceType('text')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${aiSourceType === 'text' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  📝 Text Prompt
                </button>
                <button 
                  onClick={() => setAiSourceType('file')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${aiSourceType === 'file' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  📄 Upload File
                </button>
                <button 
                  onClick={() => setAiSourceType('url')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${aiSourceType === 'url' ? 'bg-white shadow text-blue-600' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  🔗 Website Link
                </button>
              </div>

              {/* Dynamic Input Area */}
              {aiSourceType === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Paste text, or <span className="text-blue-600 font-bold">Paste an Image (Ctrl+V)</span></label>
                  <textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onPaste={handleAiPaste}
                    className="w-full rounded-lg border-slate-200 bg-white border p-3 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none resize-none h-32 transition-all custom-scrollbar"
                    placeholder="E.g., Generate 10 MCQ questions on Quantum Physics... You can also paste screenshots!"
                  />
                  {aiImageBase64 && (
                    <div className="mt-3 relative inline-block">
                       <img src={`data:${aiImageMimeType};base64,${aiImageBase64}`} alt="Pasted" className="h-24 rounded-lg shadow-sm border border-slate-200 object-contain" />
                       <button onClick={() => { setAiImageBase64(''); setAiImageMimeType(''); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md">
                          <X className="w-3 h-3" />
                       </button>
                    </div>
                  )}
                </div>
              )}
              {aiSourceType === 'file' && (
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative cursor-pointer group">
                  <input type="file" accept="image/*,application/pdf,.doc,.docx,.tex,.txt,.csv,.md" onChange={handleAiFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-blue-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Click to upload a file</p>
                  <p className="text-xs text-slate-500 mt-1">Supports JPG, PNG, PDF, DOC, TEX and more (Max 10MB)</p>
                </div>
              )}
              {aiSourceType === 'url' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    className="w-full rounded-lg border-slate-200 bg-white border p-3 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                    placeholder="https://example.com/article"
                  />
                </div>
              )}

              {/* Specific Instructions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom AI Instructions (Optional)</label>
                <input
                  type="text"
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  className="w-full rounded-lg border-slate-200 bg-white border p-3 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
                  placeholder="E.g., Only extract multiple choice questions, ignore theory..."
                />
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setIsAiModalOpen(false);
                  handleAiGenerate();
                }}
                disabled={isGenerating}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-xl hover:shadow-lg transition-colors shadow-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate Now
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={examSubject}
                    onChange={(e) => setExamSubject(e.target.value)}
                    className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                  <input
                    type="text"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    placeholder="DD/MM/YYYY"
                    className="w-full rounded-lg border-slate-200 bg-white border p-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-1">School Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const result = event.target?.result as string;
                        setLogoBase64(result);
                        localStorage.setItem('jy_school_logo', result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {logoBase64 && (
                  <div className="mt-2 relative inline-block">
                    <img src={logoBase64} alt="Logo" className="h-12 object-contain border rounded" />
                    <button onClick={() => { setLogoBase64(''); localStorage.removeItem('jy_school_logo'); }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-5 h-5 flex items-center justify-center text-xs">X</button>
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1">Stored locally in your browser.</p>
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
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Marks</label>
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
                  placeholder="Enter each instruction on a new line..."
                />
              </div>
              <div className="pt-4 border-t border-slate-100">
                <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI Model Configuration
                </h4>
                
                <div className="space-y-4">
                  {/* Gemini */}
                  <div className={`p-3 rounded-xl border-2 transition-all ${activeAiModel === 'gemini' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ai_model" 
                        checked={activeAiModel === 'gemini'}
                        onChange={() => {
                          setActiveAiModel('gemini');
                          localStorage.setItem('jy_active_ai_model', 'gemini');
                        }}
                        className="w-4 h-4 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="font-medium text-slate-700">Google Gemini</span>
                    </label>
                    {activeAiModel === 'gemini' && (
                      <div className="mt-3 pl-7">
                        <input
                          type="password"
                          value={geminiApiKey}
                          onChange={(e) => {
                            setGeminiApiKey(e.target.value);
                            localStorage.setItem('jy_gemini_api_key', e.target.value);
                          }}
                          className="w-full rounded-lg border-slate-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none"
                          placeholder="Gemini API Key"
                        />
                      </div>
                    )}
                  </div>

                  {/* Claude */}
                  <div className={`p-3 rounded-xl border-2 transition-all ${activeAiModel === 'claude' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ai_model" 
                        checked={activeAiModel === 'claude'}
                        onChange={() => {
                          setActiveAiModel('claude');
                          localStorage.setItem('jy_active_ai_model', 'claude');
                        }}
                        className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="font-medium text-slate-700">Anthropic Claude</span>
                    </label>
                    {activeAiModel === 'claude' && (
                      <div className="mt-3 pl-7">
                        <input
                          type="password"
                          value={claudeApiKey}
                          onChange={(e) => {
                            setClaudeApiKey(e.target.value);
                            localStorage.setItem('jy_claude_api_key', e.target.value);
                          }}
                          className="w-full rounded-lg border-slate-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-orange-500/20 outline-none"
                          placeholder="Claude API Key"
                        />
                      </div>
                    )}
                  </div>

                  {/* ChatGPT */}
                  <div className={`p-3 rounded-xl border-2 transition-all ${activeAiModel === 'chatgpt' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ai_model" 
                        checked={activeAiModel === 'chatgpt'}
                        onChange={() => {
                          setActiveAiModel('chatgpt');
                          localStorage.setItem('jy_active_ai_model', 'chatgpt');
                        }}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="font-medium text-slate-700">OpenAI ChatGPT</span>
                    </label>
                    {activeAiModel === 'chatgpt' && (
                      <div className="mt-3 pl-7">
                        <input
                          type="password"
                          value={chatgptApiKey}
                          onChange={(e) => {
                            setChatgptApiKey(e.target.value);
                            localStorage.setItem('jy_chatgpt_api_key', e.target.value);
                          }}
                          className="w-full rounded-lg border-slate-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          placeholder="OpenAI API Key"
                        />
                      </div>
                    )}
                  </div>

                  {/* DeepSeek */}
                  <div className={`p-3 rounded-xl border-2 transition-all ${activeAiModel === 'deepseek' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="radio" 
                        name="ai_model" 
                        checked={activeAiModel === 'deepseek'}
                        onChange={() => {
                          setActiveAiModel('deepseek');
                          localStorage.setItem('jy_active_ai_model', 'deepseek');
                        }}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-slate-700">DeepSeek API</span>
                    </label>
                    {activeAiModel === 'deepseek' && (
                      <div className="mt-3 pl-7">
                        <input
                          type="password"
                          value={deepseekApiKey}
                          onChange={(e) => {
                            setDeepseekApiKey(e.target.value);
                            localStorage.setItem('jy_deepseek_api_key', e.target.value);
                          }}
                          className="w-full rounded-lg border-slate-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                          placeholder="DeepSeek API Key"
                        />
                      </div>
                    )}
                  </div>
                </div>
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
