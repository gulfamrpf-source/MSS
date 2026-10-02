import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Users, ShieldCheck, FileText, Activity, CreditCard, ArrowRight, Download, Award } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from 'react-router-dom';

export default function DashboardOverview() {
  const { userData, isAdmin, isOfficer, isMember } = useAuth();
  const [stats, setStats] = useState({
    membersCount: 0,
    officersCount: 0,
    pendingAppsCount: 0,
    activitiesCount: 0,
    appointmentLettersCount: 0
  });

  useEffect(() => {
    if (!isAdmin) return;

    // Listen to users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      let m = 0;
      let o = 0;
      snap.docs.forEach(doc => {
        const d = doc.data();
        if (d.role === 'member') m++;
        if (d.role === 'officer' || d.role === 'admin') o++;
      });
      setStats(prev => ({ ...prev, membersCount: m, officersCount: o }));
    });

    // Listen to pending applications
    const qApps = query(collection(db, 'applications'), where('status', '==', 'under_review'));
    const unsubApps = onSnapshot(qApps, (snap) => {
      setStats(prev => ({ ...prev, pendingAppsCount: snap.size }));
    });

    // Listen to activities
    const unsubAct = onSnapshot(collection(db, 'activities'), (snap) => {
      setStats(prev => ({ ...prev, activitiesCount: snap.size }));
    });

    // Listen to appointment letters
    const unsubAppts = onSnapshot(collection(db, 'appointment_letters'), (snap) => {
      setStats(prev => ({ ...prev, appointmentLettersCount: snap.size }));
    });

    return () => {
      unsubUsers();
      unsubApps();
      unsubAct();
      unsubAppts();
    };
  }, [isAdmin]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {userData?.name}</h1>
        <p className="text-slate-500">Here's what's happening with your account today.</p>
      </div>

      {/* Admin Live Counters */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/dashboard/members" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Members</p>
                <p className="text-2xl font-bold text-slate-900">{stats.membersCount}</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/appointment-letters" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Officers / Appointments</p>
                <p className="text-2xl font-bold text-slate-900">{stats.officersCount}</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/applications" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-amber-500 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Pending Applications</p>
                <p className="text-2xl font-bold text-slate-900">{stats.pendingAppsCount}</p>
              </div>
            </div>
          </Link>

          <Link to="/dashboard/activities" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Active Activities</p>
                <p className="text-2xl font-bold text-slate-900">{stats.activitiesCount}</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Officer Quick Actions Card */}
      {(isOfficer || isAdmin) && (
        <div className="bg-gradient-to-r from-emerald-800 to-[#144837] text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full inline-block mb-2">
              Official Officer Certificate
            </span>
            <h3 className="text-xl font-bold">My Official Appointment Letter (नियुक्ति पत्र)</h3>
            <p className="text-emerald-100 text-sm mt-1 max-w-xl">
              View, print or download your verified Officer Appointment Letter issued under the seal of Manav Samanta Sangthan with the signature of the Chief Secretary.
            </p>
          </div>
          <Link
            to="/dashboard/appointment-letter"
            className="px-5 py-2.5 bg-white text-emerald-800 hover:bg-emerald-50 text-sm font-bold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Download A4 Letter <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Member Identity Card Action */}
      {(isMember || isOfficer || isAdmin) && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Digital Identity Card (पहचान पत्र)</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Role: <span className="capitalize font-semibold text-slate-800">{userData?.role}</span>
                {userData?.memberId && <span> • Member ID: {userData.memberId}</span>}
                {userData?.officerId && <span> • Officer ID: {userData.officerId}</span>}
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/identity-card"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm flex items-center gap-1.5"
          >
            View My ID Card <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {userData?.role === 'user' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Application Status</h2>
          <p className="text-slate-600 text-sm">
            Your membership application is currently under review by our administration. Once approved, your official Identity Card and digital credentials will be activated here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
