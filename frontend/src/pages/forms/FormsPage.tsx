import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import {
  ClipboardList, Plus, Trash2, ArrowLeft, CheckCircle2,
  Printer, User, Calendar, FileText, ChevronRight, Eye, Send
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[]; // for select dropdowns
}

interface CustomForm {
  id: string;
  title: string;
  description: string | null;
  fields: string; // JSON string
  targetRoles: string;
  createdById: string;
  isActive: boolean;
  createdAt: string;
  createdBy: { name: string };
  submissions?: { id: string }[];
  _count?: { submissions: number };
}

interface FormSubmission {
  id: string;
  formId: string;
  answers: string; // JSON string
  submittedAt: string;
  submittedBy: { name: string; email: string; role: string };
}

export const FormsPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

  // Navigation states
  const [view, setView] = useState<'list' | 'create' | 'fill' | 'submissions'>('list');
  const [forms, setForms] = useState<CustomForm[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Filler state
  const [activeForm, setActiveForm] = useState<CustomForm | null>(null);
  const [fillAnswers, setFillAnswers] = useState<Record<string, any>>({});

  // Submissions state
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  // Form Builder state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetRoles, setNewTargetRoles] = useState<string[]>(['ALL']);
  const [newFields, setNewFields] = useState<FormField[]>([
    { id: '1', label: 'Full Name', type: 'text', required: true }
  ]);

  const ROLES = ['ALL', 'STUDENT', 'TEACHER', 'ACCOUNTANT'];

  const fetchForms = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/api/forms');
      setForms(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  /* ── Form Builder Handlers ── */
  const addField = () => {
    const id = Date.now().toString();
    setNewFields([...newFields, { id, label: '', type: 'text', required: false, options: [''] }]);
  };

  const removeField = (id: string) => {
    setNewFields(newFields.filter(f => f.id !== id));
  };

  const updateField = (id: string, key: keyof FormField, value: any) => {
    setNewFields(newFields.map(f => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const addOption = (fieldId: string) => {
    setNewFields(newFields.map(f => {
      if (f.id === fieldId) {
        return { ...f, options: [...(f.options || []), ''] };
      }
      return f;
    }));
  };

  const updateOption = (fieldId: string, idx: number, val: string) => {
    setNewFields(newFields.map(f => {
      if (f.id === fieldId) {
        const opts = [...(f.options || [])];
        opts[idx] = val;
        return { ...f, options: opts };
      }
      return f;
    }));
  };

  const removeOption = (fieldId: string, idx: number) => {
    setNewFields(newFields.map(f => {
      if (f.id === fieldId) {
        return { ...f, options: (f.options || []).filter((_, i) => i !== idx) };
      }
      return f;
    }));
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Form title is required');
      return;
    }
    const emptyFields = newFields.some(f => !f.label.trim());
    if (emptyFields) {
      toast.error('All fields must have labels');
      return;
    }

    try {
      const payload = {
        title: newTitle,
        description: newDescription,
        fields: newFields,
        targetRoles: newTargetRoles.join(','),
      };
      await api.post('/api/forms', payload);
      toast.success('Form created successfully!');
      setView('list');
      fetchForms();
      // Reset builder
      setNewTitle('');
      setNewDescription('');
      setNewTargetRoles(['ALL']);
      setNewFields([{ id: '1', label: 'Full Name', type: 'text', required: true }]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create form');
    }
  };

  /* ── Form Filler Handlers ── */
  const openFormFiller = (form: CustomForm) => {
    setActiveForm(form);
    setFillAnswers({});
    setView('fill');
  };

  const handleFillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeForm) return;

    const parsedFields: FormField[] = JSON.parse(activeForm.fields);
    // Validate required fields
    for (const f of parsedFields) {
      if (f.required && (!fillAnswers[f.label] || fillAnswers[f.label] === '')) {
        toast.error(`"${f.label}" is required`);
        return;
      }
    }

    try {
      await api.post(`/api/forms/${activeForm.id}/submit`, { answers: fillAnswers });
      toast.success('Form response submitted successfully!');
      setView('list');
      fetchForms();
    } catch (err: any) {
      toast.error(err.message || 'Submission failed');
    }
  };

  /* ── Submissions View Handlers ── */
  const openSubmissions = async (form: CustomForm) => {
    setActiveForm(form);
    setLoading(true);
    setView('submissions');
    try {
      const res: any = await api.get(`/api/forms/${form.id}/submissions`);
      setSubmissions(res.data || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch submissions');
      setView('list');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form and all its submissions?')) return;
    try {
      await api.delete(`/api/forms/${id}`);
      toast.success('Form deleted successfully');
      fetchForms();
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const printSubmissions = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ══ BREADCRUMBS & TOP NAVIGATION ══ */}
      <div className="print:hidden flex items-center justify-between bg-white dark:bg-gray-900 px-5 py-3 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <span>Dashboard</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-900 dark:text-white font-bold">Form</span>
        </div>
        {isAdmin && view === 'list' && (
          <button onClick={() => setView('create')} className="btn-primary flex items-center gap-1.5 text-xs font-bold py-1.5 cursor-pointer">
            <Plus className="w-4 h-4" /> Add Form
          </button>
        )}
        {view !== 'list' && (
          <button onClick={() => setView('list')} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all cursor-pointer">
            <ArrowLeft className="w-4 h-4" /> Back to Forms
          </button>
        )}
      </div>

      {loading && view !== 'submissions' ? (
        <LoadingSpinner size="lg" className="py-24" />
      ) : (
        <>
          {/* ── 1. FORM LIST VIEW ── */}
          {view === 'list' && (
            <>
              {forms.length === 0 ? (
                /* Empty state matching the user's screenshot layout */
                <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-16 text-center shadow-sm min-h-[480px]">
                  <div className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-500 mb-6">
                    <ClipboardList className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">List all Forms</h3>
                  <p className="text-sm text-gray-400 max-w-sm mb-8 leading-relaxed">
                    Generate custom forms and collect data from your students and employees.
                  </p>
                  {isAdmin && (
                    <button onClick={() => setView('create')} className="btn-primary px-6 py-2.5 flex items-center gap-2 font-bold cursor-pointer">
                      <Plus className="w-5 h-5" /> Add Form
                    </button>
                  )}
                </div>
              ) : (
                /* Forms Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {forms.map(form => {
                    const fieldsList: FormField[] = JSON.parse(form.fields);
                    const rolesArray = form.targetRoles.split(',');
                    const hasSubmitted = !isAdmin && form.submissions && form.submissions.length > 0;

                    return (
                      <div key={form.id} className="card p-6 flex flex-col justify-between hover:scale-102 hover:-translate-y-1 transition-all duration-300 shadow-glow-primary">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(form.createdAt).toLocaleDateString()}
                            </span>
                            {hasSubmitted ? (
                              <Badge variant="success">Submitted</Badge>
                            ) : (
                              <Badge variant="warning">Pending</Badge>
                            )}
                          </div>
                          <h4 className="font-extrabold text-base text-gray-900 dark:text-white truncate">{form.title}</h4>
                          <p className="text-xs text-gray-450 dark:text-gray-400 line-clamp-2 min-h-[32px]">{form.description || 'No description provided.'}</p>

                          <div className="flex flex-wrap gap-1 mt-2">
                            {rolesArray.map(role => (
                              <span key={role} className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-150 dark:bg-gray-800 text-gray-650 dark:text-gray-300">
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-5 flex items-center justify-between">
                          <div className="text-xs text-gray-400 font-bold">
                            {isAdmin ? `${form._count?.submissions || 0} Submissions` : `${fieldsList.length} Fields`}
                          </div>
                          <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <>
                                <button onClick={() => openSubmissions(form)} className="p-2 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:scale-105 transition-transform cursor-pointer" title="View Submissions">
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteForm(form.id)} className="p-2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-lg hover:scale-105 transition-transform cursor-pointer" title="Delete Form">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              !hasSubmitted && (
                                <button onClick={() => openFormFiller(form)} className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1 cursor-pointer">
                                  <FileText className="w-3.5 h-3.5" /> Fill Form
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ── 2. FORM BUILDER VIEW ── */}
          {view === 'create' && (
            <div className="card p-6 md:p-8 max-w-3xl mx-auto shadow-xl">
              <h3 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2 pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
                <ClipboardList className="w-5 h-5 text-indigo-500" /> Create Custom Form
              </h3>

              <form onSubmit={handleCreateForm} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="label">Form Title</label>
                    <input
                      type="text"
                      className="input"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="e.g. Health Declaration Form"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="label">Target Roles</label>
                    <div className="flex flex-wrap gap-2 py-1">
                      {ROLES.map(role => {
                        const active = newTargetRoles.includes(role);
                        return (
                          <button
                            type="button"
                            key={role}
                            onClick={() => {
                              if (role === 'ALL') {
                                setNewTargetRoles(['ALL']);
                              } else {
                                const filtered = newTargetRoles.filter(r => r !== 'ALL');
                                if (active) {
                                  setNewTargetRoles(filtered.filter(r => r !== role));
                                } else {
                                  setNewTargetRoles([...filtered, role]);
                                }
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              active ? 'bg-indigo-650 text-white shadow' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="label">Description / Instructions</label>
                  <textarea
                    rows={2}
                    className="input"
                    value={newDescription}
                    onChange={e => setNewDescription(e.target.value)}
                    placeholder="Enter short instructions or notes for the respondents..."
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">Form Fields</h4>
                    <button type="button" onClick={addField} className="btn-secondary py-1 px-3 text-xs flex items-center gap-1 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> Add Field
                    </button>
                  </div>

                  <div className="space-y-4">
                    {newFields.map((field, index) => (
                      <div key={field.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <span className="text-xs font-bold text-gray-400">Field #{index + 1}</span>
                          <button type="button" onClick={() => removeField(field.id)} className="text-red-500 hover:text-red-650 text-xs font-bold flex items-center gap-1 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              className="input"
                              placeholder="Field Label (e.g. Aadhar Number)"
                              value={field.label}
                              onChange={e => updateField(field.id, 'label', e.target.value)}
                              required
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <select
                              className="input"
                              value={field.type}
                              onChange={e => updateField(field.id, 'type', e.target.value)}
                            >
                              <option value="text">Text Input</option>
                              <option value="number">Number</option>
                              <option value="textarea">Paragraph</option>
                              <option value="select">Dropdown</option>
                              <option value="checkbox">Checkbox</option>
                            </select>
                          </div>
                          <div className="sm:col-span-3 flex items-center justify-center gap-2">
                            <input
                              type="checkbox"
                              id={`req-${field.id}`}
                              checked={field.required}
                              onChange={e => updateField(field.id, 'required', e.target.checked)}
                              className="w-4 h-4 text-indigo-650 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor={`req-${field.id}`} className="text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                              Required
                            </label>
                          </div>
                        </div>

                        {field.type === 'select' && (
                          <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-950 space-y-2 mt-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">Dropdown Options</label>
                            {field.options?.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  className="input py-1.5 text-xs max-w-xs"
                                  placeholder={`Option ${oIdx + 1}`}
                                  value={opt}
                                  onChange={e => updateOption(field.id, oIdx, e.target.value)}
                                  required
                                />
                                <button type="button" onClick={() => removeOption(field.id, oIdx)} className="text-red-500 text-xs cursor-pointer">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={() => addOption(field.id)} className="text-[11px] text-indigo-500 font-bold hover:underline cursor-pointer block mt-1">
                              + Add Option
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={() => setView('list')} className="btn-secondary font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="btn-primary font-bold flex items-center gap-1.5 cursor-pointer">
                    <Send className="w-4 h-4" /> Save Form
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── 3. FORM FILLER VIEW ── */}
          {view === 'fill' && activeForm && (
            <div className="card p-6 md:p-8 max-w-2xl mx-auto shadow-xl">
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{activeForm.title}</h3>
                {activeForm.description && (
                  <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">{activeForm.description}</p>
                )}
              </div>

              <form onSubmit={handleFillSubmit} className="space-y-5">
                {JSON.parse(activeForm.fields).map((field: FormField) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="label flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        className="input"
                        required={field.required}
                        value={fillAnswers[field.label] || ''}
                        onChange={e => setFillAnswers({ ...fillAnswers, [field.label]: e.target.value })}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="input"
                        required={field.required}
                        value={fillAnswers[field.label] || ''}
                        onChange={e => setFillAnswers({ ...fillAnswers, [field.label]: e.target.value })}
                      >
                        <option value="">Select Option</option>
                        {field.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'checkbox' ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id={`fill-${field.id}`}
                          checked={!!fillAnswers[field.label]}
                          onChange={e => setFillAnswers({ ...fillAnswers, [field.label]: e.target.checked })}
                          className="w-4 h-4 text-indigo-650 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                        />
                        <label htmlFor={`fill-${field.id}`} className="text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                          Yes, I agree / confirm
                        </label>
                      </div>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        className="input"
                        required={field.required}
                        value={fillAnswers[field.label] || ''}
                        onChange={e => setFillAnswers({ ...fillAnswers, [field.label]: e.target.value })}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <button type="button" onClick={() => setView('list')} className="btn-secondary font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="btn-primary font-bold flex items-center gap-1.5 cursor-pointer">
                    <CheckCircle2 className="w-4 h-4" /> Submit Response
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── 4. SUBMISSIONS VIEW ── */}
          {view === 'submissions' && activeForm && (
            <div className="space-y-6">
              {/* Back to list and print options */}
              <div className="print:hidden flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">{activeForm.title} Submissions</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Below are all collected responses for this form.</p>
                </div>
                <button onClick={printSubmissions} className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer">
                  <Printer className="w-4 h-4 text-indigo-500" /> Print Submissions
                </button>
              </div>

              {/* Print Only Header */}
              <div className="hidden print:block text-center mb-6">
                <h1 className="text-2xl font-black text-indigo-700">JY SCHOOL</h1>
                <h2 className="text-lg font-bold text-gray-850 mt-1">Form Submissions Report: {activeForm.title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Total Responses: {submissions.length}</p>
                <div className="w-24 h-1 bg-indigo-600 mx-auto mt-2 rounded"></div>
              </div>

              {submissions.length === 0 ? (
                <div className="card p-12 text-center text-sm text-gray-450 dark:text-gray-450 min-h-[200px] flex items-center justify-center">
                  No submissions recorded for this form yet.
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-800/40 border-b border-gray-150 dark:border-gray-800">
                          <th className="p-4 text-left font-extrabold uppercase text-[10px] text-gray-400 tracking-wider w-48">Respondent</th>
                          <th className="p-4 text-left font-extrabold uppercase text-[10px] text-gray-400 tracking-wider w-32">Role</th>
                          {JSON.parse(activeForm.fields).map((f: FormField) => (
                            <th key={f.id} className="p-4 text-left font-extrabold uppercase text-[10px] text-gray-400 tracking-wider min-w-[150px]">
                              {f.label}
                            </th>
                          ))}
                          <th className="p-4 text-left font-extrabold uppercase text-[10px] text-gray-400 tracking-wider w-36">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {submissions.map(sub => {
                          const answersObj = JSON.parse(sub.answers);
                          return (
                            <tr key={sub.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                              <td className="p-4">
                                <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-gray-400" />
                                  {sub.submittedBy?.name}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{sub.submittedBy?.email}</div>
                              </td>
                              <td className="p-4">
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-300">
                                  {sub.submittedBy?.role}
                                </span>
                              </td>
                              {JSON.parse(activeForm.fields).map((f: FormField) => {
                                const val = answersObj[f.label];
                                return (
                                  <td key={f.id} className="p-4 text-gray-650 dark:text-gray-300">
                                    {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : val || '-'}
                                  </td>
                                );
                              })}
                              <td className="p-4 text-xs text-gray-450 dark:text-gray-400 font-medium">
                                {new Date(sub.submittedAt).toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ VERSION & BRANDING FOOTER ══ */}
      <div className="print:hidden text-center text-[10px] text-gray-400 dark:text-gray-500 font-medium pt-8">
        Version 5.6.0 Designed with ❤️ by ScriptMint
      </div>
    </div>
  );
};
export default FormsPage;
