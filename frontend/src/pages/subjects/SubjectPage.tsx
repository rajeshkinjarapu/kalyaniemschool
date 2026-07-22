import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Plus, Edit, Trash2, School, Upload, FileDown } from 'lucide-react';
import { Avatar } from '../../components/UI/Avatar';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { getPhotoUrl } from '../../utils/photo';

export const SubjectPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<any>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');

  const fetchData = async () => {
    try {
      const [subRes, classRes, teachRes]: any = await Promise.all([
        api.get('/api/subjects'),
        api.get('/api/classes'),
        api.get('/api/teachers'),
      ]);
      setSubjects(subRes.data || subRes || []);
      setClasses(classRes.data || classRes || []);
      setTeachers(teachRes.data.data || teachRes.data || []);
    } catch (e) {
      toast.error('Failed to load curriculum data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEditClick = (sub: any) => {
    setEditingSubject(sub);
    setName(sub.name);
    setCode(sub.code);
    setClassId(sub.classId);
    setTeacherId(sub.classSubjectTeachers?.[0]?.teacherId || '');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this subject? This action cannot be undone.')) return;
    try {
      await api.delete(`/api/subjects/${id}`);
      toast.success('Subject deleted successfully!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete subject');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSubject) {
        // 1. Update subject details
        await api.put(`/api/subjects/${editingSubject.id}`, { name, code });

        // 2. Assign/update teacher mapping
        if (teacherId) {
          await api.post('/api/subjects/assign-teacher', {
            classId,
            subjectId: editingSubject.id,
            teacherId,
          });
        }
        toast.success('Subject updated successfully!');
      } else {
        // 1. Create subject
        const subRes: any = await api.post('/api/subjects', { name, code, classId });
        const subject = subRes.data;

        // 2. Assign teacher if selected
        if (teacherId) {
          await api.post('/api/subjects/assign-teacher', {
            classId,
            subjectId: subject.id,
            teacherId,
          });
        }
        toast.success('Subject created and mapped successfully!');
      }

      setShowModal(false);
      setName('');
      setCode('');
      setClassId('');
      setTeacherId('');
      setEditingSubject(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error saving subject details');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const importToast = toast.loading('Uploading and importing subjects...');
    try {
      const res: any = await api.post('/api/subjects/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data;
      toast.success(`Import complete! Successfully added ${data.success} subjects.`, {
        id: importToast,
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Bulk import failed. Please verify format rules.', {
        id: importToast,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Curriculum & Subjects</h3>
          <p className="text-xs text-gray-400">Map course subjects, codes, classes, and teachers.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept=".xlsx,.csv"
          />
          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8,Name,Code,Class,Section\nMathematics,MATH101,Class 1,A";
              const encodedUri = encodeURI(csvContent);
              const tempLink = document.createElement("a");
              tempLink.setAttribute("href", encodedUri);
              tempLink.setAttribute("download", "subjects_import_template.csv");
              document.body.appendChild(tempLink);
              tempLink.click();
              document.body.removeChild(tempLink);
            }}
            className="btn-secondary flex items-center gap-2"
          >
            <FileDown className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">Get Template</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">Import Subjects</span>
          </button>
          <button
            onClick={() => {
              setEditingSubject(null);
              setName('');
              setCode('');
              setClassId('');
              setTeacherId('');
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>New Subject</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="bg-white/40 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden backdrop-blur-2xl">
          
          {/* Mobile View */}
          <div className="md:hidden flex flex-col gap-4 p-4 bg-transparent">
            {subjects.map((sub, idx) => (
              <div key={sub.id} className="bg-gradient-to-br from-white to-indigo-50/30 p-4 rounded-3xl shadow-sm hover:shadow-glow-primary hover:-translate-y-1 transition-all duration-300 border border-indigo-50 flex items-center gap-4 relative overflow-visible mt-2 backdrop-blur-md animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                 <div className="absolute -top-2.5 -left-2.5 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-lg border-2 border-white z-10">
                   {idx + 1}
                 </div>
                 <div className="shrink-0 pl-2">
                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md border-2 border-white">
                     {sub.name.substring(0, 2).toUpperCase()}
                   </div>
                 </div>
                 <div className="flex-1 min-w-0">
                   <h4 className="font-extrabold text-[15px] text-indigo-950 truncate mb-1.5">{sub.name}</h4>
                   <div className="flex flex-wrap gap-1.5">
                     <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">{sub.code}</span>
                     <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">{sub.class ? `${sub.class.name}-${sub.class.section}` : 'N/A'}</span>
                   </div>
                   <div className="mt-1.5 text-[10px] font-semibold text-gray-500">
                      Teacher: {sub.classSubjectTeachers?.[0]?.teacher ? sub.classSubjectTeachers[0].teacher.user.name : 'Unassigned'}
                   </div>
                 </div>
                 <div className="shrink-0 flex flex-col gap-2">
                   <button onClick={() => handleEditClick(sub)} className="flex items-center justify-center w-8 h-8 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded-lg transition-all shadow-sm border border-gray-200 cursor-pointer">
                     <Edit className="w-3.5 h-3.5" />
                   </button>
                   {isSuperAdmin && (
                      <button onClick={() => handleDelete(sub.id)} className="flex items-center justify-center w-8 h-8 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-all shadow-sm border border-red-200 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                   )}
                 </div>
              </div>
            ))}
            {subjects.length === 0 && (
              <div className="py-12 text-center text-gray-400 font-semibold">
                No subjects found.
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto w-full max-w-full"><table className="w-full text-sm text-left border-collapse">
            <thead className="bg-indigo-50/50 text-indigo-900 font-semibold border-b border-indigo-100">
              <tr>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Assigned Teacher</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
              {subjects.map((sub, idx) => (
                <tr key={sub.id} className="hover:bg-white bg-transparent transition-all duration-300 group border-b border-indigo-50/50 hover:shadow-glow-primary animate-fade-in-up" style={{ animationDelay: `${idx * 30}ms` }}>
                  <td className="px-6 py-4 font-semibold text-gray-950 dark:text-white">{sub.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{sub.code}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center shadow-sm">
                        <School className="w-4.5 h-4.5" />
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {sub.class ? `${sub.class.name}-${sub.class.section}` : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {sub.classSubjectTeachers?.[0]?.teacher ? (
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          name={sub.classSubjectTeachers[0].teacher.user.name}
                          src={getPhotoUrl(sub.classSubjectTeachers[0].teacher.user.photoUrl)}
                          size="sm"
                          className="w-6 h-6 border-2 border-white ring-1 ring-slate-100"
                        />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {sub.classSubjectTeachers[0].teacher.user.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-450 italic text-xs">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(sub)}
                        className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all cursor-pointer"
                        title="Edit Subject"
                      >
                        <Edit className="w-4.5 h-4.5" />
                      </button>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Delete Subject"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {subjects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No subjects configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table></div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h3>
              <p className="text-xs text-gray-400">
                {editingSubject ? 'Modify classroom details and assigned teacher.' : 'Configure a new subject and assign teaching staff.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Subject Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS10"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Class Room</label>
                <select
                  required
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="input"
                  disabled={!!editingSubject}
                >
                  <option value="">Select Class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}-{c.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Assign Teacher (Optional)</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="input"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary text-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-sm">
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectPage;
