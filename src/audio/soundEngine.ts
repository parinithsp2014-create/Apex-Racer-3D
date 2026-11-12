/**
 * Procedural Web Audio API sound synthesizer for Apex Racer 3D.
 * 100% code-synthesized: zero external MP3/WAV files, zero network latency.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Engine sound nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineSubOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private engineRunning: boolean = false;

  // Nitro loop nodes
  private nitroNoise: AudioBufferSourceNode | null = null;
  private nitroFilter: BiquadFilterNode | null = null;
  private nitroGain: GainNode | null = null;

  // Skid noise nodes
  private skidFilter: BiquadFilterNode | null = null;
  private skidGain: GainNode | null = null;

  // Music sequencer
  private isMusicPlaying: boolean = false;
  private musicInterval: number | null = null;
  private musicStep: number = 0;

  // Settings
  public isMuted: boolean = false;
  public isMusicEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on user gesture
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.setupEngineSynth();
      this.setupNitroSynth();
      this.setupSkidSynth();
    } catch {
      // Audio context might be restricted or unsupported
    }
  }

  public ensureContext() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMusic(enabled?: boolean) {
    this.isMusicEnabled = enabled !== undefined ? enabled : !this.isMusicEnabled;
    if (!this.isMusicEnabled && this.isMusicPlaying) {
      this.stopMusic();
    } else if (this.isMusicEnabled && !this.isMusicPlaying && this.engineRunning) {
      this.startMusic();
    }
  }

  // --- PROCEDURAL ENGINE SOUND ---
  private setupEngineSynth() {
    if (!this.ctx || !this.sfxGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    this.engineFilter.Q.setValueAtTime(3.5, this.ctx.currentTime);

    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'triangle';
    this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

    this.engineSubOsc = this.ctx.createOscillator();
    this.engineSubOsc.type = 'sine';
    this.engineSubOsc.frequency.setValueAtTime(22.5, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineSubOsc.connect(this.engineFilter);

    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.sfxGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineSubOsc.start();
  }

  public startEngine() {
    this.ensureContext();
    if (!this.engineGain || !this.ctx) return;
    this.engineGain.gain.setTargetAtTime(0.35, this.ctx.currentTime, 0.1);
    this.engineRunning = true;
    if (this.isMusicEnabled && !this.isMusicPlaying) {
      this.startMusic();
    }
  }

  public stopEngine() {
    if (!this.engineGain || !this.ctx) return;
    this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    this.engineRunning = false;
    this.stopNitro();
    this.stopSkid();
    this.stopMusic();
  }

  public updateEngine(speedKmH: number, isAccelerating: boolean, isBoosting: boolean) {
    if (!this.ctx || !this.engineRunning) return;

    // Normalize speed ratio 0.0 - 1.0 (assuming max 250 km/h)
    const ratio = Math.max(0, Math.min(speedKmH / 240, 1.2));
    const baseFreq = 40 + ratio * 140 + (isAccelerating ? 25 : 0) + (isBoosting ? 50 : 0);
    const filterFreq = 280 + ratio * 1400 + (isAccelerating ? 400 : 0) + (isBoosting ? 800 : 0);
    const targetGain = 0.25 + ratio * 0.2 + (isAccelerating ? 0.1 : 0);

    const now = this.ctx.currentTime;
    if (this.engineOsc1) this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.06);
    if (this.engineOsc2) this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.06);
    if (this.engineSubOsc) this.engineSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.06);
    if (this.engineFilter) this.engineFilter.frequency.setTargetAtTime(filterFreq, now, 0.06);
    if (this.engineGain) this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
  }

  // --- NITRO BOOST SYNTH ---
  private setupNitroSynth() {
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.nitroNoise = this.ctx.createBufferSource();
    this.nitroNoise.buffer = noiseBuffer;
    this.nitroNoise.loop = true;

    this.nitroFilter = this.ctx.createBiquadFilter();
    this.nitroFilter.type = 'bandpass';
    this.nitroFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.nitroFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.nitroGain = this.ctx.createGain();
    this.nitroGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.nitroNoise.connect(this.nitroFilter);
    this.nitroFilter.connect(this.nitroGain);
    this.nitroGain.connect(this.sfxGain);

    this.nitroNoise.start();
  }

  public startNitro() {
    if (!this.ctx || !this.nitroGain) return;
    this.ensureContext();
    this.nitroGain.gain.setTargetAtTime(0.5, this.ctx.currentTime, 0.05);
    if (this.nitroFilter) {
      this.nitroFilter.frequency.setTargetAtTime(2600, this.ctx.currentTime, 0.1);
    }
  }

  public stopNitro() {
    if (!this.ctx || !this.nitroGain) return;
    this.nitroGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
    if (this.nitroFilter) {
      this.nitroFilter.frequency.setTargetAtTime(1200, this.ctx.currentTime, 0.1);
    }
  }

  // --- TIRE SKID SYNTH ---
  private setupSkidSynth() {
    if (!this.ctx || !this.sfxGain) return;

    const bufferSize = this.ctx.sampleRate;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }

    const skidNoise = this.ctx.createBufferSource();
    skidNoise.buffer = noiseBuffer;
    skidNoise.loop = true;

    this.skidFilter = this.ctx.createBiquadFilter();
    this.skidFilter.type = 'highpass';
    this.skidFilter.frequency.setValueAtTime(1800, this.ctx.currentTime);
    this.skidFilter.Q.setValueAtTime(6.0, this.ctx.currentTime);

    this.skidGain = this.ctx.createGain();
    this.skidGain.gain.setValueAtTime(0, this.ctx.currentTime);

    skidNoise.connect(this.skidFilter);
    this.skidFilter.connect(this.skidGain);
    this.skidGain.connect(this.sfxGain);

    skidNoise.start();
  }

  public setSkid(intensity: number) {
    if (!this.ctx || !this.skidGain) return;
    const clamped = Math.max(0, Math.min(intensity, 1));
    this.skidGain.gain.setTargetAtTime(clamped * 0.45, this.ctx.currentTime, 0.05);
  }

  public stopSkid() {
    this.setSkid(0);
  }

  // --- ONE-SHOT SFX ---
  public playHorn() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, t);
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(554.37, t); // Major third harmony

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
    gain.gain.setValueAtTime(0.4, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.55);
    osc2.stop(t + 0.55);
  }

  public playNearMiss() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.exponentialRampToValueAtTime(1174.66, t + 0.18); // D6

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playCoin() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playPowerup() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = t + idx * 0.07;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  }

  public playCrash() {
    this.ensureContext();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    // Sub rumble
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'sawtooth';
    subOsc.frequency.setValueAtTime(130, t);
    subOsc.frequency.exponentialRampToValueAtTime(25, t + 0.6);

    subGain.gain.setValueAtTime(0.6, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(t);
    subOsc.stop(t + 0.7);

    // Metal explosion burst
    const bufferSize = this.ctx.sampleRate * 0.8;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, t);
    noiseFilter.frequency.exponentialRampToValueAtTime(120, t + 0.8);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(t);
  }

  // --- SYNTHWAVE RETRO ARCADE SOUNDTRACK ---
  public startMusic() {
    if (this.isMusicPlaying || !this.isMusicEnabled) return;
    this.ensureContext();
    this.isMusicPlaying = true;
    this.musicStep = 0;

    const bpm = 126;
    const stepDuration = 60 / bpm / 4; // 16th notes

    // Bassline in D minor: D D F G D D C A
    const bassline = [
      73.42, 73.42, 73.42, 73.42,
      87.31, 87.31, 98.00, 98.00,
      73.42, 73.42, 73.42, 73.42,
      65.41, 65.41, 55.00, 55.00,
    ];

    // Arp lead: D4, F4, A4, C5, D5, A4, F4, E4
    const arp = [
      293.66, 349.23, 440.0, 523.25,
      587.33, 440.0, 349.23, 329.63,
    ];

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep % 16;

      // Bass trigger on every 16th
      const bassFreq = bassline[step];
      const bassOsc = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassNoteGain = this.ctx.createGain();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(350, now);
      bassFilter.frequency.exponentialRampToValueAtTime(100, now + stepDuration * 0.9);

      bassNoteGain.gain.setValueAtTime(0.32, now);
      bassNoteGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.85);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassNoteGain);
      bassNoteGain.connect(this.musicGain);

      bassOsc.start(now);
      bassOsc.stop(now + stepDuration);

      // Kick drum on 0, 4, 8, 12
      if (step % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

        kickGain.gain.setValueAtTime(0.65, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGain);

        kickOsc.start(now);
        kickOsc.stop(now + 0.16);
      }

      // Snare on 4 and 12
      if (step === 4 || step === 12) {
        const snareNoise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.15, this.ctx.sampleRate);
        const sData = snareNoise.getChannelData(0);
        for (let i = 0; i < sData.length; i++) {
          sData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.04));
        }
        const sSource = this.ctx.createBufferSource();
        sSource.buffer = snareNoise;
        const sGain = this.ctx.createGain();
        sGain.gain.setValueAtTime(0.35, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        sSource.connect(sGain);
        sGain.connect(this.musicGain);
        sSource.start(now);
      }

      // Synth Arpeggio lead every second step
      if (step % 2 === 0) {
        const arpIndex = (step / 2) % arp.length;
        const arpFreq = arp[arpIndex];
        const arpOsc = this.ctx.createOscillator();
        const arpNoteGain = this.ctx.createGain();

        arpOsc.type = 'triangle';
        arpOsc.frequency.setValueAtTime(arpFreq, now);

        arpNoteGain.gain.setValueAtTime(0.12, now);
        arpNoteGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.8);

        arpOsc.connect(arpNoteGain);
        arpNoteGain.connect(this.musicGain);

        arpOsc.start(now);
        arpOsc.stop(now + stepDuration * 2);
      }

      this.musicStep++;
    }, stepDuration * 1000);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const sound = new SoundEngine();
