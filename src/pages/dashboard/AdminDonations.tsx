import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Search, Download, CreditCard, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Donation {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  amount: number;
  paymentId?: string;
  orderId?: string;
  status: 'successful' | 'failed' | 'pending';
  timestamp: any;
  errorReason?: string;
}

export default function AdminDonations() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const q = query(collection(db, 'donations'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Donation[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Donation);
      });
      setDonations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredDonations = donations.filter(d => {
    const matchesSearch = 
      d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.donorPhone.includes(searchTerm) ||
      (d.paymentId && d.paymentId.includes(searchTerm));
      
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const totalAmount = donations
    .filter(d => d.status === 'successful')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalSuccessful = donations.filter(d => d.status === 'successful').length;
  const totalFailed = donations.filter(d => d.status === 'failed').length;

  const handleExport = () => {
    const headers = ['Date', 'Donor Name', 'Email', 'Phone', 'Amount (INR)', 'Status', 'Payment ID', 'Order ID', 'Error Reason'];
    const csvContent = [
      headers.join(','),
      ...filteredDonations.map(d => [
        d.timestamp ? format(d.timestamp.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A',
        `"${d.donorName}"`,
        `"${d.donorEmail}"`,
        `"${d.donorPhone}"`,
        d.amount,
        d.status,
        d.paymentId || '',
        d.orderId || '',
        `"${d.errorReason || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `donations_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading donations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Donations Management</h1>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Collected</p>
            <p className="text-2xl font-bold text-slate-900">₹{totalAmount.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Successful Donations</p>
            <p className="text-2xl font-bold text-slate-900">{totalSuccessful}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Failed Attempts</p>
            <p className="text-2xl font-bold text-slate-900">{totalFailed}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name, email, phone or Payment ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Status</option>
          <option value="successful">Successful</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Donor Info</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No donations found.
                  </td>
                </tr>
              ) : (
                filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-500">
                      {donation.timestamp ? format(donation.timestamp.toDate(), 'dd MMM yyyy, hh:mm a') : 'Pending'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{donation.donorName}</div>
                      <div className="text-slate-500 text-xs">{donation.donorEmail}</div>
                      <div className="text-slate-500 text-xs">{donation.donorPhone}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">
                      ₹{donation.amount}
                    </td>
                    <td className="px-6 py-4">
                      {donation.status === 'successful' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Success
                        </span>
                      )}
                      {donation.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium" title={donation.errorReason}>
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                      {donation.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {donation.paymentId || 'N/A'}
                      {donation.orderId && <div className="text-[10px] text-slate-400 mt-1">Order: {donation.orderId}</div>}
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
