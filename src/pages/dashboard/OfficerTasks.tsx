import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { CheckSquare, Loader2 } from 'lucide-react';

export default function OfficerTasks() {
  const { userData } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userData?.uid) return;
    
    const qTasks = query(collection(db, 'tasks'), where('assignedToId', '==', userData.uid));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsubTasks();
  }, [userData]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: newStatus });
    } catch (err) {
      alert('Error updating status');
    }
  };

  const handleUpdateNotes = async (taskId: string, notes: string) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { officerNotes: notes });
    } catch (err) {
      alert('Error updating notes');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Assigned Tasks</h1>
        <p className="text-slate-500">Manage and update the status of tasks assigned to you by the Admin.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading your tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500">
            <CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900">No Pending Tasks</h3>
            <p>You have no tasks assigned to you at the moment.</p>
          </div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                task.status === 'completed' ? 'bg-emerald-500' : 
                task.status === 'in_progress' ? 'bg-blue-500' : 
                task.status === 'cancelled' ? 'bg-rose-500' : 'bg-amber-500'
              }`}></div>
              
              <div className="pl-4 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold text-slate-900">{task.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase
                      ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                        task.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 text-sm mb-3">{task.description}</p>
                  {task.dueDate && <p className="text-xs font-semibold text-rose-600 mb-4">Due Date: {task.dueDate}</p>}
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">My Progress Notes / Proof</label>
                    <textarea 
                      className="w-full text-sm p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                      rows={2}
                      placeholder="Add notes about your progress..."
                      defaultValue={task.officerNotes}
                      onBlur={(e) => handleUpdateNotes(task.id, e.target.value)}
                    ></textarea>
                    <p className="text-[10px] text-slate-400 mt-1">Notes automatically save when you click outside the box.</p>
                  </div>
                </div>

                <div className="w-full md:w-48 shrink-0">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Update Status</label>
                  <select 
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                    disabled={task.status === 'cancelled'}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled" disabled>Cancelled (By Admin)</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
