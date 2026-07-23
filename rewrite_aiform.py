import re

new_content = '''import React, { useState } from 'react';
import { qbApi as api } from '../../utils/questionBankApi';
import { LaTeXPreview } from './LaTeXPreview';
import { Sparkles, AlertCircle, Loader2, Save, FileText, CheckCircle2, Edit2, X, Settings2 } from 'lucide-react';

interface AIQuestionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const MATH_SYMBOLS = ['a', 'ß', '?', '?', '°', '±', 'v', '?', '?', '8', 'p', '?', 'O', 'µ', '?', 's', '?', '?', '?', '?', '?', '˜', '?', '=', '='];

export const AIQuestionForm: React.FC<AIQuestionFormProps> = ({ onSuccess, onCancel }) => {
  const [inputText, setInputText] = useState('');
  const [subject, setSubject] = useState('Physics');
  const [provider, setProvider] = useState('gemini');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingIndividual, setSavingIndividual] = useState<Record<number, boolean>>({});
  const [savedIndividual, setSavedIndividual] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([]);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<any>({});
  const [focusedField, setFocusedField] = useState<string>('questionText');

  const handleParseAI = async () => {
    if (!inputText.trim()) {
      setError('Please paste some text to parse.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.parseQuestionsWithAI(inputText, subject, provider, apiKey);
      if (res.questions && res.questions.length > 0) {
        setParsedQuestions(res.questions);
        setSavedIndividual({});
        setEditingId(null);
      } else {
        setError('No questions could be extracted from the text.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to parse with AI');
    } finally {
      setLoading(false);
    }
  };

  const handleParseNormal = () => {
    if (!inputText.trim()) {
      setError('Please paste some text to parse.');
      return;
    }
    setError(null);
    try {
      const lines = inputText.split('\\n').map((l) => l.trim()).filter(Boolean);
      let parsed = [];
      let currentQ: any = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Detect question start: "Q1.", "1.", "The lanthanide..."
        // If it starts with a number, or just start a new block if it's long and doesn't look like options
        const qMatch = line.match(/^(?:Q\\d+|\\d+)\\.\\s+(.+)$/i);
        
        if (qMatch) {
            if (currentQ) parsed.push(currentQ);
            currentQ = {
                subject, chapter: '', topic: '', type: 'MCQ_SINGLE', difficulty: 'Medium',
                questionText: qMatch[1], optionA: '', optionB: '', optionC: '', optionD: '',
                correctAnswer: 'A', solution: '', marks: 4, negativeMarks: -1
            };
        } else if (!currentQ) {
            // First block of text without a number
            currentQ = {
                subject, chapter: '', topic: '', type: 'MCQ_SINGLE', difficulty: 'Medium',
                questionText: line, optionA: '', optionB: '', optionC: '', optionD: '',
                correctAnswer: 'A', solution: '', marks: 4, negativeMarks: -1
            };
        } else {
            // Might be options or continuation of question
            const inlineOpts = line.match(/(?:1\\.\\s+|A\\.\\s+|a\\)\\s+|\\(A\\)\\s+|A\\)\\s+)(.+?)\\s+(?:2\\.\\s+|B\\.\\s+|b\\)\\s+|\\(B\\)\\s+|B\\)\\s+)(.+?)\\s+(?:3\\.\\s+|C\\.\\s+|c\\)\\s+|\\(C\\)\\s+|C\\)\\s+)(.+?)\\s+(?:4\\.\\s+|D\\.\\s+|d\\)\\s+|\\(D\\)\\s+|D\\)\\s+)(.+)$/i);
            
            if (inlineOpts) {
                currentQ.optionA = inlineOpts[1].trim();
                currentQ.optionB = inlineOpts[2].trim();
                currentQ.optionC = inlineOpts[3].trim();
                currentQ.optionD = inlineOpts[4].trim();
            } else if (!currentQ.optionA) {
                // If options haven't been found, maybe the line has only A and B?
                // Let's just append to question text for simplicity
                currentQ.questionText += '\\n' + line;
            }
        }
      }
      if (currentQ) parsed.push(currentQ);

      if (parsed.length > 0) {
        setParsedQuestions(parsed);
        setSavedIndividual({});
        setEditingId(null);
      } else {
        setError('Could not extract questions. Please check the text format.');
      }
    } catch (e) {
      setError('Error parsing text manually.');
    }
  };

  const handleSaveAll = async () => {
    const toSave = parsedQuestions.filter((_, idx) => !savedIndividual[idx]);
    if (toSave.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await api.bulkCreateQuestions(toSave);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save questions in bulk');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSingle = async (idx: number, q: any) => {
    setSavingIndividual(prev => ({ ...prev, [idx]: true }));
    try {
      await api.createQuestion({ ...q, marks: Number(q.marks || 4), negativeMarks: Number(q.negativeMarks || -1) });
      setSavedIndividual(prev => ({ ...prev, [idx]: true }));
    } catch (err: any) {
      setError(err.message || 'Failed to save question ' + (idx + 1));
    } finally {
      setSavingIndividual(prev => ({ ...prev, [idx]: false }));
    }
  };

  const startEdit = (idx: number, q: any) => {
    setEditingId(idx);
    setEditState({ ...q });
    setFocusedField('questionText');
  };

  const saveEdit = (idx: number) => {
    const newQs = [...parsedQuestions];
    newQs[idx] = editState;
    setParsedQuestions(newQs);
    setEditingId(null);
  };

  const insertSymbol = (sym: string) => {
    setEditState((prev: any) => ({
      ...prev,
      [focusedField]: (prev[focusedField] || '') + sym
    }));
  };

  return (
    <div className="w-full text-slate-900 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 backdrop-blur-md rounded-2xl p-6 border border-indigo-200 shadow-xl flex flex-col h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-bold mb-4 text-slate-900 drop-shadow-md flex items-center gap-2 shrink-0">
          <FileText className="text-indigo-500 w-6 h-6" />
          Smart Question Extractor
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 shrink-0">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white/60 p-4 rounded-xl border border-indigo-100 mb-4 shrink-0 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-1"><Settings2 className="w-4 h-4"/> AI Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700">AI Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-400"
              >
                <option value="gemini">Google Gemini</option>
                <option value="chatgpt">ChatGPT (OpenAI)</option>
                <option value="claude">Claude (Anthropic)</option>
                <option value="deepseek">DeepSeek</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700">API Key (Optional for Gemini)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 shrink-0">
          <label className="block text-sm font-medium mb-1 text-slate-800">Preferred Subject</label>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full bg-white/80 border border-indigo-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-white/50"
          >
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Botany">Botany</option>
            <option value="Zoology">Zoology</option>
          </select>
        </div>

        <div className="flex-1 flex flex-col mb-4 min-h-[200px]">
          <label className="block text-sm font-medium mb-1 text-slate-800">Paste your questions or give instructions</label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="E.g. Create 3 physics questions from Electrostatics. OR Just paste raw text of questions."
            className="w-full flex-1 bg-white/80 border border-indigo-200 rounded-lg p-3 text-slate-900 font-sans focus:outline-none focus:border-indigo-400 resize-none shadow-inner"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-indigo-200 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white/80 hover:bg-white border border-indigo-200 text-slate-900 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleParseNormal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 font-semibold text-white rounded-lg text-sm shadow-md transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Parse Standard Text
          </button>
          <button
            type="button"
            onClick={handleParseAI}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:brightness-110 font-bold text-slate-900 rounded-lg text-sm shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Processing...' : 'Parse with AI'}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 backdrop-blur-md rounded-2xl p-6 border border-indigo-200 shadow-xl flex flex-col h-[calc(100vh-120px)] overflow-hidden">
        <div className="flex justify-between items-center mb-6 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            Live Preview ({parsedQuestions.length} Questions)
          </h2>
          {parsedQuestions.length > 0 && parsedQuestions.some((_, i) => !savedIndividual[i]) && (
            <button
              onClick={handleSaveAll}
              disabled={saving}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save All Unsaved'}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
          {parsedQuestions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">
              Waiting for extraction...
            </div>
          ) : (
            parsedQuestions.map((q, idx) => {
              const isSaved = savedIndividual[idx];
              const isSaving = savingIndividual[idx];
              const isEditing = editingId === idx;

              return (
              <div key={idx} className={g-white text-black p-6 rounded-xl border  font-serif text-[15px] shadow-lg relative transition-all}>
                
                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {!isEditing && !isSaved && (
                    <button
                      onClick={() => startEdit(idx, q)}
                      className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 shadow-sm"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                  )}
                  {isSaved ? (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-100 px-2 py-1 rounded-full">
                      <CheckCircle2 className="w-4 h-4" /> Saved
                    </span>
                  ) : (
                    !isEditing && (
                      <button
                        onClick={() => handleSaveSingle(idx, q)}
                        disabled={isSaving}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 shadow-sm disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save Manually
                      </button>
                    )
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-8 font-sans">
                    <div className="mb-3 bg-indigo-50 border border-indigo-100 p-2 rounded-lg flex flex-wrap gap-1">
                      {MATH_SYMBOLS.map(sym => (
                        <button key={sym} onClick={() => insertSymbol(sym)} className="w-8 h-8 flex items-center justify-center bg-white border border-indigo-200 rounded hover:bg-indigo-100 text-indigo-700 font-medium">
                          {sym}
                        </button>
                      ))}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Question Text</label>
                        <textarea
                          value={editState.questionText}
                          onFocus={() => setFocusedField('questionText')}
                          onChange={e => setEditState({...editState, questionText: e.target.value})}
                          className="w-full border border-slate-300 rounded p-2 text-sm focus:border-indigo-400 focus:outline-none"
                          rows={3}
                        />
                      </div>
                      
                      {editState.type?.startsWith('MCQ') && (
                        <div className="grid grid-cols-2 gap-3">
                          {['A', 'B', 'C', 'D'].map(opt => (
                            <div key={opt}>
                              <label className="text-xs font-bold text-slate-600 mb-1 block">Option {opt}</label>
                              <input
                                type="text"
                                value={editState[option]}
                                onFocus={() => setFocusedField(option)}
                                onChange={e => setEditState({...editState, [option]: e.target.value})}
                                className="w-full border border-slate-300 rounded p-2 text-sm focus:border-indigo-400 focus:outline-none"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Correct Answer</label>
                            <input
                              type="text"
                              value={editState.correctAnswer}
                              onChange={e => setEditState({...editState, correctAnswer: e.target.value})}
                              className="w-full border border-slate-300 rounded p-2 text-sm focus:border-indigo-400 focus:outline-none"
                            />
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-600 mb-1 block">Solution</label>
                            <input
                              type="text"
                              value={editState.solution}
                              onFocus={() => setFocusedField('solution')}
                              onChange={e => setEditState({...editState, solution: e.target.value})}
                              className="w-full border border-slate-300 rounded p-2 text-sm focus:border-indigo-400 focus:outline-none"
                            />
                         </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 mt-4">
                        <button onClick={() => setEditingId(null)} className="px-4 py-1.5 border border-slate-300 rounded text-slate-700 text-sm hover:bg-slate-50 flex items-center gap-1">
                          <X className="w-4 h-4"/> Cancel
                        </button>
                        <button onClick={() => saveEdit(idx)} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-4 h-4"/> Done
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-2 mb-4 font-sans text-slate-500 pr-32">
                      <div>SUBJECT: <span className="font-semibold text-indigo-700 uppercase">{q.subject}</span></div>
                      <div>CHAPTER: <span className="font-semibold text-slate-800 uppercase">{q.chapter || '—'}</span></div>
                      <div>TOPIC: <span className="font-semibold text-slate-800 uppercase">{q.topic || '—'}</span></div>
                    </div>

                    <div className="mb-4 leading-relaxed">
                      <span className="font-sans font-bold mr-2 text-[14px]">Q{idx + 1}.</span>
                      <LaTeXPreview text={q.questionText || ''} className="inline-block" />
                    </div>

                    {q.type?.startsWith('MCQ') && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm font-sans">
                        {['A', 'B', 'C', 'D'].map((letter) => {
                          const optName = 'option' + letter;
                          const optionText = q[optName] || '';
                          return (
                            <div key={letter} className="flex items-start gap-2 p-1">
                              <span className="font-bold">({letter})</span>
                              <LaTeXPreview text={String(optionText)} />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'NUMERICAL' && (
                      <div className="mt-4 p-2 px-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500 font-sans">
                        [Numerical Value. Correct: <span className="font-mono font-bold text-black">{q.correctAnswer}</span>]
                      </div>
                    )}

                    <div className="mt-6 border-t border-slate-200 pt-4 font-sans">
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
                        <div>Correct Key: <span className="font-bold text-emerald-600 font-mono text-[13px]">{q.correctAnswer}</span></div>
                        <div>Difficulty: <span className="font-bold text-slate-700">{q.difficulty}</span></div>
                        <div>Type: <span className="font-bold text-slate-700">{q.type}</span></div>
                      </div>

                      <div className="text-xs text-slate-700 bg-indigo-50/50 p-3 rounded border border-indigo-100 leading-relaxed">
                        <span className="font-bold text-indigo-800">Explanation:</span>{' '}
                        <LaTeXPreview text={q.solution || 'No explanation provided.'} className="mt-1" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )})
          )}
        </div>
      </div>
    </div>
  );
};
'''

with open('frontend/src/components/QuestionBank/AIQuestionForm.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
