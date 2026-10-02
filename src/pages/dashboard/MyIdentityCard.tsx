import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import QRCode from 'react-qr-code';
import { Heart, Printer, Download, Loader2 } from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function MyIdentityCard() {
  const { userData } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [showIframeWarning, setShowIframeWarning] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [registrationNumber, setRegistrationNumber] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
          if (docSnap.data().logoUrl) setLogoUrl(docSnap.data().logoUrl);
          if (docSnap.data().registrationNumber) setRegistrationNumber(docSnap.data().registrationNumber);
        }
      } catch (err) {
        console.error("Error fetching settings logo", err);
      }
    }
    fetchSettings();
  }, []);

  if (!userData) return null;

  if (userData.status !== 'active') {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-md mx-auto mt-12">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Identity Card Unavailable</h2>
        <p className="text-slate-500">Your account status is currently: <span className="font-semibold uppercase">{userData.status}</span>.</p>
        <p className="text-sm mt-2 text-slate-400">Identity cards are only available for active members and officers.</p>
      </div>
    );
  }

  const isOfficer = userData.role === 'officer' || userData.role === 'admin';
  const idToDisplay = isOfficer ? userData.officerId : userData.memberId;
  const verificationUrl = `${window.location.origin}/verify/${userData.uid}`;

  const formatCardDate = (dateVal: any, fallback = 'N/A') => {
    if (!dateVal) return fallback;
    try {
      const d = typeof dateVal === 'object' && dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    } catch {
      return fallback;
    }
  };

  const cardIssueDate = userData.issueDate || userData.cardIssueDate || userData.approvedAt || (isOfficer && userData.officerAppointmentDate ? userData.officerAppointmentDate : null) || userData.joiningDate;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, {
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [54, 85.6]
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`MSS_Identity_Card_${userData.name.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Error generating PDF", err);
      alert('Error generating PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      <div className="flex justify-between items-center hide-on-print">
        <h1 className="text-2xl font-bold text-slate-900">My Identity Card</h1>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Card
          </button>
        </div>
      </div>
      
      

      <div className="flex justify-center mt-8">
        <div ref={cardRef} className="print-card-container w-[400px] bg-[#f8faf9] rounded-xl overflow-hidden shadow-2xl border border-slate-200 relative font-sans">
          
          {/* Card Header */}
          <div className="relative bg-[#1a5d48] p-5 pb-4 text-center border-b-[6px] border-[#dc6b29] overflow-hidden">
            {/* Header Watermark */}
            <div className="absolute inset-0 opacity-[0.1] flex items-center justify-center pointer-events-none">
              <svg viewBox="0 0 100 100" className="w-64 h-64 text-white fill-current">
                <path d="M50 0 A50 50 0 1 1 49.9 0 Z" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5"/>
                <path d="M50 15 A35 35 0 1 1 49.9 15 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
                <path d="M20 50 L80 50 M50 20 L50 80 M28 28 L72 72 M28 72 L72 28" stroke="currentColor" strokeWidth="0.5"/>
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full p-1.5 backdrop-blur-sm">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" crossOrigin="anonymous" />
                  ) : (
                    <Heart className="w-8 h-8 text-[#e2c262]" />
                  )}
                </div>
              </div>
              <h2 className="text-[17px] font-bold text-[#e2c262] leading-tight tracking-wide uppercase">MANAV SAMANTA SANGTHAN</h2>
              <h3 className="text-base font-semibold text-white mt-1">मानव समानता संगठन</h3>
              
              <div className="mt-3 mb-2 flex justify-center">
                <div className="bg-[#124332] border border-[#e2c262]/50 text-[#e2c262] text-[10px] font-bold px-3 py-1 rounded-full shadow-inner inline-block">
                  Reg. No: {registrationNumber || 'REG. SMQL/2026/00-026'}
                </div>
              </div>
              
              <p className="text-[13px] font-bold text-[#e2c262] tracking-wide mt-1 italic">
                "पहले इंसान, फिर धर्म"
              </p>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6 relative z-10 overflow-hidden min-h-[380px] flex flex-col justify-between">
            
            {/* Watermark Logo */}
            {logoUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-0 opacity-[0.04] pointer-events-none mt-10">
                <img src={logoUrl} alt="Watermark" className="w-[120%] h-[120%] object-contain grayscale" crossOrigin="anonymous" />
              </div>
            )}
            {!logoUrl && (
              <div className="absolute inset-0 flex items-center justify-center z-0 opacity-[0.03] pointer-events-none mt-10">
                 <svg viewBox="0 0 100 100" className="w-72 h-72 text-black fill-current">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="10 5" />
                    <circle cx="50" cy="50" r="25" fill="currentColor" />
                 </svg>
              </div>
            )}

            <div className="relative z-10">
              <div className="flex gap-5 items-start mb-6">
                {/* Photo */}
                <div className="w-[110px] h-[135px] bg-slate-200 rounded-lg border-2 border-slate-300 overflow-hidden shrink-0 shadow-sm relative">
                  {userData.photoUrl ? (
                    <img src={userData.photoUrl} alt={userData.name} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-2 bg-slate-100">
                      Photo Not Uploaded
                    </div>
                  )}
                </div>
                
                {/* Info Text */}
                <div className="flex-1 pt-1">
                  <div className="text-[11px] font-bold tracking-wider text-slate-500 uppercase mb-0.5">
                    {isOfficer ? 'OFFICER ID' : 'MEMBER ID'}
                  </div>
                  <div className="text-[17px] font-bold text-slate-900 mb-3 tracking-tight font-sans">
                    {idToDisplay || 'PENDING'}
                  </div>
                  
                  <h4 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">{userData.name}</h4>
                  
                  <p className="text-[14px] font-bold text-[#b15818] leading-tight">
                    {userData.designation || (isOfficer ? 'Officer' : 'Active Member')}
                  </p>
                  
                  {userData.level && (
                    <p className="text-[11px] text-slate-600 font-medium mt-1">
                      ({userData.level.charAt(0).toUpperCase() + userData.level.slice(1)} Level)
                    </p>
                  )}
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm mb-6 px-1">
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-0.5">Contact</span>
                  <span className="text-[14px] font-bold text-slate-900">{userData.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-0.5">Blood Group</span>
                  <span className="text-[14px] font-bold text-slate-900">{userData.bloodGroup || 'A+'}</span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-0.5">Issue Date</span>
                  <span className="text-[14px] font-bold text-slate-900">
                    {formatCardDate(cardIssueDate)}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500 mb-0.5">Valid Until</span>
                  <span className="text-[14px] font-bold text-slate-900">
                    {formatCardDate(userData.validUntil, 'Until Revoked')}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer / QR */}
            <div className="relative z-10 border-t-2 border-slate-200/60 pt-4 flex justify-between items-end">
              <div className="bg-white p-1.5 border border-slate-300 rounded-md shrink-0 shadow-sm">
                <QRCode value={verificationUrl} size={65} level="M" />
              </div>
              
              <div className="text-right flex flex-col items-end pb-1">
                <div className="mb-1">
                  <span className="text-3xl text-[#1a5d48] pr-2 tracking-wide font-medium" style={{ fontFamily: "'Brush Script MT', 'Dancing Script', 'Great Vibes', cursive" }}>'Gulfam'</span>
                </div>
                <div className="border-b-[1.5px] border-slate-800 w-[140px] mb-1.5"></div>
                <p className="text-[13px] font-bold text-slate-900 leading-tight">Gulfam Siddique</p>
                <p className="text-[11px] font-medium text-slate-700 leading-tight">Founder & Chief Secretary</p>
                <p className="text-[9px] text-slate-600 mt-2">(Contact for MSS): info@manavsamanta.org</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            margin: 0;
            padding: 0;
            background: white;
          }
          body * {
            visibility: hidden;
          }
          .print-card-container, .print-card-container * {
            visibility: visible;
          }
          .print-card-container {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            width: 100mm;
            box-shadow: none;
            border: 1px solid #ccc;
            page-break-inside: avoid;
          }
          .hide-on-print {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
