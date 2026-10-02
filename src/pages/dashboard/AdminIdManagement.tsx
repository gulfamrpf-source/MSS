import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { CreditCard, Search, ExternalLink, RefreshCw } from 'lucide-react';
import { generateId } from '../../utils/idGenerator';

export default function AdminIdManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', 'in', ['member', 'officer', 'admin']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus
      });
    } catch (error) {
      alert('Error updating status.');
    }
  };

  const handleRegenerateId = async (user: any) => {
    if (!window.confirm('Are you sure you want to regenerate an ID for this user? This will overwrite their existing ID.')) return;
    
    try {
      const type = user.role === 'officer' ? 'officer' : 'member';
      const newId = await generateId(type);
      
      const updateData: any = {};
      if (type === 'officer') {
        updateData.officerId = newId;
      } else {
        updateData.memberId = newId;
      }

      await updateDoc(doc(db, 'users', user.id), updateData);
      alert('ID Regenerated successfully.');
    } catch (err) {
      alert('Error regenerating ID');
    }
  };

  const handleRenewValidity = async (userId: string) => {
      const issueDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(issueDate.getFullYear() + 1);
      
      try {
          await updateDoc(doc(db, 'users', userId), {
              issueDate: issueDate.toISOString(),
              cardIssueDate: issueDate.toISOString(),
              joiningDate: issueDate.toISOString(),
              validUntil: expiryDate.toISOString(),
              status: 'active'
          });
          alert('Validity renewed for 1 year and Issue Date updated to today.');
      } catch (err) {
          alert('Error renewing validity.');
      }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.memberId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.officerId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Identity Cards Management</h1>
          <p className="text-slate-500">Manage member and officer IDs, view status, and renew validity.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-medium">Name & Role</th>
                <th className="px-6 py-4 font-medium">IDs</th>
                <th className="px-6 py-4 font-medium">Validity</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No users found.</td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{user.name}</div>
                      <div className="text-slate-500 text-xs capitalize">{user.role} {user.designation ? `- ${user.designation}` : ''}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">
                      {user.memberId && <div>M: {user.memberId}</div>}
                      {user.officerId && <div>O: {user.officerId}</div>}
                      {!user.memberId && !user.officerId && 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                        <div className="flex flex-col gap-0.5">
                          <span><span className="text-slate-400 font-medium">Issued:</span> {user.issueDate || user.cardIssueDate || user.approvedAt || user.joiningDate ? new Date(user.issueDate || user.cardIssueDate || user.approvedAt || user.joiningDate).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : 'N/A'}</span>
                          <span><span className="text-slate-400 font-medium">Valid:</span> {user.validUntil ? new Date(user.validUntil).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'}) : 'Until Revoked'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={user.status}
                        onChange={(e) => handleUpdateStatus(user.id, e.target.value)}
                        className={`text-xs font-medium rounded-full px-2 py-1 outline-none border border-transparent hover:border-slate-300
                          ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                            user.status === 'suspended' ? 'bg-rose-100 text-rose-700' : 
                            user.status === 'expired' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}
                      >
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 flex-wrap">
                        <button 
                            onClick={() => window.open(`/verify/${user.uid}`, '_blank')}
                            className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors" title="Verify Page">
                            <ExternalLink className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleRenewValidity(user.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Renew Validity">
                            <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleRegenerateId(user)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Regenerate ID">
                            <CreditCard className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
