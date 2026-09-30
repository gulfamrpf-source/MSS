import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, PlayCircle, Users, Globe2, Activity, CheckCircle, ShieldCheck } from 'lucide-react';
import LeadershipTeam from '../components/LeadershipTeam';
import FounderProfile from '../components/FounderProfile';

import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useState, useEffect } from 'react';

export default function Home() {
  const { isAdmin } = useAuth();
  const [homeContent, setHomeContent] = useState({
    heroTitle: "Small Act,\nBig Change",
    heroSubtitle: "\"पहले इंसान, फिर धर्म\"",
    heroDescription: "Your kindness today can create a better tomorrow for someone in need. Join our mission for equality and welfare."
  });

  useEffect(() => {
    getDoc(doc(db, 'settings', 'homePage')).then(snap => {
      if (snap.exists()) {
        setHomeContent(prev => ({ ...prev, ...snap.data() }));
      }
    });
  }, []);

  return (
    <div className="bg-transparent">
      
            {/* HERO SECTION */}
      <section className="relative pt-12 pb-32 lg:pt-20 lg:pb-40 px-6 overflow-hidden min-h-[90vh] flex items-center">
        {/* Dynamic Background Image with Left Gradient Mask */}
        {homeContent.heroBackgroundImage && (
          <div className="absolute inset-0 z-0">
            {/* The Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${homeContent.heroBackgroundImage})` }}
            ></div>
            {/* Gradient Overlay to make left text readable (White to Transparent) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#fdfbf7] via-[#fdfbf7]/90 to-transparent w-full md:w-[85%] lg:w-[75%]"></div>
            
          </div>
        )}
        
        {/* Fallback pattern if no image */}
        {!homeContent.heroBackgroundImage && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-emerald-50/50">
            <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[70%] rounded-full bg-emerald-200/20 blur-3xl"></div>
            <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-amber-200/20 blur-3xl"></div>
          </div>
        )}

        <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 max-w-7xl">

          
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 text-amber-900 rounded-full text-sm font-bold">
              <Heart className="w-4 h-4" /> Together we can
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-emerald-950 leading-[1.1] tracking-tight whitespace-pre-line">
              {homeContent.heroTitle}
            </h1>
            <h2 className="text-2xl lg:text-3xl font-bold text-emerald-700 italic mt-2">
              {homeContent.heroSubtitle}
            </h2>
            <p className="text-xl text-slate-600 max-w-lg leading-relaxed">
              {homeContent.heroDescription}
            </p>
            
            <div className="pt-4 flex flex-wrap items-center gap-6">
              <Link to="/activities" className="px-8 py-4 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded-lg transition-colors shadow-md">
                Explore Causes
              </Link>
              <Link to="/about" className="px-6 py-4 flex items-center gap-2 text-emerald-950 font-bold hover:text-emerald-700 transition-colors">
                <PlayCircle className="w-6 h-6" /> Watch Video
              </Link>
            </div>
          </div>

          {/* Right Content - Donation Card Component */}
          <div className="lg:col-span-5 relative z-10">
            <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-extrabold text-emerald-950 mb-2">Make a Donation</h3>
                <p className="text-slate-500 font-medium">Every contribution brings hope and change.</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="py-3 border-2 border-emerald-900 bg-emerald-900 text-white font-bold rounded-xl">One Time</button>
                <button className="py-3 border-2 border-slate-100 bg-slate-50 text-slate-500 font-bold rounded-xl hover:bg-slate-100">Monthly</button>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-6">
                <button className="py-3 border-2 border-slate-100 bg-slate-50 text-emerald-950 font-bold rounded-xl hover:border-emerald-200">₹500</button>
                <button className="py-3 border-2 border-slate-100 bg-slate-50 text-emerald-950 font-bold rounded-xl hover:border-emerald-200">₹1K</button>
                <button className="py-3 border-2 border-amber-400 bg-amber-400 text-emerald-950 font-bold rounded-xl">₹5K</button>
                <button className="py-3 border-2 border-slate-100 bg-slate-50 text-emerald-950 font-bold rounded-xl hover:border-emerald-200">Other</button>
              </div>

              <Link to="/donate" className="block w-full py-4 bg-emerald-900 hover:bg-emerald-800 text-white text-center rounded-xl font-bold text-lg transition-colors shadow-md mb-4">
                Donate Now
              </Link>
              <p className="text-center text-sm font-medium text-slate-400 flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Secure Donation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="w-full mx-auto px-6 relative z-20 -mt-24 mb-24">
        <div className="bg-emerald-950 rounded-[2rem] p-8 md:p-12 shadow-2xl flex flex-wrap justify-between gap-8 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800/50 flex items-center justify-center">
              <Users className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="text-3xl font-extrabold mb-1">120K+</div>
              <div className="text-emerald-400 text-sm font-medium">People Helped</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800/50 flex items-center justify-center">
              <Activity className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="text-3xl font-extrabold mb-1">850+</div>
              <div className="text-emerald-400 text-sm font-medium">Communities</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800/50 flex items-center justify-center">
              <Globe2 className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="text-3xl font-extrabold mb-1">15+</div>
              <div className="text-emerald-400 text-sm font-medium">States</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800/50 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-emerald-300" />
            </div>
            <div>
              <div className="text-3xl font-extrabold mb-1">98%</div>
              <div className="text-emerald-400 text-sm font-medium">Transparency</div>
            </div>
          </div>
        </div>
      </section>

            {/* MIDDLE SECTION FULL WIDTH IMAGE */}
      {(homeContent as any).midSectionBgImage && (
        <section 
          className="w-full bg-cover bg-center bg-no-repeat h-[50vh] md:h-[65vh]"
          style={{ backgroundImage: `url(${(homeContent as any).midSectionBgImage})` }}
        >
        </section>
      )}

      {/* WHERE YOUR SUPPORT GOES */}
      <section className="w-full mx-auto px-6 py-12 mb-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-emerald-950 mb-4 tracking-tight">
            Where Your <span className="text-emerald-700">Support</span> Goes
          </h2>
          <p className="text-lg text-slate-500">We work in the areas where the need is greatest.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
          {/* Card 1 */}
          <Link to="/activities" className="group">
            <div className="w-full h-64 bg-slate-200 rounded-2xl mb-6 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=800&auto=format&fit=crop" alt="Education" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-2">Education for All</h3>
            <p className="text-slate-500">Help children build a brighter future through continuous learning.</p>
          </Link>
          
          {/* Card 2 */}
          <Link to="/activities" className="group">
            <div className="w-full h-64 bg-slate-200 rounded-2xl mb-6 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800&auto=format&fit=crop" alt="Environment" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-2">Clean Environment</h3>
            <p className="text-slate-500">Provide clean and safe surroundings for communities to thrive.</p>
          </Link>

          {/* Card 3 */}
          <Link to="/activities" className="group">
            <div className="w-full h-64 bg-slate-200 rounded-2xl mb-6 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop" alt="Healthcare" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <h3 className="text-xl font-bold text-emerald-950 mb-2">Healthcare Access</h3>
            <p className="text-slate-500">Support medical care for those in need in rural areas.</p>
          </Link>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="w-full mx-auto px-6 pb-24">
        <div className="bg-emerald-950 rounded-[2.5rem] overflow-hidden flex flex-col md:flex-row items-center">
          <div className="p-12 md:p-16 md:w-1/2">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Be the Reason<br/>Someone Smiles Today
            </h2>
            <p className="text-emerald-100 text-lg mb-8">Join thousands of compassionate people making a real difference every day.</p>
            
            <ul className="space-y-4 mb-10 text-emerald-50">
              <li className="flex items-center gap-3 font-medium">
                <CheckCircle className="w-6 h-6 text-amber-400 flex-shrink-0" /> Become a volunteer
              </li>
              <li className="flex items-center gap-3 font-medium">
                <CheckCircle className="w-6 h-6 text-amber-400 flex-shrink-0" /> Organize a fundraiser
              </li>
              <li className="flex items-center gap-3 font-medium">
                <CheckCircle className="w-6 h-6 text-amber-400 flex-shrink-0" /> Spread awareness
              </li>
              <li className="flex items-center gap-3 font-medium">
                <CheckCircle className="w-6 h-6 text-amber-400 flex-shrink-0" /> Make a lasting impact
              </li>
            </ul>

            <div className="flex flex-wrap gap-4">
              <Link to="/join" className="px-8 py-4 bg-amber-400 hover:bg-amber-500 text-emerald-950 font-bold rounded-xl transition-colors shadow-md">
                Join Us
              </Link>
              <Link to="/about" className="px-8 py-4 border-2 border-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl transition-colors">
                Learn More
              </Link>
            </div>
          </div>
          <div className="md:w-1/2 h-64 md:h-[600px] w-full">
            <img 
              src="https://images.unsplash.com/photo-1593113563332-614c2727ce7a?q=80&w=1200&auto=format&fit=crop" 
              alt="Volunteers" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      
      
      {/* LEADERSHIP & FOUNDER */}
      <LeadershipTeam />
      <FounderProfile isAdmin={isAdmin} />

    </div>
  );
}
