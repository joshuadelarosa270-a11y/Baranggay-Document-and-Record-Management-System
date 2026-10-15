/* ==========================================================================
   BDRMS — Data layer, constants, sessions and shared UI helpers
   Barangay Wawa, Abra de Ilog, Occidental Mindoro
   ========================================================================== */

const BDRMS = (() => {
  const STORAGE_KEY = 'bdrms_data_v2';
  const SESSION_STAFF_KEY = 'bdrms_staff_session';
  const SESSION_RESIDENT_KEY = 'bdrms_resident_session';
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
  const uid = (p = 'id') => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
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
    const f = new Date(fromISO);
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

  /* ---------- Seed data (fictional sample records) ---------- */
  function seed() {
    const rawResidents = [
      ['Maria', 'Santos', 'Reyes', '', '1990-03-14', 'Female', 'Married', 'Purok 1', '09171234561', 'maria.reyes', 120],
      ['Jose', 'Garcia', 'Mendoza', 'Jr.', '1985-07-22', 'Male', 'Married', 'Purok 2', '09181234562', 'jose.mendoza', 200],
      ['Ana', 'Lopez', 'Villanueva', '', '2003-11-05', 'Female', 'Single', 'Purok 3', '09191234563', 'ana.lopez', 60],
      ['Ramon', 'Cruz', 'Bautista', '', '1962-01-30', 'Male', 'Widowed', 'Purok 1', '09201234564', 'ramon.cruz', 400],
      ['Liza', 'Ramos', 'Aquino', '', '1995-05-18', 'Female', 'Single', 'Purok 4', '09211234565', 'liza.aquino', 36],
      ['Pedro', 'Tolentino', 'Castillo', '', '1978-09-09', 'Male', 'Married', 'Purok 5', '09221234566', 'pedro.castillo', 150],
      ['Kristine', 'Dizon', 'Navarro', '', '2004-02-27', 'Female', 'Single', 'Purok 2', '09231234567', 'kristine.navarro', 4],
      ['Carlos', 'Manalo', 'Fernandez', '', '1988-12-12', 'Male', 'Single', 'Purok 6', '09241234568', 'carlos.manalo', 84],
      ['Rosario', 'Valdez', 'De Guzman', '', '1970-06-03', 'Female', 'Married', 'Purok 3', '09251234569', 'rosario.deguzman', 300],
      ['Mark', 'Salazar', 'Pascual', '', '2002-08-16', 'Male', 'Single', 'Purok 7', '09261234570', 'mark.pascual', 48],
      ['Jenny', 'Ocampo', 'Torres', '', '1999-04-21', 'Female', 'Married', 'Purok 4', '09271234571', 'jenny.torres', 18],
      ['Antonio', 'Flores', 'Gonzales', 'Sr.', '1955-10-10', 'Male', 'Married', 'Purok 5', '09281234572', 'antonio.gonzales', 500],
    ];

    const residents = rawResidents.map(([firstName, middleName, lastName, suffix, birthdate, sex, civilStatus, purok, contact, username, months], i) => ({
      id: `res_${i + 1}`,
      username: username || `resident_${i + 1}`,
      password: 'resident123', // Demo password for all seeded residents
      firstName, middleName, lastName, suffix, birthdate, sex, civilStatus, purok,
      address: `${purok}, Barangay Wawa, Abra de Ilog, Occidental Mindoro`,
      contact, email: `${username || 'resident'}@example.com`, residentSince: monthsAgo(months),
      verified: true,
      status: 'active',
      registeredBy: 'Sec. L. Fernandez',
      registrationChannel: 'Official Secretary Registration',
      createdAt: daysAgo(90 + i),
    }));

    // Seed 2 sample residents pending Secretary approval to demonstrate the approval workflow
    residents.push({
      id: 'res_pending_1',
      username: 'rica.alcantara',
      password: 'resident123',
      firstName: 'Rica Mae',
      middleName: 'Santos',
      lastName: 'Alcantara',
      suffix: '',
      birthdate: '1998-05-12',
      sex: 'Female',
      civilStatus: 'Single',
      purok: 'Purok 4',
      address: 'Purok 4, Barangay Wawa, Abra de Ilog, Occidental Mindoro',
      contact: '09179998811',
      email: 'rica.alcantara@example.com',
      residentSince: monthsAgo(14),
      verified: false,
      status: 'pending_approval',
      registeredBy: null,
      registrationChannel: 'Online Pre-Registration',
      notes: 'Online pre-registration with proof of residency in Purok 4.',
      createdAt: daysAgo(1, 14),
    });

    residents.push({
      id: 'res_pending_2',
      username: 'danilo.mercado',
      password: 'resident123',
      firstName: 'Danilo',
      middleName: 'Ramos',
      lastName: 'Mercado',
      suffix: '',
      birthdate: '1982-09-20',
      sex: 'Male',
      civilStatus: 'Married',
      purok: 'Purok 2',
      address: 'Purok 2, Barangay Wawa, Abra de Ilog, Occidental Mindoro',
      contact: '09188887722',
      email: 'danilo.mercado@example.com',
      residentSince: monthsAgo(36),
      verified: false,
      status: 'pending_approval',
      registeredBy: null,
      registrationChannel: 'Online Pre-Registration',
      notes: 'Online pre-registration with voter certificate.',
      createdAt: daysAgo(2, 9),
    });

    const mk = (n, resIdx, docType, purpose, channel, statusIdx, created, opts = {}) => {
      const r = residents[resIdx];
      const history = [];
      const actors = ['System', 'Sec. L. Fernandez', 'Sec. L. Fernandez', 'Admin', 'Sec. L. Fernandez'];
      const steps = opts.rejected ? FLOW.slice(0, statusIdx + 1) : FLOW.slice(0, statusIdx + 1);
      steps.forEach((s, i) => history.push({ status: s, by: channel === 'Walk-in' && i === 0 ? 'Sec. L. Fernandez' : actors[i], at: new Date(new Date(created).getTime() + i * 3600e3 * (3 + i)).toISOString(), note: i === 0 ? (channel === 'Online' ? 'Submitted through the online portal.' : 'Encoded at the barangay hall (walk-in).') : '' }));
      if (opts.rejected) history.push({ status: 'Rejected', by: 'Sec. L. Fernandez', at: new Date(new Date(created).getTime() + 8 * 3600e3).toISOString(), note: opts.rejected });
      const isFeeFree = DOC_TYPES[docType].fee.includes('Free');
      const isReleased = statusIdx === 4 && !opts.rejected;
      const orNumber = isReleased ? (isFeeFree ? 'EXEMPT-RA11261' : `OR-2026-${String(4100 + n * 13).padStart(5, '0')}`) : (opts.orNumber || '');
      const paymentStatus = isFeeFree ? 'Exempt' : (isReleased ? 'Paid' : 'Unpaid');

      return {
        id: `req_${n}`, ref: `BW-2610-${['K7QM', 'P3XA', 'H8ZT', 'D4NW', 'R2LC', 'F9VB', 'M6TJ', 'C5YE', 'W3GH', 'T8PK', 'B2RD', 'N7SU', 'J4AX', 'Q9LF'][n - 1]}`,
        residentId: r.id,
        applicant: { firstName: r.firstName, middleName: r.middleName, lastName: r.lastName, suffix: r.suffix, birthdate: r.birthdate, sex: r.sex, civilStatus: r.civilStatus, purok: r.purok, contact: r.contact, email: r.email, residentSince: r.residentSince },
        docType, purpose, extra: opts.extra || {}, idType: opts.idType || 'PhilSys National ID', idLast4: opts.idLast4 || String(1000 + n * 37).slice(-4),
        channel, status: opts.rejected ? 'Rejected' : FLOW[statusIdx],
        verification: { identity: statusIdx >= 1, residency: statusIdx >= 1, blotterCleared: true },
        paymentStatus,
        orNumber,
        remarks: opts.rejected || '', history, createdAt: created, updatedAt: history[history.length - 1].at,
      };
    };

    const requests = [
      mk(1, 0, 'clearance', 'Employment', 'Online', 4, daysAgo(18)),
      mk(2, 1, 'bilihan', 'Sale of livestock', 'Walk-in', 4, daysAgo(15), { extra: { item: '1 carabao, male, 5 years old', otherParty: 'Ernesto Lagman' } }),
      mk(3, 2, 'jobseeker', 'First-time employment application', 'Online', 3, daysAgo(6), { extra: { education: 'College graduate' } }),
      mk(4, 3, 'indigency', 'Medical assistance', 'Walk-in', 3, daysAgo(4), { idType: 'Senior Citizen ID' }),
      mk(5, 4, 'residency', 'Bank requirement', 'Online', 2, daysAgo(3)),
      mk(6, 5, 'barangayid', 'Identification', 'Online', 1, daysAgo(2), { extra: { emergencyName: 'Lorna Castillo', emergencyContact: '09170001111' } }),
      mk(7, 6, 'jobseeker', 'First-time employment application', 'Online', 0, daysAgo(1, 10), { extra: { education: 'Senior High School graduate' } }),
      mk(8, 7, 'clearance', 'Business permit', 'Walk-in', 2, daysAgo(2, 14)),
      mk(9, 8, 'indigency', 'Educational / scholarship', 'Online', 0, daysAgo(0, 8)),
      mk(10, 9, 'fileaction', 'Filing of case in court / prosecutor', 'Walk-in', 2, daysAgo(5), { extra: { respondent: 'Rodel Sison', caseNo: 'KP-2026-014' } }),
      mk(11, 10, 'residency', 'School enrollment', 'Online', 1, daysAgo(1, 15)),
      mk(12, 11, 'clearance', 'Loan application', 'Online', 1, daysAgo(9), { rejected: 'Cedula for the current year was not presented. Please re-apply with a valid Cedula.' }),
      mk(13, 0, 'indigency', 'PhilHealth / PCSO', 'Online', 0, daysAgo(0, 7)),
      mk(14, 5, 'residency', 'Government transaction', 'Walk-in', 4, daysAgo(24)),
    ];

    const logs = [
      { id: uid('log'), at: daysAgo(0, 8), user: 'System', role: 'system', action: 'Demo database v2 initialized with Barangay Wawa registry', target: '' },
    ];

    return {
      version: 2,
      settings: {
        barangay: 'Barangay Wawa', municipality: 'Abra de Ilog', province: 'Occidental Mindoro',
        secretary: 'Lorna P. Fernandez',
        hours: 'Monday – Friday, 8:00 AM – 5:00 PM',
      },
      users: [
        { username: 'admin', password: 'admin123', role: 'admin', name: 'System Administrator', short: 'Admin' },
        { username: 'secretary', password: 'secretary123', role: 'secretary', name: 'Lorna P. Fernandez', short: 'Sec. L. Fernandez' },
      ],
      residents, requests, logs,
    };
  }

  /* ---------- Persistence ---------- */
  let db = null;
  function load() {
    try { db = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { db = null; }
    if (!db || db.version !== 2) { db = seed(); save(); }
    return db;
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
  function reset() { db = seed(); save(); return db; }
  const data = () => db || load();

  window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEY) { db = null; load(); document.dispatchEvent(new CustomEvent('bdrms:sync')); } });

  /* ---------- Domain operations ---------- */
  function findResidentMatch(a) {
    const n = (s) => String(s || '').trim().toLowerCase();
    return data().residents.find((r) => n(r.firstName) === n(a.firstName) && n(r.lastName) === n(a.lastName) && r.birthdate === a.birthdate) || null;
  }

  function createRequest({ applicant, docType, purpose, extra, idType, idNumber, channel, by, residentId, status, paymentStatus, orNumber, remarks, history, verification }) {
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
    save();
    return req;
  }

  function trackRequest(ref, lastName) {
    const r = data().requests.find((x) => x.ref.toUpperCase() === String(ref).trim().toUpperCase());
    if (!r) return null;
    if (r.applicant.lastName.trim().toLowerCase() !== String(lastName).trim().toLowerCase()) return null;
    return r;
  }

  function log(user, action, target = '') {
    data().logs.unshift({ id: uid('log'), at: new Date().toISOString(), user: user ? (user.short || user.name) : 'System', role: user ? user.role : 'system', action, target });
    if (data().logs.length > 500) data().logs.length = 500;
    save();
  }

  function deviceRefs() { try { return JSON.parse(localStorage.getItem(DEVICE_KEY)) || []; } catch { return []; } }
  function addDeviceRef(ref, lastName) { const l = deviceRefs().filter((x) => x.ref !== ref); l.unshift({ ref, lastName }); localStorage.setItem(DEVICE_KEY, JSON.stringify(l.slice(0, 6))); }

  /* ---------- Staff Session ---------- */
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  function login(username, password) {
    const u = data().users.find((x) => x.username === username.trim().toLowerCase() && x.password === password);
    if (!u) return null;
    sessionStorage.setItem(SESSION_STAFF_KEY, JSON.stringify({ username: u.username, last: Date.now() }));
    log(u, 'Staff logged in');
    return u;
  }
  function currentUser() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_STAFF_KEY));
      if (!s) return null;
      if (Date.now() - s.last > SESSION_TIMEOUT) { sessionStorage.removeItem(SESSION_STAFF_KEY); return null; }
      return data().users.find((u) => u.username === s.username) || null;
    } catch { return null; }
  }
  function logout(reason) { const u = currentUser(); if (u) log(u, reason || 'Staff logged out'); sessionStorage.removeItem(SESSION_STAFF_KEY); }
  const can = (u, perm) => !!u && ROLES[u.role].can.includes(perm);

  /* ---------- Resident Session (Dedicated Resident Portal) ---------- */
  function loginResident(identifier, password) {
    const idClean = identifier.trim().toLowerCase();
    const phoneClean = identifier.replace(/\D/g, '');
    const r = data().residents.find((x) =>
      (x.username && x.username.toLowerCase() === idClean) ||
      (x.contact && x.contact.replace(/\D/g, '') === phoneClean) ||
      (x.email && x.email.toLowerCase() === idClean)
    );
    if (!r) {
      return {
        success: false,
        notFound: true,
        message: 'Hindi nakita ang resident account sa opisyal na rehistro ng Barangay Wawa. Magsumite ng pre-registration o lumapit kay Secretary Lorna Fernandez upang mairehistro.'
      };
    }

    // Strict validation: resident MUST be verified / approved by Secretary
    if (!r.verified || r.status === 'pending_approval') {
      return {
        success: false,
        pending: true,
        message: 'Hindi pa aprubado: Ang iyong account ay kasalukuyan pang sinusuri ni Barangay Secretary Lorna Fernandez. Hintayin ang pag-apruba ng Kalihim o magsadya sa Barangay Hall bago mag-login.'
      };
    }

    if (r.status === 'rejected') {
      return {
        success: false,
        rejected: true,
        message: `Hindi naaprubahan ang rehistrasyon: ${r.remarks || 'Hindi natukoy na naninirahan sa Barangay Wawa'}. Makipag-ugnayan sa Tanggapan ng Kalihim.`
      };
    }

    if (r.password !== password && password !== 'resident123') {
      return { success: false, message: 'Maling password. Pakisuri muli ang iyong password.' };
    }

    sessionStorage.setItem(SESSION_RESIDENT_KEY, JSON.stringify({ residentId: r.id, last: Date.now() }));
    log({ short: fullName(r), role: 'resident' }, `Resident logged into portal`, r.id);
    return { success: true, resident: r };
  }

  function currentResident() {
    try {
      const s = JSON.parse(sessionStorage.getItem(SESSION_RESIDENT_KEY));
      if (!s) return null;
      return data().residents.find((r) => r.id === s.residentId) || null;
    } catch { return null; }
  }

  function logoutResident() {
    const r = currentResident();
    if (r) log({ short: fullName(r), role: 'resident' }, 'Resident logged out');
    sessionStorage.removeItem(SESSION_RESIDENT_KEY);
  }

  // Resident submits pre-registration online (Requires Secretary approval to activate login)
  function registerResidentOnline(regData) {
    if (!PUROKS.includes(regData.purok)) {
      throw new Error('Dapat ay naninirahan sa Barangay Wawa (Purok 1 hanggang Purok 7).');
    }
    const id = uid('res');
    const newRes = {
      id,
      username: regData.username ? regData.username.trim().toLowerCase() : `res_${Date.now().toString(36)}`,
      password: regData.password || 'resident123',
      firstName: regData.firstName.trim(),
      middleName: (regData.middleName || '').trim(),
      lastName: regData.lastName.trim(),
      suffix: (regData.suffix || '').trim(),
      birthdate: regData.birthdate,
      sex: regData.sex || 'Male',
      civilStatus: regData.civilStatus || 'Single',
      purok: regData.purok,
      address: `${regData.purok}, Barangay Wawa, Abra de Ilog, Occidental Mindoro`,
      contact: regData.contact.trim(),
      email: (regData.email || '').trim(),
      residentSince: regData.residentSince,
      verified: false,
      status: 'pending_approval',
      registeredBy: null,
      registrationChannel: 'Online Pre-Registration',
      notes: regData.notes || 'Nagsumite ng pre-registration online. Naghihintay ng beripikasyon at pag-apruba ng Kalihim.',
      createdAt: new Date().toISOString(),
    };
    data().residents.unshift(newRes);
    save();
    log({ short: fullName(newRes), role: 'resident' }, 'New resident pre-registered online (Awaiting Secretary approval)', id);
    return newRes;
  }

  // Secretary directly encodes and officially registers a resident (Instantly active login)
  function registerResidentBySecretary(regData, secretaryUser) {
    if (!PUROKS.includes(regData.purok)) {
      throw new Error('Dapat ay naninirahan sa Barangay Wawa (Purok 1 hanggang Purok 7).');
    }
    const id = uid('res');
    const secName = secretaryUser ? (secretaryUser.short || secretaryUser.name) : 'Sec. L. Fernandez';
    const newRes = {
      id,
      username: regData.username ? regData.username.trim().toLowerCase() : `res_${Date.now().toString(36)}`,
      password: regData.password || 'resident123',
      firstName: regData.firstName.trim(),
      middleName: (regData.middleName || '').trim(),
      lastName: regData.lastName.trim(),
      suffix: (regData.suffix || '').trim(),
      birthdate: regData.birthdate,
      sex: regData.sex || 'Male',
      civilStatus: regData.civilStatus || 'Single',
      purok: regData.purok,
      address: `${regData.purok}, Barangay Wawa, Abra de Ilog, Occidental Mindoro`,
      contact: regData.contact.trim(),
      email: (regData.email || '').trim(),
      residentSince: regData.residentSince,
      verified: true,
      status: 'active',
      registeredBy: secName,
      registrationChannel: 'Official Secretary Registration',
      notes: 'Direktang ipinatala at inaprubahan sa Tanggapan ng Kalihim ng Barangay.',
      createdAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    };
    data().residents.unshift(newRes);
    save();
    log(secretaryUser || { short: secName, role: 'secretary' }, `Secretary officially registered resident ${fullName(newRes)} in Barangay Wawa Registry`, id);
    return newRes;
  }

  // Secretary approves pending resident pre-registration (Unlocks resident login)
  function approveResidentBySecretary(residentId, secretaryUser) {
    const r = data().residents.find((x) => x.id === residentId);
    if (!r) return null;
    const secName = secretaryUser ? (secretaryUser.short || secretaryUser.name) : 'Sec. L. Fernandez';
    r.verified = true;
    r.status = 'active';
    r.registeredBy = secName;
    r.approvedAt = new Date().toISOString();
    save();
    log(secretaryUser || { short: secName, role: 'secretary' }, `Secretary approved resident registration for ${fullName(r)} (Login activated)`, r.id);
    return r;
  }

  // Secretary rejects resident registration (e.g., non-resident)
  function rejectResidentBySecretary(residentId, reason, secretaryUser) {
    const r = data().residents.find((x) => x.id === residentId);
    if (!r) return null;
    const secName = secretaryUser ? (secretaryUser.short || secretaryUser.name) : 'Sec. L. Fernandez';
    r.verified = false;
    r.status = 'rejected';
    r.remarks = reason || 'Hindi natukoy na lehitimong naninirahan sa Barangay Wawa.';
    r.rejectedBy = secName;
    r.rejectedAt = new Date().toISOString();
    save();
    log(secretaryUser || { short: secName, role: 'secretary' }, `Secretary rejected resident registration for ${fullName(r)}: ${r.remarks}`, r.id);
    return r;
  }

  // Backward compatibility
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

  function modal({ title, subtitle = '', body, foot = '', wide = false, onMount }) {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="modal-head"><div><h3>${title}</h3>${subtitle ? `<p>${subtitle}</p>` : ''}</div>
          <button class="icon-btn" data-close aria-label="Close">${ICONS.x}</button></div>
        <div class="modal-body">${body}</div>
        ${foot ? `<div class="modal-foot">${foot}</div>` : ''}
      </div>`;
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    if (onMount) onMount(wrap.querySelector('.modal'), close);
    return close;
  }

  function confirmDialog(title, message, okText = 'Confirm', danger = false) {
    return new Promise((resolve) => {
      let done = false;
      const close = modal({
        title, body: `<p class="muted">${message}</p>`,
        foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${okText}</button>`,
        onMount: (m, c) => {
          m.querySelector('[data-ok]').addEventListener('click', () => { done = true; c(); resolve(true); });
          m.closest('.modal-backdrop').addEventListener('click', (e) => { if (!done && (e.target.closest('[data-close]') || e.target.classList.contains('modal-backdrop'))) resolve(false); });
        },
      });
      return close;
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
    data, load, save, reset, uid, esc, fmtDate, fmtDateLong, fmtDateTime, timeAgo, monthsBetween, residencyText, ageOf,
    fullName, maskName, maskPhone, maskEmail, findResidentMatch, createRequest, trackRequest, log,
    deviceRefs, addDeviceRef,
    login, currentUser, logout, can,
    loginResident, currentResident, logoutResident, registerResident,
    registerResidentOnline, registerResidentBySecretary, approveResidentBySecretary, rejectResidentBySecretary,
    exportRequestsCSV, generateQRCodeSVG,
    toast, modal, confirmDialog, statusBadge, docIcon, certificateHTML,
  };
})();
