// All sound is synthesized with WebAudio: no audio files, no network.
// Each effect is a few oscillators and a gain envelope.
export function createAudio() {
  let ctx = null;
  let muted = false;
  let alarmOsc = null;
  let alarmGain = null;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', vol = 0.12, when = 0, slideTo = null) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, vol = 0.1, when = 0, lowpass = 1200) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const len = Math.max(1, Math.floor(c.sampleRate * dur));
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(c.destination);
    src.start(t0);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      if (muted) this.stopAlarm();
      return muted;
    },
    get muted() {
      return muted;
    },
    step() {
      noise(0.05, 0.03, 0, 500);
    },
    pickup() {
      tone(880, 0.12, 'sine', 0.14);
      tone(1318, 0.18, 'sine', 0.12, 0.07);
    },
    coin() {
      tone(2400, 0.08, 'triangle', 0.1);
      tone(1800, 0.1, 'triangle', 0.08, 0.09);
    },
    smoke() {
      noise(0.5, 0.14, 0, 900);
    },
    emp() {
      tone(1200, 0.35, 'sawtooth', 0.07, 0, 180);
      noise(0.25, 0.08, 0, 3000);
    },
    spotted() {
      tone(520, 0.16, 'square', 0.08);
      tone(660, 0.16, 'square', 0.08, 0.14);
    },
    caught() {
      tone(220, 0.5, 'sawtooth', 0.14, 0, 110);
      tone(110, 0.7, 'sawtooth', 0.12, 0.15, 55);
    },
    win() {
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.28, 'triangle', 0.12, i * 0.11));
    },
    levelClear() {
      [784, 988, 1175].forEach((f, i) => tone(f, 0.2, 'triangle', 0.11, i * 0.09));
    },
    door() {
      tone(180, 0.25, 'sine', 0.1, 0, 320);
    },
    startAlarm() {
      const c = ensure();
      if (!c || muted || alarmOsc) return;
      alarmOsc = c.createOscillator();
      alarmGain = c.createGain();
      alarmOsc.type = 'square';
      alarmOsc.frequency.value = 740;
      alarmGain.gain.value = 0.0;
      const lfo = c.createOscillator();
      lfo.frequency.value = 2.2;
      const lfoGain = c.createGain();
      lfoGain.gain.value = 0.035;
      lfo.connect(lfoGain).connect(alarmGain.gain);
      alarmOsc.connect(alarmGain).connect(c.destination);
      alarmOsc.start();
      lfo.start();
      alarmGain.gain.linearRampToValueAtTime(0.05, c.currentTime + 0.4);
    },
    stopAlarm() {
      if (alarmOsc) {
        try {
          alarmOsc.stop();
        } catch {
          /* already stopped */
        }
        alarmOsc = null;
        alarmGain = null;
      }
    },
  };
}
