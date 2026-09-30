import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { Save, UploadCloud, Loader2, ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  'Education', 'Healthcare', 'Environment', 'Women Empowerment', 
  'Child Welfare', 'Disaster Relief', 'Community Development', 'Other'
];

const CONTENT_TYPES = [
  { id: 'activity', label: 'General Activity' },
  { id: 'project', label: 'Project' },
  { id: 'campaign', label: 'Campaign' },
  { id: 'event', label: 'Event' },
  { id: 'news', label: 'News' },
  { id: 'gallery', label: 'Gallery Photo' },
  { id: 'about', label: 'About Us Section' },
  { id: 'volunteer', label: 'Volunteer Info' },
  { id: 'partner', label: 'Partner Info' }
];

export default function AdminActivityForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    type: 'activity',
    title: '',
    description: '',
    category: 'Education',
    date: new Date().toISOString().split('T')[0],
    city: '',
    location: '',
    organizer: '',
    coverImageUrl: '',
    beneficiariesCount: 0,
    volunteersCount: 0,
    impactSummary: '',
    estimatedBudget: 0,
    actualExpenditure: 0,
    isFinancialPublic: false,
    status: 'draft'
  });

  useEffect(() => {
    if (isEditing) {
      async function fetchActivity() {
        try {
          const docRef = doc(db, 'activities', id!);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData({ ...formData, ...docSnap.data() } as any);
          }
        } catch (error) {
          console.error("Error fetching activity", error);
        } finally {
          setLoading(false);
        }
      }
      fetchActivity();
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault();
    setSaving(true);
    
    const dataToSave = {
      ...formData,
      status,
      updatedAt: new Date().toISOString()
    };

    if (!isEditing) {
      (dataToSave as any).createdAt = new Date().toISOString();
    }

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'activities', id!), dataToSave);
      } else {
        await addDoc(collection(db, 'activities'), dataToSave);
      }
      navigate('/dashboard/activities');
    } catch (error) {
      console.error("Error saving activity", error);
      alert("Error saving data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/dashboard/activities')} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{isEditing ? 'Edit Content' : 'Create New Content'}</h1>
          <p className="text-slate-500">Publish activities, projects, campaigns, events, news, or gallery photos.</p>
        </div>
      </div>

      <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
        
        {/* Content Type Setup */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-emerald-500">
          <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Content Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CONTENT_TYPES.map(type => (
              <label key={type.id} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${formData.type === type.id ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:bg-slate-50 text-slate-700'}`}>
                <input type="radio" name="type" value={type.id} checked={formData.type === type.id} onChange={handleChange} className="hidden" />
                <span className="font-medium text-sm">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">City/Location</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Organizer / Source</label>
              <input type="text" name="organizer" value={formData.organizer} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Content & Description</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Detailed Description *</label>
              <textarea required name="description" value={formData.description} onChange={handleChange} rows={5} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL</label>
              <input type="url" name="coverImageUrl" value={formData.coverImageUrl} onChange={handleChange} placeholder="https://example.com/image.jpg" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              <p className="text-xs text-slate-500 mt-1">Provide a direct URL to an image. Crucial for Gallery items.</p>
            </div>
          </div>
        </div>

        {/* Impact */}
        {formData.type !== 'news' && formData.type !== 'gallery' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Impact & Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Number of Beneficiaries</label>
                <input type="number" min="0" name="beneficiariesCount" value={formData.beneficiariesCount} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Volunteers Participated</label>
                <input type="number" min="0" name="volunteersCount" value={formData.volunteersCount} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Impact Summary</label>
                <input type="text" name="impactSummary" value={formData.impactSummary} onChange={handleChange} placeholder="e.g. Distributed 500 blankets to homeless families" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>
            </div>
          </div>
        )}

        {/* Finance */}
        {formData.type !== 'news' && formData.type !== 'gallery' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500">
            <h3 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">Internal Financial Data</h3>
            <p className="text-sm text-slate-600 mb-6">This information remains strictly private in the Admin Panel unless you explicitly enable public visibility.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Estimated Budget (₹)</label>
                <input type="number" min="0" name="estimatedBudget" value={formData.estimatedBudget} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actual Expenditure (₹)</label>
                <input type="number" min="0" name="actualExpenditure" value={formData.actualExpenditure} onChange={handleChange} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:amber-500 outline-none" />
              </div>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 rounded-lg">
              <input type="checkbox" name="isFinancialPublic" checked={formData.isFinancialPublic} onChange={handleChange} className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500" />
              <div>
                <span className="block font-medium text-slate-900">Make Financials Public</span>
                <span className="block text-sm text-slate-500">Warning: Checking this will display expenditure on the public website.</span>
              </div>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 border-t border-slate-200 pt-6">
          <button 
            onClick={() => navigate('/dashboard/activities')}
            className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button 
            disabled={saving}
            onClick={(e) => handleSubmit(e, 'draft')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" /> Save as Draft
          </button>
          <button 
            disabled={saving || !formData.title || !formData.date}
            onClick={(e) => handleSubmit(e, 'published')}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <UploadCloud className="w-5 h-5" /> Publish to Website
          </button>
        </div>
      </form>
    </div>
  );
}
