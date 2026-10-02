import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  FileText, Upload, Download, Trash2, CheckCircle2, 
  ExternalLink, Eye, Loader2, AlertCircle, ShieldCheck, 
  BookOpen, RefreshCw, Lock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SecurePdfViewer from '../../components/SecurePdfViewer';

export default function AdminMemorandum() {
  const [memorandumData, setMemorandumData] = useState<any>({
    title: 'मानव समानता संगठन स्मृति-पत्र एवं नियमावली (Memorandum of Association & Rules)',
    fileName: '',
    fileUrl: '',
    fileSize: 0,
    uploadedAt: '',
    description: 'मानव समानता संगठन (पंजीकृत) का अधिकृत स्मृति-पत्र (MoA) एवं नियमावली।',
    regNumber: 'MSS/2024/7821',
    active: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'memorandum'));
        if (snap.exists()) {
          setMemorandumData((prev: any) => ({ ...prev, ...snap.data() }));
        }

        // Check server status
        const res = await fetch('/api/memorandum/status');
        const sData = await res.json();
        if (sData.exists) {
          setMemorandumData((prev: any) => ({
            ...prev,
            fileUrl: sData.fileUrl,
            fileSize: sData.fileSize || prev.fileSize,
            uploadedAt: sData.updatedAt || prev.uploadedAt,
            fileName: sData.fileName || prev.fileName
          }));
        }
      } catch (err) {
        console.error("Error loading memorandum settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert("कृपया केवल PDF फाइल चुनें (Please upload a valid PDF file).");
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      alert("फाइल का आकार 30 MB से कम होना चाहिए (File size must be under 30MB).");
      return;
    }

    setSelectedFile(file);
    setUploadSuccess(false);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("कृपया अपनी स्मृति-पत्र PDF फाइल चुनें।");
      return;
    }

    setUploading(true);
    setUploadSuccess(false);

    try {
      // 1. Read file as base64
      const base64Data: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      // 2. Upload to server storage endpoint
      const res = await fetch('/api/memorandum/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64Data,
          fileName: selectedFile.name,
          title: memorandumData.title,
          description: memorandumData.description
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Server failed to save PDF');
      }

      // 3. Save to Firestore settings/memorandum
      const updatedRecord = {
        title: memorandumData.title,
        fileName: selectedFile.name,
        fileUrl: data.fileUrl || '/api/memorandum/file',
        downloadUrl: data.downloadUrl || '/api/memorandum/download',
        staticUrl: data.staticUrl || '/uploads/memorandum.pdf',
        fileSize: selectedFile.size,
        uploadedAt: new Date().toISOString(),
        description: memorandumData.description,
        regNumber: memorandumData.regNumber,
        active: true
      };

      await setDoc(doc(db, 'settings', 'memorandum'), updatedRecord, { merge: true });

      setMemorandumData(updatedRecord);
      setSelectedFile(null);
      setUploadSuccess(true);
      alert("बधाई हो! संगठन का स्मृति-पत्र (Memorandum PDF) सफलतापूर्वक अपलोड हो गया है। अब सभी सदस्य और जनता इसे वेबसाइट पर देख और डाउनलोड कर सकते हैं।");
    } catch (err: any) {
      console.error("Upload memorandum error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("क्या आप वाकई इस स्मृति-पत्र PDF को हटाना चाहते हैं?")) return;
    try {
      await fetch('/api/memorandum', { method: 'DELETE' });
      await updateDoc(doc(db, 'settings', 'memorandum'), {
        fileUrl: null,
        active: false,
        updatedAt: new Date().toISOString()
      });
      setMemorandumData((prev: any) => ({ ...prev, fileUrl: null, active: false }));
      alert("स्मृति-पत्र हटा दिया गया।");
    } catch (err: any) {
      alert("हटाने में समस्या आई: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Memorandum Management (स्मृति-पत्र एवं विधान)</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Upload and manage the official Memorandum of Association (MoA) & Rules for all members and public.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/memorandum"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" /> सार्वजनिक पेज देखें (Public View)
          </Link>
        </div>
      </div>

      {/* Main Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">Upload Official Memorandum PDF</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-300">
                <Lock className="w-3 h-3 text-amber-600" /> केवल देखने के लिए (View-Only Mode)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Select your signed and stamped Memorandum of Association (MoA) PDF. It will be displayed securely in View-Only mode (डाउनलोड पूरी तरह से बंद रहेगा).
            </p>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <strong>सफलतापूर्वक अपलोड संपन्न:</strong> स्मृति-पत्र की PDF फाइल सहेज ली गई है। 
              <Link to="/memorandum" target="_blank" className="text-emerald-700 font-bold underline ml-1">
                यहाँ क्लिक करके सार्वजनिक रूप में देखें
              </Link>
            </div>
          </div>
        )}

        <form onSubmit={handleUploadSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                दस्तावेज़ का नाम (Document Title) *
              </label>
              <input
                type="text"
                required
                value={memorandumData.title}
                onChange={(e) => setMemorandumData({ ...memorandumData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                पंजीयन क्रमांक (Registration Ref)
              </label>
              <input
                type="text"
                value={memorandumData.regNumber}
                onChange={(e) => setMemorandumData({ ...memorandumData, regNumber: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              विवरण / सारांश (Description)
            </label>
            <textarea
              rows={2}
              value={memorandumData.description}
              onChange={(e) => setMemorandumData({ ...memorandumData, description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* PDF File Input Drag & Drop Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              अपनी PDF फाइल चुनें (Select PDF File) *
            </label>
            <div className="border-2 border-dashed border-emerald-500/40 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-6 text-center transition-colors relative cursor-pointer">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
              />
              <FileText className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
              {selectedFile ? (
                <div>
                  <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-emerald-700 font-semibold mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to Upload
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 inline-block">
                    Click or drag another file to replace
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    यहाँ क्लिक करें या PDF फाइल ड्रैग करके लाएं
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    केवल PDF फाइल समर्थित है (अधिकतम 30 MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? 'Uploading PDF Document...' : 'Upload & Publish Memorandum PDF'}
            </button>
          </div>
        </form>
      </div>

      {/* Currently Active Memorandum Preview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">Current Active Memorandum (वर्तमान सक्रिय स्मृति-पत्र)</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Live on Website
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              यह दस्तावेज़ वेबसाइट पर <code>/memorandum</code> पर केवल पढ़ने (View-Only Mode) हेतु उपलब्ध है। जनता के लिए डाउनलोड बटन पूरी तरह बंद है।
            </p>
          </div>

          {memorandumData.fileUrl && (
            <div className="flex items-center gap-2">
              <a
                href="/api/memorandum/file"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open in New Window
              </a>
              <button
                type="button"
                onClick={handleRemove}
                className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          )}
        </div>

        {memorandumData.fileUrl ? (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{memorandumData.fileName || 'MSS_Memorandum_of_Association.pdf'}</div>
                  <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                    {memorandumData.fileSize ? <span>{(memorandumData.fileSize / 1024 / 1024).toFixed(2)} MB</span> : null}
                    <span>•</span>
                    <span>Uploaded: {memorandumData.uploadedAt ? new Date(memorandumData.uploadedAt).toLocaleString('hi-IN') : 'Active'}</span>
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 font-bold px-2.5 py-1 rounded-full text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active & Live
              </span>
            </div>

            {/* Embedded Live Viewer inside Admin */}
            <SecurePdfViewer
              url={memorandumData.fileUrl || '/api/memorandum/file'}
              title={memorandumData.title}
            />
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No Memorandum PDF uploaded yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Upload your signed PDF above to make it live for all members and visitors.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
