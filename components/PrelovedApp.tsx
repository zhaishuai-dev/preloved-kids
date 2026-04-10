'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

const CATEGORIES = ['All', 'Toys', 'Books', 'Clothes', 'Gear', 'Others'];
const COLLECTION_POINTS = ['Holland Village (Condo Residence)', 'Kent Ridge MRT', 'Delivery (with Grab Fee)'];

const T = {
  bg: '#FBF7F2', card: '#FFFFFF', accent: '#D4603A', accentLight: '#FDEEE8',
  green: '#1D7A50', greenLight: '#E3F3EA',
  text: '#1E1B18', textSec: '#4A4540', muted: '#7D766F',
  border: '#E4DDD5', tag: '#EFEBE5', cardBorder: '#E8E2DA',
  shadow: '0 1px 4px rgba(30,27,24,0.07), 0 4px 14px rgba(30,27,24,0.05)',
  shadowH: '0 4px 12px rgba(30,27,24,0.1), 0 10px 28px rgba(30,27,24,0.08)',
  headerBg: '#F5EFE7', red: '#C0392B', redLight: '#FDECEB',
  archiveBg: '#F0EDE8', archiveText: '#9E9890',
  sellerBadge: '#4A6741', sellerBadgeBg: '#E8F0E6',
};
const ff = "'DM Sans', sans-serif";
const df = "'Fraunces', serif";

interface Listing {
  id: string; title: string; brand: string; category: string; condition: string;
  ageRange: string; price: number; pricingType: string; description: string;
  originalImage: string; photos: string[]; seller: string; location: string;
  whatsapp: string; archived: boolean; createdAt: string;
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
function PriceBadge({ price, pricingType }: { price: number; pricingType: string }) {
  const cfg = pricingType === 'free' ? { bg: T.greenLight, color: T.green, label: 'FREE' }
    : pricingType === 'paywhatyouwant' ? { bg: T.accentLight, color: T.accent, label: 'Pay What You Want' }
    : { bg: T.accentLight, color: T.accent, label: `$${price}` };
  return <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 11px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, fontFamily: ff }}>{cfg.label}</span>;
}
function ConditionDot({ condition }: { condition: string }) {
  const c: Record<string, string> = { 'Like New': T.green, Good: '#B8860B', Fair: '#C05A30' };
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.textSec, fontWeight: 500, fontFamily: ff }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: c[condition] || '#999' }} />{condition}</span>;
}
function Tag({ children }: { children: React.ReactNode }) { return <span style={{ background: T.tag, color: T.muted, padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: ff }}>{children}</span>; }
function BrandTag({ brand }: { brand: string }) { if (!brand) return null; return <span style={{ background: '#EDE7F6', color: '#5E35B1', padding: '3px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: ff }}>{brand}</span>; }

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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(30,27,24,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: 18, maxWidth: 340, width: '100%', padding: '32px 28px', boxShadow: '0 24px 64px rgba(0,0,0,0.22)', textAlign: 'center', animation: shake ? 'shakeX 0.4s ease' : 'none' }}>
        <input ref={inputRef} type="tel" inputMode="numeric" maxLength={4} value={pin}
          onChange={e => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
            setPin(val); setError(false);
            if (val.length === 4) setTimeout(() => tryPin(val), 150);
          }}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }} />
        <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
        <h3 style={{ fontFamily: df, fontSize: 20, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>Seller Mode</h3>
        <p style={{ fontFamily: ff, fontSize: 13, color: T.muted, margin: '0 0 20px' }}>Enter your PIN to manage listings</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }} onClick={() => inputRef.current?.focus()}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 44, height: 52, borderRadius: 10, border: `2px solid ${error ? T.red : pin.length > i ? T.accent : T.border}`, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, fontFamily: ff, color: T.text }}>{pin[i] ? '•' : ''}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, maxWidth: 220, margin: '0 auto' }}>
          {([1,2,3,4,5,6,7,8,9,null,0,'⌫'] as (number|string|null)[]).map((n, i) => (
            n === null ? <div key={i} /> :
            <button key={i} onClick={() => {
              if (n === '⌫') { setPin(p => { setError(false); return p.slice(0, -1); }); }
              else { handleDigit(String(n)); }
              inputRef.current?.focus();
            }} style={{ width: '100%', height: 44, borderRadius: 10, border: `1px solid ${T.border}`, background: T.card, fontFamily: ff, fontSize: n === '⌫' ? 18 : 17, fontWeight: 600, color: T.text, cursor: 'pointer' }}>{n}</button>
          ))}
        </div>
        {error && <p style={{ fontFamily: ff, fontSize: 13, color: T.red, marginTop: 12, fontWeight: 500 }}>Wrong PIN. Try again.</p>}
        {loading && <p style={{ fontFamily: ff, fontSize: 13, color: T.muted, marginTop: 12 }}>Verifying...</p>}
        <button onClick={onClose} style={{ marginTop: 16, background: 'none', border: 'none', fontFamily: ff, fontSize: 13, color: T.muted, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
      </div>
    </div>
  );
}

/* ============ CARD ============ */
function Card({ item, onClick }: { item: Listing; onClick: (item: Listing) => void }) {
  const [h, setH] = useState(false);
  const a = item.archived;
  const img = item.photos[0] || '/placeholder.png';
  return (
    <div onClick={() => onClick(item)} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ background: T.card, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', boxShadow: h ? T.shadowH : T.shadow, transform: h ? 'translateY(-3px)' : 'none', transition: 'all 0.25s ease', border: `1px solid ${h ? T.border : T.cardBorder}`, opacity: a ? 0.7 : 1 }}>
      <div style={{ position: 'relative', paddingTop: '72%', background: T.tag, overflow: 'hidden' }}>
        <img src={img} alt={item.title} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s', transform: h ? 'scale(1.04)' : 'scale(1)', filter: a ? 'grayscale(40%)' : 'none' }} />
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          {a ? <span style={{ background: T.archiveBg, color: T.archiveText, padding: '4px 11px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, fontFamily: ff }}>ARCHIVED</span>
            : <PriceBadge price={item.price} pricingType={item.pricingType} />}
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{ fontFamily: ff, fontSize: 14, fontWeight: 700, color: a ? T.muted : T.text, margin: 0, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <ConditionDot condition={item.condition} /><BrandTag brand={item.brand} /><Tag>{item.ageRange}</Tag><Tag>{item.category}</Tag>
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
  const inp: React.CSSProperties = { display: 'block', width: '100%', marginTop: 5, padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${T.border}`, background: '#fff', fontFamily: ff, fontSize: 14, color: T.text, outline: 'none', boxSizing: 'border-box', fontWeight: 500 };

  const processFiles = useCallback(async (files: FileList) => {
    setError('');
    const vt = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    for (const f of Array.from(files).slice(0, 5 - localPhotos.length)) {
      if (!vt.includes(f.type)) { setError('JPG, PNG, GIF or WebP only'); continue; }
      if (f.size > 10 * 1024 * 1024) { setError('Max 10MB'); continue; }
      const preview = URL.createObjectURL(f);
      const base64 = await new Promise<string>(r => { const rd = new FileReader(); rd.onload = () => r((rd.result as string).split(',')[1]); rd.readAsDataURL(f); });
      setLocalPhotos(prev => [...prev, { preview, base64, mediaType: f.type }]);
    }
  }, [localPhotos.length]);

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

  const uploadRemainingPhotos = async () => {
    const toUpload = localPhotos.filter((p, i) => p.base64 && !uploadedUrls[i]);
    for (let i = 0; i < localPhotos.length; i++) {
      const p = localPhotos[i];
      if (p.base64 && !uploadedUrls[i]) {
        const res = await uploadAndAnalyze(p.base64, p.mediaType!, pin, false);
        if (res.imageUrl) setUploadedUrls(prev => { const n = [...prev]; n[i] = res.imageUrl; return n; });
      }
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Please add a title'); return; }
    setUploading(true);
    await uploadRemainingPhotos();
    setUploading(false);
    // Get final URLs
    const finalUrls = localPhotos.map((_, i) => uploadedUrls[i]).filter(Boolean);
    onSave(form, finalUrls);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(30,27,24,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: 18, maxWidth: 500, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ padding: '20px 24px', borderBottom: `1.5px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontFamily: df, fontSize: 20, fontWeight: 700, color: T.text, margin: 0 }}>
            {isEdit ? '✏️ Edit Listing' : step === 0 ? '📸 Upload Photos' : step === 1 ? '✨ AI Analyzing...' : '📝 Review Listing'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: T.muted, cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
        <div style={{ padding: '20px 24px 28px' }}>
          {step === 0 && (
            <div>
              <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}
                style={{ border: `2px dashed ${dragOver ? T.accent : T.border}`, borderRadius: 14, padding: localPhotos.length > 0 ? '16px' : '40px 20px', textAlign: 'center', cursor: 'pointer', background: dragOver ? T.accentLight : 'transparent' }}>
                {localPhotos.length === 0 ? (
                  <><div style={{ fontSize: 48, marginBottom: 12 }}>📸</div><p style={{ fontFamily: ff, fontSize: 15, fontWeight: 600, color: T.text, margin: '0 0 4px' }}>Drag & drop photos</p><p style={{ fontFamily: ff, fontSize: 13, color: T.muted, margin: '0 0 16px' }}>or tap to select · up to 5</p><span style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 8, background: T.tag, fontFamily: ff, fontSize: 13, fontWeight: 600, color: T.textSec }}>Choose Files</span></>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(localPhotos.length + 1, 3)}, 1fr)`, gap: 10 }}>
                    {localPhotos.map((p, i) => (
                      <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3' }}>
                        <img src={p.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={e => { e.stopPropagation(); removePhoto(i); }} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '2px 0', fontFamily: ff }}>MAIN</div>}
                      </div>
                    ))}
                    {localPhotos.length < 5 && <div style={{ borderRadius: 10, border: `2px dashed ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '4/3', fontSize: 28, color: T.muted }}>+</div>}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple style={{ display: 'none' }} onChange={e => { if (e.target.files?.length) processFiles(e.target.files); }} />
              </div>
              {error && <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: T.redLight, color: T.red, fontFamily: ff, fontSize: 13, fontWeight: 500 }}>⚠️ {error}</div>}
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button onClick={runAI} disabled={!localPhotos.length} style={{ flex: 1, padding: '13px 0', borderRadius: 12, border: 'none', background: localPhotos.length ? T.accent : T.tag, color: localPhotos.length ? '#fff' : T.muted, fontFamily: ff, fontWeight: 700, fontSize: 15, cursor: localPhotos.length ? 'pointer' : 'default', boxShadow: localPhotos.length ? '0 3px 10px rgba(212,96,58,0.3)' : 'none' }}>✨ Auto-fill with AI</button>
                <button onClick={() => setStep(2)} disabled={!localPhotos.length} style={{ padding: '13px 20px', borderRadius: 12, border: `1.5px solid ${localPhotos.length ? T.border : T.tag}`, background: 'transparent', color: localPhotos.length ? T.textSec : T.muted, fontFamily: ff, fontWeight: 600, fontSize: 14, cursor: localPhotos.length ? 'pointer' : 'default' }}>Manual</button>
              </div>
            </div>
          )}
          {step === 1 && (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>{localPhotos.slice(0, 3).map((p, i) => <img key={i} src={p.preview} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 10, border: `2px solid ${T.border}` }} />)}</div>
              <div style={{ width: 44, height: 44, border: `3px solid ${T.tag}`, borderTopColor: T.accent, borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontFamily: ff, fontSize: 15, fontWeight: 600, color: T.text }}>{aiStatus}</p>
              <p style={{ fontFamily: ff, fontSize: 13, color: T.muted, marginTop: 4 }}>5-15 seconds</p>
            </div>
          )}
          {step === 2 && (
            <div>
              {localPhotos.length > 0 && (
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', alignItems: 'center' }}>
                  {localPhotos.map((p, i) => (
                    <div key={i} style={{ position: 'relative', flexShrink: 0 }}><img src={p.preview} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 8, border: `1.5px solid ${T.border}` }} /><button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: T.red, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button></div>
                  ))}
                  {localPhotos.length < 5 && <button onClick={() => setStep(0)} style={{ width: 64, height: 48, borderRadius: 8, border: `2px dashed ${T.border}`, background: 'transparent', cursor: 'pointer', fontSize: 20, color: T.muted, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>}
                </div>
              )}
              {!isEdit && form.title && !error && <div style={{ background: T.greenLight, borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontFamily: ff, fontSize: 13, color: T.green, fontWeight: 600 }}>✅ AI filled in details — review and adjust</div>}
              {error && <div style={{ background: '#FFF3E0', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontFamily: ff, fontSize: 13, color: '#E65100', fontWeight: 500 }}>⚠️ {error}</div>}
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
                        }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${selected ? T.accent : T.border}`, background: selected ? T.accentLight : '#fff', cursor: 'pointer', fontFamily: ff, fontSize: 14, fontWeight: selected ? 600 : 500, color: selected ? T.accent : T.textSec, userSelect: 'none' }}>
                          <span style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${selected ? T.accent : T.border}`, background: selected ? T.accent : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#fff' }}>{selected ? '✓' : ''}</span>
                          {pt}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <button onClick={handleSave} disabled={uploading} style={{ padding: '13px 0', borderRadius: 12, background: uploading ? T.muted : T.accent, color: '#fff', border: 'none', fontFamily: ff, fontWeight: 700, fontSize: 15, cursor: uploading ? 'wait' : 'pointer', marginTop: 4, boxShadow: '0 3px 10px rgba(212,96,58,0.3)' }}>
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
function DetailModal({ item, onClose, onEdit, onArchive, isSeller }: {
  item: Listing; onClose: () => void; onEdit: (item: Listing) => void;
  onArchive: (id: string) => void; isSeller: boolean;
}) {
  const a = item.archived;
  const img = item.photos[0] || '/placeholder.png';
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(30,27,24,0.55)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.bg, borderRadius: 18, maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.22)' }}>
        <div style={{ position: 'relative' }}>
          <img src={img} alt="" style={{ width: '100%', height: 280, objectFit: 'cover', borderRadius: '18px 18px 0 0', filter: a ? 'grayscale(30%)' : 'none' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          {isSeller && <button onClick={e => { e.stopPropagation(); onEdit(item); }} style={{ position: 'absolute', top: 12, right: 54, width: 34, height: 34, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>}
          <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
            {a ? <span style={{ background: T.archiveBg, color: T.archiveText, padding: '4px 11px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, fontFamily: ff }}>ARCHIVED</span>
              : <PriceBadge price={item.price} pricingType={item.pricingType} />}
          </div>
        </div>
        <div style={{ padding: '20px 24px 24px' }}>
          <h2 style={{ fontFamily: df, fontSize: 22, fontWeight: 700, color: T.text, margin: 0, lineHeight: 1.3 }}>{item.title}</h2>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <ConditionDot condition={item.condition} /><BrandTag brand={item.brand} /><Tag>{item.ageRange}</Tag><Tag>{item.category}</Tag>
          </div>
          {item.originalImage && item.photos[0] && (
            <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <div style={{ padding: '5px 10px', background: T.tag, fontSize: 11, fontWeight: 700, color: T.muted, fontFamily: ff, textAlign: 'center' }}>ORIGINAL</div>
                <img src={item.originalImage} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }} />
              </div>
              <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}` }}>
                <div style={{ padding: '5px 10px', background: T.tag, fontSize: 11, fontWeight: 700, color: T.muted, fontFamily: ff, textAlign: 'center' }}>AS-IS</div>
                <img src={item.photos[0]} alt="" style={{ width: '100%', height: 130, objectFit: 'cover' }} />
              </div>
            </div>
          )}
          <p style={{ fontFamily: ff, fontSize: 14, color: T.textSec, lineHeight: 1.7, marginTop: 16 }}>{item.description}</p>
          {item.location && (
            <div style={{ marginTop: 14 }}>
              <p style={{ fontFamily: ff, fontSize: 12, fontWeight: 700, color: T.muted, margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 Collection / Delivery</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {item.location.split(',').map(pt => pt.trim()).filter(Boolean).map(pt => (
                  <span key={pt} style={{ background: T.accentLight, color: T.accent, padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600, fontFamily: ff }}>{pt}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: 13, color: T.muted, fontFamily: ff, marginTop: 10, fontWeight: 500 }}>Listed by {item.seller}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            {!a && (
              <a href={`https://wa.me/${item.whatsapp}?text=Hi! I'm interested in "${item.title}" from Preloved Kids 🧸`} target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 0', borderRadius: 12, background: '#25D366', color: '#fff', fontFamily: ff, fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 2px 8px rgba(37,211,102,0.25)' }}>💬 WhatsApp</a>
            )}
            {isSeller && (
              <button onClick={() => onArchive(item.id)} style={{ flex: a ? 1 : 0, minWidth: a ? undefined : 130, padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${a ? T.green : T.border}`, background: a ? T.greenLight : 'transparent', color: a ? T.green : T.muted, fontFamily: ff, fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
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

  const filtered = listings.filter(item => {
    if (viewMode === 'active' && item.archived) return false;
    if (viewMode === 'archived' && !item.archived) return false;
    const mc = cat === 'All' || item.category === cat;
    const ms = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.description.toLowerCase().includes(search.toLowerCase()) || (item.brand || '').toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });

  const archivedCount = listings.filter(i => i.archived).length;
  const activeCount = listings.filter(i => !i.archived).length;

  const refreshListings = async () => {
    const res = await fetch(`/api/listings?archived=${isSeller}`);
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
      <header style={{ background: T.headerBg, borderBottom: `1.5px solid ${T.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div onClick={() => { if (isSeller) { setIsSeller(false); setSellerPin(''); setViewMode('active'); } else setShowPin(true); }} style={{ cursor: 'pointer' }} title={isSeller ? 'Exit seller mode' : 'Enter seller mode'}>
                <h1 style={{ fontFamily: df, fontSize: 27, fontWeight: 800, letterSpacing: '-0.02em', color: T.text }}>🧸 Preloved Kids</h1>
                <p style={{ fontSize: 13, color: T.muted, marginTop: 2, fontWeight: 500 }}>Quality second-hand treasures for little ones</p>
              </div>
              {isSeller && <span style={{ background: T.sellerBadgeBg, color: T.sellerBadge, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, fontFamily: ff, whiteSpace: 'nowrap', alignSelf: 'flex-start', marginTop: 4 }}>🔓 SELLER</span>}
            </div>
            {isSeller && <button onClick={() => setShowCreate(true)} style={{ padding: '10px 20px', borderRadius: 11, background: T.accent, color: '#fff', border: 'none', fontFamily: ff, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 3px 10px rgba(212,96,58,0.3)' }}>✨ List Item</button>}
          </div>
          <div style={{ marginTop: 14, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: T.muted }}>🔍</span>
            <input placeholder="Search toys, books, brands..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', padding: '11px 14px 11px 38px', borderRadius: 10, border: `1.5px solid ${T.border}`, background: '#fff', fontFamily: ff, fontSize: 14, color: T.text, outline: 'none', fontWeight: 500 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            {isSeller && (
              <div style={{ display: 'flex', background: T.tag, borderRadius: 10, padding: 3, flexShrink: 0 }}>
                <button onClick={() => setViewMode('active')} style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 12, fontWeight: 600, background: viewMode === 'active' ? T.card : 'transparent', color: viewMode === 'active' ? T.text : T.muted, boxShadow: viewMode === 'active' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Active ({activeCount})</button>
                <button onClick={() => setViewMode('archived')} style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: ff, fontSize: 12, fontWeight: 600, background: viewMode === 'archived' ? T.card : 'transparent', color: viewMode === 'archived' ? T.text : T.muted, boxShadow: viewMode === 'archived' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>📦 Archived ({archivedCount})</button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCat(c)} style={{ padding: '6px 14px', borderRadius: 20, border: cat === c ? 'none' : `1.5px solid ${T.border}`, cursor: 'pointer', fontFamily: ff, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', background: cat === c ? T.accent : T.card, color: cat === c ? '#fff' : T.textSec, boxShadow: cat === c ? '0 2px 6px rgba(212,96,58,0.25)' : 'none' }}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px 20px 0' }}>
        <p style={{ fontFamily: ff, fontSize: 13, color: T.muted, fontWeight: 600 }}>{filtered.length} {viewMode === 'archived' ? 'archived ' : ''}item{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '12px 20px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
        {filtered.map((item, i) => (
          <div key={item.id} style={{ animation: `fadeUp 0.35s ease ${i * 0.06}s both` }}><Card item={item} onClick={setSelected} /></div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 0', color: T.muted }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{viewMode === 'archived' ? '📦' : '🔍'}</div>
            <p style={{ fontFamily: ff, fontSize: 15, fontWeight: 500 }}>{viewMode === 'archived' ? 'No archived items' : 'No items found'}</p>
          </div>
        )}
      </main>

      <footer style={{ borderTop: `1.5px solid ${T.border}`, padding: 20, textAlign: 'center', fontFamily: ff, fontSize: 12, color: T.muted, fontWeight: 500, background: T.headerBg }}>
        Made with ❤️ for the little ones · Preloved Kids © 2026
      </footer>

      {showPin && <PinModal onSuccess={(p) => { setIsSeller(true); setSellerPin(p); setShowPin(false); refreshListings(); }} onClose={() => setShowPin(false)} />}
      {selected && <DetailModal item={selected} onClose={() => setSelected(null)} onEdit={item => { setSelected(null); setEditItem(item); }} onArchive={handleArchive} isSeller={isSeller} />}
      {showCreate && <ListingForm initialForm={{ title: '', brand: '', category: 'Toys', condition: 'Good', ageRange: '3-6y', price: '', pricingType: 'fixed', description: '', location: COLLECTION_POINTS.join(', ') }} existingPhotos={[]} onSave={handleCreate} onClose={() => setShowCreate(false)} isEdit={false} pin={sellerPin} />}
      {editItem && <ListingForm initialForm={{ title: editItem.title, brand: editItem.brand || '', category: editItem.category, condition: editItem.condition, ageRange: editItem.ageRange, price: String(editItem.price || ''), pricingType: editItem.pricingType, description: editItem.description, location: editItem.location || COLLECTION_POINTS.join(', ') }} existingPhotos={editItem.photos} onSave={handleEdit} onClose={() => setEditItem(null)} isEdit={true} pin={sellerPin} />}
    </div>
  );
}
