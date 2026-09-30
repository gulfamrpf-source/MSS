import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, MapPin, ArrowLeft, Users, Target, Activity, Share2, Heart } from 'lucide-react';
import { format } from 'date-fns';

export default function PublicActivityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      if (!id) return;
      try {
        const docRef = doc(db, 'activities', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists() && docSnap.data().status === 'published') {
          setActivity({ id: docSnap.id, ...docSnap.data() });
        } else {
          navigate('/activities');
        }
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!activity) return null;

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24">
      {/* Dynamic Hero Section */}
      <div className="relative h-[60vh] min-h-[400px] w-full bg-slate-900 overflow-hidden">
        {activity.coverImageUrl ? (
          <img src={activity.coverImageUrl} alt={activity.title} className="w-full h-full object-cover opacity-50" />
        ) : (
          <div className="absolute inset-0 opacity-20">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="detail-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M30 10 L50 30 L30 50 L10 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#detail-pattern)" />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <div className="max-w-4xl mx-auto">
            <Link to="/activities" className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-bold mb-8 transition-colors bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 w-fit">
              <ArrowLeft className="w-4 h-4" /> Back to Activities
            </Link>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="px-4 py-1.5 bg-emerald-500 text-white text-sm font-bold uppercase tracking-wider rounded-lg shadow-lg">
                {activity.category || activity.type}
              </span>
              {activity.date && (
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white text-sm font-bold rounded-lg border border-white/20 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {format(new Date(activity.date), 'dd MMM yyyy')}
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight drop-shadow-lg">
              {activity.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-6 p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-wrap gap-8">
              {(activity.city || activity.location) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</p>
                    <p className="font-bold text-slate-900">{activity.city || activity.location}</p>
                  </div>
                </div>
              )}
              {activity.organizer && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organized By</p>
                    <p className="font-bold text-slate-900">{activity.organizer}</p>
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: activity.title, url: window.location.href });
                }
              }} 
              className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-8 md:p-12">
            <div className="prose prose-slate prose-lg max-w-none">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 border-l-4 border-emerald-500 pl-4">About the Initiative</h3>
              <div className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                {activity.description}
              </div>
            </div>

            {/* Impact Section */}
            {(activity.beneficiariesCount > 0 || activity.volunteersCount > 0 || activity.impactSummary) && (
              <div className="mt-16 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 md:p-10 border border-emerald-100/50 relative overflow-hidden">
                <Target className="absolute -bottom-10 -right-10 w-48 h-48 text-emerald-600/5 rotate-12" />
                
                <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3 relative z-10">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                    <Target className="w-6 h-6 text-emerald-600" />
                  </div>
                  Impact & Results
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 relative z-10">
                  {activity.beneficiariesCount > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
                      <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center shrink-0">
                        <Heart className="w-6 h-6 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Beneficiaries Reached</p>
                        <p className="text-4xl font-black text-slate-900">{activity.beneficiariesCount.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {activity.volunteersCount > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-6">
                      <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Volunteers Engaged</p>
                        <p className="text-4xl font-black text-slate-900">{activity.volunteersCount.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {activity.impactSummary && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative z-10">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Key Outcome</p>
                    <p className="text-lg font-medium text-slate-800 leading-relaxed">{activity.impactSummary}</p>
                  </div>
                )}
              </div>
            )}

            {/* Financial Transparency */}
            {activity.isFinancialPublic && (activity.estimatedBudget > 0 || activity.actualExpenditure > 0) && (
              <div className="mt-10 bg-slate-900 rounded-3xl p-8 md:p-10 border border-slate-800 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                
                <h3 className="text-2xl font-bold text-white mb-8 relative z-10">Financial Transparency</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                  <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Estimated Budget</p>
                    <p className="text-3xl font-black text-white">₹{activity.estimatedBudget?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Actual Expenditure</p>
                    <p className="text-3xl font-black text-emerald-400">₹{activity.actualExpenditure?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
