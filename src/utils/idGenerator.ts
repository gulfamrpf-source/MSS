import { doc, runTransaction, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export async function generateId(type: 'member' | 'officer'): Promise<string> {
  const counterRef = doc(db, 'counters', 'id_counters');
  
  return await runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    let currentCount = 0;
    if (!counterDoc.exists()) {
      // If it doesn't exist, we can't update it in transaction immediately if we just created it.
      // Wait, we can set it.
      transaction.set(counterRef, { member_count: 0, officer_count: 0 });
    } else {
      currentCount = counterDoc.data()[`${type}_count`] || 0;
    }
    
    const nextCount = currentCount + 1;
    const paddingCount = nextCount.toString().padStart(5, '0');
    const newId = `MSS-${type === 'member' ? 'M' : 'O'}-${paddingCount}`;
    
    // Use update if existed, set if not. But set with merge works for both.
    transaction.set(counterRef, {
      [`${type}_count`]: nextCount
    }, { merge: true });
    
    return newId;
  });
}