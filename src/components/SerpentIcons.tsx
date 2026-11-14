import React from 'react';
import type { PickupKind } from '../game/prismEngine';

/**
 * Custom Inline SVG Title Lockup & World-Matched HUD Icons
 * Crafted with dark outer silhouettes, interior structural geometry, and top highlights.
 */

export const PrismSerpentEmblem: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`select-none ${className}`}>
    <svg
      viewBox="0 0 540 128"
      className="w-full max-w-[500px] h-auto drop-shadow-[0_8px_24px_rgba(6,182,212,0.28)]"
      role="img"
      aria-label="Prism Serpent: Neon Sovereign"
    >
      {/* Geometric Prism Crest Left */}
      <g transform="translate(8, 12)">
        <polygon
          points="52,4 96,30 96,74 52,100 8,74 8,30"
          fill="#071124"
          stroke="#06B6D4"
          strokeWidth="2.5"
        />
        <polygon
          points="52,14 86,35 86,69 52,90 18,69 18,35"
          fill="#0B1933"
          stroke="#F59E0B"
          strokeWidth="1.2"
          strokeOpacity="0.65"
        />
        {/* Coiled S-Serpent Silhouette inside Prism */}
        <path
          d="M 68 31 C 46 22, 28 36, 46 49 C 64 61, 68 77, 36 74"
          fill="none"
          stroke="#040812"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M 68 31 C 46 22, 28 36, 46 49 C 64 61, 68 77, 36 74"
          fill="none"
          stroke="#22D3EE"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        {/* Serpent Head Diamond & Optic */}
        <polygon points="75,28 63,22 61,36" fill="#F59E0B" stroke="#040812" strokeWidth="1.5" />
        <circle cx="67" cy="29" r="2" fill="#FFFBEB" />
        <circle cx="34" cy="74" r="3.5" fill="#F59E0B" />
      </g>

      {/* Primary Title Typography */}
      <g transform="translate(120, 0)">
        <text
          x="2"
          y="60"
          fill="#F8FAFC"
          stroke="#04070F"
          strokeWidth="5"
          paintOrder="stroke fill"
          fontFamily="'Chakra Petch', sans-serif"
          fontWeight="700"
          fontSize="46"
          letterSpacing="2.5"
        >
          PRISM SERPENT
        </text>
        <line x1="2" y1="74" x2="398" y2="74" stroke="#0E7490" strokeWidth="1.5" />
        <polygon points="2,72 48,72 42,76 2,76" fill="#F59E0B" />
        <text
          x="4"
          y="102"
          fill="#22D3EE"
          stroke="#04070F"
          strokeWidth="3"
          paintOrder="stroke fill"
          fontFamily="'Chakra Petch', sans-serif"
          fontWeight="600"
          fontSize="20"
          letterSpacing="6.5"
        >
          NEON SOVEREIGN
        </text>
      </g>
    </svg>
  </div>
);

export const HullVitalitySocket: React.FC<{
  state: 'full' | 'damaged' | 'empty';
  index: number;
}> = ({ state, index }) => {
  const fill =
    state === 'full' ? '#22D3EE' : state === 'damaged' ? '#F59E0B' : 'rgba(15, 23, 42, 0.55)';
  const stroke =
    state === 'full' ? '#67E8F9' : state === 'damaged' ? '#FBBF24' : 'rgba(100, 116, 139, 0.45)';
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-6 h-6 shrink-0"
      aria-label={`Hull shield pip ${index + 1}: ${state}`}
    >
      <polygon
        points="12,2 21,7 21,17 12,22 3,17 3,7"
        fill="#050914"
        stroke={stroke}
        strokeWidth="1.8"
      />
      <polygon points="12,5 18,8.5 18,15.5 12,19 6,15.5 6,8.5" fill={fill} />
      {state === 'full' && <polygon points="12,5 17,8 12,11 7,8" fill="#CFFAFE" opacity="0.65" />}
      {state === 'damaged' && (
        <path d="M 9 7 L 13 12 L 10 15 L 14 18" stroke="#050914" strokeWidth="1.8" fill="none" />
      )}
    </svg>
  );
};

export const PickupSvgIcon: React.FC<{ kind: PickupKind; className?: string }> = ({
  kind,
  className = 'w-5 h-5',
}) => {
  switch (kind) {
    case 'hyper-core':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#050814" stroke="#F59E0B" strokeWidth="1.8" />
          <polygon points="13,4 6,13 12,13 11,20 18,11 12,11" fill="#FBBF24" />
          <polygon points="13,5.5 8,12.5 12,12.5" fill="#FEF3C7" />
        </svg>
      );
    case 'magnet-prism':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <polygon points="12,2 22,12 12,22 2,12" fill="#050814" stroke="#38BDF8" strokeWidth="1.8" />
          <path
            d="M 8 9 V 13 A 4 4 0 0 0 16 13 V 9"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <rect x="6.5" y="7" width="3" height="3" fill="#F43F5E" />
          <rect x="14.5" y="7" width="3" height="3" fill="#E0F2FE" />
        </svg>
      );
    case 'phase-cloak':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <path
            d="M 12 2 L 20 6 V 12 C 20 17.2 16.5 20.8 12 22 C 7.5 20.8 4 17.2 4 12 V 6 Z"
            fill="#050814"
            stroke="#A78BFA"
            strokeWidth="1.8"
          />
          <path
            d="M 12 5 L 17 7.8 V 12 C 17 15.6 14.8 18.2 12 19.2 C 9.2 18.2 7 15.6 7 12 V 7.8 Z"
            fill="#C4B5FD"
            fillOpacity="0.85"
          />
          <path d="M 12 5 L 17 7.8 L 12 12 Z" fill="#EDE9FE" />
        </svg>
      );
    case 'chrono-shard':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <polygon points="12,2 19,8 15,12 19,16 12,22 5,16 9,12 5,8" fill="#050814" stroke="#34D399" strokeWidth="1.8" />
          <polygon points="12,4.5 16,8 12,11.5 8,8" fill="#6EE7B7" />
          <polygon points="12,12.5 16,16 12,19.5 8,16" fill="#10B981" />
        </svg>
      );
    case 'apex-crown':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <polygon
            points="3,18 5,7 9.5,12 12,5 14.5,12 19,7 21,18"
            fill="#050814"
            stroke="#F59E0B"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <polygon
            points="4.8,16.8 6.2,9.2 9.8,13.2 12,7.2 14.2,13.2 17.8,9.2 19.2,16.8"
            fill="#FBBF24"
          />
          <circle cx="12" cy="14" r="1.8" fill="#FFFBEB" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="#050814" stroke="#22D3EE" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="5.5" fill="#22D3EE" />
          <circle cx="10" cy="10" r="2" fill="#ECFEFF" />
        </svg>
      );
  }
};

export const ShrineGlyphIcon: React.FC<{ attuned: boolean; className?: string }> = ({
  attuned,
  className = 'w-4 h-4',
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <polygon
      points="12,2 19,12 12,22 5,12"
      fill="#050914"
      stroke={attuned ? '#22D3EE' : '#64748B'}
      strokeWidth="2"
    />
    <polygon
      points="12,5.5 16,12 12,18.5 8,12"
      fill={attuned ? '#22D3EE' : 'rgba(100,116,139,0.28)'}
    />
  </svg>
);

export const UtilitySquareIcon: React.FC<{
  kind: 'codex' | 'mute' | 'unmute' | 'pause' | 'restart';
}> = ({ kind }) => {
  switch (kind) {
    case 'codex':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <polygon
            points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      );
    case 'mute':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path d="M 11 5 L 6 9 H 3 V 15 H 6 L 11 19 Z" fill="currentColor" />
          <path
            d="M 16 9 L 21 15 M 21 9 L 16 15"
            stroke="#F43F5E"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'unmute':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path d="M 11 5 L 6 9 H 3 V 15 H 6 L 11 19 Z" fill="currentColor" />
          <path
            d="M 15.5 8.5 A 5 5 0 0 1 15.5 15.5 M 18.5 6 A 8.5 8.5 0 0 1 18.5 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'pause':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
          <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
        </svg>
      );
    case 'restart':
      return (
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path
            d="M 4 12 A 8 8 0 1 1 6.3 17.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <polygon points="3,7 9,7 4,13" fill="currentColor" />
        </svg>
      );
  }
};
