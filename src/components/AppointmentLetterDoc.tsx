import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { Heart, Download, Printer, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { AppointmentLetterData, LetterheadSettings } from '../types/appointment';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AppointmentLetterDocProps {
  appointment: AppointmentLetterData;
  showControls?: boolean;
  onDownloaded?: () => void;
}

export default function AppointmentLetterDoc({
  appointment,
  showControls = true,
  onDownloaded
}: AppointmentLetterDocProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [regNumber, setRegNumber] = useState<string | null>(null);
  const [letterheadUrl, setLetterheadUrl] = useState<string | null>(appointment.letterheadUrl || null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const generalSnap = await getDoc(doc(db, 'settings', 'general'));
        if (generalSnap.exists()) {
          const gData = generalSnap.data();
          if (gData.logoUrl) setLogoUrl(gData.logoUrl);
          if (gData.registrationNumber) setRegNumber(gData.registrationNumber);
        }

        // Check active letterhead
        if (!appointment.letterheadUrl) {
          const letterheadSnap = await getDoc(doc(db, 'settings', 'letterhead'));
          if (letterheadSnap.exists() && letterheadSnap.data().active && letterheadSnap.data().letterheadUrl) {
            setLetterheadUrl(letterheadSnap.data().letterheadUrl);
          }
        }
      } catch (err) {
        console.error("Error loading letterhead settings", err);
      }
    }
    loadSettings();
  }, [appointment.letterheadUrl]);

  const formatDate = (dateVal?: string) => {
    if (!dateVal) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch {
      return dateVal;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printContainerRef.current) return;
    setDownloading(true);
    try {
      // Use html-to-image with high pixel density
      const dataUrl = await htmlToImage.toPng(printContainerRef.current, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      // Standard A4 dimensions: 210mm x 297mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const safeName = appointment.officerName.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Appointment_Letter_${safeName}_${appointment.officerId}.pdf`);
      
      if (onDownloaded) onDownloaded();
    } catch (err) {
      console.error("Error generating Appointment Letter PDF:", err);
      alert("Failed to generate PDF. Please try using the Print button instead.");
    } finally {
      setDownloading(false);
    }
  };

  const verificationUrl = `${window.location.origin}/verify/${appointment.userId || appointment.officerId}`;
  const displayRegion = [appointment.district, appointment.state].filter(Boolean).join(', ') || appointment.level || 'All India';

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Control Buttons */}
      {showControls && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm hide-on-print">
          <div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Official Appointment Letter
            </span>
            <p className="text-sm text-slate-500 mt-1">Ref: <span className="font-mono font-medium text-slate-800">{appointment.refNumber}</span></p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download A4 PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>
      )}

      {/* A4 Sheet Container (794px × 1123px exact 1:1.414 A4 standard ratio) */}
      <div className="overflow-x-auto flex justify-center pb-8">
        <div
          ref={printContainerRef}
          id="appointment-letter-a4"
          className="w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 relative flex flex-col justify-between overflow-hidden font-sans select-text box-border"
          style={{ width: '794px', minHeight: '1123px' }}
        >
          {/* Custom Letterhead Background if uploaded */}
          {letterheadUrl && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <img
                src={letterheadUrl}
                alt="Official Letterhead Background"
                className="w-full h-full object-fill opacity-95"
                crossOrigin="anonymous"
              />
            </div>
          )}

          {/* Built-in Official Letterhead Header (shown if no custom letterhead image is active) */}
          {!letterheadUrl && (
            <div className="relative z-10">
              {/* Top Tricolor Accent Bar */}
              <div className="h-2 w-full bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>

              {/* Main Header Banner */}
              <div className="px-8 pt-6 pb-4 bg-gradient-to-b from-[#f4fbf7] to-white border-b-2 border-[#dc6b29]/60">
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Official Logo */}
                  <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-white rounded-full p-1 shadow-sm border border-[#1a5d48]/20">
                    {logoUrl ? (
                      <img src={logoUrl} alt="MSS Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-[#1a5d48] flex items-center justify-center text-white">
                        <Heart className="w-10 h-10 text-[#e2c262]" />
                      </div>
                    )}
                  </div>

                  {/* Center: Organization Identity */}
                  <div className="text-center flex-1">
                    <h1 className="text-2xl font-black text-[#1a5d48] tracking-wide leading-tight uppercase font-serif">
                      MANAV SAMANTA SANGTHAN
                    </h1>
                    <h2 className="text-xl font-bold text-slate-900 leading-tight mt-0.5">
                      मानव समानता संगठन
                    </h2>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <span className="text-[11px] font-bold text-[#b15818] tracking-wider uppercase bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {regNumber || 'REG. SMQL/2026/00-026'}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[12px] font-bold text-[#1a5d48] italic">
                        "पहले इंसान, फिर धर्म"
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-tight">
                      Registered Under Indian Trusts/Societies Act • Head Office: India • Email: info@manavsamanta.org
                    </p>
                  </div>

                  {/* Right: Emblem / Stamp Watermark */}
                  <div className="w-20 h-20 shrink-0 flex flex-col items-center justify-center bg-[#1a5d48]/5 rounded-full p-1 border border-[#1a5d48]/10 text-center">
                    <span className="text-[9px] font-bold text-[#1a5d48] uppercase leading-tight">CENTRAL COUNCIL</span>
                    <span className="text-[14px] font-black text-[#dc6b29]">★ MSS ★</span>
                    <span className="text-[8px] font-semibold text-slate-500">APPOINTMENT</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Letterhead spacer if custom background is used */}
          {letterheadUrl && <div className="h-36 w-full pointer-events-none"></div>}

          {/* Document Content Area */}
          <div className={`relative z-10 px-12 flex-1 flex flex-col justify-between ${letterheadUrl ? 'pt-4' : 'pt-5'}`}>
            <div>
              {/* Dispatch Reference & Date Bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5 text-[13px]">
                <div>
                  <span className="font-semibold text-slate-500">पत्रांक / Dispatch Ref: </span>
                  <span className="font-mono font-bold text-slate-900 tracking-wide bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {appointment.refNumber}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">दिनांक / Date: </span>
                  <span className="font-bold text-slate-900">
                    {formatDate(appointment.appointmentDate || appointment.issueDate)}
                  </span>
                </div>
              </div>

              {/* Recipient Details Block */}
              <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 mb-5">
                <div className="text-[12px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  सेवा में / To,
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div>
                    <span className="text-xs text-slate-500">नाम / Name:</span>
                    <h3 className="text-base font-bold text-slate-900">{appointment.officerName}</h3>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">अधिकारी पहचान संख्या / Officer ID:</span>
                    <div className="text-base font-mono font-bold text-emerald-800 tracking-tight">{appointment.officerId}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">मोबाइल / Registered Mobile:</span>
                    <div className="text-sm font-semibold text-slate-800">{appointment.officerPhone || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">अधिकार क्षेत्र / Assigned Area:</span>
                    <div className="text-sm font-semibold text-slate-800">{displayRegion}</div>
                  </div>
                </div>
              </div>

              {/* Formal Subject / Title */}
              <div className="text-center my-4">
                <div className="inline-block bg-[#1a5d48] text-[#e2c262] text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow-sm mb-1.5">
                  OFFICIAL APPOINTMENT & NOMINATION LETTER
                </div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  मनोनयन एवं आधिकारिक नियुक्ति आदेश
                </h2>
              </div>

              {/* Main Body Text */}
              <div className="space-y-3 text-[13.5px] leading-relaxed text-slate-800 text-justify">
                <p>
                  <strong>प्रिय {appointment.officerName} जी,</strong>
                </p>
                <p>
                  मानव समानता संगठन (MSS) की केंद्रीय कार्यकारिणी एवं शासी परिषद द्वारा आपके सामाजिक समर्पण, निष्ठा, कर्मठता तथा समाज के प्रति आपकी उच्च मानवीय संवेदनाओं को दृष्टिगत रखते हुए, संगठन के संविधान प्रदत्त अधिकारों के अंतर्गत आपको संगठन में निम्नलिखित पद पर <strong>सहर्ष मनोनीत एवं नियुक्त किया जाता है:</strong>
                </p>

                {/* Highlighted Appointment Box */}
                <div className="bg-gradient-to-r from-emerald-50 via-[#f7faf8] to-amber-50 p-4 rounded-xl border-2 border-emerald-200 my-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">पदनाम / DESIGNATION</span>
                      <span className="text-lg font-black text-[#1a5d48] leading-tight block mt-0.5">
                        {appointment.designation}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">कार्यक्षेत्र / JURISDICTION</span>
                      <span className="text-base font-bold text-slate-900 leading-tight block mt-0.5">
                        {displayRegion}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">नियुक्ति प्रभावी तिथि / EFFECTIVE DATE</span>
                      <span className="text-sm font-bold text-slate-800 block mt-0.5">
                        {formatDate(appointment.appointmentDate || appointment.issueDate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">वैधता / VALIDITY</span>
                      <span className="text-sm font-bold text-slate-800 block mt-0.5">
                        {appointment.validUntil ? formatDate(appointment.validUntil) : '1 Year / Annual Renewal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms & Conditions / Responsibilities */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                    प्रमुख दायित्व एवं कर्तव्य (Duties & Responsibilities):
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-[12.5px] text-slate-700">
                    <li>संगठन के मूल ध्येय <strong>"पहले इंसान, फिर धर्म"</strong> का निष्ठापूर्वक प्रचार-प्रसार करना एवं समाज में सर्वधर्म समभाव तथा समानता स्थापित करना।</li>
                    <li>अपने अधिकार क्षेत्र में जरूरतमंद, शोषित व वंचित वर्ग के कल्याणार्थ संचालित अभियानों का नेतृत्व एवं समन्वय करना।</li>
                    <li>संगठन की गरिमा, आचार संहिता, पारदर्शिता एवं वित्तीय शुचिता का अक्षुण्ण पालन करना।</li>
                    <li>प्रत्येक माह अपने क्षेत्र की संगठनात्मक गतिविधियों व सदस्यों की प्रगति आख्या केंद्रीय कार्यालय को प्रस्तुत करना।</li>
                  </ul>
                </div>

                <p className="text-[13px] pt-1">
                  हम विश्वास व्यक्त करते हैं कि आप अपने इस उत्तरदायित्व का निर्वहन सत्यनिष्ठा, निष्पक्षता एवं पूर्ण सेवा-भाव के साथ करेंगे। संगठन आपके सफल कार्यकाल की मंगलकामना करता है।
                </p>
              </div>
            </div>

            {/* Bottom Signatory & Verification Block */}
            <div className="pt-6 pb-6 border-t-2 border-slate-200 mt-6 flex items-end justify-between">
              {/* Left: Digital Verification QR Code */}
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 border-2 border-slate-300 rounded-lg shadow-sm">
                  <QRCode value={verificationUrl} size={70} level="M" />
                </div>
                <div className="text-[11px] text-slate-500 space-y-0.5">
                  <span className="font-bold text-slate-700 block">आधिकारिक डिजिटल सत्यापन</span>
                  <span className="block">Scan to verify officer status</span>
                  <span className="text-[10px] text-emerald-700 font-mono block">ID: {appointment.officerId}</span>
                </div>
              </div>

              {/* Center: Official Seal */}
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#1a5d48]/40 flex flex-col items-center justify-center p-1 text-center bg-[#1a5d48]/5">
                <CheckCircle2 className="w-6 h-6 text-[#1a5d48] mb-0.5" />
                <span className="text-[8px] font-bold text-[#1a5d48] uppercase leading-tight">OFFICIAL SEAL</span>
                <span className="text-[8px] text-slate-600 leading-tight">MANAV SAMANTA</span>
                <span className="text-[7px] text-[#dc6b29] font-bold">CENTRAL OFFICE</span>
              </div>

              {/* Right: Existing Founder Signature & Corrected Chief Secretary Designation */}
              <div className="text-right flex flex-col items-end">
                <div className="text-[11px] font-semibold text-slate-500 mb-1">
                  आज्ञा से / By Order:
                </div>
                {/* Retaining the existing Founder's signature style */}
                <div className="h-10 flex items-center pr-2">
                  <span
                    className="text-4xl text-[#1a5d48] tracking-wide font-medium select-none"
                    style={{ fontFamily: "'Brush Script MT', 'Dancing Script', 'Great Vibes', cursive" }}
                  >
                    'Gulfam'
                  </span>
                </div>
                <div className="border-b-2 border-slate-900 w-44 my-1"></div>
                <p className="text-[14px] font-bold text-slate-900 leading-tight">
                  Gulfam Siddique
                </p>
                {/* Explicitly updated designation: CHIEF SECRETARY */}
                <p className="text-[12px] font-bold text-[#1a5d48] leading-tight mt-0.5">
                  Chief Secretary
                </p>
                <p className="text-[11px] font-medium text-slate-600 leading-tight">
                  मानव समानता संगठन (Manav Samanta Sangthan)
                </p>
              </div>
            </div>
          </div>

          {/* Letterhead bottom spacer if custom background is used */}
          {letterheadUrl && <div className="h-24 w-full pointer-events-none"></div>}

          {/* Built-in Official Footer Banner (shown if no custom letterhead image is active) */}
          {!letterheadUrl && (
            <div className="relative z-10 bg-[#1a5d48] text-white text-center py-2.5 px-6 border-t-2 border-[#dc6b29]">
              <div className="flex items-center justify-between text-[11px] text-slate-200">
                <span>केन्द्रीय कार्यालय: मानव समानता संगठन • www.manavsamanta.org</span>
                <span className="text-[#e2c262] font-semibold">"पहले इंसान, फिर धर्म"</span>
                <span>संपर्क: info@manavsamanta.org</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Print Specific CSS */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .hide-on-print {
            display: none !important;
          }
          #appointment-letter-a4 {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />
    </div>
  );
}
