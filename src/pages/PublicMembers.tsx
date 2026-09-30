import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User as UserIcon, Calendar, MapPin, Heart } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'member'));
        const querySnapshot = await getDocs(q);
        const memberData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setMembers(memberData.filter((m: any) => m.status === 'active'));
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative py-24 bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="member-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#member-pattern)" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/80 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto bg-emerald-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-emerald-700/50">
            <Heart className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Our Global Family</h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto font-medium leading-relaxed">
            Meet the passionate individuals who form the backbone of our organization, united by a shared vision of equality and service.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        {loading ? (
          <div className="flex justify-center py-20 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Active Members Yet</h3>
            <p className="text-slate-500 text-lg">Our community is growing. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {members.map((member) => (
              <div key={member.id} className="bg-white rounded-3xl overflow-hidden shadow-md border border-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                <div className="h-32 bg-emerald-700 relative">
                  {/* Overlay pattern */}
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </div>
                
                <div className="px-6 pb-6 flex-1 flex flex-col relative">
                  <div className="w-24 h-24 mx-auto -mt-12 rounded-full border-[6px] border-white bg-slate-100 overflow-hidden shadow-lg z-10 relative group-hover:scale-105 transition-transform duration-500">
                    {member.photoUrl ? (
                      <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50">
                        <UserIcon className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center mt-4 mb-5">
                    <h3 className="text-xl font-bold text-slate-900 truncate" title={member.name}>{member.name}</h3>
                    <span className="inline-block mt-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full border border-emerald-100">
                      Active Member
                    </span>
                  </div>
                  
                  <div className="mt-auto space-y-3 pt-5 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="font-medium">Joined {member.joiningDate ? format(new Date(member.joiningDate), 'MMM yyyy') : 'Recently'}</span>
                    </div>
                    {member.state && (
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="font-medium truncate" title={`${member.city ? member.city + ', ' : ''}${member.state}`}>{member.city ? `${member.city}, ` : ''}{member.state}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
