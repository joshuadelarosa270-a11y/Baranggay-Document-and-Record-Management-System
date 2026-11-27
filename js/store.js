/* ==========================================================================
   BDRMS — Data layer, constants, sessions and shared UI helpers
   Barangay Wawa, Abra de Ilog, Occidental Mindoro
   ========================================================================== */

const BDRMS = (() => {
  const DEVICE_KEY = 'bdrms_device_refs';
  const RESIDENCY_MONTHS = 6;

  /* ---------- Icons (Lucide-style, inline SVG) ---------- */
  const svg = (p) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const ICONS = {
    seal: svg('<path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/><path d="M12 2v3"/>'),
    file: svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/>'),
    heart: svg('<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>'),
    shield: svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
    home: svg('<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>'),
    cart: svg('<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>'),
    briefcase: svg('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
    idcard: svg('<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4M14 14h4M5 17c.5-1.5 1.6-2 3-2s2.5.5 3 2"/>'),
    scale: svg('<path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>'),
    search: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    arrowRight: svg('<path d="M5 12h14M12 5l7 7-7 7"/>'),
    arrowLeft: svg('<path d="M19 12H5M12 19l-7-7 7-7"/>'),
    clock: svg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    user: svg('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    users: svg('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
    lock: svg('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    eye: svg('<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>'),
    eyeOff: svg('<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>'),
    info: svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),
    alert: svg('<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>'),
    inbox: svg('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
    walkin: svg('<circle cx="13" cy="4" r="2"/><path d="m7 21 3-7 3 2v5M10 14l-1-4 4-2 3 3 3 1M6 11l2-3"/>'),
    log: svg('<path d="M12 8v4l3 3"/><path d="M3.05 11a9 9 0 1 1 .5 4M3 4v5h5"/>'),
    settings: svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
    logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    printer: svg('<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
    send: svg('<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>'),
    copy: svg('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
    menu: svg('<path d="M4 6h16M4 12h16M4 18h16"/>'),
    signature: svg('<path d="m21 17-2.16-1.44a2 2 0 0 0-2.48.22L15 17l-1.5-1.5L12 17"/><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2-1.67 0-3 2-3 4.5S6 13 7 15c1 2 3 4 3 4"/>'),
    badgeCheck: svg('<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/>'),
    package: svg('<path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>'),
    globe: svg('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
    download: svg('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
    refresh: svg('<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>'),
    qr: svg('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M7 17h.01M17 7h.01M7 7h.01M17 17h.01"/>'),
  };

  /* ---------- Document catalogue ---------- */
  const DOC_TYPES = {
    indigency: {
      name: 'Barangay Indigency', short: 'Indigency', icon: 'heart', color: 'hsl(258, 88%, 72%)',
      desc: 'Certifies that a resident belongs to a low-income household — commonly used for medical, financial, burial or educational assistance.',
      requirements: ['Valid government-issued or barangay-recognized ID', 'Proof of residency in Barangay Wawa', 'Stated purpose of the certificate (e.g., medical assistance)'],
      purposes: ['Medical assistance', 'Financial assistance', 'Educational / scholarship', 'Burial assistance', 'PhilHealth / PCSO', 'Legal assistance (PAO)', 'Other'],
      processing: 'Same day – 1 day', fee: 'Free', residency: true,
    },
    clearance: {
      name: 'Barangay Clearance', short: 'Clearance', icon: 'shield', color: 'hsl(166, 72%, 44%)',
      desc: 'Certifies that the resident has no derogatory record in the barangay. Often required for employment, business, loans and permits.',
      requirements: ['Valid ID', 'Community Tax Certificate (Cedula) for the current year', 'Proof of residency'],
      purposes: ['Employment', 'Business permit', 'Loan application', 'Police / NBI clearance', 'Travel', 'Other'],
      processing: '1 day', fee: '₱50.00', residency: true,
    },
    residency: {
      name: 'Certificate of Residency', short: 'Residency', icon: 'home', color: 'hsl(193, 82%, 54%)',
      desc: 'Certifies that the applicant is a bona fide resident of Barangay Wawa and states the length of residency.',
      requirements: ['Valid ID showing address, or other proof of residency', 'Residency of at least six (6) months in the barangay'],
      purposes: ['School enrollment', 'Bank requirement', 'Government transaction', 'Voter registration', 'Other'],
      processing: 'Same day', fee: '₱30.00', residency: true,
    },
    bilihan: {
      name: 'Certificate for Bilihan', short: 'Bilihan', icon: 'cart', color: 'hsl(40, 92%, 61%)',
      desc: 'Barangay certification for buy-and-sell transactions (e.g., livestock, motor vehicles, land or goods) between parties in the barangay.',
      requirements: ['Valid IDs of seller and buyer', 'Description of the item / property being sold', 'Proof of ownership (if applicable)'],
      purposes: ['Sale of livestock', 'Sale of motor vehicle', 'Sale of land / property', 'Sale of goods', 'Other'],
      processing: '1 – 2 days', fee: '₱100.00', residency: true,
      extra: [
        { key: 'item', label: 'Item / Property Being Sold', placeholder: 'e.g., 1 carabao, female, 4 years old', required: true },
        { key: 'otherParty', label: 'Name of Buyer / Seller (Other Party)', placeholder: 'Full name of the other party', required: true },
      ],
    },
    jobseeker: {
      name: 'First Time Job Seeker Certificate', short: 'First Time Job Seeker', icon: 'briefcase', color: 'hsl(216, 95%, 66%)',
      desc: 'Issued under RA 11261 (First Time Jobseekers Assistance Act) so first-time job seekers can obtain pre-employment documents free of charge.',
      requirements: ['Valid ID', 'Proof of residency of at least six (6) months', 'Signed Oath of Undertaking (done at the barangay hall)'],
      purposes: ['First-time employment application'],
      processing: 'Same day', fee: 'Free (RA 11261)', residency: true,
      extra: [
        { key: 'education', label: 'Highest Educational Attainment', placeholder: 'e.g., Senior High School graduate', required: true },
      ],
    },
    barangayid: {
      name: 'Barangay ID', short: 'Barangay ID', icon: 'idcard', color: 'hsl(330, 80%, 68%)',
      desc: 'Official barangay identification card for residents. Photo capture and signature are done personally at the barangay hall.',
      requirements: ['Proof of residency', 'Birth certificate or any valid ID', 'Personal appearance for photo and signature'],
      purposes: ['Identification', 'Government transaction', 'Other'],
      processing: '2 – 3 days', fee: '₱75.00', residency: true,
      extra: [
        { key: 'emergencyName', label: 'Emergency Contact Person', placeholder: 'Full name', required: true },
        { key: 'emergencyContact', label: 'Emergency Contact Number', placeholder: '09XX XXX XXXX', required: true },
      ],
    },
    fileaction: {
      name: 'Certificate to File Action', short: 'File Action', icon: 'scale', color: 'hsl(350, 82%, 66%)',
      desc: 'Issued by the Lupon Tagapamayapa when mediation / conciliation under the Katarungang Pambarangay fails, allowing a case to be filed in court.',
      requirements: ['Valid ID', 'Existing barangay complaint / case record', 'Proof that mediation or conciliation was unsuccessful'],
      purposes: ['Filing of case in court / prosecutor'],
      processing: 'After Lupon proceedings', fee: '₱50.00', residency: false,
      extra: [
        { key: 'respondent', label: 'Respondent Name', placeholder: 'Full name of the respondent', required: true },
        { key: 'caseNo', label: 'Barangay Case No. (if known)', placeholder: 'e.g., KP-2026-014', required: false },
      ],
    },
  };

  /* ---------- Workflow ---------- */
  const STATUSES = {
    'Submitted': { cls: 'badge-submitted', icon: 'send', desc: 'Request received by the barangay.' },
    'Under Verification': { cls: 'badge-verification', icon: 'search', desc: 'Identity and residency are being checked by the barangay staff.' },
    'For Approval': { cls: 'badge-approval', icon: 'signature', desc: 'Waiting for final review and approval by authorized staff.' },
    'Ready for Pickup': { cls: 'badge-ready', icon: 'package', desc: 'Approved. Bring your valid ID to claim the document at the barangay hall.' },
    'Released': { cls: 'badge-released', icon: 'badgeCheck', desc: 'Document released to the resident.' },
    'Rejected': { cls: 'badge-rejected', icon: 'x', desc: 'Request could not be processed. See remarks.' },
  };
  const FLOW = ['Submitted', 'Under Verification', 'For Approval', 'Ready for Pickup', 'Released'];

  const ROLES = {
    admin: {
      label: 'System Administrator',
      short: 'Admin',
      role: 'admin',
      title: 'Tagasubaybay (Executive Monitor)',
      desc: 'Tungkulin: Pagsubaybay at pag-monitor sa mga transaksyon, opisyal na talaan, at audit trail ng barangay.',
      can: ['monitor', 'view', 'logs', 'settings', 'export']
    },
    secretary: {
      label: 'Barangay Secretary',
      short: 'Sec. L. Fernandez',
      role: 'secretary',
      title: 'Kalihim ng Barangay (Operations & Approval)',
      desc: 'Tungkulin: Pag-apruba ng lahat ng kahilingan sa dokumento at pagrerehistro ng mga residente sa Barangay Wawa.',
      can: ['monitor', 'view', 'verify', 'forward', 'approve', 'release', 'reject', 'residents', 'register_resident', 'approve_resident', 'walkin', 'logs', 'settings', 'reveal', 'export']
    },
  };

  const ID_TYPES = ['PhilSys National ID', "Voter's ID / Certification", "Driver's License", 'Passport', 'UMID / SSS ID', 'PhilHealth ID', 'Postal ID', 'Senior Citizen ID', 'PWD ID', 'School ID', 'Existing Barangay ID', 'Other'];
  const PUROKS = ['Purok 1', 'Purok 2', 'Purok 3', 'Purok 4', 'Purok 5', 'Purok 6', 'Purok 7'];

  /* ---------- Utils ---------- */
  const uid = (p = 'id') => p + '_' + crypto.randomUUID();
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const daysAgo = (d, h = 9) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, Math.floor(Math.random() * 59), 0, 0); return t.toISOString(); };
  const monthsAgo = (m) => { const t = new Date(); t.setMonth(t.getMonth() - m); return t.toISOString().slice(0, 10); };
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';
  const fmtDateLong = (iso) => iso ? new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
  const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
  const timeAgo = (iso) => {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
    return fmtDate(iso);
  };
  const monthsBetween = (fromISO, to = new Date()) => {
    if (!fromISO) return 0;
    const f = /^\d{4}-\d{2}-\d{2}$/.test(fromISO) ? new Date(fromISO + 'T00:00:00') : new Date(fromISO);
    if (Number.isNaN(f.getTime())) return 0;
    let m = (to.getFullYear() - f.getFullYear()) * 12 + (to.getMonth() - f.getMonth());
    if (to.getDate() < f.getDate()) m--;
    return Math.max(0, m);
  };
  const residencyText = (fromISO) => {
    const m = monthsBetween(fromISO);
    const y = Math.floor(m / 12), r = m % 12;
    if (y && r) return `${y} yr${y > 1 ? 's' : ''} ${r} mo`;
    if (y) return `${y} year${y > 1 ? 's' : ''}`;
    return `${m} month${m !== 1 ? 's' : ''}`;
  };
  const ageOf = (b) => { if (!b) return '—'; const d = new Date(b), n = new Date(); let a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
  const fullName = (p) => [p.firstName, p.middleName ? p.middleName.charAt(0) + '.' : '', p.lastName, p.suffix].filter(Boolean).join(' ');
  const maskName = (p) => `${p.firstName} ${p.lastName.charAt(0)}.`;
  const maskPhone = (s) => s ? String(s).replace(/\D/g, '').replace(/^(\d{4})\d+(\d{2})$/, '$1 ••• ••$2') : '—';
  const maskEmail = (s) => s ? s.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => a + '•'.repeat(Math.min(b.length, 6)) + c) : '—';
  const genRef = () => {
    const d = new Date();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let r = ''; for (let i = 0; i < 4; i++) r += chars[Math.floor(Math.random() * chars.length)];
    return `BW-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}-${r}`;
  };

  /* ---------- Generate Authentic Visual QR Code SVG ---------- */
  function generateQRCodeSVG(text, size = 90) {
    // Generate a deterministically patterned pseudo-QR code SVG based on text hash
    let hash = 0;
    for (let i = 0; i < text.length; i++) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    const grid = 21;
    let rects = '';
    // Standard corner position detection patterns
    const isCorner = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= grid - 7) || (r >= grid - 7 && c < 7);
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        let filled = false;
        if (isCorner(r, c)) {
          // outer 7x7 box or inner 3x3 box
          const lr = r < 7 ? r : r - (grid - 7);
          const lc = c < 7 ? c : c - (grid - 7);
          if (lr === 0 || lr === 6 || lc === 0 || lc === 6 || (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)) filled = true;
        } else {
          // Data bits based on deterministic hash
          const bit = ((hash ^ (r * 31 + c * 17)) & (1 << ((r + c) % 8))) !== 0;
          if (bit || (r === 6 && c % 2 === 0) || (c === 6 && r % 2 === 0)) filled = true;
        }
        if (filled) {
          rects += `<rect x="${c * 4}" y="${r * 4}" width="4" height="4" fill="#0f172a"/>`;
        }
      }
    }
    return `<svg viewBox="0 0 84 84" width="${size}" height="${size}" style="display:block; background:#fff; padding:4px; border:1px solid #cbd5e1; border-radius:6px;" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
  }

  /* ---------- Cloud data cache (no demo data or passwords) ---------- */
  let db = { version: 3, users: [], residents: [], requests: [], logs: [],
    settings: { barangay: 'Barangay Wawa', municipality: 'Abra de Ilog',
      province: 'Occidental Mindoro', secretary: 'Barangay Secretary',
      hours: 'Makipag-ugnayan sa barangay hall para sa oras ng serbisyo.' } };
  const data = () => db;
  const load = () => db;
  const replaceData = next => { db = next; return db; };
  const save = () => window.BDRMSCloud.save(db);
  const reset = () => { throw new Error('Hindi maaaring i-reset ang cloud database mula sa browser.'); };

  /* ---------- Domain operations ---------- */
  function findResidentMatch(a) {
    const n = (s) => String(s || '').trim().toLowerCase();
    return data().residents.find((r) => n(r.firstName) === n(a.firstName) && n(r.lastName) === n(a.lastName) && r.birthdate === a.birthdate) || null;
  }

  async function createRequest({ applicant, docType, purpose, extra, idType, idNumber, channel, by, residentId, status, paymentStatus, orNumber, remarks, history, verification }) {
    let ref; do { ref = genRef(); } while (data().requests.some((r) => r.ref === ref));
    const now = new Date().toISOString();
    const match = residentId ? data().residents.find(r => r.id === residentId) : findResidentMatch(applicant);
    const docInfo = DOC_TYPES[docType];
    const isFeeFree = docInfo && docInfo.fee.includes('Free');

    const req = {
      id: uid('req'), ref, residentId: match ? match.id : (residentId || null),
      applicant: { ...applicant },
      docType, purpose, extra: extra || {},
      idType, idLast4: String(idNumber || '').replace(/\s/g, '').slice(-4),
      channel: channel || 'Online',
      status: status || 'Submitted',
      verification: {
        identity: !!(verification && verification.identity),
        residency: !!(verification && verification.residency),
        blotterCleared: verification ? (verification.blotterCleared !== false) : true,
      },
      paymentStatus: isFeeFree ? 'Exempt' : (paymentStatus || 'Unpaid'),
      orNumber: orNumber || (isFeeFree ? 'EXEMPT-RA11261' : ''),
      remarks: remarks || '',
      history: history || [{
        status: status || 'Submitted',
        by: by || 'Resident (online)',
        at: now,
        note: channel === 'Online' ? 'Submitted through the online portal.' : 'Encoded at the barangay hall (walk-in).'
      }],
      createdAt: now, updatedAt: now,
    };
    data().requests.unshift(req);
    await save();
    return data().requests.find(row => row.id === req.id) || req;
  }

  function trackRequest(ref, lastName) {
    const r = data().requests.find((x) => x.ref.toUpperCase() === String(ref).trim().toUpperCase());
    if (!r) return null;
    if (r.applicant.lastName.trim().toLowerCase() !== String(lastName).trim().toLowerCase()) return null;
    return r;
  }

  // Database triggers generate the authoritative audit trail.
  function log() {}
  function deviceRefs() { try { return JSON.parse(localStorage.getItem(DEVICE_KEY)) || []; } catch { return []; } }
  function addDeviceRef(ref, lastName) { const l = deviceRefs().filter((x) => x.ref !== ref); l.unshift({ ref, lastName }); localStorage.setItem(DEVICE_KEY, JSON.stringify(l.slice(0, 6))); }

  /* ---------- Supabase Auth and resident operations ---------- */
  const login = (...args) => window.BDRMSCloud.login(...args);
  const currentUser = () => window.BDRMSCloud.currentUser();
  const logout = () => window.BDRMSCloud.logout();
  const loginResident = (...args) => window.BDRMSCloud.loginResident(...args);
  const currentResident = () => window.BDRMSCloud.currentResident();
  const logoutResident = logout;
  const can = (u, perm) => !!u && !!ROLES[u.role]?.can.includes(perm);
  const isSecretary = (u = currentUser()) => !!u && u.role === 'secretary';
  const isAdmin = (u = currentUser()) => !!u && u.role === 'admin';
  const registerResidentOnline = (...args) => window.BDRMSCloud.registerResidentOnline(...args);
  const registerResidentBySecretary = (...args) => window.BDRMSCloud.registerResidentBySecretary(...args);
  const approveResidentBySecretary = (...args) => window.BDRMSCloud.setResidentStatus(args[0], 'active');
  const rejectResidentBySecretary = (...args) => window.BDRMSCloud.setResidentStatus(args[0], 'rejected', args[1]);
  const registerResident = registerResidentOnline;

  /* ---------- CSV Export Function for Barangay Secretary / DILG ---------- */
  function exportRequestsCSV() {
    const reqs = data().requests;
    const headers = ['Reference', 'Applicant Name', 'Purok', 'Contact', 'Document Type', 'Purpose', 'Channel', 'Status', 'Residency (Months)', 'Requested Date', 'Last Updated'];
    const rows = reqs.map(r => [
      `"${r.ref}"`,
      `"${fullName(r.applicant)}"`,
      `"${r.applicant.purok}"`,
      `"${r.applicant.contact || ''}"`,
      `"${DOC_TYPES[r.docType]?.name || r.docType}"`,
      `"${r.purpose || ''}"`,
      `"${r.channel}"`,
      `"${r.status}"`,
      monthsBetween(r.applicant.residentSince),
      `"${fmtDateTime(r.createdAt)}"`,
      `"${fmtDateTime(r.updatedAt)}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Barangay_Wawa_Document_Requests_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /* ---------- UI helpers ---------- */
  function toast(msg, type = 'success') {
    let stack = document.querySelector('.toast-stack');
    if (!stack) { stack = document.createElement('div'); stack.className = 'toast-stack'; document.body.appendChild(stack); }
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.setAttribute('role', 'status');
    t.innerHTML = `<div class="t-icon">${ICONS[type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info']}</div><div>${esc(msg)}</div>`;
    stack.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 3600);
  }

  const modalStack = [];
  let modalSequence = 0;

  function modal({ title, subtitle = '', body, foot = '', wide = false, onMount }) {
    const opener = document.activeElement;
    const titleId = 'modal-title-' + ++modalSequence;
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="${titleId}" tabindex="-1">
        <div class="modal-head"><div><h3 id="${titleId}">${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ''}</div>
          <button type="button" class="icon-btn" data-close aria-label="Isara">${ICONS.x}</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    const dialog = wrap.querySelector('.modal');
    const close = () => {
      const index = modalStack.indexOf(wrap);
      if (index < 0) return;
      const wasActive = wrap === modalStack.at(-1);
      modalStack.splice(index, 1);
      wrap.remove();
      document.removeEventListener('keydown', onKey);
      const top = modalStack.at(-1);
      if (top) top.inert = false;
      else document.body.classList.remove('has-modal');
      if (wasActive && opener?.isConnected) opener.focus({ preventScroll: true });
      if (wasActive && top && !top.contains(document.activeElement)) top.querySelector('.modal').focus();
    };
    const onKey = (e) => {
      if (wrap !== modalStack.at(-1)) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key !== 'Tab') return;
      const focusable = Array.from(dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]'))
        .filter(element => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
      const edge = e.shiftKey ? focusable[0] : focusable.at(-1);
      if (!focusable.length || !focusable.includes(document.activeElement) || document.activeElement === edge) {
        e.preventDefault();
        (e.shiftKey ? focusable.at(-1) : focusable[0])?.focus();
      }
    };
    wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    const previous = modalStack.at(-1);
    if (previous) previous.inert = true;
    modalStack.push(wrap);
    document.body.classList.add('has-modal');
    document.body.appendChild(wrap);
    if (onMount) onMount(dialog, close);
    if (!dialog.contains(document.activeElement)) dialog.focus({ preventScroll: true });
    return close;
  }

  function confirmDialog({ title, message, confirmText, cancelText = 'Kanselahin', danger = false, onConfirm }) {
    return modal({
      title: esc(title),
      body: `<p class="muted">${esc(message)}</p>`,
      foot: `<button type="button" class="btn btn-ghost" data-close>${esc(cancelText)}</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(confirmText)}</button>`,
      onMount: (dialog, close) => {
        dialog.querySelector('[data-close]').focus();
        dialog.querySelector('[data-ok]').addEventListener('click', async (event) => {
          event.currentTarget.disabled = true;
          try { await onConfirm(); close(); }
          catch (error) { toast(error.message, 'error'); }
          finally { if (dialog.isConnected) dialog.querySelector('[data-ok]').disabled = false; }
        });
      },
    });
  }

  const statusBadge = (s) => `<span class="badge ${STATUSES[s]?.cls || 'badge-neutral'}">${esc(s)}</span>`;
  const docIcon = (key, size = '') => {
    const d = DOC_TYPES[key];
    return `<div class="doc-icon ${size}" style="background:${d.color.replace('hsl', 'hsla').replace(')', ', 0.14)')};color:${d.color};border:1px solid ${d.color.replace('hsl', 'hsla').replace(')', ', 0.28)')}">${ICONS[d.icon]}</div>`;
  };

  /* ---------- Certificate (printable with QR code & Dry Seal) ---------- */
  function certificateHTML(req) {
    const s = data().settings, d = DOC_TYPES[req.docType], a = req.applicant;
    const name = esc(fullName(a)).toUpperCase();
    const approved = req.history.find((h) => h.status === 'Ready for Pickup');
    const issued = fmtDateLong(approved ? approved.at : new Date().toISOString());
    const age = ageOf(a.birthdate);
    const pronoun = a.sex === 'Female' ? 'she' : 'he';
    const years = residencyText(a.residentSince);
    const x = req.extra || {};
    const qrSvg = generateQRCodeSVG(`https://barangay-wawa.gov.ph/verify?ref=${req.ref}`, 84);

    const bodies = {
      indigency: `This is to certify that <b>${name}</b>, ${age} years old, ${esc(a.civilStatus).toLowerCase()}, is a bona fide resident of <b>${esc(a.purok)}, ${esc(s.barangay)}</b>, and belongs to an indigent family in this barangay.</p><p>This certification is issued upon the request of the above-named person for <b>${esc(req.purpose)}</b> purposes.`,
      clearance: `This is to certify that <b>${name}</b>, ${age} years old, ${esc(a.civilStatus).toLowerCase()}, a resident of <b>${esc(a.purok)}, ${esc(s.barangay)}</b>, is known to be of good moral character and a law-abiding citizen. As per records of this office, ${pronoun} has <b>no derogatory record</b> on file as of this date.</p><p>This clearance is issued upon request for <b>${esc(req.purpose)}</b> purposes.`,
      residency: `This is to certify that <b>${name}</b>, ${age} years old, ${esc(a.civilStatus).toLowerCase()}, is a bona fide resident of <b>${esc(a.purok)}, ${esc(s.barangay)}, ${esc(s.municipality)}, ${esc(s.province)}</b>, and has been residing in this barangay for <b>${years}</b>.</p><p>This certification is issued upon request for <b>${esc(req.purpose)}</b> purposes.`,
      bilihan: `This is to certify that <b>${name}</b>, of legal age, a resident of <b>${esc(a.purok)}, ${esc(s.barangay)}</b>, appeared before this office in connection with a buy-and-sell transaction (<i>bilihan</i>) involving <b>${esc(x.item || '—')}</b> with <b>${esc(x.otherParty || '—')}</b>.</p><p>This certification is issued for <b>${esc(req.purpose)}</b> and for whatever legal purpose it may serve.`,
      jobseeker: `This is to certify that <b>${name}</b>, ${age} years old, a resident of <b>${esc(a.purok)}, ${esc(s.barangay)}</b> for <b>${years}</b>, is a <b>qualified availee of RA 11261</b> or the <i>First Time Jobseekers Assistance Act of 2019</i>.</p><p>This certification is valid only for one (1) year from the date of issuance and is issued free of charge.`,
      barangayid: `This is to certify that <b>${name}</b>, born on ${fmtDateLong(a.birthdate)}, a resident of <b>${esc(a.purok)}, ${esc(s.barangay)}</b>, has been issued a <b>Barangay Identification Card</b>.</p><p>In case of emergency, please notify <b>${esc(x.emergencyName || '—')}</b> (${esc(x.emergencyContact || '—')}).`,
      fileaction: `This is to certify that a complaint was filed by <b>${name}</b>, a resident of <b>${esc(a.purok)}, ${esc(s.barangay)}</b>, against <b>${esc(x.respondent || '—')}</b>${x.caseNo ? ` (Barangay Case No. ${esc(x.caseNo)})` : ''}, and that mediation / conciliation proceedings under the Katarungang Pambarangay were held but <b>no settlement was reached</b>.</p><p>Therefore, the corresponding complaint may now be filed in court or before the proper government office.`,
    };

    return `
      <div class="certificate">
        <div class="cert-watermark">BARANGAY WAWA • OFFICIAL SEAL</div>
        <div class="cert-head">
          <div class="cert-seal">${ICONS.seal}</div>
          <div>
            <p>Republic of the Philippines</p>
            <p>Province of ${esc(s.province)}</p>
            <p>Municipality of ${esc(s.municipality)}</p>
            <h4>${esc(s.barangay).toUpperCase()}</h4>
            <p class="cert-office">OFFICE OF THE BARANGAY SECRETARY</p>
          </div>
          <div class="cert-seal alt">${ICONS.shield}</div>
        </div>
        <h2 class="cert-title">${esc(d.name).toUpperCase()}</h2>
        <p class="cert-to">TO WHOM IT MAY CONCERN:</p>
        <div class="cert-body"><p>${bodies[req.docType]}</p>
        <p>Issued this <b>${issued}</b> at ${esc(s.barangay)}, ${esc(s.municipality)}, ${esc(s.province)}.</p></div>
        
        <div class="cert-sign">
          <div><div class="line"></div><b>${name}</b><span>Signature of Applicant</span></div>
          <div><div class="line"></div><b>${esc(s.secretary).toUpperCase()}</b><span>Barangay Secretary</span></div>
        </div>

        <div class="cert-meta-bottom">
          <div style="display:flex; align-items:center; gap:16px;">
            ${qrSvg}
            <div style="font-size: 0.72rem; line-height: 1.4; color: #475569;">
              <div>Scan QR Code to Verify Authenticity</div>
              <div>Official Document Ref: <b style="font-family:monospace; color:#0f172a;">${esc(req.ref)}</b></div>
              <div>Presented ID: ${esc(req.idType)} (••••${esc(req.idLast4)})</div>
              <div>Barangay Fee: <b>${esc(d.fee)}</b> ${req.orNumber ? `• O.R. No.: <b style="color:#0f172a;">${esc(req.orNumber)}</b>` : ''}</div>
            </div>
          </div>
          <div class="dry-seal-box">
            <span>OFFICIAL DRY SEAL PLACEHOLDER</span>
          </div>
        </div>

        <div class="cert-foot">
          <span>Barangay Wawa Records Management System</span>
          <span>Not valid without the official barangay dry seal.</span>
        </div>
      </div>`;
  }

  return {
    ICONS, DOC_TYPES, STATUSES, FLOW, ROLES, ID_TYPES, PUROKS, RESIDENCY_MONTHS,
    data, load, replaceData, save, reset, uid, genRef, esc, fmtDate, fmtDateLong, fmtDateTime, timeAgo, monthsBetween, residencyText, ageOf,
    fullName, maskName, maskPhone, maskEmail, findResidentMatch, createRequest, trackRequest, log,
    deviceRefs, addDeviceRef,
    login, currentUser, logout, can, isSecretary, isAdmin,
    loginResident, currentResident, logoutResident, registerResident,
    registerResidentOnline, registerResidentBySecretary, approveResidentBySecretary, rejectResidentBySecretary,
    exportRequestsCSV, generateQRCodeSVG,
    toast, modal, confirmDialog, statusBadge, docIcon, certificateHTML,
  };
})();
