import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  FileText, ShieldCheck, Eye, 
  ExternalLink, CheckCircle2, AlertCircle, BookOpen, 
  Share2, Heart, Scale, Users, Award, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import SecurePdfViewer from '../components/SecurePdfViewer';

export default function PublicMemorandum() {
  const { isAdmin } = useAuth();
  const [memorandumData, setMemorandumData] = useState<any>(null);
  const [serverPdfAvailable, setServerPdfAvailable] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Listen to Firestore settings/memorandum
    const unsub = onSnapshot(doc(db, 'settings', 'memorandum'), (docSnap) => {
      if (docSnap.exists()) {
        setMemorandumData(docSnap.data());
      }
      setLoading(false);
    }, (err) => {
      console.warn("Firestore memorandum fetch notice:", err);
      setLoading(false);
    });

    // 2. Check if PDF file exists on server
    fetch('/api/memorandum/status')
      .then(res => res.json())
      .then(data => {
        if (data.exists) {
          setServerPdfAvailable(true);
        }
      })
      .catch(e => console.warn("Could not check memorandum server status:", e));

    return () => unsub();
  }, []);

  const pdfUrl = serverPdfAvailable ? (memorandumData?.fileUrl || '/api/memorandum/file') : null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 select-none">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#144837] via-[#1a5d48] to-[#144837] text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>पंजीकृत सोसायटी संविधान • Societies Registration Act 1860</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight font-serif">
              स्मृति-पत्र एवं नियमावली
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-emerald-200">
              Memorandum of Association & Rules (MoA)
            </p>
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-2xl">
              मानव समानता संगठन (रजि.) के उद्देश्य, नियम, अधिकार, सदस्यता और कार्यप्रणाली से संबंधित आधिकारिक विधिक संविधान।
            </p>
          </div>

          {/* Action Area & View-Only Notice */}
          <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
            {/* View Only Protected Badge */}
            <div className="flex items-center gap-2 px-4 py-3 bg-black/40 border border-amber-400/40 rounded-2xl text-amber-200 text-xs font-bold shadow-md">
              <Lock className="w-4 h-4 text-amber-300 shrink-0" />
              <div>
                <p className="leading-tight">सुरक्षित दस्तावेज (View-Only Mode)</p>
                <p className="text-[11px] text-slate-300 font-normal mt-0.5">केवल ऑनलाइन पढ़ने के लिए • डाउनलोड प्रतिबंधित है</p>
              </div>
            </div>

            <button
              onClick={handleShare}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white/95 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/20"
            >
              <Share2 className="w-3.5 h-3.5" /> {copied ? 'लिंक कॉपी हो गया!' : 'शेयर करें'}
            </button>

            {isAdmin && (
              <Link
                to="/dashboard/memorandum"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5"
              >
                ⚙️ एडमिन: PDF बदलें / अपलोड करें
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Key Highlights / Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">समानता एवं न्याय</h4>
            <p className="text-xs text-slate-500 mt-1">
              जाति, धर्म, लिंग या वर्ग के भेदभाव के बिना प्रत्येक मनुष्य के सम्मान और अधिकारों की रक्षा।
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Heart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">मानवीय सेवा</h4>
            <p className="text-xs text-slate-500 mt-1">
              "पहले इंसान, फिर धर्म" के मूल मंत्र के साथ निःस्वार्थ समाज सेवा और लोक कल्याण।
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">लोकतांत्रिक संरचना</h4>
            <p className="text-xs text-slate-500 mt-1">
              प्रबंध समिति, साधारण सभा और पारदर्शी निर्वाचन द्वारा संचालित व्यवस्था।
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">पंजीकृत व मान्यता प्राप्त</h4>
            <p className="text-xs text-slate-500 mt-1">
              सोसायटी पंजीकरण अधिनियम के अंतर्गत विधिवत पंजीकृत संस्था का स्मृति-पत्र।
            </p>
          </div>
        </div>
      </div>

      {/* Main Document Viewer Section */}
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Document Header Controls */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {memorandumData?.title || 'मानव समानता संगठन स्मृति-पत्र एवं नियमावली'}
              </h3>
              <p className="text-xs text-slate-500">
                {memorandumData?.fileName || 'Official_Memorandum_of_Association.pdf'}
                {memorandumData?.uploadedAt && (
                  <span> • अद्यतन: {new Date(memorandumData.uploadedAt).toLocaleDateString('hi-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-600" /> केवल देखने के लिए (View Only)
            </span>
          </div>
        </div>

        {/* Embedded Protected PDF Viewer */}
        <div className="p-4 sm:p-6 bg-slate-100 flex justify-center">
          {pdfUrl ? (
            <div className="w-full flex flex-col items-center">
              <SecurePdfViewer 
                url={pdfUrl} 
                title={memorandumData?.title || 'मानव समानता संगठन स्मृति-पत्र एवं नियमावली'} 
              />
            </div>
          ) : (
            <div className="w-full max-w-2xl py-16 px-6 text-center bg-white rounded-2xl border border-slate-200 shadow-sm my-6">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800">
                आधिकारिक स्मृति-पत्र PDF अपलोड किया जाना है
              </h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
                संगठन का मूल हस्ताक्षरित व मुहरयुक्त स्मृति-पत्र (MoA) एवं नियमावली PDF प्रारूप में एडमिन डैशबोर्ड से शीघ्र अपलोड किया जा रहा है।
              </p>

              {isAdmin ? (
                <div className="mt-6">
                  <Link
                    to="/dashboard/memorandum"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                  >
                    एडमिन डैशबोर्ड में जाकर PDF अपलोड करें
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-4">
                  किसी भी प्रश्न या अधिक जानकारी के लिए संगठन के मुख्य कार्यालय से संपर्क करें।
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary of Articles / विधान की प्रमुख धाराएँ */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-900">
            स्मृति-पत्र एवं नियमावली के मुख्य बिंदु (Constitutional Overview)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            मानव समानता संगठन की नियमावली के अंतर्गत प्रमुख नियम व दिशानिर्देश:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. संगठन का नाम एवं कार्यालय
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed pl-6">
              संस्था का नाम <strong>"मानव समानता संगठन" (Manav Samanta Sangthan)</strong> है। इसका प्रधान कार्यालय मेरठ / दिल्ली एनसीआर में स्थित है तथा कार्यक्षेत्र सम्पूर्ण भारतवर्ष है।
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. सदस्यता के नियम एवं पात्रता
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed pl-6">
              भारत का कोई भी नागरिक जिसकी आयु 18 वर्ष से अधिक हो और जो संस्था के नियमों, उद्देश्यों व समानता के विचारों में निष्ठा रखता हो, सदस्यता हेतु आवेदन कर सकता है।
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3. प्रबंध समिति एवं पदाधिकारी
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed pl-6">
              संगठन का संचालन एक लोकतांत्रिक प्रबंधकारिणी समिति (Governing Body) द्वारा किया जाता है जिसमें अध्यक्ष, मुख्य सचिव, उपाध्यक्ष, कोषाध्यक्ष एवं अन्य सदस्य शामिल होते हैं।
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4. निधि एवं आय-व्यय की व्यवस्था
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed pl-6">
              संगठन की समस्त आय, दान एवं शुल्क पूर्णतः गैर-लाभकारी (Non-Profit) स्वरूप में केवल संस्था के घोषित समाजोपयोगी उद्देश्यों की पूर्ति के लिए ही व्यय किए जाते हैं।
            </p>
          </div>
        </div>
      </div>

      {/* Summary of Articles / विधान की प्रमुख धाराएँ */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-900">
            स्मृति-पत्र एवं नियमावली के मुख्य बिंदु (Constitutional Overview)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            मानव समानता संगठन की नियमावली के अंतर्गत प्रमुख नियम व दिशानिर्देश:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. संगठन का नाम एवं कार्यालय
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed pl-6">
              संस्था का नाम <strong>"मानव समानता संगठन" (Manav Samanta Sangthan)</strong> है। इसका प्रधान कार्यालय मेरठ / दिल्ली एनसीआर में स्थित है तथा कार्यक्षेत्र सम्पूर्ण भारतवर्ष है।
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 2. सदस्यता के नियम एवं पात्रता
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed pl-6">
              भारत का कोई भी नागरिक जिसकी आयु 18 वर्ष से अधिक हो और जो संस्था के नियमों, उद्देश्यों व समानता के विचारों में निष्ठा रखता हो, सदस्यता हेतु आवेदन कर सकता है।
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 3. प्रबंध समिति एवं पदाधिकारी
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed pl-6">
              संगठन का संचालन एक लोकतांत्रिक प्रबंधकारिणी समिति (Governing Body) द्वारा किया जाता है जिसमें अध्यक्ष, मुख्य सचिव, उपाध्यक्ष, कोषाध्यक्ष एवं अन्य सदस्य शामिल होते हैं।
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 4. निधि एवं आय-व्यय की व्यवस्था
            </h4>
            <p className="text-slate-600 text-xs leading-relaxed pl-6">
              संगठन की समस्त आय, दान एवं शुल्क पूर्णतः गैर-लाभकारी (Non-Profit) स्वरूप में केवल संस्था के घोषित समाजोपयोगी उद्देश्यों की पूर्ति के लिए ही व्यय किए जाते हैं।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
