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
    <div className="admit-card-wrapper bg-white p-4 sm:p-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="w-full h-full border border-gray-200 rounded-3xl relative flex flex-col bg-white overflow-hidden shadow-sm">
        
        {/* Top Accent Bar */}
        <div className="h-3 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        {/* Header - Modern & Clean */}
        <div className="p-6 sm:p-8 flex items-center justify-between bg-slate-50 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-slate-800 mb-1">
              SRI VENKATESWARA JY SCHOOL
            </h1>
            <p className="text-sm font-bold uppercase text-blue-600 mb-2 tracking-wide">
              (IIT-JEE/NEET Foundation – Olympiads)
            </p>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta
            </div>
          </div>
          <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-2xl flex items-center justify-center shrink-0 border shadow-sm p-2 ml-4">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" crossOrigin="anonymous" className="w-full h-full object-contain" />
            ) : (
              <span className="text-xl font-black text-slate-300">LOGO</span>
            )}
          </div>
        </div>

        {/* Title Badge */}
        <div className="flex justify-center -mt-5 relative z-10">
          <div className="bg-white border border-gray-200 shadow-md rounded-full px-8 py-2 flex flex-col items-center">
            <h2 className="text-xl font-black uppercase tracking-widest text-indigo-600">
              Admit Card
            </h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
              {settings.examTitleOverride || `${exam?.name} (2026-2027)`}
            </span>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 flex flex-col gap-8 p-6 sm:p-8 mt-2">
          
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            
            {/* Student Info - One by One Vertical List */}
            <div className="flex-1 w-full bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-5 py-3 border-b border-gray-200">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" /> Candidate Details
                </h3>
              </div>
              <div className="divide-y divide-gray-100 text-sm">
                <div className="grid grid-cols-3 hover:bg-slate-50/50 transition-colors">
                  <div className="p-3 px-5 font-bold text-slate-500 uppercase text-[11px] tracking-wider flex items-center">Candidate Name</div>
                  <div className="col-span-2 p-3 px-5 font-black text-slate-800 text-base uppercase">
                    {student?.user?.name || student?.name}
                  </div>
                </div>
                <div className="grid grid-cols-3 hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                  <div className="p-3 px-5 font-bold text-slate-500 uppercase text-[11px] tracking-wider flex items-center">Roll Number</div>
                  <div className="col-span-2 p-3 px-5 font-bold text-slate-800 text-base">
                    {student?.rollNo || 'N/A'}
                  </div>
                </div>
                <div className="grid grid-cols-3 hover:bg-slate-50/50 transition-colors">
                  <div className="p-3 px-5 font-bold text-slate-500 uppercase text-[11px] tracking-wider flex items-center">Class</div>
                  <div className="col-span-2 p-3 px-5 font-bold text-slate-800">
                    {className || student?.class?.name || student?.className || '-'}
                  </div>
                </div>
                <div className="grid grid-cols-3 hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                  <div className="p-3 px-5 font-bold text-slate-500 uppercase text-[11px] tracking-wider flex items-center">Section</div>
                  <div className="col-span-2 p-3 px-5 font-bold text-slate-800">
                    {section || student?.class?.section || student?.section || '-'}
                  </div>
                </div>
                <div className="grid grid-cols-3 hover:bg-slate-50/50 transition-colors">
                  <div className="p-3 px-5 font-bold text-slate-500 uppercase text-[11px] tracking-wider flex items-center">Gender</div>
                  <div className="col-span-2 p-3 px-5 font-bold text-slate-800">
                    {student?.gender || 'Male'}
                  </div>
                </div>
                <div className="grid grid-cols-3 hover:bg-slate-50/50 transition-colors bg-slate-50/30">
                  <div className="p-3 px-5 font-bold text-slate-500 uppercase text-[11px] tracking-wider flex items-center">Date of Birth</div>
                  <div className="col-span-2 p-3 px-5 font-bold text-slate-800">
                    12/05/2010
                  </div>
                </div>
                <div className="grid grid-cols-3 hover:bg-slate-50/50 transition-colors">
                  <div className="p-3 px-5 font-bold text-slate-500 uppercase text-[11px] tracking-wider flex items-center">Exam Center</div>
                  <div className="col-span-2 p-3 px-5 font-bold text-indigo-600">
                    {settings.examCenterOverride || 'JY School Main Campus, Hall A'}
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Area */}
            <div className="w-[140px] shrink-0 flex flex-col gap-3">
              <div className="w-full aspect-[3/4] border-2 border-gray-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 relative p-2 bg-slate-50 shadow-sm overflow-hidden">
                {student?.user?.photoUrl ? (
                  <img src={student.user.photoUrl} alt="Student" crossOrigin="anonymous" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center p-2 bg-white">
                    <User className="w-10 h-10 mb-2 opacity-30 text-slate-400" />
                    <span className="text-[10px] uppercase font-bold leading-tight text-slate-400">Affix<br/>Passport<br/>Photo</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Exam Schedule */}
          <div>
            <div className="flex items-center gap-2 mb-3 px-2">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Examination Schedule
              </h4>
            </div>
            <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-5 font-black uppercase text-[11px] tracking-widest text-center w-14">S.No</th>
                    <th className="py-3 px-5 font-black uppercase text-[11px] tracking-widest">Date</th>
                    <th className="py-3 px-5 font-black uppercase text-[11px] tracking-widest">Subject</th>
                    <th className="py-3 px-5 font-black uppercase text-[11px] tracking-widest">Time</th>
                    <th className="py-3 px-5 font-black uppercase text-[11px] tracking-widest text-center">Invigilator Sign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {(settings.schedule?.length > 0 ? settings.schedule : examPlans)?.map((plan: any, i: number) => (
                    <tr key={plan.id || i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-5 font-bold text-center text-slate-400">{i + 1}</td>
                      <td className="py-3 px-5 font-bold text-slate-700">{plan.date || plan.examDate ? new Date(plan.date || plan.examDate).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="py-3 px-5 font-black text-slate-900">{plan.subject?.name || plan.subject}</td>
                      <td className="py-3 px-5 font-bold text-indigo-600">{plan.timing || `${plan.startTime || ''} ${plan.startTime && plan.endTime ? '-' : ''} ${plan.endTime || ''}`}</td>
                      <td className="py-3 px-5 text-center text-gray-300">...............</td>
                    </tr>
                  ))}
                  {(!settings.schedule?.length && (!examPlans || examPlans.length === 0)) && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium bg-slate-50/50">No schedule mapped for this class.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Notes & Signatures */}
        <div className="mt-4 mx-6 mb-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between gap-8 px-2">
          <div className="flex-1">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
              <span className="bg-red-500 w-1.5 h-4 rounded-full"></span> Important Instructions
            </h5>
            <ul className="text-[10.5px] text-slate-600 font-medium space-y-1.5 list-decimal pl-4 pr-4 text-justify leading-relaxed">
              {instructions.split('\n').filter(Boolean).map((line: string, idx: number) => (
                <li key={idx} className="pl-1">{line}</li>
              ))}
            </ul>
          </div>
          <div className="text-center w-56 shrink-0 flex flex-col items-center justify-end">
            <div className="w-full h-20 flex items-end justify-center mb-2 border-b border-gray-300 border-dashed pb-1">
              {signatureUrl && <img src={signatureUrl} alt="Signature" crossOrigin="anonymous" className="h-16 object-contain" />}
            </div>
            <p className="text-[11px] uppercase font-black tracking-widest text-slate-800">Principal Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
