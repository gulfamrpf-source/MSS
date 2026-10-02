import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Settings, Save, Loader2, Upload, Plus, Trash2, CheckCircle2, AlertTriangle, FileText, Phone, Send, BookOpen, ExternalLink, Download } from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';
import { uploadImage, defaultFounderData } from '../../firebase-utils';
import { Link } from 'react-router-dom';

export default function AdminSettings() {
  const [settings, setSettings] = useState<any>({
    socialLinks: { facebook: '', twitter: '', instagram: '', youtube: '' },
    customMenus: []
  });
  const [homeContent, setHomeContent] = useState({
    heroTitle: "Small Act,\nBig Change",
    heroSubtitle: "\"पहले इंसान, फिर धर्म\"",
    heroDescription: "Your kindness today can create a better tomorrow for someone in need. Join our mission for equality and welfare."
  });
  const [founderProfile, setFounderProfile] = useState(defaultFounderData);
  const [uploadingFounderPhoto, setUploadingFounderPhoto] = useState(false);
  const [uploadingHeroBg, setUploadingHeroBg] = useState(false);
  const [uploadingMidBg, setUploadingMidBg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHeaderBg, setUploadingHeaderBg] = useState(false);
  
  // Letterhead & SMS Gateway State
  const [letterheadSettings, setLetterheadSettings] = useState<any>({ letterheadUrl: null, active: true });
  const [uploadingLetterhead, setUploadingLetterhead] = useState(false);
  const [smsConfig, setSmsConfig] = useState<any>({ configured: false, provider: 'FAST2SMS', senderId: 'MSSNGO', maskedApiKey: '' });
  const [smsProvider, setSmsProvider] = useState('FAST2SMS');
  const [smsApiKey, setSmsApiKey] = useState('');
  const [smsSenderId, setSmsSenderId] = useState('MSSNGO');
  const [savingSms, setSavingSms] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testingSms, setTestingSms] = useState(false);
  const [testSmsStatus, setTestSmsStatus] = useState<any>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({
            ...data,
            socialLinks: data.socialLinks || { facebook: '', twitter: '', instagram: '', youtube: '' },
            customMenus: data.customMenus || []
          });
        }
        
        const homeSnap = await getDoc(doc(db, 'settings', 'homePage'));
        if (homeSnap.exists()) {
          setHomeContent(homeSnap.data() as any);
        }
        
        const founderSnap = await getDoc(doc(db, 'profiles', 'founder'));
        if (founderSnap.exists()) {
          const data = founderSnap.data() as any;
          setFounderProfile({
            ...defaultFounderData,
            ...data,
            name: data.name && data.name !== 'Founder Name' ? data.name : defaultFounderData.name,
            message: data.message ? data.message : defaultFounderData.message,
            biography: data.biography ? data.biography : defaultFounderData.biography,
            designation: data.designation ? data.designation : defaultFounderData.designation
          });
        }

        // Fetch letterhead
        const lhSnap = await getDoc(doc(db, 'settings', 'letterhead'));
        if (lhSnap.exists()) {
          setLetterheadSettings(lhSnap.data());
        }

        // Fetch SMS config status from server
        try {
          const smsRes = await fetch('/api/admin/config/sms');
          const smsData = await smsRes.json();
          setSmsConfig(smsData);
          if (smsData.provider) setSmsProvider(smsData.provider);
          if (smsData.senderId) setSmsSenderId(smsData.senderId);
        } catch (e) {
          console.warn("Could not check SMS config:", e);
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
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({
      ...settings,
      socialLinks: { ...settings.socialLinks, [e.target.name]: e.target.value }
    });
  };

  const addCustomMenu = () => {
    setSettings({
      ...settings,
      customMenus: [...settings.customMenus, { label: '', url: '' }]
    });
  };

  const removeCustomMenu = (index: number) => {
    const updatedMenus = settings.customMenus.filter((_: any, i: number) => i !== index);
    setSettings({ ...settings, customMenus: updatedMenus });
  };

  const handleMenuChange = (index: number, field: 'label' | 'url', value: string) => {
    const updatedMenus = [...settings.customMenus];
    updatedMenus[index][field] = value;
    setSettings({ ...settings, customMenus: updatedMenus });
  };

  
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    setUploadingLogo(true);
    try {
      const compressedBase64 = await compressImage(file, 400);
      setSettings((prev: any) => ({ ...prev, logoUrl: compressedBase64 }));
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert('Error uploading logo.');
    } finally {
      setUploadingLogo(false);
    }
  };



  const handleHeaderBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploadingHeaderBg(true);
    try {
      const compressedBase64 = await compressImage(file, 1200, 'image/jpeg', 0.6);
      setSettings((prev: any) => ({ ...prev, headerBgUrl: compressedBase64 }));
    } catch (error) {
      console.error("Error uploading header bg:", error);
      alert('Error uploading header background.');
    } finally {
      setUploadingHeaderBg(false);
    }
  };

  const handleHomeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setHomeContent(prev => ({ ...prev, [name]: value }));
  };

  const handleFounderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFounderProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleHeroBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    setUploadingHeroBg(true);
    try {
      const compressedBase64 = await compressImage(file, 1200, 'image/jpeg', 0.6);
      setHomeContent(prev => ({ ...prev, heroBackgroundImage: compressedBase64 }));
    } catch (error) {
      console.error("Error compressing hero background", error);
      alert('Error uploading background.');
    } finally {
      setUploadingHeroBg(false);
    }
  };

  
  const handleMidBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    
    setUploadingMidBg(true);
    try {
      const compressedBase64 = await compressImage(file, 1600, 'image/jpeg', 0.7);
      setHomeContent(prev => ({ ...prev, midSectionBgImage: compressedBase64 }));
    } catch (error) {
      console.error("Error compressing mid bg", error);
      alert('Error uploading background.');
    } finally {
      setUploadingMidBg(false);
    }
  };

  const handleFounderPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    setUploadingFounderPhoto(true);
    try {
      const compressedBase64 = await compressImage(file, 400);
      setFounderProfile(prev => ({ ...prev, photoUrl: compressedBase64 }));
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert('Error uploading photo.');
    } finally {
      setUploadingFounderPhoto(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });
      await setDoc(doc(db, 'settings', 'homePage'), homeContent, { merge: true });
      await setDoc(doc(db, 'profiles', 'founder'), founderProfile, { merge: true });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings", error);
      alert("Error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            System Settings
          </h1>
          <p className="text-slate-500 mt-1">Manage global website information, contact details, social links, and menus.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving || uploadingLogo}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Brand & Logo */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Website Logo</h2>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">No Logo</span>
              )}
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors w-max text-sm font-medium">
                {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingLogo ? 'Uploading...' : 'Upload New Logo'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        

        {/* Header Background */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Header Background Image</h2>
          <div className="flex items-start gap-6">
            <div className="w-48 h-20 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 relative">
              {settings.headerBgUrl ? (
                <>
                  <img src={settings.headerBgUrl} alt="Header BG" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setSettings((prev: any) => ({ ...prev, headerBgUrl: '' }))}
                    className="absolute top-1 right-1 bg-white/80 p-1 rounded-md text-rose-500 hover:text-rose-600 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <span className="text-slate-400 text-sm">No BG Image</span>
              )}
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors w-max text-sm font-medium">
                {uploadingHeaderBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingHeaderBg ? 'Uploading...' : 'Upload Header Background'}
                <input type="file" accept="image/*" onChange={handleHeaderBgUpload} className="hidden" />
              </label>
              <p className="text-xs text-slate-500 mt-2">Upload a background image for the top header. (Recommended ratio 16:9 or ultra-wide, max 1MB).</p>
            </div>
          </div>
        </div>

        {/* Scrolling Notification */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Scrolling Notification (Marquee)</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notification Text</label>
            <textarea name="notificationText" value={settings.notificationText || ''} onChange={handleChange} placeholder="Enter the text to display in the red scrolling ticker..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[80px]"></textarea>
            <p className="text-xs text-slate-500 mt-1">Leave empty to hide the notification ticker.</p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Organization & Contact Info</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
            <input type="text" name="registrationNumber" value={settings.registrationNumber || ''} onChange={handleChange} placeholder="e.g. REG-12345/2026" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Official Email</label>
            <input type="email" name="email" value={settings.email || ''} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
            <input type="text" name="phone" value={settings.phone || ''} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Office Address</label>
            <textarea name="address" value={settings.address || ''} onChange={handleChange} rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Social Media Links</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Facebook URL</label>
            <input type="url" name="facebook" value={settings.socialLinks?.facebook || ''} onChange={handleSocialChange} placeholder="https://facebook.com/..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Twitter (X) URL</label>
            <input type="url" name="twitter" value={settings.socialLinks?.twitter || ''} onChange={handleSocialChange} placeholder="https://twitter.com/..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Instagram URL</label>
            <input type="url" name="instagram" value={settings.socialLinks?.instagram || ''} onChange={handleSocialChange} placeholder="https://instagram.com/..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">YouTube URL</label>
            <input type="url" name="youtube" value={settings.socialLinks?.youtube || ''} onChange={handleSocialChange} placeholder="https://youtube.com/..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp URL</label>
            <input type="url" name="whatsapp" value={settings.socialLinks?.whatsapp || ''} onChange={handleSocialChange} placeholder="https://wa.me/..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telegram URL</label>
            <input type="url" name="telegram" value={settings.socialLinks?.telegram || ''} onChange={handleSocialChange} placeholder="https://t.me/..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>

        
      {/* Home Page Content Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Website Home Page Text</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Main Heading (Hero Title)</label>
          <textarea name="heroTitle" value={homeContent.heroTitle || ''} onChange={handleHomeChange} rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Small Act,\nBig Change" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Sub Heading (Slogan)</label>
          <input type="text" name="heroSubtitle" value={homeContent.heroSubtitle || ''} onChange={handleHomeChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="पहले इंसान, फिर धर्म" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Short Description</label>
          <textarea name="heroDescription" value={homeContent.heroDescription || ''} onChange={handleHomeChange} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
        </div>
        
        {/* Hero Background Image */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">Hero Background Image</label>
          <div className="flex items-center gap-6">
            <div className="w-32 h-20 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 border border-slate-200">
              {(homeContent as any).heroBackgroundImage ? (
                <img src={(homeContent as any).heroBackgroundImage} alt="Hero BG" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">No Image</span>
              )}
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer transition-colors w-max text-sm font-medium border border-emerald-200">
                {uploadingHeroBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingHeroBg ? 'Uploading...' : 'Upload Background Image'}
                <input type="file" accept="image/*" onChange={handleHeroBgUpload} className="hidden" />
              </label>
              <p className="text-xs text-slate-500 mt-2">Recommended: High resolution, landscape image (e.g. 1920x1080).</p>
            </div>
          </div>
        </div>
      </div>

      
        {/* Mid Section Background Image */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Middle Section Full-Width Image</h2>
          <div className="flex items-start gap-6">
            <div className="w-64 h-32 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 relative">
              {(homeContent as any).midSectionBgImage ? (
                <>
                  <img src={(homeContent as any).midSectionBgImage} alt="Mid BG" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setHomeContent(prev => ({ ...prev, midSectionBgImage: '' }))}
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-md text-rose-500 hover:text-rose-600 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <span className="text-slate-400 text-sm">No Image</span>
              )}
            </div>
            <div className="flex-1">
              <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer transition-colors w-max text-sm font-medium border border-emerald-200">
                {uploadingMidBg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingMidBg ? 'Uploading...' : 'Upload Middle Banner Image'}
                <input type="file" accept="image/*" onChange={handleMidBgUpload} className="hidden" />
              </label>
              <p className="text-xs text-slate-500 mt-2">This image will be displayed full-width above the "Where Your Support Goes" section.</p>
            </div>
          </div>
        </div>

      {/* Founder / CEO Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Founder & CEO Profile</h2>
        
        <div className="flex items-center gap-6 mb-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 border border-slate-200">
            {founderProfile.photoUrl ? (
              <img src={founderProfile.photoUrl} alt="Founder" className="w-full h-full object-cover object-top" />
            ) : (
              <span className="text-xs text-slate-400">No Photo</span>
            )}
          </div>
          <div className="flex-1">
            <label className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg cursor-pointer transition-colors w-max text-sm font-medium border border-emerald-200">
              {uploadingFounderPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingFounderPhoto ? 'Uploading...' : 'Upload CEO Photo'}
              <input type="file" accept="image/*" onChange={handleFounderPhotoUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" name="name" value={founderProfile.name || ''} onChange={handleFounderChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Designation / Title</label>
            <input type="text" name="designation" value={founderProfile.designation || ''} onChange={handleFounderChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">CEO Message</label>
          <textarea name="message" value={founderProfile.message || ''} onChange={handleFounderChange} rows={6} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" placeholder="Type the CEO message here..." />
        </div>
      </div>

        

      {/* Payment Gateway Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Payment Gateway (Razorpay)</h2>
        <p className="text-sm text-slate-500 mb-4">
          Enter your Razorpay Key ID and Key Secret to enable online donations. These will be securely stored on the server.
        </p>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Razorpay Key ID</label>
            <input 
              type="text" 
              id="rzp_key_id"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" 
              placeholder="Enter your Test Key ID" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Razorpay Key Secret</label>
            <input 
              type="password" 
              id="rzp_key_secret"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500" 
              placeholder="Your Secret Key..." 
            />
          </div>
        </div>
        <div className="pt-2">
          <button 
            type="button"
            onClick={async (e) => {
              const btn = e.currentTarget;
              btn.disabled = true;
              btn.innerText = "Saving...";
              
              const keyId = (document.getElementById('rzp_key_id') as HTMLInputElement).value;
              const keySecret = (document.getElementById('rzp_key_secret') as HTMLInputElement).value;
              
              if (!keyId || !keySecret) {
                alert("Please enter both Key ID and Secret");
                btn.disabled = false;
                btn.innerText = "Save Payment Settings";
                return;
              }
              
              try {
                const res = await fetch('/api/admin/config/razorpay', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ keyId, keySecret })
                });
                
                if (res.ok) {
                  alert("Payment Gateway Keys Saved Successfully!");
                  (document.getElementById('rzp_key_id') as HTMLInputElement).value = "";
                  (document.getElementById('rzp_key_secret') as HTMLInputElement).value = "";
                } else {
                  alert("Failed to save keys.");
                }
              } catch (err) {
                alert("Error connecting to server.");
              }
              btn.disabled = false;
              btn.innerText = "Save Payment Settings";
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium text-sm"
          >
            Save Payment Settings
          </button>
        </div>
      </div>

      {/* Dynamic Navigation Menus */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <h2 className="text-lg font-bold text-slate-800">Custom Navigation Menus</h2>
            <button onClick={addCustomMenu} className="p-1 hover:bg-slate-100 rounded-md text-emerald-600 transition-colors">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500">Add external links or custom page URLs to your website's header/footer.</p>
          
          <div className="space-y-3 mt-4">
            {settings.customMenus?.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No custom menus added yet.</p>
            )}
            {settings.customMenus?.map((menu: any, index: number) => (
              <div key={index} className="flex items-start gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    placeholder="Menu Name (e.g. Google Form)" 
                    value={menu.label} 
                    onChange={(e) => handleMenuChange(index, 'label', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500"
                  />
                  <input 
                    type="url" 
                    placeholder="URL Link (e.g. https://forms.google.com/...)" 
                    value={menu.url} 
                    onChange={(e) => handleMenuChange(index, 'url', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button onClick={() => removeCustomMenu(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md mt-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Official Letterhead Management Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Official Letterhead Management</h2>
              <p className="text-xs text-slate-500 mt-0.5">Upload, preview, and manage the official letterhead background for all officer appointment letters.</p>
            </div>
            {letterheadSettings.letterheadUrl ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Custom Letterhead Active
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                Default MSS Letterhead Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Upload Letterhead (PNG, JPG, or PDF)</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  disabled={uploadingLetterhead}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingLetterhead(true);
                    try {
                      let finalBase64 = '';
                      if (file.type.startsWith('image/')) {
                        finalBase64 = await compressImage(file, 1600, "image/png", 0.92);
                      } else {
                        finalBase64 = await new Promise((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(reader.result as string);
                          reader.onerror = reject;
                          reader.readAsDataURL(file);
                        });
                      }

                      const updatedData = {
                        letterheadUrl: finalBase64,
                        uploadedAt: new Date().toISOString(),
                        fileName: file.name,
                        fileSize: file.size,
                        active: true,
                        updatedAt: new Date().toISOString()
                      };

                      await setDoc(doc(db, 'settings', 'letterhead'), updatedData, { merge: true });
                      setLetterheadSettings(updatedData);
                      alert('Letterhead updated successfully! All future appointment letters will use this background.');
                    } catch (err: any) {
                      alert('Error uploading letterhead: ' + err.message);
                    } finally {
                      setUploadingLetterhead(false);
                    }
                  }}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2.5 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-emerald-50 file:text-emerald-700
                    hover:file:bg-emerald-100
                    cursor-pointer border border-slate-200 rounded-xl p-1"
                />
                {uploadingLetterhead && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                This letterhead template will be used for generating official, print-ready appointment letters.
              </p>
              {letterheadSettings.letterheadUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm("Reset to default MSS official letterhead?")) return;
                    await updateDoc(doc(db, 'settings', 'letterhead'), { letterheadUrl: null, active: false });
                    setLetterheadSettings((prev: any) => ({ ...prev, letterheadUrl: null, active: false }));
                    alert("Reset to default MSS letterhead.");
                  }}
                  className="mt-3 text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Custom Letterhead & Use Default
                </button>
              )}
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
              <span className="text-xs font-semibold text-slate-500 block mb-2">Letterhead Preview</span>
              {letterheadSettings.letterheadUrl ? (
                <img
                  src={letterheadSettings.letterheadUrl}
                  alt="Letterhead Preview"
                  className="w-full max-h-48 object-contain rounded-lg border border-slate-300 mx-auto"
                />
              ) : (
                <div className="py-8 text-center text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-1 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">Default Built-in MSS Letterhead</p>
                  <p className="text-[11px] text-slate-400">Includes MSS Golden & Emerald Banner, Reg. No., Motto & Logo</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Memorandum of Association Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Memorandum of Association & Rules (स्मृति-पत्र एवं विधान)</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload your signed official PDF so members, officers, and public can read and download it anytime.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/dashboard/memorandum"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" /> Manage / Upload PDF
              </Link>
              <Link
                to="/memorandum"
                target="_blank"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Public View
              </Link>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <p className="font-semibold text-slate-800">Public Document Link:</p>
              <code className="text-emerald-700 font-mono">/memorandum</code>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Displays the embedded PDF reader, download buttons, and constitutional summary.
              </p>
            </div>
            <Link
              to="/dashboard/memorandum"
              className="px-4 py-2 bg-white text-emerald-800 border border-emerald-300 rounded-lg font-bold text-xs hover:bg-emerald-50 transition-colors shadow-2xs"
            >
              Open Memorandum Manager →
            </Link>
          </div>
        </div>

        {/* SMS Gateway Configuration Section */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Mobile SMS Gateway Configuration</h2>
              <p className="text-xs text-slate-500 mt-0.5">Automate live SMS appointment notifications whenever an officer is nominated.</p>
            </div>
            {smsConfig.configured ? (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Gateway ({smsConfig.provider})
              </span>
            ) : (
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Setup Required
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Provider</label>
                <select
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="FAST2SMS">Fast2SMS (Recommended for India - Quick/Instant Route)</option>
                  <option value="TWILIO">Twilio</option>
                  <option value="CUSTOM_WEBHOOK">Custom HTTP Webhook / MSG91</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  API Key / Authorization Token
                </label>
                <input
                  type="password"
                  placeholder={smsConfig.maskedApiKey ? `Current: ${smsConfig.maskedApiKey} (Leave blank to keep)` : "Enter Fast2SMS API Key"}
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Keys are stored safely on the server and never exposed in client bundles.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Sender Brand ID</label>
                <input
                  type="text"
                  placeholder="e.g. MSSNGO"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                disabled={savingSms}
                onClick={async () => {
                  setSavingSms(true);
                  try {
                    const res = await fetch('/api/admin/config/sms', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        provider: smsProvider,
                        apiKey: smsApiKey,
                        senderId: smsSenderId
                      })
                    });
                    const d = await res.json();
                    if (d.success) {
                      alert('SMS Gateway configuration saved!');
                      setSmsConfig((prev: any) => ({
                        ...prev,
                        configured: true,
                        provider: smsProvider,
                        senderId: smsSenderId,
                        maskedApiKey: smsApiKey ? '••••••••' + smsApiKey.slice(-4) : prev.maskedApiKey
                      }));
                      setSmsApiKey('');
                    } else {
                      alert(d.error || 'Failed to save SMS config');
                    }
                  } catch (err: any) {
                    alert('Error saving SMS config: ' + err.message);
                  } finally {
                    setSavingSms(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {savingSms ? 'Saving Gateway...' : 'Save SMS Gateway Settings'}
              </button>
            </div>

            {/* Test Connection Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Test SMS Gateway Connectivity</h4>
              <p className="text-xs text-slate-500">Send an instant test notification to verify your credentials with the telecom gateway.</p>
              
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="10-digit phone number"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  disabled={testingSms || !testPhone}
                  onClick={async () => {
                    setTestingSms(true);
                    setTestSmsStatus(null);
                    try {
                      const res = await fetch('/api/test-sms', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ to: testPhone })
                      });
                      const d = await res.json();
                      setTestSmsStatus(d);
                    } catch (err: any) {
                      setTestSmsStatus({ success: false, error: err.message });
                    } finally {
                      setTestingSms(false);
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {testingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Test
                </button>
              </div>

              {testSmsStatus && (
                <div className={`p-3 rounded-lg text-xs ${testSmsStatus.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  <strong>{testSmsStatus.success ? '✓ Delivery Successful:' : '✗ Delivery Failed:'}</strong> {testSmsStatus.message || testSmsStatus.error}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
