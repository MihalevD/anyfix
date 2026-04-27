// AnyFix – src/pages/verify/index.tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { mastersAPI } from '@/lib/api';

const DOCS = [
  { key:'ID_CARD',         label:'Лична карта',                  icon:'🪪', required:true,  hint:'И двете страни, ясно изображение' },
  { key:'CRIMINAL_RECORD', label:'Свидетелство за съдимост',     icon:'📜', required:true,  hint:'Не по-старо от 6 месеца' },
  { key:'DIPLOMA',         label:'Диплома / Квалификация',       icon:'🎓', required:false, hint:'За лицензирани дейности (електро, ВиК)' },
  { key:'CERTIFICATE',     label:'Сертификат / Лиценз',          icon:'📋', required:false, hint:'Допълнителни квалификации' },
  { key:'INSURANCE',       label:'Застрахователна полица',       icon:'🛡️', required:false, hint:'Гражданска/Професионална отговорност' },
  { key:'PORTFOLIO_PROOF', label:'Доказателства за портфолио',   icon:'📸', required:true,  hint:'Снимки от поне 5 реализирани проекта' },
];

export default function VerifyPage() {
  const [uploads, setUploads] = useState<Record<string, { file:File; status:'pending'|'uploading'|'done'|'error' }>>({});
  const [step, setStep] = useState<'docs'|'test'|'done'>('docs');

  async function uploadDoc(type: string, file: File) {
    setUploads(prev => ({ ...prev, [type]: { file, status:'uploading' } }));
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', type);
      await mastersAPI.uploadDoc(form);
      setUploads(prev => ({ ...prev, [type]: { file, status:'done' } }));
      toast.success(`${type} качен успешно`);
    } catch (err: any) {
      setUploads(prev => ({ ...prev, [type]: { file, status:'error' } }));
      toast.error(err?.response?.data?.error || 'Грешка при качване');
    }
  }

  const requiredDone = DOCS.filter(d => d.required).every(d => uploads[d.key]?.status === 'done');

  return (
    <div style={{ minHeight:'100vh', background:'#F8F6F2', paddingTop:84, paddingBottom:60 }}>
      <div style={{ maxWidth:720, margin:'0 auto', padding:'32px 20px' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🔐</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:'1.8rem', color:'#1E3A5F', margin:'0 0 8px' }}>
            Верификация на профила
          </h1>
          <p style={{ color:'#6B7280', fontSize:'.95rem', maxWidth:500, margin:'0 auto', lineHeight:1.7 }}>
            Качи необходимите документи. Проверката отнема 7–14 дни.
            Само верифицираните майстори получават поръчки.
          </p>
        </div>

        {/* Progress steps */}
        <div style={{ display:'flex', gap:0, marginBottom:40 }}>
          {[['1','Документи'],['2','Тест'],['3','Интервю'],['4','Одобрение']].map(([n, label], i) => (
            <div key={n} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', width:'100%' }}>
                {i > 0 && <div style={{ flex:1, height:2, background:'#E2E5EA' }} />}
                <div style={{ width:34, height:34, borderRadius:'50%', background: i===0 ? '#E8700A' : '#E2E5EA', color: i===0 ? 'white' : '#9CA3AF', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.85rem', flexShrink:0 }}>
                  {n}
                </div>
                {i < 3 && <div style={{ flex:1, height:2, background:'#E2E5EA' }} />}
              </div>
              <span style={{ fontSize:'.7rem', color: i===0 ? '#E8700A' : '#9CA3AF', marginTop:5, fontWeight: i===0 ? 600 : 400 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Documents */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {DOCS.map(doc => (
            <DocUploadCard key={doc.key} doc={doc} state={uploads[doc.key]} onUpload={(f) => uploadDoc(doc.key, f)} />
          ))}
        </div>

        {/* Submit all */}
        <div style={{ background:'white', borderRadius:18, padding:'24px 28px', marginTop:24, boxShadow:'0 2px 8px rgba(30,58,95,.07)' }}>
          <div style={{ background: requiredDone ? '#F0FDF4' : '#FFFBEB', borderRadius:12, padding:16, marginBottom:20 }}>
            <p style={{ fontSize:'.85rem', color: requiredDone ? '#166534' : '#92400E', margin:0, lineHeight:1.6 }}>
              {requiredDone
                ? '✅ Всички задължителни документи са качени. Можеш да продължиш към теста.'
                : '⚠️ Качи всички задължителни документи (отбелязани с *) преди да продължиш.'}
            </p>
          </div>
          <button disabled={!requiredDone} style={{
            background: requiredDone ? '#1E3A5F' : '#D1D5DB',
            color: requiredDone ? 'white' : '#9CA3AF',
            border:'none', padding:'14px', borderRadius:12, width:'100%',
            fontFamily:'Outfit,sans-serif', fontSize:'1rem', fontWeight:600,
            cursor: requiredDone ? 'pointer' : 'default', transition:'background .2s',
          }}>
            {requiredDone ? 'Продължи към теста →' : 'Изчаква документи...'}
          </button>
          <p style={{ textAlign:'center', fontSize:'.75rem', color:'#9CA3AF', marginTop:10 }}>
            Документите се съхраняват криптирано и са достъпни само за верификационния екип.
          </p>
        </div>

        {/* GDPR note */}
        <div style={{ background:'#EAF0F8', borderRadius:12, padding:16, marginTop:16 }}>
          <p style={{ fontSize:'.78rem', color:'#1E3A5F', margin:0, lineHeight:1.7 }}>
            🔒 <strong>GDPR:</strong> Документите ти се обработват единствено за целите на верификацията
            съгласно чл. 6(1)(а) от GDPR. Имаш право да поискаш изтриване по всяко време.
            Виж <a href="/privacy" style={{ color:'#E8700A' }}>Политиката за поверителност</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

function DocUploadCard({ doc, state, onUpload }: { doc: typeof DOCS[0]; state?: { file:File; status:string }; onUpload: (f:File) => void }) {
  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) onUpload(accepted[0]); }, [onUpload]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*':[], 'application/pdf':[] }, maxFiles:1,
  });

  const statusColors = { done:'#166534', error:'#DC2626', uploading:'#1D4ED8', pending:'#6B7280' };
  const statusLabels = { done:'✅ Качен', error:'❌ Грешка – опитай отново', uploading:'⏳ Качване...', pending:'' };

  return (
    <div style={{ background:'white', borderRadius:16, padding:'20px 24px', boxShadow:'0 2px 6px rgba(30,58,95,.06)', border:'1.5px solid #F0F1F3' }}>
      <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:14 }}>
        <span style={{ fontSize:28, flexShrink:0 }}>{doc.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:'.95rem', color:'#1E3A5F' }}>{doc.label}</span>
            {doc.required && <span style={{ background:'#FEF2F2', color:'#DC2626', fontSize:'.68rem', fontWeight:700, padding:'2px 7px', borderRadius:50 }}>Задължително</span>}
          </div>
          <p style={{ fontSize:'.78rem', color:'#6B7280', margin:'3px 0 0' }}>{doc.hint}</p>
        </div>
        {state && (
          <span style={{ fontSize:'.78rem', fontWeight:600, color: statusColors[state.status as keyof typeof statusColors] }}>
            {statusLabels[state.status as keyof typeof statusLabels]}
          </span>
        )}
      </div>

      {state?.status !== 'done' && (
        <div {...getRootProps()} style={{
          border: isDragActive ? '2px dashed #1E3A5F' : '2px dashed #E2E5EA',
          borderRadius:10, padding:'18px', textAlign:'center', cursor:'pointer',
          background: isDragActive ? '#EAF0F8' : '#FAFAFA', transition:'all .2s',
        }}>
          <input {...getInputProps()} />
          {state?.status === 'uploading' ? (
            <p style={{ color:'#1D4ED8', fontSize:'.85rem', margin:0 }}>⏳ Качване...</p>
          ) : (
            <>
              <p style={{ color:'#6B7280', fontSize:'.82rem', margin:0 }}>
                {isDragActive ? 'Пусни файла тук' : 'Провлечи или кликни за избор'}
              </p>
              <p style={{ color:'#9CA3AF', fontSize:'.72rem', margin:'4px 0 0' }}>JPG, PNG, PDF · до 10MB</p>
            </>
          )}
        </div>
      )}

      {state?.status === 'done' && (
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#F0FDF4', borderRadius:10, padding:'10px 14px' }}>
          <span>📄</span>
          <span style={{ fontSize:'.82rem', color:'#166534', fontWeight:500 }}>{state.file.name}</span>
          <span style={{ marginLeft:'auto', fontSize:'.75rem', color:'#9CA3AF' }}>{(state.file.size/1024).toFixed(0)} KB</span>
        </div>
      )}
    </div>
  );
}
