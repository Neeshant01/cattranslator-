class CatSoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // A standard meow sound: rising and then falling pitch
  playMeow() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle"; 
    
    // Pitch envelope: starts around 300Hz, rises to 450Hz, falls to 280Hz
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.6);

    // Formant/bandpass filter to give a nasal/vowel quality ("m-e-o-w")
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.6);
    filter.Q.value = 1.5;

    // Gain envelope: fades in, stays, fades out slowly
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.08);
    gain.gain.setValueAtTime(0.3, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Friendly chirp/trill: rapid rising sweep with vibrato
  playChirp() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.18);

    // Vibrato LFO for trill effect
    lfo.frequency.value = 30; // 30Hz vibrato
    lfoGain.gain.value = 35; // 35Hz frequency sweep range
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    
    lfo.stop(now + 0.18);
    osc.stop(now + 0.18);
  }

  // Purr: Low frequency (25Hz) modulated pulses
  playPurr() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    
    const duration = 1.0;
    const pulseRate = 22; // 22 pulses per second
    const pulseCount = duration * pulseRate;
    
    for (let i = 0; i < pulseCount; i++) {
      const pulseTime = now + (i / pulseRate);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.value = 26; // low sub-bass rumble
      
      gain.gain.setValueAtTime(0, pulseTime);
      gain.gain.linearRampToValueAtTime(0.35, pulseTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, pulseTime + 0.038);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(pulseTime);
      osc.stop(pulseTime + 0.04);
    }
  }

  // Warning growl: low pitch triangle with white noise
  playGrowl() {
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(85, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.9);

    filter.type = "lowpass";
    filter.frequency.value = 160;

    // Create noise buffer for growly texture
    const bufferSize = ctx.sampleRate * 0.9;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.06;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(filter);
    noise.connect(noiseGain);
    noiseGain.connect(filter);
    
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    noise.start(now);
    
    osc.stop(now + 0.9);
    noise.stop(now + 0.9);
  }

  playForEmotion(emotion: string) {
    switch (emotion) {
      case "happy":
      case "greeting":
        this.playChirp();
        break;
      case "playful":
        this.playChirp();
        setTimeout(() => this.playChirp(), 220);
        break;
      case "hungry":
      case "demand":
        this.playMeow();
        break;
      case "angry":
      case "scared":
      case "territorial":
        this.playGrowl();
        break;
      default:
        this.playMeow();
        break;
    }
  }
}

export const synthesizer = new CatSoundSynthesizer();
