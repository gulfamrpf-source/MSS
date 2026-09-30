import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Loader2, Calendar, MapPin, ArrowRight, Image as ImageIcon, Briefcase, Flag, Megaphone, Newspaper, Users, Quote, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { defaultFounderData } from '../firebase-utils';

const getTypeConfig = (type: string) => {
  switch (type) {
    case 'project': return { color: 'bg-blue-900', text: 'text-blue-400', icon: Briefcase, border: 'border-blue-700/50' };
    case 'campaign': return { color: 'bg-rose-900', text: 'text-rose-400', icon: Megaphone, border: 'border-rose-700/50' };
    case 'event': return { color: 'bg-purple-900', text: 'text-purple-400', icon: Flag, border: 'border-purple-700/50' };
    case 'news': return { color: 'bg-cyan-900', text: 'text-cyan-400', icon: Newspaper, border: 'border-cyan-700/50' };
    case 'gallery': return { color: 'bg-fuchsia-900', text: 'text-fuchsia-400', icon: ImageIcon, border: 'border-fuchsia-700/50' };
    default: return { color: 'bg-emerald-900', text: 'text-emerald-400', icon: Target, border: 'border-emerald-700/50' };
  }
};

const getFounderMessage = (type: string, defaultMessage: string) => {
  switch (type) {
    case 'project': return "Our long-term projects are the foundation of sustainable change. We believe in building lasting solutions that empower communities for generations to come.";
    case 'campaign': return "True impact requires immediate, focused action. Our campaigns are designed to address pressing issues head-on, mobilizing support where it's needed most.";
    case 'event': return "When people come together, incredible things happen. Our events are platforms for unity, awareness, and collective action toward a better society.";
    case 'gallery': return "A picture speaks a thousand words about our impact. These visual stories capture the smiles, the hard work, and the real change happening on the ground.";
    case 'news': return "Transparency and awareness are key to our mission. We believe in keeping our community informed about every milestone we achieve together.";
    default: return defaultMessage;
  }
};

export default function PublicContentView({ type, title, subtitle }: { type: string, title: string, subtitle: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [founderProfile, setFounderProfile] = useState(defaultFounderData);
  
  const config = getTypeConfig(type);
  const TypeIcon = config.icon;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'activities'), 
          where('status', '==', 'published'),
          where('type', '==', type)
        );
        const [snapshot, founderDoc] = await Promise.all([
          getDocs(q),
          getDoc(doc(db, 'profiles', 'founder'))
        ]);
        
        const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedItems.sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
        setItems(fetchedItems);
        
        if (founderDoc.exists()) {
          setFounderProfile({ ...defaultFounderData, ...founderDoc.data() });
        }
      } catch (error) {
        console.error(`Error fetching data for ${type}`, error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [type]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className={`relative py-24 ${config.color} overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="content-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="currentColor" />
                <path d="M0 40 L40 0" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#content-pattern)" />
          </svg>
        </div>
        <div className={`absolute inset-0 bg-gradient-to-t from-${config.color.split('-')[1]}-950 via-transparent to-transparent`}></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className={`w-20 h-20 mx-auto bg-white/10 rounded-2xl flex items-center justify-center mb-6 shadow-lg border ${config.border} backdrop-blur-sm`}>
            <TypeIcon className={`w-10 h-10 ${config.text}`} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">{title}</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10 mb-20">
        {items.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl shadow-xl border border-slate-100">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <TypeIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">No {title} Found</h3>
            <p className="text-slate-500 text-lg">Check back later for new updates.</p>
          </div>
        ) : type === 'gallery' ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {items.map(item => (
              <div key={item.id} className="break-inside-avoid group relative rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 bg-white">
                <img src={item.coverImageUrl || 'https://images.unsplash.com/photo-1593113589914-07553e1f33f6?auto=format&fit=crop&q=80'} alt={item.title} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <h3 className="text-white font-bold text-xl leading-tight">{item.title}</h3>
                  {item.date && (
                    <p className="text-white/70 text-sm mt-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> {format(new Date(item.date), 'dd MMM yyyy')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col hover:-translate-y-1">
                <div className="relative h-60 overflow-hidden">
                  <img 
                    src={item.coverImageUrl || 'https://images.unsplash.com/photo-1593113589914-07553e1f33f6?auto=format&fit=crop&q=80'} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 bg-white/95 backdrop-blur-md text-slate-900 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                      {item.category || type}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 text-xs font-medium text-white/90">
                    {item.date && (
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(item.date), 'dd MMM yyyy')}</span>
                    )}
                    {item.city && (
                      <span className="flex items-center gap-1.5 truncate"><MapPin className="w-3.5 h-3.5 shrink-0" /> {item.city}</span>
                    )}
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-4 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-tight">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 mb-8 line-clamp-3 flex-1 text-base leading-relaxed">
                    {item.description}
                  </p>
                  <Link to={`/activities/${item.id}`} className="inline-flex items-center justify-between w-full px-6 py-3 bg-slate-50 hover:bg-emerald-50 text-emerald-700 font-bold rounded-xl transition-colors group/btn">
                    Read Full Details <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Founder Message specific to content type */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="bg-slate-50 rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm relative overflow-hidden">
            {/* Decorative Quotes */}
            <Quote className="absolute top-6 left-6 w-32 h-32 text-slate-200/50 -rotate-12" />
            
            <div className="grid md:grid-cols-12 gap-10 items-center relative z-10">
              <div className="md:col-span-4">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border-4 border-white relative group">
                  {founderProfile.photoUrl ? (
                    <img src={founderProfile.photoUrl} alt={founderProfile.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-emerald-900 flex items-center justify-center">
                      <Users className="w-20 h-20 text-emerald-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h4 className="font-bold text-lg leading-tight">{founderProfile.name}</h4>
                    <p className="text-emerald-400 text-sm font-medium">{founderProfile.designation}</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px w-12 bg-emerald-500"></div>
                  <h3 className="text-lg font-bold text-emerald-700 uppercase tracking-widest">Founder's Perspective</h3>
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">
                  Driving Purpose Through Our {title}
                </h2>
                <div className="prose prose-lg prose-slate">
                  <p className="text-slate-600 leading-relaxed font-medium text-xl italic mb-6">
                    "{getFounderMessage(type, founderProfile.message.split('\n')[0])}"
                  </p>
                  <p className="text-slate-500 leading-relaxed">
                    Every step we take is aimed at building a stronger, more equal society. Your support in these {type}s brings us closer to our vision of humanity first. Together, we can turn compassion into concrete action.
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
