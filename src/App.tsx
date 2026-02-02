import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Shield, User, GraduationCap, Briefcase, MapPin, Activity, Clock, Trash2, Download, Users, Crosshair, DollarSign, BookOpen } from 'lucide-react';
import Fuse from 'fuse.js';
import { NeuralBackground } from './components/NeuralBackground';
import { audioEngine } from './AudioEngine';
import studentData from './data/Student_Data_Refined.json';

// --- Types ---
interface StudentRecord {
  "Full Name": string;
  "Email Address": string;
  "Email (Personal Email)": string;
  "Aadhar number or PAN number (Please mention any one of them)": string;
  "College Name": string;
  "Branch/Stream": string;
  "SSC Percentage": string;
  "SSC Passing Year": string;
  "HSC Percentage /Diploma Percentage": string;
  "HSC/Diploma Passing Year": string;
  "Gender": string;
  "Date of Birth": string;
  "Mobile Number": string;
  "Full Address (Current address of Pune)": string;
  "PIN Code (College)": string;
  "Current Educational stream": string;
  "Caste ( Open/OBC/ST/NT/SC/Any other )": string;
  "Father Name": string;
  "Mother Name": string;
  "Father's Occupation": string;
  "Mother's Occupation": string;
  "How many members are there in your family?": string;
  "Did you go to a private school or a government school?": string;
  "If Applicable, What were the annual tution fees you paid in the school": string;
  "Annual Family Income (as per Income certificate)": string;
  "Income certificate or EWS certificate number (Mention the income certificate number as per the certificate)": string;
}

interface RecentTarget {
  id: number;
  name: string;
  timestamp: number;
}

// --- Sub-components (Hoisted) ---

const formatId = (val: string | undefined) => {
  if (!val) return { label: 'ID_UNSPECIFIED', value: 'N/A' };
  const clean = val.replace(/\s/g, '').toUpperCase();
  if (/^\d{12}$/.test(clean)) return { label: 'AADHAR_IDENTIFIED', value: clean.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3') };
  if (/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean)) return { label: 'PAN_CARD_VERIFIED', value: clean };
  return { label: 'ID_REF_UNSPECIFIED', value: val };
};

const DataLine = ({ label, value, isId = false, linkType }: { label: string, value: string | undefined, isId?: boolean, linkType?: 'email' | 'tel' | 'map' | 'search' }) => {
  const display = isId ? formatId(value) : { label, value: value || 'N/A' };

  const handleClick = () => {
    if (!value || value === 'N/A') return;
    switch (linkType) {
      case 'email': window.location.href = `mailto:${value}`; break;
      case 'tel': window.location.href = `tel:${value}`; break;
      case 'map': window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`, '_blank'); break;
      case 'search': window.open(`https://www.google.com/search?q=${encodeURIComponent(value)}`, '_blank'); break;
    }
    audioEngine.playTick();
  };

  return (
    <div className="data-line">
      <span className="label text-glow">{display.label}</span>
      <span className={`value ${linkType ? 'interactive' : ''}`} onClick={linkType ? handleClick : undefined}>
        {display.value}
      </span>
    </div>
  );
};

const IntelBlock = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <div className="intel-block">
    <div className="block-header">{icon}<span>{title}</span></div>
    <div className="block-content">{children}</div>
  </div>
);

const ScoreBar = ({ label, value }: { label: string, value: string | undefined }) => {
  const numValue = parseFloat(value || '0');
  const percentage = isNaN(numValue) ? 0 : numValue > 1 ? numValue : numValue * 100;
  return (
    <div className="score-bar-item">
      <div className="score-label-row"><span>{label}</span><span>{percentage.toFixed(1)}%</span></div>
      <div className="progress-bg"><motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 1, ease: "easeOut" }} className="progress-fill" /></div>
    </div>
  );
};

const SystemLog = ({ query, hasResults }: { query: string, hasResults: boolean }) => {
  const [logs, setLogs] = useState<string[]>(['[SYS] READY_FOR_INPUT...']);
  useEffect(() => {
    if (query.length > 0) {
      const newLog = hasResults ? `[SEARCH] QUERY: "${query}" // MATCHES_FOUND` : `[SEARCH] QUERY: "${query}" // SCANNING_EMPTY`;
      setLogs(prev => [newLog, ...prev].slice(0, 5));
    }
  }, [query, hasResults]);
  return (<div className="system-log">{logs.map((log, i) => <div key={i} className="log-entry" style={{ opacity: 1 - i * 0.2 }}>{log}</div>)}</div>);
};

const SatelliteTracker = ({ pin }: { pin: string | undefined }) => {
  const [lat, setLat] = useState('18.4552');
  const [lng, setLng] = useState('73.8188');
  useEffect(() => {
    const interval = setInterval(() => {
      setLat((18.455 + Math.random() * 0.01).toFixed(4));
      setLng((73.818 + Math.random() * 0.01).toFixed(4));
    }, 100);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="geo-tracker">
      <div className="sector-label"><Crosshair size={12} /> SATELLITE_FIX</div>
      <div className="coord-row"><span>LATITUDE:</span> <span>{lat}</span></div>
      <div className="coord-row"><span>LONGITUDE:</span> <span>{lng}</span></div>
      <div className="coord-row"><span>ZIP_REF:</span> <span>{pin || '000000'}</span></div>
    </div>
  );
};

const HUD = ({ mousePos }: { mousePos: { x: number, y: number } }) => (
  <div className="hud-frame">
    <div className="hud-corner hud-tl" /><div className="hud-corner hud-tr" />
    <div className="hud-corner hud-bl" /><div className="hud-corner hud-br" />
    <div className="hud-status hud-left">MOUSE_TRACKING: {mousePos.x},{mousePos.y}</div>
    <div className="hud-status hud-right">ENVELOPE: UNSECURED // LOG_ACTIVE</div>
  </div>
);

const BootSequence = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const allLogs = [
    "[SYS] INITIALIZING CORE...", "[SYS] AUTHENTICATING OPERATOR...", "[SYS] LOADING_DATA_STREAM [RECORDS: 12,154]",
    "[SYS] DECRYPTING_LOCAL_FILES...", "[SYS] BYPASSING_FIREWALL...", "[SYS] ESTABLISHING_SECURE_TUNNEL...", "[SYS] ACCESS_GRANTED."
  ];
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < allLogs.length) { setLogs(prev => [...prev, allLogs[i]]); audioEngine.playTick(); i++; }
      else { clearInterval(interval); }
    }, 300);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="boot-container crt-overlay">
      <div className="boot-log">{logs.map((log, i) => <div key={i}>{log}</div>)}</div>
      <div className="boot-footer"><div className="scanning-spinner" /><div>SYSTEM_VERSION_8.2.0 // DECRYPTING_SECURITY_PROTOCOLS...</div></div>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recentTargets, setRecentTargets] = useState<RecentTarget[]>([]);
  const [isBooting, setIsBooting] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const bootTimer = setTimeout(() => { setIsBooting(false); audioEngine.playBoot(); }, 2800);
    return () => clearTimeout(bootTimer);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (Math.random() > 0.99) audioEngine.playGlitch();
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Replaced localStorage with session-only state to prevent lag
  useEffect(() => {
    // Session state is managed via useState only now
  }, []);

  const fuse = useMemo(() => new Fuse(studentData as StudentRecord[], {
    keys: ['Full Name'],
    threshold: 0.4,
    includeScore: true,
    includeMatches: true
  }), []);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return fuse.search(query).slice(0, 10).map(res => ({
      ...res.item,
      id: (studentData as StudentRecord[]).indexOf(res.item),
      confidence: Math.round((1 - (res.score || 0)) * 100),
      matches: res.matches
    }));
  }, [query, fuse]);

  const selectedRecord = useMemo(() => selectedId === null ? null : (studentData as StudentRecord[])[selectedId], [selectedId]);

  const associates = useMemo(() => {
    if (!selectedRecord) return [];
    const surname = selectedRecord["Full Name"].split(' ').pop();
    const college = selectedRecord["College Name"];
    return (studentData as StudentRecord[]).map((s, i) => ({ ...s, id: i }))
      .filter(s => s.id !== selectedId && (s["Full Name"].endsWith(surname || '') || s["College Name"] === college)).slice(0, 4);
  }, [selectedRecord, selectedId]);

  const handleSelect = (id: number, name: string) => {
    audioEngine.playScan();
    setIsScanning(true);
    const newTarget = { id, name, timestamp: Date.now() };
    const updated = [newTarget, ...recentTargets.filter(t => t.id !== id)].slice(0, 5);
    setRecentTargets(updated);
    setTimeout(() => { setSelectedId(id); setIsScanning(false); audioEngine.playMatch(); }, 800);
  };

  const exportDossier = () => {
    if (!selectedRecord) return;
    const content = `
[CLASSIFIED//EYES ONLY]
INTEL-CORE DOSSIER: ${selectedRecord["Full Name"].toUpperCase()}
--------------------------------------------------
SYSTEM_REF: IDS_${selectedId?.toString().padStart(6, '0')}
TIMESTAMP: ${new Date().toISOString()}

1. PRIMARY_IDENTITY_PROFILE
- Name: ${selectedRecord["Full Name"]}
- Sex: ${selectedRecord["Gender"]}
- DOB: ${selectedRecord["Date of Birth"]}
- Caste: ${selectedRecord["Caste ( Open/OBC/ST/NT/SC/Any other )"]}

2. COMMUNICATION_CHANNELS
- Primary Mobile: ${selectedRecord["Mobile Number"]}
- Official Email: ${selectedRecord["Email Address"]}
- Personal Email: ${selectedRecord["Email (Personal Email)"]}

3. ACADEMIC_TRACK_RECORD
- Institution: ${selectedRecord["College Name"]}
- Stream: ${selectedRecord["Branch/Stream"]}
- Assessment History:
  - SSC: ${selectedRecord["SSC Percentage"]}% (${selectedRecord["SSC Passing Year"]})
  - HSC: ${selectedRecord["HSC Percentage /Diploma Percentage"]}% (${selectedRecord["HSC/Diploma Passing Year"]})
- Current Stream: ${selectedRecord["Current Educational stream"]}

4. FAMILY_INTELLIGENCE
- Father: ${selectedRecord["Father Name"]} (${selectedRecord["Father's Occupation"]})
- Mother: ${selectedRecord["Mother Name"]} (${selectedRecord["Mother's Occupation"]})
- Households: ${selectedRecord["How many members are there in your family?"]} members
- Schooling: ${selectedRecord["Did you go to a private school or a government school?"]}

5. FINANCIAL_PROFILE
- Annual Income: ₹${selectedRecord["Annual Family Income (as per Income certificate)"]}
- School FeesPaid: ₹${selectedRecord["If Applicable, What were the annual tution fees you paid in the school"]}
- Cert Ref: ${selectedRecord["Income certificate or EWS certificate number (Mention the income certificate number as per the certificate)"]}

6. GEOGRAPHIC_LOCATOR
- Physical Address: ${selectedRecord["Full Address (Current address of Pune)"]}
- Postal Code: ${selectedRecord["PIN Code (College)"]}

[END OF CLASSIFIED RECORD]
`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `DOSSIER_${selectedRecord["Full Name"].replace(/\s/g, '_')}_${selectedId}.txt`;
    a.click(); audioEngine.playMatch();
  };

  if (isBooting) return <BootSequence />;

  return (
    <div className="app-container crt-overlay">
      <div className="scanline" /><NeuralBackground /><HUD mousePos={mousePos} />
      <header className="system-header">
        <div className="brand">
          <img src="/favicon.png" alt="logo" className="neon-logo" style={{ width: 24, height: 24, objectFit: 'contain' }} />
          <span>INTEL-CORE // NODE_882</span>
        </div>
        <div className="status-grid">
          <div className="status-item"><Activity size={12} /> SYSTEM: ACTIVE</div>
        </div>
      </header>

      <main className="command-center">
        <section className={`search-sector ${selectedId !== null ? 'minimized' : ''}`}>
          <div className="search-wrap">
            <Search className="search-icon" size={24} /><input type="text" placeholder="SEARCH_TARGET..." value={query} onChange={(e) => { setQuery(e.target.value); if (selectedId !== null) setSelectedId(null); audioEngine.playTick(); }} autoFocus />
          </div>
          <div className="scroll-container">
            {recentTargets.length > 0 && query.length < 2 && (
              <div className="recent-sector">
                <div className="sector-label"><Clock size={12} /> RECENT_INTERCEPTS</div>
                <div className="recent-list">
                  {recentTargets.map(t => (
                    <div key={t.id} className="recent-item" onClick={() => handleSelect(t.id, t.name)}>
                      <span>{t.name.toUpperCase()}</span>
                      <Trash2 size={12} className="delete-icon" onClick={(e) => { e.stopPropagation(); setRecentTargets(prev => prev.filter(x => x.id !== t.id)); audioEngine.playError(); }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="result-stream"><AnimatePresence>{results.map((res) => (
              <motion.div key={res.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="result-item" onClick={() => handleSelect(res.id, res["Full Name"])}>
                <div className="result-main"><span className="match-tag">[MATCH]</span><span className="match-name">{res["Full Name"].toUpperCase()}</span></div>
                <div className="result-meta"><span className="confidence-tag">{res.confidence}% CONF</span><span className="match-id">ID_{res.id.toString().padStart(5, '0')}</span></div>
              </motion.div>
            ))}</AnimatePresence></div>
          </div>
          <SystemLog query={query} hasResults={results.length > 0} />
        </section>

        <AnimatePresence mode="wait">
          {selectedRecord && (
            <motion.section initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="intel-sector">
              <div className="intel-header">
                <div className="identity-badge"><div className="avatar-placeholder"><User size={64} /><div className="avatar-scan-line" /></div><div className="identity-title"><h2>{selectedRecord["Full Name"]}</h2><p className="neon-text">TARGET IDENTIFIED // {selectedRecord["Gender"]?.toUpperCase()}</p></div></div>
                <button className="export-btn" onClick={exportDossier}><Download size={16} /> EXPORT_DOSSIER</button>
              </div>

              <div className="intel-grid">
                <IntelBlock icon={<GraduationCap size={16} />} title="ACADEMIC_RECORD">
                  <DataLine label="COLLEGE" value={selectedRecord["College Name"]} linkType="search" />
                  <div className="score-visualization"><ScoreBar label="SSC" value={selectedRecord["SSC Percentage"]} /><ScoreBar label="HSC" value={selectedRecord["HSC Percentage /Diploma Percentage"]} /></div>
                  <DataLine label="BRANCH" value={selectedRecord["Branch/Stream"]} />
                </IntelBlock>

                <IntelBlock icon={<Shield size={16} />} title="PRIMARY_ID">
                  <DataLine label="OFFICIAL_EMAIL" value={selectedRecord["Email Address"]} linkType="email" />
                  <DataLine label="MOBILE" value={selectedRecord["Mobile Number"]} linkType="tel" />
                  <DataLine label="AADHAR_PAN" value={selectedRecord["Aadhar number or PAN number (Please mention any one of them)"]} isId={true} />
                </IntelBlock>

                <IntelBlock icon={<Briefcase size={16} />} title="FAMILY_STRUCTURE">
                  <DataLine label="FATHER" value={`${selectedRecord["Father Name"]} (${selectedRecord["Father's Occupation"]})`} />
                  <DataLine label="MOTHER" value={`${selectedRecord["Mother Name"]} (${selectedRecord["Mother's Occupation"]})`} />
                  <DataLine label="HOUSEHOLD_COUNT" value={selectedRecord["How many members are there in your family?"]} />
                </IntelBlock>

                <IntelBlock icon={<DollarSign size={16} />} title="ECONOMIC_STATUS">
                  <DataLine label="ANNUAL_INCOME" value={`₹${selectedRecord["Annual Family Income (as per Income certificate)"]}`} />
                  <DataLine label="CERT_REF" value={selectedRecord["Income certificate or EWS certificate number (Mention the income certificate number as per the certificate)"]} />
                  <DataLine label="TUITION_FEES" value={`₹${selectedRecord["If Applicable, What were the annual tution fees you paid in the school"]}`} />
                </IntelBlock>

                <IntelBlock icon={<BookOpen size={16} />} title="SOCIOLOGICAL_DATA">
                  <DataLine label="CASTE_CATEGORY" value={selectedRecord["Caste ( Open/OBC/ST/NT/SC/Any other )"]} />
                  <DataLine label="SCHOOL_TYPE" value={selectedRecord["Did you go to a private school or a government school?"]} />
                  <DataLine label="EDUCATIONAL_STREAM" value={selectedRecord["Current Educational stream"]} />
                </IntelBlock>

                <IntelBlock icon={<MapPin size={16} />} title="GEO_LOCATION">
                  <DataLine label="PHYSICAL_ADDRESS" value={selectedRecord["Full Address (Current address of Pune)"]} linkType="map" />
                  <SatelliteTracker pin={selectedRecord["PIN Code (College)"]} />
                </IntelBlock>

                <IntelBlock icon={<Users size={16} />} title="POTENTIAL_ASSOCIATES">
                  <div className="associates-list">{associates.map(a => (<div key={a.id} className="associate-row" onClick={() => handleSelect(a.id, a["Full Name"])}><span className="assoc-name">{a["Full Name"].toUpperCase()}</span><span className="assoc-rel">REL_IDENTIFIED</span></div>))}</div>
                </IntelBlock>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {isScanning && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="scanning-overlay">
            <div className="scanning-dialog"><div className="scanning-spinner" /><p>DECODING_ENCRYPTED_RECORD...</p></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
