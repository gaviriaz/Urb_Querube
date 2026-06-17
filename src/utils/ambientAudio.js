// Procedural Soundscape Generator using HTML5 Web Audio API
// Synthesizes wind, crickets, birds, and rain without external audio assets

class AmbientAudioController {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.windGain = null;
    this.cricketsGain = null;
    this.birdsGain = null;
    this.rainGain = null;
    
    this.isMuted = false;
    this.volume = 0.5; // default volume
    this.timeOfDay = 'midday';
    this.weather = 'clear';
    this.initialized = false;
    
    // Node references for cleanup
    this.noiseBuffer = null;
    this.windSource = null;
    this.rainSource = null;
    this.windFilter = null;
    this.windLFO = null;
    this.windLFOGain = null;
    
    // Interval timers for random events
    this.cricketInterval = null;
    this.birdInterval = null;
  }

  init() {
    if (this.initialized) return;
    
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    this.ctx = new AudioContextClass();
    
    // Create Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
    
    // Create Noise Buffer (2 seconds)
    const bufferSize = this.ctx.sampleRate * 2;
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    // Setup Sub-Gain Nodes
    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.windGain.connect(this.masterGain);
    
    this.cricketsGain = this.ctx.createGain();
    this.cricketsGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.cricketsGain.connect(this.masterGain);
    
    this.birdsGain = this.ctx.createGain();
    this.birdsGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.birdsGain.connect(this.masterGain);
    
    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
    this.rainGain.connect(this.masterGain);
    
    // Initialize loops
    this.startWind();
    this.startRain();
    this.startCricketsLoop();
    this.startBirdsLoop();
    
    this.initialized = true;
    
    // Apply initial state transitions
    this.updateGains();
  }

  startWind() {
    if (!this.ctx || !this.noiseBuffer) return;
    
    // Create looped source
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = this.noiseBuffer;
    this.windSource.loop = true;
    
    // Create filter for rustling wind sound
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);
    this.windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    
    // Modulate filter frequency with an LFO for wind gust effect
    this.windLFO = this.ctx.createOscillator();
    this.windLFO.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow sweep (12 seconds)
    
    this.windLFOGain = this.ctx.createGain();
    this.windLFOGain.gain.setValueAtTime(250, this.ctx.currentTime); // sweep +/- 250 Hz
    
    this.windLFO.connect(this.windLFOGain);
    this.windLFOGain.connect(this.windFilter.frequency);
    
    // Connect nodes
    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    
    // Start nodes
    this.windSource.start(0);
    this.windLFO.start(0);
  }

  startRain() {
    if (!this.ctx || !this.noiseBuffer) return;
    
    this.rainSource = this.ctx.createBufferSource();
    this.rainSource.buffer = this.noiseBuffer;
    this.rainSource.loop = true;
    
    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    
    this.rainSource.connect(rainFilter);
    rainFilter.connect(this.rainGain);
    
    this.rainSource.start(0);
  }

  startCricketsLoop() {
    // Periodically trigger synthetically generated cricket chirps
    this.cricketInterval = setInterval(() => {
      if (!this.initialized || this.isMuted || this.timeOfDay === 'midday') return;
      if (this.ctx.state === 'suspended') return;
      
      // Calculate probability based on sunset/night
      const isNight = this.timeOfDay === 'night';
      const prob = isNight ? 0.95 : 0.4; // sunset/sunrise has fewer crickets
      if (Math.random() > prob) return;
      
      this.playCricketChirp();
    }, 180 + Math.random() * 200);
  }

  playCricketChirp() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Cricket sound: 3 quick pulses of high frequency square wave
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(4500 + Math.random() * 500, now);
    
    // Apply bandpass filter to make it metallic and natural
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(4800, now);
    filter.Q.setValueAtTime(3.0, now);
    
    gain.gain.setValueAtTime(0, now);
    
    // Chirp structure: 3 pulses of 18ms on, 15ms off
    const pulseCount = 3;
    const pulseDuration = 0.018;
    const gapDuration = 0.015;
    
    for (let i = 0; i < pulseCount; i++) {
      const start = now + i * (pulseDuration + gapDuration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.003); // quick attack
      gain.gain.exponentialRampToValueAtTime(0.001, start + pulseDuration); // decay
    }
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.cricketsGain);
    
    osc.start(now);
    osc.stop(now + 0.12);
  }

  startBirdsLoop() {
    this.birdInterval = setInterval(() => {
      if (!this.initialized || this.isMuted || this.timeOfDay === 'night' || this.weather === 'rain') return;
      if (this.ctx.state === 'suspended') return;
      
      // Birds are highly active at sunrise, moderately at midday, and slightly at sunset
      const rates = { sunrise: 0.7, midday: 0.35, sunset: 0.2 };
      const prob = rates[this.timeOfDay] || 0.3;
      if (Math.random() > prob) return;
      
      this.playBirdCall();
    }, 3500 + Math.random() * 4000);
  }

  playBirdCall() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const type = Math.floor(Math.random() * 3); // 3 styles of bird calls
    
    if (type === 0) {
      // Style 0: "Chirp-chirp!" (Double frequency sweep)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      
      gain.gain.setValueAtTime(0, now);
      // First chirp
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(3800, now + 0.08);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      // Second chirp
      const start2 = now + 0.12;
      osc.frequency.setValueAtTime(2400, start2);
      osc.frequency.exponentialRampToValueAtTime(4000, start2 + 0.08);
      gain.gain.linearRampToValueAtTime(0.05, start2 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start2 + 0.08);
      
      osc.connect(gain);
      gain.connect(this.birdsGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } 
    else if (type === 1) {
      // Style 1: "Piuu-piuu-piuu" (Descending pitch sweep)
      const notes = 3;
      const duration = 0.07;
      const gap = 0.08;
      
      for (let i = 0; i < notes; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        
        const start = now + i * (duration + gap);
        osc.frequency.setValueAtTime(3200 - i * 150, start);
        osc.frequency.exponentialRampToValueAtTime(1800 - i * 100, start + duration);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.04, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(this.birdsGain);
        osc.start(start);
        osc.stop(start + duration + 0.01);
      }
    } 
    else {
      // Style 2: High pitched sweet whistle
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      
      osc.frequency.setValueAtTime(3800, now);
      osc.frequency.setValueAtTime(3800, now + 0.03);
      osc.frequency.linearRampToValueAtTime(4500, now + 0.06);
      osc.frequency.linearRampToValueAtTime(4200, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(3000, now + 0.18);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.03);
      gain.gain.setValueAtTime(0.04, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      
      osc.connect(gain);
      gain.connect(this.birdsGain);
      osc.start(now);
      osc.stop(now + 0.2);
    }
  }

  updateGains() {
    if (!this.initialized || !this.ctx) return;
    
    const now = this.ctx.currentTime;
    
    // 1. Wind gains based on weather and time of day
    // Wind is stronger in the evening and during rain
    let targetWind = 0.25;
    if (this.weather === 'rain') targetWind = 0.45;
    else if (this.timeOfDay === 'sunset') targetWind = 0.35;
    else if (this.timeOfDay === 'night') targetWind = 0.15;
    
    this.windGain.gain.setTargetAtTime(targetWind, now, 1.5);
    
    // 2. Cricket gains: Night-only, fading out in sunrise/sunset
    let targetCrickets = 0.0;
    if (this.timeOfDay === 'night') targetCrickets = 0.75;
    else if (this.timeOfDay === 'sunset') targetCrickets = 0.35;
    else if (this.timeOfDay === 'sunrise') targetCrickets = 0.15;
    
    // Rain dampens cricket sound
    if (this.weather === 'rain') targetCrickets *= 0.4;
    
    this.cricketsGain.gain.setTargetAtTime(targetCrickets, now, 2.0);
    
    // 3. Bird gains: Active in daylight, inactive at night
    let targetBirds = 0.0;
    if (this.timeOfDay === 'sunrise') targetBirds = 0.95;
    else if (this.timeOfDay === 'midday') targetBirds = 0.65;
    else if (this.timeOfDay === 'sunset') targetBirds = 0.35;
    
    // Rain silences birds
    if (this.weather === 'rain') targetBirds = 0.0;
    
    this.birdsGain.gain.setTargetAtTime(targetBirds, now, 1.0);
    
    // 4. Rain gains
    const targetRain = this.weather === 'rain' ? 0.75 : 0.0;
    this.rainGain.gain.setTargetAtTime(targetRain, now, 1.0);
  }

  setTimeOfDay(timeOfDay) {
    this.timeOfDay = timeOfDay;
    this.updateGains();
  }

  setWeather(weather) {
    this.weather = weather;
    this.updateGains();
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.masterGain && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.1);
    }
  }

  setMute(isMuted) {
    this.isMuted = isMuted;
    if (this.masterGain) {
      const targetVal = isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(targetVal, this.ctx.currentTime, 0.1);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  destroy() {
    clearInterval(this.cricketInterval);
    clearInterval(this.birdInterval);
    if (this.windLFO) { this.windLFO.stop(); }
    if (this.windSource) { this.windSource.stop(); }
    if (this.rainSource) { this.rainSource.stop(); }
    if (this.ctx) {
      this.ctx.close();
    }
    this.initialized = false;
  }
}

export const ambientAudio = new AmbientAudioController();
