import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Smartphone, 
  Monitor, 
  Tablet,
  Globe, 
  Wifi, 
  MapPin,
  Clock,
  ShieldAlert,
  LogOut,
  Navigation,
  Activity,
  ShieldCheck,
  Server,
  User as UserIcon,
  Shield,
  Cpu,
  Fingerprint
} from 'lucide-react';
import './SessionManager.css';
import { useAuth } from '../../context/AuthContext';
import { 
  getDeviceType, 
  getBrowserInfo, 
  getOSInfo, 
  fetchSessionDetails,
  SessionInfo 
} from '../../src/utils/sessionUtils';

import { firebaseRest } from '../../services/firebaseRest';

interface SessionManagerProps {
  onBack: () => void;
  showNotification?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const SessionManager: React.FC<SessionManagerProps> = ({ onBack, showNotification }) => {
  const { user, updateUser } = useAuth();
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [locationAlert, setLocationAlert] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<SessionInfo>({
    device: "Detecting...",
    browser: "...",
    os: "...",
    ip: "...",
    location: "...",
    city: "...",
    region: "...",
    country: "...",
    isp: "...",
    lat: 0,
    lon: 0,
    timezone: "...",
    isVpn: false,
    isHosting: false,
    lastActive: "Active Now",
    isCurrent: true,
    continent: "...",
    calling_code: "...",
    flag_img: "",
    flag_emoji: "",
    org: "..."
  });

  useEffect(() => {
    const initSession = async () => {
      const ua = navigator.userAgent;
      const device = getDeviceType(ua);
      const browser = getBrowserInfo(ua);
      const os = getOSInfo(ua);
      
      const details = await fetchSessionDetails();
      
      const newSessionInfo = {
        device,
        browser,
        os,
        ip: details.ip || "Unavailable",
        location: details.location || "Unknown",
        city: details.city || "Unknown",
        region: details.region || "Unknown",
        country: details.country || "Unknown",
        isp: details.isp || "Unknown Provider",
        lat: details.lat || 0,
        lon: details.lon || 0,
        timezone: details.timezone || "Unknown",
        isVpn: details.isVpn || false,
        isHosting: details.isHosting || false,
        lastActive: "Active Now",
        isCurrent: true,
        continent: details.continent || "Unknown",
        calling_code: details.calling_code || "Unknown",
        flag_img: details.flag_img || "",
        flag_emoji: details.flag_emoji || "",
        org: details.org || "Unknown",
        vpnDetails: details.vpnDetails,
        hostingProvider: details.hostingProvider
      };
      
      setCurrentSession(newSessionInfo);

      if (user?.email) {
        // Save current session to Firebase
        await firebaseRest.saveSession(user.email, newSessionInfo);

        // Update local user state if location changed
        const newLocation = `${newSessionInfo.location} ${newSessionInfo.flag_emoji || ''}`.trim();
        if (user.location !== newLocation && newSessionInfo.location !== "Unknown" && newSessionInfo.location !== "Unable to detect location") {
          updateUser({ location: newLocation });
        }

        const sessions = await firebaseRest.getSessions(user.email);
        
        // Filter out current session from past sessions
        const currentSessionId = btoa(`${device}-${browser}-${os}-${newSessionInfo.ip}`).replace(/=/g, '');
        const past = sessions.filter(s => s.id !== currentSessionId);
        setPastSessions(past);

        // Check for new location
        if (past.length > 0) {
          const lastSession = past[0];
          if (lastSession.location && 
              lastSession.location !== newSessionInfo.location && 
              newSessionInfo.location !== "Unknown" && 
              newSessionInfo.location !== "Unable to detect location") {
            const msg = `New location change from ${lastSession.location} ${lastSession.flag_emoji || ''}. Was this you?`;
            setLocationAlert(msg);
            if (showNotification) {
              showNotification(`Unusual Activity: ${msg}`, 'error');
            }
          }
        }
      }
    };

    initSession();
  }, []);

  const handleLogoutAll = async () => {
    if (user?.email) {
      try {
        // Remove all past sessions from Firebase
        for (const session of pastSessions) {
          await firebaseRest.removeSession(user.email, session.id);
        }
        setPastSessions([]);
        setLocationAlert(null);
        alert("Successfully terminated all other sessions. Your account is now secure.");
      } catch (err) {
        console.error("Failed to terminate sessions:", err);
        alert("Failed to terminate some sessions. Please try again.");
      }
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "Mobile": return <Smartphone size={24} />;
      case "Tablet": return <Tablet size={24} />;
      case "Desktop": return <Monitor size={24} />;
      default: return <Globe size={24} />;
    }
  };

  return (
    <div className="session-manager-container">
      {/* Background Elements - Pointer events none to prevent blocking scroll */}
      <div className="session-grid-bg" style={{ pointerEvents: 'none' }} />
      <div className="session-glow-orb" style={{ pointerEvents: 'none' }} />

      <header className="session-manager-header">
        <button className="session-back-btn" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="session-header-title">Security Intelligence</h1>
      </header>

      <div className="session-content">
        {/* User Profile Greeting */}
        <section className="session-user-profile">
          <div className="session-avatar-container">
            <img 
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=10b981&color=fff`} 
              alt="Profile" 
              className="session-user-avatar"
              referrerPolicy="no-referrer"
            />
            <div className="session-verified-badge">
              <ShieldCheck size={14} />
            </div>
          </div>
          <div className="session-user-info">
            <h2 className="session-full-name">Hi {user?.name || 'UnityDev Elite'},</h2>
            <p className="session-security-brief">
              You are currently active in the <span className="font-bold uppercase" style={{ color: 'var(--app-accent, #10b981)' }}>{currentSession.timezone}</span> region. 
              Based on our system intelligence, you are connecting from <span className="font-bold uppercase" style={{ color: 'var(--app-accent, #10b981)' }}>{currentSession.city}</span>. 
              Your account is fully secured with end-to-end encryption within <span className="font-bold uppercase" style={{ color: 'var(--app-accent, #10b981)' }}>{currentSession.country}</span>. 
              Enjoy your experience on <span className="font-black tracking-tighter italic">UnityDev</span>.
            </p>
          </div>
        </section>

        {/* Current Session Card */}
        <section className="session-main-card">
          <div className="session-card-header">
            <div className="session-device-badge">
              <div className="session-icon-box">
                {getDeviceIcon(currentSession.device)}
              </div>
              <div className="session-device-text">
                <div className="session-device-name">{currentSession.device} • {currentSession.browser}</div>
                <div className="session-os-name">{currentSession.os} System</div>
              </div>
            </div>
            <div className="session-live-tag">
              <div className="session-live-dot"></div>
              Live
            </div>
          </div>

          <div className="session-stats-grid">
            <div className="session-stat-item">
              <span className="session-stat-label">Network IP</span>
              <div className="session-stat-value">
                <Globe size={14} className="session-stat-icon" />
                {currentSession.ip}
              </div>
            </div>

            <div className="session-stat-item">
              <span className="session-stat-label">Provider (ISP)</span>
              <div className="session-stat-value">
                <Wifi size={14} className="session-stat-icon" />
                {currentSession.isp}
              </div>
            </div>

            <div className="session-stat-item">
              <span className="session-stat-label">Organization</span>
              <div className="session-stat-value">
                <Server size={14} className="session-stat-icon" />
                {currentSession.org}
              </div>
            </div>

            <div className="session-stat-item">
              <span className="session-stat-label">Geo-Location</span>
              <div className="session-stat-value">
                {currentSession.flag_img ? (
                  <img src={currentSession.flag_img} alt={currentSession.country} className="w-4 h-3 object-cover rounded-sm" />
                ) : (
                  <MapPin size={14} className="session-stat-icon" />
                )}
                {currentSession.location}
              </div>
            </div>

            <div className="session-stat-item">
              <span className="session-stat-label">Continent</span>
              <div className="session-stat-value">
                <Globe size={14} className="session-stat-icon" />
                {currentSession.continent}
              </div>
            </div>

            <div className="session-stat-item">
              <span className="session-stat-label">Coordinates</span>
              <div className="session-stat-value">
                <Navigation size={14} className="session-stat-icon" />
                {currentSession.lat.toFixed(4)}°, {currentSession.lon.toFixed(4)}°
              </div>
            </div>

            <div className="session-stat-item">
              <span className="session-stat-label">Local Timezone</span>
              <div className="session-stat-value">
                <Clock size={14} className="session-stat-icon" />
                {currentSession.timezone}
              </div>
            </div>

            <div className="session-stat-item">
              <span className="session-stat-label">Calling Code</span>
              <div className="session-stat-value">
                <Smartphone size={14} className="session-stat-icon" />
                {currentSession.calling_code === "Unknown" ? "Unknown" : `+${currentSession.calling_code}`}
              </div>
            </div>

            <div className="session-stat-item">
              <span className="session-stat-label">Security Protocol</span>
              <div className="session-stat-value">
                <Fingerprint size={14} className="session-stat-icon" />
                AES
              </div>
            </div>
          </div>

          <div className="session-security-row">
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-2">
                  <Shield size={12} />
                  Network Integrity
                </div>
                <div className="session-security-tags flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <span className={`security-tag ${currentSession.isVpn ? 'warning' : 'safe'} self-start`}>
                      VPN / Proxy: {currentSession.isVpn ? 'Detected' : 'Clear'}
                    </span>
                    {currentSession.vpnDetails && (
                      <div className="flex flex-wrap gap-2">
                        <span className={`security-tag text-[9px] px-1.5 py-0.5 ${currentSession.vpnDetails.is_proxy ? 'warning' : 'safe'}`}>
                          Proxy: {currentSession.vpnDetails.is_proxy ? 'Yes' : 'No'}
                        </span>
                        <span className={`security-tag text-[9px] px-1.5 py-0.5 ${currentSession.vpnDetails.is_tor ? 'warning' : 'safe'}`}>
                          Tor: {currentSession.vpnDetails.is_tor ? 'Yes' : 'No'}
                        </span>
                        <span className={`security-tag text-[9px] px-1.5 py-0.5 ${currentSession.vpnDetails.is_anonymous ? 'warning' : 'safe'}`}>
                          Anonymous: {currentSession.vpnDetails.is_anonymous ? 'Yes' : 'No'}
                        </span>
                        <span className={`security-tag text-[9px] px-1.5 py-0.5 ${currentSession.vpnDetails.is_vpn ? 'warning' : 'safe'}`}>
                          VPN: {currentSession.vpnDetails.is_vpn ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className={`security-tag ${currentSession.isHosting ? 'warning' : 'safe'} self-start`}>
                      Hosting: {currentSession.isHosting ? 'Detected' : 'Residential'}
                    </span>
                    {currentSession.isHosting && currentSession.hostingProvider && (
                      <span className="security-tag warning text-[9px] px-1.5 py-0.5 self-start">
                        Provider: {currentSession.hostingProvider}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Integrated Actions */}
              <div className="session-card-footer">
                <button className="session-logout-btn" onClick={handleLogoutAll}>
                  <LogOut size={16} />
                  Terminate All Other Sessions
                </button>
                
                <div className="session-mini-tip">
                  <ShieldAlert size={14} className="text-amber-500" />
                  <span>
                    <strong>Security Tip:</strong> Use the button above if you don't recognize this activity.
                  </span>
                </div>
              </div>
            </section>

        {/* Location Alert */}
        {locationAlert && (
          <section className="session-alert-card bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <ShieldAlert size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-amber-500 font-bold text-sm mb-1">Unusual Activity Detected</h3>
              <p className="text-zinc-300 text-sm">{locationAlert}</p>
              <button className="mt-3 text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 px-3 py-1.5 rounded-md hover:bg-amber-500/30 transition-colors" onClick={handleLogoutAll}>
                Secure Account
              </button>
            </div>
          </section>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <section className="session-past-card">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={14} />
              Past Sessions
            </h3>
            <div className="flex flex-col gap-3">
              {pastSessions.map((session) => (
                <div key={session.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-zinc-200">{session.device} • {session.browser}</div>
                      <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={10} />
                        {session.location} {session.flag_emoji}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1">
                    <div className="text-xs font-medium text-zinc-400">
                      {new Date(session.lastActive).toLocaleString()}
                    </div>
                    <div className="flex gap-2">
                      {session.isVpn && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">VPN</span>}
                      {session.isHosting && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">Hosting</span>}
                    </div>
                    <button 
                      className="mt-1 text-[10px] uppercase font-bold text-red-500 hover:text-red-400 transition-colors"
                      onClick={async () => {
                        if (user?.email) {
                          await firebaseRest.removeSession(user.email, session.id);
                          setPastSessions(prev => prev.filter(s => s.id !== session.id));
                        }
                      }}
                    >
                      Terminate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Extra spacer to ensure scrolling works on all devices */}
        <div className="session-scroll-spacer" style={{ height: '100px' }} />
      </div>

      {/* Scrolling Ticker */}
      <div className="session-ticker-container">
        <div className="session-ticker-wrapper">
          <div className="session-ticker-item">
            <span className="session-ticker-dot"></span>
            SECURITY STATUS: ENCRYPTED
          </div>
          <div className="session-ticker-item">
            <span className="session-ticker-dot"></span>
            NETWORK INTEGRITY: 100%
          </div>
          <div className="session-ticker-item">
            <span className="session-ticker-dot"></span>
            GEO-LOCATION: VERIFIED
          </div>
          <div className="session-ticker-item">
            <span className="session-ticker-dot"></span>
            UNITYDEV PRO: ACTIVE
          </div>
          {/* Duplicate for seamless loop */}
          <div className="session-ticker-item">
            <span className="session-ticker-dot"></span>
            SECURITY STATUS: ENCRYPTED
          </div>
          <div className="session-ticker-item">
            <span className="session-ticker-dot"></span>
            NETWORK INTEGRITY: 100%
          </div>
          <div className="session-ticker-item">
            <span className="session-ticker-dot"></span>
            GEO-LOCATION: VERIFIED
          </div>
          <div className="session-ticker-item">
            <span className="session-ticker-dot"></span>
            UNITYDEV PRO: ACTIVE
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManager;
