import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  JournalSession,
  JournalMessage,
  JournalSummary,
  ReflectionIntelligenceReport
} from '../shared/types';

/**
 * Journal Service operates strictly within the authenticated user's isolated Firestore container:
 * /users/{uid}/journals/{journalId}
 * /users/{uid}/journals/{journalId}/messages/{messageId}
 */

export async function createJournalSession(
  uid: string,
  initialTitle: string = 'New Journal Entry'
): Promise<JournalSession> {
  const journalsRef = collection(db, 'users', uid, 'journals');
  const newJournalDoc = doc(journalsRef);
  const now = Date.now();

  const newJournal: JournalSession = {
    id: newJournalDoc.id,
    userId: uid,
    title: initialTitle,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    lastPreview: '',
  };

  await setDoc(newJournalDoc, {
    ...newJournal,
    updatedAtServer: serverTimestamp(),
  });

  return newJournal;
}

export async function getUserJournals(uid: string): Promise<JournalSession[]> {
  const journalsRef = collection(db, 'users', uid, 'journals');
  const q = query(journalsRef, orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<JournalSession, 'id'>),
  }));
}

export async function getJournalSession(
  uid: string,
  journalId: string
): Promise<JournalSession | null> {
  const journalRef = doc(db, 'users', uid, 'journals', journalId);
  const snap = await getDoc(journalRef);

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...(snap.data() as Omit<JournalSession, 'id'>),
  };
}

export async function getJournalMessages(
  uid: string,
  journalId: string
): Promise<JournalMessage[]> {
  const messagesRef = collection(db, 'users', uid, 'journals', journalId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...(docSnap.data() as Omit<JournalMessage, 'id'>),
  }));
}

export async function addJournalMessage(
  uid: string,
  journalId: string,
  role: 'user' | 'model',
  content: string
): Promise<JournalMessage> {
  const messagesRef = collection(db, 'users', uid, 'journals', journalId, 'messages');
  const newMsgDoc = doc(messagesRef);
  const now = Date.now();

  const msg: JournalMessage = {
    id: newMsgDoc.id,
    journalId,
    userId: uid,
    role,
    content,
    createdAt: now,
  };

  await setDoc(newMsgDoc, msg);

  // Update journal metadata
  const journalRef = doc(db, 'users', uid, 'journals', journalId);
  await updateDoc(journalRef, {
    updatedAt: now,
    lastPreview: content.slice(0, 120),
    updatedAtServer: serverTimestamp(),
  });

  return msg;
}

export async function deleteJournalSession(uid: string, journalId: string): Promise<void> {
  // Delete subcollection messages first in batches if any, then delete journal doc
  const messagesRef = collection(db, 'users', uid, 'journals', journalId, 'messages');
  const msgsSnap = await getDocs(messagesRef);
  
  const batch = writeBatch(db);
  msgsSnap.docs.forEach((d) => batch.delete(d.ref));
  
  const journalRef = doc(db, 'users', uid, 'journals', journalId);
  batch.delete(journalRef);

  await batch.commit();
}

export async function saveJournalSummary(
  uid: string,
  journalId: string,
  summary: JournalSummary
): Promise<void> {
  const journalRef = doc(db, 'users', uid, 'journals', journalId);
  await updateDoc(journalRef, {
    summary,
    tags: summary.keyThemes,
    status: 'completed',
    updatedAt: Date.now(),
    updatedAtServer: serverTimestamp(),
  });
}

export async function saveReflectionReport(
  uid: string,
  report: ReflectionIntelligenceReport
): Promise<string> {
  const reflectionsRef = collection(db, 'users', uid, 'reflections');
  const newDoc = doc(reflectionsRef);
  
  const payload = {
    ...report,
    id: newDoc.id,
    userId: uid,
    createdAtServer: serverTimestamp(),
  };

  await setDoc(newDoc, payload);
  return newDoc.id;
}

export async function getLatestReflectionReport(
  uid: string
): Promise<ReflectionIntelligenceReport | null> {
  const reflectionsRef = collection(db, 'users', uid, 'reflections');
  const q = query(reflectionsRef, orderBy('generatedAt', 'desc'));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const firstDoc = snapshot.docs[0];
  return {
    id: firstDoc.id,
    ...(firstDoc.data() as Omit<ReflectionIntelligenceReport, 'id'>),
  };
}
