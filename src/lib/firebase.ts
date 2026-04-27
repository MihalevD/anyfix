// AnyFix – src/lib/firebase.ts
// Firebase client – Realtime chat + Push notifications (lazy-initialized)
// All exports are stub-safe: when NEXT_PUBLIC_FIREBASE_* envs are missing,
// chat & push silently no-op so the rest of the app still builds and runs.

import { useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  id?:       string;
  senderId:  string;
  senderName:string;
  content:   string;
  type:      'TEXT' | 'IMAGE' | 'SYSTEM';
  imageUrl?: string;
  createdAt: number;
  flagged?:  boolean;
}

const HAS_FIREBASE = typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Stub for legacy `import { db } from '@/lib/firebase'` usage.
// Pages that use Firestore directly should guard with `if (!db) return null`.
export const db: any = null;

// Lazy holders so the SDK is only imported in the browser when configured.
let appPromise: Promise<any> | null = null;
let dbPromise: Promise<any> | null = null;

async function getApp() {
  if (!HAS_FIREBASE || typeof window === 'undefined') return null;
  if (appPromise) return appPromise;
  appPromise = (async () => {
    const { initializeApp, getApps } = await import('firebase/app');
    const cfg = {
      apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
      storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
      appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
      databaseURL:       `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.europe-west1.firebasedatabase.app`,
    };
    return getApps().length ? getApps()[0] : initializeApp(cfg);
  })();
  return appPromise;
}

async function getDb() {
  if (!HAS_FIREBASE || typeof window === 'undefined') return null;
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const app = await getApp();
    if (!app) return null;
    const { getDatabase } = await import('firebase/database');
    return getDatabase(app);
  })();
  return dbPromise;
}

// Anti-fraud: check before sending
const FRAUD_REGEX = [
  /(\+359|00359|0)[- .]?(87|88|89|98|99)[- .]?\d{3}[- .]?\d{4}/g,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /\b(viber|whatsapp|telegram|messenger)\b/gi,
  /\b(директно|в брой|извън платформата|без фактура)\b/gi,
];

function detectFraud(content: string): { flagged: boolean; reason?: string } {
  for (const re of FRAUD_REGEX) {
    re.lastIndex = 0;
    if (re.test(content)) return { flagged: true, reason: 'Suspicious content' };
  }
  return { flagged: false };
}

export async function sendChatMessage(orderId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) { console.warn('[firebase] not configured — chat disabled'); return; }
  const { ref, push } = await import('firebase/database');
  const { flagged, reason } = detectFraud(message.content);

  const msgRef = ref(db, `chats/${orderId}/messages`);
  await push(msgRef, { ...message, createdAt: Date.now(), flagged, flagReason: reason || null });

  if (flagged) {
    await push(msgRef, {
      senderId: 'system', senderName: 'AnyFix', type: 'SYSTEM',
      content: '⚠️ Suspicious content detected. All payments must go through AnyFix.',
      createdAt: Date.now() + 100, flagged: false,
    });
  }
}

export function subscribeToChat(orderId: string, callback: (messages: ChatMessage[]) => void) {
  let cleanup = () => {};
  (async () => {
    const db = await getDb();
    if (!db) { callback([]); return; }
    const { ref, onValue, off, query, orderByChild, limitToLast } = await import('firebase/database');
    const msgRef = query(ref(db, `chats/${orderId}/messages`), orderByChild('createdAt'), limitToLast(100));
    const handler = (snapshot: any) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((child: any) => messages.push({ id: child.key!, ...child.val() }));
      callback(messages);
    };
    onValue(msgRef, handler);
    cleanup = () => off(msgRef, 'value', handler);
  })();
  return () => cleanup();
}

export async function requestPushPermission(): Promise<string | null> {
  if (typeof window === 'undefined' || !HAS_FIREBASE) return null;
  try {
    const app = await getApp();
    if (!app) return null;
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
    return token || null;
  } catch (err) {
    console.warn('[push] permission denied or error:', err);
    return null;
  }
}

export function useChat(orderId: string, userId: string, userName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToChat(orderId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return unsub;
  }, [orderId]);

  async function send(content: string) {
    if (!content.trim()) return;
    await sendChatMessage(orderId, { senderId: userId, senderName: userName, content: content.trim(), type: 'TEXT' });
  }

  return { messages, loading, send, endRef };
}
