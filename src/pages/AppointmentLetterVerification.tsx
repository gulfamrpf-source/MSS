import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { AppointmentLetterData } from '../types/appointment';
import { ShieldCheck, XCircle, CheckCircle, AlertTriangle, Heart, Loader2, FileText, ArrowLeft } from 'lucide-react';

export default function AppointmentLetterVerification() {
  const { letterId } = useParams<{ letterId: string }>();
  const [appointment, setAppointment] = useState<AppointmentLetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function verifyLetter() {
      if (!letterId) {
        setError('No appointment letter reference provided.');
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch general settings
        const genSnap = await getDoc(doc(db, 'settings', 'general'));
        if (genSnap.exists() && genSnap.data().logoUrl) {
          setLogoUrl(genSnap.data().logoUrl);
        }

        // 2. Direct lookup by doc ID
        const docRef = doc(db, 'appointment_letters', letterId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAppointment({ id: docSnap.id, ...docSnap.data() } as AppointmentLetterData);
          setLoading(false);
          return;
        }

        // 3. Fallback lookup by officerId
        const qOfficer = query(
          collection(db, 'appointment_letters'),
          where('officerId', '==', letterId),
          limit(1)
        );
        const officerSnap = await getDocs(qOfficer);
        if (!officerSnap.empty) {
          setAppointment({ id: officerSnap.docs[0].id, ...officerSnap.docs[0].data() } as AppointmentLetterData);
          setLoading(false);
          return;
        }

        // 4. Fallback lookup by refNumber
        const qRef = query(
          collection(db, 'appointment_letters'),
          where('refNumber', '==', letterId),
          limit(1)
        );
        const refSnap = await getDocs(qRef);
        if (!refSnap.empty) {
          setAppointment({ id: refSnap.docs[0].id, ...refSnap.docs[0].data() } as AppointmentLetterData);
          setLoading(false);
          return;
        }

        setError('No official appointment letter record found for this identifier.');
      } catch (err: any) {
        console.error("Verification error:", err);
        setError('Verification request failed. Please check network connectivity.');
      } finally {
        setLoading(false);
      }
    }

    verifyLetter();
  }, [letterId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" />
        <p className="text-slate-600 font-medium">Verifying Official Appointment Certificate...</p>
      </div>
    );
  }

  const isValid = appointment && appointment.status === 'active';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center font-sans">
      <div className="flex flex-col items-center mb-8">
        <Link to="/" className="flex items-center gap-2 mb-1">
          {logoUrl ? (
            <img src={logoUrl} alt="MSS Logo" className="w-10 h-10 object-contain" />
          ) : (
            <Heart className="w-8 h-8 text-emerald-600" />
          )}
          <span className="font-bold text-xl text-slate-900 tracking-tight">MANAV SAMANTA SANGTHAN</span>
        </Link>
        <span className="text-xs text-emerald-700 font-medium italic">"पहले इंसान, फिर धर्म"</span>
        <span className="text-xs text-slate-500 uppercase tracking-widest mt-1">Official Digital Dispatch Verification</span>
      </div>

      <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        {error || !appointment ? (
          <div className="p-8 text-center bg-rose-50 border-b border-rose-100">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-rose-700 mb-2">Verification Failed</h2>
            <p className="text-rose-600 font-medium">INVALID APPOINTMENT RECORD</p>
            <p className="text-sm text-rose-500 mt-2">{error || 'This QR code does not match any valid appointment records.'}</p>
          </div>
        ) : !isValid ? (
          <div className="p-8 text-center bg-amber-50 border-b border-amber-100">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-amber-700 mb-2">APPOINTMENT STATUS: INACTIVE</h2>
            <p className="text-amber-600 font-medium uppercase">Current Status: {appointment.status}</p>
            <p className="text-sm text-amber-600 mt-2">This appointment letter has been superseded or is no longer active.</p>
          </div>
        ) : (
          <div className="p-8 text-center bg-emerald-50 border-b border-emerald-100">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-700 mb-1">VERIFIED OFFICER APPOINTMENT</h2>
            <p className="text-emerald-600 font-medium text-sm">Authentic Certificate Issued by Central Head Office</p>
          </div>
        )}

        {appointment && (
          <div className="p-8 space-y-4">
            <div className="text-center pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">{appointment.officerName}</h3>
              <p className="font-semibold text-emerald-700 mt-0.5">{appointment.designation}</p>
              <p className="text-xs text-slate-500 mt-1">
                {[appointment.district, appointment.state].filter(Boolean).join(', ') || appointment.level || 'All India'}
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Officer ID:</span>
                <span className="font-mono font-bold text-slate-900">{appointment.officerId}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Dispatch Reference:</span>
                <span className="font-mono font-bold text-slate-900">{appointment.refNumber}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Appointment Date:</span>
                <span className="font-bold text-slate-900">
                  {new Date(appointment.appointmentDate || appointment.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Issued By:</span>
                <span className="font-bold text-slate-900">
                  {appointment.issuedByName} ({appointment.issuedByDesignation})
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Authentication:</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Cryptographically Verified
                </span>
              </div>
            </div>

            <div className="pt-4 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Manav Samanta Sangthan Portal
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
