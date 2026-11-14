import { codeHash } from 'prism-code/canonical';
import {
  PRISM_HOSTED_ATTESTATIONS,
  PRISM_MODULE_CATALOG,
  PRISM_SPEC_ADDRESS,
  PRISM_SPEC_CANONICAL_HASH,
  PRISM_SPEC_DOCUMENT,
} from './generatedPrismConstants';
import {
  decodePrismBytesToUtf8,
  encodeUtf8ToPrismBytes,
  Foundation_Architecture_V1_Model_verifyArchitectureComplete,
  Foundation_Compliance_V1_Model_verifyComplianceAndProvenance,
  Foundation_Design_V1_Model_stepShellStateMachine,
  Foundation_Design_V1_Model_verifyDesignStateTransitions,
  Foundation_Features_V1_Model_verifyAllJourneysTested,
  Foundation_Kinematics_V1_Model_computeBoostMassCostPerSec,
  Foundation_Kinematics_V1_Model_computeSegmentSpacingCm,
  Foundation_Kinematics_V1_Model_computeSerpentSpeedCmPerSec,
  Foundation_Kinematics_V1_Model_computeTurnRateMilliRadPerSec,
  Foundation_Kinematics_V1_Model_maxHullVitalityPips,
  Foundation_Kinematics_V1_Model_verifyKinematicsSpeedOrdering,
  Foundation_Leaderboard_V1_Model_classifyLeagueTier,
  Foundation_Leaderboard_V1_Model_computePlacementBonusPoints,
  Foundation_Leaderboard_V1_Model_computeUpdatedEloRating,
  Foundation_Leaderboard_V1_Model_verifyLeaderboardTierMonotonicity,
  Foundation_NpcBehavior_V1_Model_computeChargeWindupMs,
  Foundation_NpcBehavior_V1_Model_decideNpcIntentCode,
  Foundation_NpcBehavior_V1_Model_decideNpcShouldBoost,
  Foundation_NpcBehavior_V1_Model_verifyFourDistinctNpcPolicies,
  Foundation_OpenWorld_V1_Model_arenaRadiusMeters,
  Foundation_OpenWorld_V1_Model_classifyFrontierBiome,
  Foundation_OpenWorld_V1_Model_computeShrineAttuneBonus,
  Foundation_OpenWorld_V1_Model_computeWorldDiscoveryPct,
  Foundation_OpenWorld_V1_Model_openWorldRadiusMeters,
  Foundation_OpenWorld_V1_Model_verifyOpenWorldTopologyAndDiscovery,
  Foundation_Pickups_V1_Model_computeAwardedScore,
  Foundation_Pickups_V1_Model_computeMagnetPullRadiusCm,
  Foundation_Pickups_V1_Model_computePickupDurationMs,
  Foundation_Pickups_V1_Model_computePickupGrowthUnits,
  Foundation_Pickups_V1_Model_verifyChronoAmplifiesScoreAndGrowth,
  Foundation_Quality_V1_Model_verifyIso25010QualitySuite,
  Foundation_Security_V1_Model_verifyAllThreatsMitigated,
  PrismSerpent_application,
  PrismSerpent_dispatch,
  PrismSerpent_judge,
  type PrismSerpent_Request,
  PrismSerpentProofs_breaksProp001,
  PrismSerpentProofs_breaksProp002,
  PrismSerpentProofs_breaksProp003,
  PrismSerpentProofs_breaksProp004,
  PrismSerpentProofs_breaksProp005,
  PrismSerpentProofs_breaksProp006,
} from './generatedPrismRuntime';

export {
  PRISM_HOSTED_ATTESTATIONS,
  PRISM_MODULE_CATALOG,
  PRISM_SPEC_ADDRESS,
  PRISM_SPEC_CANONICAL_HASH,
  PRISM_SPEC_DOCUMENT,
};

export type ShellState = 'title' | 'playing' | 'paused' | 'gameover';
export type ShellEvent = 'start' | 'toggle-pause' | 'hull-depleted' | 'return-title';
export type GameMode = 'arena' | 'open-world';

export type PickupKind =
  | 'energy-orb'
  | 'hyper-core'
  | 'magnet-prism'
  | 'phase-cloak'
  | 'chrono-shard'
  | 'apex-crown';

export type RivalArchetype = 'forager' | 'interceptor' | 'leviathan' | 'pack-hunter';

export type FrontierBiomeId =
  | 'nexus-bowl'
  | 'cobalt-dunes'
  | 'crystalline-spire'
  | 'solaris-rift'
  | 'sanctum-ring';

export type SerpentDirective =
  | 'relic-ascension'
  | 'evasive-phase'
  | 'frontier-attune'
  | 'apex-dominance'
  | 'intercept-cut'
  | 'hyper-surge'
  | 'magnet-harvest'
  | 'chrono-cascade'
  | 'territorial-coil'
  | 'steady-forage';

export type LeagueTierName = 'Bronze' | 'Silver' | 'Gold' | 'Diamond' | 'Sovereign';

export interface BiomeDefinition {
  readonly id: FrontierBiomeId;
  readonly code: bigint;
  readonly name: string;
  readonly subtitle: string;
  readonly accentHex: string;
  readonly groundTintHex: string;
  readonly teleportX: number;
  readonly teleportZ: number;
  readonly teleportHeading: number;
}

export const FRONTIER_BIOMES: readonly BiomeDefinition[] = [
  {
    id: 'nexus-bowl',
    code: 0n,
    name: 'Nexus Bowl',
    subtitle: 'Central Harmonic Caldera',
    accentHex: '#22D3EE',
    groundTintHex: '#0B182E',
    teleportX: 0,
    teleportZ: 12,
    teleportHeading: -Math.PI / 2,
  },
  {
    id: 'cobalt-dunes',
    code: 1n,
    name: 'Cobalt Dunes',
    subtitle: 'Northeast Magnetic Drift',
    accentHex: '#38BDF8',
    groundTintHex: '#0A1E3C',
    teleportX: 44,
    teleportZ: -40,
    teleportHeading: -Math.PI * 0.75,
  },
  {
    id: 'crystalline-spire',
    code: 2n,
    name: 'Crystalline Spire',
    subtitle: 'Northwest Quartz Ridge',
    accentHex: '#A78BFA',
    groundTintHex: '#181236',
    teleportX: -46,
    teleportZ: -42,
    teleportHeading: -Math.PI * 0.25,
  },
  {
    id: 'solaris-rift',
    code: 3n,
    name: 'Solaris Rift',
    subtitle: 'Southwest Amber Thermal Trench',
    accentHex: '#F59E0B',
    groundTintHex: '#26170B',
    teleportX: -46,
    teleportZ: 44,
    teleportHeading: -Math.PI * 0.35,
  },
  {
    id: 'sanctum-ring',
    code: 4n,
    name: 'Sanctum Ring',
    subtitle: 'Outer Sovereign Monolith Frontier',
    accentHex: '#34D399',
    groundTintHex: '#092422',
    teleportX: 62,
    teleportZ: 58,
    teleportHeading: -Math.PI * 0.75,
  },
] as const;

export const SPECIAL_RELIC_CATALOG: ReadonlyArray<{
  readonly kind: PickupKind;
  readonly code: bigint;
  readonly name: string;
  readonly effectSummary: string;
  readonly hex: string;
}> = [
  {
    kind: 'hyper-core',
    code: 1n,
    name: 'Hyper-Core',
    effectSummary: 'Zero-cost overdrive surge at 28.5 m/s for 6.5s',
    hex: '#F59E0B',
  },
  {
    kind: 'magnet-prism',
    code: 2n,
    name: 'Magnet-Prism',
    effectSummary: '14.5m orbital vortex pulls orbs and loot for 8.5s',
    hex: '#38BDF8',
  },
  {
    kind: 'phase-cloak',
    code: 3n,
    name: 'Phase-Cloak',
    effectSummary: 'Spectral hull immunity through rival coils for 6.0s',
    hex: '#A78BFA',
  },
  {
    kind: 'chrono-shard',
    code: 4n,
    name: 'Chrono-Shard',
    effectSummary: '2x score and 2x segment growth cascade for 10.0s',
    hex: '#34D399',
  },
  {
    kind: 'apex-crown',
    code: 5n,
    name: 'Apex-Crown',
    effectSummary: '18m sovereign shockwave shatters nearby rivals (+250 pts)',
    hex: '#FBBF24',
  },
];

export interface SpineSegment {
  x: number;
  y: number;
  z: number;
  yaw: number;
}

export interface SerpentEntity {
  id: string;
  name: string;
  isPlayer: boolean;
  archetype: RivalArchetype;
  primaryHex: string;
  accentHex: string;
  x: number;
  y: number;
  z: number;
  heading: number;
  speed: number;
  turnRate: number;
  isOverdrive: boolean;
  onSpeedPad: boolean;
  segments: SpineSegment[];
  pathHistory: Array<{ x: number; z: number }>;
  growthUnits: number;
  boostShedAccumulator: number;
  score: number;
  eliminations: number;
  comboCount: number;
  comboTimerMs: number;
  hullPips: number;
  maxHullPips: number;
  invulnerableMs: number;
  hyperCoreMs: number;
  magnetPrismMs: number;
  phaseCloakMs: number;
  chronoShardMs: number;
  intentCode: number;
  windupMs: number;
  isCharging: boolean;
  alive: boolean;
  respawnMs: number;
  dissolveProgress: number;
}

export interface OrbEntity {
  id: number;
  x: number;
  y: number;
  z: number;
  tier: 0 | 1 | 2;
  isLoot: boolean;
  colorHex: string;
  phase: number;
  active: boolean;
  respawnMs: number;
}

export interface SpecialRelicEntity {
  id: number;
  kind: PickupKind;
  x: number;
  y: number;
  z: number;
  active: boolean;
  respawnMs: number;
  spinAngle: number;
}

export interface MonolithShrine {
  id: number;
  name: string;
  biomeId: FrontierBiomeId;
  x: number;
  y: number;
  z: number;
  attuned: boolean;
  attuneProgress: number;
  accentHex: string;
}

export interface SpeedPad {
  id: number;
  x: number;
  y: number;
  z: number;
  yaw: number;
  radius: number;
}

export interface ShockwavePulse {
  x: number;
  y: number;
  z: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  colorHex: string;
}

export interface SimulationEvent {
  type:
    | 'orb-pickup'
    | 'relic-pickup'
    | 'rival-eliminated'
    | 'player-hit'
    | 'shrine-attuned'
    | 'rival-telegraph'
    | 'run-ended';
  x: number;
  y: number;
  z: number;
  colorHex: string;
  label?: string;
  comboCount?: number;
  isLoot?: boolean;
  relicKind?: PickupKind;
  shrineIndex?: number;
  victory?: boolean;
}

export interface LiveLeaderboardRow {
  id: string;
  rank: number;
  name: string;
  isPlayer: boolean;
  archetypeLabel: string;
  score: number;
  length: number;
  eliminations: number;
  alive: boolean;
  accentHex: string;
}

export interface SovereignHallEntry {
  id: string;
  callsign: string;
  mode: GameMode;
  score: number;
  maxLength: number;
  placementRank: number;
  eliminations: number;
  shrinesAttuned: number;
  eloRating: number;
  leagueTier: LeagueTierName;
  directive: SerpentDirective;
  timestampIso: string;
  receiptHash: string;
  isPlayerRecord: boolean;
}

export interface PlayerControlInput {
  steerDelta: number; // -1 (left) .. +1 (right)
  targetWorldAngle: number | null; // optional pointer world angle
  boostHeld: boolean;
  attunePressed: boolean;
}

export interface PrismWorldState {
  mode: GameMode;
  worldRadius: number;
  elapsedSec: number;
  remainingArenaSec: number;
  hitstopSec: number;
  cameraTrauma: number;
  player: SerpentEntity;
  rivals: SerpentEntity[];
  orbs: OrbEntity[];
  relics: SpecialRelicEntity[];
  shrines: MonolithShrine[];
  speedPads: SpeedPad[];
  shockwaves: ShockwavePulse[];
  visitedBiomes: Set<FrontierBiomeId>;
  relicsCollectedCount: number;
  currentBiome: BiomeDefinition;
  worldDiscoveryPct: number;
  activeDirective: SerpentDirective;
  activeDirectiveLabel: string;
  activeRequestString: string;
  threatLevel: number;
  liveStandings: LiveLeaderboardRow[];
  runEnded: boolean;
  runVictory: boolean;
  runEndReason: string;
  bannerText: string;
  bannerTimerMs: number;
  events: SimulationEvent[];
}

export interface InvariantAuditReport {
  allPassed: boolean;
  specHash: string;
  specAddress: string;
  totalModules: number;
  hostedAttestationCount: number;
  acceptancePassed: number;
  acceptanceTotal: number;
  facetResults: ReadonlyArray<{
    facet: string;
    theorem: string;
    passed: boolean;
  }>;
}

const DIRECTIVE_LABELS: Record<SerpentDirective, string> = {
  'relic-ascension': 'Relic Ascension Shockwave',
  'evasive-phase': 'Evasive Phase Veil',
  'frontier-attune': 'Frontier Shrine Resonance',
  'apex-dominance': 'Apex Sovereign Dominance',
  'intercept-cut': 'Interceptor Vector Cut',
  'hyper-surge': 'Hyper-Core Overdrive Surge',
  'magnet-harvest': 'Orbital Magnet Harvest',
  'chrono-cascade': 'Chrono 2x Score Cascade',
  'territorial-coil': 'Leviathan Territorial Coil',
  'steady-forage': 'Harmonic Prism Forage',
};

const ANSWER_CODE_TO_DIRECTIVE: readonly SerpentDirective[] = [
  'relic-ascension',
  'evasive-phase',
  'frontier-attune',
  'apex-dominance',
  'intercept-cut',
  'hyper-surge',
  'magnet-harvest',
  'chrono-cascade',
  'territorial-coil',
  'steady-forage',
];

const TIER_CODE_TO_NAME: readonly LeagueTierName[] = [
  'Bronze',
  'Silver',
  'Gold',
  'Diamond',
  'Sovereign',
];

const ORB_PALETTE = ['#00E5FF', '#FFB800', '#FF3B7F', '#10F5A0', '#B366FF'] as const;

const RIVAL_ROSTER: ReadonlyArray<{
  name: string;
  archetype: RivalArchetype;
  primaryHex: string;
  accentHex: string;
  startLength: number;
}> = [
  {
    name: 'VEX-9',
    archetype: 'interceptor',
    primaryHex: '#F43F5E',
    accentHex: '#FB7185',
    startLength: 16,
  },
  {
    name: 'KRONOS',
    archetype: 'leviathan',
    primaryHex: '#F59E0B',
    accentHex: '#FCD34D',
    startLength: 28,
  },
  {
    name: 'LYRA-X',
    archetype: 'pack-hunter',
    primaryHex: '#A855F7',
    accentHex: '#D8B4FE',
    startLength: 15,
  },
  {
    name: 'SOL-04',
    archetype: 'forager',
    primaryHex: '#10B981',
    accentHex: '#6EE7B7',
    startLength: 14,
  },
  {
    name: 'NYX-PRIME',
    archetype: 'interceptor',
    primaryHex: '#EC4899',
    accentHex: '#F9A8D4',
    startLength: 18,
  },
  {
    name: 'AETHER-7',
    archetype: 'leviathan',
    primaryHex: '#3B82F6',
    accentHex: '#93C5FD',
    startLength: 26,
  },
  {
    name: 'DRAKE-V',
    archetype: 'pack-hunter',
    primaryHex: '#EF4444',
    accentHex: '#FCA5A5',
    startLength: 16,
  },
  {
    name: 'ORION-2',
    archetype: 'forager',
    primaryHex: '#14B8A6',
    accentHex: '#5EEAD4',
    startLength: 13,
  },
];

/** Deterministic seeded PRNG (Mulberry32) so tests and arena spawns are reproducible. */
export function createSeededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic analytical ground height across Arena and Open-World biomes. */
export function groundHeightAt(x: number, z: number): number {
  const r = Math.hypot(x, z);
  // Central Nexus Bowl is gently cupped and flat enough for crisp arena readability
  const bowlFactor = Math.min(1, Math.max(0, (r - 18) / 38));
  const gentleWaves =
    (Math.sin(x * 0.055) * Math.cos(z * 0.055) * 0.95 +
      Math.sin((x + z) * 0.032) * 0.65) *
    bowlFactor;
  const outerRimLift = r > 76 ? Math.min(3.2, (r - 76) * 0.075) : 0;
  return gentleWaves + outerRimLift;
}

/** Steps the Game Shell state machine via the compiled LexLean OPM/UML model. */
export function stepGameShellState(current: ShellState, event: ShellEvent): ShellState {
  const stateMap: Record<ShellState, bigint> = {
    title: 0n,
    playing: 1n,
    paused: 2n,
    gameover: 3n,
  };
  const eventMap: Record<ShellEvent, bigint> = {
    start: 0n,
    'toggle-pause': 1n,
    'hull-depleted': 2n,
    'return-title': 3n,
  };
  const nextCode = Foundation_Design_V1_Model_stepShellStateMachine(
    stateMap[current],
    eventMap[event],
  );
  if (nextCode === 1n) return 'playing';
  if (nextCode === 2n) return 'paused';
  if (nextCode === 3n) return 'gameover';
  return 'title';
}

/** Evaluates a canonical space-separated 7-field request directly through `PrismSerpent::dispatch`. */
export function evaluatePrismDispatch(requestText: string): string {
  const bytes = encodeUtf8ToPrismBytes(requestText);
  const outBytes = PrismSerpent_dispatch(bytes);
  return decodePrismBytesToUtf8(outBytes);
}

/** Classifies world `(x, z)` coordinates into one of the 5 Frontier Biomes via LexLean. */
export function classifyBiomeAtPosition(x: number, z: number): BiomeDefinition {
  const radiusMeters = BigInt(Math.round(Math.hypot(x, z)));
  let quadrant = 0n;
  if (x >= 0 && z < 0) quadrant = 0n;
  else if (x < 0 && z < 0) quadrant = 1n;
  else if (x < 0 && z >= 0) quadrant = 2n;
  else quadrant = 3n;

  const code = Foundation_OpenWorld_V1_Model_classifyFrontierBiome(radiusMeters, quadrant);
  return FRONTIER_BIOMES[Number(code)] ?? FRONTIER_BIOMES[0];
}

/** Validates Pilot Callsign per STRIDE security control `StrictAsciiAlphanumericCallsignValidator`. */
export function validatePilotCallsign(raw: string): {
  valid: boolean;
  normalized: string;
  error: string | null;
} {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed.length < 2 || trimmed.length > 14) {
    return {
      valid: false,
      normalized: trimmed,
      error: 'Callsign must be 2–14 characters (A–Z, 0–9, -).',
    };
  }
  if (!/^[A-Z0-9-]+$/.test(trimmed)) {
    return {
      valid: false,
      normalized: trimmed,
      error: 'Use only letters A–Z, digits 0–9, or hyphens.',
    };
  }
  return { valid: true, normalized: trimmed, error: null };
}

/** Computes a deterministic canonical UOR `prism-code/canonical` receipt digest for a leaderboard record. */
export function computeLeaderboardReceiptHash(payload: {
  callsign: string;
  mode: GameMode;
  score: number;
  maxLength: number;
  placementRank: number;
  eliminations: number;
  shrinesAttuned: number;
  eloRating: number;
}): string {
  const canonicalLine = [
    PRISM_SPEC_ADDRESS,
    payload.callsign,
    payload.mode,
    String(payload.score),
    String(payload.maxLength),
    String(payload.placementRank),
    String(payload.eliminations),
    String(payload.shrinesAttuned),
    String(payload.eloRating),
  ].join('|');
  return codeHash(canonicalLine);
}

export function verifyLeaderboardReceipt(entry: SovereignHallEntry): boolean {
  const expected = computeLeaderboardReceiptHash({
    callsign: entry.callsign,
    mode: entry.mode,
    score: entry.score,
    maxLength: entry.maxLength,
    placementRank: entry.placementRank,
    eliminations: entry.eliminations,
    shrinesAttuned: entry.shrinesAttuned,
    eloRating: entry.eloRating,
  });
  return expected === entry.receiptHash;
}

export function computeLeagueTierName(eloRating: number): LeagueTierName {
  const code = Foundation_Leaderboard_V1_Model_classifyLeagueTier(
    BigInt(Math.max(0, Math.round(eloRating))),
  );
  return TIER_CODE_TO_NAME[Number(code)] ?? 'Bronze';
}

export function computeUpdatedPlayerElo(
  currentElo: number,
  placementRank: number,
  eliminations: number,
  shrinesAttuned: number,
): { eloRating: number; leagueTier: LeagueTierName; placementBonus: number } {
  const nextElo = Number(
    Foundation_Leaderboard_V1_Model_computeUpdatedEloRating(
      BigInt(Math.max(0, Math.round(currentElo))),
      BigInt(Math.max(1, Math.round(placementRank))),
      BigInt(Math.max(0, Math.round(eliminations))),
      BigInt(Math.max(0, Math.round(shrinesAttuned))),
    ),
  );
  const bonus = Number(
    Foundation_Leaderboard_V1_Model_computePlacementBonusPoints(
      BigInt(Math.max(1, Math.round(placementRank))),
    ),
  );
  return {
    eloRating: nextElo,
    leagueTier: computeLeagueTierName(nextElo),
    placementBonus: bonus,
  };
}

/** Runs live constructive verification across all 9 Prism facets & acceptance vectors. */
export function verifyAllPrismInvariants(): InvariantAuditReport {
  const app = PrismSerpent_application();
  let acceptancePassed = 0;
  for (const vec of app.acceptanceVectors) {
    const actual = PrismSerpent_dispatch(vec.request);
    if (decodePrismBytesToUtf8(actual) === decodePrismBytesToUtf8(vec.response)) {
      acceptancePassed++;
    }
  }

  // Test the 6 formal behavioral properties across representative boundary witnesses
  const sampleRequests: PrismSerpent_Request[] = [
    { mode: 0n, pickup: 5n, rival: 2n, zone: 0n, boost: 1n, length: 90n, threat: 80n },
    { mode: 0n, pickup: 3n, rival: 4n, zone: 2n, boost: 0n, length: 20n, threat: 75n },
    { mode: 1n, pickup: 0n, rival: 0n, zone: 4n, boost: 0n, length: 30n, threat: 15n },
    { mode: 0n, pickup: 0n, rival: 2n, zone: 0n, boost: 1n, length: 95n, threat: 70n },
    { mode: 0n, pickup: 0n, rival: 4n, zone: 3n, boost: 0n, length: 32n, threat: 72n },
    { mode: 1n, pickup: 0n, rival: 1n, zone: 1n, boost: 1n, length: 120n, threat: 10n },
  ];
  const propProofsHold = sampleRequests.every(
    (r) =>
      !PrismSerpentProofs_breaksProp001(r) &&
      !PrismSerpentProofs_breaksProp002(r) &&
      !PrismSerpentProofs_breaksProp003(r) &&
      !PrismSerpentProofs_breaksProp004(r) &&
      !PrismSerpentProofs_breaksProp005(r) &&
      !PrismSerpentProofs_breaksProp006(r),
  );

  const facetResults = [
    {
      facet: 'Application & Proofs',
      theorem: 'PrismSerpentProofs::prop_001..prop_006',
      passed: propProofsHold && acceptancePassed === app.acceptanceVectors.length,
    },
    {
      facet: 'Architecture (ISO 42010)',
      theorem: 'Architecture::architectureCompleteHolds',
      passed: Foundation_Architecture_V1_Model_verifyArchitectureComplete(),
    },
    {
      facet: 'Design Views (OPM / UML)',
      theorem: 'Design::designStateTransitionsHold',
      passed: Foundation_Design_V1_Model_verifyDesignStateTransitions(),
    },
    {
      facet: 'Features & Journeys (ISO 9241)',
      theorem: 'Features::allJourneysTestedHolds',
      passed: Foundation_Features_V1_Model_verifyAllJourneysTested(),
    },
    {
      facet: 'Security & STRIDE Model',
      theorem: 'Security::allThreatsMitigatedHolds',
      passed: Foundation_Security_V1_Model_verifyAllThreatsMitigated(),
    },
    {
      facet: 'Product Quality (ISO 25010)',
      theorem: 'Quality::iso25010QualitySuiteHolds',
      passed: Foundation_Quality_V1_Model_verifyIso25010QualitySuite(),
    },
    {
      facet: 'Compliance & PROV-O',
      theorem: 'Compliance::complianceAndProvenanceHold',
      passed: Foundation_Compliance_V1_Model_verifyComplianceAndProvenance(),
    },
    {
      facet: 'Extension: Serpent Kinematics',
      theorem: 'Kinematics::kinematicsSpeedOrderingHolds',
      passed: Foundation_Kinematics_V1_Model_verifyKinematicsSpeedOrdering(),
    },
    {
      facet: 'Extension: Special Pickups',
      theorem: 'Pickups::chronoAmplifiesScoreAndGrowthHolds',
      passed: Foundation_Pickups_V1_Model_verifyChronoAmplifiesScoreAndGrowth(),
    },
    {
      facet: 'Extension: NPC Archetypes',
      theorem: 'NpcBehavior::fourDistinctNpcPoliciesHold',
      passed: Foundation_NpcBehavior_V1_Model_verifyFourDistinctNpcPolicies(),
    },
    {
      facet: 'Extension: Open-World Atlas',
      theorem: 'OpenWorld::openWorldTopologyAndDiscoveryHold',
      passed: Foundation_OpenWorld_V1_Model_verifyOpenWorldTopologyAndDiscovery(),
    },
    {
      facet: 'Extension: Competitive Leaderboard',
      theorem: 'Leaderboard::leaderboardTierMonotonicityHolds',
      passed: Foundation_Leaderboard_V1_Model_verifyLeaderboardTierMonotonicity(),
    },
  ];

  return {
    allPassed: facetResults.every((r) => r.passed),
    specHash: PRISM_SPEC_CANONICAL_HASH,
    specAddress: PRISM_SPEC_ADDRESS,
    totalModules: PRISM_MODULE_CATALOG.length,
    hostedAttestationCount: PRISM_HOSTED_ATTESTATIONS.length,
    acceptancePassed,
    acceptanceTotal: app.acceptanceVectors.length,
    facetResults,
  };
}

function buildInitialSerpent(opts: {
  id: string;
  name: string;
  isPlayer: boolean;
  archetype: RivalArchetype;
  primaryHex: string;
  accentHex: string;
  x: number;
  z: number;
  heading: number;
  segmentCount: number;
}): SerpentEntity {
  const spacingMeters =
    Number(Foundation_Kinematics_V1_Model_computeSegmentSpacingCm(BigInt(opts.segmentCount))) / 100;
  const segments: SpineSegment[] = [];
  const pathHistory: Array<{ x: number; z: number }> = [];
  const stepDist = 0.22;
  const totalHistorySteps = Math.ceil((opts.segmentCount * spacingMeters) / stepDist) + 16;

  for (let i = 0; i < totalHistorySteps; i++) {
    const d = i * stepDist;
    const px = opts.x - Math.cos(opts.heading) * d;
    const pz = opts.z - Math.sin(opts.heading) * d;
    pathHistory.push({ x: px, z: pz });
  }

  for (let s = 0; s < opts.segmentCount; s++) {
    const d = (s + 1) * spacingMeters;
    const sx = opts.x - Math.cos(opts.heading) * d;
    const sz = opts.z - Math.sin(opts.heading) * d;
    segments.push({
      x: sx,
      y: groundHeightAt(sx, sz) + 0.45,
      z: sz,
      yaw: opts.heading,
    });
  }

  const maxPips = Number(Foundation_Kinematics_V1_Model_maxHullVitalityPips());

  return {
    id: opts.id,
    name: opts.name,
    isPlayer: opts.isPlayer,
    archetype: opts.archetype,
    primaryHex: opts.primaryHex,
    accentHex: opts.accentHex,
    x: opts.x,
    y: groundHeightAt(opts.x, opts.z) + 0.52,
    z: opts.z,
    heading: opts.heading,
    speed: Number(Foundation_Kinematics_V1_Model_computeSerpentSpeedCmPerSec(false, false, false)) / 100,
    turnRate:
      Number(
        Foundation_Kinematics_V1_Model_computeTurnRateMilliRadPerSec(
          BigInt(opts.segmentCount),
          false,
        ),
      ) / 1000,
    isOverdrive: false,
    onSpeedPad: false,
    segments,
    pathHistory,
    growthUnits: 0,
    boostShedAccumulator: 0,
    score: opts.isPlayer ? 0 : opts.segmentCount * 15,
    eliminations: 0,
    comboCount: 0,
    comboTimerMs: 0,
    hullPips: maxPips,
    maxHullPips: maxPips,
    invulnerableMs: opts.isPlayer ? 2200 : 1200,
    hyperCoreMs: 0,
    magnetPrismMs: 0,
    phaseCloakMs: 0,
    chronoShardMs: 0,
    intentCode: 1,
    windupMs: 0,
    isCharging: false,
    alive: true,
    respawnMs: 0,
    dissolveProgress: 0,
  };
}

function normalizeAngle(rad: number): number {
  let a = rad;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function createInitialShrines(): MonolithShrine[] {
  const configs: Array<{
    name: string;
    biomeId: FrontierBiomeId;
    x: number;
    z: number;
    accentHex: string;
  }> = [
    {
      name: 'Nexus Prime Spire',
      biomeId: 'nexus-bowl',
      x: 0,
      z: -20,
      accentHex: '#22D3EE',
    },
    {
      name: 'Cobalt Drift Obelisk',
      biomeId: 'cobalt-dunes',
      x: 52,
      z: -48,
      accentHex: '#38BDF8',
    },
    {
      name: 'Quartz Resonance Monolith',
      biomeId: 'crystalline-spire',
      x: -54,
      z: -50,
      accentHex: '#A78BFA',
    },
    {
      name: 'Solaris Thermal Pylon',
      biomeId: 'solaris-rift',
      x: -54,
      z: 52,
      accentHex: '#F59E0B',
    },
    {
      name: 'Sanctum Sovereign Altar',
      biomeId: 'sanctum-ring',
      x: 68,
      z: 64,
      accentHex: '#34D399',
    },
  ];

  return configs.map((c, id) => ({
    id,
    name: c.name,
    biomeId: c.biomeId,
    x: c.x,
    y: groundHeightAt(c.x, c.z),
    z: c.z,
    attuned: false,
    attuneProgress: 0,
    accentHex: c.accentHex,
  }));
}

function createSpeedPads(worldRadius: number): SpeedPad[] {
  const padDist = worldRadius * 0.42;
  const pads: SpeedPad[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const x = Math.cos(angle) * padDist;
    const z = Math.sin(angle) * padDist;
    pads.push({
      id: i,
      x,
      y: groundHeightAt(x, z) + 0.06,
      z,
      yaw: angle + Math.PI / 2,
      radius: 4.2,
    });
  }
  return pads;
}

/** Creates a fresh deterministic simulation world for either Competitive Arena or Open-World Exploration. */
export function createPrismWorldState(
  mode: GameMode,
  callsign = 'SOVEREIGN-1',
  seed = 42010,
): PrismWorldState {
  const rng = createSeededRng(seed);
  const worldRadius =
    mode === 'open-world'
      ? Number(Foundation_OpenWorld_V1_Model_openWorldRadiusMeters())
      : Number(Foundation_OpenWorld_V1_Model_arenaRadiusMeters());

  // Player spawns at (0, 14) facing North (-Z, heading = -PI/2), looking directly across
  // golden-cyan orb clusters, special relics, and Nexus Prime Monolith at (0, -20).
  const player = buildInitialSerpent({
    id: 'player',
    name: callsign,
    isPlayer: true,
    archetype: 'interceptor',
    primaryHex: '#06B6D4',
    accentHex: '#F59E0B',
    x: 0,
    z: 14,
    heading: -Math.PI / 2,
    segmentCount: 12,
  });

  const rivals: SerpentEntity[] = RIVAL_ROSTER.map((cfg, idx) => {
    const angle = (idx / RIVAL_ROSTER.length) * Math.PI * 2 + 0.38;
    const spawnR =
      mode === 'open-world'
        ? 30 + (idx % 3) * 24
        : 24 + (idx % 2) * 18;
    const rx = Math.cos(angle) * spawnR;
    const rz = Math.sin(angle) * spawnR;
    return buildInitialSerpent({
      id: `npc-${idx}`,
      name: cfg.name,
      isPlayer: false,
      archetype: cfg.archetype,
      primaryHex: cfg.primaryHex,
      accentHex: cfg.accentHex,
      x: rx,
      z: rz,
      heading: normalizeAngle(angle + Math.PI * 0.65),
      segmentCount: cfg.startLength,
    });
  });

  const orbCount = mode === 'open-world' ? 210 : 145;
  const orbs: OrbEntity[] = [];
  // Place an inviting breadcrumb arc right ahead of player spawn so immediate motion feeds growth
  const starterPositions = [
    [0, 6],
    [-2.4, 1.5],
    [2.4, 1.5],
    [0, -3.5],
    [-4.2, -8],
    [4.2, -8],
  ];
  for (let i = 0; i < orbCount; i++) {
    let ox: number;
    let oz: number;
    if (i < starterPositions.length) {
      ox = starterPositions[i][0];
      oz = starterPositions[i][1];
    } else {
      const rr = Math.sqrt(rng()) * (worldRadius - 7);
      const th = rng() * Math.PI * 2;
      ox = Math.cos(th) * rr;
      oz = Math.sin(th) * rr;
    }
    const tierRoll = rng();
    const tier: 0 | 1 | 2 = tierRoll > 0.88 ? 2 : tierRoll > 0.58 ? 1 : 0;
    orbs.push({
      id: i,
      x: ox,
      y: groundHeightAt(ox, oz) + 0.42,
      z: oz,
      tier,
      isLoot: false,
      colorHex: ORB_PALETTE[i % ORB_PALETTE.length],
      phase: rng() * Math.PI * 2,
      active: true,
      respawnMs: 0,
    });
  }

  // Spawn all 5 Special Relic Objects at readable focal landmarks (including 2 in initial forward cone)
  const relicAnchors: Array<{ kind: PickupKind; x: number; z: number }> = [
    { kind: 'hyper-core', x: -8.5, z: -5.5 },
    { kind: 'magnet-prism', x: 8.5, z: -5.5 },
    { kind: 'phase-cloak', x: -24, z: -22 },
    { kind: 'chrono-shard', x: 24, z: -22 },
    { kind: 'apex-crown', x: 0, z: -34 },
    ...(mode === 'open-world'
      ? ([
          { kind: 'hyper-core', x: 48, z: -40 },
          { kind: 'chrono-shard', x: -48, z: -42 },
          { kind: 'magnet-prism', x: -46, z: 44 },
          { kind: 'apex-crown', x: 58, z: 54 },
        ] as Array<{ kind: PickupKind; x: number; z: number }>)
      : []),
  ];

  const relics: SpecialRelicEntity[] = relicAnchors.map((r, id) => ({
    id,
    kind: r.kind,
    x: r.x,
    y: groundHeightAt(r.x, r.z) + 0.95,
    z: r.z,
    active: true,
    respawnMs: 0,
    spinAngle: id * 1.1,
  }));

  const shrines = createInitialShrines();
  const speedPads = createSpeedPads(worldRadius);
  const visitedBiomes = new Set<FrontierBiomeId>(['nexus-bowl']);
  const currentBiome = classifyBiomeAtPosition(player.x, player.z);
  const worldDiscoveryPct = Number(
    Foundation_OpenWorld_V1_Model_computeWorldDiscoveryPct(1n, 0n, 0n),
  );

  const state: PrismWorldState = {
    mode,
    worldRadius,
    elapsedSec: 0,
    remainingArenaSec: 150,
    hitstopSec: 0,
    cameraTrauma: 0,
    player,
    rivals,
    orbs,
    relics,
    shrines,
    speedPads,
    shockwaves: [],
    visitedBiomes,
    relicsCollectedCount: 0,
    currentBiome,
    worldDiscoveryPct,
    activeDirective: 'steady-forage',
    activeDirectiveLabel: DIRECTIVE_LABELS['steady-forage'],
    activeRequestString: 'arena energy-orb none nexus-bowl cruise 12 0',
    threatLevel: 0,
    liveStandings: [],
    runEnded: false,
    runVictory: false,
    runEndReason: '',
    bannerText:
      mode === 'open-world'
        ? 'OPEN-WORLD FRONTIER — ATTUNE ALL 5 PRISM MONOLITH SHRINES'
        : 'NEON SOVEREIGN ARENA — DEVOUR RELICS & SHATTER RIVAL SERPENTS',
    bannerTimerMs: 3800,
    events: [],
  };

  refreshDirectiveAndStandings(state);
  return state;
}

function pickupKindToLexCode(kind: PickupKind | 'rival-loot'): bigint {
  switch (kind) {
    case 'energy-orb':
      return 0n;
    case 'hyper-core':
      return 1n;
    case 'magnet-prism':
      return 2n;
    case 'phase-cloak':
      return 3n;
    case 'chrono-shard':
      return 4n;
    case 'apex-crown':
      return 5n;
    case 'rival-loot':
      return 6n;
  }
}

function archetypeToLexCode(archetype: RivalArchetype): bigint {
  switch (archetype) {
    case 'forager':
      return 0n;
    case 'interceptor':
      return 1n;
    case 'leviathan':
      return 2n;
    case 'pack-hunter':
      return 3n;
  }
}

function rivalArchetypeToSpecCode(archetype: RivalArchetype | 'none'): {
  code: bigint;
  slug: string;
} {
  switch (archetype) {
    case 'none':
      return { code: 0n, slug: 'none' };
    case 'forager':
      return { code: 1n, slug: 'forager' };
    case 'interceptor':
      return { code: 2n, slug: 'interceptor' };
    case 'leviathan':
      return { code: 3n, slug: 'leviathan' };
    case 'pack-hunter':
      return { code: 4n, slug: 'pack-hunter' };
  }
}

function updateSerpentSpine(serpent: SerpentEntity, worldRadius: number, dt: number): void {
  const moveDist = serpent.speed * dt;
  serpent.x += Math.cos(serpent.heading) * moveDist;
  serpent.z += Math.sin(serpent.heading) * moveDist;

  // Natural canyon perimeter gentle deflection (never harsh sticky box wall)
  const radialDist = Math.hypot(serpent.x, serpent.z);
  const softLimit = worldRadius - 2.4;
  if (radialDist > softLimit) {
    const inwardAngle = Math.atan2(-serpent.z, -serpent.x);
    const diff = normalizeAngle(inwardAngle - serpent.heading);
    serpent.heading = normalizeAngle(serpent.heading + diff * Math.min(1, dt * 8.5));
    const clampedR = Math.min(radialDist, worldRadius - 1.1);
    const outAngle = Math.atan2(serpent.z, serpent.x);
    serpent.x = Math.cos(outAngle) * clampedR;
    serpent.z = Math.sin(outAngle) * clampedR;
  }

  serpent.y = groundHeightAt(serpent.x, serpent.z) + 0.52;

  // Prepend head sample to pathHistory when moved >= 0.16m
  const headSample = serpent.pathHistory[0];
  if (!headSample || Math.hypot(serpent.x - headSample.x, serpent.z - headSample.z) >= 0.16) {
    serpent.pathHistory.unshift({ x: serpent.x, z: serpent.z });
  }

  const targetSegments = Math.min(160, Math.max(6, serpent.segments.length));
  const spacingMeters =
    Number(Foundation_Kinematics_V1_Model_computeSegmentSpacingCm(BigInt(targetSegments))) / 100;

  let historyIdx = 0;
  let accDist = 0;
  let prevX = serpent.x;
  let prevZ = serpent.z;

  for (let s = 0; s < serpent.segments.length; s++) {
    const desiredDist = (s + 1) * spacingMeters;
    while (historyIdx < serpent.pathHistory.length - 1 && accDist < desiredDist) {
      const pt = serpent.pathHistory[historyIdx];
      const step = Math.hypot(pt.x - prevX, pt.z - prevZ);
      if (accDist + step >= desiredDist) {
        const remain = desiredDist - accDist;
        const t = step > 0.0001 ? remain / step : 0;
        const sx = prevX + (pt.x - prevX) * t;
        const sz = prevZ + (pt.z - prevZ) * t;
        const yaw = Math.atan2(prevZ - sz, prevX - sx);
        serpent.segments[s].x = sx;
        serpent.segments[s].z = sz;
        serpent.segments[s].y = groundHeightAt(sx, sz) + 0.44;
        serpent.segments[s].yaw = yaw;
        break;
      }
      accDist += step;
      prevX = pt.x;
      prevZ = pt.z;
      historyIdx++;
    }
    if (historyIdx >= serpent.pathHistory.length - 1) {
      const tail = serpent.pathHistory[serpent.pathHistory.length - 1];
      serpent.segments[s].x = tail.x;
      serpent.segments[s].z = tail.z;
      serpent.segments[s].y = groundHeightAt(tail.x, tail.z) + 0.44;
    }
  }

  const maxHistoryNeeded = Math.ceil((serpent.segments.length * spacingMeters) / 0.15) + 24;
  if (serpent.pathHistory.length > maxHistoryNeeded) {
    serpent.pathHistory.length = maxHistoryNeeded;
  }
}

function addGrowthAndScore(
  serpent: SerpentEntity,
  pickupKind: PickupKind | 'rival-loot',
  tierBonus = 0,
): number {
  const code = pickupKindToLexCode(pickupKind);
  const hasChrono = serpent.chronoShardMs > 0;
  const comboTier = BigInt(Math.min(8, Math.floor(serpent.comboCount / 4)));
  const pts =
    Number(Foundation_Pickups_V1_Model_computeAwardedScore(code, hasChrono, comboTier)) +
    tierBonus * (hasChrono ? 12 : 6);
  const growth = Number(Foundation_Pickups_V1_Model_computePickupGrowthUnits(code, hasChrono));

  serpent.score += pts;
  serpent.growthUnits += growth;
  serpent.comboCount += 1;
  serpent.comboTimerMs = 2800;

  while (serpent.growthUnits >= 24 && serpent.segments.length < 160) {
    serpent.growthUnits -= 24;
    const last = serpent.segments[serpent.segments.length - 1] ?? {
      x: serpent.x,
      y: serpent.y,
      z: serpent.z,
      yaw: serpent.heading,
    };
    serpent.segments.push({ ...last });
  }
  return pts;
}

function spawnLootAlongSerpent(state: PrismWorldState, defeated: SerpentEntity): void {
  const step = Math.max(1, Math.floor(defeated.segments.length / 10));
  for (let i = 0; i < defeated.segments.length; i += step) {
    const seg = defeated.segments[i];
    const reusable = state.orbs.find((o) => !o.active);
    if (reusable) {
      reusable.x = seg.x + (Math.sin(i * 3.1) * 0.8);
      reusable.z = seg.z + (Math.cos(i * 2.7) * 0.8);
      reusable.y = groundHeightAt(reusable.x, reusable.z) + 0.52;
      reusable.tier = 2;
      reusable.isLoot = true;
      reusable.colorHex = '#FBBF24';
      reusable.active = true;
      reusable.respawnMs = 0;
    } else if (state.orbs.length < 280) {
      state.orbs.push({
        id: state.orbs.length,
        x: seg.x,
        y: groundHeightAt(seg.x, seg.z) + 0.52,
        z: seg.z,
        tier: 2,
        isLoot: true,
        colorHex: '#FBBF24',
        phase: i * 0.5,
        active: true,
        respawnMs: 0,
      });
    }
  }
}

function applyRelicEffect(
  state: PrismWorldState,
  collector: SerpentEntity,
  kind: PickupKind,
): void {
  const code = pickupKindToLexCode(kind);
  const durationMs = Number(Foundation_Pickups_V1_Model_computePickupDurationMs(code));
  addGrowthAndScore(collector, kind, 0);

  if (kind === 'hyper-core') {
    collector.hyperCoreMs = Math.max(collector.hyperCoreMs, durationMs);
  } else if (kind === 'magnet-prism') {
    collector.magnetPrismMs = Math.max(collector.magnetPrismMs, durationMs);
  } else if (kind === 'phase-cloak') {
    collector.phaseCloakMs = Math.max(collector.phaseCloakMs, durationMs);
  } else if (kind === 'chrono-shard') {
    collector.chronoShardMs = Math.max(collector.chronoShardMs, durationMs);
  } else if (kind === 'apex-crown') {
    // Sovereign Shockwave blasts nearby rivals within 18m
    state.shockwaves.push({
      x: collector.x,
      y: collector.y,
      z: collector.z,
      radius: 1.5,
      maxRadius: 18.5,
      alpha: 1,
      colorHex: '#FBBF24',
    });
    if (collector.isPlayer) {
      state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.55);
      for (const rival of state.rivals) {
        if (!rival.alive) continue;
        if (Math.hypot(rival.x - collector.x, rival.z - collector.z) <= 18.5) {
          eliminateRival(state, rival, collector);
        }
      }
    }
  }
}

function eliminateRival(
  state: PrismWorldState,
  rival: SerpentEntity,
  creditTo: SerpentEntity | null,
): void {
  if (!rival.alive) return;
  rival.alive = false;
  rival.respawnMs = 4600;
  rival.dissolveProgress = 0.01;
  rival.isCharging = false;
  rival.windupMs = 0;
  spawnLootAlongSerpent(state, rival);

  if (creditTo) {
    creditTo.eliminations += 1;
    creditTo.score += 180;
    if (creditTo.isPlayer) {
      state.hitstopSec = 0.058;
      state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.52);
      state.bannerText = `SHATTERED ${rival.name} (+180 PTS)`;
      state.bannerTimerMs = 2200;
      state.events.push({
        type: 'rival-eliminated',
        x: rival.x,
        y: rival.y,
        z: rival.z,
        colorHex: rival.accentHex,
        label: rival.name,
      });
    }
  }
}

function refreshDirectiveAndStandings(state: PrismWorldState): void {
  const player = state.player;
  state.currentBiome = classifyBiomeAtPosition(player.x, player.z);
  state.visitedBiomes.add(state.currentBiome.id);

  const attunedCount = state.shrines.filter((s) => s.attuned).length;
  state.worldDiscoveryPct = Number(
    Foundation_OpenWorld_V1_Model_computeWorldDiscoveryPct(
      BigInt(state.visitedBiomes.size),
      BigInt(attunedCount),
      BigInt(state.relicsCollectedCount),
    ),
  );

  // Determine nearest active rival & threat level (0..100)
  let nearestRivalDist = 999;
  let nearestRivalArchetype: RivalArchetype | 'none' = 'none';
  for (const r of state.rivals) {
    if (!r.alive) continue;
    const d = Math.hypot(r.x - player.x, r.z - player.z);
    if (d < nearestRivalDist) {
      nearestRivalDist = d;
      nearestRivalArchetype = r.archetype;
    }
  }

  const rawThreat =
    nearestRivalDist >= 38
      ? 0
      : Math.min(100, Math.round(((38 - nearestRivalDist) / 34) * 92));
  state.threatLevel = rawThreat;

  // Determine active pickup context for PrismSerpent::judge
  let activePickupSlug: PickupKind = 'energy-orb';
  let activePickupCode = 0n;
  if (player.hyperCoreMs > 0) {
    activePickupSlug = 'hyper-core';
    activePickupCode = 1n;
  } else if (player.magnetPrismMs > 0) {
    activePickupSlug = 'magnet-prism';
    activePickupCode = 2n;
  } else if (player.phaseCloakMs > 0) {
    activePickupSlug = 'phase-cloak';
    activePickupCode = 3n;
  } else if (player.chronoShardMs > 0) {
    activePickupSlug = 'chrono-shard';
    activePickupCode = 4n;
  } else {
    // Check if Apex Crown shockwave was just triggered
    const recentApex = state.shockwaves.some((sw) => sw.alpha > 0.35);
    if (recentApex) {
      activePickupSlug = 'apex-crown';
      activePickupCode = 5n;
    }
  }

  const rivalSpec = rivalArchetypeToSpecCode(
    nearestRivalDist <= 34 ? nearestRivalArchetype : 'none',
  );
  const clampedLen = Math.min(200, Math.max(1, player.segments.length));
  const boostActive = player.isOverdrive || player.hyperCoreMs > 0;

  const req: PrismSerpent_Request = {
    mode: state.mode === 'open-world' ? 1n : 0n,
    pickup: activePickupCode,
    rival: rivalSpec.code,
    zone: state.currentBiome.code,
    boost: boostActive ? 1n : 0n,
    length: BigInt(clampedLen),
    threat: BigInt(rawThreat),
  };

  const answerCode = Number(PrismSerpent_judge(req));
  const directive = ANSWER_CODE_TO_DIRECTIVE[answerCode] ?? 'steady-forage';
  state.activeDirective = directive;
  state.activeDirectiveLabel = DIRECTIVE_LABELS[directive];
  state.activeRequestString = [
    state.mode,
    activePickupSlug,
    rivalSpec.slug,
    state.currentBiome.id,
    boostActive ? 'overdrive' : 'cruise',
    String(clampedLen),
    String(rawThreat),
  ].join(' ');

  // Build sorted live match leaderboard (#1..#9)
  const allSerpents = [player, ...state.rivals];
  const sorted = [...allSerpents].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.segments.length - a.segments.length;
  });

  state.liveStandings = sorted.map((s, idx) => ({
    id: s.id,
    rank: idx + 1,
    name: s.name,
    isPlayer: s.isPlayer,
    archetypeLabel: s.isPlayer ? 'Sovereign' : s.archetype,
    score: s.score,
    length: s.segments.length,
    eliminations: s.eliminations,
    alive: s.alive,
    accentHex: s.isPlayer ? '#22D3EE' : s.accentHex,
  }));
}

/** Teleports the player serpent cleanly to a frontier biome landmark (Open-World Atlas fast travel). */
export function teleportPlayerToBiome(state: PrismWorldState, biomeId: FrontierBiomeId): void {
  const target = FRONTIER_BIOMES.find((b) => b.id === biomeId);
  if (!target) return;

  state.player.x = target.teleportX;
  state.player.z = target.teleportZ;
  state.player.heading = target.teleportHeading;
  state.player.y = groundHeightAt(target.teleportX, target.teleportZ) + 0.52;
  state.player.invulnerableMs = 2200;

  const spacing =
    Number(
      Foundation_Kinematics_V1_Model_computeSegmentSpacingCm(BigInt(state.player.segments.length)),
    ) / 100;

  state.player.pathHistory = [];
  for (let i = 0; i < state.player.segments.length * 7 + 16; i++) {
    const d = i * 0.2;
    state.player.pathHistory.push({
      x: target.teleportX - Math.cos(target.teleportHeading) * d,
      z: target.teleportZ - Math.sin(target.teleportHeading) * d,
    });
  }
  for (let s = 0; s < state.player.segments.length; s++) {
    const d = (s + 1) * spacing;
    const sx = target.teleportX - Math.cos(target.teleportHeading) * d;
    const sz = target.teleportZ - Math.sin(target.teleportHeading) * d;
    state.player.segments[s] = {
      x: sx,
      y: groundHeightAt(sx, sz) + 0.44,
      z: sz,
      yaw: target.teleportHeading,
    };
  }

  state.bannerText = `ENTERED ${target.name.toUpperCase()} — ${target.subtitle.toUpperCase()}`;
  state.bannerTimerMs = 2600;
  refreshDirectiveAndStandings(state);
}

/**
 * Pure 60Hz deterministic simulation step driven by compiled Prism LexLean modules.
 */
export function stepPrismWorld(
  state: PrismWorldState,
  rawDt: number,
  input: PlayerControlInput,
): void {
  state.events = [];
  if (state.runEnded) return;

  const dt = Math.min(rawDt, 0.05);
  const dtMs = dt * 1000;

  // Decay camera trauma & banner
  state.cameraTrauma = Math.max(0, state.cameraTrauma - dt * 1.45);
  if (state.bannerTimerMs > 0) {
    state.bannerTimerMs = Math.max(0, state.bannerTimerMs - dtMs);
  }

  // Hitstop freezes motion briefly on heavy rival takedowns for tactile impact
  if (state.hitstopSec > 0) {
    state.hitstopSec = Math.max(0, state.hitstopSec - dt);
    return;
  }

  state.elapsedSec += dt;

  // Competitive Arena match clock & victory check
  if (state.mode === 'arena') {
    state.remainingArenaSec = Math.max(0, state.remainingArenaSec - dt);
    if (state.player.score >= 3500) {
      state.runEnded = true;
      state.runVictory = true;
      state.runEndReason = 'Sovereign Score Threshold Achieved (3,500+ PTS)';
      state.events.push({
        type: 'run-ended',
        x: state.player.x,
        y: state.player.y,
        z: state.player.z,
        colorHex: '#22D3EE',
        victory: true,
      });
      refreshDirectiveAndStandings(state);
      return;
    }
    if (state.remainingArenaSec <= 0) {
      refreshDirectiveAndStandings(state);
      const playerRank = state.liveStandings.find((r) => r.isPlayer)?.rank ?? 9;
      state.runEnded = true;
      state.runVictory = playerRank <= 3;
      state.runEndReason =
        playerRank === 1
          ? 'Arena Match Complete — #1 Neon Sovereign!'
          : `Arena Match Complete — Ranked #${playerRank} of 9`;
      state.events.push({
        type: 'run-ended',
        x: state.player.x,
        y: state.player.y,
        z: state.player.z,
        colorHex: state.runVictory ? '#22D3EE' : '#F59E0B',
        victory: state.runVictory,
      });
      return;
    }
  }

  // Update shockwave rings
  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    const sw = state.shockwaves[i];
    sw.radius += dt * 36;
    sw.alpha = Math.max(0, 1 - sw.radius / sw.maxRadius);
    if (sw.alpha <= 0.01) {
      state.shockwaves.splice(i, 1);
    }
  }

  // Update player timers & kinematics via LexLean
  const p = state.player;
  p.invulnerableMs = Math.max(0, p.invulnerableMs - dtMs);
  p.hyperCoreMs = Math.max(0, p.hyperCoreMs - dtMs);
  p.magnetPrismMs = Math.max(0, p.magnetPrismMs - dtMs);
  p.phaseCloakMs = Math.max(0, p.phaseCloakMs - dtMs);
  p.chronoShardMs = Math.max(0, p.chronoShardMs - dtMs);
  if (p.comboTimerMs > 0) {
    p.comboTimerMs = Math.max(0, p.comboTimerMs - dtMs);
    if (p.comboTimerMs === 0) p.comboCount = 0;
  }

  p.onSpeedPad = state.speedPads.some(
    (pad) => Math.hypot(p.x - pad.x, p.z - pad.z) <= pad.radius,
  );
  const canBoost = input.boostHeld && (p.segments.length > 8 || p.hyperCoreMs > 0);
  p.isOverdrive = canBoost;

  p.speed =
    Number(
      Foundation_Kinematics_V1_Model_computeSerpentSpeedCmPerSec(
        p.isOverdrive,
        p.hyperCoreMs > 0,
        p.onSpeedPad,
      ),
    ) / 100;
  p.turnRate =
    Number(
      Foundation_Kinematics_V1_Model_computeTurnRateMilliRadPerSec(
        BigInt(p.segments.length),
        p.isOverdrive,
      ),
    ) / 1000;

  if (Math.abs(input.steerDelta) > 0.001) {
    p.heading = normalizeAngle(p.heading + input.steerDelta * p.turnRate * dt);
  } else if (input.targetWorldAngle !== null) {
    const diff = normalizeAngle(input.targetWorldAngle - p.heading);
    const maxStep = p.turnRate * dt;
    p.heading = normalizeAngle(
      p.heading + Math.max(-maxStep, Math.min(maxStep, diff * 2.2)),
    );
  }

  // Overdrive mass cost shedding via LexLean
  const boostMassCost = Number(
    Foundation_Kinematics_V1_Model_computeBoostMassCostPerSec(
      p.isOverdrive,
      p.hyperCoreMs > 0,
      BigInt(p.segments.length),
    ),
  );
  if (boostMassCost > 0) {
    p.boostShedAccumulator += boostMassCost * dt;
    if (p.boostShedAccumulator >= 16 && p.segments.length > 8) {
      p.boostShedAccumulator -= 16;
      const shedSeg = p.segments.pop();
      if (shedSeg) {
        const inactiveOrb = state.orbs.find((o) => !o.active);
        if (inactiveOrb) {
          inactiveOrb.x = shedSeg.x;
          inactiveOrb.z = shedSeg.z;
          inactiveOrb.y = groundHeightAt(shedSeg.x, shedSeg.z) + 0.42;
          inactiveOrb.tier = 0;
          inactiveOrb.isLoot = false;
          inactiveOrb.colorHex = '#22D3EE';
          inactiveOrb.active = true;
          inactiveOrb.respawnMs = 0;
        }
      }
    }
  }

  updateSerpentSpine(p, state.worldRadius, dt);

  // Crowd Coordinator: max 3 rival serpents can hold a boost/charge token simultaneously
  let activeChargerTokens = 0;
  const maxChargerTokens = 3;

  for (const rival of state.rivals) {
    if (!rival.alive) {
      rival.dissolveProgress = Math.min(1, rival.dissolveProgress + dt * 2.4);
      rival.respawnMs -= dtMs;
      if (rival.respawnMs <= 0) {
        const angle = (state.elapsedSec * 0.9 + rival.id.charCodeAt(4)) % (Math.PI * 2);
        const rDist = state.worldRadius * 0.72;
        const rx = Math.cos(angle) * rDist;
        const rz = Math.sin(angle) * rDist;
        const reset = buildInitialSerpent({
          id: rival.id,
          name: rival.name,
          isPlayer: false,
          archetype: rival.archetype,
          primaryHex: rival.primaryHex,
          accentHex: rival.accentHex,
          x: rx,
          z: rz,
          heading: normalizeAngle(angle + Math.PI),
          segmentCount: 14,
        });
        reset.score = Math.max(120, Math.floor(rival.score * 0.65));
        reset.eliminations = rival.eliminations;
        Object.assign(rival, reset);
      }
      continue;
    }

    rival.invulnerableMs = Math.max(0, rival.invulnerableMs - dtMs);
    rival.hyperCoreMs = Math.max(0, rival.hyperCoreMs - dtMs);
    rival.magnetPrismMs = Math.max(0, rival.magnetPrismMs - dtMs);
    rival.phaseCloakMs = Math.max(0, rival.phaseCloakMs - dtMs);
    rival.chronoShardMs = Math.max(0, rival.chronoShardMs - dtMs);

    // Check hazard proximity (world rim or close to player body segments)
    const rimDist = state.worldRadius - Math.hypot(rival.x, rival.z);
    let bodyHazard = rimDist < 7.5;
    let hazardAvoidAngle = Math.atan2(-rival.z, -rival.x);

    if (!bodyHazard) {
      for (let s = 0; s < p.segments.length; s += 2) {
        const seg = p.segments[s];
        const d = Math.hypot(rival.x - seg.x, rival.z - seg.z);
        if (d < 4.2) {
          bodyHazard = true;
          hazardAvoidAngle = Math.atan2(rival.z - seg.z, rival.x - seg.x);
          break;
        }
      }
    }

    // Nearest active relic distance
    let nearestRelic: SpecialRelicEntity | null = null;
    let nearestRelicDist = 999;
    for (const rel of state.relics) {
      if (!rel.active) continue;
      const d = Math.hypot(rel.x - rival.x, rel.z - rival.z);
      if (d < nearestRelicDist) {
        nearestRelicDist = d;
        nearestRelic = rel;
      }
    }

    const playerDist = Math.hypot(p.x - rival.x, p.z - rival.z);
    const archCode = archetypeToLexCode(rival.archetype);
    const intentBig = Foundation_NpcBehavior_V1_Model_decideNpcIntentCode(
      archCode,
      bodyHazard,
      BigInt(Math.round(nearestRelicDist)),
      BigInt(Math.round(playerDist)),
      BigInt(rival.segments.length),
    );
    rival.intentCode = Number(intentBig);

    const tokenAvailable = activeChargerTokens < maxChargerTokens;
    const wantsBoost = Foundation_NpcBehavior_V1_Model_decideNpcShouldBoost(
      archCode,
      intentBig,
      BigInt(rival.segments.length),
      tokenAvailable,
    );

    if (wantsBoost) {
      activeChargerTokens++;
      if (!rival.isCharging && rival.windupMs <= 0) {
        rival.windupMs = Number(Foundation_NpcBehavior_V1_Model_computeChargeWindupMs(archCode));
        rival.isCharging = true;
        if (playerDist < 28) {
          state.events.push({
            type: 'rival-telegraph',
            x: rival.x,
            y: rival.y,
            z: rival.z,
            colorHex: rival.accentHex,
          });
        }
      }
    } else {
      rival.isCharging = false;
      rival.windupMs = 0;
    }

    if (rival.windupMs > 0) {
      rival.windupMs = Math.max(0, rival.windupMs - dtMs);
      rival.isOverdrive = false;
    } else {
      rival.isOverdrive = wantsBoost;
    }

    // Desired steering target angle based on LexLean intent code
    let desiredAngle = rival.heading;
    if (rival.intentCode === 0) {
      desiredAngle = hazardAvoidAngle;
    } else if (rival.intentCode === 2) {
      // Cut off ahead of player's velocity vector
      const leadX = p.x + Math.cos(p.heading) * 6.5;
      const leadZ = p.z + Math.sin(p.heading) * 6.5;
      desiredAngle = Math.atan2(leadZ - rival.z, leadX - rival.x);
    } else if (rival.intentCode === 3) {
      // Territorial Leviathan coils around biome landmark
      const orbitAngle = Math.atan2(rival.z, rival.x) + Math.PI * 0.56;
      desiredAngle = orbitAngle;
    } else if (rival.intentCode === 4 && nearestRelic) {
      desiredAngle = Math.atan2(nearestRelic.z - rival.z, nearestRelic.x - rival.x);
    } else {
      // Seek nearest active orb
      let bestOrb: OrbEntity | null = null;
      let bestDist = 999;
      for (let i = 0; i < state.orbs.length; i += 3) {
        const o = state.orbs[i];
        if (!o.active) continue;
        const d = Math.hypot(o.x - rival.x, o.z - rival.z);
        if (d < bestDist) {
          bestDist = d;
          bestOrb = o;
        }
      }
      if (bestOrb) {
        desiredAngle = Math.atan2(bestOrb.z - rival.z, bestOrb.x - rival.x);
      }
    }

    rival.onSpeedPad = state.speedPads.some(
      (pad) => Math.hypot(rival.x - pad.x, rival.z - pad.z) <= pad.radius,
    );
    rival.speed =
      (Number(
        Foundation_Kinematics_V1_Model_computeSerpentSpeedCmPerSec(
          rival.isOverdrive,
          rival.hyperCoreMs > 0,
          rival.onSpeedPad,
        ),
      ) /
        100) *
      0.9;
    rival.turnRate =
      Number(
        Foundation_Kinematics_V1_Model_computeTurnRateMilliRadPerSec(
          BigInt(rival.segments.length),
          rival.isOverdrive,
        ),
      ) / 1000;

    const angleDiff = normalizeAngle(desiredAngle - rival.heading);
    const maxTurn = rival.turnRate * dt;
    rival.heading = normalizeAngle(
      rival.heading + Math.max(-maxTurn, Math.min(maxTurn, angleDiff)),
    );

    updateSerpentSpine(rival, state.worldRadius, dt);
  }

  // Orbs pickup & Magnet-Prism orbital pull
  const playerPullRadius =
    Number(Foundation_Pickups_V1_Model_computeMagnetPullRadiusCm(p.magnetPrismMs > 0)) / 100;

  for (const orb of state.orbs) {
    if (!orb.active) {
      if (!orb.isLoot) {
        orb.respawnMs -= dtMs;
        if (orb.respawnMs <= 0) {
          orb.active = true;
        }
      }
      continue;
    }

    orb.phase += dt * 3.2;

    const distToPlayer = Math.hypot(orb.x - p.x, orb.z - p.z);
    if (distToPlayer <= playerPullRadius && distToPlayer > 1.35) {
      const pullSpeed = p.magnetPrismMs > 0 ? 22 : 9;
      const ang = Math.atan2(p.z - orb.z, p.x - orb.x);
      orb.x += Math.cos(ang) * pullSpeed * dt;
      orb.z += Math.sin(ang) * pullSpeed * dt;
      orb.y = groundHeightAt(orb.x, orb.z) + 0.42;
    }

    if (distToPlayer <= 1.55) {
      orb.active = false;
      orb.respawnMs = 5500;
      addGrowthAndScore(p, orb.isLoot ? 'rival-loot' : 'energy-orb', orb.tier);
      state.events.push({
        type: 'orb-pickup',
        x: orb.x,
        y: orb.y,
        z: orb.z,
        colorHex: orb.colorHex,
        comboCount: p.comboCount,
        isLoot: orb.isLoot,
      });
      continue;
    }

    // Check NPC orb collection
    for (const rival of state.rivals) {
      if (!rival.alive) continue;
      if (Math.hypot(orb.x - rival.x, orb.z - rival.z) <= 1.45) {
        orb.active = false;
        orb.respawnMs = 6000;
        addGrowthAndScore(rival, orb.isLoot ? 'rival-loot' : 'energy-orb', orb.tier);
        break;
      }
    }
  }

  // Special Relic Objects pickup & respawn
  for (const relic of state.relics) {
    if (!relic.active) {
      relic.respawnMs -= dtMs;
      if (relic.respawnMs <= 0) {
        relic.active = true;
      }
      continue;
    }
    relic.spinAngle += dt * 2.1;

    if (Math.hypot(relic.x - p.x, relic.z - p.z) <= 2.35) {
      relic.active = false;
      relic.respawnMs = 9500;
      state.relicsCollectedCount += 1;
      applyRelicEffect(state, p, relic.kind);
      const meta = SPECIAL_RELIC_CATALOG.find((c) => c.kind === relic.kind);
      state.bannerText = `${meta?.name.toUpperCase() ?? relic.kind.toUpperCase()} — ${meta?.effectSummary.toUpperCase() ?? ''}`;
      state.bannerTimerMs = 2600;
      state.events.push({
        type: 'relic-pickup',
        x: relic.x,
        y: relic.y,
        z: relic.z,
        colorHex: meta?.hex ?? '#F59E0B',
        relicKind: relic.kind,
      });
      continue;
    }

    for (const rival of state.rivals) {
      if (!rival.alive) continue;
      if (Math.hypot(relic.x - rival.x, relic.z - rival.z) <= 2.1) {
        relic.active = false;
        relic.respawnMs = 10500;
        applyRelicEffect(state, rival, relic.kind);
        break;
      }
    }
  }

  // Head-to-Body Serpent Takedowns
  // 1) Rival head hitting Player's body -> Rival is shattered & Player earns elimination!
  for (const rival of state.rivals) {
    if (!rival.alive || rival.invulnerableMs > 0 || rival.phaseCloakMs > 0) continue;
    for (let s = 1; s < p.segments.length; s++) {
      const seg = p.segments[s];
      if (Math.hypot(rival.x - seg.x, rival.z - seg.z) <= 1.38) {
        eliminateRival(state, rival, p);
        break;
      }
    }
  }

  // 2) Player head hitting Rival's body -> Phase-Cloak passes safely; Hyper-Core shatters rival; otherwise Hull Vitality Pip takes 1 hit!
  if (p.invulnerableMs <= 0 && p.phaseCloakMs <= 0) {
    for (const rival of state.rivals) {
      if (!rival.alive) continue;
      let collided = false;
      for (let s = 0; s < rival.segments.length; s++) {
        const seg = rival.segments[s];
        if (Math.hypot(p.x - seg.x, p.z - seg.z) <= 1.32) {
          collided = true;
          break;
        }
      }
      if (collided) {
        if (p.hyperCoreMs > 0) {
          eliminateRival(state, rival, p);
        } else {
          p.hullPips = Math.max(0, p.hullPips - 1);
          p.invulnerableMs = 2400;
          state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.68);
          state.hitstopSec = 0.05;
          state.events.push({
            type: 'player-hit',
            x: p.x,
            y: p.y,
            z: p.z,
            colorHex: '#F43F5E',
          });
          // Knock heading slightly away from rival spine
          p.heading = normalizeAngle(p.heading + Math.PI * 0.55);

          if (p.hullPips <= 0) {
            state.runEnded = true;
            state.runVictory = false;
            state.runEndReason = `Hull Integrity Depleted by ${rival.name}`;
            state.events.push({
              type: 'run-ended',
              x: p.x,
              y: p.y,
              z: p.z,
              colorHex: '#F43F5E',
              victory: false,
            });
            refreshDirectiveAndStandings(state);
            return;
          } else {
            state.bannerText = `HULL SHIELD IMPACT — ${p.hullPips}/${p.maxHullPips} VITALITY REMAINING`;
            state.bannerTimerMs = 2200;
          }
        }
        break;
      }
    }
  }

  // Monolith Shrine Harmonic Attunement (active in Open-World and Nexus Prime in Arena)
  const activeShrines = state.mode === 'open-world' ? state.shrines : state.shrines.slice(0, 1);
  for (let idx = 0; idx < activeShrines.length; idx++) {
    const shrine = activeShrines[idx];
    if (shrine.attuned) continue;
    const dist = Math.hypot(p.x - shrine.x, p.z - shrine.z);
    if (dist <= 7.8) {
      const rate = input.attunePressed ? 1.0 : dt * 0.92;
      shrine.attuneProgress = Math.min(1, shrine.attuneProgress + rate);
      if (shrine.attuneProgress >= 1) {
        shrine.attuned = true;
        const attunedTotal = state.shrines.filter((s) => s.attuned).length;
        const bonus = Number(
          Foundation_OpenWorld_V1_Model_computeShrineAttuneBonus(BigInt(attunedTotal)),
        );
        p.score += bonus;
        if (p.hullPips < p.maxHullPips) {
          p.hullPips += 1;
        }
        state.cameraTrauma = Math.min(1, state.cameraTrauma + 0.35);
        state.shockwaves.push({
          x: shrine.x,
          y: shrine.y + 0.5,
          z: shrine.z,
          radius: 1.2,
          maxRadius: 20,
          alpha: 1,
          colorHex: shrine.accentHex,
        });
        state.bannerText = `SHRINE ATTUNED: ${shrine.name.toUpperCase()} (+${bonus} PTS)`;
        state.bannerTimerMs = 3000;
        state.events.push({
          type: 'shrine-attuned',
          x: shrine.x,
          y: shrine.y,
          z: shrine.z,
          colorHex: shrine.accentHex,
          shrineIndex: idx,
        });

        if (state.mode === 'open-world' && attunedTotal >= state.shrines.length) {
          state.bannerText =
            'ALL 5 FRONTIER MONOLITHS HARMONIZED — SOVEREIGN ATLAS COMPLETE (+600 PTS)';
          state.bannerTimerMs = 4500;
        }
      }
    } else {
      shrine.attuneProgress = Math.max(0, shrine.attuneProgress - dt * 0.35);
    }
  }

  refreshDirectiveAndStandings(state);
}

const HALL_STORAGE_KEY = 'prism_serpent_sovereign_hall_v1';

export function createSeedHallOfFame(): SovereignHallEntry[] {
  const seeds: Array<{
    callsign: string;
    mode: GameMode;
    score: number;
    maxLength: number;
    placementRank: number;
    eliminations: number;
    shrinesAttuned: number;
    eloRating: number;
    directive: SerpentDirective;
  }> = [
    {
      callsign: 'AURA-PRIME',
      mode: 'arena',
      score: 3640,
      maxLength: 118,
      placementRank: 1,
      eliminations: 6,
      shrinesAttuned: 1,
      eloRating: 1842,
      directive: 'apex-dominance',
    },
    {
      callsign: 'KAEL-V9',
      mode: 'open-world',
      score: 2980,
      maxLength: 96,
      placementRank: 1,
      eliminations: 4,
      shrinesAttuned: 5,
      eloRating: 1625,
      directive: 'frontier-attune',
    },
    {
      callsign: 'ZERA-HEX',
      mode: 'arena',
      score: 2410,
      maxLength: 82,
      placementRank: 2,
      eliminations: 3,
      shrinesAttuned: 1,
      eloRating: 1460,
      directive: 'relic-ascension',
    },
    {
      callsign: 'SOLARIS-8',
      mode: 'open-world',
      score: 1890,
      maxLength: 64,
      placementRank: 2,
      eliminations: 2,
      shrinesAttuned: 4,
      eloRating: 1365,
      directive: 'chrono-cascade',
    },
    {
      callsign: 'VORTEX-3',
      mode: 'arena',
      score: 1420,
      maxLength: 51,
      placementRank: 3,
      eliminations: 1,
      shrinesAttuned: 0,
      eloRating: 1210,
      directive: 'intercept-cut',
    },
  ];

  return seeds.map((s, idx) => {
    const receiptHash = computeLeaderboardReceiptHash(s);
    return {
      id: `seed-${idx}`,
      ...s,
      leagueTier: computeLeagueTierName(s.eloRating),
      timestampIso: '2026-05-01T00:00:00.000Z',
      receiptHash,
      isPlayerRecord: false,
    };
  });
}

export function loadSovereignHall(): SovereignHallEntry[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return createSeedHallOfFame();
  }
  try {
    const raw = window.localStorage.getItem(HALL_STORAGE_KEY);
    if (!raw) return createSeedHallOfFame();
    const parsed = JSON.parse(raw) as SovereignHallEntry[];
    if (!Array.isArray(parsed) || parsed.length === 0) return createSeedHallOfFame();
    return parsed.filter((e) => verifyLeaderboardReceipt(e));
  } catch {
    return createSeedHallOfFame();
  }
}

export function recordRunToSovereignHall(
  existing: SovereignHallEntry[],
  currentElo: number,
  state: PrismWorldState,
  callsign: string,
): { updatedHall: SovereignHallEntry[]; newEntry: SovereignHallEntry } {
  const rank = state.liveStandings.find((r) => r.isPlayer)?.rank ?? 9;
  const attunedCount = state.shrines.filter((s) => s.attuned).length;
  const eloInfo = computeUpdatedPlayerElo(
    currentElo,
    rank,
    state.player.eliminations,
    attunedCount,
  );
  const finalScore = state.player.score + eloInfo.placementBonus;
  const check = validatePilotCallsign(callsign);
  const safeCallsign = check.valid ? check.normalized : 'SOVEREIGN-1';

  const payload = {
    callsign: safeCallsign,
    mode: state.mode,
    score: finalScore,
    maxLength: state.player.segments.length,
    placementRank: rank,
    eliminations: state.player.eliminations,
    shrinesAttuned: attunedCount,
    eloRating: eloInfo.eloRating,
  };

  const newEntry: SovereignHallEntry = {
    id: `run-${Date.now()}`,
    ...payload,
    leagueTier: eloInfo.leagueTier,
    directive: state.activeDirective,
    timestampIso: new Date().toISOString(),
    receiptHash: computeLeaderboardReceiptHash(payload),
    isPlayerRecord: true,
  };

  const updatedHall = [...existing, newEntry]
    .sort((a, b) => b.score - a.score)
    .slice(0, 16);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(HALL_STORAGE_KEY, JSON.stringify(updatedHall));
    } catch {
      // ignore storage quota errors
    }
  }

  return { updatedHall, newEntry };
}
