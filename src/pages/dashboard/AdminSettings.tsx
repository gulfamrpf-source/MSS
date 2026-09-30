import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Settings, Save, Loader2, Upload, Plus, Trash2 } from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';
import { uploadImage, defaultFounderData } from '../../firebase-utils';

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

      </div>
    </div>
  );
}
