import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, ArrowRight, Activity, Users, Quote, Target } from 'lucide-react';
import { format } from 'date-fns';
import { defaultFounderData } from '../firebase-utils';

export default function PublicActivities() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [founderProfile, setFounderProfile] = useState(defaultFounderData);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'activities'), 
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc')
        );
        
        const [snapshot, founderDoc] = await Promise.all([
          getDocs(q),
          getDoc(doc(db, 'profiles', 'founder'))
        ]);
        
        const activityData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setActivities(activityData);

        if (founderDoc.exists()) {
          setFounderProfile({ ...defaultFounderData, ...founderDoc.data() });
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative py-24 bg-teal-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="activities-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M0 30 Q15 0 30 30 T60 30" fill="none" stroke="currentColor" strokeWidth="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#activities-pattern)" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-transparent to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-teal-700/50 backdrop-blur-sm">
            <Activity className="w-10 h-10 text-teal-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Our Work & Activities</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto font-medium leading-relaxed">
            Discover the tangible impact we are making across communities through our dedicated programs, grassroots campaigns, and events.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10 mb-20">
        {loading ? (
          <div className="flex justify-center py-24 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Activity className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No Activities Yet</h3>
            <p className="text-slate-500 text-lg">Check back soon for updates on our latest work.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activities.map((activity) => (
              <div key={activity.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col hover:-translate-y-1">
                <div className="relative h-60 overflow-hidden bg-slate-100">
                  {activity.coverImageUrl ? (
                    <img src={activity.coverImageUrl} alt={activity.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-200 group-hover:scale-110 transition-transform duration-700">
                      <Activity className="w-20 h-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                      {activity.category || 'Activity'}
                    </span>
                  </div>
                  
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 text-xs font-medium text-white/90">
                    {activity.date && (
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(activity.date), 'dd MMM yyyy')}</span>
                    )}
                    {(activity.city || activity.location) && (
                      <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 shrink-0" /> {activity.city || activity.location}</span>
                    )}
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-teal-700 transition-colors line-clamp-2 leading-tight">
                    {activity.title}
                  </h3>
                  <p className="text-slate-600 mb-8 line-clamp-3 flex-1 text-base leading-relaxed">
                    {activity.description}
                  </p>
                  
                  <Link 
                    to={`/activities/${activity.id}`} 
                    className="inline-flex items-center justify-between w-full px-6 py-3 bg-slate-50 hover:bg-teal-50 text-teal-700 font-bold rounded-xl transition-colors group/btn"
                  >
                    View Details <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Founder Message Section */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
            <Quote className="absolute top-6 left-6 w-32 h-32 text-slate-200/50 -rotate-12" />
            
            <div className="grid md:grid-cols-12 gap-10 items-center relative z-10">
              <div className="md:col-span-4">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white relative group">
                  {founderProfile.photoUrl ? (
                    <img src={founderProfile.photoUrl} alt={founderProfile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-teal-900 flex items-center justify-center">
                      <Users className="w-20 h-20 text-teal-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h4 className="font-bold text-lg leading-tight">{founderProfile.name}</h4>
                    <p className="text-teal-400 text-sm font-medium">{founderProfile.designation}</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-12 bg-teal-500"></div>
                  <h3 className="text-lg font-bold text-teal-700 uppercase tracking-widest">Founder's Perspective</h3>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">
                  Driving Purpose Through Action
                </h2>
                <div className="prose prose-lg prose-slate">
                  <p className="text-slate-600 leading-relaxed font-medium text-xl italic mb-6">
                    "Every activity, no matter how small, is a step towards the society we envision. Our work is the living proof of our commitment to humanity."
                  </p>
                  <p className="text-slate-500 leading-relaxed">
                    By documenting and sharing our initiatives, we hope to inspire more people to join our cause. When you participate in or support our activities, you are directly contributing to uplifting marginalized communities and fostering equality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
