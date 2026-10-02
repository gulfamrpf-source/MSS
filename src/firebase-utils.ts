import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export async function uploadImage(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}


export interface FounderData {
  name: string;
  designation: string;
  biography: string;
  message: string;
  linkedinUrl: string;
  twitterUrl: string;
  email: string;
  photoUrl?: string;
}

export const defaultFounderData: FounderData = {
  name: "Gulfam Siddique",
  designation: "Founder & Chief Secretary",
  biography: "हमारा उद्देश्य केवल सहायता प्रदान करना नहीं, बल्कि समाज के प्रत्येक व्यक्ति को समान अवसर, सम्मान और गरिमापूर्ण जीवन का अधिकार दिलाने की दिशा में निरंतर कार्य करना है।",
  message: "समानता, मानवता और सामाजिक जिम्मेदारी हमारे संगठन के मूल आधार हैं। हमारा प्रयास है कि समाज के हर वर्ग तक अवसर, जागरूकता और सहयोग पहुँचाया जाए तथा एक अधिक न्यायपूर्ण, समावेशी और संवेदनशील समाज का निर्माण किया जा सके।",
  linkedinUrl: "#",
  twitterUrl: "#",
  email: "contact@example.com"
};

export async function getFounderProfile(): Promise<FounderData> {
  try {
    const docRef = doc(db, 'profiles', 'founder');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...defaultFounderData,
        ...data,
        name: data.name && data.name !== 'Founder Name' ? data.name : defaultFounderData.name,
        message: data.message ? data.message : defaultFounderData.message,
        biography: data.biography ? data.biography : defaultFounderData.biography,
        designation: data.designation ? data.designation : defaultFounderData.designation
      } as FounderData;
    }
  } catch (error) {
    console.error("Error fetching founder profile:", error);
  }
  return defaultFounderData;
}

export async function saveFounderProfile(data: FounderData): Promise<void> {
  const docRef = doc(db, 'profiles', 'founder');
  await setDoc(docRef, data, { merge: true });
}
