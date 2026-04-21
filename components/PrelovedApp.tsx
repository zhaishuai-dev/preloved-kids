'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const CATEGORIES = ['All', 'Toys', 'Books', 'Clothes', 'Shoes', 'Gear', 'Others'];

const SHOE_SIZE_CHART = [
  { age: '0-3m', eu: '15', uk: '0', cm: '9.0' },
  { age: '0-3m', eu: '16', uk: '0.5', cm: '9.5' },
  { age: '3-6m', eu: '17', uk: '1', cm: '10.0' },
  { age: '3-6m', eu: '18', uk: '2', cm: '10.5' },
  { age: '6-9m', eu: '19', uk: '3', cm: '11.0' },
  { age: '9-12m', eu: '20', uk: '3.5', cm: '11.5' },
  { age: '12-15m', eu: '21', uk: '4.5', cm: '12.5' },
  { age: '15-18m', eu: '22', uk: '5', cm: '13.0' },
  { age: '18-21m', eu: '23', uk: '6', cm: '13.5' },
  { age: '21-24m', eu: '24', uk: '7', cm: '14.5' },
  { age: '2-2.5y', eu: '25', uk: '7.5', cm: '15.0' },
  { age: '2.5-3y', eu: '26', uk: '8.5', cm: '15.5' },
  { age: '3-3.5y', eu: '27', uk: '9', cm: '16.0' },
  { age: '3.5-4y', eu: '28', uk: '10', cm: '17.0' },
  { age: '4-4.5y', eu: '29', uk: '11', cm: '17.5' },
  { age: '4.5-5y', eu: '30', uk: '11.5', cm: '18.0' },
  { age: '5-5.5y', eu: '31', uk: '12.5', cm: '18.5' },
  { age: '5.5-6y', eu: '32', uk: '13', cm: '19.5' },
  { age: '6-7y', eu: '33', uk: '1Y', cm: '20.0' },
  { age: '7-8y', eu: '34', uk: '2Y', cm: '21.0' },
];
const COLLECTION_POINTS = ['Holland Village (Condo Residence)', 'Kent Ridge MRT', 'Delivery (with Grab Fee)'];

const T = {
  bg: '#FAFAF8', card: '#FFFFFF', accent: '#D4603A', accentLight: '#FEF0EB',
  green: '#1D7A50', greenLight: '#E3F3EA',
  text: '#1A1A1A', textSec: '#555555', muted: '#999999',
  border: '#EEEEEE', tag: '#F5F5F3', cardBorder: '#F0F0EE',
  shadow: '0 1px 6px rgba(0,0,0,0.04)',
  shadowH: '0 4px 16px rgba(0,0,0,0.08)',
  headerBg: '#FFFFFF', red: '#E53935', redLight: '#FDECEB',
  archiveBg: '#F0EDE8', archiveText: '#9E9890',
  sellerBadge: '#4A6741', sellerBadgeBg: '#E8F0E6',
};
const ff = "'DM Sans', sans-serif";
const df = "'Fraunces', serif";

interface Listing {
  id: string; title: string; brand: string; category: string; condition: string;
  ageRange: string; price: number; pricingType: string; description: string;
  originalImage: string; photos: string[]; seller: string; location: string;
  whatsapp: string; archived: boolean; views: number; createdAt: string;
}

/* ============ API HELPERS ============ */
async function apiCall(url: string, method: string, pin: string, body?: any) {
  const res = await fetch(url, {
    method, headers: { 'Content-Type': 'application/json', 'x-seller-pin': pin },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return res.json();
}

async function uploadAndAnalyze(base64: string, mediaType: string, pin: string, analyze: boolean) {
  return apiCall('/api/upload', 'POST', pin, { image: base64, mediaType, analyze });
}

/* ============ SHARED COMPONENTS ============ */
function PriceBadge({ price, pricingType, size = 'normal' }: { price: number; pricingType: string; size?: 'normal' | 'large' }) {
  const isLarge = size === 'large';
  if (pricingType === 'free') {
    return <span style={{ color: T.green, fontSize: isLarge ? 18 : 13, fontWeight: 700, fontFamily: ff }}>FREE</span>;
  }
  if (pricingType === 'paywhatyouwant') {
    return <span style={{ color: T.accent, fontSize: isLarge ? 14 : 11, fontWeight: 600, fontFamily: ff }}>Pay What You Want</span>;
  }
  return <span style={{ color: T.accent, fontSize: isLarge ? 20 : 15, fontWeight: 700, fontFamily: ff }}>${price}</span>;
}

function ConditionDot({ condition }: { condition: string }) {
  const c: Record<string, string> = { 'Like New': T.green, Good: '#B8860B', Fair: '#C05A30' };
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: T.textSec, fontWeight: 500, fontFamily: ff }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: c[condition] || '#999' }} />{condition}</span>;
}
function Tag({ children }: { children: React.ReactNode }) { return <span style={{ color: T.muted, fontSize: 11, fontWeight: 500, fontFamily: ff }}>{children}</span>; }
function BrandTag({ brand }: { brand: string }) { if (!brand) return null; return <span style={{ color: '#7C6BC4', fontSize: 11, fontWeight: 600, fontFamily: ff }}>{brand}</span>; }

/* ============ PIN MODAL ============ */
function PinModal({ onSuccess, onClose }: { onSuccess: (pin: string) => void; onClose: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const tryPin = async (p: string) => {
    setLoading(true);
    const res = await fetch('/api/listings?archived=true', { headers: { 'x-seller-pin': p } });
    setLoading(false);
    if (res.ok) { onSuccess(p); }
    else { setError(true); setShake(true); setPin(''); setTimeout(() => setShake(false), 500); }
  };

  const handleDigit = (digit: string) => {
    if (loading) return;
    const next = pin + digit;
    if (next.length > 4) return;
    setPin(next);
    setError(false);
    if (next.length === 4) setTimeout(() => tryPin(next), 150);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, maxWidth: 340, width: '100%', padding: '36px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.15)', textAlign: 'center', animation: shake ? 'shakeX 0.4s ease' : 'none' }}>
        <input ref={inputRef} type="tel" inputMode="numeric" maxLength={4} value={pin}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPin(val); setError(false);
            if (val.length === 4) setTimeout(() => tryPin(val), 150);
          }}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} />
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <h3 style={{ fontFamily: df, fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>Seller Mode</h3>
        <p style={{ fontFamily: ff, fontSize: 13, color: T.muted, margin: '0 0 24px' }}>Enter your PIN to manage listings</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 20 }} onClick={() => inputRef.current?.focus()}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 48, height: 56, borderRadius: 14, border: `2px solid ${error ? T.red : pin.length > i ? T.accent : T.border}`, background: '#FAFAF8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, fontFamily: ff, color: T.text, transition: 'border-color 0.2s' }}>{pin[i] ? '•' : ''}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 220, margin: '0 auto' }}>
          {([1,2,3,4,5,6,7,8,9,null,0,'⌫'] as (number|string|null)[]).map((n, i) => (
            n === null ? <div key={i} /> :
            <button key={i} onClick={() => {
              if (n === '⌫') { setPin(p => { setError(false); return p.slice(0, -1); }); }
              else { handleDigit(String(n)); }
              inputRef.current?.focus();
            }} style={{ width: '100%', height: 46, borderRadius: 12, border: 'none', background: T.tag, fontFamily: ff, fontSize: n === '⌫' ? 18 : 17, fontWeight: 600, color: T.text, cursor: 'pointer', transition: 'background 0.15s' }}>{n}</button>
          ))}
        </div>
        {error && <p style={{ fontFamily: ff, fontSize: 13, color: T.red, marginTop: 14, fontWeight: 500 }}>Wrong PIN. Try again.</p>}
        {loading && <p style={{ fontFamily: ff, fontSize: 13, color: T.muted, marginTop: 14 }}>Verifying...</p>}
        <button onClick={onClose} style={{ marginTop: 18, background: 'none', border: 'none', fontFamily: ff, fontSize: 13, color: T.muted, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
      </div>
    </div>
  );
}

/* ============ CARD ============ */
function Card({ item, onClick, isSeller }: { item: Listing; onClick: (item: Listing) => void; isSeller?: boolean }) {
  const [h, setH] = useState(false);
  const a = item.archived;
  const img = item.photos[0] || '/placeholder.png';
  return (
    <div onClick={() => onClick(item)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: T.card, borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: h ? T.shadowH : T.shadow, transform: h ? 'translateY(-2px)' : 'none', transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)', opacity: a ? 0.65 : 1, breakInside: 'avoid' as const }}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img src={img} alt={item.title}
          style={{ display: 'block', width: '100%', height: 'auto', minHeight: 120, objectFit: 'cover', transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)', transform: h ? 'scale(1.04)' : 'scale(1)', filter: a ? 'grayscale(40%)' : 'none' }} />
        {a && (
          <div style={{ position: 'absolute', top: 8, right: 8 }}>
            <span style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '3px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, fontFamily: ff, letterSpacing: '0.03em' }}>ARCHIVED</span>
          </div>
        )}
        {isSeller && item.views > 0 && (
          <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600, fontFamily: ff, display: 'flex', alignItems: 'center', gap: 3, backdropFilter: 'blur(4px)' }}>
            👁 {item.views}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px 14px' }}>
        <h3 style={{ fontFamily: ff, fontSize: 14, fontWeight: 600, color: a ? T.muted : T.text, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{item.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          {!a && <PriceBadge price={item.price} pricingType={item.pricingType} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          <ConditionDot condition={item.condition} />
          {item.brand && <><span style={{ color: T.border, fontSize: 10 }}>·</span><BrandTag brand={item.brand} /></>}
          <span style={{ color: T.border, fontSize: 10 }}>·</span>
          <Tag>{item.ageRange}</Tag>
        </div>
      </div>
    </div>
  );
}

/* ============ LISTING FORM ============ */
function ListingForm({ initialForm, existingPhotos, onSave, onClose, isEdit, pin }: {
  initialForm: any; existingPhotos: string[]; onSave: (form: any, photoUrls: string[]) => void;
  onClose: () => void; isEdit: boolean; pin: string;
}) {
  const [form, setForm] = useState(initialForm);
  const [localPhotos, setLocalPhotos] = useState<{ preview: string; base64?: string; mediaType?: string }[]>(
    existingPhotos.map(url => ({ preview: url }))
  );
  const [uploadedUrls, setUploadedUrls] = useState<string[]>(existingPhotos);
  const [error, setError] = useState('');
  const [step, setStep] = useState(existingPhotos.length > 0 || isEdit ? 2 : 0);
  const [aiStatus, setAiStatus] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inp: React.CSSProperties = { display: 'block', width: '100%', marginTop: 6, padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${T.border}`, background: '#fff', fontFamily: ff, fontSize: 14, color: T.text, outline: 'none', boxSizing: 'border-box', fontWeight: 500 };

  const compressImage = useCallback((file: File, maxW = 1200, maxH = 1200, quality = 0.82): Promise<{ base64: string; mediaType: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let { width: w, height: h } = img;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ base64: dataUrl.split(',')[1], mediaType: 'image/jpeg' });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Failed to load image')); };
      img.src = URL.createObjectURL(file);
    });
  }, []);

  const processFiles = useCallback(async (files: FileList) => {
    setError('');
    const vt = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
    for (const f of Array.from(files).slice(0, 5 - localPhotos.length)) {
      if (!vt.includes(f.type) && !f.name.toLowerCase().endsWith('.heic')) { setError('JPG, PNG, GIF or WebP only'); continue; }
      if (f.size > 20 * 1024 * 1024) { setError('Max 20MB'); continue; }
      const preview = URL.createObjectURL(f);
      try {
        const { base64, mediaType } = await compressImage(f);
        setLocalPhotos(prev => [...prev, { preview, base64, mediaType }]);
      } catch {
        setError('Failed to process image. Try another photo.');
      }
    }
  }, [localPhotos.length, compressImage]);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files); }, [processFiles]);
  const removePhoto = (idx: number) => { setLocalPhotos(prev => { const n = [...prev]; n.splice(idx, 1); return n; }); setUploadedUrls(prev => { const n = [...prev]; n.splice(idx, 1); return n; }); };

  const runAI = async () => {
    const photo = localPhotos.find(p => p.base64);
    if (!photo) { setError('Add a new photo to use AI.'); return; }
    setStep(1); setError(''); setAiStatus('Uploading & analyzing...');
    setUploading(true);
    const res = await uploadAndAnalyze(photo.base64!, photo.mediaType!, pin, true);
    setUploading(false);
    if (res.imageUrl) {
      setUploadedUrls(prev => {
        const idx = localPhotos.indexOf(photo);
        const next = [...prev]; next[idx] = res.imageUrl; return next;
      });
    }
    if (res.aiResult) {
      const r = res.aiResult;
      setForm((f: any) => ({
        ...f, title: r.title || f.title, brand: r.brand || f.brand || '',
        category: CATEGORIES.includes(r.category) ? r.category : f.category,
        condition: ['Like New','Good','Fair'].includes(r.condition) ? r.condition : f.condition,
        ageRange: ['0-1y','1-3y','3-6y','6-9y','9-12y'].includes(r.ageRange) ? r.ageRange : f.ageRange,
        price: String(r.suggestedPrice ?? f.price ?? ''),
        pricingType: r.suggestedPrice === 0 ? 'free' : 'fixed',
        description: r.description || f.description,
      }));
    } else { setError("AI couldn't analyze. Fill in manually."); }
    setStep(2); setAiStatus('');
  };

  const uploadRemainingPhotos = async (): Promise<string[]> => {
    const urls = [...uploadedUrls];
    for (let i = 0; i < localPhotos.length; i++) {
      const p = localPhotos[i];
      if (p.base64 && !urls[i]) {
        const res = await uploadAndAnalyze(p.base64, p.mediaType!, pin, false);
        if (res.imageUrl) {
          urls[i] = res.imageUrl;
          setUploadedUrls(prev => { const n = [...prev]; n[i] = res.imageUrl; return n; });
        }
      }
    }
    return urls.filter(Boolean);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Please add a title'); return; }
    setUploading(true);
    const finalUrls = await uploadRemainingPhotos();
    setUploading(false);
    if (finalUrls.length === 0 && localPhotos.length > 0) {
      setError('Photo upload failed. Please try again.');
      return;
    }
    onSave(form, finalUrls);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: df, fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>
            {isEdit ? '✏️ Edit Listing' : step === 0 ? '📸 Upload Photos' : step === 1 ? '✨ AI Analyzing...' : '📝 Review Listing'}
          </h2>
          <button onClick={onClose} style={{ background: T.tag, border: 'none', width: 32, height: 32, borderRadius: '50%', fontSize: 16, color: T.muted, cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ padding: '20px 24px 28px' }}>
          {step === 0 && (
            <div>
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? T.accent : T.border}`, borderRadius: 16, padding: localPhotos.length > 0 ? '16px' : '44px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? T.accentLight : T.tag, transition: 'all 0.2s' }}>
                {localPhotos.length === 0 ? (
                  <><div style={{ fontSize: 48, marginBottom: 12 }}>📸</div><p style={{ fontFamily: ff, fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>Drag & drop photos</p><p style={{ fontFamily: ff, fontSize: 13, color: T.muted, margin: '0 0 16px' }}>or tap to select · up to 5</p><span style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 20, background: '#fff', fontFamily: ff, fontSize: 13, fontWeight: 600, color: T.textSec, border: `1px solid ${T.border}` }}>Choose Files</span></>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(localPhotos.length + 1, 3)}, 1fr)`, gap: 10 }}>
                    {localPhotos.map((p, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3' }}>
                        <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={e => { e.stopPropagation(); removePhoto(i); }} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '2px 0', fontFamily: ff }}>MAIN</div>}
                      </div>
                    ))}
                    {localPhotos.length < 5 && <div style={{ borderRadius: 12, border: `2px dashed ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '4/3', fontSize: 28, color: T.muted }}>+</div>}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) processFiles(e.target.files); }} />
              </div>
              {error && <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: T.redLight, color: T.red, fontFamily: ff, fontSize: 13, fontWeight: 500 }}>⚠️ {error}</div>}
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button onClick={runAI} disabled={!localPhotos.length} style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: localPhotos.length ? T.accent : T.tag, color: localPhotos.length ? '#fff' : T.muted, fontFamily: ff, fontWeight: 700, fontSize: 15, cursor: localPhotos.length ? 'pointer' : 'default', boxShadow: localPhotos.length ? '0 4px 14px rgba(212,96,58,0.25)' : 'none', transition: 'all 0.2s' }}>✨ Auto-fill with AI</button>
                <button onClick={() => setStep(2)} disabled={!localPhotos.length} style={{ padding: '14px 20px', borderRadius: 14, border: `1.5px solid ${localPhotos.length ? T.border : T.tag}`, background: 'transparent', color: localPhotos.length ? T.textSec : T.muted, fontFamily: ff, fontWeight: 600, fontSize: 14, cursor: localPhotos.length ? 'pointer' : 'default', transition: 'all 0.2s' }}>Manual</button>
              </div>
            </div>
          )}
          {step === 1 && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>{localPhotos.slice(0, 3).map((p, i) => <img key={i} src={p.preview} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 12, border: `2px solid ${T.border}` }} />)}</div>
              <div style={{ width: 44, height: 44, border: `3px solid ${T.tag}`, borderTopColor: T.accent, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontFamily: ff, fontSize: 15, fontWeight: 600, color: T.text }}>{aiStatus}</p>
              <p style={{ fontFamily: ff, fontSize: 13, color: T.muted, marginTop: 4 }}>5-15 seconds</p>
            </div>
          )}
          {step === 2 && (
            <div>
              {localPhotos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', alignItems: 'center' }}>
                  {localPhotos.map((p, i) => (
                    <div key={i} style={{ position: 'relative', flexShrink: 0 }}><img src={p.preview} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 10, border: `1.5px solid ${T.border}` }} /><button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: T.red, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button></div>
                  ))}
                  {localPhotos.length < 5 && <button onClick={() => setStep(0)} style={{ width: 64, height: 48, borderRadius: 10, border: `2px dashed ${T.border}`, background: 'transparent', cursor: 'pointer', fontSize: 20, color: T.muted, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>}
                </div>
              )}
              {!isEdit && form.title && !error && <div style={{ background: T.greenLight, borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontFamily: ff, fontSize: 13, color: T.green, fontWeight: 600 }}>✅ AI filled in details — review and adjust</div>}
              {error && <div style={{ background: '#FFF3E0', borderRadius: 12, padding: '10px 14px', marginBottom: 16, fontFamily: ff, fontSize: 13, color: '#E65100', fontWeight: 500 }}>⚠️ {error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: T.textSec }}>Title *<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inp} placeholder="e.g. LEGO Duplo Fire Station" /></label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: T.textSec }}>Brand <span style={{ fontWeight: 400, color: T.muted }}>(optional)</span><input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} style={inp} placeholder="e.g. LEGO" /></label>
                  <label style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: T.textSec }}>Category<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp}>{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: T.textSec }}>Condition<select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value })} style={inp}>{['Like New','Good','Fair'].map(c => <option key={c}>{c}</option>)}</select></label>
                  <label style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: T.textSec }}>Age Range<select value={form.ageRange} onChange={e => setForm({ ...form, ageRange: e.target.value })} style={inp}>{['0-1y','1-3y','3-6y','6-9y','9-12y'].map(a => <option key={a}>{a}</option>)}</select></label>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: T.textSec }}>Pricing<select value={form.pricingType} onChange={e => setForm({ ...form, pricingType: e.target.value })} style={inp}><option value="fixed">Fixed Price</option><option value="free">Free</option><option value="paywhatyouwant">Pay What You Want</option></select></label>
                  {form.pricingType === 'fixed' && <label style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: T.textSec }}>Price (SGD)<input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} style={inp} placeholder="0" /></label>}
                </div>
                <label style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: T.textSec }}>Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inp, resize: 'vertical' as const }} placeholder="Describe item, condition, what's included..." /></label>
                <div>
                  <p style={{ fontFamily: ff, fontSize: 13, fontWeight: 700, color: T.textSec, margin: '0 0 8px' }}>📍 Collection / Delivery</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {COLLECTION_POINTS.map(pt => {
                      const selected = (form.location || '').split(',').map((s: string) => s.trim()).includes(pt);
                      return (
                        <label key={pt} onClick={() => {
                          const current = (form.location || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                          const next = selected ? current.filter((x: string) => x !== pt) : [...current, pt];
                          setForm({ ...form, location: next.join(', ') });
                        }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, border: `1.5px solid ${selected ? T.accent : T.border}`, background: selected ? T.accentLight : '#fff', cursor: 'pointer', fontFamily: ff, fontSize: 14, fontWeight: selected ? 600 : 500, color: selected ? T.accent : T.textSec, userSelect: 'none', transition: 'all 0.2s' }}>
                          <span style={{ width: 18, height: 18, borderRadius: 6, border: `2px solid ${selected ? T.accent : T.border}`, background: selected ? T.accent : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#fff', transition: 'all 0.2s' }}>{selected ? '✓' : ''}</span>
                          {pt}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <button onClick={handleSave} disabled={uploading} style={{ padding: '14px 0', borderRadius: 14, background: uploading ? T.muted : T.accent, color: '#fff', border: 'none', fontFamily: ff, fontWeight: 700, fontSize: 15, cursor: uploading ? 'wait' : 'pointer', marginTop: 4, boxShadow: '0 4px 14px rgba(212,96,58,0.25)', transition: 'all 0.2s' }}>
                  {uploading ? '⏳ Uploading...' : isEdit ? '💾 Save Changes' : '🚀 Publish Listing'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ DETAIL MODAL ============ */
function PhotoCarousel({ photos, archived }: { photos: string[]; archived: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const touchStartX = useRef(0);
  const imgs = photos.length > 0 ? photos : ['/placeholder.png'];
  const multi = imgs.length > 1;

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIdx(idx);
  }, []);

  const scrollTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(idx, imgs.length - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
  }, [imgs.length]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      scrollTo(activeIdx + (dx < 0 ? 1 : -1));
    }
  }, [activeIdx, scrollTo]);

  const arrowStyle: React.CSSProperties = {
    position: 'absolute', top: '50%', transform: 'translateY(-50%)',
    width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.35)',
    color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
    backdropFilter: 'blur(8px)', transition: 'opacity 0.2s',
  };

  return (
    <div style={{ position: 'relative', background: T.tag, borderRadius: '24px 24px 0 0', overflow: 'hidden' }}>
      <div ref={scrollRef} onScroll={handleScroll} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}
        className="photo-carousel"
        style={{ display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {imgs.map((src, i) => (
          <img key={i} src={src} alt="" style={{ width: '100%', height: 340, objectFit: 'contain', background: T.tag, flexShrink: 0, scrollSnapAlign: 'center', filter: archived ? 'grayscale(30%)' : 'none' }} />
        ))}
      </div>
      {multi && activeIdx > 0 && (
        <button onClick={() => scrollTo(activeIdx - 1)} aria-label="Previous photo" style={{ ...arrowStyle, left: 12 }}>&#8249;</button>
      )}
      {multi && activeIdx < imgs.length - 1 && (
        <button onClick={() => scrollTo(activeIdx + 1)} aria-label="Next photo" style={{ ...arrowStyle, right: 12 }}>&#8250;</button>
      )}
      {multi && (
        <>
          <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(0,0,0,0.45)', color: '#fff', padding: '4px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, fontFamily: ff, zIndex: 2, backdropFilter: 'blur(4px)' }}>
            {activeIdx + 1} / {imgs.length}
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
            {imgs.map((_, i) => (
              <button key={i} onClick={() => scrollTo(i)} aria-label={`Photo ${i + 1}`}
                style={{ width: activeIdx === i ? 20 : 7, height: 7, borderRadius: 4, background: activeIdx === i ? '#fff' : 'rgba(255,255,255,0.5)', transition: 'all 0.25s ease', border: 'none', padding: 0, cursor: 'pointer' }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DetailModal({ item, onClose, onEdit, onArchive, isSeller }: {
  item: Listing; onClose: () => void; onEdit: (item: Listing) => void;
  onArchive: (id: string) => void; isSeller: boolean;
}) {
  const a = item.archived;
  const [showSizeChart, setShowSizeChart] = useState(false);
  const isShoes = item.category === 'Shoes';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 24, maxWidth: 520, width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
        <div style={{ flex: 1, overflow: 'auto', borderRadius: '24px 24px 0 0' }}>
          <div style={{ position: 'relative' }}>
            <PhotoCarousel photos={item.photos} archived={a} />
            <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>×</button>
            {isSeller && <button onClick={e => { e.stopPropagation(); onEdit(item); }} style={{ position: 'absolute', top: 14, right: 56, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>✏️</button>}
          </div>
          <div style={{ padding: '20px 24px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <h2 style={{ fontFamily: df, fontSize: 22, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.3, flex: 1 }}>{item.title}</h2>
              <div style={{ flexShrink: 0, paddingTop: 2 }}>
                {a ? <span style={{ background: T.archiveBg, color: T.archiveText, padding: '4px 11px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, fontFamily: ff }}>ARCHIVED</span>
                  : <PriceBadge price={item.price} pricingType={item.pricingType} size="large" />}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <ConditionDot condition={item.condition} />
              {item.brand && <><span style={{ color: T.border, fontSize: 10 }}>·</span><BrandTag brand={item.brand} /></>}
              <span style={{ color: T.border, fontSize: 10 }}>·</span>
              <Tag>{item.ageRange}</Tag>
              <span style={{ color: T.border, fontSize: 10 }}>·</span>
              <Tag>{item.category}</Tag>
            </div>
            {item.originalImage && item.photos[0] && item.originalImage !== item.photos[0] && (
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <div style={{ padding: '5px 10px', background: T.tag, fontSize: 11, fontWeight: 700, color: T.muted, fontFamily: ff, textAlign: 'center' }}>ORIGINAL</div>
                  <img src={item.originalImage} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                </div>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                  <div style={{ padding: '5px 10px', background: T.tag, fontSize: 11, fontWeight: 700, color: T.muted, fontFamily: ff, textAlign: 'center' }}>AS-IS</div>
                  <img src={item.photos[0]} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }} />
                </div>
              </div>
            )}
            <p style={{ fontFamily: ff, fontSize: 14, color: T.textSec, lineHeight: 1.7, marginTop: 16 }}>{item.description}</p>
            {isShoes && (
              <div style={{ marginTop: 14 }}>
                <button onClick={() => setShowSizeChart(!showSizeChart)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: T.accentLight, border: 'none', borderRadius: 12, padding: '10px 16px', cursor: 'pointer', fontFamily: ff, fontSize: 13, fontWeight: 600, color: T.accent, width: '100%', justifyContent: 'center', transition: 'all 0.2s' }}>
                  👟 Baby Shoe Size Chart <span style={{ fontSize: 11, transition: 'transform 0.2s', transform: showSizeChart ? 'rotate(180deg)' : 'none' }}>▼</span>
                </button>
                {showSizeChart && (
                  <div style={{ marginTop: 8, borderRadius: 12, overflow: 'hidden', border: `1px solid ${T.border}`, animation: 'fadeUp 0.2s ease' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: ff, fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: T.tag }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 700, color: T.textSec }}>Age</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: T.textSec }}>EU</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: T.textSec }}>UK</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: T.textSec }}>cm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SHOE_SIZE_CHART.map((row, i) => (
                          <tr key={i} style={{ background: i % 2 ? T.tag + '66' : '#fff', borderTop: `1px solid ${T.border}` }}>
                            <td style={{ padding: '7px 10px', fontWeight: 600, color: T.text }}>{row.age}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'center', color: T.textSec }}>{row.eu}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'center', color: T.textSec }}>{row.uk}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'center', color: T.textSec }}>{row.cm}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
            {item.location && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontFamily: ff, fontSize: 11, fontWeight: 700, color: T.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📍 Collection / Delivery</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {item.location.split(',').map(pt => pt.trim()).filter(Boolean).map(pt => (
                    <span key={pt} style={{ background: T.tag, color: T.textSec, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500, fontFamily: ff }}>{pt}</span>
                  ))}
                </div>
              </div>
            )}
            <div style={{ fontSize: 12, color: T.muted, fontFamily: ff, marginTop: 12, fontWeight: 500 }}>Listed by {item.seller}</div>
          </div>
        </div>
        <div style={{ padding: '14px 24px 20px', borderTop: `1px solid ${T.border}`, background: '#fff', borderRadius: '0 0 24px 24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {!a && (
              <a href={`https://wa.me/${item.whatsapp}?text=${encodeURIComponent(`Hi! I'm interested in "${item.title}" from Preloved Kids 🧸${item.photos[0] ? `\n\n📷 Item photo: ${item.photos[0]}` : ''}`)}`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 0', borderRadius: 14, background: '#25D366', color: '#fff', fontFamily: ff, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 4px 14px rgba(37,211,102,0.2)', transition: 'all 0.2s' }}>💬 WhatsApp</a>
            )}
            {isSeller && (
              <button onClick={() => onArchive(item.id)} style={{ flex: a ? 1 : 0, minWidth: a ? undefined : 130, padding: '14px 16px', borderRadius: 14, border: `1.5px solid ${a ? T.green : T.border}`, background: a ? T.greenLight : 'transparent', color: a ? T.green : T.muted, fontFamily: ff, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}>
                {a ? '📦 Restore' : '📦 Archive'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ MAIN APP ============ */
export default function PrelovedApp({ initialListings }: { initialListings: Listing[] }) {
  const [listings, setListings] = useState<Listing[]>(initialListings);
  const [cat, setCat] = useState('All');
  const [selected, setSelected] = useState<Listing | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<Listing | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [isSeller, setIsSeller] = useState(false);
  const [sellerPin, setSellerPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Always fetch fresh data on mount to bypass any SSR/CDN cache
  useEffect(() => {
    fetch('/api/listings?archived=false')
      .then(r => r.json())
      .then(d => { if (d.listings) setListings(d.listings); })
      .catch(() => {});
  }, []);

  const filtered = listings.filter(item => {
    if (viewMode === 'active' && item.archived) return false;
    if (viewMode === 'archived' && !item.archived) return false;
    const mc = cat === 'All' || item.category === cat;
    const ms = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase()) || (item.brand || '').toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const archivedCount = listings.filter(i => i.archived).length;
  const activeCount = listings.filter(i => !i.archived).length;

  const refreshListings = async (asSeller?: boolean, pin?: string) => {
    const seller = asSeller !== undefined ? asSeller : isSeller;
    const p = pin || sellerPin;
    const headers: Record<string, string> = {};
    if (seller && p) headers['x-seller-pin'] = p;
    const res = await fetch(`/api/listings?archived=${seller}`, { headers });
    const data = await res.json();
    if (data.listings) setListings(data.listings);
  };

  const handleCreate = async (form: any, photoUrls: string[]) => {
    await apiCall('/api/listings', 'POST', sellerPin, {
      ...form, price: form.pricingType === 'free' ? 0 : Number(form.price) || 0,
      photos: photoUrls, originalImage: photoUrls[0] || '',
      seller: 'Seller', whatsapp: '6591152527',
    });
    await refreshListings();
    setShowCreate(false);
  };

  const handleEdit = async (form: any, photoUrls: string[]) => {
    if (!editItem) return;
    await apiCall('/api/listings', 'PATCH', sellerPin, {
      id: editItem.id, ...form,
      price: form.pricingType === 'free' ? 0 : Number(form.price) || 0,
      photos: photoUrls.length > 0 ? photoUrls : editItem.photos,
    });
    await refreshListings();
    setEditItem(null); setSelected(null);
  };

  const handleArchive = async (id: string) => {
    await apiCall('/api/listings', 'PATCH', sellerPin, { id, action: 'archive' });
    await refreshListings();
    setSelected(null);
  };

  return (
    <div style={{ fontFamily: ff, background: T.bg, minHeight: '100vh', color: T.text }}>
      {/* Clean minimal header */}
      <header style={{ background: T.headerBg, borderBottom: `1px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div onClick={() => { if (isSeller) { setIsSeller(false); setSellerPin(''); setViewMode('active'); refreshListings(false); } else setShowPin(true); }} style={{ cursor: 'pointer', minWidth: 0 }} title={isSeller ? 'Exit seller mode' : 'Enter seller mode'}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontFamily: df, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: T.text, whiteSpace: 'nowrap' }}>🧸 Preloved Kids</h1>
                {isSeller && <span style={{ background: T.sellerBadgeBg, color: T.sellerBadge, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, fontFamily: ff, whiteSpace: 'nowrap', flexShrink: 0 }}>SELLER</span>}
              </div>
            </div>
            {isSeller && <button onClick={() => setShowCreate(true)} style={{ padding: '8px 16px', borderRadius: 20, background: T.accent, color: '#fff', border: 'none', fontFamily: ff, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(212,96,58,0.2)', whiteSpace: 'nowrap', flexShrink: 0, transition: 'all 0.2s' }}>+ List</button>}
          </div>
          <div style={{ marginTop: 10, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: T.muted }}>🔍</span>
            <input placeholder="Search toys, books, brands..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 12, border: `1px solid ${T.border}`, background: T.tag, fontFamily: ff, fontSize: 14, color: T.text, outline: 'none', fontWeight: 500, transition: 'all 0.2s' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            {isSeller && (
              <div style={{ display: 'flex', background: T.tag, borderRadius: 20, padding: 3, flexShrink: 0 }}>
                <button onClick={() => setViewMode('active')} style={{ padding: '5px 12px', borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 12, fontWeight: 600, background: viewMode === 'active' ? T.card : 'transparent', color: viewMode === 'active' ? T.text : T.muted, boxShadow: viewMode === 'active' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>Active ({activeCount})</button>
                <button onClick={() => setViewMode('archived')} style={{ padding: '5px 12px', borderRadius: 18, border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 12, fontWeight: 600, background: viewMode === 'archived' ? T.card : 'transparent', color: viewMode === 'archived' ? T.text : T.muted, boxShadow: viewMode === 'archived' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}>📦 Archived ({archivedCount})</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{ padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', background: cat === c ? T.text : T.tag, color: cat === c ? '#fff' : T.muted, transition: 'all 0.2s' }}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 16px 0' }}>
        <p style={{ fontFamily: ff, fontSize: 12, color: T.muted, fontWeight: 500 }}>{filtered.length} {viewMode === 'archived' ? 'archived ' : ''}item{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '10px 10px 40px' }}>
        {filtered.length > 0 ? (
          <div className="masonry-grid">
            {filtered.map((item, i) => (
              <div key={item.id} style={{ animation: `fadeUp 0.35s ease ${i * 0.05}s both` }}><Card item={item} isSeller={isSeller} onClick={(it) => { setSelected(it); fetch('/api/listings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, action: 'view' }) }).catch(() => {}); }} /></div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: T.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{viewMode === 'archived' ? '📦' : '🔍'}</div>
            <p style={{ fontFamily: ff, fontSize: 15, fontWeight: 500 }}>{viewMode === 'archived' ? 'No archived items' : 'No items found'}</p>
          </div>
        )}
      </main>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: 20, textAlign: 'center', fontFamily: ff, fontSize: 11, color: T.muted, fontWeight: 500, background: T.headerBg }}>
        Made with ❤️ for the little ones · Preloved Kids © 2026
      </footer>

      {showPin && <PinModal onSuccess={(p) => { setIsSeller(true); setSellerPin(p); setShowPin(false); refreshListings(true, p); }} onClose={() => setShowPin(false)} />}
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} onEdit={item => { setSelected(null); setEditItem(item); }} onArchive={handleArchive} isSeller={isSeller} />}
      {showCreate && <ListingForm initialForm={{ title: '', brand: '', category: 'Toys', condition: 'Good', ageRange: '3-6y', price: '', pricingType: 'fixed', description: '', location: COLLECTION_POINTS.join(', ') }} existingPhotos={[]} onSave={handleCreate} onClose={() => setShowCreate(false)} isEdit={false} pin={sellerPin} />}
      {editItem && <ListingForm initialForm={{ title: editItem.title, brand: editItem.brand || '', category: editItem.category, condition: editItem.condition, ageRange: editItem.ageRange, price: String(editItem.price || ''), pricingType: editItem.pricingType, description: editItem.description, location: editItem.location || COLLECTION_POINTS.join(', ') }} existingPhotos={editItem.photos} onSave={handleEdit} onClose={() => setEditItem(null)} isEdit={true} pin={sellerPin} />}
    </div>
  );
}
