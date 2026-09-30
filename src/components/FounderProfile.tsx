import React, { useState, useEffect } from 'react';
import { Camera, Edit2, Check, Globe, MessageCircle, Mail, Loader2, Upload } from 'lucide-react';
import { getFounderProfile, saveFounderProfile, defaultFounderData, FounderData, uploadImage } from '../firebase-utils';
import { compressImage } from '../utils/imageUtils';

export default function FounderProfile({ isAdmin }: { isAdmin: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<FounderData>(defaultFounderData);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await getFounderProfile();
      setProfile(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await saveFounderProfile(profile);
    setSaving(false);
    setIsEditing(false);
  };

  const handleChange = (field: keyof FounderData, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    // Quick validation
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploadingImage(true);
    try {
      const compressedBase64 = await compressImage(file, 400);
      handleChange('photoUrl', compressedBase64);
    } catch (error) {
      console.error("Error uploading image:", error);
      alert('Error uploading image. Make sure Firebase Storage rules allow uploads.');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-32 flex justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <section className="w-full bg-white py-24 px-6 border-t border-slate-100">
      <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Founder & CEO</h2>
        {isAdmin && (
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={saving || uploadingImage}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full transition-colors text-sm font-medium disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? <><Check className="w-4 h-4" /> Save Profile</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>)}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        {/* Photo Column */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="relative group w-full max-w-[320px] aspect-[4/5] rounded-3xl overflow-hidden bg-slate-100 shadow-xl border border-slate-200/80">
            {profile.photoUrl ? (
              <img 
                src={profile.photoUrl} 
                alt={profile.name} 
                className="w-full h-full object-cover object-top" 
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-300">
                <Camera className="w-12 h-12 text-slate-400" />
              </div>
            )}
            
            {uploadingImage && (
              <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
                <span className="text-emerald-900 font-medium text-sm">Uploading...</span>
              </div>
            )}

            {isEditing && !uploadingImage && (
              <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-4 text-center">
                <Upload className="w-8 h-8 text-white mb-2" />
                <span className="text-white text-sm font-medium">Upload New Photo</span>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          
          <div className="flex gap-4 mt-6">
            <a href={profile.linkedinUrl} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Website/Profile">
              <Globe className="w-5 h-5" />
            </a>
            <a href={profile.twitterUrl} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Social/Updates">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href={`mailto:${profile.email}`} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Email">
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Content Column */}
        <div className="md:col-span-8 space-y-8">
          <div>
            {isEditing ? (
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="text-4xl font-bold text-slate-900 w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <h3 className="text-4xl font-bold text-slate-900 mb-2">{profile.name}</h3>
            )}
            
            {isEditing ? (
              <input 
                type="text" 
                value={profile.designation}
                onChange={(e) => handleChange('designation', e.target.value)}
                className="text-xl text-emerald-600 font-medium w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            ) : (
              <p className="text-xl text-emerald-600 font-medium">{profile.designation} — Manav Samanta Sangthan</p>
            )}
          </div>

          <div className="prose prose-slate prose-lg max-w-none">
            {isEditing ? (
              <textarea 
                value={profile.biography}
                onChange={(e) => handleChange('biography', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Short biography..."
              />
            ) : (
              <blockquote className="border-l-4 border-emerald-500 pl-6 italic text-slate-700 text-xl font-medium leading-relaxed bg-emerald-50/50 py-4 pr-4 rounded-r-xl">
                "{profile.biography}"
              </blockquote>
            )}
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h4 className="text-2xl font-bold text-slate-900 mb-4">Founder's Message</h4>
            {isEditing ? (
              <textarea 
                value={profile.message}
                onChange={(e) => handleChange('message', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 min-h-[160px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Founder's message..."
              />
            ) : (
              <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-line">
                {profile.message}
              </p>
            )}
          </div>
          
          {isEditing && (
            <div className="pt-4 space-y-4 border-t border-slate-100">
              <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Contact & Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Email</label>
                  <input type="text" value={profile.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Website URL</label>
                  <input type="text" value={profile.linkedinUrl} onChange={(e) => handleChange('linkedinUrl', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Social URL</label>
                  <input type="text" value={profile.twitterUrl} onChange={(e) => handleChange('twitterUrl', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </section>
  );
}
