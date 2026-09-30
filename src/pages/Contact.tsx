import React, { useState, useEffect } from 'react';
import { Mail, MapPin, Phone, Loader2, Send, Globe } from 'lucide-react';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';


const Facebook = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
const Twitter = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>;
const Instagram = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
const Youtube = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>;
const Linkedin = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>;

export default function Contact() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching settings", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...formData,
        createdAt: new Date().toISOString(),
        status: 'unread'
      });
      setSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error("Error sending message", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-12 h-12 animate-spin text-emerald-600" /></div>;
  }

  const socialLinks = [
    { icon: Facebook, url: settings.facebook, name: 'Facebook', color: 'hover:bg-blue-600' },
    { icon: Twitter, url: settings.twitter, name: 'Twitter (X)', color: 'hover:bg-slate-900' },
    { icon: Instagram, url: settings.instagram, name: 'Instagram', color: 'hover:bg-pink-600' },
    { icon: Youtube, url: settings.youtube, name: 'YouTube', color: 'hover:bg-red-600' },
    { icon: Linkedin, url: settings.linkedin, name: 'LinkedIn', color: 'hover:bg-blue-700' }
  ].filter(link => link.url && link.url.trim() !== '');

  return (
    <div className="w-full bg-slate-50 min-h-screen pb-24">
      {/* Hero Section */}
      <section className="relative py-24 bg-indigo-900 overflow-hidden">
        <div className="absolute inset-0 opacity-15">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="contact-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M30 10 L50 30 L30 50 L10 30 Z" fill="none" stroke="currentColor" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contact-pattern)" />
          </svg>
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-950/90"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 text-center">
          <div className="w-20 h-20 mx-auto bg-indigo-800 rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-indigo-700/50">
            <Globe className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Contact & Connect</h1>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto font-medium leading-relaxed">
            Have questions about Manav Samanta Sangthan's work? Want to collaborate or need help? We're just a message away.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-10">
        
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center hover:-translate-y-2 transition-transform duration-300 group">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Email Us</h3>
            <a href={`mailto:${settings.email || 'manavsamantasangthan@gmail.com'}`} className="text-emerald-600 hover:text-emerald-700 font-medium break-all">
              {settings.email || 'manavsamantasangthan@gmail.com'}
            </a>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center hover:-translate-y-2 transition-transform duration-300 group">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Call Us</h3>
            <p className="text-slate-600 font-medium whitespace-pre-wrap">
              {settings.phone || 'Phone number not added yet.'}
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 text-center hover:-translate-y-2 transition-transform duration-300 group">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Visit Us</h3>
            <p className="text-slate-600 font-medium whitespace-pre-wrap">
              {settings.address || 'Address not added yet.'}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Message Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-10 border-b border-slate-100 bg-slate-50">
              <h2 className="text-3xl font-bold text-slate-900">Send us a Message</h2>
              <p className="text-slate-500 mt-2">Fill out the form below and we will get back to you as soon as possible.</p>
            </div>
            
            <div className="p-10">
              {sent ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-8 rounded-2xl text-center">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Send className="w-10 h-10" />
                  </div>
                  <h3 className="font-bold text-2xl mb-3">Message Sent Successfully!</h3>
                  <p className="text-lg">Thank you for reaching out. Our team will review your message.</p>
                  <button onClick={() => setSent(false)} className="mt-8 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="John Doe" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="john@example.com" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                      <input type="text" name="subject" value={formData.subject} onChange={handleChange} required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium" placeholder="How can we help you?" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-slate-700 mb-2">Message</label>
                      <textarea required name="message" value={formData.message} onChange={handleChange} rows={6} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium resize-none" placeholder="Write your message here..."></textarea>
                    </div>
                  </div>
                  <div className="pt-4">
                    <button disabled={sending} type="submit" className="w-full md:w-auto px-10 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Social Links Side */}
          <div className="lg:col-span-4">
            <div className="bg-slate-900 rounded-3xl shadow-xl border border-slate-800 p-10 h-full flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-4">Connect Socially</h3>
              <p className="text-slate-400 mb-10 leading-relaxed">
                Stay updated with our latest campaigns, events, and ground reports. Follow Manav Samanta Sangthan on our official social media channels.
              </p>
              
              <div className="space-y-4 mt-auto">
                {socialLinks.length > 0 ? (
                  socialLinks.map((link, index) => {
                    const Icon = link.icon;
                    return (
                      <a 
                        key={index} 
                        href={link.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className={`flex items-center gap-4 p-4 rounded-2xl bg-slate-800 border border-slate-700 text-white transition-all duration-300 ${link.color} group hover:shadow-lg hover:-translate-y-1`}
                      >
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-lg">{link.name}</span>
                      </a>
                    );
                  })
                ) : (
                  <div className="text-slate-500 italic p-4 bg-slate-800 rounded-xl text-center">
                    Social media links will be updated soon.
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
