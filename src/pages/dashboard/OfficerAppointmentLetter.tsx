import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AppointmentLetterData } from '../../types/appointment';
import AppointmentLetterDoc from '../../components/AppointmentLetterDoc';
import { FileText, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { createOfficerAppointmentRecord } from '../../utils/appointmentService';

export default function OfficerAppointmentLetter() {
  const { userData, user } = useAuth();
  const [appointment, setAppointment] = useState<AppointmentLetterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingLetter, setCreatingLetter] = useState(false);

  useEffect(() => {
    async function fetchLetter() {
      if (!userData || !user) return;

      try {
        // 1. Check if user already has an appointment letter by userId
        const qUser = query(
          collection(db, 'appointment_letters'),
          where('userId', '==', user.uid),
          limit(1)
        );
        let snap = await getDocs(qUser);

        // 2. Fallback check by officerId
        if (snap.empty && userData.officerId) {
          const qOfficer = query(
            collection(db, 'appointment_letters'),
            where('officerId', '==', userData.officerId),
            limit(1)
          );
          snap = await getDocs(qOfficer);
        }

        if (!snap.empty) {
          const data = snap.docs[0].data() as AppointmentLetterData;
          setAppointment({ id: snap.docs[0].id, ...data });
        } else if (userData.role === 'officer' || userData.role === 'admin') {
          // If the officer has officerId but letter record wasn't generated yet (e.g. legacy officer),
          // automatically generate their official appointment letter right now!
          if (userData.officerId) {
            setCreatingLetter(true);
            const newRecord = await createOfficerAppointmentRecord({
              userId: user.uid,
              officerId: userData.officerId,
              officerName: userData.name,
              officerPhone: userData.phone || '',
              officerEmail: userData.email,
              designation: userData.designation || 'Officer',
              level: userData.level || '',
              state: userData.state || '',
              district: userData.district || '',
              address: userData.address || '',
              appointmentDate: userData.officerAppointmentDate || userData.joiningDate || new Date().toISOString()
            });
            setAppointment(newRecord);
            setCreatingLetter(false);
          }
        }
      } catch (err) {
        console.error("Error fetching officer appointment letter:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLetter();
  }, [userData, user]);

  if (loading || creatingLetter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
        <p className="text-sm font-medium">Loading your Official Appointment Letter...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 mb-1">Appointment Letter Pending</h2>
        <p className="text-sm text-slate-500">
          Your official appointment letter is currently being processed or you have not yet been assigned an Officer ID.
        </p>
        <p className="text-xs text-slate-400 mt-3">
          Please contact the Central Head Office or Administrator for more information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center hide-on-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointment Letter</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Official certificate of nomination and appointment issued by Manav Samanta Sangthan.
          </p>
        </div>
      </div>

      <div className="bg-slate-100/60 p-4 sm:p-8 rounded-2xl border border-slate-200/80 flex justify-center">
        <AppointmentLetterDoc appointment={appointment} showControls={true} />
      </div>
    </div>
  );
}
