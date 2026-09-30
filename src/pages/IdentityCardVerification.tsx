import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Heart, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function IdentityCardVerification() {
  const { id } = useParams();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function verifyId() {
      if (!id) return;
      // Fetch logo
      getDoc(doc(db, 'settings', 'general')).then(snap => {
        if (snap.exists() && snap.data().logoUrl) {
          setLogoUrl(snap.data().logoUrl);
        }
      });
      try {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setError('Invalid ID. No record found.');
        }
      } catch (err) {
        setError('Error verifying ID.');
      } finally {
        setLoading(false);
      }
    }
    verifyId();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-4" /><p>Verifying credentials...</p></div>;
  }

  const isValid = userData && userData.status === 'active' && (userData.role === 'member' || userData.role === 'officer' || userData.role === 'admin');
  const isOfficer = userData?.role === 'officer' || userData?.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center font-sans">
      <div className="flex flex-col items-center mb-8">
        <Link to="/" className="flex items-center gap-2 mb-1">
          {logoUrl ? (
            <img src={logoUrl} alt="MSS Logo" className="w-10 h-10 object-contain" />
          ) : (
            <Heart className="w-8 h-8 text-emerald-600" />
          )}
          <span className="font-bold text-xl text-slate-900">Manav Samanta Sangthan</span>
        </Link>
        <p className="text-emerald-700 font-medium italic text-sm">"पहले इंसान, फिर धर्म"</p>
      </div>

      <div className="bg-white max-w-md w-full rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        
        {error || !userData ? (
          <div className="p-8 text-center bg-rose-50 border-b border-rose-100">
            <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-rose-700 mb-2">Verification Failed</h2>
            <p className="text-rose-600 font-medium">INVALID / INACTIVE ID</p>
            <p className="text-sm text-rose-500 mt-2">{error || 'This QR code does not match any valid records.'}</p>
          </div>
        ) : !isValid ? (
          <div className="p-8 text-center bg-amber-50 border-b border-amber-100">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-amber-700 mb-2">ID STATUS: INACTIVE</h2>
            <p className="text-amber-600 font-medium uppercase">Current Status: {userData.status}</p>
            <p className="text-sm text-amber-600 mt-2">This ID is not currently active and should not be accepted as valid identification.</p>
          </div>
        ) : (
          <div className="p-8 text-center bg-emerald-50 border-b border-emerald-100">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-700 mb-2">VERIFIED {isOfficer ? 'OFFICER' : 'MEMBER'}</h2>
            <p className="text-emerald-600 font-medium">This ID is active and valid.</p>
          </div>
        )}

        {userData && (
          <div className="p-8">
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-slate-100 rounded-xl border-4 border-white shadow-md overflow-hidden relative -mt-16">
                {userData.photoUrl ? (
                  <img src={userData.photoUrl} alt={userData.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-medium">No Photo</div>
                )}
              </div>
            </div>

            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">{userData.name}</h3>
              <p className="font-medium text-emerald-600">{isOfficer ? userData.designation || 'Officer' : 'Active Member'}</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">{isOfficer ? 'Officer' : 'Member'} ID</span>
                <span className="font-mono font-bold text-slate-900">{isOfficer ? userData.officerId : userData.memberId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Status</span>
                <span className="font-bold text-slate-900 uppercase">{userData.status}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Issue Date</span>
                <span className="font-bold text-slate-900">{userData.joiningDate ? new Date(userData.joiningDate).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 text-sm">Valid Until</span>
                <span className="font-bold text-slate-900">{userData.validUntil ? new Date(userData.validUntil).toLocaleDateString() : 'Until Revoked'}</span>
              </div>
            </div>
            
            <p className="text-center text-xs text-slate-400 mt-8">
              This is an official digital verification page of Manav Samanta Sangthan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
