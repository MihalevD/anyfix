// AnyFix – src/pages/verify-email.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setLoading(false);
      return;
    }

    // Call backend to verify email
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          toast.success('Email verified successfully!');
          setTimeout(() => router.push('/dashboard'), 2000);
        } else {
          setStatus('error');
          toast.error(data.error || 'Invalid verification link');
        }
      })
      .catch(() => {
        setStatus('error');
        toast.error('Verification failed');
      })
      .finally(() => setLoading(false));
  }, [token, router]);

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
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {status === 'verifying' && '⏳'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>

        <h1 style={{
          fontFamily: 'Syne,sans-serif',
          fontWeight: 800,
          fontSize: '1.8rem',
          color: '#1E3A5F',
          margin: '0 0 12px'
        }}>
          {status === 'verifying' && 'Verifying Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        <p style={{
          color: '#6B7280',
          fontSize: '.95rem',
          margin: 0,
          lineHeight: 1.6
        }}>
          {status === 'verifying' && 'Please wait while we verify your email address...'}
          {status === 'success' && 'Your email has been successfully verified. Redirecting to dashboard...'}
          {status === 'error' && 'The verification link is invalid or has expired. Please try registering again.'}
        </p>

        {status === 'error' && (
          <button
            onClick={() => router.push('/register')}
            style={{
              background: '#E8700A',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 12,
              fontFamily: 'Outfit,sans-serif',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 20
            }}
          >
            Register Again
          </button>
        )}
      </div>
    </div>
  );
}