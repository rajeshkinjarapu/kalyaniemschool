import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Avatar } from '../../components/UI/Avatar';
import { Badge } from '../../components/UI/Badge';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Mail, Phone, Printer, User2, Calendar, 
  Droplet, ClipboardCheck, Users, Fingerprint, 
  Hash, MapPin, Sparkles, GraduationCap, Camera 
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchStudentProfile = async () => {
    try {
      const res: any = await api.get(`/api/students/${id}`);
      setStudent(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    const loadingToast = toast.loading('Uploading photo...');
    try {
      // 1. Upload the image to backend
      const uploadRes: any = await api.post('/api/uploads/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const uploadedUrl = uploadRes.data.url || uploadRes.data.data?.url;
      if (!uploadedUrl) throw new Error('Upload returned no URL');

      // 2. Save the uploaded URL to the student database
      await api.put(`/api/students/${student.id}`, {
        name: student.user.name,
        photoUrl: uploadedUrl,
      });

      toast.success('Photo updated successfully!', { id: loadingToast });
      // 3. Refresh profile details
      fetchStudentProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload photo', { id: loadingToast });
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  if (loading) return <LoadingSpinner size="lg" className="h-[50vh]" />;
  if (!student) return <div className="text-center py-12">Student profile not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-4 print:max-w-full print:p-0">
      
      {/* ================= SCREEN-ONLY VIEW (Hidden in print) ================= */}
      <div className="space-y-6 print:hidden">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          <Link 
            to="/students" 
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Students
          </Link>
          <button
            onClick={() => window.print()}
            className="btn-primary flex items-center gap-2 text-xs font-bold shadow-md hover:scale-102 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Profile</span>
          </button>
        </div>

        {/* Profile ID Card Details */}
        <div className="relative overflow-hidden card p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/10 rounded-full blur-2xl -ml-20 -mb-20" />

          <div className="relative z-10 flex flex-col items-center gap-3">
            <Avatar 
              name={student.user.name} 
              src={student.user.photoUrl} 
              size="lg" 
              variant="rectangular" 
              className="w-28 h-36 md:w-32 md:h-40 rounded-2xl ring-4 ring-primary-500/10 shadow-lg object-cover" 
            />
            {/* Upload Button */}
            <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 dark:bg-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-xl transition-colors border border-primary-200 dark:border-gray-700 shadow-sm hover:scale-102 active:scale-98 select-none">
              <Camera className="w-3.5 h-3.5" />
              <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload} 
                disabled={uploading}
              />
            </label>
          </div>
          
          <div className="relative z-10 flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 justify-center md:justify-start">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                {student.user.name}
              </h2>
              <div className="flex justify-center md:justify-start gap-1.5">
                <Badge variant="info" className="px-2.5 py-0.5 font-bold tracking-wide">
                  Roll No: {student.rollNo}
                </Badge>
                <Badge variant="success" className="px-2.5 py-0.5 font-bold tracking-wide">
                  Class: {student.class ? `${student.class.name}-${student.class.section}` : 'N/A'}
                </Badge>
              </div>
            </div>
            
            <p className="text-gray-400 dark:text-gray-500 text-sm font-semibold flex items-center justify-center md:justify-start gap-1.5">
              <GraduationCap className="w-4 h-4 text-primary-500" />
              <span>Academic Profile Ledger Roster</span>
            </p>
          </div>
        </div>

        {/* Grid details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card Left: Student Profile Details */}
          <div className="card p-6 md:col-span-2 space-y-6">
            <h3 className="font-extrabold text-lg border-b pb-2.5 text-gray-955 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Academic Profile Details</span>
            </h3>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <User2 className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Gender</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.gender || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Calendar className="w-4.5 h-4.5 text-indigo-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Date of Birth</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Droplet className="w-4.5 h-4.5 text-red-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Blood Group</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.bloodGroup || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <ClipboardCheck className="w-4.5 h-4.5 text-teal-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Admission Date</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {new Date(student.admissionDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Users className="w-4.5 h-4.5 text-amber-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Father's Name</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.fatherName || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Users className="w-4.5 h-4.5 text-pink-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Mother's Name</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.motherName || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Fingerprint className="w-4.5 h-4.5 text-purple-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Aadhar Number</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.aadharNo || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-3 items-start">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/40">
                  <Hash className="w-4.5 h-4.5 text-sky-500" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">PEN Number</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.penNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Home Address</span>
              <p className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/60 font-semibold text-gray-700 dark:text-gray-300">
                {student.address || 'No address provided'}
              </p>
            </div>
          </div>

          {/* Profile Card Right: Guardian Contact */}
          <div className="card p-6 space-y-6">
            <h3 className="font-extrabold text-lg border-b pb-2.5 text-gray-950 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-500" />
              <span>Guardian Contact</span>
            </h3>

            {student.parent ? (
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Name</span>
                  <span className="font-extrabold text-gray-900 dark:text-white">{student.parent.user.name}</span>
                </div>
                {user?.role !== 'STUDENT' && student.parent.user.email && (
                  <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold">{student.parent.user.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-gray-700 dark:text-gray-300">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">{student.parent.user.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Relation</span>
                  <span className="font-bold text-gray-900 dark:text-white">{student.parent.relation || 'Guardian'}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No guardian details linked to this profile.</p>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
             ================= PRINT-ONLY DOSSIER VIEW =================
             ============================================================ */}
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
        `}
      </style>
      <div className="hidden print:flex print:w-[210mm] print:h-[297mm] bg-white text-black font-sans relative flex-col mx-auto box-border overflow-hidden" style={{ pageBreakAfter: 'always' }}>
        
        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <div className="w-[150mm] h-[150mm] rounded-full border-[20px] border-gray-900 flex items-center justify-center">
             <span className="text-9xl font-black tracking-tighter">JY</span>
          </div>
        </div>

        {/* Decorative Border */}
        <div className="absolute inset-[10mm] border-[4px] border-double border-gray-800 pointer-events-none opacity-90" />
        <div className="absolute inset-[11.5mm] border border-gray-400 pointer-events-none" />
        
        <div className="p-[20mm] h-full flex flex-col relative z-10 w-full">
          
          {/* Header */}
          <div className="text-center mb-8 border-b-[3px] border-gray-900 pb-6 relative">
            <h1 className="text-5xl font-black tracking-[0.2em] uppercase text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              JY SCHOOL
            </h1>
            <p className="text-[13px] font-bold uppercase tracking-widest text-gray-700">
              Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
            </p>
            <div className="mt-6 inline-flex px-12 py-2.5 bg-gray-900 rounded-sm">
              <span className="text-sm font-black uppercase tracking-[0.3em] text-white">
                Official Student Record
              </span>
            </div>
          </div>

          {/* Student ID block */}
          <div className="flex justify-between items-center mb-10 bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div>
              <h2 className="text-4xl font-black text-gray-900 leading-none mb-4">{student.user.name}</h2>
              <div className="flex gap-6 text-sm font-bold text-gray-700 inline-flex">
                <span className="uppercase tracking-wider">Roll No: <span className="text-black font-black text-lg">{student.rollNo}</span></span>
                <span className="text-gray-400">•</span>
                <span className="uppercase tracking-wider">Class: <span className="text-black font-black text-lg">{student.class ? `${student.class.name} - ${student.class.section}` : 'N/A'}</span></span>
              </div>
            </div>
            
            <div className="w-36 h-44 border-4 border-white rounded-lg overflow-hidden flex-shrink-0 bg-white flex items-center justify-center shadow-md">
              <Avatar 
                name={student.user.name} 
                src={student.user.photoUrl} 
                size="lg" 
                variant="rectangular" 
                className="w-full h-full object-cover" 
              />
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-x-12 gap-y-10 flex-grow text-[13px]">
            <div className="space-y-7">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-2">Personal Details</h3>
              
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Gender</span>
                <span className="col-span-2 font-bold text-black text-right">{student.gender || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Date of Birth</span>
                <span className="col-span-2 font-bold text-black text-right">
                  {student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                </span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Blood Group</span>
                <span className="col-span-2 font-bold text-black text-right">{student.bloodGroup || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Admission</span>
                <span className="col-span-2 font-bold text-black text-right">
                  {new Date(student.admissionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5 mt-8">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Aadhar No</span>
                <span className="col-span-2 font-bold text-black text-right">{student.aadharNo || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">PEN No</span>
                <span className="col-span-2 font-bold text-black text-right">{student.penNumber || 'N/A'}</span>
              </div>
            </div>

            <div className="space-y-7">
              <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 border-b-2 border-gray-200 pb-2">Family & Contact</h3>
              
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Father Name</span>
                <span className="col-span-2 font-bold text-black text-right">{student.fatherName || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Mother Name</span>
                <span className="col-span-2 font-bold text-black text-right">{student.motherName || 'N/A'}</span>
              </div>
              
              {student.parent && (
                <>
                  <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5 mt-4">
                    <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Guardian</span>
                    <span className="col-span-2 font-bold text-black text-right">{student.parent.user.name}</span>
                  </div>
                  <div className="grid grid-cols-3 items-end border-b border-dotted border-gray-300 pb-1.5">
                    <span className="col-span-1 text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Contact</span>
                    <span className="col-span-2 font-bold text-black text-right">{student.parent.user.phone || 'N/A'}</span>
                  </div>
                </>
              )}
              
              <div className="flex flex-col gap-1.5 pt-6">
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Residential Address</span>
                <span className="text-sm font-bold text-black leading-relaxed p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[72px]">
                  {student.address || 'No address provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Signatures */}
          <div className="mt-auto mb-6 flex justify-between items-end px-6">
            <div className="text-center w-56">
              <div className="h-0 border-b-2 border-gray-800 w-full mb-3"></div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Class Teacher
              </span>
            </div>
            
            <div className="w-32 h-32 rounded-full border-[3px] border-double border-gray-300 flex items-center justify-center bg-gray-50 -my-4 relative z-0">
               <span className="text-gray-400 font-bold uppercase tracking-[0.1em] text-[9px] rotate-[-20deg] text-center leading-tight">School<br/>Seal</span>
            </div>

            <div className="text-center w-56">
              <div className="h-0 border-b-2 border-gray-800 w-full mb-3"></div>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Principal / Registrar
              </span>
            </div>
          </div>

          {/* System generated stamp */}
          <div className="text-center pt-4 border-t border-gray-300">
             <span className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                System Generated • Date: {new Date().toLocaleDateString('en-IN')} • JY SCHOOL Student Database
             </span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default StudentProfilePage;
