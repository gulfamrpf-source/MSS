import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, LayoutDashboard, Users, UserPlus, LogOut, ShieldCheck, FileText, Settings, Award, Mail, CreditCard , Globe } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function DashboardLayout() {
  const { userData, logOut, isAdmin, isOfficer, isMember } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().logoUrl) {
        setLogoUrl(docSnap.data().logoUrl);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await logOut();
    navigate('/');
  };

  const NavLink = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => {
    const active = location.pathname === to || location.pathname.startsWith(to + '/');
    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${active ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-emerald-600' : 'text-slate-400'}`} />
        {label}
      </Link>
    );
  };

  if (!userData) return null; // Or a loading spinner

  return (
    <div className="min-h-screen bg-transparent flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="MSS Logo" className="w-8 h-8 object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white">
                <Heart className="w-4 h-4" />
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-slate-900 truncate leading-tight">MSS Portal</span>
              <span className="text-[10px] text-emerald-600 font-medium italic truncate">पहले इंसान, फिर धर्म</span>
            </div>
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavLink to="/dashboard/profile" icon={UserPlus} label="My Profile" />
          
          {(isMember || isOfficer || isAdmin) && (
            <NavLink to="/dashboard/identity-card" icon={CreditCard} label="My Identity Card" />
          )}

          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin Controls</div>
              <NavLink to="/dashboard/activities" icon={LayoutDashboard} label="Activities & Projects" />
              <NavLink to="/dashboard/applications" icon={FileText} label="Applications" />
              <NavLink to="/dashboard/members" icon={Users} label="Members & Officers" />
              <NavLink to="/dashboard/id-management" icon={CreditCard} label="Identity Cards Management" />
              <NavLink to="/dashboard/admin-tasks" icon={Award} label="Task Allocation" />
              <NavLink to="/dashboard/messages" icon={Mail} label="Contact Messages" />
              <NavLink to="/dashboard/policies" icon={ShieldCheck} label="Policies & Legal" />
              <NavLink to="/dashboard/donations" icon={CreditCard} label="Donations" />
              <NavLink to="/dashboard/settings" icon={Settings} label="System Settings" />
            </>
          )}

          {isOfficer && !isAdmin && (
            <>
              <div className="pt-4 pb-2 px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Officer Area</div>
              <NavLink to="/dashboard/tasks" icon={Award} label="My Tasks" />
              <NavLink to="/dashboard/assigned-members" icon={Users} label="Assigned Members" />
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 overflow-hidden">
              {userData.photoUrl ? (
                <img src={userData.photoUrl} alt={userData.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                  {userData.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{userData.name}</p>
              <p className="text-xs text-slate-500 capitalize">{userData.role}</p>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            <Link 
              to="/"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Globe className="w-4 h-4" /> View Website
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30">
          <Link to="/" className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt="MSS Logo" className="w-8 h-8 object-contain" />
            ) : (
              <Heart className="w-6 h-6 text-emerald-600" />
            )}
            <span className="font-bold text-slate-900">MSS Portal</span>
          </Link>
          <button onClick={handleLogout} className="text-slate-500 hover:text-slate-900">
            <LogOut className="w-6 h-6" />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
