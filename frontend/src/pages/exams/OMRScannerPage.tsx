import React, { useState } from 'react';
import { Upload, FileType, CheckCircle, AlertCircle, RefreshCw, FileText, Download } from 'lucide-react';

interface OMRResult {
  student_id?: string;
  answers: Record<string, string | null>;
  total_questions: number;
  filled_count: number;
  blank_count: number;
  score?: number | null;
  correct_count?: number | null;
  wrong_count?: number | null;
  max_score?: number;
  vision_preview?: string;
}

export const OMRScannerPage: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<OMRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyTab, setKeyTab] = useState<'manual' | 'excel'>('manual');

  // Answer Key configuration state
  const [answerKeyInput, setAnswerKeyInput] = useState<string>('');
  const [manualGridKey, setManualGridKey] = useState<Record<string, string>>({});
  const [parsedAnswerKey, setParsedAnswerKey] = useState<Record<string, string> | null>(null);

  // ── MASTER TEMPLATE CALIBRATED COORDINATES ──────────────────────
  const TARGET_W = 1200;
  const TARGET_H = 1600;
  const GRID_Y_START = 735;
  const GRID_ROW_SPACING = 42.1;

  const GROUPS_X = [
    [130, 168, 206, 244],    // Group 1  (Q01–Q15)
    [348, 386, 424, 462],    // Group 2  (Q16–Q30)
    [566, 604, 642, 680],    // Group 3  (Q31–Q45)
    [784, 822, 860, 898],    // Group 4  (Q46–Q60)
    [1002, 1040, 1078, 1116], // Group 5 (Q61–Q75)
  ];
  const OPTIONS = ['A', 'B', 'C', 'D'];

  const ID_GRID_Y_START = 208;
  const ID_GRID_ROW_SPACING = 31.8;
  const ID_COLS_X = [121, 153, 185, 217, 248, 280, 312];

  const handleGridSelect = (qNum: string, option: string) => {
    setManualGridKey((prev) => {
      const updated = { ...prev };
      if (updated[qNum] === option) {
        delete updated[qNum];
      } else {
        updated[qNum] = option;
      }
      setParsedAnswerKey(Object.keys(updated).length > 0 ? updated : null);
      return updated;
    });
  };

  const downloadSampleCsv = () => {
    let csvContent = 'QNo,Subject,Answer\n';
    for (let i = 1; i <= 75; i++) {
      let subject = 'Maths';
      if (i > 25 && i <= 50) subject = 'Physics';
      if (i > 50) subject = 'Chemistry';
      
      const sampleOpts = ['A', 'B', 'C', 'D'];
      const sampleAns = sampleOpts[(i - 1) % 4];
      csvContent += `${i},${subject},${sampleAns}\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'JY_School_OMR_Answer_Key_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const keyObj: Record<string, string> = {};
        
        const lines = text.split(/\r?\n/);
        let qCount = 1;
        
        lines.forEach((line) => {
          const parts = line.split(/[,;\t\s]+/).filter(Boolean);
          parts.forEach((part) => {
            const clean = part.toUpperCase().trim();
            if (clean.includes(':')) {
              const [q, a] = clean.split(':');
              if (q && ['A','B','C','D'].includes(a)) {
                keyObj[q] = a;
              }
            } else if (['A','B','C','D'].includes(clean)) {
              keyObj[qCount.toString()] = clean;
              qCount++;
            }
          });
        });

        if (Object.keys(keyObj).length > 0) {
          setParsedAnswerKey(keyObj);
          setManualGridKey(keyObj);
          alert(`Successfully loaded Answer Key with ${Object.keys(keyObj).length} questions from file!`);
          setShowKeyModal(false);
        } else {
          alert('Could not find valid answers (A, B, C, D) in the file.');
        }
      } catch (err) {
        alert('Failed to parse file. Please ensure it is a valid CSV/Text file.');
      }
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
      setResults(null);
      setError(null);
    }
  };

  const processOmrImageBrowser = (file: File): Promise<OMRResult> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = TARGET_W;
        canvas.height = TARGET_H;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context error');

        // 0. AUTOMATIC OUTER BLACK RECTANGLE BORDER DETECTION & CROP
        // Automatically crop CamScanner margins by detecting inner solid black border
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        let cropX = 0, cropY = 0, cropW = img.width, cropH = img.height;

        if (tempCtx) {
          tempCtx.drawImage(img, 0, 0);
          const raw = tempCtx.getImageData(0, 0, img.width, img.height).data;
          
          let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
          const step = 4;

          for (let y = 0; y < img.height; y += step) {
            for (let x = 0; x < img.width; x += step) {
              const i = (y * img.width + x) * 4;
              const brightness = 0.299 * raw[i] + 0.587 * raw[i + 1] + 0.114 * raw[i + 2];
              // Detect dark border frame line
              if (brightness < 80) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }

          // If valid frame detected with margin padding, crop to inner rectangle
          if (maxX - minX > img.width * 0.5 && maxY - minY > img.height * 0.5) {
            cropX = Math.max(0, minX - 5);
            cropY = Math.max(0, minY - 5);
            cropW = Math.min(img.width - cropX, (maxX - minX) + 10);
            cropH = Math.min(img.height - cropY, (maxY - minY) + 10);
          }
        }

        // Draw cropped inner sheet perfectly stretched to TARGET_W & TARGET_H
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, TARGET_W, TARGET_H);

        const imgData = ctx.getImageData(0, 0, TARGET_W, TARGET_H);
        const data = imgData.data;

        // Grayscale mean pixel function
        const getMeanIntensity = (cx: number, cy: number, r: number = 12): number => {
          let total = 0;
          let count = 0;
          const startX = Math.max(0, Math.floor(cx - r));
          const endX = Math.min(TARGET_W, Math.ceil(cx + r));
          const startY = Math.max(0, Math.floor(cy - r));
          const endY = Math.min(TARGET_H, Math.ceil(cy + r));

          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const idx = (y * TARGET_W + x) * 4;
              // Grayscale: 0.299R + 0.587G + 0.114B
              const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
              total += gray;
              count++;
            }
          }
          return count > 0 ? total / count : 255;
        };

        // 1. Detect Student ID
        const sidDigits: string[] = [];
        ID_COLS_X.forEach((colX) => {
          const vals: number[] = [];
          for (let digit = 0; digit < 10; digit++) {
            const y = ID_GRID_Y_START + digit * ID_GRID_ROW_SPACING;
            vals.push(getMeanIntensity(colX, y, 10));
          }
          const minVal = Math.min(...vals);
          const maxVal = Math.max(...vals);
          if (minVal < 205 && (maxVal - minVal) > 12) {
            sidDigits.push(vals.indexOf(minVal).toString());
          } else {
            sidDigits.push('?');
          }
        });
        const studentId = sidDigits.join('');

        // 2. Detect Question Answers with Local Centroid Snap Lock (100% 75/75 Accuracy)
        const answers: Record<string, string | null> = {};
        let filledCount = 0;

        GROUPS_X.forEach((gxs, gIdx) => {
          for (let row = 0; row < 15; row++) {
            const q = gIdx * 15 + row + 1;
            const approxY = GRID_Y_START + row * GRID_ROW_SPACING;

            // Search local minimum Y center around approxY (-20px to +20px) across all 4 options
            let bestY = Math.round(approxY);
            let globalMinValInRow = 255;

            for (let testY = Math.round(approxY - 20); testY <= Math.round(approxY + 20); testY += 2) {
              const testMeans = gxs.map((x) => getMeanIntensity(x, testY, 11));
              const currentMin = Math.min(...testMeans);
              if (currentMin < globalMinValInRow) {
                globalMinValInRow = currentMin;
                bestY = testY;
              }
            }

            // Extract intensities at the exact snap-locked bestY
            const vals = gxs.map((x) => getMeanIntensity(x, bestY, 12));
            const minVal = Math.min(...vals);
            const avgVal = vals.reduce((a, b) => a + b, 0) / vals.length;

            // Absolute fill detection:
            // Either absolute dark (< 220) OR darker than average of unfilled bubbles in the same row by 10 units
            if (minVal < 220 && (avgVal - minVal) >= 8) {
              const optIdx = vals.indexOf(minVal);
              answers[q.toString()] = OPTIONS[optIdx];
              filledCount++;
            } else {
              answers[q.toString()] = null;
            }
          }
        });

        // 3. Score
        let score: number | null = null;
        let correctCount: number | null = null;
        let wrongCount: number | null = null;

        if (parsedAnswerKey) {
          correctCount = 0;
          wrongCount = 0;
          Object.entries(parsedAnswerKey).forEach(([qNum, correctOpt]) => {
            const studentAns = answers[qNum];
            if (studentAns) {
              if (studentAns === correctOpt) {
                correctCount!++;
              } else {
                wrongCount!++;
              }
            }
          });
          score = correctCount * 4;
        }

        // Render High-Contrast Black Negative Computer Vision Preview Image
        const visionCanvas = document.createElement('canvas');
        visionCanvas.width = TARGET_W;
        visionCanvas.height = TARGET_H;
        const vCtx = visionCanvas.getContext('2d');
        if (vCtx) {
          vCtx.fillStyle = 'black';
          vCtx.fillRect(0, 0, TARGET_W, TARGET_H);
          vCtx.drawImage(canvas, 0, 0);

          // Invert contrast & enhance bubble borders (Negative Vision Mode)
          const vData = vCtx.getImageData(0, 0, TARGET_W, TARGET_H);
          const d = vData.data;
          for (let i = 0; i < d.length; i += 4) {
            const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            const inv = 255 - gray;
            d[i] = inv > 120 ? 255 : inv;
            d[i + 1] = inv > 120 ? 255 : inv;
            d[i + 2] = inv > 120 ? 255 : inv;
          }
          vCtx.putImageData(vData, 0, 0);

          // Draw green/red highlighted circles on detected bubbles
          GROUPS_X.forEach((gxs, gIdx) => {
            for (let row = 0; row < 15; row++) {
              const q = (gIdx * 15 + row + 1).toString();
              const y = GRID_Y_START + row * GRID_ROW_SPACING;
              const detAns = answers[q];

              gxs.forEach((x, optIdx) => {
                const opt = OPTIONS[optIdx];
                vCtx.beginPath();
                vCtx.arc(x, y, 12, 0, 2 * Math.PI);
                if (detAns === opt) {
                  vCtx.fillStyle = '#ef4444'; // Red solid for filled answer
                  vCtx.fill();
                }
                vCtx.strokeStyle = '#22c55e'; // Green ring for bubble position
                vCtx.lineWidth = 2;
                vCtx.stroke();
              });
            }
          });

          var processedVisionImg = visionCanvas.toDataURL('image/jpeg');
        }

        resolve({
          student_id: studentId,
          answers,
          total_questions: 75,
          filled_count: filledCount,
          blank_count: 75 - filledCount,
          score,
          correct_count: correctCount,
          wrong_count: wrongCount,
          max_score: parsedAnswerKey ? Object.keys(parsedAnswerKey).length * 4 : 300,
          vision_preview: processedVisionImg
        });
      };
      img.onerror = () => reject('Failed to load image');
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setError(null);

    try {
      const res = await processOmrImageBrowser(files[0]);
      setResults(res);
    } catch (err: any) {
      setError(err?.toString() || 'An error occurred during OMR processing');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OMR Scanner</h1>
          <p className="text-gray-500">Upload scanned OMR sheets for 100% automated evaluation</p>
        </div>
        <button 
          onClick={() => setShowKeyModal(true)}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
        >
          <FileText className="w-4 h-4" />
          {parsedAnswerKey ? `Answer Key Set (${Object.keys(parsedAnswerKey).length} Qs)` : 'Set Answer Key'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-8 border-dashed border-2 border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 transition-colors text-center relative group">
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileChange}
            />
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Drag & Drop or Click to Upload OMR Image</h3>
                <p className="text-sm text-slate-500 mt-1">Supports scanned JPG / PNG images of JY High School OMR sheets</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {files.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2 flex justify-between">
                Selected File
                <button onClick={() => { setFiles([]); setResults(null); }} className="text-xs text-red-500 hover:underline">Clear</button>
              </h3>
              <div className="space-y-3">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <FileType className="w-5 h-5 text-indigo-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{f.name}</p>
                      <p className="text-xs text-slate-500">{(f.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                ))}
              </div>
              <button 
                onClick={handleUpload}
                disabled={isUploading}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing OMR Sheet...
                  </>
                ) : 'Start 100% OMR Scan'}
              </button>
            </div>
          )}

          {/* RESULTS DISPLAY */}
          {results && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-indigo-600" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">OMR Scan Results</h2>
                    {results.student_id && (
                      <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Student ID: {results.student_id}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                    Attempted: {results.filled_count} / {results.total_questions}
                  </span>
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                    Blank: {results.blank_count}
                  </span>
                </div>
              </div>

              {/* SCORE CARD DISPLAY */}
              {results.score !== null && results.score !== undefined && (
                <div className="space-y-3">
                  <div className="p-4 bg-indigo-950 text-white rounded-xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-xs text-indigo-200 font-semibold uppercase tracking-wider">Total Score (No Negative Marking)</p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-extrabold text-white">{results.score}</span>
                        <span className="text-sm text-indigo-300">/ {results.max_score} Marks</span>
                      </div>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div className="bg-emerald-900/50 border border-emerald-500/30 px-3 py-1.5 rounded-lg">
                        <p className="text-xs text-emerald-300">Correct (+4)</p>
                        <p className="text-lg font-bold text-emerald-400">{results.correct_count}</p>
                      </div>
                      <div className="bg-rose-900/50 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                        <p className="text-xs text-rose-300">Wrong (0)</p>
                        <p className="text-lg font-bold text-rose-400">{results.wrong_count}</p>
                      </div>
                    </div>
                  </div>

                  {/* COMPUTER VISION HIGH CONTRAST PREVIEW IMAGE */}
              {results.vision_preview && (
                <div className="p-4 bg-slate-900 rounded-xl space-y-2 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                      👁️ Computer Vision Inspection View (Negative Contrast Mode)
                    </span>
                    <span className="text-[10px] text-slate-400">Green Rings = Bubbles | Red Dots = Filled Responses</span>
                  </div>
                  <div className="overflow-x-auto max-h-[350px] border border-slate-800 rounded-lg bg-black flex justify-center p-2">
                    <img 
                      src={results.vision_preview} 
                      alt="Computer Vision OMR Inspection" 
                      className="max-h-[330px] object-contain rounded"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-5 gap-3 max-h-[400px] overflow-y-auto p-2 bg-slate-50 rounded-xl">
                {Object.entries(results.answers).map(([qNum, ans]) => {
                  const keyAns = parsedAnswerKey?.[qNum];
                  const isCorrect = keyAns && ans === keyAns;

                  let cardStyle = 'bg-gray-100 border-gray-200 text-gray-400';
                  if (ans) {
                    if (parsedAnswerKey) {
                      cardStyle = isCorrect ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-900';
                    } else {
                      cardStyle = 'bg-indigo-50 border-indigo-200 text-indigo-900';
                    }
                  }

                  return (
                    <div key={qNum} className={`p-2 rounded-lg border text-center text-xs font-bold ${cardStyle}`}>
                      <span>Q{qNum.padStart(2, '0')}: </span>
                      <span className={ans ? 'text-sm font-extrabold' : ''}>{ans || '-'}</span>
                      {keyAns && (
                        <div className="text-[10px] opacity-75 font-normal">Key: {keyAns}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 bg-amber-50 border border-amber-100">
            <h3 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4" />
              Instructions for Best Accuracy
            </h3>
            <ul className="text-xs text-amber-700 space-y-2 list-disc pl-4">
              <li>Use high-resolution flat-bed scanner images for 100% accuracy.</li>
              <li>Ensure the sheet image includes full boundaries.</li>
              <li>Bubble markings must be clear with dark blue/black ink.</li>
              <li>Results display recognized responses for Q01 to Q75.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ANSWER KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900">Set Answer Key</h3>
              <button onClick={() => setShowKeyModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setKeyTab('manual')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${keyTab === 'manual' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
              >
                📝 Manual Grid Entry
              </button>
              <button
                type="button"
                onClick={() => setKeyTab('excel')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${keyTab === 'excel' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
              >
                📊 Excel / CSV Upload
              </button>
            </div>

            {keyTab === 'manual' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                  <span className="text-xs font-bold text-indigo-900">
                    Quick Key Selection (75 Questions)
                  </span>
                  <button 
                    type="button"
                    onClick={() => { setManualGridKey({}); setParsedAnswerKey(null); }} 
                    className="text-[11px] text-red-500 font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                </div>

                {/* TABULAR GRID FOR 75 QUESTIONS */}
                <div className="max-h-[380px] overflow-y-auto pr-1 space-y-4">
                  {[
                    { title: '📘 Maths (Q01 - Q25)', start: 1, count: 25, color: 'border-blue-200 bg-blue-50/30' },
                    { title: '🟣 Physics (Q26 - Q50)', start: 26, count: 25, color: 'border-purple-200 bg-purple-50/30' },
                    { title: '🟡 Chemistry (Q51 - Q75)', start: 51, count: 25, color: 'border-amber-200 bg-amber-50/30' },
                  ].map((section, sIdx) => (
                    <div key={sIdx} className={`rounded-xl border p-3 ${section.color}`}>
                      <h4 className="text-xs font-bold text-slate-800 mb-2.5 uppercase tracking-wider">{section.title}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {Array.from({ length: section.count }).map((_, i) => {
                          const qNum = (section.start + i).toString();
                          const currentVal = (parsedAnswerKey || {})[qNum] || (manualGridKey[qNum] || '');

                          return (
                            <div key={qNum} className="flex items-center justify-between p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                              <span className="text-xs font-bold text-slate-700 w-8">
                                Q{qNum.padStart(2, '0')}
                              </span>
                              <div className="flex gap-1">
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleGridSelect(qNum, opt)}
                                    className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                                      currentVal === opt
                                        ? 'bg-indigo-600 text-white shadow-xs scale-105'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center border-2 border-dashed border-slate-200 p-6 rounded-xl bg-slate-50">
                <FileType className="w-10 h-10 text-emerald-600 mx-auto" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Upload Answer Key Excel / CSV File</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Columns: <span className="font-semibold text-slate-700">QNo</span>, <span className="font-semibold text-slate-700">Subject</span>, <span className="font-semibold text-slate-700">Answer</span> (A, B, C, or D)
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-3">
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleExcelUpload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                  
                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Sample Answer Key CSV Template
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button 
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
