import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User, ShieldCheck } from 'lucide-react';

export default function LeadershipTeam() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeadership() {
      try {
        const q = query(
          collection(db, 'users'), 
          where('role', '==', 'officer')
        );
        const snap = await getDocs(q);
        const allOfficers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        
        // Filter those who are Chairman, Secretary, or Chief Secretary (case insensitive)
        const topLeaders = allOfficers.filter(o => {
          const desig = (o.designation || '').toLowerCase();
          return desig.includes('chairman') || desig.includes('secretary') || desig.includes('chief') || desig.includes('president') || desig.includes('director');
        });
        
        setLeaders(topLeaders);
      } catch (err) {
        console.error("Error fetching leadership", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeadership();
  }, []);

  if (loading || leaders.length === 0) return null;

  return (
    <section className="w-full bg-slate-50 border-t border-slate-100 py-24 px-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[30rem] h-[30rem] bg-emerald-50/50 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-sm font-bold tracking-widest text-emerald-600 uppercase mb-3">Our Leadership</h2>
          <h3 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">Meet the Core Team</h3>
          <p className="text-lg text-slate-500 font-medium">The visionary minds driving our mission to create a more equitable, inclusive, and sensitive society.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-10">
          {leaders.map(leader => (
            <div key={leader.id} className="group relative bg-white rounded-[2rem] overflow-hidden hover:shadow-2xl hover:shadow-emerald-900/5 transition-all duration-500 w-full max-w-xs flex flex-col items-center border border-slate-100/80">
              {/* Accented Header Area */}
              <div className="h-28 w-full bg-slate-100/50 absolute top-0 left-0 z-0 group-hover:bg-emerald-50/50 transition-colors duration-500 border-b border-slate-100/50"></div>
              
              <div className="w-32 h-32 rounded-full overflow-hidden mt-12 mb-5 border-[6px] border-white bg-slate-100 shadow-md relative z-10 group-hover:scale-105 transition-transform duration-500">
                {leader.photoUrl ? (
                  <img src={leader.photoUrl} alt={leader.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-12 h-12" />
                  </div>
                )}
              </div>
              
              <div className="px-6 pb-8 w-full flex flex-col items-center text-center relative z-10">
                <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">{leader.name}</h4>
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100/50">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">
                    {leader.designation}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
