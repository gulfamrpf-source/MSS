import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ShieldCheck, Loader2, Save, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const DEFAULT_POLICIES = [
  { id: 'privacy', title: 'Privacy Policy | गोपनीयता नीति' },
  { id: 'terms', title: 'Terms & Conditions | नियम एवं शर्तें' },
  { id: 'user-agreement', title: 'User Agreement | उपयोगकर्ता समझौता' },
  { id: 'rules', title: 'Rules & Regulations | नियम एवं विनियम' },
  { id: 'membership', title: 'Membership Rules | सदस्यता नियम' },
  { id: 'code-of-conduct', title: 'Code of Conduct | आचार-संहिता' },
  { id: 'officer-conduct', title: 'Officer Code of Conduct' },
  { id: 'volunteer', title: 'Volunteer Guidelines' },
  { id: 'safety', title: 'Safety Guidelines' },
  { id: 'donation', title: 'Donation Policy | दान नीति' },
  { id: 'refund', title: 'Refund & Cancellation Policy' },
  { id: 'grievance', title: 'Grievance Policy | शिकायत निवारण नीति' },
  { id: 'disclaimer', title: 'Disclaimer | अस्वीकरण' },
  { id: 'cookie', title: 'Cookie Policy | कुकी नीति' },
];

export default function AdminPolicies() {
  const [policies, setPolicies] = useState<Record<string, { title: string, content: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const querySnapshot = await getDocs(collection(db, 'policies'));
        const loaded: Record<string, { title: string, content: string }> = {};
        querySnapshot.forEach((doc) => {
          loaded[doc.id] = doc.data() as { title: string, content: string };
        });
        setPolicies(loaded);
      } catch (error) {
        console.error("Error loading policies", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicies();
  }, []);

  const handleEdit = (id: string, defaultTitle: string) => {
    setEditingId(id);
    setEditTitle(policies[id]?.title || defaultTitle);
    setEditContent(policies[id]?.content || '');
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'policies', editingId), {
        title: editTitle,
        content: editContent,
        updatedAt: new Date().toISOString()
      });
      setPolicies(prev => ({
        ...prev,
        [editingId]: { title: editTitle, content: editContent }
      }));
      setEditingId(null);
    } catch (error) {
      console.error("Error saving policy", error);
      alert("Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            Policies & Legal Management
          </h1>
          <p className="text-slate-500 mt-1">Manage website footer policies and legal documents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="font-semibold text-slate-800">Policy Documents</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {DEFAULT_POLICIES.map((policy) => {
              const hasContent = !!policies[policy.id]?.content;
              const isEditing = editingId === policy.id;
              
              return (
                <button
                  key={policy.id}
                  onClick={() => handleEdit(policy.id, policy.title)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${isEditing ? 'bg-emerald-50 border-l-4 border-emerald-500' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                >
                  <span className={`text-sm font-medium ${isEditing ? 'text-emerald-700' : 'text-slate-700'}`}>
                    {policy.title.split(' | ')[0]}
                  </span>
                  {hasContent ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Published"></span>
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300" title="Empty/Draft"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2">
          {editingId ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full min-h-[600px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800">Edit Document</h2>
                <Link to={`/policy/${editingId}`} target="_blank" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
                  <ExternalLink className="w-3.5 h-3.5" /> View Public Page
                </Link>
              </div>
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Content (Markdown / Text)</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full flex-1 min-h-[400px] p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono text-sm leading-relaxed"
                    placeholder="Enter policy content here..."
                  ></textarea>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-70"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col items-center justify-center h-full min-h-[600px] text-slate-500 p-8 text-center">
              <ShieldCheck className="w-16 h-16 text-slate-200 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Select a Policy to Edit</h3>
              <p className="max-w-sm text-sm leading-relaxed">
                Choose a document from the left sidebar to create or update its content. The changes will be immediately visible on the public website.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
