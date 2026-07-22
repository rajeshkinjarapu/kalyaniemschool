import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { School, User, Users, Plus, Trash2, Edit3, Upload, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const ClassManagementPage: React.FC = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Form states
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [classTeacherId, setClassTeacherId] = useState('');
  const [capacity, setCapacity] = useState(40);

  const fetchClasses = async () => {
    try {
      const res: any = await api.get('/api/classes');
      setClasses(res.data || res || []);
    } catch (e) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res: any = await api.get('/api/teachers');
      setTeachers(res.data.data || res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const openCreateModal = () => {
    setEditingClassId(null);
    setName('');
    setSection('');
    setAcademicYear('2024-2025');
    setClassTeacherId('');
    setCapacity(40);
    setShowModal(true);
  };

  const openEditModal = (cls: any) => {
    setEditingClassId(cls.id);
    setName(cls.name);
    setSection(cls.section);
    setAcademicYear(cls.academicYear || '2024-2025');
    setClassTeacherId(cls.classTeacherId || '');
    setCapacity(cls.capacity || 40);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClassId) {
        await api.put(`/api/classes/${editingClassId}`, {
          name,
          section,
          academicYear,
          classTeacherId: classTeacherId || null,
          capacity: Number(capacity),
        });
        toast.success('Class updated successfully!');
      } else {
        await api.post('/api/classes', {
          name,
          section,
          academicYear,
          classTeacherId: classTeacherId || null,
          capacity: Number(capacity),
        });
        toast.success('Class created successfully!');
      }
      setShowModal(false);
      setName('');
      setSection('');
      setClassTeacherId('');
      setEditingClassId(null);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || 'Error saving class');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this class? This will delete all course metadata.')) return;
    try {
      await api.delete(`/api/classes/${id}`);
      toast.success('Class deleted successfully');
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete class');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">Classes Directory</h3>
          <p className="text-xs text-gray-400">Manage all grades, sections, and class teacher assignments.</p>
        </div>
        <div className="flex gap-3">

          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4.5 h-4.5" />
            <span>New Class</span>
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-gradient-to-br from-white to-indigo-50/30 p-6 space-y-4 hover:shadow-glow-primary transition-all duration-300 relative group rounded-3xl border border-indigo-50 backdrop-blur-md animate-fade-in-up hover:-translate-y-1">
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEditModal(cls)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 cursor-pointer"
                  title="Edit class"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDelete(cls.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    title="Delete class"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-16 rounded-xl bg-gradient-to-br from-indigo-500 to-primary-600 text-white flex items-center justify-center shadow-md">
                  <School className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-lg text-indigo-950 group-hover:text-indigo-600 transition-colors">
                    {cls.name}-{cls.section}
                  </h4>
                  <span className="text-xs text-gray-400">Academic Year: {cls.academicYear}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2 text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{cls._count?.students || 0} Students</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-4 h-4" />
                  <span className="truncate">
                    {cls.classTeacher?.user?.name || 'No Teacher'}
                  </span>
                </div>
              </div>

              <Link to={`/classes/${cls.id}`} className="btn-secondary w-full text-center block text-sm">
                Manage Class Details
              </Link>
            </div>
          ))}
          {classes.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              No classes configured yet. Create your first class!
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card w-full max-w-md p-6 space-y-6">
            <div>
              <h3 className="text-xl font-bold">
                {editingClassId ? 'Edit Class Details' : 'Add New Class'}
              </h3>
              <p className="text-xs text-gray-400">Configure class details and assignments.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Class/Grade Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Section (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. A"
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Class Teacher</label>
                <select
                  value={classTeacherId}
                  onChange={(e) => setClassTeacherId(e.target.value)}
                  className="input"
                >
                  <option value="">Select Class Teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.user.name} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Student Capacity</label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="input"
                />
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
                  {editingClassId ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ClassManagementPage;
