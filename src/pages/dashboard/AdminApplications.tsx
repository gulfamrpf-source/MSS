import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Check, X, Eye } from 'lucide-react';
import { generateId } from '../../utils/idGenerator';

export default function AdminApplications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDetailsApp, setSelectedDetailsApp] = useState<any | null>(null);
  
  const [role, setRole] = useState('member');
  const [designation, setDesignation] = useState('Member');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApplications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const openApproveModal = (app: any) => {
    setSelectedApp(app);
    setRole('member');
    setDesignation('Member');
    setShowApproveModal(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    
    setIsProcessing(true);
        
    try {
      // 1. Generate ID
      const newId = await generateId(role === 'officer' ? 'officer' : 'member');
      
      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(issueDate.getFullYear() + 1);

      // 2. Update Application status
      await updateDoc(doc(db, 'applications', selectedApp.id), {
        status: 'approved',
        approvedAt: issueDate,
        memberId: role === 'member' ? newId : null,
        officerId: role === 'officer' ? newId : null,
        roleAssigned: role
      });

      // 3. Create/Update User document
      // We will try to find the user by userId if exists, else by email if we can?
      // Wait, in Join.tsx we save userId (uid)
      const targetUid = selectedApp.userId;
      
      if (targetUid) {
        const updateData: any = {
          uid: targetUid,
          email: selectedApp.email,
          name: selectedApp.fullName,
          role: role,
          status: 'active',
          joiningDate: issueDate.toISOString(),
          validUntil: expiryDate.toISOString(),
          phone: selectedApp.mobile,
          address: selectedApp.address,
          city: selectedApp.city || '',
          state: selectedApp.state || '',
          district: selectedApp.district || ''
        };
        
        if (role === 'officer') {
          updateData.officerId = newId;
          updateData.designation = designation;
          updateData.officerAppointmentDate = issueDate.toISOString();
        } else {
          updateData.memberId = newId;
          updateData.designation = 'Member';
        }
        
        // Use setDoc with merge to create or update the user document
        await setDoc(doc(db, 'users', targetUid), updateData, { merge: true });
      }
      
      alert('Application approved successfully!');
      setShowApproveModal(false);
      setSelectedApp(null);
    } catch (error) {
      console.error("Error approving application", error);
      alert('Error approving application. Make sure the database rules allow this action.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (appId: string) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    await updateDoc(doc(db, 'applications', appId), {
      status: 'rejected',
      rejectedAt: new Date()
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Membership Applications</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-medium">Applicant</th>
                <th className="px-6 py-4 font-medium">Location</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No applications found.</td></tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <button onClick={() => { setSelectedDetailsApp(app); setShowDetailsModal(true); }} className="font-medium text-emerald-600 hover:text-emerald-700 hover:underline text-left">{app.fullName}</button>
                      <div className="text-slate-500 text-xs">ID: {app.id.substring(0,8)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{app.district}, {app.state}</div>
                      <div className="text-slate-500 text-xs">{app.city}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{app.mobile}</div>
                      <div className="text-slate-500 text-xs">{app.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize
                        ${app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                          app.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {app.status === 'under_review' && (
                          <>
                            <button onClick={() => openApproveModal(app)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors bg-emerald-50 border border-emerald-100" title="Approve">
                              <Check className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleReject(app.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent" title="Reject">
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showApproveModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Approve Application</h3>
              <p className="text-slate-500 text-sm mt-1">Assign role and designate for {selectedApp.fullName}</p>
            </div>
            
            <form onSubmit={handleApproveSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Role</label>
                <select 
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value === 'member') setDesignation('Member');
                    if (e.target.value === 'officer') setDesignation('District Officer');
                  }}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="member">Member</option>
                  <option value="officer">Officer</option>
                </select>
              </div>

              {role === 'officer' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Designation</label>
                  <input
                    type="text"
                    required
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    placeholder="e.g., State President, District Secretary"
                  />
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 mb-4 border border-slate-200">
                <div className="font-medium text-slate-800 mb-1">Location Assignment:</div>
                <div>State: {selectedApp.state || 'N/A'}</div>
                <div>District: {selectedApp.district || 'N/A'}</div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {isProcessing ? 'Saving...' : 'Confirm & Approve'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && selectedDetailsApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Application Details</h3>
                <p className="text-slate-500 text-sm mt-1">Review full details before approving.</p>
              </div>
              <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  {selectedDetailsApp.photoUrl ? (
                    <img src={selectedDetailsApp.photoUrl} alt="Applicant" className="w-24 h-24 rounded-xl object-cover shadow-sm border border-slate-200" />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
                      <span className="text-slate-400 text-sm">No Photo</span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{selectedDetailsApp.fullName}</h4>
                    <p className="text-slate-500 text-sm">{selectedDetailsApp.email}</p>
                    <p className="text-slate-500 text-sm">{selectedDetailsApp.mobile}</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-sm">
                  <h5 className="font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-2">Personal Information</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-slate-500">Father's Name:</div>
                    <div className="font-medium text-slate-900">{selectedDetailsApp.fatherName}</div>
                    
                    <div className="text-slate-500">Date of Birth:</div>
                    <div className="font-medium text-slate-900">{selectedDetailsApp.dob}</div>
                    
                    <div className="text-slate-500">Blood Group:</div>
                    <div className="font-medium text-slate-900">{selectedDetailsApp.bloodGroup}</div>
                    
                    <div className="text-slate-500">Gender:</div>
                    <div className="font-medium text-slate-900 capitalize">{selectedDetailsApp.gender}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 text-sm">
                  <h5 className="font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-2">Address Details</h5>
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <div className="text-slate-500 text-xs">Full Address</div>
                      <div className="font-medium text-slate-900">{selectedDetailsApp.address}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <div className="text-slate-500 text-xs">City</div>
                        <div className="font-medium text-slate-900">{selectedDetailsApp.city}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">Pincode</div>
                        <div className="font-medium text-slate-900">{selectedDetailsApp.pincode}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">District</div>
                        <div className="font-medium text-slate-900">{selectedDetailsApp.district}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-xs">State</div>
                        <div className="font-medium text-slate-900">{selectedDetailsApp.state}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                  <h5 className="font-semibold text-slate-900 border-b border-slate-200 pb-2 mb-2 text-sm">Payment Screenshot</h5>
                  {selectedDetailsApp.paymentScreenshotUrl ? (
                    <a href={selectedDetailsApp.paymentScreenshotUrl} target="_blank" rel="noreferrer" className="block">
                      <img src={selectedDetailsApp.paymentScreenshotUrl} alt="Payment Screenshot" className="w-full h-40 object-cover rounded-lg border border-slate-200 hover:opacity-90 transition-opacity" />
                      <p className="text-xs text-center text-emerald-600 mt-2 font-medium">Click to view full size</p>
                    </a>
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-slate-100 rounded-lg border border-slate-200 text-slate-500 text-sm">
                      No Screenshot Uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-between items-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize
                ${selectedDetailsApp.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                  selectedDetailsApp.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                Status: {selectedDetailsApp.status.replace('_', ' ')}
              </span>
              
              {selectedDetailsApp.status === 'under_review' && (
                <div className="flex gap-3">
                  <button 
                    onClick={() => { 
                      handleReject(selectedDetailsApp.id); 
                      setShowDetailsModal(false); 
                    }} 
                    className="px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors font-medium"
                  >
                    Reject
                  </button>
                  <button 
                    onClick={() => { 
                      openApproveModal(selectedDetailsApp); 
                      setShowDetailsModal(false);
                    }} 
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium"
                  >
                    Approve Applicant
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
