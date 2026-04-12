import React from 'react';

interface UnityDevLogoProps {
  size?: number;
}

/**
 * UnityDeV AI logo — pure SVG, no network request, renders instantly.
 * Green circle (#1acf8a) with a white bold 8-pointed asterisk.
 */
const UnityDevLogo: React.FC<UnityDevLogoProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="UnityDeV AI"
  >
    {/* Green circle */}
    <circle cx="24" cy="24" r="24" fill="#1acf8a" />

    {/* Bold 8-pointed asterisk — 4 lines crossing through centre */}
    {/* Horizontal */}
    <line x1="10" y1="24" x2="38" y2="24" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
    {/* Vertical */}
    <line x1="24" y1="10" x2="24" y2="38" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
    {/* Diagonal \ */}
    <line x1="13.5" y1="13.5" x2="34.5" y2="34.5" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
    {/* Diagonal / */}
    <line x1="34.5" y1="13.5" x2="13.5" y2="34.5" stroke="white" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export default UnityDevLogo;
