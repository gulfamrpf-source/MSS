import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { AppointmentLetterData, LetterheadSettings } from '../../types/appointment';
import { retryAppointmentSMS, createOfficerAppointmentRecord } from '../../utils/appointmentService';
import AppointmentLetterDoc from '../../components/AppointmentLetterDoc';
import { generateId } from '../../utils/idGenerator';
import { 
  FileText, Download, Printer, Search, RefreshCw, Send, CheckCircle2, 
  XCircle, AlertTriangle, Eye, Plus, Upload, Trash2, X, Shield, Phone, 
  MapPin, Loader2, Sparkles, Settings, FileDown, Layers, Check
} from 'lucide-react';
import { compressImage } from '../../utils/imageUtils';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';

export default function AdminAppointmentLetters() {
  const [letters, setLetters] = useState<AppointmentLetterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modals
  const [selectedLetter, setSelectedLetter] = useState<AppointmentLetterData | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [showLetterheadModal, setShowLetterheadModal] = useState(false);
  const [showSmsConfigModal, setShowSmsConfigModal] = useState(false);

  // Dedicated Letterhead Preview & Bulk Print/Download Modals
  const [showLetterheadPreviewModal, setShowLetterheadPreviewModal] = useState(false);
  const [letterheadPreviewTab, setLetterheadPreviewTab] = useState<'sheet' | 'sample'>('sample');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  
  // Letterhead State
  const [letterheadSettings, setLetterheadSettings] = useState<LetterheadSettings>({
    letterheadUrl: null,
    active: true
  });
  const [uploadingLetterhead, setUploadingLetterhead] = useState(false);

  // SMS Gateway state
  const [smsConfig, setSmsConfig] = useState({
    configured: false,
    provider: 'FAST2SMS',
    senderId: 'MSSNGO',
    maskedApiKey: ''
  });
  const [newSmsApiKey, setNewSmsApiKey] = useState('');
  const [newSmsProvider, setNewSmsProvider] = useState('FAST2SMS');
  const [newSmsSenderId, setNewSmsSenderId] = useState('MSSNGO');
  const [savingSms, setSavingSms] = useState(false);
  const [testMobile, setTestMobile] = useState('');
  const [testingSms, setTestingSms] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Retrying state
  const [retryingLetterId, setRetryingLetterId] = useState<string | null>(null);

  // Existing Members & Officers for Nomination
  const [existingCandidates, setExistingCandidates] = useState<any[]>([]);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);

  // Nominate Officer Form State
  const [nominateForm, setNominateForm] = useState({
    officerName: '',
    officerPhone: '',
    officerEmail: '',
    designation: 'District Coordinator',
    level: 'district',
    state: 'Uttar Pradesh',
    district: '',
    address: '',
    notes: ''
  });
  const [nominating, setNominating] = useState(false);

  // 1. Listen to Appointment Letters & Existing Members/Officers
  useEffect(() => {
    const q = query(collection(db, 'appointment_letters'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppointmentLetterData));
      setLetters(list);
      setLoading(false);
    }, (err) => {
      console.error("Error listening to appointment letters:", err);
      setLoading(false);
    });

    // Listen to existing members and officers
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((u: any) => u.role === 'member' || u.role === 'officer' || u.role === 'admin');
      setExistingCandidates(list);
    });

    return () => {
      unsub();
      unsubUsers();
    };
  }, []);

  // 2. Fetch Letterhead & SMS Config
  useEffect(() => {
    async function fetchLetterhead() {
      try {
        const snap = await getDoc(doc(db, 'settings', 'letterhead'));
        if (snap.exists()) {
          setLetterheadSettings(snap.data() as LetterheadSettings);
        }
      } catch (e) {
        console.error("Error fetching letterhead settings", e);
      }
    }
    fetchLetterhead();

    async function fetchSmsStatus() {
      try {
        const res = await fetch('/api/admin/config/sms');
        const data = await res.json();
        setSmsConfig(data);
        if (data.provider) setNewSmsProvider(data.provider);
        if (data.senderId) setNewSmsSenderId(data.senderId);
      } catch (e) {
        console.error("Error fetching SMS config status", e);
      }
    }
    fetchSmsStatus();
  }, []);

  // Retry SMS Notification
  const handleRetrySMS = async (letter: AppointmentLetterData) => {
    if (!letter.id) return;
    setRetryingLetterId(letter.id);
    try {
      const res = await retryAppointmentSMS(letter.id);
      if (res.sent) {
        alert(`SMS sent successfully to ${res.recipientNumber}!`);
      } else {
        alert(`SMS could not be delivered: ${res.error || 'Failed at SMS gateway'}`);
      }
    } catch (err: any) {
      alert(`Error retrying SMS: ${err.message}`);
    } finally {
      setRetryingLetterId(null);
    }
  };

  // Letterhead Upload
  const handleLetterheadUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Please upload an image (PNG, JPG) or PDF file for the letterhead.');
      return;
    }

    setUploadingLetterhead(true);
    try {
      let finalBase64 = '';
      if (file.type.startsWith('image/')) {
        // High quality compression preserving letterhead clarity
        finalBase64 = await compressImage(file, 1600, "image/png", 0.92);
      } else {
        // PDF reading as base64 data URI
        finalBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const updatedData: LetterheadSettings = {
        letterheadUrl: finalBase64,
        uploadedAt: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size,
        active: true,
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'settings', 'letterhead'), updatedData, { merge: true });
      setLetterheadSettings(updatedData);
      alert('Official Letterhead uploaded and activated successfully!');
    } catch (err) {
      console.error("Error uploading letterhead:", err);
      alert("Failed to upload letterhead. Please try a standard PNG or JPG file.");
    } finally {
      setUploadingLetterhead(false);
    }
  };

  const handleRemoveLetterhead = async () => {
    if (!window.confirm("Are you sure you want to reset to the default MSS official letterhead?")) return;
    try {
      await updateDoc(doc(db, 'settings', 'letterhead'), {
        letterheadUrl: null,
        active: false,
        updatedAt: new Date().toISOString()
      });
      setLetterheadSettings(prev => ({ ...prev, letterheadUrl: null, active: false }));
      alert("Reset to default official MSS Letterhead.");
    } catch (err) {
      alert("Error removing custom letterhead.");
    }
  };

  // Save SMS Gateway Config
  const handleSaveSmsConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSms(true);
    try {
      const res = await fetch('/api/admin/config/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: newSmsProvider,
          apiKey: newSmsApiKey,
          senderId: newSmsSenderId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("SMS Gateway configuration saved successfully!");
        setSmsConfig(prev => ({
          ...prev,
          configured: true,
          provider: newSmsProvider,
          senderId: newSmsSenderId,
          maskedApiKey: newSmsApiKey ? "••••••••" + newSmsApiKey.slice(-4) : prev.maskedApiKey
        }));
        setNewSmsApiKey('');
        setShowSmsConfigModal(false);
      } else {
        alert(data.error || "Failed to save SMS settings.");
      }
    } catch (err: any) {
      alert("Error saving SMS config: " + err.message);
    } finally {
      setSavingSms(false);
    }
  };

  const handleTestSms = async () => {
    if (!testMobile) {
      alert("Please enter a mobile number to test.");
      return;
    }
    setTestingSms(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testMobile })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setTestingSms(false);
    }
  };

  const handleSelectCandidate = (candidate: any) => {
    setSelectedCandidate(candidate);
    setNominateForm({
      officerName: candidate.name || '',
      officerPhone: candidate.phone || '',
      officerEmail: candidate.email || '',
      designation: candidate.designation || 'District Coordinator',
      level: candidate.level || 'district',
      state: candidate.state || 'Uttar Pradesh',
      district: candidate.district || '',
      address: candidate.address || '',
      notes: ''
    });
  };

  // Submit New Officer Nomination from Existing Member / Officer
  const handleNominateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) {
      alert("कृपया संगठन के मौजूदा सदस्यों या अधिकारियों की सूची में से किसी एक को चुनें।\nPlease select an existing registered Member or Officer from the list.");
      return;
    }

    if (!nominateForm.officerPhone) {
      alert("पंजीकृत मोबाइल नंबर आवश्यक है। Registered mobile number is required.");
      return;
    }

    setNominating(true);
    try {
      // 1. Maintain existing officerId or generate a new one
      let assignedOfficerId = selectedCandidate.officerId;
      if (!assignedOfficerId) {
        assignedOfficerId = await generateId('officer');
      }

      const now = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(now.getFullYear() + 1);

      // 2. Update existing member/officer document in Firestore
      const userUpdateData: any = {
        role: 'officer',
        status: 'active',
        officerId: assignedOfficerId,
        designation: nominateForm.designation,
        level: nominateForm.level,
        state: nominateForm.state,
        district: nominateForm.district,
        officerAppointmentDate: now.toISOString(),
        validUntil: expiryDate.toISOString()
      };
      if (nominateForm.address) userUpdateData.address = nominateForm.address;
      if (nominateForm.officerPhone) userUpdateData.phone = nominateForm.officerPhone;

      await updateDoc(doc(db, 'users', selectedCandidate.id), userUpdateData);

      // 3. Create official Appointment Letter and dispatch SMS to registered phone
      const appointmentDoc = await createOfficerAppointmentRecord({
        userId: selectedCandidate.id,
        officerId: assignedOfficerId,
        officerName: selectedCandidate.name,
        officerPhone: nominateForm.officerPhone,
        officerEmail: selectedCandidate.email || nominateForm.officerEmail,
        designation: nominateForm.designation,
        level: nominateForm.level,
        state: nominateForm.state,
        district: nominateForm.district,
        address: nominateForm.address || selectedCandidate.address || '',
        notes: nominateForm.notes
      });

      // Show delivery and nomination confirmation
      if (appointmentDoc.smsNotification.sent) {
        alert(`सफलतापूर्वक मनोनीत!\n• अधिकारी: ${selectedCandidate.name}\n• Officer ID: ${assignedOfficerId}\n• पद: ${nominateForm.designation}\n• आधिकारिक नियुक्ति पत्र तैयार हो गया और ${nominateForm.officerPhone} पर SMS डिलीवर हो गया।`);
      } else {
        alert(`सफलतापूर्वक मनोनीत!\n• अधिकारी: ${selectedCandidate.name}\n• Officer ID: ${assignedOfficerId}\n• पद: ${nominateForm.designation}\n• आधिकारिक नियुक्ति पत्र तैयार हो गया।\n\n⚠️ SMS सूचना स्थिति: ${appointmentDoc.smsNotification.error || 'SMS नहीं भेजा जा सका'}. आप सूची से कभी भी पुनः प्रयास (Retry) कर सकते हैं।`);
      }

      setShowNominateModal(false);
      setSelectedCandidate(null);
      setCandidateSearch('');
    } catch (err: any) {
      console.error("Error nominating officer:", err);
      alert("Error nominating officer: " + err.message);
    } finally {
      setNominating(false);
    }
  };

  // Sample Appointment Letter for Letterhead Preview
  const sampleAppointmentLetter: AppointmentLetterData = {
    id: 'sample-preview-letter',
    userId: 'sample-user-id',
    officerId: 'MSS-OFF-0001',
    officerName: 'श्री / सुश्री अधिकारी का नाम (Sample Officer Name)',
    officerPhone: '9876543210',
    officerEmail: 'officer@manavsamanta.org',
    designation: 'District Coordinator (जिला समन्वयक)',
    level: 'district',
    state: 'Uttar Pradesh',
    district: 'Meerut',
    address: 'मानव समानता संगठन जिला कार्यालय, मेरठ, उत्तर प्रदेश',
    appointmentDate: new Date().toISOString(),
    issueDate: new Date().toISOString(),
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active',
    customLetterheadUsed: Boolean(letterheadSettings.letterheadUrl),
    issuedByName: 'Gulfam Siddique',
    issuedByDesignation: 'Founder & Chief Secretary',
    refNumber: `MSS/HO/APPT/${new Date().getFullYear()}/0001`,
    letterheadUrl: letterheadSettings.letterheadUrl,
    smsNotification: {
      sent: true,
      status: 'DELIVERED',
      recipientNumber: '9876543210',
      messageContent: 'Welcome to Manav Samanta Sangthan!',
      retryCount: 0,
      sentAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Bulk Download All PDFs one-by-one
  const handleDownloadAllPdfs = async () => {
    if (filteredLetters.length === 0) {
      alert("डाउनलोड करने के लिए कोई पत्र उपलब्ध नहीं है (No letters to download).");
      return;
    }

    setBulkDownloading(true);
    setBulkProgress({ current: 0, total: filteredLetters.length });

    try {
      for (let i = 0; i < filteredLetters.length; i++) {
        const letter = filteredLetters[i];
        setBulkProgress({ current: i + 1, total: filteredLetters.length });

        const el = document.getElementById(`bulk-letter-doc-${letter.id}`);
        if (el) {
          const dataUrl = await htmlToImage.toPng(el, {
            pixelRatio: 2.5,
            backgroundColor: '#ffffff',
            cacheBust: true
          });
          const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
          const safeName = (letter.officerName || 'Officer').replace(/[^a-zA-Z0-9]/g, '_');
          pdf.save(`Appointment_Letter_${safeName}_${letter.officerId || i + 1}.pdf`);
          // Delay to give browser breathing room
          await new Promise(r => setTimeout(r, 650));
        }
      }
      alert(`सफलतापूर्वक सभी ${filteredLetters.length} नियुक्ति पत्र डाउनलोड कर दिए गए हैं!`);
    } catch (err: any) {
      console.error("Bulk download error:", err);
      alert("Notice: You can also use the 'Print / Save All as PDF' button to save all letters together in one consolidated PDF!");
    } finally {
      setBulkDownloading(false);
    }
  };

  // Filtered Letters
  const filteredLetters = letters.filter(l => {
    const matchesSearch = 
      l.officerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.officerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.refNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.officerPhone?.includes(searchTerm);

    if (!matchesSearch) return false;
    if (statusFilter === 'delivered') return l.smsNotification?.status === 'DELIVERED';
    if (statusFilter === 'failed') return l.smsNotification?.status === 'FAILED';
    if (statusFilter === 'config_required') return l.smsNotification?.status === 'CONFIG_REQUIRED';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Officer Appointments & Nomination Letters</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage official appointment letters, dispatch logs, letterhead templates, and live SMS notifications.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Letterhead Preview Button */}
          <button
            onClick={() => setShowLetterheadPreviewModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl shadow-sm transition-colors"
            title="Preview how the official letterhead looks"
          >
            <Eye className="w-4 h-4 text-emerald-700" /> Letterhead Preview (लेटरहेड प्रीव्यू)
          </button>

          {/* Bulk Download / Print All Button */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-blue-800 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl shadow-sm transition-colors"
            title="Download or Print all officer appointment letters at once"
          >
            <Download className="w-4 h-4 text-blue-700" /> Download All (सभी का डाउनलोड/प्रिंट)
          </button>

          <button
            onClick={() => setShowLetterheadModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm transition-colors"
          >
            <Upload className="w-4 h-4 text-emerald-600" /> Letterhead Upload
          </button>

          <button
            onClick={() => setShowSmsConfigModal(true)}
            className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl shadow-sm transition-colors border ${
              smsConfig.configured 
                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' 
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
          >
            <Settings className="w-4 h-4 text-amber-600" />
            SMS Gateway {smsConfig.configured ? '(Active)' : '(Setup Required)'}
          </button>

          <button
            onClick={() => setShowNominateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Nominate Officer
          </button>
        </div>
      </div>

      {/* Gateway Alert if not configured */}
      {!smsConfig.configured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">SMS Gateway Configuration Pending</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Real mobile SMS notifications will not be sent until you configure your Fast2SMS or Twilio API key.
                Click <strong>"Configure SMS Gateway"</strong> to enter your key and enable automated mobile notifications.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSmsConfigModal(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
          >
            Configure Gateway
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Nominated Officers</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{letters.length}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">SMS Delivered</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {letters.filter(l => l.smsNotification?.status === 'DELIVERED').length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">SMS Failed / Pending</span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {letters.filter(l => l.smsNotification?.status === 'FAILED').length}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Active Letterhead Template</span>
            <div className="text-sm font-bold text-slate-900 mt-2 flex items-center gap-1.5">
              {letterheadSettings.letterheadUrl ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Custom Uploaded
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                  Default MSS Official
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowLetterheadPreviewModal(true)}
            className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1.5 w-fit"
          >
            <Eye className="w-3.5 h-3.5" /> Click to Preview Letterhead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Name, Officer ID, Phone, Area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">SMS Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Statuses ({letters.length})</option>
              <option value="delivered">Delivered ({letters.filter(l => l.smsNotification?.status === 'DELIVERED').length})</option>
              <option value="failed">Failed ({letters.filter(l => l.smsNotification?.status === 'FAILED').length})</option>
              <option value="config_required">Setup Required</option>
            </select>
          </div>

          {/* Bulk Download / Print Button */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
            title="Download or Print all filtered letters"
          >
            <Download className="w-3.5 h-3.5" /> Download / Print All ({filteredLetters.length})
          </button>
        </div>
      </div>

      {/* Letters Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-medium">Officer Details</th>
                <th className="px-6 py-4 font-medium">Designation & Area</th>
                <th className="px-6 py-4 font-medium">Ref No. & Date</th>
                <th className="px-6 py-4 font-medium">SMS Notification</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading appointment records...</td></tr>
              ) : filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-700">No appointment letters found.</p>
                    <p className="text-xs text-slate-400 mt-1">Nominate an officer or approve an officer application to generate letters automatically.</p>
                  </td>
                </tr>
              ) : (
                filteredLetters.map((letter) => {
                  const sms = letter.smsNotification;
                  const isRetrying = retryingLetterId === letter.id;

                  return (
                    <tr key={letter.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Officer */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{letter.officerName}</div>
                        <div className="text-xs font-mono font-medium text-emerald-700">{letter.officerId}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {letter.officerPhone || 'No Phone'}
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{letter.designation}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {[letter.district, letter.state].filter(Boolean).join(', ') || letter.level || 'All India'}
                        </div>
                      </td>

                      {/* Ref & Date */}
                      <td className="px-6 py-4">
                        <div className="text-xs font-mono font-medium text-slate-800">{letter.refNumber}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {new Date(letter.appointmentDate || letter.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>

                      {/* SMS Status */}
                      <td className="px-6 py-4">
                        {sms?.status === 'DELIVERED' ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full w-fit">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Delivered
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {sms.sentAt ? new Date(sms.sentAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Confirmed'}
                            </span>
                          </div>
                        ) : sms?.status === 'CONFIG_REQUIRED' ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full w-fit">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Setup Required
                            </span>
                            <span className="text-[11px] text-slate-500" title={sms.error}>Gateway Key Missing</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full w-fit" title={sms?.error}>
                              <XCircle className="w-3.5 h-3.5 text-rose-600" /> Failed
                            </span>
                            <span className="text-[11px] text-rose-500 truncate max-w-[140px]" title={sms?.error}>
                              {sms?.error || 'SMS not delivered'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Preview Letter */}
                          <button
                            onClick={() => {
                              setSelectedLetter(letter);
                              setShowPreviewModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                            title="Preview Letter in full A4 view"
                          >
                            <Eye className="w-3.5 h-3.5" /> देखें (Preview)
                          </button>

                          {/* Direct Download PDF */}
                          <button
                            onClick={() => {
                              setSelectedLetter(letter);
                              setShowPreviewModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 rounded-lg text-xs font-semibold transition-all shadow-2xs"
                            title="Download Official A4 PDF"
                          >
                            <Download className="w-3.5 h-3.5" /> डाउनलोड PDF
                          </button>

                          {/* Retry SMS */}
                          <button
                            onClick={() => handleRetrySMS(letter)}
                            disabled={isRetrying}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              sms?.status === 'DELIVERED'
                                ? 'text-slate-400 border-slate-200 hover:text-slate-600 hover:bg-slate-100'
                                : 'text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100'
                            }`}
                            title={sms?.status === 'DELIVERED' ? 'SMS already delivered. Click to resend.' : 'Click to send / retry SMS'}
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && selectedLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-6">
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Official Letter Preview</h3>
                <p className="text-xs text-slate-500">Ref: {selectedLetter.refNumber} • Officer: {selectedLetter.officerName}</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              <AppointmentLetterDoc appointment={selectedLetter} showControls={true} />
            </div>
          </div>
        </div>
      )}

      {/* Letterhead Management Modal */}
      {showLetterheadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 relative">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Official Letterhead Management</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload, replace, and preview the organization's official letterhead.</p>
              </div>
              <button onClick={() => setShowLetterheadModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Current Letterhead Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Current Active Letterhead</label>
                {letterheadSettings.letterheadUrl ? (
                  <div className="relative border-2 border-emerald-500/40 rounded-xl overflow-hidden bg-slate-50 p-2">
                    <img
                      src={letterheadSettings.letterheadUrl}
                      alt="Current Letterhead"
                      className="w-full max-h-48 object-contain rounded-lg border border-slate-200"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-1">
                      <span className="font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Custom Letterhead Active
                      </span>
                      <button
                        onClick={handleRemoveLetterhead}
                        className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Reset to Default
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">Built-in MSS Letterhead Active</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Currently using the pre-designed official MSS letterhead with organization registration details, motto, and logo.
                    </p>
                  </div>
                )}
              </div>

              {/* Upload New Letterhead Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Upload New Letterhead (PNG, JPG, or PDF)</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, application/pdf"
                    onChange={handleLetterheadUpload}
                    disabled={uploadingLetterhead}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2.5 file:px-4
                      file:rounded-xl file:border-0
                      file:text-sm file:font-semibold
                      file:bg-emerald-50 file:text-emerald-700
                      hover:file:bg-emerald-100
                      cursor-pointer border border-slate-200 rounded-xl p-1"
                  />
                  {uploadingLetterhead && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Tip: Upload a crisp A4-proportioned image (e.g. 2480 × 3508 px or 1200 × 1700 px). It will automatically be used as the background template for all future officer appointment letters.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLetterheadModal(false);
                  setShowLetterheadPreviewModal(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" /> Full-Screen Letterhead Preview (पूरा प्रीव्यू देखें)
              </button>

              <button
                onClick={() => setShowLetterheadModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Letterhead Preview Modal */}
      {showLetterheadPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col my-4">
            {/* Header */}
            <div className="p-4 px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">Official Letterhead Preview (आधिकारिक लेटरहेड प्रीव्यू)</h3>
                  {letterheadSettings.letterheadUrl ? (
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Custom Uploaded Active
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-700 bg-slate-200 px-2.5 py-0.5 rounded-full">
                      Default MSS Official Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect the official letterhead background and see how nomination letters appear when printed on this letterhead.
                </p>
              </div>

              {/* Tabs & Controls */}
              <div className="flex items-center gap-2">
                <div className="bg-slate-200 p-1 rounded-xl flex items-center text-xs font-semibold">
                  <button
                    onClick={() => setLetterheadPreviewTab('sheet')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      letterheadPreviewTab === 'sheet'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Letterhead Sheet (केवल लेटरहेड)
                  </button>
                  <button
                    onClick={() => setLetterheadPreviewTab('sample')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      letterheadPreviewTab === 'sample'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Sample Nomination Letter (नियुक्ति पत्र नमूना)
                  </button>
                </div>

                <button
                  onClick={() => setShowLetterheadPreviewModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
              {letterheadPreviewTab === 'sample' ? (
                /* Sample Letter rendered on this letterhead */
                <AppointmentLetterDoc appointment={sampleAppointmentLetter} showControls={true} />
              ) : (
                /* Pure Letterhead Sheet */
                <div className="w-[794px] min-h-[1123px] bg-white shadow-2xl rounded-sm border border-slate-300 relative overflow-hidden flex flex-col justify-between">
                  {letterheadSettings.letterheadUrl ? (
                    <img
                      src={letterheadSettings.letterheadUrl}
                      alt="Official Letterhead Background"
                      className="w-full h-full object-fill"
                    />
                  ) : (
                    /* Built-in Letterhead display */
                    <div className="w-full h-full flex flex-col justify-between bg-white relative">
                      {/* Top Tricolor Accent Bar */}
                      <div>
                        <div className="h-2.5 w-full bg-gradient-to-r from-[#ff9933] via-white to-[#138808]"></div>
                        <div className="px-8 pt-6 pb-4 bg-gradient-to-b from-[#f4fbf7] to-white border-b-2 border-[#dc6b29]/60">
                          <div className="flex items-center justify-between gap-4">
                            <div className="w-20 h-20 shrink-0 flex items-center justify-center bg-white rounded-full p-1 shadow-sm border border-[#1a5d48]/20">
                              <div className="w-full h-full rounded-full bg-[#1a5d48] flex items-center justify-center text-white">
                                <Shield className="w-10 h-10 text-[#e2c262]" />
                              </div>
                            </div>
                            <div className="text-center flex-1">
                              <h1 className="text-2xl font-black text-[#1a5d48] tracking-wide uppercase font-serif">
                                MANAV SAMANTA SANGTHAN
                              </h1>
                              <p className="text-base font-bold text-slate-800 tracking-wider">
                                मानव समानता संगठन
                              </p>
                              <p className="text-xs text-slate-600 italic font-medium mt-0.5">
                                "पहले इंसान, फिर धर्म" (Reg. No. MSS/2024/7821)
                              </p>
                            </div>
                            <div className="w-20 shrink-0"></div>
                          </div>
                        </div>
                      </div>

                      {/* Watermark / Blank Content Area */}
                      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-300">
                        <div className="w-48 h-48 rounded-full border-4 border-dashed border-slate-200 flex items-center justify-center text-slate-300 mb-3">
                          <Shield className="w-24 h-24" />
                        </div>
                        <span className="text-sm font-semibold text-slate-400">
                          Official Letterhead Body Space (पत्र की विषय-वस्तु का स्थान)
                        </span>
                        <span className="text-xs text-slate-400 max-w-md mt-1">
                          Nomination details, officer name, designation, tenure, seal, Chief Secretary signature, and QR code are printed automatically in this area.
                        </span>
                      </div>

                      {/* Letterhead Footer */}
                      <div className="border-t-2 border-[#1a5d48] bg-gradient-to-r from-[#1a5d48] via-[#24775d] to-[#1a5d48] text-white px-8 py-3 text-center text-[10px]">
                        <p className="font-semibold tracking-wide">
                          मानव समानता संगठन (पंजीकृत) • Head Office: MSS Bhavan, Meerut / Delhi NCR, India
                        </p>
                        <p className="text-emerald-100/90 mt-0.5">
                          Email: contact@manavsamanta.org • Helpline: +91 98765 43210 • Web: www.manavsamanta.org
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 px-6 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 rounded-b-2xl">
              <button
                onClick={() => {
                  setShowLetterheadPreviewModal(false);
                  setShowLetterheadModal(true);
                }}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Different Letterhead (दूसरा लेटरहेड अपलोड करें)
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save Letterhead
                </button>
                <button
                  onClick={() => setShowLetterheadPreviewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Print & Download All Letters Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col my-4">
            {/* Header */}
            <div className="p-4 px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 rounded-t-2xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Bulk Download & Print Appointment Letters (सभी नियुक्ति पत्र डाउनलोड/प्रिंट करें)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Currently showing <strong>{filteredLetters.length}</strong> officer appointment letters. Print all together or download individual PDF files.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                {/* 1-Click Print All to PDF */}
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print / Save All as PDF (सभी एक साथ प्रिंट करें)
                </button>

                {/* Download All Individual Files */}
                <button
                  onClick={handleDownloadAllPdfs}
                  disabled={bulkDownloading || filteredLetters.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
                >
                  {bulkDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {bulkDownloading 
                    ? `Downloading (${bulkProgress.current}/${bulkProgress.total})...`
                    : `Download All as PDFs (${filteredLetters.length} Files)`}
                </button>

                <button
                  onClick={() => setShowBulkModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* List of all letters */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex flex-col items-center gap-8">
              {filteredLetters.length === 0 ? (
                <div className="bg-white p-12 rounded-xl text-center shadow-sm max-w-md w-full">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No appointment letters found.</p>
                  <p className="text-xs text-slate-400 mt-1">Please nominate officers first to generate appointment letters.</p>
                </div>
              ) : (
                filteredLetters.map((letter, idx) => (
                  <div key={letter.id} className="w-full flex flex-col items-center">
                    <div className="w-[794px] mb-2 flex items-center justify-between text-xs text-slate-500 font-semibold px-2 print:hidden">
                      <span>Officer #{idx + 1}: {letter.officerName} ({letter.officerId})</span>
                      <span>Ref: {letter.refNumber}</span>
                    </div>

                    <div id={`bulk-letter-doc-${letter.id}`} className="print:break-after-page shadow-xl">
                      <AppointmentLetterDoc appointment={letter} showControls={false} />
                    </div>

                    {idx < filteredLetters.length - 1 && (
                      <div className="w-[794px] my-6 border-b-2 border-dashed border-slate-300 text-center text-xs text-slate-400 py-2 print:hidden font-mono">
                        --- Page {idx + 1} End / Next Officer Appointment Letter ---
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SMS Gateway Config Modal */}
      {showSmsConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">SMS Gateway Configuration</h3>
                <p className="text-xs text-slate-500 mt-0.5">Secure API credentials for automatic mobile appointment alerts.</p>
              </div>
              <button onClick={() => setShowSmsConfigModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSmsConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">SMS Provider</label>
                <select
                  value={newSmsProvider}
                  onChange={(e) => setNewSmsProvider(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="FAST2SMS">Fast2SMS (Recommended for India - Quick/Instant Delivery)</option>
                  <option value="TWILIO">Twilio (International & India)</option>
                  <option value="CUSTOM_WEBHOOK">Custom HTTP Webhook / MSG91 Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  API Key / Token
                </label>
                <input
                  type="password"
                  placeholder={smsConfig.maskedApiKey ? `Current: ${smsConfig.maskedApiKey} (Leave blank to keep)` : "Enter Gateway API Key"}
                  value={newSmsApiKey}
                  onChange={(e) => setNewSmsApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  For Fast2SMS: Sign up on fast2sms.com and copy your API Authorization Key from Dev API.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Sender ID / Brand Tag</label>
                <input
                  type="text"
                  placeholder="e.g. MSSNGO"
                  value={newSmsSenderId}
                  onChange={(e) => setNewSmsSenderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSms}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50"
                >
                  {savingSms ? 'Saving Configuration...' : 'Save SMS Gateway Settings'}
                </button>
              </div>
            </form>

            {/* Test SMS Section */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Test Live SMS Connection</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={testMobile}
                  onChange={(e) => setTestMobile(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleTestSms}
                  disabled={testingSms || !testMobile}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {testingSms ? 'Sending...' : 'Send Test SMS'}
                </button>
              </div>

              {testResult && (
                <div className={`mt-3 p-3 rounded-xl text-xs ${testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  <strong>{testResult.success ? '✓ Delivery Confirmed:' : '✗ Delivery Failed:'}</strong> {testResult.message || testResult.error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nominate Officer Modal - From Existing Members & Officers */}
      {showNominateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Nominate Officer (अधिकारी मनोनयन)</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select from registered members & officers of Manav Samanta Sangthan.
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowNominateModal(false);
                  setSelectedCandidate(null);
                  setCandidateSearch('');
                }} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleNominateSubmit} className="space-y-4">
              {/* STEP 1: Select from existing members / officers */}
              {!selectedCandidate ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    चरण 1: संगठन के पंजीकृत सदस्य या अधिकारी को चुनें (Select Member/Officer) *
                  </label>
                  
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search member by Name, Member ID, Officer ID, Phone, City..."
                      value={candidateSearch}
                      onChange={(e) => setCandidateSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50 shadow-inner">
                    {existingCandidates
                      .filter(c => {
                        if (!candidateSearch) return true;
                        const term = candidateSearch.toLowerCase();
                        return (
                          c.name?.toLowerCase().includes(term) ||
                          c.memberId?.toLowerCase().includes(term) ||
                          c.officerId?.toLowerCase().includes(term) ||
                          c.phone?.includes(term) ||
                          c.district?.toLowerCase().includes(term) ||
                          c.city?.toLowerCase().includes(term)
                        );
                      })
                      .map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCandidate(c)}
                          className="p-3 hover:bg-emerald-50/80 cursor-pointer flex items-center justify-between transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {c.photoUrl ? (
                                <img src={c.photoUrl} alt={c.name} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                c.name?.charAt(0) || 'M'
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-sm group-hover:text-emerald-700 flex items-center gap-2">
                                <span>{c.name}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                  c.role === 'officer' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {c.role} {c.designation ? `(${c.designation})` : ''}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-emerald-800">{c.memberId || c.officerId || 'ID Pending'}</span>
                                {c.phone && <span>• {c.phone}</span>}
                                {c.district && <span>• {c.district}</span>}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-emerald-600 bg-white group-hover:bg-emerald-600 group-hover:text-white px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors">
                            Select
                          </span>
                        </div>
                      ))}

                    {existingCandidates.length === 0 && (
                      <div className="p-6 text-center text-xs text-slate-500">
                        No members or officers currently registered in the database.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Selected Candidate Card */
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-emerald-50 to-[#f0fbf6] border-2 border-emerald-300 rounded-xl p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                        {selectedCandidate.photoUrl ? (
                          <img src={selectedCandidate.photoUrl} alt={selectedCandidate.name} className="w-full h-full object-cover" />
                        ) : (
                          selectedCandidate.name?.charAt(0) || 'M'
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <span>{selectedCandidate.name}</span>
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full capitalize">
                            Selected
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-emerald-800">
                            {selectedCandidate.officerId || selectedCandidate.memberId || 'ID Pending'}
                          </span>
                          <span>• Current: <strong className="capitalize">{selectedCandidate.role}</strong></span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCandidate(null)}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-lg border border-emerald-300 shadow-sm transition-colors"
                    >
                      Change Member
                    </button>
                  </div>

                  {/* STEP 2: Configure Nomination Details */}
                  <div className="pt-1 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Nominated Post / Designation (पदनाम) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. District Coordinator / State President"
                          value={nominateForm.designation}
                          onChange={(e) => setNominateForm({ ...nominateForm, designation: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                          Registered Mobile (10 Digits for SMS) *
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="e.g. 9876543210"
                          value={nominateForm.officerPhone}
                          onChange={(e) => setNominateForm({ ...nominateForm, officerPhone: e.target.value.replace(/\D/g, '') })}
                          className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Level (स्तर)</label>
                        <select
                          value={nominateForm.level}
                          onChange={(e) => setNominateForm({ ...nominateForm, level: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="national">National Level (राष्ट्रीय)</option>
                          <option value="state">State Level (राज्य)</option>
                          <option value="district">District Level (जिला)</option>
                          <option value="block">Block / Tehsil Level (प्रखंड)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">District (जिला)</label>
                        <input
                          type="text"
                          placeholder="e.g. Meerut"
                          value={nominateForm.district}
                          onChange={(e) => setNominateForm({ ...nominateForm, district: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">State (राज्य)</label>
                        <input
                          type="text"
                          placeholder="e.g. Uttar Pradesh"
                          value={nominateForm.state}
                          onChange={(e) => setNominateForm({ ...nominateForm, state: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Official Address</label>
                      <textarea
                        rows={2}
                        placeholder="Official postal address..."
                        value={nominateForm.address}
                        onChange={(e) => setNominateForm({ ...nominateForm, address: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800">
                      <strong>Automatic Actions on Confirm:</strong>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5">
                        <li>Member will be promoted to Officer with unique Officer ID.</li>
                        <li>Official Appointment Letter will be generated on approved letterhead with Chief Secretary signature.</li>
                        <li>Live SMS confirmation will be dispatched to <strong>{nominateForm.officerPhone || 'mobile'}</strong>.</li>
                        <li>Officer can view & download their letter from their dashboard immediately.</li>
                      </ul>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowNominateModal(false);
                          setSelectedCandidate(null);
                          setCandidateSearch('');
                        }}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 text-sm font-semibold rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={nominating}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                      >
                        {nominating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {nominating ? 'Processing Nomination...' : 'Confirm Nomination & Issue Letter'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
