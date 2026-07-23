import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Avatar } from '../../components/UI/Avatar';
import { Badge } from '../../components/UI/Badge';
import { ArrowLeft, BookOpen, GraduationCap, School, Camera, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../../utils/photo';
import { compressImage } from '../../utils/imageCompressor';

export const TeacherProfilePage: React.FC = () => {
  const { id } = useParams();
  const [teacher, setTeacher] = useState<any>(null);
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchTeacherProfile = async () => {
    try {
      const [profileRes, classesRes]: any = await Promise.all([
        api.get(`/api/teachers/${id}`),
        api.get(`/api/teachers/${id}/assigned-classes`),
      ]);
      setTeacher(profileRes.data);
      setAssignedClasses(classesRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Photo upload handler (mirrors student profile logic)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const loadingToast = toast.loading('Uploading photo...');
    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      const uploadRes: any = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = uploadRes.data.url || uploadRes.data.data?.url;
      if (!uploadedUrl) throw new Error('Upload returned no URL');
      // Save URL to teacher record
      await api.put(`/api/teachers/${teacher.id}`, {
        photoUrl: uploadedUrl,
        // keep other fields unchanged (backend merges)
      });
      toast.success('Photo updated successfully!', { id: loadingToast });
      fetchTeacherProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload photo', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };


  useEffect(() => {
    fetchTeacherProfile();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!teacher) return <div className="text-center py-12">Teacher profile not found.</div>;

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6 print:hidden">
      {/* Navigation Row */}
      <div className="flex items-center justify-between">
        <Link to="/teachers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Teachers
        </Link>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2 text-xs font-bold shadow-md hover:scale-102 transition-all">
          <Printer className="w-4 h-4" /> Print Profile
        </button>
      </div>

      <div className="card p-6 flex flex-col md:flex-row items-center gap-6">
        <div className="relative">
          <Avatar name={teacher.user.name} src={getPhotoUrl(teacher.user.photoUrl)} size="lg" variant="rectangular" className="w-28 h-36 rounded-2xl ring-4 ring-primary-500/10 shadow-lg object-cover" />
          {/* Upload Button */}
          <label className="cursor-pointer absolute bottom-0 right-0 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-xl transition-colors border border-primary-200 dark:border-gray-700 shadow-sm hover:scale-102 active:scale-98 select-none">
            <Camera className="w-3.5 h-3.5" />
            <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
          </label>
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-2xl font-bold">{teacher.user.name}</h2>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <Badge variant="info">Employee ID: {teacher.employeeId}</Badge>
            <Badge variant="success">Specialization: {teacher.specialization || 'N/A'}</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 md:col-span-2 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Academic Qualifications</h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-xs text-gray-400 block">Degree / Certification</span>
                <span className="font-semibold">{teacher.qualification || 'N/A'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <div>
                <span className="text-xs text-gray-400 block">Subjects Specialized</span>
                <span className="font-semibold">{teacher.specialization || 'N/A'}</span>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Joining Date</span>
              <span className="font-semibold">{new Date(teacher.joiningDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Class Assignments</h3>
          <div className="space-y-3">
            {assignedClasses.map((item, index) => (
              <div key={index} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800">
                <School className="w-5 h-5 text-primary-500" />
                <div className="text-xs">
                  <span className="font-bold block">{item.class.name}-{item.class.section}</span>
                  <span className="text-gray-400">{item.subject.name}</span>
                </div>
              </div>
            ))}
            {assignedClasses.length === 0 && (
              <p className="text-sm text-gray-400">No classes assigned to this teacher yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Print-only version (mirrors on-screen layout without interactive controls) */}
    <div className="hidden print:block space-y-6">
      <div className="border-b-4 border-double border-gray-800 pb-3 text-center">
        <h1 className="text-2xl font-black tracking-widest uppercase">JY SCHOOL</h1>
        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider">Official Teacher Registry Dossier</p>
      </div>
      <div className="flex gap-10 items-start">
        <div className="flex-1 space-y-4">
          <h2 className="text-2xl font-bold">{teacher.user.name}</h2>
          <p className="text-xs text-gray-500">Employee ID: {teacher.employeeId}</p>
          <p className="text-xs text-gray-500">Specialization: {teacher.specialization || 'N/A'}</p>
          <h3 className="font-bold mt-4">Academic Qualifications</h3>
          <p>{teacher.qualification || 'N/A'}</p>
          <h3 className="font-bold mt-4">Class Assignments</h3>
          {assignedClasses.map((item, idx) => (
            <p key={idx}>{item.class.name}-{item.class.section} ({item.subject.name})</p>
          ))}
        </div>
        <div className="w-32 flex-shrink-0">
          <img src={getPhotoUrl(teacher.user.photoUrl)} alt="Teacher Photo" className="w-32 h-40 object-cover" />
        </div>
      </div>
    </div>

    </>
  );
};
export default TeacherProfilePage;
