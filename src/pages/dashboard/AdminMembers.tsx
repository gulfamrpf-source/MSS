import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Shield, UserMinus, AlertTriangle, CheckCircle, Ban, Edit2 } from 'lucide-react';
import { generateId } from '../../utils/idGenerator';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminMembers() {
  const { userData } = useAuth();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [role, setRole] = useState('member');
  const [level, setLevel] = useState('');
  const [designation, setDesignation] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [districtValue, setDistrictValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Filter out pure admins if needed, or show everyone
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter((u: any) => ['member', 'officer', 'admin'].includes(u.role)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const openRoleModal = (member: any) => {
    setSelectedMember(member);
    setRole(member.role || 'member');
    setLevel(member.level || '');
    setDesignation(member.designation || '');
    setStateValue(member.state || '');
    setDistrictValue(member.district || '');
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    setIsProcessing(true);

    try {
      const updateData: any = {
        role: role,
        level: level,
        state: stateValue,
        district: districtValue,
      };

      if (role === 'officer') {
        updateData.designation = designation || 'Officer';
        if (!selectedMember.officerId) {
          updateData.officerId = await generateId('officer');
          updateData.officerAppointmentDate = new Date().toISOString();
        }
      } else if (role === 'admin') {
        updateData.designation = designation || 'Admin';
      } else {
        updateData.designation = ''; // clear designation if demoted
      }

      await updateDoc(doc(db, 'users', selectedMember.id), updateData);
      alert('Member updated successfully!');
      setShowRoleModal(false);
    } catch (error) {
      console.error("Error updating member", error);
      alert('Error updating role.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (memberId: string, newStatus: string) => {
    const actionName = newStatus === 'suspended' ? 'suspend' : 'activate';
    if (!window.confirm(`Are you sure you want to ${actionName} this member?`)) return;
    try {
      await updateDoc(doc(db, 'users', memberId), {
        status: newStatus
      });
    } catch (error) {
      console.error(`Error updating status`, error);
      alert('Error: ' + error.message);
    }
  };

  const handleDemoteToUser = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to completely revoke Membership? This will revert them to a standard user.')) return;
    try {
      await updateDoc(doc(db, 'users', memberId), {
        role: 'user',
        status: 'pending',
        memberId: '',
        officerId: '',
        designation: ''
      });
      alert('Member revoked successfully.');
    } catch (error) {
      console.error("Error revoking member", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Members & Officers</h1>
          <p className="text-slate-500">Appoint officers, manage statuses, and oversee all personnel.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Region</th>
                <th className="px-6 py-4 font-medium">ID Info</th>
                <th className="px-6 py-4 font-medium">Role & Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No members found.</td></tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{member.name}</div>
                      <div className="text-slate-500 text-xs">{member.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900">{member.district || 'N/A'}</div>
                      <div className="text-slate-500 text-xs">{member.state || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-slate-600 text-xs">
                        {member.memberId && <div><span className="font-semibold text-slate-400">M:</span> <span className="font-mono">{member.memberId}</span></div>}
                        {member.officerId && <div><span className="font-semibold text-slate-400">O:</span> <span className="font-mono">{member.officerId}</span></div>}
                        {!member.memberId && !member.officerId && <span>N/A</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5 items-start">
                        {member.role === 'admin' ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">Admin</span>
                            <div className="text-xs text-slate-500 mt-1">
                              {member.level && <span className="capitalize">{member.level} • </span>}
                              {member.designation || 'Admin'}
                            </div>
                          </div>
                        ) : member.role === 'officer' ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Officer</span>
                            <div className="text-xs text-slate-500 mt-1">
                              {member.level && <span className="capitalize">{member.level} • </span>}
                              {member.designation}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 capitalize">{member.role}</span>
                        )}

                        {member.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600"><AlertTriangle className="w-3 h-3" /> Suspended</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600"><CheckCircle className="w-3 h-3" /> Active</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {member.id !== userData?.uid && (
                          <button onClick={() => openRoleModal(member)} className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-colors text-xs font-medium" title="Edit Role & Designation">
                            <Edit2 className="w-3.5 h-3.5" /> Edit Role
                          </button>
                        )}
                        
                        {member.id !== userData?.uid && (
                          member.status === 'active' ? (
                            <button onClick={() => handleUpdateStatus(member.id, 'suspended')} className="flex items-center gap-1 px-3 py-1.5 text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition-colors text-xs font-medium" title="Suspend Member">
                              <AlertTriangle className="w-3.5 h-3.5" /> Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleUpdateStatus(member.id, 'active')} className="flex items-center gap-1 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-colors text-xs font-medium" title="Activate Member">
                              <CheckCircle className="w-3.5 h-3.5" /> Activate
                            </button>
                          )
                        )}
                        
                        {member.id !== userData?.uid && (
                          <button onClick={() => handleDemoteToUser(member.id)} className="flex items-center gap-1 px-3 py-1.5 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg transition-colors text-xs font-medium" title="Remove Membership entirely">
                             <Ban className="w-3.5 h-3.5" /> Remove
                          </button>
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

      {showRoleModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900">Edit Member Role</h3>
              <p className="text-slate-500 text-sm mt-1">Assign roles and regions for {selectedMember.name}</p>
            </div>
            
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="user">User (Pending)</option>
                  <option value="member">Member</option>
                  <option value="officer">Officer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {(role === 'officer' || role === 'admin') && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Jurisdiction / Level</label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">Select Level</option>
                      <option value="international">International</option>
                      <option value="national">National</option>
                      <option value="state">State</option>
                      <option value="district">District</option>
                      <option value="block">Block / Local</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rank / Designation</label>
                    <input
                      type="text"
                      required
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      placeholder="e.g., State President, General Secretary"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={stateValue}
                    onChange={(e) => setStateValue(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">District</label>
                  <input
                    type="text"
                    value={districtValue}
                    onChange={(e) => setDistrictValue(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {isProcessing ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
