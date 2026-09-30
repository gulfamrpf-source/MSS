import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Users, Search, Mail, Phone, MapPin } from 'lucide-react';

export default function OfficerMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // For now, we allow officers to see all active members in the directory.
    // In the future, this could be filtered by district/assignedOfficer.
    const q = query(collection(db, 'users'), where('role', '==', 'member'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter((m: any) => m.status === 'active'));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.memberId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Member Directory</h1>
          <p className="text-slate-500">View and coordinate with active members.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, ID or Area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No active members found matching your search.</p>
          </div>
        ) : (
          filteredMembers.map(member => (
            <div key={member.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full overflow-hidden shrink-0">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg font-bold">
                      {member.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{member.name}</h3>
                  <div className="text-xs font-mono text-emerald-600 bg-emerald-50 inline-block px-2 py-0.5 rounded mt-1">
                    {member.memberId || 'ID Pending'}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{member.phone || 'No phone'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">{member.email || 'No email'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{member.address || 'Address not provided'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
