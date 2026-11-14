import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MinimapCanvas } from './components/MinimapCanvas';
import { type CodexTab, PrismCodexModal } from './components/PrismCodexModal';
import {
  HullVitalitySocket,
  PickupSvgIcon,
  PrismSerpentEmblem,
  ShrineGlyphIcon,
  UtilitySquareIcon,
} from './components/SerpentIcons';
import { SerpentViewport } from './components/SerpentViewport';
import {
  computeLeagueTierName,
  createPrismWorldState,
  type FrontierBiomeId,
  type GameMode,
  loadSovereignHall,
  type PickupKind,
  type PrismWorldState,
  recordRunToSovereignHall,
  type ShellState,
  type SovereignHallEntry,
  stepGameShellState,
  teleportPlayerToBiome,
  validatePilotCallsign,
} from './game/prismEngine';
import { SerpentSoundEngine } from './game/soundEngine';

function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  return `${mins}:${rem.toString().padStart(2, '0')}`;
}

export default function App() {
  const initialParams = useMemo(() => {
    if (typeof window === 'undefined') {
      return { autostart: false, mode: 'arena' as GameMode };
    }
    const qs = new URLSearchParams(window.location.search);
    const rawMode = qs.get('mode');
    const mode: GameMode =
      rawMode === 'open-world' || rawMode === 'explore' ? 'open-world' : 'arena';
    const autostart = qs.get('autostart') === '1';
    return { autostart, mode };
  }, []);

  const [selectedMode, setSelectedMode] = useState<GameMode>(initialParams.mode);
  const [callsign, setCallsign] = useState<string>('SOVEREIGN-1');
  const [shellState, setShellState] = useState<ShellState>(
    initialParams.autostart ? 'playing' : 'title',
  );
  const [codexTab, setCodexTab] = useState<CodexTab>('overview');
  const [showControlsHint, setShowControlsHint] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [, setHudTick] = useState<number>(0);

  const [hallOfFame, setHallOfFame] = useState<SovereignHallEntry[]>(() => loadSovereignHall());
  const [playerElo, setPlayerElo] = useState<number>(1380);
  const [latestRunEntry, setLatestRunEntry] = useState<SovereignHallEntry | null>(null);

  const soundEngine = useMemo(() => new SerpentSoundEngine(), []);
  const worldRef = useRef<PrismWorldState>(
    createPrismWorldState(initialParams.mode, 'SOVEREIGN-1', 42010),
  );

  const callsignCheck = validatePilotCallsign(callsign);

  // Sync `document.body.dataset.state` for deterministic game shell state inspection
  useEffect(() => {
    document.body.dataset.state = shellState;
    soundEngine.setPaused(shellState === 'paused');
  }, [shellState, soundEngine]);

  useEffect(() => {
    return () => {
      soundEngine.dispose();
    };
  }, [soundEngine]);

  const handleHudSync = useCallback(() => {
    setHudTick((n) => (n + 1) & 0xffff);
  }, []);

  const startRun = useCallback(
    (modeToStart: GameMode) => {
      const check = validatePilotCallsign(callsign);
      const safeName = check.valid ? check.normalized : 'SOVEREIGN-1';
      setSelectedMode(modeToStart);
      setLatestRunEntry(null);
      soundEngine.unlock();
      worldRef.current = createPrismWorldState(
        modeToStart,
        safeName,
        Math.floor(Date.now() % 100000) + 101,
      );
      setShellState((prev) => stepGameShellState(prev === 'paused' ? 'gameover' : prev, 'start'));
      setHudTick((n) => n + 1);
    },
    [callsign, soundEngine],
  );

  const openCodexAtTab = useCallback((tab: CodexTab) => {
    setCodexTab(tab);
    setShellState('paused');
  }, []);

  const handleRunEnded = useCallback(
    (_victory: boolean) => {
      const { updatedHall, newEntry } = recordRunToSovereignHall(
        hallOfFame,
        playerElo,
        worldRef.current,
        callsign,
      );
      setHallOfFame(updatedHall);
      setPlayerElo(newEntry.eloRating);
      setLatestRunEntry(newEntry);
      setCodexTab('overview');
      setShellState((prev) => stepGameShellState(prev, 'hull-depleted'));
    },
    [callsign, hallOfFame, playerElo],
  );

  const handleToggleMute = useCallback(() => {
    const nextMuted = soundEngine.toggleMute();
    setIsMuted(nextMuted);
  }, [soundEngine]);

  const handleTeleportBiome = useCallback(
    (biomeId: FrontierBiomeId) => {
      if (worldRef.current.mode !== 'open-world') {
        const check = validatePilotCallsign(callsign);
        const safeName = check.valid ? check.normalized : 'SOVEREIGN-1';
        worldRef.current = createPrismWorldState('open-world', safeName, 77701);
        setSelectedMode('open-world');
      }
      teleportPlayerToBiome(worldRef.current, biomeId);
      setShellState('playing');
      setHudTick((n) => n + 1);
    },
    [callsign],
  );

  // Global Shell Keyboard Shortcuts (Enter/Space on Title, Esc Pause, C Codex, Tab Leaderboard, M Mute, H Hints)
  useEffect(() => {
    const onGlobalKeyDown = (e: KeyboardEvent) => {
      const inInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement;

      if (shellState === 'title' && !inInput && (e.code === 'Enter' || e.code === 'Space')) {
        e.preventDefault();
        startRun(selectedMode);
        return;
      }

      if (e.code === 'Escape') {
        if (shellState === 'playing') {
          e.preventDefault();
          setCodexTab('overview');
          setShellState((prev) => stepGameShellState(prev, 'toggle-pause'));
        } else if (shellState === 'paused') {
          e.preventDefault();
          setShellState((prev) => stepGameShellState(prev, 'toggle-pause'));
        }
        return;
      }

      if (inInput) return;

      if (e.code === 'KeyM') {
        handleToggleMute();
      } else if (e.code === 'KeyH' && shellState === 'playing') {
        setShowControlsHint((v) => !v);
      } else if (e.code === 'KeyC' && shellState === 'playing') {
        e.preventDefault();
        openCodexAtTab('verifier');
      } else if (e.code === 'Tab' && shellState === 'playing') {
        e.preventDefault();
        openCodexAtTab('leaderboard');
      }
    };

    window.addEventListener('keydown', onGlobalKeyDown);
    return () => window.removeEventListener('keydown', onGlobalKeyDown);
  }, [handleToggleMute, openCodexAtTab, selectedMode, shellState, startRun]);

  const world = worldRef.current;
  const player = world.player;
  const attunedShrinesCount = world.shrines.filter((s) => s.attuned).length;
  const playerRank = world.liveStandings.find((r) => r.isPlayer)?.rank ?? 1;

  // Check if player is standing near an unattuned shrine to show diegetic prompt
  const nearbyUnattunedShrine = useMemo(() => {
    const list = world.mode === 'open-world' ? world.shrines : world.shrines.slice(0, 1);
    return list.find(
      (s) => !s.attuned && Math.hypot(player.x - s.x, player.z - s.z) <= 8.5,
    );
  }, [player.x, player.z, world.mode, world.shrines]);

  const activeRelicBuffs: Array<{ kind: PickupKind; label: string; sec: number; hex: string }> = [];
  if (player.hyperCoreMs > 0) {
    activeRelicBuffs.push({
      kind: 'hyper-core',
      label: 'Hyper-Core',
      sec: player.hyperCoreMs / 1000,
      hex: '#F59E0B',
    });
  }
  if (player.magnetPrismMs > 0) {
    activeRelicBuffs.push({
      kind: 'magnet-prism',
      label: 'Magnet-Prism',
      sec: player.magnetPrismMs / 1000,
      hex: '#38BDF8',
    });
  }
  if (player.phaseCloakMs > 0) {
    activeRelicBuffs.push({
      kind: 'phase-cloak',
      label: 'Phase-Cloak',
      sec: player.phaseCloakMs / 1000,
      hex: '#A78BFA',
    });
  }
  if (player.chronoShardMs > 0) {
    activeRelicBuffs.push({
      kind: 'chrono-shard',
      label: 'Chrono 2x',
      sec: player.chronoShardMs / 1000,
      hex: '#34D399',
    });
  }

  return (
    <main className="relative w-screen h-dvh overflow-hidden bg-[#050814] text-slate-100 select-none">
      {/* Live 3D Spatial Viewport (Mounted once across all Game Shell states) */}
      <SerpentViewport
        worldRef={worldRef}
        shellState={shellState}
        soundEngine={soundEngine}
        onHudSync={handleHudSync}
        onRunEnded={handleRunEnded}
      />

      {/* === STATE 1: TITLE SCREEN OVER LIVE 3D WORLD === */}
      {shellState === 'title' && (
        <section
          aria-label="Title Screen"
          className="relative z-20 w-full h-full flex flex-col justify-between p-6 sm:p-10 pointer-events-none"
        >
          {/* Top-right subtle audio & formal verifier quick buttons */}
          <div className="flex justify-end gap-2 pointer-events-auto">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              className="w-9 h-9 flex items-center justify-center bg-[#060C1D]/90 hover:bg-[#0E1B3A] border border-cyan-500/35 text-cyan-200 transition-colors cursor-pointer"
            >
              <UtilitySquareIcon kind={isMuted ? 'mute' : 'unmute'} />
            </button>
          </div>

          {/* Left-anchored Hero Lockup & Launch Card leaving the right/center 3D monolith vista open */}
          <div className="max-w-xl space-y-5 pointer-events-auto">
            <PrismSerpentEmblem />

            <p className="text-sm sm:text-base text-slate-100 hud-text-shadow max-w-lg leading-relaxed bg-gradient-to-r from-[#050A18]/88 via-[#050A18]/65 to-transparent pl-3.5 pr-4 py-2 border-l-2 border-cyan-400">
              Command an articulated prismatic serpent across competitive neon arenas and five
              open-world monolith biomes — formally modeled in UOR Prism.
            </p>

            {/* Compact Obsidian Launch Control Deck */}
            <div className="p-5 bg-[#060C1D]/92 border border-cyan-500/40 shadow-[0_20px_50px_rgba(2,6,23,0.85)] space-y-4">
              {/* Mode Selector */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMode('arena');
                    worldRef.current = createPrismWorldState('arena', callsignCheck.normalized || 'SOVEREIGN-1', 42010);
                  }}
                  className={`p-3 text-left border transition-colors cursor-pointer ${
                    selectedMode === 'arena'
                      ? 'bg-cyan-950/55 border-cyan-400 text-white'
                      : 'bg-[#0A142B] border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-300">
                    Competitive Arena
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Ranked 9-Serpent Clash & Relics
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMode('open-world');
                    worldRef.current = createPrismWorldState('open-world', callsignCheck.normalized || 'SOVEREIGN-1', 77701);
                  }}
                  className={`p-3 text-left border transition-colors cursor-pointer ${
                    selectedMode === 'open-world'
                      ? 'bg-emerald-950/55 border-emerald-400 text-white'
                      : 'bg-[#0A142B] border-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="font-display text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-300">
                    Open-World Frontier
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    5 Biomes & Monolith Shrines
                  </div>
                </button>
              </div>

              {/* Pilot Callsign + Rating */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <label className="flex-1 flex flex-col gap-1">
                  <span className="font-display text-[11px] uppercase tracking-wider text-slate-300">
                    Pilot Callsign ({computeLeagueTierName(playerElo)} · {playerElo} ELO)
                  </span>
                  <input
                    type="text"
                    maxLength={14}
                    value={callsign}
                    onChange={(e) => setCallsign(e.target.value.toUpperCase())}
                    aria-label="Pilot Callsign"
                    className="px-3 py-2 bg-[#040917] border border-slate-700 focus:border-cyan-400 outline-none font-mono text-sm text-white uppercase tracking-wider"
                  />
                </label>

                <button
                  type="button"
                  data-start="true"
                  disabled={!callsignCheck.valid}
                  onClick={() => startRun(selectedMode)}
                  className="px-7 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-45 text-slate-950 font-display font-bold text-base uppercase tracking-wider shadow-[0_0_24px_rgba(34,211,238,0.35)] transition-colors cursor-pointer"
                >
                  {selectedMode === 'open-world' ? 'Enter Frontier' : 'Launch Arena'}
                </button>
              </div>

              {!callsignCheck.valid && callsignCheck.error && (
                <p className="text-xs text-rose-400 font-medium">{callsignCheck.error}</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* === STATE 2: UNOBSTRUCTED GAMEPLAY HUD (>= 88% CLEAR 3D CANVAS) === */}
      {shellState !== 'title' && (
        <div className="relative z-10 w-full h-full pointer-events-none">
          {/* Top-Left Primary Telemetry: Score, Clock/Discovery, 3-Pip Hull Shield, Live Prism Judge */}
          <div className="absolute top-4 left-4 sm:top-5 sm:left-5 flex flex-col gap-2">
            <div className="flex items-baseline gap-4 hud-text-shadow">
              <div>
                <div className="font-display text-[10px] uppercase tracking-[0.2em] text-cyan-300">
                  Score
                </div>
                <div className="font-display text-3xl sm:text-4xl font-bold text-white tabular-nums leading-none">
                  {player.score.toLocaleString()}
                </div>
              </div>

              <div className="border-l border-slate-600/60 pl-3.5">
                <div className="font-display text-[10px] uppercase tracking-[0.2em] text-amber-300">
                  {world.mode === 'arena' ? 'Arena Clock' : 'Frontier Atlas'}
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-amber-200 tabular-nums leading-tight">
                  {world.mode === 'arena'
                    ? formatClock(world.remainingArenaSec)
                    : `${world.worldDiscoveryPct}% · ${attunedShrinesCount}/5`}
                </div>
              </div>

              <div className="border-l border-slate-600/60 pl-3.5">
                <div className="font-display text-[10px] uppercase tracking-[0.2em] text-slate-300">
                  Length
                </div>
                <div className="font-display text-xl sm:text-2xl font-bold text-slate-100 tabular-nums leading-tight">
                  {player.segments.length}m
                </div>
              </div>
            </div>

            {/* Hull Shield Pips + Combo Multiplier */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1" aria-label="Hull Shield Integrity">
                {Array.from({ length: player.maxHullPips }).map((_, idx) => (
                  <HullVitalitySocket
                    key={idx}
                    index={idx}
                    state={idx < player.hullPips ? 'full' : 'empty'}
                  />
                ))}
              </div>

              {player.comboCount > 1 && (
                <span className="font-display text-xs font-bold uppercase tracking-wider text-amber-300 hud-text-shadow tabular-nums">
                  {player.comboCount}x Harmonic Chain
                </span>
              )}
            </div>

            {/* Live Mechanized PrismSerpent::judge Directive */}
            <div className="font-mono text-[11px] text-cyan-200 hud-text-shadow">
              Directive: <span className="font-bold text-white">{world.activeDirectiveLabel}</span>
            </div>

            {/* Active Special Relic Timers (only visible when active) */}
            {activeRelicBuffs.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {activeRelicBuffs.map((buff) => (
                  <div
                    key={buff.kind}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-[#060C1D]/88 border border-slate-700/80 text-xs font-mono tabular-nums"
                  >
                    <PickupSvgIcon kind={buff.kind} className="w-4 h-4" />
                    <span style={{ color: buff.hex }} className="font-semibold">
                      {buff.label}
                    </span>
                    <span className="text-white">{buff.sec.toFixed(1)}s</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top-Center Transient Callout / Shrine Attunement Prompt */}
          {(world.bannerTimerMs > 0 || nearbyUnattunedShrine) && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 max-w-md text-center px-4">
              {nearbyUnattunedShrine ? (
                <div className="px-4 py-2 bg-[#060D20]/92 border border-emerald-400/60 shadow-lg">
                  <div className="font-display text-xs font-bold uppercase tracking-wider text-emerald-300">
                    {nearbyUnattunedShrine.name} — Press [E] or Hold Proximity to Attune (
                    {Math.round(nearbyUnattunedShrine.attuneProgress * 100)}%)
                  </div>
                </div>
              ) : (
                <div className="font-display text-xs sm:text-sm font-bold uppercase tracking-[0.16em] text-cyan-200 hud-text-shadow">
                  {world.bannerText}
                </div>
              )}
            </div>
          )}

          {/* Top-Right Compact Utility Controls + Top-5 Live Standings */}
          <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex flex-col items-end gap-2.5">
            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => openCodexAtTab('verifier')}
                title="Prism 9-Facet Formal Verifier [C]"
                aria-label="Open Prism 9-Facet Formal Verifier"
                className="w-8 h-8 flex items-center justify-center bg-[#060C1D]/88 hover:bg-[#102044] border border-cyan-500/35 text-cyan-300 transition-colors cursor-pointer"
              >
                <UtilitySquareIcon kind="codex" />
              </button>
              <button
                type="button"
                onClick={() => openCodexAtTab('atlas')}
                title="Open-World Frontier Atlas"
                aria-label="Open Frontier Biome Atlas"
                className="w-8 h-8 flex items-center justify-center bg-[#060C1D]/88 hover:bg-[#102044] border border-emerald-500/35 text-emerald-300 transition-colors cursor-pointer"
              >
                <ShrineGlyphIcon attuned={attunedShrinesCount > 0} className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToggleMute}
                title={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
                aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                className="w-8 h-8 flex items-center justify-center bg-[#060C1D]/88 hover:bg-[#102044] border border-slate-600/60 text-slate-200 transition-colors cursor-pointer"
              >
                <UtilitySquareIcon kind={isMuted ? 'mute' : 'unmute'} />
              </button>
              <button
                type="button"
                onClick={() => openCodexAtTab('overview')}
                title="Pause & Tactical Menu [Esc]"
                aria-label="Pause Game"
                className="w-8 h-8 flex items-center justify-center bg-[#060C1D]/88 hover:bg-[#102044] border border-slate-600/60 text-slate-200 transition-colors cursor-pointer"
              >
                <UtilitySquareIcon kind="pause" />
              </button>
            </div>

            {/* Compact Live Top-5 Leaderboard */}
            <div
              className="w-48 bg-[#050A18]/82 border border-slate-800/90 px-2.5 py-2 space-y-1 pointer-events-auto cursor-pointer"
              onClick={() => openCodexAtTab('leaderboard')}
              title="Click or press Tab for Full Competitive Leaderboard"
            >
              <div className="flex items-center justify-between text-[10px] font-display uppercase tracking-wider text-slate-400">
                <span>Live Standings</span>
                <span className="text-cyan-300 tabular-nums">Rank #{playerRank}/9</span>
              </div>
              {world.liveStandings.slice(0, 5).map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center justify-between text-xs font-mono tabular-nums ${
                    row.isPlayer ? 'text-cyan-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate max-w-[112px]">
                    {row.rank}. {row.name}
                  </span>
                  <span>{row.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom-Right Spatial Radar & Current Frontier Biome */}
          <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 flex flex-col items-end gap-1">
            <MinimapCanvas worldRef={worldRef} />
            <div className="font-display text-[11px] font-semibold uppercase tracking-wider text-slate-200 hud-text-shadow">
              {world.currentBiome.name}
            </div>
          </div>

          {/* Bottom-Left Collapsible Controls Strip */}
          {showControlsHint && (
            <div className="absolute bottom-4 left-4 sm:bottom-5 sm:left-5 font-mono text-[11px] text-slate-300 hud-text-shadow">
              [A/D] Steer · [Space/W] Overdrive · [E] Attune · [Tab] Ranks · [C] Prism Verifier · [H] Hide
            </div>
          )}
        </div>
      )}

      {/* === STATE 3 & 4: PAUSED / PRISM CODEX / GAME OVER MODAL === */}
      {(shellState === 'paused' || shellState === 'gameover') && (
        <PrismCodexModal
          shellState={shellState}
          initialTab={codexTab}
          world={world}
          hallOfFame={hallOfFame}
          latestRunEntry={latestRunEntry}
          playerElo={playerElo}
          isMuted={isMuted}
          onResume={() => setShellState((prev) => stepGameShellState(prev, 'toggle-pause'))}
          onRestart={startRun}
          onReturnTitle={() => setShellState((prev) => stepGameShellState(prev, 'return-title'))}
          onToggleMute={handleToggleMute}
          onTeleportBiome={handleTeleportBiome}
        />
      )}
    </main>
  );
}
