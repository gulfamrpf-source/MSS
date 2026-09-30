import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { CheckSquare, Plus, Loader2 } from 'lucide-react';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    // Fetch Tasks
    const qTasks = query(collection(db, 'tasks'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    // Fetch Officers for dropdown
    const qOfficers = query(collection(db, 'users'), where('role', '==', 'officer'));
    const unsubOfficers = onSnapshot(qOfficers, (snapshot) => {
      setOfficers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubTasks();
      unsubOfficers();
    };
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !assignedToId) return;

    const assignedOfficer = officers.find(o => o.id === assignedToId);

    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        description,
        assignedToId,
        assignedToName: assignedOfficer?.name || 'Unknown Officer',
        status: 'pending',
        dueDate,
        createdAt: serverTimestamp(),
        officerNotes: ''
      });
      setTitle('');
      setDescription('');
      setAssignedToId('');
      setDueDate('');
      setIsCreating(false);
      alert('Task assigned successfully!');
    } catch (err) {
      alert('Error creating task.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if(!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      // In a real app, you might soft delete. For now, we'll just update status to cancelled
      await updateDoc(doc(db, 'tasks', taskId), { status: 'cancelled' });
    } catch (err) {
      alert('Error deleting task');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Allocation</h1>
          <p className="text-slate-500">Assign specific tasks and responsibilities to Officers.</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> {isCreating ? 'Cancel' : 'New Task'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Assign New Task</h2>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To Officer *</label>
                <select required value={assignedToId} onChange={e => setAssignedToId(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                  <option value="">Select Officer...</option>
                  {officers.map(off => (
                    <option key={off.id} value={off.id}>{off.name} ({off.officerId || 'No ID'})</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700">Assign Task</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-6 py-4 font-medium">Task Details</th>
              <th className="px-6 py-4 font-medium">Assigned To</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Officer Notes</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading tasks...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No tasks assigned yet.</td></tr>
            ) : (
              tasks.map(task => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{task.title}</div>
                    <div className="text-slate-500 text-xs mt-1 max-w-xs truncate">{task.description}</div>
                    {task.dueDate && <div className="text-rose-500 text-xs mt-1">Due: {task.dueDate}</div>}
                  </td>
                  <td className="px-6 py-4 font-medium text-emerald-700">{task.assignedToName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                      ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                        task.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">{task.officerNotes || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    {task.status !== 'cancelled' && (
                       <button onClick={() => handleDeleteTask(task.id)} className="text-rose-600 hover:text-rose-800 text-xs font-medium">Cancel Task</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
