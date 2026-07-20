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
    <div className="admit-card-wrapper bg-white rounded-none sm:rounded-xl p-4 sm:p-6">
      <div className="w-full h-full border-[6px] border-double border-indigo-900 rounded-3xl relative flex flex-col bg-white overflow-hidden">
        
        {/* Watermark removed as requested */}

        {/* Header */}
        <div className="relative z-10 bg-gradient-to-r from-indigo-900 via-blue-800 to-indigo-900 text-white p-6 sm:p-8 flex items-center gap-6 border-b-4 border-amber-400">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-amber-400 shrink-0 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" crossOrigin="anonymous" className="w-full h-full object-contain p-1" />
            ) : (
              <span className="text-4xl font-black text-indigo-900">SV JY</span>
            )}
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-black uppercase tracking-wider text-amber-300 drop-shadow-md mb-2">SRI VENKATESWARA JY SCHOOL</h1>
            <p className="text-sm font-semibold tracking-widest uppercase text-blue-100 mb-2">(IIT-JEE/NEET Foundation – Olympiads)</p>
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-indigo-100">
              <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="relative z-10 text-center py-5 bg-indigo-50 border-b border-indigo-100">
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-indigo-900">Admit Card</h2>
          <div className="inline-block mt-2 px-6 py-1.5 bg-amber-400 text-indigo-900 font-bold text-sm rounded-full shadow-sm uppercase tracking-wide">
            {settings.examTitleOverride || `${exam?.name} (2026-2027)`}
          </div>
        </div>

        {/* Main Body */}
        <div className="relative z-10 p-8 sm:p-10 flex-1 flex flex-col gap-10">
          <div className="flex gap-10 items-start">
            {/* Student Info */}
            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6">
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Candidate Name</p>
                <p className="text-xl font-black text-indigo-950 uppercase whitespace-nowrap overflow-hidden text-ellipsis">{student?.user?.name || student?.name}</p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Roll Number</p>
                <p className="text-xl font-black text-indigo-950">{student?.rollNo || 'N/A'}</p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Class & Section</p>
                <p className="text-lg font-bold text-indigo-900">{className || student?.class?.name || student?.className || '-'} {section || student?.class?.section || student?.section ? `- ${section || student?.class?.section || student?.section}` : ''}</p>
              </div>
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Date of Birth</p>
                <p className="text-lg font-bold text-indigo-900">12/05/2010</p>
              </div>
              <div className="col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider mb-1">Examination Center</p>
                <p className="text-base font-bold text-indigo-900">{settings.examCenterOverride || 'JY School Main Campus, Hall A'}</p>
              </div>
            </div>

            {/* Photo Area */}
            <div className="w-[120px] h-[150px] border-2 border-indigo-300 bg-indigo-50/50 rounded-xl flex flex-col items-center justify-center text-indigo-300 shrink-0 p-2 relative shadow-inner">
              <div className="w-full h-full border border-dashed border-indigo-300 rounded-lg flex flex-col items-center justify-center bg-white overflow-hidden">
                {student?.user?.photoUrl ? (
                  <img src={student.user.photoUrl} alt="Student" crossOrigin="anonymous" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <User className="w-10 h-10 mb-2 opacity-50 text-indigo-300" />
                    <span className="text-[9px] uppercase font-bold text-center leading-tight">Affix<br/>Passport<br/>Size Photo</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Exam Schedule */}
          <div className="flex-1">
            <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest mb-4 flex items-center gap-2 bg-indigo-50 py-2 px-4 rounded-lg border-l-4 border-indigo-600">
              <Calendar className="w-5 h-5 text-indigo-600" /> Examination Schedule
            </h4>
            <div className="rounded-xl overflow-hidden border border-indigo-200 shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-indigo-600 text-white">
                  <tr>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider w-16 text-center">S.No</th>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">Date</th>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">Subject</th>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider">Time</th>
                    <th className="py-3 px-4 font-bold uppercase text-[11px] tracking-wider border-l border-indigo-500/50">Invigilator Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-100 bg-white">
                  {(settings.schedule?.length > 0 ? settings.schedule : examPlans)?.map((plan: any, i: number) => (
                    <tr key={plan.id || i}>
                      <td className="py-3 px-4 font-bold text-indigo-950 text-center">{i + 1}</td>
                      <td className="py-3 px-4 font-bold text-indigo-950">{plan.date || plan.examDate ? new Date(plan.date || plan.examDate).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="py-3 px-4 font-black text-indigo-900">{plan.subject?.name || plan.subject}</td>
                      <td className="py-3 px-4 text-indigo-800 font-semibold text-xs">{plan.timing || `${plan.startTime || ''} ${plan.startTime && plan.endTime ? '-' : ''} ${plan.endTime || ''}`}</td>
                      <td className="py-3 px-4 border-l border-indigo-100"></td>
                    </tr>
                  ))}
                  {(!settings.schedule?.length && (!examPlans || examPlans.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-indigo-400 font-medium">No schedule mapped for this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="relative z-10 bg-indigo-50/50 mt-auto p-8 border-t border-indigo-100">
          <div className="grid grid-cols-3 gap-8 items-end">
            <div className="col-span-2">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-indigo-900 mb-2">Important Instructions:</h5>
              <ul className="text-[9px] text-indigo-800 font-medium space-y-1.5 list-disc pl-4">
                {instructions.split('\n').filter(Boolean).map((line: string, idx: number) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="text-center">
              <div className="w-48 mx-auto border-b-2 border-indigo-800 mb-2 h-16 flex items-end justify-center">
                {signatureUrl && <img src={signatureUrl} alt="Signature" crossOrigin="anonymous" className="h-14 object-contain" />}
              </div>
              <p className="text-[10px] uppercase font-black tracking-widest text-indigo-900 mt-1">Principal Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
