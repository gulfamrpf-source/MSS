import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Mail, CheckCircle, Trash2, Clock, Inbox } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleMarkRead = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'read' ? 'unread' : 'read';
    try {
      await updateDoc(doc(db, 'messages', id), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
    } catch (error) {
      console.error('Error deleting message', error);
      alert('Failed to delete message.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Inbox className="w-6 h-6 text-emerald-600" />
            Contact Messages
          </h1>
          <p className="text-slate-500 mt-1">Manage inquiries from the public website.</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No messages found</h3>
            <p className="text-slate-500">When someone fills out the contact form, it will appear here.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`bg-white rounded-xl shadow-sm border ${msg.status === 'unread' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'} p-6 transition-colors`}>
              <div className="flex justify-between items-start mb-4 gap-4 flex-wrap">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    {msg.status === 'unread' && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                    {msg.subject}
                  </h3>
                  <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="font-medium text-slate-700">{msg.name}</span>
                    <a href={`mailto:${msg.email}`} className="text-emerald-600 hover:underline">{msg.email}</a>
                    <span className="flex items-center gap-1 text-xs">
                      <Clock className="w-3.5 h-3.5" /> 
                      {msg.createdAt ? format(new Date(msg.createdAt), 'dd MMM yyyy, hh:mm a') : 'Unknown Date'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleMarkRead(msg.id, msg.status)}
                    className={`p-2 rounded-lg transition-colors text-xs font-medium flex items-center gap-1 ${msg.status === 'unread' ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'}`}
                  >
                    <CheckCircle className="w-4 h-4" /> {msg.status === 'unread' ? 'Mark as Read' : 'Mark Unread'}
                  </button>
                  <button 
                    onClick={() => handleDelete(msg.id)}
                    className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                    title="Delete Message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-slate-700 whitespace-pre-wrap text-sm leading-relaxed border border-slate-100">
                {msg.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
