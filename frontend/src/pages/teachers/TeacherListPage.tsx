import React, { useEffect, useState, useRef } from 'react';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Badge } from '../../components/UI/Badge';
import { Avatar } from '../../components/UI/Avatar';
import { Search, UserPlus, Trash2, Edit, Upload, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export const TeacherListPage: React.FC = () => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const importToast = toast.loading('Uploading and importing teachers registry...');
    try {
      const res: any = await api.post('/api/teachers/bulk-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res.data;
      toast.success(`Import complete! Successfully added ${data.success} teachers.`, {
        id: importToast,
        duration: 4000,
      });
      fetchTeachers();
    } catch (err: any) {
      toast.error(err.message || 'Bulk import failed. Please verify format rules.', {
        id: importToast,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response: any = await api.get('/api/teachers', {
        params: { search },
      });
      setTeachers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to load teachers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    try {
      await api.delete(`/api/teachers/${id}`);
      toast.success('Teacher deleted successfully');
      fetchTeachers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete teacher');
    }
  };

  const exportTeachers = async () => {
    const importToast = toast.loading('Generating Excel sheet...');
    try {
      const response: any = await api.get('/api/teachers/export', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data || response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Teacher_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Report downloaded successfully!', { id: importToast });
    } catch (e: any) {
      toast.error('Failed to export teachers registry data.', { id: importToast });
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3.5 w-4.5 h-4.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teachers by name or employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10 py-3"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportTeachers}
            className="btn-secondary flex items-center gap-2"
            title="Export Excel"
          >
            <FileDown className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            onClick={() => {
              const csvContent = "data:text/csv;charset=utf-8,Name,Email,Password,Phone,Qualification,Specialization\nTeacher 1,teacher1@example.com,Teacher@123,9876543210,M.Sc,Physics";
              const encodedUri = encodeURI(csvContent);
              const tempLink = document.createElement("a");
              tempLink.setAttribute("href", encodedUri);
              tempLink.setAttribute("download", "teachers_import_template.csv");
              document.body.appendChild(tempLink);
              tempLink.click();
              document.body.removeChild(tempLink);
            }}
            className="btn-secondary flex items-center gap-2"
            title="Get Template"
          >
            <FileDown className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">Get Template</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
            accept=".xlsx,.csv"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary flex items-center gap-2"
            title="Import Excel or CSV sheet"
          >
            <Upload className="w-4.5 h-4.5" />
            <span className="hidden sm:inline">Import Sheet</span>
          </button>
          <Link to="/teachers/new" className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5" />
            <span>Add Teacher</span>
          </Link>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-12" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-semibold border-b border-gray-100 dark:border-gray-800">
                  <th className="px-6 py-4">Teacher</th>
                  <th className="px-6 py-4">Employee ID</th>
                  <th className="px-6 py-4">Specialization</th>
                  <th className="px-6 py-4">Qualification</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/10">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <Avatar name={teacher.user?.name || 'Teacher'} src={teacher.user?.photoUrl} size="sm" variant="rectangular" />
                      <div>
                        <h4 className="font-semibold text-gray-950 dark:text-white leading-tight">
                          {teacher.user?.name}
                        </h4>
                        <span className="text-xs text-gray-400">{teacher.user?.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{teacher.employeeId}</td>
                    <td className="px-6 py-4">
                      <Badge variant="info">{teacher.specialization || 'N/A'}</Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {teacher.qualification || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2.5">
                        <Link
                          to={`/teachers/${teacher.id}`}
                          className="btn-secondary !p-2 !rounded-lg text-xs"
                          title="View Profile"
                        >
                          View
                        </Link>
                        <Link
                          to={`/teachers/${teacher.id}/edit`}
                          className="p-2 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(teacher.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400">
                      No teacher records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherListPage;
