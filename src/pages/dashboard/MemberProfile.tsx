import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { User, Shield, MapPin, Mail, Phone, Calendar, Download, Camera } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { format } from 'date-fns';
import { compressImage } from '../../utils/imageUtils';

export default function MemberProfile() {
  const { userData, user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone: userData?.phone || '',
    address: userData?.address || '',
    isPublic: userData?.isPublic || false
  });
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!userData) return null;

  const isOfficer = userData.role === 'officer' || userData.role === 'admin';
  const roleDisplay = userData.role === 'admin' ? 'Administrator' : userData.role === 'officer' ? (userData.designation || 'Officer') : 'Member';
  
  // Base URL for QR code verification
  const verificationUrl = `${window.location.origin}/verify/${userData.memberId}`;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        phone: formData.phone,
        address: formData.address,
        isPublic: formData.isPublic
      });
      alert("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile", error);
      alert("Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file');
      return;
    }

    setUploadingPhoto(true);
    try {
      const compressedBase64 = await compressImage(file, 400); // 400px max size
      await updateDoc(doc(db, 'users', user.uid), {
        photoUrl: compressedBase64
      });
      alert("Profile photo updated successfully!");
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Error uploading photo. Please try a smaller image.");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center no-print">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Personal Details</h3>
          {isEditing ? (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 text-sm text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button onClick={() => setIsEditing(true)} className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Edit Details</button>
          )}
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-8 items-start mb-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-slate-100 overflow-hidden border-2 border-emerald-100 flex items-center justify-center shrink-0">
                {userData.photoUrl ? (
                  <img src={userData.photoUrl} alt={userData.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all"
                title="Update Photo"
              >
                {uploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div>
              <h4 className="text-xl font-bold text-slate-900">{userData.name}</h4>
              <p className="text-emerald-600 font-medium mb-1">{userData.role === 'user' ? 'Registered User' : roleDisplay}</p>
              {userData.memberId && <p className="text-sm text-slate-500 font-mono">ID: {userData.memberId}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
              <p className="font-medium text-slate-900 py-2">{userData.name}</p>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <p className="font-medium text-slate-900 py-2 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> {userData.email}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              ) : (
                <p className="font-medium text-slate-900 py-2 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {userData.phone || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location / Address</label>
              {isEditing ? (
                <input 
                  type="text" 
                  value={formData.address} 
                  onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              ) : (
                <p className="font-medium text-slate-900 py-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {userData.address || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
