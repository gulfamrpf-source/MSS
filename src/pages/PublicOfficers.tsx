import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, MapPin, User as UserIcon, Award, ChevronRight } from 'lucide-react';

export default function PublicOfficers() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOfficers() {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'officer'));
        const querySnapshot = await getDocs(q);
        const officerData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setOfficers(officerData.filter((m: any) => m.status === 'active'));
      } catch (error) {
        console.error("Error fetching officers:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOfficers();
  }, []);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative py-24 bg-amber-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="officer-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#officer-pattern)" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-amber-950 via-amber-900/80 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto bg-amber-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-amber-700/50 transform rotate-45">
            <Shield className="w-10 h-10 text-amber-400 -rotate-45" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Our Dedicated Officers</h1>
          <p className="text-xl text-amber-100 max-w-2xl mx-auto font-medium leading-relaxed">
            Meet the leaders and coordinators driving our initiatives forward across different regions, ensuring our mission reaches every corner.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        {loading ? (
          <div className="flex justify-center py-24 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
          </div>
        ) : officers.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Officers Found</h3>
            <p className="text-slate-500 text-lg">The officer directory is currently empty.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {Array.from(new Set(officers.map(o => o.state || 'Other Regions'))).sort().map((state, stateIndex) => (
              <div key={state} className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
                {/* State Header */}
                <div className="bg-slate-900 px-8 py-6 flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center shadow-inner">
                    <MapPin className="w-5 h-5 text-slate-900" />
                  </div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">{state}</h2>
                </div>
                
                <div className="p-8 space-y-12">
                  {Array.from(new Set(officers.filter(o => (o.state || 'Other Regions') === state).map(o => o.district || 'General'))).sort().map(district => (
                    <div key={district} className="space-y-6">
                      <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-3">
                        <ChevronRight className="w-6 h-6 text-amber-500" />
                        <h3 className="text-2xl font-bold text-slate-800">{district}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {officers.filter(o => (o.state || 'Other Regions') === state && (o.district || 'General') === district).map((officer) => (
                          <div key={officer.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                            <div className="h-28 bg-gradient-to-r from-slate-800 to-slate-900 relative">
                               <div className="absolute top-4 right-4 bg-amber-500/20 backdrop-blur-sm p-1.5 rounded-lg border border-amber-500/30">
                                 <Award className="w-5 h-5 text-amber-400" />
                               </div>
                            </div>
                            
                            <div className="px-6 pb-6 relative">
                              <div className="w-20 h-20 -mt-10 rounded-2xl border-[4px] border-white bg-slate-100 overflow-hidden shadow-md z-10 relative transform -rotate-3 group-hover:rotate-0 transition-transform duration-300">
                                {officer.photoUrl ? (
                                  <img src={officer.photoUrl} alt={officer.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                    <UserIcon className="w-8 h-8 text-slate-300" />
                                  </div>
                                )}
                              </div>
                              
                              <div className="mt-4 mb-5">
                                <h3 className="text-xl font-bold text-slate-900 leading-tight group-hover:text-amber-700 transition-colors">{officer.name}</h3>
                                <p className="text-amber-600 font-bold text-sm mt-1 uppercase tracking-wide">{officer.designation || 'Officer'}</p>
                              </div>
                              
                              <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                  <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-200">
                                    <Shield className="w-3.5 h-3.5 text-slate-500" />
                                  </div>
                                  <span className="font-medium text-xs">ID: {officer.officerId || officer.memberId || 'N/A'}</span>
                                </div>
                                {officer.address && (
                                  <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
                                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                                    </div>
                                    <span className="truncate text-xs font-medium">{officer.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
