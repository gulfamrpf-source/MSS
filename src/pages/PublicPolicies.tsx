import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Scale, BookOpen, FileText, ChevronDown, CheckCircle2, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicPolicies() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const q = query(
          collection(db, 'activities'), 
          where('status', '==', 'published'),
          where('type', '==', 'policy')
        );
        const snapshot = await getDocs(q);
        const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedItems.sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
        setPolicies(fetchedItems);
        if (fetchedItems.length > 0) {
          setExpandedId(fetchedItems[0].id);
        }
      } catch (error) {
        console.error("Error fetching policies:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicies();
  }, []);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative py-24 bg-slate-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="policy-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 40 L40 0 H20 L0 20 M40 40 V20 L20 40" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#policy-pattern)" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-slate-700/50">
            <Scale className="w-10 h-10 text-slate-300" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Rules & Policies</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed">
            The foundational guidelines and operational protocols that govern Manav Samanta Sangthan, ensuring transparency, integrity, and order.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-10">
        {loading ? (
          <div className="flex justify-center py-24 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
          </div>
        ) : policies.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Policies Published</h3>
            <p className="text-slate-500 text-lg">Organization rules and policies will be listed here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
              <ShieldAlert className="w-6 h-6 text-slate-700" />
              <h2 className="text-2xl font-bold text-slate-900">Official Organization Guidelines</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {policies.map((policy) => {
                const isExpanded = expandedId === policy.id;
                return (
                  <div key={policy.id} className="transition-colors hover:bg-slate-50/50">
                    <button 
                      onClick={() => setExpandedId(isExpanded ? null : policy.id)}
                      className="w-full text-left px-8 py-6 flex items-start justify-between gap-6 focus:outline-none"
                    >
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold transition-colors ${isExpanded ? 'text-slate-900' : 'text-slate-700'}`}>
                          {policy.title}
                        </h3>
                        {policy.date && (
                          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-2 uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5" />
                            Effective: {format(new Date(policy.date), 'dd MMM yyyy')}
                          </div>
                        )}
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isExpanded ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="px-8 pb-8 pt-2">
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
                          {policy.description.split('\n').map((paragraph: string, idx: number) => (
                            <p key={idx} className="mb-4 flex gap-3">
                              {paragraph.trim().length > 0 && (
                                <>
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{paragraph}</span>
                                </>
                              )}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
