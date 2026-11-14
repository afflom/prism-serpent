import React, { useMemo, useState } from 'react';
import {
  evaluatePrismDispatch,
  FRONTIER_BIOMES,
  type FrontierBiomeId,
  type GameMode,
  PRISM_HOSTED_ATTESTATIONS,
  PRISM_MODULE_CATALOG,
  PRISM_SPEC_DOCUMENT,
  type PrismWorldState,
  type ShellState,
  type SovereignHallEntry,
  SPECIAL_RELIC_CATALOG,
  verifyAllPrismInvariants,
  verifyLeaderboardReceipt,
} from '../game/prismEngine';
import { PickupSvgIcon, ShrineGlyphIcon } from './SerpentIcons';

export type CodexTab = 'overview' | 'leaderboard' | 'atlas' | 'verifier';

interface PrismCodexModalProps {
  shellState: Extract<ShellState, 'paused' | 'gameover'>;
  initialTab: CodexTab;
  world: PrismWorldState;
  hallOfFame: SovereignHallEntry[];
  latestRunEntry: SovereignHallEntry | null;
  playerElo: number;
  isMuted: boolean;
  onResume: () => void;
  onRestart: (mode: GameMode) => void;
  onReturnTitle: () => void;
  onToggleMute: () => void;
  onTeleportBiome: (biomeId: FrontierBiomeId) => void;
}

export const PrismCodexModal: React.FC<PrismCodexModalProps> = ({
  shellState,
  initialTab,
  world,
  hallOfFame,
  latestRunEntry,
  playerElo,
  isMuted,
  onResume,
  onRestart,
  onReturnTitle,
  onToggleMute,
  onTeleportBiome,
}) => {
  const [activeTab, setActiveTab] = useState<CodexTab>(initialTab);

  // Interactive PrismSpecJudge Sandbox state
  const [sbMode, setSbMode] = useState<string>('arena');
  const [sbPickup, setSbPickup] = useState<string>('apex-crown');
  const [sbRival, setSbRival] = useState<string>('interceptor');
  const [sbZone, setSbZone] = useState<string>('nexus-bowl');
  const [sbBoost, setSbBoost] = useState<string>('overdrive');
  const [sbLength, setSbLength] = useState<number>(85);
  const [sbThreat, setSbThreat] = useState<number>(40);

  const audit = useMemo(() => verifyAllPrismInvariants(), []);

  const sandboxRequest = `${sbMode} ${sbPickup} ${sbRival} ${sbZone} ${sbBoost} ${sbLength} ${sbThreat}`;
  const sandboxOutcome = evaluatePrismDispatch(sandboxRequest);

  const playerStanding = world.liveStandings.find((r) => r.isPlayer);
  const attunedCount = world.shrines.filter((s) => s.attuned).length;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-[rgba(3,7,18,0.82)]"
      role="dialog"
      aria-modal="true"
      aria-label={shellState === 'gameover' ? 'Run Summary and Sovereign Codex' : 'Sovereign Codex and Tactical Menu'}
    >
      <div className="w-full max-w-5xl max-h-[88vh] flex flex-col bg-[#060C1D] border border-cyan-500/45 shadow-[0_24px_64px_rgba(2,6,23,0.92)] text-slate-100 overflow-hidden">
        {/* Top Modal Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#09132B] border-b border-cyan-500/30">
          <div>
            <div className="font-display text-xs uppercase tracking-[0.22em] text-cyan-400">
              {shellState === 'gameover'
                ? world.runVictory
                  ? 'Sovereign Ascension Complete'
                  : 'Run Concluded'
                : 'Tactical Command & Formal Prism Codex'}
            </div>
            <h2 className="font-display text-2xl font-bold tracking-wide text-white">
              {shellState === 'gameover' ? world.runEndReason : 'PRISM SERPENT — SOVEREIGN CODEX'}
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {shellState === 'paused' && (
              <button
                type="button"
                onClick={onResume}
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer"
              >
                Resume [Esc]
              </button>
            )}
            <button
              type="button"
              onClick={() => onRestart(world.mode)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-display font-bold text-sm uppercase tracking-wider transition-colors cursor-pointer"
            >
              {shellState === 'gameover' ? 'Play Again' : 'Restart Run'}
            </button>
            <button
              type="button"
              onClick={onReturnTitle}
              className="px-3.5 py-2 bg-[#0F1E3D] hover:bg-[#162B54] border border-slate-600/60 text-slate-200 font-display font-semibold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Title Screen
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#070F22] px-6 overflow-x-auto">
          {(
            [
              ['overview', 'Mission & Relics'],
              ['leaderboard', 'Competitive Leaderboard'],
              ['atlas', 'Open-World Atlas (5 Biomes)'],
              ['verifier', 'Prism 9-Facet Verifier'],
            ] as const
          ).map(([id, label]) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`px-4 py-3 font-display text-xs sm:text-sm font-semibold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'border-cyan-400 text-cyan-300 bg-cyan-950/30'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Run Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 bg-[#0B1630] border border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Match Score</div>
                  <div className="mt-1 font-display text-2xl font-bold text-cyan-300 tabular-nums">
                    {world.player.score.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-[#0B1630] border border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Arena Standing</div>
                  <div className="mt-1 font-display text-2xl font-bold text-amber-300 tabular-nums">
                    #{playerStanding?.rank ?? 1} <span className="text-sm text-slate-400">/ 9</span>
                  </div>
                </div>
                <div className="p-4 bg-[#0B1630] border border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Serpent Length & KOs</div>
                  <div className="mt-1 font-display text-2xl font-bold text-white tabular-nums">
                    {world.player.segments.length}m · {world.player.eliminations} KO
                  </div>
                </div>
                <div className="p-4 bg-[#0B1630] border border-slate-800">
                  <div className="text-xs uppercase tracking-wider text-slate-400">Sovereign Rating</div>
                  <div className="mt-1 font-display text-2xl font-bold text-emerald-300 tabular-nums">
                    {latestRunEntry ? latestRunEntry.eloRating : playerElo} ELO
                  </div>
                </div>
              </div>

              {/* Mode Switcher & Audio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => onRestart('arena')}
                  className={`p-4 text-left border transition-colors cursor-pointer ${
                    world.mode === 'arena'
                      ? 'bg-cyan-950/35 border-cyan-400/70'
                      : 'bg-[#0B1630] border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="font-display text-sm font-bold uppercase tracking-wider text-cyan-300">
                    Competitive Neon Arena
                  </div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    2:30 ranked clash against 8 NPC serpents across 4 tactical AI archetypes. Reach
                    3,500 pts or finish Top 3 to climb Sovereign Elo.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => onRestart('open-world')}
                  className={`p-4 text-left border transition-colors cursor-pointer ${
                    world.mode === 'open-world'
                      ? 'bg-emerald-950/35 border-emerald-400/70'
                      : 'bg-[#0B1630] border-slate-800 hover:border-emerald-500/40'
                  }`}
                >
                  <div className="font-display text-sm font-bold uppercase tracking-wider text-emerald-300">
                    Open-World Exploration
                  </div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                    Roam the 224m outdoor frontier spanning 5 distinct biomes, discover ancient
                    relic vaults, and harmonize all 5 Monolith Shrines.
                  </p>
                </button>

                <div className="p-4 bg-[#0B1630] border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="font-display text-sm font-bold uppercase tracking-wider text-slate-200">
                      Synthesizer & Controls
                    </div>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                      Steer with A/D, Left/Right, or Pointer drag. Hold Space/W/Shift for Overdrive.
                      Press E near Monolith Shrines to attune.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleMute}
                    className="mt-3 px-3 py-1.5 bg-[#112248] hover:bg-[#193166] border border-slate-700 text-xs font-display uppercase tracking-wider text-cyan-200 self-start cursor-pointer"
                  >
                    Audio: {isMuted ? 'Muted (Click to Unmute)' : 'Active WebAudio Synth'}
                  </button>
                </div>
              </div>

              {/* Special Relic Objects Field Guide */}
              <div>
                <h3 className="font-display text-sm uppercase tracking-wider text-slate-300 mb-3">
                  Modeled Special Relic Objects — Foundation.Pickups.V1.Model
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {SPECIAL_RELIC_CATALOG.map((rel) => (
                    <div
                      key={rel.kind}
                      className="p-3.5 bg-[#0A142B] border border-slate-800 flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <PickupSvgIcon kind={rel.kind} className="w-6 h-6 shrink-0" />
                        <span
                          className="font-display text-sm font-bold"
                          style={{ color: rel.hex }}
                        >
                          {rel.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">{rel.effectSummary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Match Rankings */}
              <div>
                <h3 className="font-display text-sm uppercase tracking-wider text-cyan-300 mb-3">
                  Live Arena Standings (9 Competitors)
                </h3>
                <div className="border border-slate-800 bg-[#091328] divide-y divide-slate-800/80">
                  {world.liveStandings.map((row) => (
                    <div
                      key={row.id}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                        row.isPlayer ? 'bg-cyan-950/40 font-semibold text-white' : 'text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 font-mono text-xs text-slate-400 tabular-nums">
                          #{row.rank}
                        </span>
                        <span
                          className="w-2.5 h-2.5 shrink-0"
                          style={{ backgroundColor: row.accentHex }}
                        />
                        <span>{row.name}</span>
                        <span className="text-[11px] uppercase tracking-wider text-slate-400">
                          {row.archetypeLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 font-mono text-xs tabular-nums">
                        <span className="text-slate-400">{row.length}m</span>
                        <span className="text-amber-300">{row.eliminations} KO</span>
                        <span className="w-16 text-right font-bold text-cyan-300">
                          {row.score.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Persistent Sovereign Hall of Fame */}
              <div>
                <h3 className="font-display text-sm uppercase tracking-wider text-amber-300 mb-3">
                  All-Time Sovereign Hall of Fame (UOR Canonical Receipts)
                </h3>
                <div className="border border-slate-800 bg-[#091328] divide-y divide-slate-800/80">
                  {hallOfFame.slice(0, 9).map((entry, idx) => {
                    const verified = verifyLeaderboardReceipt(entry);
                    return (
                      <div
                        key={entry.id}
                        className={`px-4 py-2.5 flex items-center justify-between gap-2 text-sm ${
                          entry.isPlayerRecord ? 'bg-amber-950/25' : ''
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-400 tabular-nums">
                              #{idx + 1}
                            </span>
                            <span className="font-display font-bold text-white truncate">
                              {entry.callsign}
                            </span>
                            <span className="text-[11px] font-mono uppercase text-emerald-300">
                              {entry.leagueTier} ({entry.eloRating})
                            </span>
                          </div>
                          <div className="mt-0.5 font-mono text-[10px] text-slate-400 truncate">
                            {entry.mode} · {entry.directive} ·{' '}
                            {verified ? `UOR ${entry.receiptHash.slice(0, 18)}…` : 'Unverified'}
                          </div>
                        </div>
                        <div className="text-right font-mono tabular-nums shrink-0">
                          <div className="font-bold text-amber-300">
                            {entry.score.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {entry.maxLength}m · {entry.eliminations} KO
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'atlas' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0B1630] border border-slate-800">
                <div>
                  <div className="font-display text-sm font-bold uppercase tracking-wider text-emerald-300">
                    Frontier Discovery: {world.worldDiscoveryPct}% ({attunedCount}/5 Monolith Shrines Harmonized)
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    Select any frontier biome below to fast-travel your serpent directly to its
                    monolith landmark and attune its harmonic spire.
                  </p>
                </div>
                {world.mode !== 'open-world' && (
                  <button
                    type="button"
                    onClick={() => onRestart('open-world')}
                    className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-display font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    Switch to Open-World Mode
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {FRONTIER_BIOMES.map((biome, idx) => {
                  const shrine = world.shrines[idx];
                  const visited = world.visitedBiomes.has(biome.id);
                  return (
                    <div
                      key={biome.id}
                      className="p-4 bg-[#0A142B] border border-slate-800 flex flex-col justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="font-display text-base font-bold"
                            style={{ color: biome.accentHex }}
                          >
                            {biome.name}
                          </span>
                          <ShrineGlyphIcon attuned={Boolean(shrine?.attuned)} className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-slate-400">{biome.subtitle}</div>
                        <div className="mt-2.5 text-xs text-slate-300 space-y-1">
                          <div>
                            Shrine: <span className="text-white">{shrine?.name}</span>
                          </div>
                          <div>
                            Status:{' '}
                            <span
                              className={
                                shrine?.attuned ? 'text-emerald-300 font-semibold' : 'text-amber-300'
                              }
                            >
                              {shrine?.attuned
                                ? 'Harmonized'
                                : visited
                                  ? 'Sector Visited — Unattuned'
                                  : 'Uncharted Frontier'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onTeleportBiome(biome.id)}
                        className="w-full py-2 bg-[#122449] hover:bg-[#1B3468] border border-cyan-500/35 text-xs font-display font-semibold uppercase tracking-wider text-cyan-200 transition-colors cursor-pointer"
                      >
                        Fast-Travel to {biome.name}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'verifier' && (
            <div className="space-y-6">
              {/* Cryptographic Attestation & Spec Identity */}
              <div className="p-4 bg-[#09142B] border border-cyan-500/35 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold uppercase tracking-wider text-cyan-300">
                    Prism Full 9-Facet Verification Ledger — {audit.allPassed ? '100% Verified' : 'Check Failed'}
                  </span>
                  <span className="font-mono text-xs text-emerald-300">
                    {audit.acceptancePassed}/{audit.acceptanceTotal} Acceptance Vectors ·{' '}
                    {PRISM_MODULE_CATALOG.length} LexLean Modules
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px] text-slate-300">
                  <div className="truncate">
                    specAddress: <span className="text-cyan-200">{audit.specAddress}</span>
                  </div>
                  <div className="truncate">
                    Lean 4.32 Attestation:{' '}
                    <span className="text-emerald-300">
                      {PRISM_HOSTED_ATTESTATIONS[0]?.attestationId ?? 'Verified Local AST'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Interactive PrismSerpent::dispatch Judge */}
              <div className="p-4 bg-[#0B1630] border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-amber-300">
                    Interactive PrismSerpent::dispatch Formal Rule Sandbox
                  </h3>
                  <div className="font-mono text-xs text-slate-300">
                    Live Player State: <span className="text-cyan-300">{world.activeRequestString}</span> →{' '}
                    <span className="text-amber-300 font-bold">{world.activeDirective}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400 font-mono">mode</span>
                    <select
                      value={sbMode}
                      onChange={(e) => setSbMode(e.target.value)}
                      className="bg-[#060D1F] border border-slate-700 px-2 py-1.5 text-white font-mono"
                    >
                      <option value="arena">arena</option>
                      <option value="open-world">open-world</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400 font-mono">pickup</span>
                    <select
                      value={sbPickup}
                      onChange={(e) => setSbPickup(e.target.value)}
                      className="bg-[#060D1F] border border-slate-700 px-2 py-1.5 text-white font-mono"
                    >
                      <option value="energy-orb">energy-orb</option>
                      <option value="hyper-core">hyper-core</option>
                      <option value="magnet-prism">magnet-prism</option>
                      <option value="phase-cloak">phase-cloak</option>
                      <option value="chrono-shard">chrono-shard</option>
                      <option value="apex-crown">apex-crown</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400 font-mono">rival</span>
                    <select
                      value={sbRival}
                      onChange={(e) => setSbRival(e.target.value)}
                      className="bg-[#060D1F] border border-slate-700 px-2 py-1.5 text-white font-mono"
                    >
                      <option value="none">none</option>
                      <option value="forager">forager</option>
                      <option value="interceptor">interceptor</option>
                      <option value="leviathan">leviathan</option>
                      <option value="pack-hunter">pack-hunter</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400 font-mono">zone</span>
                    <select
                      value={sbZone}
                      onChange={(e) => setSbZone(e.target.value)}
                      className="bg-[#060D1F] border border-slate-700 px-2 py-1.5 text-white font-mono"
                    >
                      {FRONTIER_BIOMES.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.id}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400 font-mono">boost</span>
                    <select
                      value={sbBoost}
                      onChange={(e) => setSbBoost(e.target.value)}
                      className="bg-[#060D1F] border border-slate-700 px-2 py-1.5 text-white font-mono"
                    >
                      <option value="cruise">cruise</option>
                      <option value="overdrive">overdrive</option>
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400 font-mono">length (1..200)</span>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={sbLength}
                      onChange={(e) => setSbLength(Number(e.target.value) || 1)}
                      className="bg-[#060D1F] border border-slate-700 px-2 py-1.5 text-white font-mono"
                    />
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-slate-400 font-mono">threat (0..100)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={sbThreat}
                      onChange={(e) => setSbThreat(Number(e.target.value) || 0)}
                      className="bg-[#060D1F] border border-slate-700 px-2 py-1.5 text-white font-mono"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#060C1C] border border-slate-800 font-mono text-xs">
                  <div>
                    Request Bytes: <span className="text-cyan-200">&quot;{sandboxRequest}&quot;</span>
                  </div>
                  <div>
                    Proved Outcome:{' '}
                    <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-400/50 text-cyan-200 font-bold">
                      {sandboxOutcome}
                    </span>
                  </div>
                </div>

                {/* Quick Preset Replay from spec.json */}
                <div className="flex flex-wrap gap-1.5">
                  {PRISM_SPEC_DOCUMENT.examples.slice(0, 6).map((ex, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const parts = ex.request.split(' ');
                        if (parts.length === 7) {
                          setSbMode(parts[0]);
                          setSbPickup(parts[1]);
                          setSbRival(parts[2]);
                          setSbZone(parts[3]);
                          setSbBoost(parts[4]);
                          setSbLength(Number(parts[5]) || 12);
                          setSbThreat(Number(parts[6]) || 0);
                        }
                      }}
                      className="px-2.5 py-1 bg-[#102042] hover:bg-[#193060] text-[11px] font-mono text-slate-200 border border-slate-700 cursor-pointer"
                    >
                      Ex #{i + 1}: {ex.response}
                    </button>
                  ))}
                </div>
              </div>

              {/* 12 Proved Facet Theorems Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {audit.facetResults.map((f) => (
                  <div
                    key={f.theorem}
                    className="px-3.5 py-2.5 bg-[#091328] border border-slate-800 flex items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-display font-semibold text-slate-200">{f.facet}</div>
                      <div className="font-mono text-[11px] text-slate-400">{f.theorem}</div>
                    </div>
                    <span className="font-mono font-bold text-emerald-300 shrink-0">
                      {f.passed ? 'QED (0 Axioms)' : 'FAILED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
