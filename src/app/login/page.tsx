// AnyFix – src/pages/login.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store';
import { useT } from '@/lib/lang';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Enter password'),
});
type F = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuthStore();
  const { t } = useT();
  const l = t.login;
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success(l.success);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || l.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(160deg,#122338 0%,#1E3A5F 60%,#2a4f82 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'white', borderRadius:24, padding:'44px 40px', maxWidth:420, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,.25)' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'2.2rem', color:'#1E3A5F', marginBottom:8 }}>
            Any<span style={{ color:'#E8700A' }}>Fix</span>
          </div>
          <p style={{ color:'#6B7280', fontSize:'.95rem', margin:0 }}>{l.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display:'flex', flexDirection:'column', gap:18 }}>
          <div>
            <label style={labelStyle}>{l.email}</label>
            <input {...register('email')} type="email" placeholder={l.email} style={inputStyle} />
            {errors.email && <span style={errStyle}>{errors.email.message}</span>}
          </div>
          <div>
            <label style={labelStyle}>{l.password}</label>
            <input {...register('password')} type="password" placeholder={l.password} style={inputStyle} />
            {errors.password && <span style={errStyle}>{errors.password.message}</span>}
          </div>

          <div style={{ textAlign:'right', marginTop:-10 }}>
            <Link href="/forgot-password" style={{ fontSize:'.82rem', color:'#E8700A', textDecoration:'none' }}>{l.forgotPassword}</Link>
          </div>

          <button type="submit" disabled={loading} style={{
            background: loading ? '#9CA3AF' : '#1E3A5F',
            color:'white', border:'none', padding:'15px',
            borderRadius:12, fontFamily:'Outfit,sans-serif',
            fontSize:'1rem', fontWeight:600,
            cursor: loading ? 'default' : 'pointer', transition:'background .2s',
          }}>
            {loading ? l.submitting : l.submit}
          </button>

          <p style={{ textAlign:'center', fontSize:'.85rem', color:'#6B7280', margin:0 }}>
            {l.noAccount}{' '}
            <Link href="/register" style={{ color:'#E8700A', fontWeight:600, textDecoration:'none' }}>
              {l.registerLink}
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display:'block', fontWeight:600, fontSize:'.82rem', color:'#1E3A5F', marginBottom:6 };
const inputStyle: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1.5px solid #E2E5EA', borderRadius:10, fontFamily:'Outfit,sans-serif', fontSize:'.9rem', outline:'none', boxSizing:'border-box', color:'#1A1A1A' };
const errStyle:   React.CSSProperties = { display:'block', fontSize:'.75rem', color:'#DC2626', marginTop:4 };
