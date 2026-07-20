import React from 'react';
import { User, Calendar, MapPin } from 'lucide-react';

interface AdmitCardTemplateProps {
  student: any;
  exam: any;
  examPlans: any[];
  className?: string;
  section?: string;
}

export const AdmitCardTemplate: React.FC<AdmitCardTemplateProps> = ({ student, exam, examPlans, className, section }) => {
  const settings = exam?.admitCardSettings || {};
  const instructions = settings.instructions || 'Candidate must carry this Admit Card to the examination hall.\nElectronic devices including calculators and mobile phones are strictly prohibited.\nCandidate should report to the examination center 30 minutes before commencement.';
  
  // Resolve relative /uploads/ paths to the backend URL so images load correctly on Vercel
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };
  
  const signatureUrl = resolveUrl(settings.signatureUrl || '');
  const logoUrl = resolveUrl(settings.logoUrl || '');

  return (
    <div className="admit-card-wrapper bg-white p-4 sm:p-6" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div className="w-full h-full border-4 border-indigo-900 rounded-2xl relative flex flex-col bg-white overflow-hidden shadow-sm">
        
        {/* Header - Colorful & Professional */}
        <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-900 p-4 sm:p-6 flex items-center justify-between border-b-4 border-amber-400">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-full flex items-center justify-center shrink-0 border-2 border-amber-400 shadow-md p-1">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" crossOrigin="anonymous" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xl font-black text-indigo-900">LOGO</span>
            )}
          </div>
          <div className="flex-1 text-center px-4">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-black uppercase tracking-wide text-white mb-1 whitespace-nowrap drop-shadow-md">
              SRI VENKATESWARA JY SCHOOL
            </h1>
            <p className="text-xs sm:text-sm font-bold uppercase text-amber-300 mb-1 tracking-wider">
              (IIT-JEE/NEET Foundation – Olympiads)
            </p>
            <p className="text-xs font-medium text-blue-100">
              Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
            </p>
          </div>
          <div className="w-20 sm:w-24 shrink-0"></div> {/* Spacer for centering */}
        </div>

        {/* Title */}
        <div className="text-center py-4 bg-indigo-50 border-b border-indigo-100 shadow-sm relative z-10">
          <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-indigo-900 drop-shadow-sm">
            Admit Card
          </h2>
          <div className="inline-block mt-1 px-6 py-1 bg-amber-400 text-indigo-950 font-bold text-xs rounded-full uppercase tracking-widest shadow-sm">
            {settings.examTitleOverride || `${exam?.name} (2026-2027)`}
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col gap-6 p-6">
          <div className="flex gap-6 items-start">
            {/* Student Info Table */}
            <div className="flex-1 border-2 border-indigo-100 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <tbody>
                  <tr className="border-b border-indigo-100">
                    <td className="p-3 sm:p-4 font-bold bg-indigo-50 border-r border-indigo-100 w-1/3 text-indigo-900 text-xs uppercase tracking-wider">Candidate Name</td>
                    <td className="p-3 sm:p-4 font-black text-gray-800 uppercase text-base" colSpan={3}>
                      {student?.user?.name || student?.name}
                    </td>
                  </tr>
                  <tr className="border-b border-indigo-100">
                    <td className="p-3 sm:p-4 font-bold bg-indigo-50 border-r border-indigo-100 text-indigo-900 text-xs uppercase tracking-wider">Roll Number</td>
                    <td className="p-3 sm:p-4 font-bold text-gray-800 border-r border-indigo-100 w-1/4 text-base">
                      {student?.rollNo || 'N/A'}
                    </td>
                    <td className="p-3 sm:p-4 font-bold bg-indigo-50 border-r border-indigo-100 text-indigo-900 text-xs uppercase tracking-wider">Class & Section</td>
                    <td className="p-3 sm:p-4 font-bold text-gray-800 text-base">
                      {className || student?.class?.name || student?.className || '-'} {section || student?.class?.section || student?.section ? `- ${section || student?.class?.section || student?.section}` : ''}
                    </td>
                  </tr>
                  <tr className="border-b border-indigo-100">
                    <td className="p-3 sm:p-4 font-bold bg-indigo-50 border-r border-indigo-100 text-indigo-900 text-xs uppercase tracking-wider">Date of Birth</td>
                    <td className="p-3 sm:p-4 font-bold text-gray-800 border-r border-indigo-100">
                      12/05/2010
                    </td>
                    <td className="p-3 sm:p-4 font-bold bg-indigo-50 border-r border-indigo-100 text-indigo-900 text-xs uppercase tracking-wider">Gender</td>
                    <td className="p-3 sm:p-4 font-bold text-gray-800">
                      {student?.gender || 'Male'}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 sm:p-4 font-bold bg-indigo-50 border-r border-indigo-100 text-indigo-900 text-xs uppercase tracking-wider">Exam Center</td>
                    <td className="p-3 sm:p-4 font-bold text-gray-800" colSpan={3}>
                      {settings.examCenterOverride || 'JY School Main Campus, Hall A'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Photo Area */}
            <div className="w-[120px] h-[150px] border-2 border-indigo-200 rounded-xl flex flex-col items-center justify-center text-indigo-400 shrink-0 relative p-1.5 bg-indigo-50/50 shadow-inner">
              {student?.user?.photoUrl ? (
                <img src={student.user.photoUrl} alt="Student" crossOrigin="anonymous" className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="w-full h-full border border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center text-center p-2 bg-white">
                  <User className="w-8 h-8 mb-2 opacity-40 text-indigo-500" />
                  <span className="text-[9px] uppercase font-bold leading-tight text-indigo-600">Affix<br/>Passport<br/>Size Photo</span>
                </div>
              )}
            </div>
          </div>

          {/* Exam Schedule */}
          <div>
            <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="bg-indigo-600 p-1.5 rounded-md text-white shadow-sm">
                <Calendar className="w-4 h-4" /> 
              </span>
              Examination Schedule
            </h4>
            <div className="border border-indigo-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="py-2.5 px-4 font-bold uppercase text-[11px] tracking-wider border-r border-indigo-500 text-center w-12">S.No</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[11px] tracking-wider border-r border-indigo-500">Date</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[11px] tracking-wider border-r border-indigo-500">Subject</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[11px] tracking-wider border-r border-indigo-500">Time</th>
                    <th className="py-2.5 px-4 font-bold uppercase text-[11px] tracking-wider">Invigilator Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100 bg-white">
                  {(settings.schedule?.length > 0 ? settings.schedule : examPlans)?.map((plan: any, i: number) => (
                    <tr key={plan.id || i} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="py-2.5 px-4 font-bold text-center border-r border-indigo-100 text-gray-600">{i + 1}</td>
                      <td className="py-2.5 px-4 font-bold border-r border-indigo-100 text-gray-800">{plan.date || plan.examDate ? new Date(plan.date || plan.examDate).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="py-2.5 px-4 font-black border-r border-indigo-100 text-indigo-950">{plan.subject?.name || plan.subject}</td>
                      <td className="py-2.5 px-4 font-bold border-r border-indigo-100 text-gray-700">{plan.timing || `${plan.startTime || ''} ${plan.startTime && plan.endTime ? '-' : ''} ${plan.endTime || ''}`}</td>
                      <td className="py-2.5 px-4"></td>
                    </tr>
                  ))}
                  {(!settings.schedule?.length && (!examPlans || examPlans.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400 font-medium bg-gray-50">No schedule mapped for this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="mt-6 mx-6 mb-6 p-6 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-col sm:flex-row justify-between gap-8">
          <div className="flex-1">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-900 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Important Instructions
            </h5>
            <ul className="text-[10.5px] text-gray-700 font-medium space-y-1.5 list-decimal pl-4 pr-4 text-justify leading-relaxed">
              {instructions.split('\n').filter(Boolean).map((line: string, idx: number) => (
                <li key={idx} className="pl-1">{line}</li>
              ))}
            </ul>
          </div>
          <div className="text-center w-56 shrink-0 flex flex-col items-center justify-end">
            <div className="w-full h-24 flex items-end justify-center mb-2 border-b-2 border-indigo-200 border-dashed pb-1">
              {signatureUrl && <img src={signatureUrl} alt="Signature" crossOrigin="anonymous" className="h-20 object-contain" />}
            </div>
            <p className="text-[11px] uppercase font-black tracking-widest text-indigo-900">Principal Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
