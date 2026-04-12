
import React, { useState } from 'react';
import { useTheme, AppTheme } from '@/contexts/ThemeContext';
import { useAgent } from '@/contexts/AgentContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { AI_MODELS } from '@/lib/aiservice';
import { Chat } from '@/types';
import styles from './Settings.module.css';

const NewFunctionalityWrapper: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const NewFunctionality = React.lazy(() => import('@/components/features/NewFunctionality/NewFunctionality'));
  return (
    <React.Suspense fallback={null}>
      <NewFunctionality onClose={onClose} />
    </React.Suspense>
  );
};

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMemoryMap?: () => void;
  onImportRemix?: (chat: Chat) => void;
  existingChats?: Chat[];
}

// ── Google G Icon ───────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

// ── Account Settings Modal ────────────────────────────────────────────────────
const AccountSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className={styles.agentBackdrop} onClick={onClose}>
    <div
      className={styles.agentSheet}
      style={{ maxHeight: '100vh', borderRadius: '20px 20px 0 0' }}
      onClick={e => e.stopPropagation()}
    >
      <div className={styles.agentHandle} />
      <div className={styles.agentHeader}>
        <button
          className={styles.closeBtn}
          style={{ position: 'absolute', left: 16, right: 'auto' }}
          onClick={onClose}
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span className={styles.agentTitle}>Account settings</span>
      </div>

      <div className={styles.agentBody}>
        {/* Profile section */}
        <p className={styles.agentSubtitle}>Profile</p>
        <div className={styles.group}>
          {/* Email row */}
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M2 7l10 7 10-7"/>
              </svg>
              <div className={styles.rowStack}>
                <span className={styles.rowLabel}>Email</span>
                <span className={styles.rowSub}>GUEST</span>
              </div>
            </div>
          </div>
          <div className={styles.divider} />
          {/* Google row */}
          <div className={styles.row}>
            <div className={styles.rowLeft}>
              <GoogleIcon />
              <span className={styles.rowLabel}>Google</span>
            </div>
            <span className={styles.rowValue} style={{ color: 'var(--text-muted)', fontSize: 15 }}>Not yet bound</span>
          </div>
        </div>

        {/* Log out of all devices */}
        <div className={styles.group} style={{ marginTop: 16 }}>
          <button
            className={styles.row}
            style={{ justifyContent: 'flex-start' }}
          >
            <span style={{ fontSize: 16, fontWeight: 500, color: '#ff3b30' }}>Log out of all devices</span>
          </button>
        </div>

        {/* Delete account */}
        <div className={styles.group} style={{ marginTop: 8 }}>
          <button
            className={styles.row}
            style={{ justifyContent: 'flex-start' }}
          >
            <span style={{ fontSize: 16, fontWeight: 500, color: '#ff3b30' }}>Delete account</span>
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ── Agent Picker Modal ───────────────────────────────────────────────────────
const AgentPicker: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { selectedModelId, setSelectedModelId } = useAgent();

  return (
    <div className={styles.agentBackdrop} onClick={onClose}>
      <div className={styles.agentSheet} onClick={e => e.stopPropagation()}>
        <div className={styles.agentHandle} />
        <div className={styles.agentHeader}>
          <span className={styles.agentTitle}>AI Agent</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className={styles.agentBody}>
          <p className={styles.agentSubtitle}>Choose which AI model powers your conversations.</p>
          <div className={styles.group}>
            {AI_MODELS.map((model, i) => (
              <React.Fragment key={model.id}>
                <button
                  className={`${styles.row} ${styles.agentRow}`}
                  onClick={() => { setSelectedModelId(model.id); onClose(); }}
                >
                  <div className={styles.agentLeft}>
                    <div className={`${styles.agentRadio} ${selectedModelId === model.id ? styles.agentRadioSelected : ''}`}>
                      {selectedModelId === model.id && <div className={styles.agentRadioDot} />}
                    </div>
                    <div className={styles.agentInfo}>
                      <span className={styles.agentName}>{model.label}</span>
                      <span className={styles.agentDesc}>{model.description}</span>
                    </div>
                  </div>
                  {model.badge && (
                    <span className={`${styles.agentBadge} ${selectedModelId === model.id ? styles.agentBadgeActive : ''}`}>
                      {model.badge}
                    </span>
                  )}
                </button>
                {i < AI_MODELS.length - 1 && <div className={styles.divider} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Toggle component ────────────────────────────────────────────────────────
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      width: 48,
      height: 28,
      borderRadius: 14,
      border: 'none',
      background: checked ? '#4d9ef7' : 'var(--bg-quaternary)',
      cursor: 'pointer',
      position: 'relative',
      transition: 'background 0.2s',
      flexShrink: 0,
    }}
  >
    <span style={{
      position: 'absolute',
      top: 3,
      left: checked ? 23 : 3,
      width: 22,
      height: 22,
      borderRadius: '50%',
      background: '#fff',
      transition: 'left 0.2s',
      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
    }} />
  </button>
);

// ── Settings Sheet ───────────────────────────────────────────────────────────
const Settings: React.FC<SettingsProps> = ({ isOpen, onClose, onOpenMemoryMap, onImportRemix, existingChats = [] }) => {
  const [language, setLanguage] = useState('English');
  const [audioLang, setAudioLang] = useState('Use App language');
  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [importRemixOpen, setImportRemixOpen] = useState(false);
  const [myCodesOpen, setMyCodesOpen] = useState(false);
  const [newFunctionalityOpen, setNewFunctionalityOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { selectedModelId } = useAgent();
  const { settings, setSetting } = useAppSettings();

  const currentModel = AI_MODELS.find(m => m.id === selectedModelId);

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}>
        <div className={styles.sheet} onClick={e => e.stopPropagation()}>
          {/* Handle */}
          <div className={styles.handle} />

          {/* Sticky Header — in-flow layout so close button is always visible */}
          <div className={styles.header}>
            <div className={styles.headerSpacer} />
            <span className={styles.title}>Settings</span>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Scrollable body */}
          <div className={styles.body}>

            {/* New Functionality */}
            <div className={styles.sectionLabel}>Experimental</div>
            <div className={styles.group}>
              <button className={styles.row} onClick={() => setNewFunctionalityOpen(true)}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  <div className={styles.rowStack}>
                    <span className={styles.rowLabel} style={{ color: '#4d9ef7' }}>New Functionality</span>
                    <span className={styles.rowSub}>5 experimental AI features — all off by default</span>
                  </div>
                </div>
                <ChevronRight />
              </button>
            </div>

            {/* Features */}
            <div className={styles.sectionLabel}>AI Features</div>
            <div className={styles.group}>
              <div className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <rect x="2" y="3" width="9" height="18" rx="2"/>
                    <rect x="13" y="3" width="9" height="18" rx="2"/>
                  </svg>
                  <div className={styles.rowStack}>
                    <span className={styles.rowLabel}>Split-Brain Mode</span>
                    <span className={styles.rowSub}>Compare two AI models side-by-side</span>
                  </div>
                </div>
                <Toggle
                  checked={settings.splitBrainMode}
                  onChange={v => setSetting('splitBrainMode', v)}
                />
              </div>
              <div className={styles.divider} />
              <button
                className={styles.row}
                onClick={() => { if (settings.memoryMapEnabled) { onClose(); onOpenMemoryMap?.(); } }}
                style={{ opacity: settings.memoryMapEnabled ? 1 : 0.85 }}
              >
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="3"/>
                    <circle cx="4" cy="6" r="2"/>
                    <circle cx="20" cy="6" r="2"/>
                    <circle cx="4" cy="18" r="2"/>
                    <circle cx="20" cy="18" r="2"/>
                    <line x1="6" y1="7" x2="10" y2="11"/>
                    <line x1="18" y1="7" x2="14" y2="11"/>
                    <line x1="6" y1="17" x2="10" y2="13"/>
                    <line x1="18" y1="17" x2="14" y2="13"/>
                  </svg>
                  <div className={styles.rowStack}>
                    <span className={styles.rowLabel}>Memory Map</span>
                    <span className={styles.rowSub}>{settings.memoryMapEnabled ? 'Tap to open visual map' : 'Enable to visualize topics'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Toggle
                    checked={settings.memoryMapEnabled}
                    onChange={v => setSetting('memoryMapEnabled', v)}
                  />
                  {settings.memoryMapEnabled && <ChevronRight />}
                </div>
              </button>
              <div className={styles.divider} />
              <div className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                    <line x1="9" y1="10" x2="15" y2="10"/>
                    <line x1="9" y1="14" x2="13" y2="14"/>
                  </svg>
                  <div className={styles.rowStack}>
                    <span className={styles.rowLabel}>Ghost Suggestions</span>
                    <span className={styles.rowSub}>Predicted follow-up questions</span>
                  </div>
                </div>
                <Toggle
                  checked={settings.ghostSuggestionsEnabled}
                  onChange={v => setSetting('ghostSuggestionsEnabled', v)}
                />
              </div>
            </div>

            {/* Remix */}
            <div className={styles.sectionLabel}>Sharing</div>
            <div className={styles.group}>
              <button className={styles.row} onClick={() => setImportRemixOpen(true)}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="17 1 21 5 17 9"/>
                    <path d="M3 11V9a4 4 0 014-4h14"/>
                    <polyline points="7 23 3 19 7 15"/>
                    <path d="M21 13v2a4 4 0 01-4 4H3"/>
                  </svg>
                  <div className={styles.rowStack}>
                    <span className={styles.rowLabel}>Import Remix</span>
                    <span className={styles.rowSub}>Paste a code to continue someone's chat</span>
                  </div>
                </div>
                <ChevronRight />
              </button>
              <div className={styles.divider} />
              <button className={styles.row} onClick={() => setMyCodesOpen(true)}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <polyline points="16 3 21 3 21 8"/>
                    <line x1="4" y1="20" x2="21" y2="3"/>
                    <polyline points="21 16 21 21 16 21"/>
                    <line x1="15" y1="15" x2="21" y2="21"/>
                  </svg>
                  <div className={styles.rowStack}>
                    <span className={styles.rowLabel}>My Remix Codes</span>
                    <span className={styles.rowSub}>View, copy and manage codes you've created</span>
                  </div>
                </div>
                <ChevronRight />
              </button>
            </div>

            {/* Profile */}
            <div className={styles.sectionLabel}>Profile</div>
            <div className={styles.group}>
              <button className={styles.row} onClick={() => setAccountSettingsOpen(true)}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span className={styles.rowLabel}>Account settings</span>
                </div>
                <ChevronRight />
              </button>
              <div className={styles.divider} />
              <button className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <ellipse cx="12" cy="12" rx="10" ry="6"/>
                    <path d="M12 6v6l4 2"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                  <span className={styles.rowLabel}>Data controls</span>
                </div>
                <ChevronRight />
              </button>
            </div>

            {/* App */}
            <div className={styles.sectionLabel}>App</div>
            <div className={styles.group}>
              {/* AI Agent row — tapping opens the agent picker */}
              <button className={styles.row} onClick={() => setAgentPickerOpen(true)}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4"/>
                    <path d="M6 20v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
                    <path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  <span className={styles.rowLabel}>AI Agent</span>
                </div>
                <div className={styles.rowRight}>
                  <span className={styles.rowValue}>{currentModel?.label ?? 'Select'}</span>
                  <ChevronRight />
                </div>
              </button>
              <div className={styles.divider} />
              <div className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                  </svg>
                  <span className={styles.rowLabel}>Language</span>
                </div>
                <div className={styles.rowRight}>
                  <select className={styles.select} value={language} onChange={e => setLanguage(e.target.value)}>
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>Chinese</option>
                    <option>Arabic</option>
                  </select>
                  <ChevronRight />
                </div>
              </div>
              <div className={styles.divider} />
              <div className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                  </svg>
                  <span className={styles.rowLabel}>Appearance</span>
                </div>
                <div className={styles.rowRight}>
                  <div className={styles.appearanceSelect}>
                    <select
                      className={styles.selectBlock}
                      value={theme}
                      onChange={e => setTheme(e.target.value as AppTheme)}
                    >
                      <option value="system">System</option>
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                    <ChevronUpDown />
                  </div>
                </div>
              </div>
            </div>

            {/* Audio */}
            <div className={styles.sectionLabel}>Audio</div>
            <div className={styles.group}>
              <div className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
                    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                  <span className={styles.rowLabel}>Main language</span>
                </div>
                <div className={styles.rowRight}>
                  <div className={styles.appearanceSelect}>
                    <select className={styles.selectBlock} value={audioLang} onChange={e => setAudioLang(e.target.value)}>
                      <option>Use App language</option>
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                    </select>
                    <ChevronUpDown />
                  </div>
                </div>
              </div>
            </div>
            <p className={styles.hint}>
              Select the primary language you use for voice input to achieve better recognition results
            </p>

            {/* About */}
            <div className={styles.sectionLabel}>About</div>
            <div className={styles.group}>
              <button className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div className={styles.rowStack}>
                    <span className={styles.rowLabel}>Check for updates</span>
                    <span className={styles.rowSub}>1.8.2(3)</span>
                  </div>
                </div>
                <ChevronRight />
              </button>
              <div className={styles.divider} />
              <button className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <span className={styles.rowLabel}>Service agreement</span>
                </div>
                <ChevronRight />
              </button>
            </div>

            {/* Help */}
            <div className={styles.group}>
              <button className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <span className={styles.rowLabel}>Help &amp; Feedback</span>
                </div>
                <ChevronRight />
              </button>
            </div>

            {/* Log out */}
            <div className={styles.group}>
              <button className={styles.row}>
                <div className={styles.rowLeft}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span className={styles.rowLabel}>Log out</span>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className={styles.legalFooter}>
              <p>浙ICP备2023025841号-3A</p>
              <p>AI-generated, for reference only. Use legally.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Agent Picker — renders on top of settings sheet */}
      {agentPickerOpen && (
        <AgentPicker onClose={() => setAgentPickerOpen(false)} />
      )}

      {/* Account Settings */}
      {accountSettingsOpen && (
        <AccountSettings onClose={() => setAccountSettingsOpen(false)} />
      )}

      {/* Import Remix */}
      {importRemixOpen && (
        <ImportRemixWrapper
          existingChats={existingChats}
          onImport={(chat) => {
            onImportRemix?.(chat);
            setImportRemixOpen(false);
          }}
          onClose={() => setImportRemixOpen(false)}
        />
      )}

      {/* My Remix Codes */}
      {myCodesOpen && (
        <MyCodesWrapper onClose={() => setMyCodesOpen(false)} />
      )}

      {/* New Functionality hub */}
      {newFunctionalityOpen && (
        <NewFunctionalityWrapper onClose={() => setNewFunctionalityOpen(false)} />
      )}
    </>
  );
};

// Lazy-loaded wrapper to avoid circular deps
const ImportRemixWrapper: React.FC<{ onImport: (chat: Chat) => void; onClose: () => void; existingChats?: Chat[] }> = (props) => {
  const ImportRemix = React.lazy(() => import('@/components/features/ImportRemix/ImportRemix'));
  return (
    <React.Suspense fallback={null}>
      <ImportRemix {...props} />
    </React.Suspense>
  );
}; // Added closing brace here

const MyCodesWrapper: React.FC<{ onClose: () => void }> = (props) => {
  const MyRemixCodes = React.lazy(() => import('@/components/features/MyRemixCodes/MyRemixCodes'));
  return (
    <React.Suspense fallback={null}>
      <MyRemixCodes {...props} />
    </React.Suspense>
  );
};

const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

const ChevronUpDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 3 18 9"/>
    <polyline points="6 15 12 21 18 15"/>
  </svg>
);

export default Settings;
