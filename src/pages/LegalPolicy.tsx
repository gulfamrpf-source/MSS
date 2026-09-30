import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Shield, FileText, AlertCircle, Info, ArrowLeft } from 'lucide-react';
import { legalPolicies } from '../data/legalPolicies';

export default function LegalPolicy() {
  const { policyId } = useParams<{ policyId: string }>();
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>({});

  const defaultData = legalPolicies[policyId || ''] || { 
    title: 'Legal & Policy', 
    content: 'Content unavailable.', 
    icon: FileText 
  };
  const Icon = defaultData.icon || FileText;

  useEffect(() => {
    async function fetchSettingsAndPolicy() {
      try {
        // Fetch org settings to populate placeholders
        const settingsRef = doc(db, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        let currentSettings = {};
        if (settingsSnap.exists()) {
          currentSettings = settingsSnap.data();
          setSettings(currentSettings);
        }

        // Fetch policy override if exists
        if (policyId) {
          const docRef = doc(db, 'policies', policyId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists() && docSnap.data().content) {
            const data = docSnap.data();
            setTitle(data.title || defaultData.title);
            setContent(data.content);
          } else {
            setTitle(defaultData.title);
            setContent(defaultData.content);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setTitle(defaultData.title);
        setContent(defaultData.content);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettingsAndPolicy();
  }, [policyId, defaultData.title, defaultData.content]);

  // Replace placeholders dynamically
  const replacePlaceholders = (text: string) => {
    return text
      .replace(/\[NGO NAME\]/g, settings.orgName || 'Manav Samanta Sangthan')
      .replace(/\[REGISTERED ADDRESS\]/g, settings.address || '[Office Street Address], [City], [State]')
      .replace(/\[OFFICIAL EMAIL\]/g, settings.email || 'manavsamantasangthan@gmail.com')
      .replace(/\[PHONE NUMBER\]/g, settings.phone || '[+91 0000000000]')
      .replace(/\[REGISTRATION NUMBER\/DETAILS\]/g, settings.registrationNumber || '[Registration Number]')
      .replace(/\[GRIEVANCE OFFICER NAME\/DESIGNATION\]/g, settings.grievanceOfficer || 'Grievance Officer')
      .replace(/\[GRIEVANCE EMAIL\]/g, settings.email || 'manavsamantasangthan@gmail.com')
      .replace(/\[GRIEVANCE PHONE\]/g, settings.phone || '[+91 0000000000]')
      .replace(/\[CITY\/STATE\]/g, settings.jurisdiction || 'India');
  };

  return (
    <div className="min-h-[70vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-6">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-none">
        <div className="bg-slate-900 p-8 text-center print:bg-white print:text-black print:p-4 print:border-b print:border-slate-200">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700 print:hidden">
            <Icon className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 print:text-black">{title}</h1>
          <p className="text-slate-400 text-sm print:text-slate-600">Official Organization Policy</p>
        </div>
        
        <div className="p-8 md:p-12 print:p-0 print:pt-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap print:text-black prose-headings:text-slate-900 prose-headings:font-bold prose-h2:text-2xl prose-h3:text-xl">
              {replacePlaceholders(content)}
              
              <div className="mt-16 pt-8 border-t border-slate-100 bg-slate-50 p-6 rounded-xl print:hidden">
                <h4 className="text-sm font-bold text-slate-900 mb-2">Notice to Users</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  “By using this website, you acknowledge that you have read and understood the applicable terms, policies and guidelines.”
                </p>
                <Link to="/" className="inline-block px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors">
                  Back to Legal & Policies
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
