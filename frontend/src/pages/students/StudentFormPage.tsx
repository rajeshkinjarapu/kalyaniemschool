import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save } from 'lucide-react';

export const StudentFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchClassesAndParents = async () => {
    try {
      const classRes: any = await api.get('/api/classes');
      setClasses(classRes.data || classRes || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await api.get(`/api/students/${id}`);
      const student = res.data;
      setPhotoUrl(student.user.photoUrl || '');
      reset({
        name: student.user.name,
        studentId: student.rollNo,
        phone: student.user.phone || '',
        classId: student.classId || '',
        dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
        gender: student.gender || '',
        address: student.address || '',
        bloodGroup: student.bloodGroup || '',
        medicalInfo: student.medicalInfo || '',
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        aadharNo: student.aadharNo || '',
        penNumber: student.penNumber || '',
      });
    } catch (e) {
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassesAndParents();
    fetchStudentData();
  }, [id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    const uploadToast = toast.loading('Uploading student photo...');
    try {
      const res: any = await api.post('/api/uploads/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrl(res.data.url);
      toast.success('Photo uploaded successfully!', { id: uploadToast });
    } catch (err: any) {
      toast.error(err.message || 'Upload failed', { id: uploadToast });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      const payload = { ...data, photoUrl };
      if (id) {
        await api.put(`/api/students/${id}`, payload);
        toast.success('Student profile updated successfully!');
      } else {
        await api.post('/api/students', payload);
        toast.success('New student added successfully!');
      }
      navigate('/students');
    } catch (error: any) {
      toast.error(error.message || 'Error saving student profile');
    }
  };

  if (loading) return <div className="text-center py-12">Loading details...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/students" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to List
      </Link>

      <div className="card p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {id ? 'Edit Student Profile' : 'Add New Student'}
          </h2>
          <p className="text-sm text-gray-500">
            {id ? 'Modify student and guardian information details.' : 'Create a new student profile and link academic metadata.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-full flex items-center gap-6 p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              {photoUrl ? (
                <img
                  src={photoUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${photoUrl}` : photoUrl}
                  alt="Student Preview"
                  className="w-20 h-28 rounded-2xl object-cover border border-gray-250 dark:border-gray-700 shadow-sm"
                />
              ) : (
                <div className="w-20 h-28 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-gray-400 font-extrabold text-xs text-center p-2">
                  NO PHOTO (RECTANGULAR)
                </div>
              )}
              <div className="space-y-1">
                <label className="label !mb-0 text-xs">Student Profile Picture</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
                {isUploading && <span className="text-[10px] text-gray-400 block animate-pulse">Uploading, please wait...</span>}
              </div>
            </div>

            <div>
              <label className="label">Full Name</label>
              <input type="text" required className="input" {...register('name')} />
            </div>

            <div>
              <label className="label">Student ID</label>
              <input type="text" className="input" placeholder="Leave blank to auto-generate (e.g. JY26-0001)" {...register('studentId')} />
            </div>

            {!id && (
              <div>
                <label className="label">Password</label>
                <input type="password" required className="input" placeholder="Create temporary password" {...register('password')} />
              </div>
            )}

            <div>
              <label className="label">Contact Phone</label>
              <input type="text" className="input" {...register('phone')} />
            </div>

            <div>
              <label className="label">Assign Class</label>
              <select className="input" {...register('classId')}>
                <option value="">Select Class</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}-{c.section}</option>
                ))}
              </select>
            </div>


            <div>
              <label className="label">Date of Birth</label>
              <input type="date" className="input" {...register('dob')} />
            </div>

            <div>
              <label className="label">Gender</label>
              <select className="input" {...register('gender')}>
                <option value="">Select Gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="label">Blood Group</label>
              <input type="text" className="input" placeholder="e.g. O+, A-" {...register('bloodGroup')} />
            </div>

            <div>
              <label className="label">Medical Info</label>
              <input type="text" className="input" placeholder="Allergies or conditions" {...register('medicalInfo')} />
            </div>

            <div>
              <label className="label">Father's Name</label>
              <input type="text" className="input" placeholder="Father's full name" {...register('fatherName')} />
            </div>

            <div>
              <label className="label">Mother's Name</label>
              <input type="text" className="input" placeholder="Mother's full name" {...register('motherName')} />
            </div>

            <div>
              <label className="label">Aadhar Number</label>
              <input type="text" className="input" placeholder="12-digit Aadhar number" {...register('aadharNo')} />
            </div>

            <div>
              <label className="label">PEN Number</label>
              <input type="text" className="input" placeholder="Permanent Education Number" {...register('penNumber')} />
            </div>
          </div>

          <div>
            <label className="label">Home Address</label>
            <textarea className="input" rows={3} {...register('address')}></textarea>
          </div>

          <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            <span>Save Profile</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default StudentFormPage;
