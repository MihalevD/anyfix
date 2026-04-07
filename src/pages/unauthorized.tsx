// AnyFix – src/pages/unauthorized.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function UnauthorizedPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg,#122338 0%,#1E3A5F 60%,#2a4f82 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: '44px 40px',
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,.25)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>

        <h1 style={{
          fontFamily: 'Syne,sans-serif',
          fontWeight: 800,
          fontSize: '1.8rem',
          color: '#1E3A5F',
          margin: '0 0 12px'
        }}>
          Access Denied
        </h1>

        <p style={{
          color: '#6B7280',
          fontSize: '.95rem',
          margin: '0 0 24px',
          lineHeight: 1.6
        }}>
          You don't have permission to access this page.
          {user?.role && ` Your current role is: ${user.role}`}
        </p>

        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: '#1E3A5F',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 12,
              fontFamily: 'Outfit,sans-serif',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>

          <button
            onClick={() => router.back()}
            style={{
              background: 'transparent',
              color: '#6B7280',
              border: '1px solid #E2E5EA',
              padding: '12px 24px',
              borderRadius: 12,
              fontFamily: 'Outfit,sans-serif',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}