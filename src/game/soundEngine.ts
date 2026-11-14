/**
 * Procedural Web Audio Synthesizer for Prism Serpent: Neon Sovereign.
 * Zero external audio assets — 100% deterministic Web Audio synthesis
 * with weight-scaled multi-channel feedback and clean pause/mute hygiene.
 */

export class SerpentSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private boostOsc: OscillatorNode | null = null;
  private boostGain: GainNode | null = null;
  private muted = false;
  private paused = false;
  private unlocked = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(mute: boolean): void {
    this.muted = mute;
    this.syncMasterGain();
  }

  public toggleMute(): boolean {
    this.unlocked = true;
    this.muted = !this.muted;
    this.syncMasterGain();
    return this.muted;
  }

  public setPaused(paused: boolean): void {
    this.paused = paused;
    this.syncMasterGain();
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined' || !this.unlocked) return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted || this.paused ? 0 : 0.28;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended' && !this.paused && !this.muted) {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private syncMasterGain(): void {
    if (!this.ctx || !this.masterGain) return;
    const target = this.muted || this.paused ? 0 : 0.28;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.02);
    if (this.paused && this.boostGain) {
      this.boostGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.02);
    }
  }

  public unlock(): void {
    this.unlocked = true;
    this.ensureContext();
  }

  /** Light event: pitch-varied harmonic orb pickup scaled to combo streak. */
  public playOrbPickup(comboCount: number, isLoot = false): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted || this.paused) return;

    const pentatonic = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
    const baseFreq = pentatonic[comboCount % pentatonic.length];
    const jitter = 1 + (Math.random() * 0.08 - 0.04);
    const freq = baseFreq * (isLoot ? 1.25 : 1.0) * jitter;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isLoot ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.35, now + 0.09);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isLoot ? 0.26 : 0.18, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  /** Medium-heavy event: special relic activation chord. */
  public playRelicActivation(relicKind: string): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted || this.paused) return;

    const now = ctx.currentTime;
    const intervals =
      relicKind === 'apex-crown'
        ? [261.63, 329.63, 392.0, 523.25, 659.25]
        : relicKind === 'phase-cloak'
          ? [293.66, 369.99, 440.0, 587.33]
          : [220.0, 277.18, 329.63, 440.0];

    intervals.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      const start = now + idx * 0.032;
      osc.frequency.setValueAtTime(f, start);
      osc.frequency.exponentialRampToValueAtTime(f * 1.04, start + 0.34);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.16, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  /** Heavy event: rival serpent takedown sub-bass drop + crystalline burst. */
  public playRivalElimination(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted || this.paused) return;

    const now = ctx.currentTime;
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(155, now);
    sub.frequency.exponentialRampToValueAtTime(42, now + 0.28);

    subGain.gain.setValueAtTime(0.34, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.31);

    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const bell = ctx.createOscillator();
      const g = ctx.createGain();
      bell.type = 'triangle';
      const t = now + 0.03 + i * 0.025;
      bell.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.14, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      bell.connect(g);
      g.connect(this.masterGain!);
      bell.start(t);
      bell.stop(t + 0.25);
    });
  }

  /** Heavy event: player hull damage impact. */
  public playHullImpact(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted || this.paused) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(130, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.22);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** Open-world monolith shrine harmonic attunement fanfare. */
  public playShrineAttuned(shrineIndex: number): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted || this.paused) return;

    const root = 196.0 * Math.pow(1.06, shrineIndex);
    const chord = [root, root * 1.25, root * 1.5, root * 2.0, root * 2.5];
    const now = ctx.currentTime;

    chord.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + idx * 0.045;
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.72);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.75);
    });
  }

  /** Audible telegraph cue when a nearby interceptor or pack-hunter winds up a cut-off charge. */
  public playRivalChargeTelegraph(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted || this.paused) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.18);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.21);
  }

  /** Continuous thruster hum modulated by overdrive state. */
  public updateBoostHum(isBoosting: boolean, isHyperCore: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (!this.boostOsc || !this.boostGain) {
      this.boostOsc = ctx.createOscillator();
      this.boostGain = ctx.createGain();
      this.boostOsc.type = 'triangle';
      this.boostOsc.frequency.value = 78;
      this.boostGain.gain.value = 0;
      this.boostOsc.connect(this.boostGain);
      this.boostGain.connect(this.masterGain);
      this.boostOsc.start();
    }

    const active = (isBoosting || isHyperCore) && !this.muted && !this.paused;
    const targetGain = active ? (isHyperCore ? 0.11 : 0.075) : 0;
    const targetFreq = isHyperCore ? 132 : 94;
    this.boostGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
    this.boostOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.06);
  }

  /** Outcome sting for Victory or Game Over. */
  public playRunOutcome(victory: boolean): void {
    this.updateBoostHum(false, false);
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;

    const notes = victory
      ? [261.63, 329.63, 392.0, 523.25, 659.25]
      : [311.13, 277.18, 233.08, 174.61];
    const now = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = victory ? 'triangle' : 'sawtooth';
      const t = now + i * 0.085;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t);
      osc.stop(t + 0.47);
    });
  }

  public dispose(): void {
    if (this.boostOsc) {
      try {
        this.boostOsc.stop();
      } catch {
        // ignore
      }
      this.boostOsc = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
