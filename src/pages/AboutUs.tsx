import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { defaultFounderData } from '../firebase-utils';
import { Heart, Target, Shield, Users, Eye, ArrowRight, Quote } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutUs() {
  const [founderProfile, setFounderProfile] = useState(defaultFounderData);

  useEffect(() => {
    async function fetchFounder() {
      try {
        const d = await getDoc(doc(db, 'profiles', 'founder'));
        if (d.exists()) {
          setFounderProfile({ ...defaultFounderData, ...d.data() });
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchFounder();
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative py-24 bg-emerald-900 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=2070&auto=format&fit=crop" 
            alt="About Us Background" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-900/80 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight">About Manav Samanta Sangthan</h1>
          <p className="text-xl text-emerald-100 max-w-3xl mx-auto font-medium leading-relaxed">
            We are a community-driven organization dedicated to serving humanity, promoting equality, and providing support to those who need it the most.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-emerald-50 rounded-3xl p-10 border border-emerald-100 relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Target className="w-32 h-32 text-emerald-900" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-emerald-950 mb-4">Our Mission</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  To uplift marginalized communities by providing access to basic needs, education, healthcare, and equal opportunities. We strive to create a society where every individual is treated with dignity and respect, regardless of their background.
                </p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-3xl p-10 border border-amber-100 relative overflow-hidden group hover:shadow-lg transition-shadow">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Eye className="w-32 h-32 text-amber-900" />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-amber-950 mb-4">Our Vision</h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  A world driven by the principle of "पहले इंसान, फिर धर्म" (Humanity First, Religion Later). We envision a unified society free from discrimination, where compassion drives collective progress and peace.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">The fundamental beliefs that guide our actions and decisions every day.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 mx-auto bg-rose-100 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Compassion</h3>
              <p className="text-slate-600 text-sm leading-relaxed">We act with empathy and kindness, always putting the needs of the vulnerable first.</p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Equality</h3>
              <p className="text-slate-600 text-sm leading-relaxed">We believe every human being deserves equal rights, opportunities, and respect.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Integrity</h3>
              <p className="text-slate-600 text-sm leading-relaxed">We maintain transparency and honesty in all our organizational operations.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:-translate-y-1 transition-transform">
              <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Impact</h3>
              <p className="text-slate-600 text-sm leading-relaxed">We are dedicated to creating measurable, long-lasting positive change in society.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-24 bg-emerald-950 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="founder-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="2" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#founder-pattern)" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-5 relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl relative">
                {founderProfile.photoUrl ? (
                  <img src={founderProfile.photoUrl} alt={founderProfile.name} className="w-full h-full object-cover object-top" />
                ) : (
                  <div className="w-full h-full bg-emerald-900 flex items-center justify-center">
                    <Users className="w-24 h-24 text-emerald-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-2xl font-bold text-white mb-1">{founderProfile.name}</h3>
                  <p className="text-emerald-400 font-medium">{founderProfile.designation}</p>
                </div>
              </div>
              
              {/* Decorative block */}
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-amber-500 rounded-2xl -z-10 opacity-50"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-emerald-700 rounded-2xl -z-10 opacity-50"></div>
            </div>
            
            <div className="md:col-span-7">
              <Quote className="w-16 h-16 text-emerald-700/50 mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white">Message from the Founder</h2>
              <div className="prose prose-lg prose-emerald prose-invert">
                {founderProfile.message.split('\n').map((paragraph, index) => (
                  <p key={index} className="text-emerald-100/90 leading-relaxed mb-6">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">Join Us in Making a Difference</h2>
          <p className="text-lg text-slate-600 mb-10">
            Whether through volunteering, donating, or simply spreading the word, your contribution helps us get one step closer to our vision of equality and harmony.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/join" className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
              Become a Member <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/donate" className="px-8 py-4 bg-white border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50 font-bold rounded-xl transition-colors">
              Make a Donation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
