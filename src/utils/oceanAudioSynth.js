// Web Audio API Ambient Synthesizer: Rolling Ocean Waves, Ship Creaking, & Ship Bell Chimes
class OceanAmbientSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isPlaying = false;
    this.waveFilter = null;
    this.waveLfo = null;
    this.shipCreakTimer = null;
    this.bellTimer = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // --- Ocean Waves Noise Generator ---
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.03 * white) / 1.02; // Rich pink noise formula
      lastOut = output[i];
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Lowpass filter modulating wave swell
    this.waveFilter = this.ctx.createBiquadFilter();
    this.waveFilter.type = "lowpass";
    this.waveFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    this.waveFilter.Q.setValueAtTime(1.4, this.ctx.currentTime);

    // LFO for periodic wave motion (~8 second cycle)
    this.waveLfo = this.ctx.createOscillator();
    this.waveLfo.type = "sine";
    this.waveLfo.frequency.setValueAtTime(0.12, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(260, this.ctx.currentTime);

    this.waveLfo.connect(lfoGain);
    lfoGain.connect(this.waveFilter.frequency);

    const oceanGain = this.ctx.createGain();
    oceanGain.gain.setValueAtTime(1.6, this.ctx.currentTime); // Rich ocean wave amplitude

    noiseSource.connect(this.waveFilter);
    this.waveFilter.connect(oceanGain);
    oceanGain.connect(this.masterGain);

    noiseSource.start();
    this.waveLfo.start();
  }

  play() {
    this.init();
    if (!this.ctx) return;
    this.isPlaying = true;

    if (this.ctx.state === "suspended") {
      this.ctx.resume().then(() => {
        this.applyPlayGain();
      }).catch(() => {});
    } else {
      this.applyPlayGain();
    }
  }

  applyPlayGain() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.56, now + 1.5); // Loud ambient master gain

    this.scheduleShipCreak();
    this.scheduleShipBell();
  }

  stop() {
    if (!this.ctx || !this.isPlaying) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
    this.isPlaying = false;

    if (this.shipCreakTimer) clearTimeout(this.shipCreakTimer);
    if (this.bellTimer) clearTimeout(this.bellTimer);
  }

  scheduleShipCreak() {
    if (!this.isPlaying) return;
    const delay = 7000 + Math.random() * 12000;
    this.shipCreakTimer = setTimeout(() => {
      if (this.isPlaying) {
        this.triggerShipCreakSound();
        this.scheduleShipCreak();
      }
    }, delay);
  }

  scheduleShipBell() {
    if (!this.isPlaying) return;
    const delay = 15000 + Math.random() * 22000;
    this.bellTimer = setTimeout(() => {
      if (this.isPlaying) {
        this.triggerDistantBell();
        this.scheduleShipBell();
      }
    }, delay);
  }

  triggerShipCreakSound() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(95 + Math.random() * 35, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 1.2);

      filter.type = "bandpass";
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.080, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.4);
    } catch (_) {}
  }

  triggerDistantBell() {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);

      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.3);
    } catch (_) {}
  }

  unlockAudioContext() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume().then(() => {
          if (this.isPlaying) {
            this.applyPlayGain();
          }
        }).catch(() => {});
      }
    }
  }
}

export const oceanAmbientSynth = new OceanAmbientSynthesizer();
