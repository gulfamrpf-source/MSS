import React, { useState } from 'react';
import { ChevronRight, HeartHandshake, FileText, CheckCircle } from 'lucide-react';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function Join() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    guardianName: '',
    dob: '',
    gender: 'Male',
    bloodGroup: '',
    mobile: '',
    email: '',
    password: '',
    address: '',
    city: '',
    district: '',
    state: '',
    pincode: '',
    idProofType: 'Aadhaar',
    idProofNumber: '',
    occupation: '',
    qualification: '',
    preferredArea: '',
    feeAmount: 500,
    declaration: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, feeAmount: parseInt(e.target.value) || 0 }));
  };

  const handleFeeBlur = () => {
    if (formData.feeAmount < 500) {
      setFormData(prev => ({ ...prev, feeAmount: 500 }));
    }
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.feeAmount < 500) {
      alert("Minimum membership fee is ₹500");
      return;
    }
    
    setIsSubmitting(true);

    try {
      let uid = 'unknown';
      
      try {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const { auth } = await import('../firebase');
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        uid = userCredential.user.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
           alert("This email is already registered. Please log in first to apply for membership.");
           setIsSubmitting(false);
           return;
        } else {
           throw authErr;
        }
      }
      
      // Update User Profile in users collection with the rich data
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        name: formData.fullName,
        phone: formData.mobile,
        address: formData.address + ', ' + formData.city + ', ' + formData.district + ', ' + formData.state + ' - ' + formData.pincode,
        email: formData.email,
        role: 'user',
        status: 'pending'
      }, { merge: true });

      // 2. Save Application
      const docRef = await addDoc(collection(db, 'applications'), {
        userId: uid,
        fullName: formData.fullName,
        email: formData.email,
        mobile: formData.mobile,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
        idProofType: formData.idProofType,
        idProofNumber: formData.idProofNumber,
        occupation: formData.occupation,
        qualification: formData.qualification,
        preferredArea: formData.preferredArea,
        feeAmount: formData.feeAmount,
        status: 'under_review',
        paymentStatus: 'pending', 
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
    } catch (error) {
      console.error("Error submitting application", error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-8 md:p-12 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Application Submitted!</h2>
          <p className="text-lg text-slate-600 mb-8">
            Thank you for joining Manav Samanta Sangthan. Your application is under review. You will receive a confirmation once it's approved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/" className="px-6 py-3 bg-white text-slate-700 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              Return Home
            </Link>
            <Link to="/login" className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
              Proceed to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto mb-10 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Become a Member</h1>
        <p className="text-slate-600 text-lg">Join us in our mission to create a fair and equal society.</p>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <div className={`flex-1 py-4 text-center text-sm font-medium ${step === 1 ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-500'}`}>
            1. Registration
          </div>
          <div className={`flex-1 py-4 text-center text-sm font-medium ${step === 2 ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-500'}`}>
            2. Payment & Submission
          </div>
        </div>

        <form onSubmit={step === 1 ? handleNext : handleFinalSubmit} className="p-6 md:p-10">
          
          {step === 1 && (
            <div className="space-y-8">
              {/* Section 1: Personal Info */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Father/Mother/Guardian Name *</label>
                    <input required type="text" name="guardianName" value={formData.guardianName} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                    <input required type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                      <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                      <input type="text" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="e.g. O+" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mobile Number *</label>
                    <input required type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Create Login Password *</label>
                    <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="Enter a password for future logins" />
                  </div>
                </div>
              </div>

              {/* Section 2: Address */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Residential Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Address *</label>
                    <textarea required name="address" rows={2} value={formData.address} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">City / Village *</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">District *</label>
                    <input required type="text" name="district" value={formData.district} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                    <input required type="text" name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">PIN Code *</label>
                    <input required type="text" name="pincode" value={formData.pincode} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                </div>
              </div>

              {/* Section 3: Identity & Professional */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Identity & Background</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ID Proof Type *</label>
                    <select required name="idProofType" value={formData.idProofType} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                      <option value="Aadhaar">Aadhaar Card</option>
                      <option value="PAN">PAN Card</option>
                      <option value="VoterID">Voter ID</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ID Proof Number *</label>
                    <input required type="text" name="idProofNumber" value={formData.idProofNumber} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Occupation *</label>
                    <input required type="text" name="occupation" value={formData.occupation} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Educational Qualification *</label>
                    <input required type="text" name="qualification" value={formData.qualification} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Area of Social Work *</label>
                    <input required type="text" name="preferredArea" value={formData.preferredArea} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" placeholder="e.g. Education, Health, Environment..." />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                  Continue to Payment <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Membership Fee</h3>
                <p className="text-slate-600 mb-6">Your contribution helps us create a better society.</p>
                
                <div className="flex flex-col items-center max-w-xs mx-auto">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Enter Amount (Minimum ₹500)</label>
                  <div className="relative w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-lg">₹</span>
                    <input 
                      type="number" 
                      min="500" 
                      name="feeAmount" 
                      value={formData.feeAmount} 
                      onChange={handleFeeChange}
                      onBlur={handleFeeBlur}
                      className="w-full pl-10 pr-4 py-3 text-lg font-bold bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-center"
                    />
                  </div>
                  {formData.feeAmount < 500 && (
                    <p className="text-rose-500 text-sm mt-2 font-medium">Minimum membership fee is ₹500/-</p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 mb-4">Application Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Applicant:</span> <span className="font-medium text-slate-900">{formData.fullName}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Mobile:</span> <span className="font-medium text-slate-900">{formData.mobile}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">City:</span> <span className="font-medium text-slate-900">{formData.city}</span></div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 mt-2"><span className="text-slate-500 font-bold">Total Payable:</span> <span className="font-bold text-emerald-600 text-lg">₹{formData.feeAmount}</span></div>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg cursor-pointer">
                <input required type="checkbox" name="declaration" checked={formData.declaration} onChange={handleChange} className="mt-1 w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500" />
                <span className="text-sm text-slate-600 leading-relaxed">
                  I declare that all the information provided above is true and correct. I agree to abide by the rules and regulations of Manav Samanta Sangthan.
                </span>
              </label>

              <div className="flex justify-between pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors">
                  Back
                </button>
                <button disabled={isSubmitting || !formData.declaration || formData.feeAmount < 500} type="submit" className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Processing...' : `Pay ₹${formData.feeAmount} & Submit`}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
