import React, { useState, useEffect } from 'react';
import { qbApi as api } from '../../utils/questionBankApi';
import { LaTeXPreview } from './LaTeXPreview';
import { Upload, X, Check, AlertCircle, Sparkles, PenTool } from 'lucide-react';

interface QuestionFormProps {
  questionId?: number | null; // Null means creating
  initialData?: any | null; // Prefilled parsed question data
  onSuccess: () => void;
  onCancel: () => void;
}

const ManualQuestionForm: React.FC<QuestionFormProps> = ({ questionId, initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    subject: initialData?.subject || 'Physics',
    chapter: initialData?.chapter || '',
    topic: initialData?.topic || '',
    type: initialData?.type || 'MCQ_SINGLE',
    difficulty: initialData?.difficulty || 'Medium',
    questionText: initialData?.questionText || '',
    optionA: initialData?.optionA || '',
    optionB: initialData?.optionB || '',
    optionC: initialData?.optionC || '',
    optionD: initialData?.optionD || '',
    correctAnswer: initialData?.correctAnswer || 'A',
    solution: initialData?.solution || '',
    marks: initialData?.marks !== undefined ? initialData.marks : 4,
    negativeMarks: initialData?.negativeMarks !== undefined ? initialData.negativeMarks : -1,
    imageUrl: initialData?.imageUrl || '',
    tags: initialData?.tags || '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<{ chapters: string[]; topics: string[] }>({ chapters: [], topics: [] });

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.getQuestionMeta();
        const currentMeta = res.meta[formData.subject] || { chapters: [], topics: [] };
        setSuggestions(currentMeta);
      } catch (err) {
        console.error('Error loading meta suggestions:', err);
      }
    };
    fetchMeta();
  }, [formData.subject]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFile) {
        setUploadingImage(true);
        const uploadRes = await api.uploadImage(imageFile);
        finalImageUrl = uploadRes.imageUrl;
        setUploadingImage(false);
      }

      const payload = {
        ...formData,
        imageUrl: finalImageUrl,
        marks: Number(formData.marks),
        negativeMarks: Number(formData.negativeMarks),
      };

      if (questionId) {
        await api.updateQuestion(questionId, payload);
      } else {
        await api.createQuestion(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setLoading(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="w-full text-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Editor Panel */}
      <div className="bg-indigo-50 p-6 md:p-8 rounded-2xl border border-indigo-100 shadow-xl relative overflow-hidden">
        <h2 className="text-xl font-bold mb-6 text-slate-900 drop-shadow-md">
          {questionId ? 'Edit Question' : 'Manual Entry'}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Form fields identical but using lighter classes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Botany">Botany</option>
                <option value="Zoology">Zoology</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Difficulty</label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Chapter</label>
              <input
                type="text"
                name="chapter"
                list="chapter-suggestions"
                value={formData.chapter}
                onChange={handleChange}
                required
                className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
              />
              <datalist id="chapter-suggestions">
                {suggestions.chapters.map((ch, i) => <option key={i} value={ch} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Topic</label>
              <input
                type="text"
                name="topic"
                list="topic-suggestions"
                value={formData.topic}
                onChange={handleChange}
                required
                className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
              />
              <datalist id="topic-suggestions">
                {suggestions.topics.map((t, i) => <option key={i} value={t} />)}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Question Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600"
            >
              <option value="MCQ_SINGLE">MCQ (Single Correct)</option>
              <option value="MCQ_MULTIPLE">MCQ (Multiple Correct)</option>
              <option value="NUMERICAL">Numerical Value</option>
              <option value="MATCHING">Matching</option>
              <option value="COMPREHENSION">Comprehension</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Question Text <span className="text-slate-500 font-mono text-xs">(supports LaTeX $x^2$)</span>
            </label>
            <textarea
              name="questionText"
              rows={4}
              value={formData.questionText}
              onChange={handleChange}
              required
              placeholder="Enter question text here..."
              className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 font-sans focus:outline-none focus:border-indigo-600 resize-y"
            />
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
            {formData.type.startsWith('MCQ') ? (
              <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-indigo-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Options</h3>
                {['A', 'B', 'C', 'D'].map((opt) => (
                  <div key={opt} className="flex items-center gap-3">
                    <span className="font-bold text-slate-700 w-6">({opt})</span>
                    <input
                      type="text"
                      name={`option${opt}`}
                      value={(formData as any)[`option${opt}`]}
                      onChange={handleChange}
                      placeholder={`Option ${opt}`}
                      className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-slate-900 focus:outline-none focus:border-indigo-600 text-sm"
                    />
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-indigo-100">
                  <label className="block text-sm font-medium mb-2 text-slate-700">Correct Answer(s)</label>
                  <div className="flex gap-3">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => {
                          if (formData.type === 'MCQ_SINGLE') {
                            setFormData((p) => ({ ...p, correctAnswer: opt }));
                          } else {
                            const current = formData.correctAnswer.split(',').filter(Boolean);
                            const updated = current.includes(opt) ? current.filter((x: string) => x !== opt) : [...current, opt].sort();
                            setFormData((p) => ({ ...p, correctAnswer: updated.join(',') }));
                          }
                        }}
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all border
                          ${
                            formData.correctAnswer.includes(opt)
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-indigo-200 text-slate-600 hover:border-slate-400'
                          }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : formData.type === 'NUMERICAL' ? (
              <div className="space-y-3 p-4 bg-white/60 rounded-xl border border-indigo-100">
                <label className="block text-sm font-medium mb-1 text-slate-700">Correct Numerical Value</label>
                <input
                  type="text"
                  name="correctAnswer"
                  value={formData.correctAnswer}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 4.50"
                  className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-mono"
                />
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Positive Marks</label>
              <input
                type="number"
                step="0.5"
                name="marks"
                value={formData.marks}
                onChange={handleChange}
                required
                className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 text-center font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-slate-700">Negative Marks</label>
              <input
                type="number"
                step="0.5"
                name="negativeMarks"
                value={formData.negativeMarks}
                onChange={handleChange}
                required
                className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 text-center font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700">Diagram / Image (Optional)</label>
            <div className="w-full flex items-center justify-center">
              {formData.imageUrl && !imageFile ? (
                <div className="relative flex items-center justify-between w-full bg-white border border-indigo-200 rounded-xl p-2 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.imageUrl}
                      alt="Question"
                      className="w-12 h-12 object-contain bg-white rounded border border-indigo-200"
                    />
                    <span className="text-sm text-slate-700 truncate max-w-[200px]">Existing Image</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="p-1.5 bg-white hover:bg-red-50 rounded-full border border-indigo-200 hover:border-red-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ) : (
                <div className="w-full">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    id="diagram-file"
                    className="hidden"
                  />
                  <label
                    htmlFor="diagram-file"
                    className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 hover:border-slate-500 rounded-xl p-4 cursor-pointer hover:bg-slate-50 transition-all"
                  >
                    {imageFile ? (
                      <div className="flex items-center gap-2 text-sm text-teal-600">
                        <Check className="w-5 h-5 animate-pulse" />
                        <span>Ready to upload: {imageFile.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Upload className="w-5 h-5" />
                        <span>Choose an image (diagrams, graphs)</span>
                      </div>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. kinematics, graph, pyq-2025"
              className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-slate-700">
              Detailed Solution / Explanation <span className="text-slate-500 font-mono text-xs">(supports $math$)</span>
            </label>
            <textarea
              name="solution"
              rows={3}
              value={formData.solution}
              onChange={handleChange}
              required
              placeholder="Provide solution steps using LaTeX for math equations."
              className="w-full bg-white border border-indigo-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 resize-y text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-indigo-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-indigo-200 hover:bg-indigo-50 text-slate-700 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-accentPurple hover:brightness-110 font-medium text-white rounded-lg text-sm shadow-md transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
      {/* Live Preview Panel */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 shadow-xl flex flex-col h-[fit-content] sticky top-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            Live Preview
          </h2>
          <span className="bg-white border border-indigo-200 rounded-full px-3 py-1 text-xs text-slate-600">
            {formData.subject} | {formData.difficulty}
          </span>
        </div>

        {/* Outer Overleaf-Style Preview Card */}
        <div className="bg-white text-black p-6 rounded-xl border border-slate-300 min-h-[300px] flex flex-col justify-between font-serif text-[15px] shadow-lg">
          <div>
            <div className="flex justify-between items-start text-xs border-b border-slate-200 pb-2 mb-4 font-sans text-slate-500">
              <div>CHAPTER: <span className="font-semibold text-slate-800 uppercase">{formData.chapter || '—'}</span></div>
              <div>TOPIC: <span className="font-semibold text-slate-800 uppercase">{formData.topic || '—'}</span></div>
            </div>

            <div className="mb-4 leading-relaxed">
              <span className="font-sans font-bold mr-2 text-[14px]">Q.</span>
              <LaTeXPreview text={formData.questionText || 'Type question text in editor...'} className="inline-block" />
            </div>

            {(formData.imageUrl || imageFile) && (
              <div className="my-4 flex justify-center bg-slate-50/50 p-3 rounded border border-dashed border-slate-200 max-h-64">
                <img
                  src={formData.imageUrl || (imageFile ? URL.createObjectURL(imageFile) : '')}
                  alt="Diagram Preview"
                  className="max-h-56 object-contain"
                />
              </div>
            )}

            {formData.type.startsWith('MCQ') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm font-sans">
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const labelKey = `option${letter}` as keyof typeof formData;
                  const optionText = formData[labelKey] || `Option ${letter}`;
                  return (
                    <div key={letter} className="flex items-start gap-2 p-1">
                      <span className="font-bold">({letter})</span>
                      <LaTeXPreview text={String(optionText)} />
                    </div>
                  );
                })}
              </div>
            )}

            {formData.type === 'NUMERICAL' && (
              <div className="mt-4 p-2 px-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500 font-sans">
                [Numerical Value: Enter value up to 2 decimal places. Correct: <span className="font-mono font-bold text-black">{formData.correctAnswer}</span>]
              </div>
            )}
          </div>

          <div className="mt-8 border-t border-slate-200 pt-4 font-sans">
            <div className="text-xs text-slate-400 mb-2">SOLUTION & AUDIT INFO:</div>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2 rounded border border-slate-200">
              <div>Correct Key: <span className="font-bold text-emerald-600 font-mono text-[13px]">{formData.correctAnswer}</span></div>
              <div>Type: <span className="font-bold text-slate-700">{formData.type}</span></div>
              <div>Marks: <span className="font-bold text-emerald-600">+{formData.marks}</span></div>
              <div>Neg Marks: <span className="font-bold text-rose-500">{formData.negativeMarks}</span></div>
            </div>

            <div className="text-xs text-slate-700 bg-emerald-50/50 p-3 rounded border border-emerald-100 leading-relaxed">
              <span className="font-bold text-emerald-800">Explanation:</span>{' '}
              <LaTeXPreview text={formData.solution || 'Write solution steps in editor...'} className="mt-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { AIQuestionForm } from './AIQuestionForm';

export const QuestionForm: React.FC<QuestionFormProps> = (props) => {
  if (props.questionId) {
    return <ManualQuestionForm {...props} />;
  }
  return <AIQuestionForm onSuccess={props.onSuccess} onCancel={props.onCancel} />;
};


