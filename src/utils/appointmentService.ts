import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AppointmentLetterData, SMSDeliveryStatus } from '../types/appointment';

export const CHIEF_SECRETARY_NAME = "Gulfam Siddique";
export const CHIEF_SECRETARY_DESIGNATION = "Founder & Chief Secretary";

/**
 * Generates an official sequential or timestamp-based appointment dispatch reference number.
 * e.g., MSS/HO/APPT/2026/012
 */
export async function generateAppointmentRefNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  try {
    const q = query(
      collection(db, 'appointment_letters'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const snap = await getDocs(q);
    let nextCount = 1;
    if (!snap.empty) {
      const lastDoc = snap.docs[0].data();
      const lastRef = lastDoc.refNumber || '';
      const match = lastRef.match(/\/(\d{3,})$/);
      if (match && match[1]) {
        nextCount = parseInt(match[1], 10) + 1;
      } else {
        nextCount = snap.size + 1;
      }
    }
    const padded = String(nextCount).padStart(3, '0');
    return `MSS/HO/APPT/${currentYear}/${padded}`;
  } catch (err) {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `MSS/HO/APPT/${currentYear}/${randomSuffix}`;
  }
}

/**
 * Constructs official SMS notification message text
 */
export function buildAppointmentSMSMessage(data: {
  officerName: string;
  designation: string;
  officerId: string;
  region?: string;
}): string {
  const areaPart = data.region ? ` (${data.region})` : '';
  const portalUrl = window.location.origin;
  return `Dear ${data.officerName}, Congratulations! You have been appointed as ${data.designation}${areaPart} in Manav Samanta Sangthan (MSS). Your Officer ID is ${data.officerId}. Download your official Appointment Letter from MSS Dashboard: ${portalUrl}/dashboard/appointment-letter . - Gulfam Siddique, Chief Secretary, MSS`;
}

/**
 * Sends SMS via server API and returns result
 */
export async function sendAppointmentSMS(params: {
  to: string;
  message: string;
  officerName: string;
  designation: string;
  officerId: string;
}): Promise<{
  success: boolean;
  status: 'DELIVERED' | 'FAILED' | 'CONFIG_REQUIRED';
  messageId?: string;
  error?: string;
  provider?: string;
}> {
  try {
    const res = await fetch('/api/send-sms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    return {
      success: Boolean(data.success),
      status: data.status || (data.success ? 'DELIVERED' : 'FAILED'),
      messageId: data.messageId,
      error: data.error,
      provider: data.provider
    };
  } catch (err: any) {
    return {
      success: false,
      status: 'FAILED',
      error: err.message || 'Network error calling SMS gateway API'
    };
  }
}

/**
 * Creates and records an official Appointment Letter in Firestore,
 * then dispatches live SMS notification to the Officer's registered phone.
 */
export async function createOfficerAppointmentRecord(params: {
  userId: string;
  officerId: string;
  officerName: string;
  officerPhone: string;
  officerEmail?: string;
  designation: string;
  level?: string;
  state?: string;
  district?: string;
  city?: string;
  address?: string;
  appointmentDate?: string;
  issuedByUid?: string;
  notes?: string;
}): Promise<AppointmentLetterData> {
  const now = new Date();
  const appointmentDate = params.appointmentDate || now.toISOString();
  const refNumber = await generateAppointmentRefNumber();

  // 1. Fetch current active letterhead
  let letterheadUrl: string | null = null;
  try {
    const letterheadSnap = await getDoc(doc(db, 'settings', 'letterhead'));
    if (letterheadSnap.exists() && letterheadSnap.data().active && letterheadSnap.data().letterheadUrl) {
      letterheadUrl = letterheadSnap.data().letterheadUrl;
    }
  } catch (err) {
    console.warn("Could not check custom letterhead:", err);
  }

  // 2. Prepare SMS Message
  const region = [params.district, params.state].filter(Boolean).join(', ') || params.level || '';
  const messageContent = buildAppointmentSMSMessage({
    officerName: params.officerName,
    designation: params.designation,
    officerId: params.officerId,
    region
  });

  // 3. Initial SMS status object
  let smsStatus: SMSDeliveryStatus = {
    sent: false,
    status: 'PENDING',
    recipientNumber: params.officerPhone,
    messageContent,
    retryCount: 0
  };

  // 4. Send SMS if phone is available
  if (params.officerPhone) {
    const smsResult = await sendAppointmentSMS({
      to: params.officerPhone,
      message: messageContent,
      officerName: params.officerName,
      designation: params.designation,
      officerId: params.officerId
    });

    smsStatus = {
      sent: smsResult.success,
      status: smsResult.status,
      recipientNumber: params.officerPhone,
      messageContent,
      messageId: smsResult.messageId,
      provider: smsResult.provider,
      error: smsResult.error,
      sentAt: smsResult.success ? new Date().toISOString() : undefined,
      lastAttemptAt: new Date().toISOString(),
      retryCount: 0
    };
  } else {
    smsStatus.status = 'FAILED';
    smsStatus.error = 'No registered phone number found on Officer profile';
  }

  // 5. Construct document
  // One primary appointment letter per officer or new doc per appointment
  // Let's use `APPT_${params.officerId}` or unique ID
  const docId = `APPT_${params.officerId.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  const expiryDate = new Date(now);
  expiryDate.setFullYear(now.getFullYear() + 1);

  const appointmentRecord: AppointmentLetterData = {
    id: docId,
    refNumber,
    officerId: params.officerId,
    userId: params.userId,
    officerName: params.officerName,
    officerEmail: params.officerEmail || '',
    officerPhone: params.officerPhone,
    designation: params.designation,
    level: params.level || '',
    state: params.state || '',
    district: params.district || '',
    city: params.city || '',
    address: params.address || '',
    appointmentDate,
    issueDate: now.toISOString(),
    validUntil: expiryDate.toISOString(),
    status: 'active',
    letterheadUrl,
    customLetterheadUsed: Boolean(letterheadUrl),
    smsNotification: smsStatus,
    issuedByName: CHIEF_SECRETARY_NAME,
    issuedByDesignation: CHIEF_SECRETARY_DESIGNATION,
    issuedByUid: params.issuedByUid,
    notes: params.notes || '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  await setDoc(doc(db, 'appointment_letters', docId), appointmentRecord, { merge: true });

  // Also update user document with the appointment ref number and letter ID
  try {
    await updateDoc(doc(db, 'users', params.userId), {
      appointmentLetterId: docId,
      appointmentRefNumber: refNumber,
      officerAppointmentDate: appointmentDate
    });
  } catch (e) {
    console.warn("Could not attach appointmentLetterId to user:", e);
  }

  return appointmentRecord;
}

/**
 * Retries sending an SMS for an existing appointment letter document
 */
export async function retryAppointmentSMS(letterId: string): Promise<SMSDeliveryStatus> {
  const docRef = doc(db, 'appointment_letters', letterId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Appointment letter not found');
  }

  const data = snap.data() as AppointmentLetterData;
  const currentRetry = (data.smsNotification?.retryCount || 0) + 1;

  const smsResult = await sendAppointmentSMS({
    to: data.officerPhone,
    message: data.smsNotification?.messageContent || buildAppointmentSMSMessage({
      officerName: data.officerName,
      designation: data.designation,
      officerId: data.officerId,
      region: [data.district, data.state].filter(Boolean).join(', ')
    }),
    officerName: data.officerName,
    designation: data.designation,
    officerId: data.officerId
  });

  const updatedSMSStatus: SMSDeliveryStatus = {
    sent: smsResult.success,
    status: smsResult.status,
    recipientNumber: data.officerPhone,
    messageContent: data.smsNotification?.messageContent || '',
    messageId: smsResult.messageId || data.smsNotification?.messageId,
    provider: smsResult.provider || data.smsNotification?.provider,
    error: smsResult.error,
    sentAt: smsResult.success ? new Date().toISOString() : data.smsNotification?.sentAt,
    lastAttemptAt: new Date().toISOString(),
    retryCount: currentRetry
  };

  await updateDoc(docRef, {
    smsNotification: updatedSMSStatus,
    updatedAt: new Date().toISOString()
  });

  return updatedSMSStatus;
}
