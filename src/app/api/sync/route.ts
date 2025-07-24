
import { NextResponse } from 'next/server';
import { getLists, getUnsubscribedSubscribers } from '@/lib/epmailpro';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, getDocs, query } from 'firebase/firestore';
import type { Subscriber, EmailList } from '@/lib/types';

async function storeRawData(collectionName: string, data: any[], idKey: string) {
    if (!data || data.length === 0) return;

    const batch = writeBatch(db);
    const dataCollection = collection(db, collectionName);
    
    // Clear existing data in the collection to ensure a fresh sync
    const existingDocs = await getDocs(query(dataCollection));
    existingDocs.forEach(doc => batch.delete(doc.ref));

    // Add new data
    data.forEach(item => {
        const docRef = doc(dataCollection, item[idKey]);
        batch.set(docRef, item, { merge: true });
    });
    await batch.commit();
}


export async function GET() {
  try {
    // 1. Get all lists
    const lists: EmailList[] = await getLists();
    await storeRawData('rawLists', lists, 'general.list_uid');
    
    if (!lists || lists.length === 0) {
      return NextResponse.json({ message: 'Sync complete. No lists found.' });
    }

    // 2. Fetch unsubscribers for each list
    const unsubscriberPromises = lists.map(list => 
      getUnsubscribedSubscribers(list.general.list_uid)
    );
    const unsubscriberResults = await Promise.allSettled(unsubscriberPromises);

    const allUnsubscribers: Subscriber[] = unsubscriberResults
      .filter((result): result is PromiseFulfilledResult<Subscriber[]> => result.status === 'fulfilled' && result.value !== null)
      .flatMap(result => result.value);

    // 3. De-duplicate subscribers
    const uniqueSubscribersMap = new Map<string, Subscriber>();
    allUnsubscribers.forEach(sub => {
      if (sub && sub.subscriber_uid) {
        uniqueSubscribersMap.set(sub.subscriber_uid, sub);
      }
    });
    const uniqueSubscribers = Array.from(uniqueSubscribersMap.values());

    // 4. Store in Firestore
    await storeRawData('rawUnsubscribes', uniqueSubscribers, 'subscriber_uid');

    return NextResponse.json({ 
        message: 'Sync successful.',
        listCount: lists.length,
        unsubscriberCount: uniqueSubscribers.length,
    });

  } catch (error: any) {
    console.error('Sync failed:', error);
    return NextResponse.json({ message: 'Sync failed', error: error.message }, { status: 500 });
  }
}
