import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Heart, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function PublicLayout() {
  const { user, userData, logOut, signIn } = useAuth();
  const location = useLocation();
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    });
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900 flex flex-col">
      <style>{`
@keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
.animate-marquee { display: inline-block; white-space: nowrap; padding-right: 100%; animation: marquee 60s linear infinite; }
.animate-marquee:hover { animation-play-state: paused; }
`}</style>
<header 
        className="sticky top-0 z-50 flex flex-col shadow-sm border-b border-slate-200 relative"
        style={settings.headerBgUrl ? {
          backgroundImage: "url(" + settings.headerBgUrl + ")",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        } : { backgroundColor: 'white' }}
      >
        {/* Background Overlay */}
        <div className={`absolute inset-0 z-0 ${settings.headerBgUrl ? 'bg-white/85 backdrop-blur-[2px]' : 'bg-white'}`}></div>

        {/* Marquee Notification Bar (Top Most) */}
        {settings.notificationText && (
          <div className="w-full overflow-hidden flex items-center relative z-10 bg-emerald-700 text-white">
             <div className="w-full overflow-hidden relative py-1.5">
               <div className="animate-marquee font-medium text-[13px] tracking-wide">
                 <span className="inline-flex items-center gap-3">
                   <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> 
                   {settings.notificationText}
                 </span>
               </div>
             </div>
          </div>
        )}

        {/* Main Logo & Action Bar */}
        <div className="w-full px-4 md:px-6 py-4 flex items-center justify-between relative z-10"> 
          <Link to="/" className="flex items-center gap-4 group">
            {settings.logoUrl ? (
              <div className="w-16 h-16 flex items-center justify-center">
                <img src={settings.logoUrl} alt="MSS Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Heart className="w-8 h-8" />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 hidden sm:block uppercase">Manav Samanta Sangthan</span>
              <span className="text-2xl font-black tracking-tight text-slate-900 sm:hidden uppercase">MSS</span>
              <span className="text-sm font-bold text-emerald-600 hidden sm:block mt-0.5 tracking-wide">"पहले इंसान, फिर धर्म"</span>
            </div>
          </Link>
          
          <div className="flex items-center gap-5">                
            <Link to="/donate" className="hidden sm:flex px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-bold transition-all shadow-sm items-center gap-2 hover:-translate-y-0.5"> 
              <Heart className="w-4 h-4 fill-white" /> Donate 
            </Link>
            {user && (
              <div className="flex items-center gap-4 border-l border-slate-300 pl-5">
                <Link to="/dashboard" className="flex items-center gap-3 text-sm font-bold text-slate-700 hover:text-emerald-600 transition-colors group">
                  {userData?.photoUrl ? (
                    <img src={userData.photoUrl} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm group-hover:border-emerald-500 transition-colors" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 group-hover:border-emerald-500 group-hover:text-emerald-600 transition-colors">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <span className="hidden lg:block">{userData?.name || 'Account'}</span>
                </Link>
                <button onClick={logOut} className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-rose-600 transition-colors p-2 rounded-lg hover:bg-slate-50" title="Sign Out">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Professional Navigation Menu Bar */}
        <div className="w-full hidden md:block relative z-10 border-t border-slate-200/50">
          <nav className="w-full max-w-7xl mx-auto px-6 flex items-center justify-center gap-1 overflow-x-auto hide-scrollbar">
            {[
              { name: 'HOME', path: '/' },
              { name: 'PURPOSE', path: '/about' },
              { name: 'RULES', path: '/policies' },
              { name: 'WORKS', path: '/activities' },
              { name: 'MEMBERS', path: '/members' },
              { name: 'OFFICERS', path: '/officers' },
              { name: 'SOCIAL', path: '/gallery' },
              { name: 'CONTACT', path: '/contact' }
            ].map(item => {
               const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
               return (
                 <Link 
                   key={item.name}
                   to={item.path} 
                   className={"px-5 py-3 text-[13px] font-bold tracking-widest uppercase transition-all border-b-2 " + 
                     (isActive ? "text-emerald-700 border-emerald-600" : "text-slate-600 border-transparent hover:text-emerald-600 hover:border-emerald-200")}
                 >
                   {item.name}
                 </Link>
               );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 mt-auto border-t border-slate-800">
        <div className="w-full mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12 border-b border-slate-800 pb-12">
            
            {/* COLUMN 1 - ORGANIZATION */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="MSS Logo" className="w-12 h-12 object-contain flex-shrink-0 drop-shadow-sm" />
                ) : (
                  <Heart className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">मानव समानता संगठन</h3>
                  <h3 className="text-sm font-bold text-white tracking-tight">Manav Samanta Sangthan</h3>
                  <p className="text-amber-400 text-sm italic mt-1 font-medium">"पहले इंसान, फिर धर्म"</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Dedicated to creating a more equitable, inclusive, and sensitive society through targeted social work and community development.
              </p>
              <div className="space-y-1">
                <p className="text-xs text-white font-medium">Founder & CEO:</p>
                <p className="text-sm text-emerald-400 font-bold">Gulfam Siddique</p>
              </div>
            </div>

            {/* COLUMN 2 - QUICK LINKS */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Quick Links</h4>
              <ul className="space-y-2.5">
                <li><Link to="/" className="text-xs hover:text-emerald-400 transition-colors">Home</Link></li>
                <li><Link to="/about" className="text-xs hover:text-emerald-400 transition-colors">About Us</Link></li>
                <li><Link to="/activities" className="text-xs hover:text-emerald-400 transition-colors">Our Work / Activities</Link></li>
                <li><Link to="/projects" className="text-xs hover:text-emerald-400 transition-colors">Projects</Link></li>
                <li><Link to="/campaigns" className="text-xs hover:text-emerald-400 transition-colors">Campaigns</Link></li>
                <li><Link to="/events" className="text-xs hover:text-emerald-400 transition-colors">Events</Link></li>
                <li><Link to="/gallery" className="text-xs hover:text-emerald-400 transition-colors">Gallery</Link></li>
                <li><Link to="/news" className="text-xs hover:text-emerald-400 transition-colors">News & Updates</Link></li>
                <li><Link to="/officers" className="text-xs hover:text-emerald-400 transition-colors">Our Team</Link></li>
                <li><Link to="/join" className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors">Join Us</Link></li>
                <li><Link to="/login" className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors">Login</Link></li>
                <li><Link to="/donate" className="text-xs hover:text-emerald-400 transition-colors">Donate</Link></li>
                <li><Link to="/contact" className="text-xs hover:text-emerald-400 transition-colors">Contact Us</Link></li>
                
                {/* Dynamic Custom Menus */}
                {settings.customMenus?.map((menu: any, index: number) => (
                  <li key={`custom-menu-${index}`}>
                    <a href={menu.url} target="_blank" rel="noopener noreferrer" className="text-xs hover:text-emerald-400 transition-colors text-amber-400 font-medium">
                      {menu.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* COLUMN 3 - GET INVOLVED */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Get Involved</h4>
              <ul className="space-y-2.5">
                <li><Link to="/join" className="text-xs hover:text-emerald-400 transition-colors">Become a Member</Link></li>
                <li><Link to="/volunteer" className="text-xs hover:text-emerald-400 transition-colors">Volunteer with Us</Link></li>
                <li><Link to="/partner" className="text-xs hover:text-emerald-400 transition-colors">Partner with Us</Link></li>
                <li><Link to="/careers" className="text-xs hover:text-emerald-400 transition-colors">Careers</Link></li>
              </ul>
            </div>

            {/* COLUMN 4 - RESOURCES */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Resources</h4>
              <ul className="space-y-2.5">
                <li><Link to="/annual-reports" className="text-xs hover:text-emerald-400 transition-colors">Annual Reports</Link></li>
                <li><Link to="/financials" className="text-xs hover:text-emerald-400 transition-colors">Financials & 80G</Link></li>
                <li><Link to="/press" className="text-xs hover:text-emerald-400 transition-colors">Press Kit</Link></li>
                <li><Link to="/blog" className="text-xs hover:text-emerald-400 transition-colors">Organization Blog</Link></li>
                <li><Link to="/policy/privacy" className="text-xs hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/policy/cookie" className="text-xs hover:text-emerald-400 transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* COLUMN 5 - CONTACT US & SOCIAL */}
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide text-sm uppercase">Contact Us</h4>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Email:</p>
                  <a href={`mailto:${settings.email || 'manavsamantasangthan@gmail.com'}`} className="text-sm font-medium text-emerald-400 hover:text-emerald-300 break-all transition-colors">
                    {settings.email || 'manavsamantasangthan@gmail.com'}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Phone:</p>
                  <p className="text-sm text-slate-300">{settings.phone || '[+91 0000000000]'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Office Address:</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">
                    {settings.address || '[Office Street Address]\n[City], [State]\nPIN: [000000]'}
                  </p>
                </div>
                <div className="pt-2">
                  <Link to="/contact" className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors border border-slate-700">
                    Email Us
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* SOCIAL ICONS */}
          <div className="flex justify-center gap-4 mb-8">
            {settings.socialLinks?.facebook && (
              <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all" title="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg>
              </a>
            )}
            {settings.socialLinks?.instagram && (
              <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all" title="Instagram">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            )}
            {settings.socialLinks?.youtube && (
              <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all" title="YouTube">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
            )}
            {settings.socialLinks?.twitter && (
              <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all" title="X/Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"></path></svg>
              </a>
            )}
            {settings.socialLinks?.whatsapp && (
              <a href={settings.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all" title="WhatsApp">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path></svg>
              </a>
            )}
            {settings.socialLinks?.telegram && (
              <a href={settings.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-emerald-600 hover:text-white transition-all" title="Telegram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12zM5.882 11.23l12.433-4.789c.578-.216 1.087.142.89 1.054l-2.115 9.948c-.167.755-.615.938-1.243.585l-3.438-2.535-1.66 1.597c-.184.184-.338.338-.694.338l.247-3.506 6.38-5.76c.277-.247-.061-.384-.43-.138l-7.886 4.966-3.399-1.06c-.738-.23-7.53-.23-1.642-1.077z"></path></svg>
              </a>
            )}
            {(!settings.socialLinks || (!settings.socialLinks.facebook && !settings.socialLinks.instagram && !settings.socialLinks.youtube && !settings.socialLinks.twitter && !settings.socialLinks.whatsapp && !settings.socialLinks.telegram)) && (
              <div className="text-sm text-slate-500 italic">No social links configured</div>
            )}
          </div>

          {/* BOTTOM POLICY LINKS */}
          <div className="border-t border-slate-800 pt-8 mb-8">
            <h4 className="text-white font-bold mb-4 tracking-wide text-sm uppercase text-center">Legal & Policies</h4>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-3 text-xs font-medium text-slate-400 text-center px-4 max-w-5xl mx-auto">
              <Link to="/policy/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/terms" className="hover:text-emerald-400 transition-colors">Terms & Conditions</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/user-agreement" className="hover:text-emerald-400 transition-colors">User Agreement</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/rules" className="hover:text-emerald-400 transition-colors">Rules & Regulations</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/membership" className="hover:text-emerald-400 transition-colors">Membership Rules</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/code-of-conduct" className="hover:text-emerald-400 transition-colors">Code of Conduct</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/officer-conduct" className="hover:text-emerald-400 transition-colors">Officer Code of Conduct</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/volunteer" className="hover:text-emerald-400 transition-colors">Volunteer Guidelines</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/safety" className="hover:text-emerald-400 transition-colors">Safety Guidelines</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/donation" className="hover:text-emerald-400 transition-colors">Donation Policy</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/refund" className="hover:text-emerald-400 transition-colors">Refund & Cancellation</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/grievance" className="hover:text-emerald-400 transition-colors">Grievance Policy</Link>
              <span className="hidden md:inline text-slate-700">|</span>
              <Link to="/policy/disclaimer" className="hover:text-emerald-400 transition-colors">Disclaimer</Link>
            </div>
          </div>

          {/* COPYRIGHT BAR */}
          <div className="text-center text-xs text-slate-500 border-t border-slate-800 pt-8 pb-4">
            <p className="mb-2">© {new Date().getFullYear()} Manav Samanta Sangthan. All Rights Reserved.</p>
            <p>Founder & CEO: Gulfam Siddique</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
