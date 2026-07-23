import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Camera } from 'lucide-react';
import { Avatar } from '../../components/UI/Avatar';
import { getPhotoUrl } from '../../utils/photo';
import { compressImage } from '../../utils/imageCompressor';

export const TeacherFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

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
      setPhotoUrl(uploadedUrl);
      toast.success('Photo uploaded successfully!', { id: loadingToast });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload photo', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  const fetchTeacherData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res: any = await api.get(`/api/teachers/${id}`);
      const teacher = res.data;
      reset({
        name: teacher.user.name,
        email: teacher.user.email,
        phone: teacher.user.phone || '',
        qualification: teacher.qualification || '',
        specialization: teacher.specialization || '',
        joiningDate: teacher.joiningDate ? new Date(teacher.joiningDate).toISOString().split('T')[0] : '',
      });
      setPhotoUrl(teacher.user.photoUrl || '');
    } catch (e) {
      toast.error('Failed to load teacher details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherData();
  }, [id]);

  const onSubmit = async (data: any) => {
    const payload = { ...data, photoUrl };
    try {
      if (id) {
        await api.put(`/api/teachers/${id}`, payload);
        toast.success('Teacher details updated successfully!');
      } else {
        await api.post('/api/teachers', payload);
        toast.success('New teacher added successfully!');
      }
      navigate('/teachers');
    } catch (error: any) {
      toast.error(error.message || 'Error saving teacher details');
    }
  };

  if (loading) return <div className="text-center py-12">Loading details...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/teachers" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black dark:hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Teachers
      </Link>

      <div className="card p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {id ? 'Edit Teacher Details' : 'Add New Teacher'}
          </h2>
          <p className="text-sm text-gray-500">
            Set up credentials, photo, and academic qualifications.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar name="Teacher" src={getPhotoUrl(photoUrl)} size="lg" variant="rectangular" className="w-24 h-24 rounded-2xl ring-4 ring-primary-500/10 object-cover" />
            <label className="cursor-pointer absolute -bottom-2 -right-2 inline-flex items-center justify-center w-8 h-8 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
          <div className="text-sm text-gray-500">
            <p className="font-semibold text-gray-700 dark:text-gray-300">Profile Photo</p>
            <p>Upload a square image. Max size 2MB.</p>
            {uploading && <p className="text-primary-600 font-medium animate-pulse mt-1">Uploading...</p>}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name</label>
              <input type="text" required className="input" {...register('name')} />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input type="email" required className="input" {...register('email')} />
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
              <label className="label">Qualification</label>
              <input type="text" placeholder="e.g. M.Sc Mathematics" className="input" {...register('qualification')} />
            </div>

            <div>
              <label className="label">Specialization</label>
              <input type="text" placeholder="e.g. Calculus, Algebra" className="input" {...register('specialization')} />
            </div>

            <div>
              <label className="label">Joining Date</label>
              <input type="date" className="input" {...register('joiningDate')} />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 flex items-center justify-center gap-2">
            <Save className="w-5 h-5" />
            <span>Save Details</span>
          </button>
        </form>
      </div>
    </div>
  );
};
export default TeacherFormPage;
