import React from 'react';
import { Award } from 'lucide-react';

interface ProgressCardTemplateProps {
  data?: any;
  exam?: any;
  settings?: any;
}

export const ProgressCardTemplate: React.FC<ProgressCardTemplateProps> = ({ 
  data = {}, 
  exam = {}, 
  settings = {} 
}) => {
  // Fallback data for preview
  const safeData = {
    studentName: data.studentName || "VENKATA SAI KUMAR",
    rollNo: data.rollNo || "SVJY-2026-045",
    className: data.className || "Class X",
    section: data.section || "Olympiad Batch",
    mobile: data.mobile || "+91 9876543210",
    rank: data.rank || "1",
    photo: data.photo || "",
    total: data.total || 0,
    academicYear: data.academicYear || "2026-2027",
    location: data.location || "Narasannapeta",
    marks: data.marks && data.marks.length > 0 ? data.marks : [
      { subject: "Mathematics", maxMarks: 100, obtained: 98 },
      { subject: "Physics", maxMarks: 100, obtained: 95 },
      { subject: "Chemistry", maxMarks: 100, obtained: 92 },
    ]
  };

  const TOTAL_MAX_MARKS = safeData.marks.reduce((sum: number, m: any) => sum + (Number(m.maxMarks) || 100), 0);
  const totalPct = TOTAL_MAX_MARKS > 0 ? ((safeData.total / TOTAL_MAX_MARKS) * 100).toFixed(1) : '0.0';
  const barWidth = Math.min(Number(totalPct), 100);
  const PASS_THRESHOLD = 35;

  const examTitle = settings?.examNameOverride || exam?.name || 'EXAMINATION RESULT CARD';
  const logoUrl = settings?.logoUrl;
  const teacherSignatureUrl = settings?.teacherSignatureUrl;
  const principalSignatureUrl = settings?.signatureUrl;

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const resolveUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    return `${API_BASE}${url}`;
  };

  return (
    <div className="w-[794px] h-[1123px] bg-white rounded-xl shadow-2xl flex flex-col relative overflow-hidden font-sans print:shadow-none mx-auto shrink-0" style={{ fontFamily: "'Segoe UI', 'Roboto', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        .jee-card { background: linear-gradient(145deg, #ffffff 0%, #fdfcf9 100%); height: 100%; display: flex; flex-direction: column; position: relative; border: 1px solid #f0e6d2; }
        .jee-card .top-bar { height: 10px; background: linear-gradient(90deg, #0b1a33 0%, #1a4a7a 30%, #f39c12 60%, #d4a017 100%); flex-shrink: 0; }
        .jee-card .card-header { display: flex; align-items: center; padding: 18px 32px 12px 32px; gap: 16px; flex-shrink: 0; border-bottom: 3px solid #f39c12; background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,1)); }
        .jee-card .photo-col { width: 110px; height: 135px; border: 2px solid #e0d4c3; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden; border-radius: 6px; }
        .jee-card .photo-col img { width: 100%; height: 100%; object-fit: cover; object-position: top; }
        .jee-card .card-header .logo-wrap { width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .jee-card .card-header .logo-wrap img { max-width: 100%; max-height: 100px; object-fit: contain; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
        .jee-card .card-header .title-wrap { text-align: center; flex: 1; padding: 0 8px; }
        .jee-card .card-header .title-wrap .school-name { font-size: 28px; font-weight: 900; color: #0b1a33; letter-spacing: 1.5px; font-family: 'Times New Roman', 'Georgia', serif; line-height: 1.2; white-space: nowrap; text-shadow: 1px 1px 0px rgba(0,0,0,0.05); }
        .jee-card .card-header .title-wrap .school-sub { font-size: 16px; font-weight: 400; color: #1a4a7a; letter-spacing: 0.8px; margin: 2px 0; white-space: nowrap; }
        .jee-card .card-header .title-wrap .school-address { font-size: 13px; font-weight: 400; color: #5a7a8a; letter-spacing: 0.3px; margin-top: 2px; white-space: nowrap; }
        .jee-card .card-header .title-wrap .exam-title { font-size: 22px; font-weight: 400; color: #0b1a33; letter-spacing: 2px; margin: 6px 0 0; text-transform: uppercase; white-space: nowrap; }
        .jee-card .card-header .title-wrap .result-card-label { font-size: 18px; font-weight: 400; color: #d4a017; letter-spacing: 4px; margin-top: 2px; text-transform: uppercase; white-space: nowrap; }
        .jee-card .card-header .spacer { width: 100px; flex-shrink: 0; }
        .jee-card .deco-line { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 6px 32px 10px 32px; flex-shrink: 0; }
        .jee-card .deco-line .ornament { font-size: 18px; color: #d4a017; flex-shrink: 0; }
        .jee-card .deco-line .line { flex: 1; max-width: 140px; height: 2px; background: linear-gradient(90deg, transparent, #f39c12, transparent); }
        .jee-card .student-info { margin: 6px 28px 14px 28px; border: 2px solid #f39c12; border-radius: 12px; overflow: hidden; background: linear-gradient(135deg, #ffffff 0%, #fef8f0 100%); box-shadow: 0 6px 20px rgba(243, 156, 18, 0.12); display: grid; grid-template-columns: 1fr auto; flex-shrink: 0; }
        .jee-card .student-info .info-details { display: flex; flex-direction: column; }
        .jee-card .student-info .info-row { display: grid; grid-template-columns: 190px 1fr; border-bottom: 1px solid #f5ede4; }
        .jee-card .student-info .info-row:last-child { border-bottom: none; }
        .jee-card .student-info .info-row .label { background: #fdf9f4; padding: 7px 18px; font-weight: 700; font-size: 13px; color: #6a3a1a; border-right: 1px solid #f5ede4; display: flex; align-items: center; gap: 6px; white-space: nowrap; }
        .jee-card .student-info .info-row .value { padding: 7px 18px; font-weight: 800; font-size: 15px; color: #0b1a33; background: transparent; display: flex; align-items: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .jee-card .student-info .info-row:nth-child(even) { background: #fefcf9; }
        .jee-card .student-info .photo-col { padding: 14px 20px 14px 12px; display: flex; align-items: flex-start; justify-content: center; border-left: 2px solid #f5ede4; background: linear-gradient(180deg, #fefcf9 0%, #fcf7ef 100%); min-width: 130px; }
        .jee-card .student-info .photo-col img { width: 95px; height: 114px; object-fit: cover; border: 3px solid #f39c12; box-shadow: 0 6px 12px rgba(243, 156, 18, 0.2); border-radius: 8px; background: #fff; flex-shrink: 0; }
        .jee-card .student-info .photo-col .placeholder-photo { width: 95px; height: 114px; background: #ede8e0; display: flex; align-items: center; justify-content: center; color: #8a7a6a; font-size: 44px; border: 3px dashed #c8b8a8; border-radius: 6px; flex-shrink: 0; }
        .jee-card .perf-table-wrap { margin: 4px 28px 12px 28px; padding: 0; flex-shrink: 0; }
        .jee-card .perf-table-wrap .perf-title { font-size: 16px; font-weight: 700; color: #0b1a33; margin-bottom: 10px; display: flex; align-items: center; gap: 12px; white-space: nowrap; }
        .jee-card .perf-table-wrap .perf-title .icon { font-size: 22px; }
        .jee-card .perf-table-wrap .perf-title .max-hint { margin-left: auto; font-size: 13px; font-weight: 400; color: #6a8aaa; white-space: nowrap; }
        .perf-table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06); font-size: 14px; border: 2px solid #e8e0d8; }
        .perf-table thead tr { background: linear-gradient(135deg, #0b1a33, #1a4a7a, #0b1a33); }
        .perf-table thead th { color: #ffffff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 12px 16px; text-align: center; white-space: nowrap; font-size: 13px; border: 1px solid rgba(255,255,255,0.1); }
        .perf-table tbody td { padding: 9px 16px; text-align: center; white-space: nowrap; border: 1px solid #e8e0d8; background: #fff; font-weight: 500; color: #0b1a33; }
        .perf-table tbody tr:nth-child(even) td { background: #fdfcf9; }
        .perf-table tbody .subject-label { font-weight: 600; text-align: left; padding-left: 20px; color: #1a3a5a; }
        .perf-table tbody .marks-cell { font-weight: 700; font-size: 16px; }
        .perf-table tbody .max-cell { color: #6a8aaa; font-weight: 400; }
        .perf-table tbody .pct-cell { font-weight: 700; color: #1a4a7a; }
        .perf-table tbody .total-row td { background: linear-gradient(90deg, #fdf9f4, #fff3e0) !important; font-weight: 700; font-size: 15px; border-top: 2.5px solid #f39c12; border-bottom: 2.5px solid #f39c12; }
        .perf-table tbody .total-row .total-label { text-align: left; padding-left: 20px; color: #0b1a33; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .perf-table tbody .total-row .marks-cell { font-size: 19px; color: #c0392b; font-weight: 900; }
        .jee-card .score-bar-wrap { margin: 8px 28px 18px 28px; background: linear-gradient(to right, #ffffff, #f9fbfd); border: 1px solid #dce4ed; border-radius: 12px; padding: 16px 20px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
        .jee-card .score-bar { height: 16px; background: #eef2f7; border-radius: 20px; overflow: hidden; position: relative; border: 1px solid #dce4ed; }
        .jee-card .score-bar .fill { height: 100%; background: linear-gradient(90deg, #1a4a7a, #3498db); border-radius: 20px; transition: width 0.5s ease; position: relative; }
        .jee-card .score-bar .fill::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%); background-size: 200% 100%; animation: shimmer 2s infinite linear; }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .jee-card .score-labels { display: flex; justify-content: space-between; margin-top: 8px; font-size: 12px; font-weight: 600; color: #6a8aaa; }
        .jee-card .result-footer { margin: auto 28px 20px 28px; padding-top: 18px; border-top: 2px dashed #dce4ed; display: flex; justify-content: space-between; align-items: flex-end; }
        .jee-card .result-footer .left { display: flex; flex-direction: column; gap: 4px; }
        .jee-card .result-footer .total-label { font-size: 16px; font-weight: 800; color: #1a4a7a; text-transform: uppercase; letter-spacing: 0.5px; }
        .jee-card .result-footer .percentage { font-size: 46px; font-weight: 900; color: #c0392b; line-height: 1; letter-spacing: -1px; text-shadow: 1px 1px 0px rgba(192,57,43,0.1); }
        .jee-card .result-footer .signatures { display: flex; gap: 40px; }
        .jee-card .result-footer .sig-block { display: flex; flex-direction: column; align-items: center; width: 140px; }
        .jee-card .result-footer .sig-block img { max-width: 140px; max-height: 50px; object-fit: contain; margin-bottom: 6px; }
        .jee-card .result-footer .sig-block .sig-placeholder { width: 100%; height: 50px; border-bottom: 1.5px dashed #c8d6e4; margin-bottom: 6px; }
        .jee-card .result-footer .sig-label { font-size: 13px; font-weight: 600; color: #1a3a5a; text-align: center; }
        .jee-card .card-footer-note { background: #0b1a33; color: #aabaca; font-size: 11px; text-align: center; padding: 8px; font-weight: 500; letter-spacing: 0.5px; flex-shrink: 0; }
      `}</style>

      <div className="jee-card">
        <div className="top-bar"></div>

        <div className="card-header">
            <div className="logo-wrap">
              {logoUrl ? (
                <img src={resolveUrl(logoUrl)} alt="Logo" />
              ) : (
                <Award className="w-12 h-12 text-[#1a4a7a]" />
              )}
            </div>
            <div className="title-wrap">
                <div className="school-name">SRI VENKATESWARA JY SCHOOL</div>
                <div className="school-sub">(IIT-JEE / NEET Foundation · Olympiads)</div>
                <div className="school-address">Opp. Hero Showroom, SVL Paradise Campus, Narasannapeta</div>
                <div className="exam-title">{examTitle}</div>
                <div className="result-card-label">✦ RESULT CARD ✦</div>
            </div>
            <div className="spacer"></div>
        </div>

        <div className="deco-line">
            <span className="ornament">✦</span>
            <div className="line"></div>
            <span className="ornament" style={{ color: '#d4a017' }}>★</span>
            <div className="line"></div>
            <span className="ornament">✦</span>
        </div>

        <div className="student-info">
            <div className="info-details">
                <div className="info-row">
                    <div className="label">👤 Student Name</div>
                    <div className="value">{safeData.studentName}</div>
                </div>
                <div className="info-row">
                    <div className="label">🆔 Student ID</div>
                    <div className="value">{safeData.rollNo}</div>
                </div>
                <div className="info-row">
                    <div className="label">📚 Class</div>
                    <div className="value">{safeData.className}</div>
                </div>
                <div className="info-row">
                    <div className="label">📖 Section</div>
                    <div className="value">{safeData.section}</div>
                </div>
                <div className="info-row">
                    <div className="label">📞 Mobile</div>
                    <div className="value">{safeData.mobile}</div>
                </div>
                <div className="info-row">
                    <div className="label">📅 Academic Year</div>
                    <div className="value">{safeData.academicYear}</div>
                </div>
                <div className="info-row">
                    <div className="label">📍 Location</div>
                    <div className="value">{safeData.location}</div>
                </div>
                {safeData.rank && (
                  <div className="info-row">
                    <div className="label">🏅 Class Rank</div>
                    <div className="value">#{safeData.rank}</div>
                  </div>
                )}
            </div>
            <div className="photo-col">
                {safeData.photo ? (
                  <img src={resolveUrl(safeData.photo)} alt="Student Photo" />
                ) : (
                  <div className="placeholder-photo">📷</div>
                )}
            </div>
        </div>

        <div className="perf-table-wrap">
            <div className="perf-title">
                <span className="icon">📊</span>
                <span>Performance Summary</span>
                <span className="max-hint">Max Marks: {TOTAL_MAX_MARKS}</span>
            </div>

            <table className="perf-table">
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', paddingLeft: '20px' }}>Subject</th>
                        <th>Marks</th>
                        <th>Max Marks</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
                    {safeData.marks.map((sub: any, i: number) => {
                      const max = Number(sub.maxMarks) || 100;
                      const obt = Number(sub.obtained) || 0;
                      const subPct = max > 0 ? ((obt / max) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={i}>
                            <td className="subject-label"><span className="sub-icon">📘</span> {sub.subject}</td>
                            <td className="marks-cell">{obt}</td>
                            <td className="max-cell">{max}</td>
                            <td className="pct-cell">{subPct}%</td>
                        </tr>
                      );
                    })}
                    <tr className="total-row">
                        <td className="total-label">📌 TOTAL</td>
                        <td className="marks-cell">{safeData.total}</td>
                        <td className="max-cell">{TOTAL_MAX_MARKS}</td>
                        <td className="pct-cell">{totalPct}%</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div className="score-bar-wrap">
            <div className="score-bar">
                <div className="fill" style={{ width: `${barWidth}%` }}></div>
            </div>
            <div className="score-labels">
                <span>0</span>
                <span>Threshold: {PASS_THRESHOLD}%</span>
                <span>{TOTAL_MAX_MARKS}</span>
            </div>
        </div>

        <div className="result-footer">
            <div className="left">
                <div className="total-label">📋 Total Marks: {safeData.total} / {TOTAL_MAX_MARKS}</div>
                <div className="percentage">{totalPct}%</div>
            </div>
            <div className="signatures">
                <div className="sig-block">
                    {teacherSignatureUrl ? (
                      <img src={resolveUrl(teacherSignatureUrl)} alt="Teacher Signature" />
                    ) : (
                      <div className="sig-placeholder"></div>
                    )}
                    <div className="sig-label">✍ Teacher Signature</div>
                </div>
                <div className="sig-block">
                    {principalSignatureUrl ? (
                      <img src={resolveUrl(principalSignatureUrl)} alt="Principal Signature" />
                    ) : (
                      <div className="sig-placeholder"></div>
                    )}
                    <div className="sig-label">✍ Principal Signature</div>
                </div>
            </div>
        </div>

        <div className="card-footer-note">
            ★ This is a system-generated result card for {examTitle} ★
        </div>
      </div>
    </div>
  );
};
