// AnyFix – src/lib/firebase.ts
// Firebase client – Realtime чат + Push известия

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase, ref, push, onValue, off, query, orderByChild, limitToLast, DataSnapshot } from 'firebase/database';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  databaseURL:       `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}-default-rtdb.europe-west1.firebasedatabase.app`,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getDatabase(app);

// ─── CHAT FUNCTIONS ──────────────────────────────────────

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

// Anti-fraud: Check message BEFORE sending
const FRAUD_REGEX = [
  /(\+359|00359|0)[- .]?(87|88|89|98|99)[- .]?\d{3}[- .]?\d{4}/g,
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /\b(viber|whatsapp|telegram|messenger)\b/gi,
  /\b(директно|в брой|извън платформата|без фактура)\b/gi,
];

function detectFraud(content: string): { flagged: boolean; reason?: string } {
  for (const re of FRAUD_REGEX) {
    re.lastIndex = 0;
    if (re.test(content)) return { flagged: true, reason: 'Подозрително съдържание' };
  }
  return { flagged: false };
}

export async function sendChatMessage(orderId: string, message: Omit<ChatMessage, 'id' | 'createdAt'>) {
  const { flagged, reason } = detectFraud(message.content);

  const msgRef = ref(db, `chats/${orderId}/messages`);
  await push(msgRef, {
    ...message,
    createdAt: Date.now(),
    flagged,
    flagReason: reason || null,
  });

  // If flagged, warn the user
  if (flagged) {
    await push(msgRef, {
      senderId:   'system',
      senderName: 'AnyFix',
      content:    '⚠️ Системата засече опит за директен контакт. Всички комуникации трябва да минат през платформата за твоята защита.',
      type:       'SYSTEM',
      createdAt:  Date.now() + 100,
      flagged:    false,
    });
    // Also report to backend
    fetch('/api/messages/flag', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('accessToken')}` },
      body: JSON.stringify({ orderId, content: message.content, reason }),
    }).catch(() => {});
  }
}

export function subscribeToChat(orderId: string, callback: (messages: ChatMessage[]) => void) {
  const msgRef = query(ref(db, `chats/${orderId}/messages`), orderByChild('createdAt'), limitToLast(100));

  const handler = (snapshot: DataSnapshot) => {
    const messages: ChatMessage[] = [];
    snapshot.forEach(child => {
      messages.push({ id: child.key!, ...child.val() });
    });
    callback(messages);
  };

  onValue(msgRef, handler);
  return () => off(msgRef, 'value', handler);  // unsubscribe function
}

// ─── PUSH NOTIFICATIONS ──────────────────────────────────

export async function requestPushPermission(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;
    const messaging = getMessaging(app);
    const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
    if (token) {
      // Register token with backend
      await fetch('/api/notifications/register-token', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ token }),
      });
    }
    return token;
  } catch (err) {
    console.error('[push] Permission denied or error:', err);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: any) => void) {
  if (typeof window === 'undefined') return () => {};
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
}

// ─── Custom hook for chat ─────────────────────────────────
// src/hooks/useChat.ts

import { useEffect, useRef, useState } from 'react';

export function useChat(orderId: string, userId: string, userName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading,  setLoading]  = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeToChat(orderId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
    });
    return unsub;
  }, [orderId]);

  async function send(content: string) {
    if (!content.trim()) return;
    await sendChatMessage(orderId, {
      senderId:   userId,
      senderName: userName,
      content:    content.trim(),
      type:       'TEXT',
    });
  }

  return { messages, loading, send, endRef };
}
