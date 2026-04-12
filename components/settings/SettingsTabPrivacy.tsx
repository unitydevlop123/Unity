
import React from 'react';

const SettingsTabPrivacy: React.FC = () => {
  return (
    <div className="settings-tab-content privacy-tab">
      <div className="privacy-container">
        <div className="privacy-header">
          <div className="privacy-logo-wrapper">
             <svg viewBox="0 0 100 100" className="privacy-logo">
              <circle cx="50" cy="50" r="48" fill="#10a37f" />
              <path d="M50 25 L50 75 M25 50 L75 50 M32 32 L68 68 M32 68 L68 32" stroke="white" strokeWidth="6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="privacy-header-text">
            <h3>UnityDev AI</h3>
            <span>Transparency & Trust</span>
          </div>
        </div>
        
        <div className="privacy-section">
          <h4 className="privacy-title">
            <span className="privacy-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </span>
            Privacy & Data Collection
          </h4>
          <div className="privacy-card">
            <p>We believe your data belongs to you. Here is exactly what we collect:</p>
            <ul className="privacy-list">
              <li>
                <strong>Conversations:</strong> Stored securely in your private encrypted Firebase path.
              </li>
              <li>
                <strong>Identity:</strong> We only store your email and a hashed version of your PIN.
              </li>
              <li>
                <strong>AI Processing:</strong> Messages are processed by <strong>UnityDev's proprietary neural engine</strong> for generation only. We do not sell your data.
              </li>
            </ul>
          </div>
        </div>

        <div className="privacy-section">
          <h4 className="privacy-title">
            <span className="privacy-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </span>
            Founder Profile
          </h4>
          <div className="founder-table-wrapper">
            <table className="founder-table">
              <tbody>
                <tr>
                  <td className="label">Founder</td>
                  <td className="value"><strong>Odigie Unity</strong></td>
                </tr>
                <tr>
                  <td className="label">Role</td>
                  <td className="value">Lead Developer & Creator</td>
                </tr>
                <tr>
                  <td className="label">Mission</td>
                  <td className="value">To democratize access to high-fidelity AI tools.</td>
                </tr>
                <tr>
                  <td className="label">Contact</td>
                  <td className="value">odigieunity4@gmail.com</td>
                </tr>
                <tr>
                  <td className="label">Location</td>
                  <td className="value">Global / Remote</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="privacy-section">
          <h4 className="privacy-title">
            <span className="privacy-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.48-.56.63-1.03.63-1.03l-4-3.5zm2.5-.5l10.5-10.5a2.12 2.12 0 0 1 3 0l0 0a2.12 2.12 0 0 1 0 3l-10.5 10.5"></path>
                <path d="M11 5l6 6"></path>
              </svg>
            </span>
            What We Do
          </h4>
          <p className="privacy-description">
            UnityDev builds cutting-edge interfaces that bridge the gap between complex Large Language Models (LLMs) and everyday human creativity. 
            We focus on <strong>speed</strong>, <strong>aesthetics</strong>, and <strong>privacy</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsTabPrivacy;
