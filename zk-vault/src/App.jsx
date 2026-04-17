import { useState, useEffect, useRef } from 'react'
import './App.css'
import {
  initializeVault,
  uploadFile,
  searchFiles,
  listFiles,
  downloadFile,
  downloadFileRaw,
  deleteFile,
  healthCheck,
} from './api'

// ─── Icons (inline SVG helpers) ───
const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const KeyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>
)

const UploadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)

const FileIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
  </svg>
)

const ImageIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
)

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
)

const BoltIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const RefreshIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
)

const ServerIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
  </svg>
)

const CodeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
)

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const CircleIcon = ({ color }) => (
  <span style={{
    width: 8, height: 8, borderRadius: '50%',
    background: color, display: 'inline-block',
  }} />
)

// ─── File type util ───
function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (['pdf'].includes(ext)) return 'pdf';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return 'img';
  if (['env', 'key', 'pem', 'pub'].includes(ext)) return 'key';
  return 'doc';
}

const FILE_ICONS = {
  doc: <FileIcon />,
  img: <ImageIcon />,
  pdf: <FileIcon />,
  key: <KeyIcon />,
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── Main App ───
function App() {
  // Vault state
  const [backendOnline, setBackendOnline] = useState(null);
  const [vaultInitialized, setVaultInitialized] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [masterKeyHex, setMasterKeyHex] = useState(null);
  const [privateKey, setPrivateKey] = useState(null);

  // File state
  const [vaultFiles, setVaultFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchActive, setSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchTime, setSearchTime] = useState(null);

  // UI state
  const [activeSection, setActiveSection] = useState('hero');
  const [logEntries, setLogEntries] = useState([]);
  const [autoDecrypt, setAutoDecrypt] = useState(true);
  const fileInputRef = useRef(null);
  const fileNameMapRef = useRef(new Map()); // Persistent map: fileId → { name, type }

  // ─── Add log entry ───
  const addLog = (message, type = 'info') => {
    setLogEntries(prev => [...prev.slice(-20), {
      time: new Date().toLocaleTimeString(),
      message,
      type,
    }]);
  };

  // ─── Check backend health on mount ───
  useEffect(() => {
    healthCheck().then(result => {
      setBackendOnline(result.online);
      if (result.online) addLog('Backend connected', 'success');
      else addLog('Backend offline — using demo mode', 'warn');
    });
  }, []);

  // ─── Scroll spy ───
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'features', 'workflow', 'vault', 'tech', 'impact'];
      for (const id of [...sections].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 200) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Initialize vault ───
  const handleInitVault = async () => {
    try {
      addLog('Generating RSA-2048 key pair...');
      const data = await initializeVault();
      setSessionId(data.sessionId);
      setMasterKeyHex(data.masterKey);
      setPrivateKey(data.privateKey);
      setVaultInitialized(true);
      addLog('RSA key pair generated', 'success');
      addLog(`Master Key (Km) created: ${data.masterKey.substring(0, 16)}...`, 'success');
      addLog(`Km wrapped with public key (RSA-OAEP)`, 'success');
      addLog(`Session: ${data.sessionId.substring(0, 8)}...`, 'info');
      addLog('⚡ Vault initialized — private key stored client-side only', 'success');
    } catch (err) {
      addLog(`Init failed: ${err.message}`, 'error');
    }
  };

  // ─── Upload file ───
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !vaultInitialized) return;

    // Clear the file input immediately so the same file can be re-selected
    // and so that state updates / re-renders don't cause a stale ref
    const inputEl = fileInputRef.current;
    if (inputEl) inputEl.value = '';

    setUploading(true);
    try {
      addLog(`Encrypting "${file.name}" (${formatSize(file.size)})...`);
      addLog('Extracting keywords & generating HMAC trapdoors...');
      const result = await uploadFile(file, masterKeyHex, sessionId);
      addLog(`Trapdoors generated: [${result.keywords.join(', ')}]`, 'info');
      addLog(`File encrypted & uploaded (ID: ${result.id.substring(0, 8)}...)`, 'success');

      // Store name in persistent map
      fileNameMapRef.current.set(result.id, {
        name: file.name,
        type: getFileType(file.name),
      });

      // Refresh file list, looking up names from the map
      const files = await listFiles(sessionId);
      setVaultFiles(files.map(f => {
        const meta = fileNameMapRef.current.get(f.id);
        return {
          ...f,
          displayName: meta?.name || f.id.substring(0, 12),
          type: meta?.type || 'doc',
        };
      }));
    } catch (err) {
      addLog(`Upload failed: ${err.message}`, 'error');
    } finally {
      setUploading(false);
    }
  };

  // ─── Search ───
  useEffect(() => {
    if (!searchTerm.trim() || !vaultInitialized || !backendOnline) {
      setSearchResults(null);
      setSearchTime(null);
      return;
    }

    setSearchActive(true);
    const timer = setTimeout(async () => {
      try {
        addLog(`Generating trapdoor: HMAC(Km, "${searchTerm}")...`);
        const result = await searchFiles(searchTerm, masterKeyHex, sessionId);
        setSearchResults(result.matches);
        setSearchTime(result.searchTimeMs);
        setSearchActive(false);
        addLog(
          `Search complete: ${result.count} match(es) in ${result.searchTimeMs}ms — trapdoor: ${result.trapdoorUsed}`,
          result.count > 0 ? 'success' : 'info'
        );
      } catch (err) {
        setSearchActive(false);
        addLog(`Search error: ${err.message}`, 'error');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // ─── MIME type lookup for decrypted downloads ───
  const getMimeType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const mimeMap = {
      // Documents
      pdf: 'application/pdf', doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      txt: 'text/plain', csv: 'text/csv', json: 'application/json',
      xml: 'application/xml', html: 'text/html', css: 'text/css',
      js: 'application/javascript', md: 'text/markdown',
      // Images
      png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
      gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
      ico: 'image/x-icon', bmp: 'image/bmp',
      // Audio & Video
      mp3: 'audio/mpeg', wav: 'audio/wav', mp4: 'video/mp4',
      webm: 'video/webm', ogg: 'audio/ogg',
      // Archives
      zip: 'application/zip', rar: 'application/x-rar-compressed',
      gz: 'application/gzip', tar: 'application/x-tar',
      '7z': 'application/x-7z-compressed',
      // Crypto / Config
      pem: 'application/x-pem-file', key: 'application/octet-stream',
      env: 'text/plain', pub: 'text/plain',
    };
    return mimeMap[ext] || 'application/octet-stream';
  };

  // ─── Download (decrypted original or encrypted) ───
  const handleDownload = async (fileId) => {
    try {
      addLog(`Downloading file ${fileId.substring(0, 8)}...`);
      addLog('Server sends encrypted ciphertext only — zero knowledge maintained');

      let blob, filename;

      if (autoDecrypt) {
        // CORRECT: Decryption ON — decrypt client-side and give the original plaintext file
        const { buffer, filename: decName } = await downloadFile(fileId, masterKeyHex);
        filename = decName;
        addLog(`Decrypting "${filename}" client-side with AES-256-GCM...`, 'info');
        addLog(`✓ Decrypted "${filename}" successfully — saving original file locally`, 'success');
        const mimeType = getMimeType(filename);
        blob = new Blob([buffer], { type: mimeType });
      } else {
        // CORRECT: Decryption OFF — download the raw encrypted payload
        const raw = await downloadFileRaw(fileId);
        blob = raw.blob;
        filename = raw.filename;
        addLog(`Saving encrypted payload as "${filename}" — no decryption performed`, 'info');
        addLog('✓ Encrypted file saved — server never learned file content', 'success');
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // Clean up after a short delay so the browser can initiate the download
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      addLog(`Download failed: ${err.message}`, 'error');
    }
  };

  // ─── Delete ───
  const handleDelete = async (fileId) => {
    try {
      await deleteFile(fileId);
      fileNameMapRef.current.delete(fileId);
      addLog(`File ${fileId.substring(0, 8)}... deleted`, 'info');
      const files = await listFiles(sessionId);
      setVaultFiles(files.map(f => {
        const meta = fileNameMapRef.current.get(f.id);
        return {
          ...f,
          displayName: meta?.name || f.id.substring(0, 12),
          type: meta?.type || 'doc',
        };
      }));
    } catch (err) {
      addLog(`Delete failed: ${err.message}`, 'error');
    }
  };

  // ─── Display files (search results or all) ───
  const displayFiles = searchResults !== null ? searchResults : vaultFiles;

  return (
    <div className="app">
      {/* ─── Navbar ─── */}
      <nav className="navbar">
        <a className="navbar-brand" href="#hero">
          <div className="navbar-logo">🔐</div>
          <span className="navbar-title">ZK Vault</span>
          {backendOnline !== null && (
            <CircleIcon color={backendOnline ? 'var(--accent-green)' : 'var(--accent-red)'} />
          )}
        </a>
        <ul className="navbar-nav">
          {[
            ['features', 'Features'],
            ['workflow', 'How It Works'],
            ['vault', 'Vault'],
            ['tech', 'Tech Stack'],
            ['impact', 'Impact'],
          ].map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className={activeSection === id ? 'active' : ''}>
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="navbar-actions">
          {vaultInitialized ? (
            <span style={{
              fontSize: '11px',
              color: 'var(--accent-green)',
              fontFamily: "'JetBrains Mono', monospace",
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <CheckIcon /> Vault Active
            </span>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={handleInitVault} disabled={!backendOnline}>
              Initialize Vault
            </button>
          )}
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="hero" id="hero">
        <div className="hero-glow hero-glow-1"></div>
        <div className="hero-glow hero-glow-2"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            SYMMETRIC SEARCHABLE ENCRYPTION
          </div>
          <h1>
            Zero-Knowledge Storage<br />
            with <span className="gradient-text">Full Search</span> Capability
          </h1>
          <p className="hero-subtitle">
            A storage middleware layer that lets you search over encrypted data
            without ever sharing decryption keys with the cloud provider.
            Privacy meets utility.
          </p>
          <div className="hero-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={handleInitVault}
              disabled={vaultInitialized || !backendOnline}
            >
              <ShieldIcon />
              {vaultInitialized ? '✓ Vault Initialized' : 'Initialize Vault'}
            </button>
            <a className="btn btn-secondary btn-lg" href="#workflow">
              How It Works →
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">AES-256</div>
              <div className="hero-stat-label">Encryption</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">&lt;50ms</div>
              <div className="hero-stat-label">Search Latency</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">Zero</div>
              <div className="hero-stat-label">Server Knowledge</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="section" id="features">
        <div className="section-header">
          <span className="section-label">Core Capabilities</span>
          <h2 className="section-title">Built for Real-World Privacy</h2>
          <p className="section-desc">
            Beyond theoretical cryptography — three pillars engineered for
            production-grade encrypted search.
          </p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon purple"><RefreshIcon /></div>
            <h3>Dynamic Update Support</h3>
            <p>
              Add or delete files without re-indexing the entire database.
              Our architecture supports live updates while maintaining
              cryptographic integrity and scalability.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon cyan"><ShieldIcon /></div>
            <h3>Forward &amp; Backward Secrecy</h3>
            <p>
              Newly added files cannot be linked to past search queries,
              and old search tokens cannot be reused to uncover new data.
              Advanced cryptographic primitives protect temporal patterns.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon green"><BoltIcon /></div>
            <h3>Minimal Latency Overhead</h3>
            <p>
              Optimized inverted index structure ensures sub-50ms encrypted
              search — nearly as fast as unencrypted database queries.
              Hash-based lookup, zero compromise.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Workflow ─── */}
      <section className="section" id="workflow">
        <div className="section-header">
          <span className="section-label">Architecture</span>
          <h2 className="section-title">How Zero-Knowledge Vault Works</h2>
          <p className="section-desc">
            From key generation to encrypted search — every step keeps the
            server mathematically blind.
          </p>
        </div>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number n1">01</div>
            <div className="step-content">
              <h3>Initialization</h3>
              <p>
                User generates an RSA Key Pair. A Master Key (Km) is created
                and wrapped using the public key, then stored on the server.
                The private key never leaves the client.
              </p>
              <div className="code-snippet">Km_wrapped = RSA_Encrypt(Km, public_key)</div>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number n2">02</div>
            <div className="step-content">
              <h3>Secure Upload &amp; Indexing</h3>
              <p>
                Files are encrypted using Km. Keywords are extracted and a
                trapdoor is generated via HMAC. The server stores only the
                trapdoor → encrypted file ID mapping.
              </p>
              <div className="code-snippet">Trapdoor = HMAC(Km, &quot;invoice&quot;)</div>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number n3">03</div>
            <div className="step-content">
              <h3>Encrypted Search</h3>
              <p>
                User inputs a keyword. The client regenerates the trapdoor
                using Km. Server matches the trapdoor and returns encrypted
                files. Client decrypts locally.
              </p>
              <div className="code-snippet">Server.match(trapdoor) → [enc_file_1, enc_file_2]</div>
            </div>
          </div>
          <div className="workflow-step">
            <div className="step-number n4">04</div>
            <div className="step-content">
              <h3>Zero-Knowledge Guarantee</h3>
              <p>
                The server sees no plaintext data, no keywords, and no search
                intent. Only the user can decrypt. Trust moves from policy
                to mathematics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Live Vault ─── */}
      <section className="section" id="vault">
        <div className="section-header">
          <span className="section-label">Live Vault</span>
          <h2 className="section-title">Encrypted File Vault</h2>
          <p className="section-desc">
            {vaultInitialized
              ? 'Upload files to encrypt them client-side, or search with trapdoor tokens.'
              : 'Initialize the vault above to start uploading and searching encrypted files.'}
          </p>
        </div>

        {/* Crypto Log */}
        {logEntries.length > 0 && (
          <div className="crypto-log" style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: '24px',
            maxHeight: '200px',
            overflowY: 'auto',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            lineHeight: '1.8',
          }}>
            {logEntries.map((entry, i) => (
              <div key={i} style={{
                color: entry.type === 'success' ? 'var(--accent-green)'
                  : entry.type === 'error' ? 'var(--accent-red)'
                  : entry.type === 'warn' ? 'var(--accent-orange)'
                  : 'var(--text-secondary)',
              }}>
                <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>[{entry.time}]</span>
                {entry.message}
              </div>
            ))}
          </div>
        )}

        <div className="vault-demo">
          <div className="vault-toolbar">
            <div className="vault-toolbar-left">
              <div className="vault-search">
                <span className="vault-search-icon"><SearchIcon /></span>
                <input
                  type="text"
                  placeholder={vaultInitialized
                    ? "Search encrypted vault (generates trapdoor)..."
                    : "Initialize vault to enable search..."
                  }
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  disabled={!vaultInitialized}
                  id="vault-search-input"
                />
              </div>
              {searchActive && (
                <span style={{
                  fontSize: '11px', color: 'var(--accent-secondary)',
                  fontFamily: "'JetBrains Mono', monospace",
                  animation: 'pulse 1s infinite', whiteSpace: 'nowrap',
                }}>
                  Generating trapdoor...
                </span>
              )}
              {searchTime !== null && !searchActive && (
                <span style={{
                  fontSize: '11px', color: 'var(--accent-green)',
                  fontFamily: "'JetBrains Mono', monospace",
                  display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap',
                }}>
                  <CheckIcon /> {searchResults?.length || 0} match(es) · {searchTime}ms
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {/* Decrypt toggle */}
              <div className="decrypt-toggle" id="decrypt-toggle">
                <span className="decrypt-toggle-label">
                  {autoDecrypt ? <>🔓 Decryption ON</> : <>🔒 Encrypted</>}
                </span>
                <button
                  className={`toggle-switch ${autoDecrypt ? 'active' : ''}`}
                  onClick={() => {
                    setAutoDecrypt(prev => !prev);
                    addLog(
                      autoDecrypt
                        ? 'Decryption OFF — downloads will save encrypted payload'
                        : 'Decryption ON — downloads will give you the original file',
                      'info'
                    );
                  }}
                  disabled={!vaultInitialized}
                  title={autoDecrypt ? 'Downloads are decrypted — you get the original file' : 'Downloads are encrypted'}
                  id="decrypt-toggle-btn"
                >
                  <span className="toggle-thumb" />
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleUpload}
                style={{ display: 'none' }}
                id="file-upload-input"
              />
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={!vaultInitialized || uploading}
                id="upload-btn"
              >
                <UploadIcon /> {uploading ? 'Encrypting...' : 'Upload & Encrypt'}
              </button>
            </div>
          </div>
          <div className="vault-body">
            <div className="vault-file-list">
              {!vaultInitialized ? (
                <div style={{ padding: '60px 40px', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔐</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                    Vault is locked. Initialize to generate encryption keys.
                  </div>
                  <button className="btn btn-primary" onClick={handleInitVault} disabled={!backendOnline}>
                    <KeyIcon /> Generate Keys & Initialize
                  </button>
                </div>
              ) : displayFiles.length === 0 ? (
                <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                  {searchTerm
                    ? `No encrypted files match trapdoor for "${searchTerm}"`
                    : 'Vault is empty. Upload files to encrypt them.'}
                </div>
              ) : (
                displayFiles.map(file => (
                  <div className="vault-file" key={file.id}>
                    <div className={`vault-file-icon ${file.type || 'doc'}`}>
                      {FILE_ICONS[file.type || 'doc']}
                    </div>
                    <div className="vault-file-info">
                      <div className="vault-file-name">
                        {file.displayName || file.encryptedName?.substring(0, 20) + '...' || file.id.substring(0, 12)}
                      </div>
                      <div className="vault-file-meta">
                        {formatSize(file.originalSize)} · {new Date(file.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`vault-file-status ${searchActive ? 'searching' : 'encrypted'}`}>
                      <LockIcon />
                      {searchActive ? 'Matching...' : 'Encrypted'}
                    </div>
                    <div className="vault-file-actions" style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn-icon"
                        title={autoDecrypt ? 'Download Original File' : 'Download Encrypted'}
                        onClick={() => handleDownload(file.id)}
                      >
                        <DownloadIcon />
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete"
                        onClick={() => handleDelete(file.id)}
                        style={{ color: 'var(--accent-red)' }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tech Stack ─── */}
      <section className="section" id="tech">
        <div className="section-header">
          <span className="section-label">Technology</span>
          <h2 className="section-title">Technology Stack</h2>
          <p className="section-desc">
            Purpose-built from cryptographic primitives to scalable infrastructure.
          </p>
        </div>
        <div className="tech-grid">
          <div className="tech-item">
            <div className="tech-icon"><LockIcon /></div>
            <div><h4>Cryptography</h4><p>SSE, trapdoors, forward/backward secrecy</p></div>
          </div>
          <div className="tech-item">
            <div className="tech-icon"><SearchIcon /></div>
            <div><h4>Search Algorithms</h4><p>Inverted index, Boolean search logic</p></div>
          </div>
          <div className="tech-item">
            <div className="tech-icon"><ServerIcon /></div>
            <div><h4>Distributed Systems</h4><p>Client-server cloud architecture</p></div>
          </div>
          <div className="tech-item">
            <div className="tech-icon"><ShieldIcon /></div>
            <div><h4>Security Engineering</h4><p>Threat modelling, leakage control</p></div>
          </div>
          <div className="tech-item">
            <div className="tech-icon"><CodeIcon /></div>
            <div><h4>Backend APIs</h4><p>RESTful APIs, storage handling</p></div>
          </div>
          <div className="tech-item">
            <div className="tech-icon"><BoltIcon /></div>
            <div><h4>Optimization</h4><p>Sub-50ms latency, horizontal scaling</p></div>
          </div>
        </div>
      </section>

      {/* ─── Impact ─── */}
      <section className="section" id="impact">
        <div className="section-header">
          <span className="section-label">Why It Matters</span>
          <h2 className="section-title">Impact &amp; Future Scope</h2>
          <p className="section-desc">
            Moving trust from policy to mathematics — redefining data accountability.
          </p>
        </div>
        <div className="impact-grid">
          <div className="impact-card">
            <div className="impact-label user">For Users</div>
            <h3>Privacy Without Compromise</h3>
            <p>
              The seamless experience of Google Drive or Dropbox with the
              privacy of a hardware security module. Search, upload, and
              organize — all client-side encrypted.
            </p>
          </div>
          <div className="impact-card">
            <div className="impact-label provider">For Providers</div>
            <h3>Zero Liability Architecture</h3>
            <p>
              Reduces reputational risk by ensuring that even in the event
              of a server-side data breach, stolen data remains
              cryptographically useless to the attacker.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span>🔐</span>
            <span className="footer-text">
              Zero-Knowledge Vault — Kartikey Tyagi &amp; Rishank Semalti
            </span>
          </div>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#workflow">Architecture</a>
            <a href="#vault">Vault</a>
            <a href="#impact">Impact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
