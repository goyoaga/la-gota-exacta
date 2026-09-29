// A short, synthesized water loop keeps the game free of external audio files.
// The AudioContext is created only after a user gesture, as mobile browsers require.
export function createPourAudio() {
  let context;
  let buffer;
  let source;
  let output;

  function makeBuffer() {
    const seconds = 2;
    const length = Math.round(context.sampleRate * seconds);
    const water = context.createBuffer(1, length, context.sampleRate);
    const samples = water.getChannelData(0);
    let ripple = 0;
    for (let i = 0; i < length; i += 1) {
      ripple = ripple * 0.78 + (Math.random() * 2 - 1) * 0.22;
      samples[i] = ripple * 0.7 + (Math.random() * 2 - 1) * 0.13;
    }
    // Irregular, quiet drops give the continuous stream a liquid character.
    for (let i = 0; i < 30; i += 1) {
      const start = Math.floor(Math.random() * (length - context.sampleRate * 0.045));
      const frequency = 480 + Math.random() * 420;
      const duration = Math.floor(context.sampleRate * 0.04);
      for (let j = 0; j < duration; j += 1) {
        const t = j / context.sampleRate;
        samples[start + j] += Math.sin(2 * Math.PI * frequency * t) * Math.exp(-95 * t) * 0.13;
      }
    }
    return water;
  }

  function stop() {
    if (!source || !context) return;
    const now = context.currentTime;
    output.gain.cancelScheduledValues(now);
    output.gain.setValueAtTime(output.gain.value, now);
    output.gain.linearRampToValueAtTime(0, now + 0.09);
    source.stop(now + 0.1);
    source = null;
    output = null;
  }

  function start() {
    if (source) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      context ??= new AudioContextClass();
      buffer ??= makeBuffer();
      // Resume is called inside pointerdown / keydown; a rejected promise means silence.
      context.resume().catch(() => {});
      source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1350;
      output = context.createGain();
      output.gain.setValueAtTime(0, context.currentTime);
      output.gain.linearRampToValueAtTime(0.19, context.currentTime + 0.08);
      source.connect(filter).connect(output).connect(context.destination);
      source.start();
    } catch (error) {
      console.warn('El audio no está disponible en este navegador', error);
      source = null;
      output = null;
    }
  }

  return { start, stop };
}
